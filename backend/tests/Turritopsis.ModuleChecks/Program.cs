using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;
using System.Collections.Concurrent;
using System.Net;
using System.Text;
using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Http;
using Turritopsis.Modules.Audit.Application;
using Turritopsis.Modules.Audit.Infrastructure;
using Turritopsis.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Turritopsis.Api.Controllers;
using System.Text.Json;
using Turritopsis.Modules.Reviews.Application;
using Turritopsis.Modules.Reviews.Domain;
using Turritopsis.Domain.Entities;
using Turritopsis.Domain.Enums;
using Turritopsis.Api.Modules;
using Turritopsis.Api.Startup;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Admin.Models;
using Turritopsis.Application.Auth.Models;
using Turritopsis.Application.Common;
using Turritopsis.Application.Companies.Models;
using Turritopsis.Application.Documents.Models;
using Turritopsis.Infrastructure.Persistence;
using Turritopsis.SharedKernel;

var repo = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../.."));
var configuration = new ConfigurationBuilder()
    .AddJsonFile(Path.Combine(repo, "backend/src/Turritopsis.Api/appsettings.Development.json"), optional: true)
    .Build();
var useDatabase = args.Contains("--database");
var databaseName = "turritopsis_hexcheck_" + Guid.NewGuid().ToString("N");
var connection = new NpgsqlConnectionStringBuilder(Environment.GetEnvironmentVariable("TURRITOPSIS_TEST_CONNECTION") ?? configuration.GetConnectionString("Default")
    ?? "Host=localhost;Database=turritopsis;Username=turritopsis;Password=turritopsis_dev");
var adminConnection = new NpgsqlConnectionStringBuilder(connection.ConnectionString) { Database = "postgres", Pooling = false };
connection.Database = databaseName;
var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Development" });
builder.Logging.ClearProviders();
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?> {
    ["ConnectionStrings:Default"] = connection.ConnectionString,
    ["Jwt:Key"] = "fictional-module-test-key-32-characters-long",
    ["Ai:AllowRemote"] = "false", ["Email:Enabled"] = "false", ["Firebase:Enabled"] = "false"
});
builder.Services.AddApiHosting(builder.Configuration);
builder.Services.AddApplicationModules(builder.Configuration);
var deliveryProbe = new DeliveryProbe();
builder.Services.AddSingleton<IDomainEventHandler>(deliveryProbe);
var pushProbe = new PushProbe { Enabled = useDatabase };
builder.Services.AddSingleton<IPushSender>(pushProbe);
await using var app = builder.Build();
var passed = 0;
void Check(bool condition, string message) { if (!condition) throw new InvalidOperationException(message); passed++; }
async Task<T> InScope<T>(Func<IServiceProvider, Task<T>> operation) {
    using var scope = app.Services.CreateScope(); return await operation(scope.ServiceProvider);
}

var expected = new Dictionary<string, string[]> {
    ["CompaniesDbContext"] = ["Companies", "CompanyUsers"],
    ["DiagnosticsDbContext"] = ["EsgSnapshots"],
    ["DocumentsDbContext"] = ["Documents", "FileBlobs", "EvidenceSnapshots", "EvidenceSnapshotItems"],
    ["ReviewsDbContext"] = ["Dossiers", "DossierNotes", "Certificates", "ReviewOutboxMessages", "DossierRevisions"],
    ["AuditDbContext"] = ["AuditLogs", "Notifications", "PushSubscriptions", "NotificationPushJobs"],
    ["IdentityModuleDbContext"] = ["AspNetUsers", "AspNetRoles", "AspNetUserClaims", "AspNetUserLogins", "AspNetUserTokens", "AspNetRoleClaims", "AspNetUserRoles"]
};
using (var scope = app.Services.CreateScope()) {
    Check(builder.Services.Count(d => expected.ContainsKey(d.ServiceType.Name)) == expected.Count, "A runtime module context is missing");
    Check(!scope.ServiceProvider.GetRequiredService<TurritopsisDbContext>().Database.HasPendingModelChanges(), "Migration model drifted from the existing schema");
    foreach (var descriptor in builder.Services.Where(d => expected.ContainsKey(d.ServiceType.Name))) {
        var context = (DbContext)scope.ServiceProvider.GetRequiredService(descriptor.ServiceType);
        var actual = context.Model.GetEntityTypes().Select(e => e.GetTableName()!).Distinct().Order().ToArray();
        Check(actual.SequenceEqual(expected[descriptor.ServiceType.Name].Order()), $"Foreign table mapped by {descriptor.ServiceType.Name}");
        foreach (var entity in context.Model.GetEntityTypes()) {
            foreach (var navigation in entity.GetNavigations())
                Check(navigation.TargetEntityType.ClrType.Assembly == entity.ClrType.Assembly, "Cross-module entity navigation");
        }
    }
    foreach (var port in new[] { typeof(IAuthService), typeof(ICompanyService), typeof(ISnapshotService), typeof(IDocumentService),
        typeof(IPushSubscriptions), typeof(IPushQueueProcessor), typeof(IPlatformUserAccessReader), typeof(IDossierQueries), typeof(IDossierCommands), typeof(IOutboxProcessor), typeof(IDomainEventDispatcher), typeof(INotificationReader), typeof(IDossierService), typeof(IAiReviewService), typeof(IAdminUsersService), typeof(IAdminOverviewService),
        typeof(ICompanyDirectory), typeof(ISnapshotReader), typeof(ICompanyEvidenceReader), typeof(IDossierCompanyReader), typeof(IAuditTrail) })
        Check(scope.ServiceProvider.GetRequiredService(port) is not null, $"Missing/cyclic module port: {port.Name}");
}

// Real Firebase Admin SDK serialization through a captured HTTP transport; no Google requests.
var fcmCapture = new FcmCapture();
var fcmApp = FirebaseApp.Create(new AppOptions { ProjectId = "push-fixture", Credential = GoogleCredential.FromAccessToken("fixture-access-token"), HttpClientFactory = new FcmCaptureFactory(fcmCapture) }, "push-transport-fixture");
try
{
    using var provider = new FirebasePushSender(new FirebaseOptions { Enabled = true, ProjectId = "push-fixture" }, FirebaseMessaging.GetMessaging(fcmApp));
    var notificationId = Guid.NewGuid();
    var subscriptionId = Guid.NewGuid();
    var sent = await provider.SendAsync("fixture-device-token", notificationId, subscriptionId, false, CancellationToken.None);
    Check(sent.Outcome == PushSendOutcome.Sent && fcmCapture.Requests.Count == 1, "Firebase Admin transport failed");
    using var payload = JsonDocument.Parse(fcmCapture.Requests.Single());
    var message = payload.RootElement.GetProperty("message");
    var data = message.GetProperty("data");
    Check(data.EnumerateObject().Select(p => p.Name).Order().SequenceEqual(new[] { "notificationId", "route", "subscriptionId" }), "Firebase received excessive application data");
    Check(data.GetProperty("route").GetString() == "/app" && !message.TryGetProperty("notification", out _), "Firebase generic data-only routing changed");
    fcmCapture.InvalidToken = true;
    var invalidToken = await provider.SendAsync("fixture-device-token", notificationId, subscriptionId, true, CancellationToken.None);
    Check(invalidToken.Outcome == PushSendOutcome.InvalidSubscription && invalidToken.ErrorCode == "Unregistered", "Firebase unregistered device was not classified safely");
}
finally { fcmApp.Delete(); }

// Pure state rules run without a database.
var actor = Guid.NewGuid();
var stateDossier = new Dossier { Id = Guid.NewGuid(), CompanyId = Guid.NewGuid() };
stateDossier.Submit(actor, "{}", 70, 70);
stateDossier.Review(actor, DossierStatus.InReview, null, null);
try { stateDossier.Submit(actor, "{}", 70, 70); Check(false, "In-review resubmission allowed"); }
catch (DossierTransitionException) { Check(true, "In-review resubmission blocked"); }
stateDossier.Review(actor, DossierStatus.Rejected, null, "Corrections");
stateDossier.Submit(actor, "{}", 65, 65);
Check(stateDossier.Recommendations is null && stateDossier.ReviewerId is null && stateDossier.ReviewedAt is null, "Resubmission retained old decision");
try { stateDossier.Review(actor, DossierStatus.Validated, 101, null); Check(false, "Invalid score accepted"); }
catch (DossierValidationException) { Check(stateDossier.Status == DossierStatus.Submitted, "Invalid score changed state"); }
stateDossier.Review(actor, DossierStatus.Validated, 65, "Final");
try { stateDossier.Review(actor, DossierStatus.Rejected, null, null); Check(false, "Validated decision changed"); }
catch (DossierTransitionException) { Check(true, "Validated decision locked"); }
try { stateDossier.RecordNote(actor); Check(false, "Validated note accepted"); }
catch (DossierTransitionException) { Check(true, "Validated notes locked"); }

if (useDatabase) {
    var created = false;
    await using var admin = new NpgsqlConnection(adminConnection.ConnectionString);
    await admin.OpenAsync();
    try {
        // The identifier is generated above from a fixed prefix and a GUID, never from supplied data.
        await using (var command = new NpgsqlCommand($"CREATE DATABASE \"{databaseName}\"", admin)) { await command.ExecuteNonQueryAsync(); created = true; }
        await InScope(async p=> {
            var migrationDb=p.GetRequiredService<TurritopsisDbContext>();
            var migrations=migrationDb.Database.GetMigrations().ToArray();
            await migrationDb.GetService<IMigrator>().MigrateAsync(migrations[^2]);
            await migrationDb.Database.ExecuteSqlRawAsync("INSERT INTO \"Companies\" (\"Id\",\"Name\",\"Sector\",\"CreatedAt\") VALUES ('11111111-1111-1111-1111-111111111111','Upgrade fixture','Industry',now())");
            await migrationDb.Database.ExecuteSqlRawAsync("INSERT INTO \"Dossiers\" (\"Id\",\"CompanyId\",\"Status\",\"SnapshotJson\",\"SubmittedAt\",\"UpdatedAt\",\"CreatedAt\",\"Version\") VALUES ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','Rejected','{{}}',now(),now(),now(),0)");
            await migrationDb.Database.MigrateAsync();
            var upgraded=await p.GetRequiredService<IDossierReadRepository>().GetAsync(Guid.Parse("22222222-2222-2222-2222-222222222222"),CancellationToken.None);
            Check(upgraded?.CurrentRevisionId is null && upgraded?.RevisionNumber==0,"Upgrade did not preserve legacy dossier");
            await migrationDb.Database.ExecuteSqlRawAsync("DELETE FROM \"Dossiers\" WHERE \"Id\"='22222222-2222-2222-2222-222222222222'");
            await migrationDb.Database.ExecuteSqlRawAsync("DELETE FROM \"Companies\" WHERE \"Id\"='11111111-1111-1111-1111-111111111111'");
            return true;
        });
        await app.InitializeDatabaseAsync();
        var ct = CancellationToken.None;
        var owner = await InScope(p => p.GetRequiredService<IAuthService>().RegisterAsync(new RegisterRequest("owner@module.example", "Module-Test-42!", "Module Company", "Industry", "Rabat"), ct));
        var other = await InScope(p => p.GetRequiredService<IAuthService>().RegisterAsync(new RegisterRequest("other@module.example", "Module-Test-42!", "Other Company", "Services", "Casa"), ct));
        Check(owner.Success && other.Success, "Registration failed across Identity/Companies");
        var userId = owner.UserId!.Value;
        var otherId = other.UserId!.Value;
        var profile = await InScope(p => p.GetRequiredService<ICompanyService>().UpdateProfileAsync(userId, new UpdateCompanyProfileRequest("Rabat", "TEST-ICE", "10-50", null, "test-phone", "test-activity"), ct));
        Check(profile.Company?.IsProfileComplete == true, "Company use case failed");
        var login = await InScope(p => p.GetRequiredService<IAuthService>().LoginAsync(new LoginRequest("owner@module.example", "Module-Test-42!"), ct));
        Check(login.Success && login.CompanyId == owner.CompanyId, "Identity membership integration failed");
        var reviewer = await InScope(p => p.GetRequiredService<IAdminUsersService>().CreateReviewerAsync(Guid.NewGuid(), new CreateReviewerRequest("reviewer@module.example", "Module-Test-42!"), ct));
        Check(reviewer.Success, "Administration/Identity integration failed");
        var ownerDevice = Guid.NewGuid();
        var ownerPush = await InScope(p => p.GetRequiredService<IPushSubscriptions>().RegisterAsync(userId, ownerDevice, "owner-fixture-token", ct));
        var otherPush = await InScope(p => p.GetRequiredService<IPushSubscriptions>().RegisterAsync(otherId, Guid.NewGuid(), "other-fixture-token", ct));
        var reviewerPush = await InScope(p => p.GetRequiredService<IPushSubscriptions>().RegisterAsync(reviewer.UserId!.Value, Guid.NewGuid(), "reviewer-fixture-token", ct));
        Check(ownerPush.Access == MembershipAccess.Granted && otherPush.Access == MembershipAccess.Granted && reviewerPush.Access == MembershipAccess.Granted, "Push device registration failed");
        var samePush = await InScope(p => p.GetRequiredService<IPushSubscriptions>().RegisterAsync(userId, ownerDevice, "owner-fixture-token", ct));
        Check(samePush.SubscriptionId == ownerPush.SubscriptionId, "Same browser duplicated its subscription");
        var stolenToken = await InScope(p => p.GetRequiredService<IPushSubscriptions>().RegisterAsync(otherId, Guid.NewGuid(), "owner-fixture-token", ct));
        Check(stolenToken.Access == MembershipAccess.Conflict, "Another user took an active browser token");
        Check(!await InScope(p => p.GetRequiredService<IPushSubscriptions>().RevokeAsync(otherId, ownerPush.SubscriptionId!.Value, ct)), "Foreign user revoked another device");
        Check(!await InScope(p => p.GetRequiredService<IPushSubscriptions>().IsActiveAsync(otherId, ownerPush.SubscriptionId!.Value, ct)), "Foreign subscription exposed as owned");
        const string snapshot = "{\"E1\":{\"score\":\"1\",\"note\":\"policy audit\"}}";
        var saved = await InScope(p => p.GetRequiredService<ISnapshotService>().UpsertForUserAsync(userId, snapshot, ct));
        Check(saved.Access == MembershipAccess.Granted, "Diagnostic save failed");
        var proof = await InScope(p => p.GetRequiredService<IDocumentService>().UploadAsync(userId, new UpsertDocumentRequest("E1", "Test proof", "audit policy", Convert.ToBase64String([1, 2, 3]), "test.txt"), ct));
        Check(proof.Document?.FileName == "test.txt", "Document/blob adapter failed");
        var detail = await InScope(p => p.GetRequiredService<IDocumentService>().GetDetailAsync(userId, false, proof.Document!.Id, ct));
        Check(detail.Document?.FileBase64 == Convert.ToBase64String([1, 2, 3]), "Blob retrieval failed");
        var denied = await InScope(p => p.GetRequiredService<IDocumentService>().GetDetailAsync(otherId, false, proof.Document!.Id, ct));
        Check(denied.Access == MembershipAccess.Forbidden, "Foreign company evidence exposed");
        var dossier = await InScope(p => p.GetRequiredService<IDossierService>().SubmitAsync(userId, 75, 75, ct));
        Check(dossier.Dossier is not null && System.Text.Json.Nodes.JsonNode.DeepEquals(
            System.Text.Json.Nodes.JsonNode.Parse(dossier.Dossier.SnapshotJson), System.Text.Json.Nodes.JsonNode.Parse(snapshot))
            && dossier.Dossier.CompanyName == "Module Company", "Submission ports failed");
        var dossierId = dossier.Dossier!.Id;
        var otherDossier = await InScope(p => p.GetRequiredService<IDossierService>().GetByIdAsync(otherId, false, dossierId, ct));
        Check(otherDossier.Access == MembershipAccess.Forbidden, "Foreign dossier exposed");
        var evidence = await InScope(p => p.GetRequiredService<IDocumentService>().ListForDossierAsync(Guid.NewGuid(), true, dossierId, ct));
        Check(evidence.Documents.Count == 1, "Review-to-document reader failed");
        var forbiddenNote = await InScope(p => p.GetRequiredService<IDossierService>().AddNoteAsync(userId, false, dossierId, "E1", "Unauthorized note", ct));
        Check(forbiddenNote == MembershipAccess.Forbidden, "Company user can post reviewer notes");
        var reviewNote = await InScope(p => p.GetRequiredService<IDossierService>().AddNoteAsync(Guid.NewGuid(), true, dossierId, "E1", "Verify original evidence", ct, dossier.Dossier!.CurrentRevisionId));
        var notes = await InScope(p => p.GetRequiredService<IDossierService>().GetNotesAsync(userId, false, dossierId, ct));
        Check(reviewNote == MembershipAccess.Granted && notes.Notes.Count == 1, "Review note workflow failed");
        var aiContext = await InScope(p => p.GetRequiredService<IDossierService>().GetAiContextAsync(Guid.NewGuid(), true, dossierId, ct));
        var ai = await InScope(p => p.GetRequiredService<IAiReviewService>().ReviewDossierAsync(aiContext.Answers, ct));
        Check(ai.Privacy.Mode == "local-only" && !ai.Privacy.RawDocumentTextSent, "AI privacy boundary changed");

        var decision = await InScope(p => p.GetRequiredService<IDossierService>().UpdateStatusAsync(reviewer.UserId!.Value, dossierId, "Validated", 70, "Human decision", ct, dossier.Dossier!.CurrentRevisionId));
        Check(decision.Dossier?.Status == "Validated", "Human review failed");
        Check(await InScope(p => p.GetRequiredService<IOutboxProcessor>().ProcessBatchAsync(50, ct)) == 3, "Initial outbox events were not delivered");
        var overview = await InScope(p => p.GetRequiredService<IAdminOverviewService>().GetOverviewAsync(ct));
        Check(overview.Companies.Count == 2 && overview.AuditLog.Count > 0, "Administration projection/audit failed");
        // A second submission after validation creates a new record, preserving the existing lifecycle.
        var second = await InScope(p => p.GetRequiredService<IDossierService>().SubmitAsync(userId, 80, 80, ct));
        Check(second.Dossier?.Id != dossierId, "Validated submission was overwritten");
        var overviewAgain = await InScope(p => p.GetRequiredService<IAdminOverviewService>().GetOverviewAsync(ct));
        Check(overviewAgain.Companies.Single(c => c.Id == owner.CompanyId).DossierStatus == "Submitted", "Latest dossier projection failed");
        var locked = await InScope(p => p.GetRequiredService<IDossierCommands>().UpdateStatusAsync(reviewer.UserId!.Value, dossierId, "Rejected", null, null, ct));
        Check(locked.Access == MembershipAccess.Conflict, "Validated dossier was changed");
        var lockedNote = await InScope(p => p.GetRequiredService<IDossierCommands>().AddNoteAsync(reviewer.UserId!.Value, true, dossierId, null, "Cannot edit", ct));
        Check(lockedNote == MembershipAccess.Conflict, "Validated dossier accepted a note");
        await InScope(async p =>
        {
            var reviewerUser = new FixtureCurrentUser(reviewer.UserId!.Value, ["reviewer"]);
            var controller = new DossiersController(p.GetRequiredService<IDossierQueries>(), p.GetRequiredService<IDossierCommands>(), p.GetRequiredService<IDocumentService>(), reviewerUser);
            Check(await controller.UpdateStatus(dossierId, new UpdateDossierRequest("Rejected", null, null), ct) is ConflictObjectResult, "HTTP did not expose locked state as 409");
            Check(await controller.UpdateStatus(second.Dossier!.Id, new UpdateDossierRequest("Validated", 101, null, second.Dossier!.CurrentRevisionId), ct) is BadRequestObjectResult, "HTTP did not expose invalid score as 400");
            var foreignUser = new FixtureCurrentUser(otherId, []);
            var forbidden = new DossiersController(p.GetRequiredService<IDossierQueries>(), p.GetRequiredService<IDossierCommands>(), p.GetRequiredService<IDocumentService>(), foreignUser);
            Check(await forbidden.UpdateStatus(second.Dossier!.Id, new UpdateDossierRequest("Validated", 75, null), ct) is ForbidResult, "Company member could review through HTTP controller");
            var inbox = new NotificationsController(p.GetRequiredService<INotificationReader>(), p.GetRequiredService<ICompanyDirectory>(), foreignUser);
            var response = await inbox.Get(ct) as OkObjectResult;
            Check(response?.Value is IReadOnlyList<NotificationEntry> entries && entries.Count == 0, "HTTP notification audience leaked another company");
            return true;
        });
        var invalid = await InScope(p => p.GetRequiredService<IDossierCommands>().UpdateStatusAsync(reviewer.UserId!.Value, second.Dossier!.Id, "99", 60, null, ct));
        Check(invalid.Access == MembershipAccess.Invalid, "Numeric status accepted");
        var activeId = second.Dossier!.Id;
        var inReview = await InScope(p => p.GetRequiredService<IDossierCommands>().UpdateStatusAsync(reviewer.UserId!.Value, activeId, "InReview", null, null, ct, second.Dossier!.CurrentRevisionId));
        Check(inReview.Dossier?.Status == "InReview", "Review did not start");
        var blockedSubmit = await InScope(p => p.GetRequiredService<IDossierCommands>().SubmitAsync(userId, 90, 90, ct));
        Check(blockedSubmit.Access == MembershipAccess.Conflict, "Owner overwrote ongoing review");
        await using var workflowConnection = new NpgsqlConnection(connection.ConnectionString);
        await workflowConnection.OpenAsync(ct);
        async Task<object?> Sql(string sql, Guid? id = null)
        {
            await using var cmd = new NpgsqlCommand(sql, workflowConnection);
            if (id.HasValue) cmd.Parameters.AddWithValue("id", id.Value);
            return await cmd.ExecuteScalarAsync(ct);
        }
        var eventJson = (string)(await Sql("SELECT \"PayloadJson\"::text FROM \"ReviewOutboxMessages\" WHERE \"DossierId\"=@id ORDER BY \"AggregateVersion\" LIMIT 1", activeId))!;
        var pendingEvent = JsonSerializer.Deserialize<DomainEvent>(eventJson)!;
        Check(!eventJson.Contains("test.txt") && !eventJson.Contains("policy audit") && !eventJson.Contains("Module Company"), "Sensitive evidence present in outbox");
        deliveryProbe.FailEventId = pendingEvent.Id;
        Check(await InScope(p => p.GetRequiredService<IOutboxProcessor>().ProcessBatchAsync(50, ct)) == 0, "Failed event acknowledged or later aggregate event overtook it");
        Check((long)(await Sql("SELECT count(*) FROM \"ReviewOutboxMessages\" WHERE \"DossierId\"=@id AND \"ProcessedAt\" IS NULL", activeId))! == 2, "Failure lost pending events");
        Check((int)(await Sql("SELECT \"Attempts\" FROM \"ReviewOutboxMessages\" WHERE \"Id\"=@id", pendingEvent.Id))! == 1, "Retry attempts not persisted");
        await Sql("UPDATE \"ReviewOutboxMessages\" SET \"NextAttemptAt\"=now()-interval '1 second' WHERE \"Id\"=@id", pendingEvent.Id);
        var parallelDelivery = await Task.WhenAll(InScope(p => p.GetRequiredService<IOutboxProcessor>().ProcessBatchAsync(50, ct)), InScope(p => p.GetRequiredService<IOutboxProcessor>().ProcessBatchAsync(50, ct)));
        Check(parallelDelivery.Sum() == 2, "Concurrent workers lost or duplicated acknowledgements");
        await InScope(async p => { await p.GetRequiredService<IDomainEventDispatcher>().DispatchAsync(pendingEvent, ct); await p.GetRequiredService<IDomainEventDispatcher>().DispatchAsync(pendingEvent, ct); return true; });
        Check((long)(await Sql("SELECT count(*) FROM \"AuditLogs\" WHERE \"Id\"=@id", pendingEvent.Id))! == 1, "Replay duplicated audit");
        Check((long)(await Sql("SELECT count(*) FROM \"Notifications\" WHERE \"Id\"=@id", pendingEvent.Id))! == 1, "Replay duplicated notification");
        var foreignNotifications = await InScope(p => p.GetRequiredService<INotificationReader>().ListAsync(other.CompanyId, false, ct));
        var ownNotifications = await InScope(p => p.GetRequiredService<INotificationReader>().ListAsync(owner.CompanyId, false, ct));
        var reviewNotifications = await InScope(p => p.GetRequiredService<INotificationReader>().ListAsync(null, true, ct));
        Check(foreignNotifications.Count == 0 && ownNotifications.Any(n => n.Type == "dossier.validated") && reviewNotifications.Count == 2, "Notification audience isolation failed");
        using (var firstScope = app.Services.CreateScope())
        using (var secondScope = app.Services.CreateScope())
        {
            var firstRepo = firstScope.ServiceProvider.GetRequiredService<IDossierRepository>();
            var secondRepo = secondScope.ServiceProvider.GetRequiredService<IDossierRepository>();
            var firstCopy = (await firstRepo.GetAsync(activeId, ct))!;
            var secondCopy = (await secondRepo.GetAsync(activeId, ct))!;
            firstCopy.Review(reviewer.UserId!.Value, DossierStatus.Rejected, null, "Correct evidence");
            secondCopy.Review(reviewer.UserId!.Value, DossierStatus.Validated, 85, "Concurrent decision");
            await firstRepo.SaveAsync(firstCopy, ct);
            try { await secondRepo.SaveAsync(secondCopy, ct); Check(false, "Stale review overwrote current decision"); }
            catch (DossierConcurrencyException) { Check(true, "Concurrent decision rejected"); }
        }
        Check((long)(await Sql("SELECT count(*) FROM \"ReviewOutboxMessages\" WHERE \"DossierId\"=@id", activeId))! == 3, "Losing transaction persisted an event");
        var reviewsContextType = builder.Services.Single(d => d.ServiceType.Name == "ReviewsDbContext").ServiceType;
        using (var rollbackScope = app.Services.CreateScope())
        {
            var context = (DbContext)rollbackScope.ServiceProvider.GetRequiredService(reviewsContextType);
            await using var transaction = await context.Database.BeginTransactionAsync(ct);
            var temporarySubmit = await rollbackScope.ServiceProvider.GetRequiredService<IDossierCommands>().SubmitAsync(userId, 60, 60, ct);
            Check(temporarySubmit.Access == MembershipAccess.Granted, "Rollback fixture failed");
            await transaction.RollbackAsync(ct);
        }
        var afterRollback = await InScope(p => p.GetRequiredService<IDossierQueries>().GetByIdAsync(userId, false, activeId, ct));
        Check(afterRollback.Dossier?.Status == "Rejected" && (long)(await Sql("SELECT count(*) FROM \"ReviewOutboxMessages\" WHERE \"DossierId\"=@id", activeId))! == 3, "Dossier and outbox did not rollback together");
        var resubmitted = await InScope(p => p.GetRequiredService<IDossierCommands>().SubmitAsync(userId, 65, 65, ct));
        Check(resubmitted.Dossier?.Id == activeId && resubmitted.Dossier?.Status == "Submitted" && resubmitted.Dossier?.Recommendations is null && resubmitted.Dossier?.FinalScore is null, "Rejected dossier did not reset on resubmission");
        await Sql("UPDATE \"ReviewOutboxMessages\" SET \"LeaseToken\"=gen_random_uuid(), \"LeaseUntil\"=now()+interval '1 minute' WHERE \"DossierId\"=@id AND \"ProcessedAt\" IS NULL", activeId);
        Check(await InScope(p => p.GetRequiredService<IOutboxProcessor>().ProcessBatchAsync(50, ct)) == 0, "Worker stole an active lease");
        // Simulate a worker crashing after claiming an event. A new scope recovers its expired lease.
        await Sql("UPDATE \"ReviewOutboxMessages\" SET \"LeaseToken\"=gen_random_uuid(), \"LeaseUntil\"=now()-interval '1 second' WHERE \"DossierId\"=@id AND \"ProcessedAt\" IS NULL", activeId);
        Check(await InScope(p => p.GetRequiredService<IOutboxProcessor>().ProcessBatchAsync(50, ct)) == 2, "Expired worker lease was not recovered");
        using (var queryScope = app.Services.CreateScope())
        {
            var context = (DbContext)queryScope.ServiceProvider.GetRequiredService(reviewsContextType);
            await queryScope.ServiceProvider.GetRequiredService<IDossierQueries>().GetQueueAsync(true, true, ct);
            Check(!context.ChangeTracker.Entries().Any(), "CQRS read tracked mutable entities");
        }
        // Force failure at the final queue insert: notification and audit must roll back with it.
        await Sql("CREATE FUNCTION fail_push_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'queue fixture interruption'; END $$");
        await Sql("CREATE TRIGGER fail_push_fixture BEFORE INSERT ON \"NotificationPushJobs\" FOR EACH ROW EXECUTE FUNCTION fail_push_fixture()");
        var atomicEvent = new DomainEvent(Guid.NewGuid(), "dossier.inreview", activeId, owner.CompanyId!.Value, reviewer.UserId!.Value, 999, DateTimeOffset.UtcNow);
        try { await InScope(async p => { await p.GetRequiredService<IDomainEventDispatcher>().DispatchAsync(atomicEvent, ct); return true; }); Check(false, "Broken queue committed its notification"); }
        catch (PostgresException) { Check(true, "Queue fixture failure reached dispatcher"); }
        Check((long)(await Sql("SELECT count(*) FROM \"Notifications\" WHERE \"Id\"=@id", atomicEvent.Id))! == 0
            && (long)(await Sql("SELECT count(*) FROM \"AuditLogs\" WHERE \"Id\"=@id", atomicEvent.Id))! == 0, "Notification/audit committed without queued delivery");
        await Sql("DROP TRIGGER fail_push_fixture ON \"NotificationPushJobs\"");
        await Sql("DROP FUNCTION fail_push_fixture()");
        await InScope(async p => { await p.GetRequiredService<IDomainEventDispatcher>().DispatchAsync(atomicEvent, ct); return true; });
        var parallelPush = await Task.WhenAll(InScope(p => p.GetRequiredService<IPushQueueProcessor>().ProcessBatchAsync(50, ct)), InScope(p => p.GetRequiredService<IPushQueueProcessor>().ProcessBatchAsync(50, ct)));
        Check(parallelPush.Sum() > 0 && pushProbe.Deliveries.All(d => d.Token is "owner-fixture-token" or "reviewer-fixture-token"), "Push queue audience/concurrent worker isolation failed");
        Check(pushProbe.Deliveries.Select(d => (d.NotificationId, d.SubscriptionId)).Distinct().Count() == pushProbe.Deliveries.Count, "Concurrent push workers duplicated a successful job");
        var beforeReplay = pushProbe.Deliveries.Count;
        await InScope(async p => { await p.GetRequiredService<IDomainEventDispatcher>().DispatchAsync(atomicEvent, ct); return true; });
        Check(await InScope(p => p.GetRequiredService<IPushQueueProcessor>().ProcessBatchAsync(50, ct)) == 0 && pushProbe.Deliveries.Count == beforeReplay, "Event replay duplicated push delivery");
        var ownSubId = ownerPush.SubscriptionId!.Value;
        await InScope(p => p.GetRequiredService<IPushSubscriptions>().QueueTestAsync(userId, ownSubId, ct));
        pushProbe.Enabled = false;
        Check(await InScope(p => p.GetRequiredService<IPushQueueProcessor>().ProcessBatchAsync(1, ct)) == 0, "Disabled Firebase consumed a pending job");
        var disabledRegistration = await InScope(p => p.GetRequiredService<IPushSubscriptions>().RegisterAsync(userId, Guid.NewGuid(), "disabled-device-token", ct));
        Check(disabledRegistration.Access == MembershipAccess.Conflict, "Disabled Firebase accepted a device");
        pushProbe.Enabled = true;
        pushProbe.NextResult = new(PushSendOutcome.Retry, "Unavailable");
        Check(await InScope(p => p.GetRequiredService<IPushQueueProcessor>().ProcessBatchAsync(1, ct)) == 0, "Temporary Firebase failure was acknowledged");
        var retryJobId = (Guid)(await Sql("SELECT \"Id\" FROM \"NotificationPushJobs\" WHERE \"Status\"='Pending' LIMIT 1"))!;
        Check((int)(await Sql("SELECT \"Attempts\" FROM \"NotificationPushJobs\" WHERE \"Id\"=@id", retryJobId))! == 1, "Push retry attempts not persisted");
        Check((bool)(await Sql("SELECT \"NextAttemptAt\">now() FROM \"NotificationPushJobs\" WHERE \"Id\"=@id", retryJobId))!, "Push retry lacked backoff");
        await Sql("UPDATE \"NotificationPushJobs\" SET \"NextAttemptAt\"=now()-interval '1 second', \"LeaseToken\"=gen_random_uuid(), \"LeaseUntil\"=now()+interval '1 minute' WHERE \"Id\"=@id", retryJobId);
        Check(await InScope(p => p.GetRequiredService<IPushQueueProcessor>().ProcessBatchAsync(1, ct)) == 0, "Push worker stole active lease");
        await Sql("UPDATE \"NotificationPushJobs\" SET \"LeaseUntil\"=now()-interval '1 second' WHERE \"Id\"=@id", retryJobId);
        Check(await InScope(p => p.GetRequiredService<IPushQueueProcessor>().ProcessBatchAsync(1, ct)) == 1, "Push worker did not recover expired lease");
        await InScope(p => p.GetRequiredService<IPushSubscriptions>().QueueTestAsync(userId, ownSubId, ct));
        var deadJobId = (Guid)(await Sql("SELECT \"Id\" FROM \"NotificationPushJobs\" WHERE \"Status\"='Pending' LIMIT 1"))!;
        await Sql("UPDATE \"NotificationPushJobs\" SET \"Attempts\"=7 WHERE \"Id\"=@id", deadJobId);
        pushProbe.NextResult = new(PushSendOutcome.Retry, "Unavailable");
        Check(await InScope(p => p.GetRequiredService<IPushQueueProcessor>().ProcessBatchAsync(1, ct)) == 1, "Failed push did not reach dead letter after 8 attempts");
        var health = await InScope(p => p.GetRequiredService<IPushQueueProcessor>().OverviewAsync(ct));
        Check(health.DeadLetter == 1 && health.FailedJobs.Single().Id == deadJobId, "Queue health omitted dead-letter job");
        Check(await InScope(p => p.GetRequiredService<IPushQueueProcessor>().RetryAsync(deadJobId, ct)), "Dead-letter retry could not be scheduled");
        Check(await InScope(p => p.GetRequiredService<IPushQueueProcessor>().ProcessBatchAsync(1, ct)) == 1, "Manually retried push failed");
        await InScope(p => p.GetRequiredService<IPushSubscriptions>().QueueTestAsync(userId, ownSubId, ct));
        var expiredJobId = (Guid)(await Sql("SELECT \"Id\" FROM \"NotificationPushJobs\" WHERE \"Status\"='Pending' LIMIT 1"))!;
        await Sql("UPDATE \"NotificationPushJobs\" SET \"ExpiresAt\"=now()-interval '1 second' WHERE \"Id\"=@id", expiredJobId);
        var beforeExpired = pushProbe.Deliveries.Count;
        Check(await InScope(p => p.GetRequiredService<IPushQueueProcessor>().ProcessBatchAsync(1, ct)) == 1 && pushProbe.Deliveries.Count == beforeExpired, "Expired push was sent");
        await InScope(p => p.GetRequiredService<IPushSubscriptions>().QueueTestAsync(reviewer.UserId!.Value, reviewerPush.SubscriptionId!.Value, ct));
        await InScope(p => p.GetRequiredService<IIdentityAccounts>().RemoveRoleAsync("reviewer@module.example", "reviewer", ct));
        var beforeRevokedRole = pushProbe.Deliveries.Count;
        Check(await InScope(p => p.GetRequiredService<IPushQueueProcessor>().ProcessBatchAsync(1, ct)) == 1 && pushProbe.Deliveries.Count == beforeRevokedRole, "Revoked reviewer received queued push");
        await InScope(p => p.GetRequiredService<IPushSubscriptions>().QueueTestAsync(otherId, otherPush.SubscriptionId!.Value, ct));
        await using (var move = new NpgsqlCommand("UPDATE \"CompanyUsers\" SET \"CompanyId\"=@company WHERE \"UserId\"=@user", workflowConnection))
        {
            move.Parameters.AddWithValue("company", owner.CompanyId!.Value); move.Parameters.AddWithValue("user", otherId); await move.ExecuteNonQueryAsync(ct);
        }
        var beforeChangedCompany = pushProbe.Deliveries.Count;
        Check(await InScope(p => p.GetRequiredService<IPushQueueProcessor>().ProcessBatchAsync(1, ct)) == 1 && pushProbe.Deliveries.Count == beforeChangedCompany, "Changed company membership received old-company push");
        await using (var restore = new NpgsqlCommand("UPDATE \"CompanyUsers\" SET \"CompanyId\"=@company WHERE \"UserId\"=@user", workflowConnection))
        {
            restore.Parameters.AddWithValue("company", other.CompanyId!.Value); restore.Parameters.AddWithValue("user", otherId); await restore.ExecuteNonQueryAsync(ct);
        }
        await InScope(p => p.GetRequiredService<IPushSubscriptions>().QueueTestAsync(userId, ownSubId, ct));
        await InScope(p => p.GetRequiredService<IPushSubscriptions>().QueueTestAsync(userId, ownSubId, ct));
        pushProbe.NextResult = new(PushSendOutcome.InvalidSubscription, "Unregistered");
        var beforeUnregistered = pushProbe.Deliveries.Count;
        Check(await InScope(p => p.GetRequiredService<IPushQueueProcessor>().ProcessBatchAsync(10, ct)) == 2 && pushProbe.Deliveries.Count == beforeUnregistered + 1, "Invalid token did not cancel later jobs");
        Check(!await InScope(p => p.GetRequiredService<IPushSubscriptions>().IsActiveAsync(userId, ownSubId, ct)), "Invalid Firebase token stayed active");
        await InScope(async p =>
        {
            var controller = new PushNotificationsController(p.GetRequiredService<IPushSubscriptions>(), p.GetRequiredService<IPushQueueProcessor>(), pushProbe, new FixtureCurrentUser(otherId, []), new SlidingWindowRateLimiter());
            Check(await controller.Queue(ct) is ForbidResult && await controller.Retry(deadJobId, ct) is ForbidResult, "Non-admin could inspect/retry queue");
            Check(await controller.Revoke(ownSubId, ct) is NotFoundResult, "Foreign user revoked push through HTTP");
            return true;
        });
        // Frozen evidence regression checks use the same disposable database.
        var originalRevision=dossier.Dossier!.CurrentRevisionId!.Value;
        var originalEvidence=await InScope(p=>p.GetRequiredService<IDocumentService>().ListForDossierAsync(userId,false,dossierId,ct,originalRevision));
        var frozenItem=originalEvidence.Documents.Single();
        Check(frozenItem.Sha256==Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(new byte[]{1,2,3})).ToLowerInvariant(),"Frozen attachment hash incorrect");
        await InScope(p=>p.GetRequiredService<IDocumentService>().DeleteAsync(userId,proof.Document!.Id,ct));
        var frozenDownload=await InScope(p=>p.GetRequiredService<IDocumentService>().GetFrozenDetailAsync(userId,false,dossierId,originalRevision,frozenItem.Id,ct));
        Check(frozenDownload.Document?.FileBase64==Convert.ToBase64String(new byte[]{1,2,3}) && frozenDownload.Document?.TextContent=="audit policy","Deleting working evidence changed frozen bytes/text");
        await InScope(async p=> {
            var descriptor=builder.Services.Single(d=>d.ServiceType.Name=="DocumentsDbContext");
            var context=(DbContext)p.GetRequiredService(descriptor.ServiceType);
            var item=await context.Set<Turritopsis.Modules.Documents.Domain.EvidenceSnapshotItem>().SingleAsync(x=>x.Id==frozenItem.Id,ct);
            item.TextContent="Attempted rewrite";
            try {await context.SaveChangesAsync(ct);Check(false,"Frozen evidence update accepted");}
            catch(InvalidOperationException ex) when(ex.Message=="Submitted evidence is immutable."){Check(true,"Frozen evidence update refused");}
            return true;
        });
        var foreignDownload=await InScope(p=>p.GetRequiredService<IDocumentService>().GetFrozenDetailAsync(otherId,false,dossierId,originalRevision,frozenItem.Id,ct));
        var foreignHistory=await InScope(p=>p.GetRequiredService<IDossierQueries>().GetRevisionsAsync(otherId,false,dossierId,ct));
        Check(foreignDownload.Access==MembershipAccess.Forbidden && foreignHistory.Access==MembershipAccess.Forbidden,"Foreign company accessed revision evidence/history");
        var originalHistory=await InScope(p=>p.GetRequiredService<IDossierQueries>().GetRevisionsAsync(userId,false,dossierId,ct));
        Check(originalHistory.Revisions.Single().FinalScore==70 && originalHistory.Revisions.Single().Recommendations=="Human decision","Frozen decision missing from revision");
        var oldActiveRevision=resubmitted.Dossier!.CurrentRevisionId!.Value;
        Check(await InScope(p=>p.GetRequiredService<IDossierCommands>().AddNoteAsync(reviewer.UserId!.Value,true,activeId,null,"Revision-specific comment",ct,oldActiveRevision))==MembershipAccess.Granted,"Revision note rejected");
        var replacement=await InScope(p=>p.GetRequiredService<IDocumentService>().UploadAsync(userId,new UpsertDocumentRequest("E1","Replacement","replacement-only-secret",Convert.ToBase64String(new byte[]{9,8}),"replacement.txt"),ct));
        var frozenAi=await InScope(p=>p.GetRequiredService<IDossierQueries>().GetAiContextAsync(reviewer.UserId!.Value,true,dossierId,ct,originalRevision));
        Check(frozenAi.Answers.Any(x=>x.ProofText?.Contains("audit policy")==true) && frozenAi.Answers.All(x=>x.ProofText?.Contains("replacement-only-secret")!=true),"AI used working documents instead of revision evidence");
        var ownHistory=await InScope(p=>p.GetRequiredService<IDossierQueries>().GetHistoryAsync(userId,ct));
        var otherHistory=await InScope(p=>p.GetRequiredService<IDossierQueries>().GetHistoryAsync(otherId,ct));
        Check(ownHistory.Dossiers.Any(x=>x.Id==dossierId) && otherHistory.Dossiers.All(x=>x.CompanyId==other.CompanyId),"Company dossier history leaked or lost older dossiers");
        var rejected=await InScope(p=>p.GetRequiredService<IDossierCommands>().UpdateStatusAsync(reviewer.UserId!.Value,activeId,"Rejected",null,"Historic rejection",ct,oldActiveRevision));
        Check(rejected.Access==MembershipAccess.Granted,"Revision rejection failed");
        await InScope(p=>p.GetRequiredService<ISnapshotService>().UpsertForUserAsync(userId,"{\"E1\":{\"score\":\"0\",\"note\":\"changed answer\"}}",ct));
        var newest=await InScope(p=>p.GetRequiredService<IDossierCommands>().SubmitAsync(userId,20,20,ct));
        Check(newest.Dossier!.RevisionNumber==resubmitted.Dossier!.RevisionNumber+1,"Revision sequence did not advance");
        var activeHistory=await InScope(p=>p.GetRequiredService<IDossierQueries>().GetRevisionsAsync(userId,false,activeId,ct));
        var oldRevision=activeHistory.Revisions.Single(x=>x.Id==oldActiveRevision);
        Check(oldRevision.Recommendations=="Historic rejection" && oldRevision.Status=="Rejected" && oldRevision.SnapshotJson.Contains("policy audit"),"Resubmission rewrote historical answers/decision");
        var historyNotes=await InScope(p=>p.GetRequiredService<IDossierQueries>().GetNotesAsync(userId,false,activeId,ct));
        Check(historyNotes.Notes.Any(x=>x.RevisionId==oldActiveRevision&&x.Text=="Revision-specific comment"),"Resubmission lost historical notes");
        var staleReview=await InScope(p=>p.GetRequiredService<IDossierCommands>().UpdateStatusAsync(reviewer.UserId!.Value,activeId,"Validated",20,null,ct,oldActiveRevision));
        var missingRevision=await InScope(p=>p.GetRequiredService<IDossierCommands>().UpdateStatusAsync(reviewer.UserId!.Value,activeId,"Validated",20,null,ct));
        var staleNote=await InScope(p=>p.GetRequiredService<IDossierCommands>().AddNoteAsync(reviewer.UserId!.Value,true,activeId,null,"stale",ct,oldActiveRevision));
        Check(staleReview.Access==MembershipAccess.Conflict&&missingRevision.Access==MembershipAccess.Conflict&&staleNote==MembershipAccess.Conflict,"Stale or unidentified revision was mutated");
        var wrongRevision=await InScope(p=>p.GetRequiredService<IDocumentService>().GetFrozenDetailAsync(userId,false,activeId,originalRevision,frozenItem.Id,ct));
        Check(wrongRevision.Access==MembershipAccess.NotFound,"Revision from another dossier accepted");
        await Sql("UPDATE \"Documents\" SET \"StoragePath\"=gen_random_uuid()::text WHERE \"Id\"=@id",replacement.Document!.Id);
        var revisionsBefore=(long)(await Sql("SELECT count(*) FROM \"DossierRevisions\" WHERE \"DossierId\"=@id",activeId))!;
        var eventsBefore=(long)(await Sql("SELECT count(*) FROM \"ReviewOutboxMessages\" WHERE \"DossierId\"=@id",activeId))!;
        var missingBytes=await InScope(p=>p.GetRequiredService<IDossierCommands>().SubmitAsync(userId,20,20,ct));
        Check(missingBytes.Access==MembershipAccess.Invalid,"Missing attachment bytes did not prevent submission");
        Check(revisionsBefore==(long)(await Sql("SELECT count(*) FROM \"DossierRevisions\" WHERE \"DossierId\"=@id",activeId))! && eventsBefore==(long)(await Sql("SELECT count(*) FROM \"ReviewOutboxMessages\" WHERE \"DossierId\"=@id",activeId))!,"Failed submission published revision/outbox event");
        var legacy=new Dossier{Id=Guid.NewGuid(),CompanyId=owner.CompanyId!.Value,CreatedAt=DateTimeOffset.UtcNow.AddMinutes(1)};
        legacy.Submit(userId,"{}",40,40);
        await InScope(async p=>{await p.GetRequiredService<IDossierRepository>().SaveAsync(legacy,ct);return true;});
        var legacyRead=await InScope(p=>p.GetRequiredService<IDossierQueries>().GetByIdAsync(userId,false,legacy.Id,ct));
        Check(legacyRead.Dossier!.CurrentRevisionId is null && legacyRead.Dossier.RevisionNumber==0,"Legacy dossier was given fabricated history");
        await InScope(p=>p.GetRequiredService<IDocumentService>().DeleteAsync(userId,replacement.Document!.Id,ct));
        var legacySubmission=await InScope(p=>p.GetRequiredService<IDossierCommands>().SubmitAsync(userId,40,40,ct));
        Check(legacySubmission.Dossier!.Id==legacy.Id && legacySubmission.Dossier.CurrentRevisionId is not null && legacySubmission.Dossier.RevisionNumber==1,"Legacy resubmission did not create frozen revision");
        // Set an existing company membership to Viewer in the disposable fixture only.
        await using var fixtureConnection = new NpgsqlConnection(connection.ConnectionString);
        await fixtureConnection.OpenAsync();
        await using (var viewer = new NpgsqlCommand("UPDATE \"CompanyUsers\" SET \"Role\"='Viewer' WHERE \"UserId\"=@user", fixtureConnection)) {
            viewer.Parameters.AddWithValue("user", otherId); await viewer.ExecuteNonQueryAsync();
        }
        var viewerSnapshot = await InScope(p => p.GetRequiredService<ISnapshotService>().UpsertForUserAsync(otherId, snapshot, ct));
        var viewerDocument = await InScope(p => p.GetRequiredService<IDocumentService>().UploadAsync(otherId, new UpsertDocumentRequest("E1", null, "test", null, null), ct));
        var viewerSubmission = await InScope(p => p.GetRequiredService<IDossierService>().SubmitAsync(otherId, 80, 80, ct));
        Check(viewerSnapshot.Access == MembershipAccess.Forbidden && viewerDocument.Access == MembershipAccess.Forbidden && viewerSubmission.Access == MembershipAccess.Forbidden, "Viewer can write through a module port");
    } finally {
        NpgsqlConnection.ClearAllPools();
        if (created) { await using var drop = new NpgsqlCommand($"DROP DATABASE \"{databaseName}\" WITH (FORCE)", admin); await drop.ExecuteNonQueryAsync(); }
    }
}
Console.WriteLine($"Passed {passed} module checks: context ownership, port wiring" + (useDatabase ? ", isolated PostgreSQL workflow and company isolation; temporary database removed." : ". Add --database for disposable PostgreSQL workflow checks."));

sealed class DeliveryProbe : IDomainEventHandler
{
    public Guid? FailEventId { get; set; }
    public bool CanHandle(DomainEvent e) => e.Id == FailEventId;
    public Task HandleAsync(DomainEvent e, CancellationToken ct)
    {
        FailEventId = null;
        throw new InvalidOperationException("Simulated handler interruption");
    }
}

sealed class FixtureCurrentUser(Guid userId, IReadOnlyList<string> roles) : ICurrentUserService
{
    public Guid? UserId => userId;
    public IReadOnlyList<string> Roles => roles;
}

sealed class PushProbe : IPushSender
{
    public bool Enabled { get; set; }
    public PushSendResult? NextResult;
    public ConcurrentQueue<(string Token, Guid NotificationId, Guid SubscriptionId)> Deliveries { get; } = new();
    public Task<PushSendResult> SendAsync(string token, Guid notificationId, Guid subscriptionId, bool reviewerInbox, CancellationToken ct)
    {
        Deliveries.Enqueue((token, notificationId, subscriptionId));
        return Task.FromResult(Interlocked.Exchange(ref NextResult, null) ?? new PushSendResult(PushSendOutcome.Sent));
    }
}
sealed class FcmCapture : HttpMessageHandler
{
    public ConcurrentQueue<string> Requests { get; } = new();
    public bool InvalidToken { get; set; }
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        if (request.RequestUri?.Host != "fcm.googleapis.com") throw new InvalidOperationException("Unexpected Firebase network target");
        Requests.Enqueue(await request.Content!.ReadAsStringAsync(ct));
        return new HttpResponseMessage(InvalidToken ? HttpStatusCode.NotFound : HttpStatusCode.OK) {
            Content = new StringContent(InvalidToken
                ? "{\"error\":{\"code\":404,\"message\":\"fixture error must not leak\",\"status\":\"NOT_FOUND\",\"details\":[{\"@type\":\"type.googleapis.com/google.firebase.fcm.v1.FcmError\",\"errorCode\":\"UNREGISTERED\"}]}}"
                : "{\"name\":\"projects/push-fixture/messages/test\"}", Encoding.UTF8, "application/json")
        };
    }
}
sealed class FcmCaptureFactory(FcmCapture handler) : Google.Apis.Http.HttpClientFactory
{
    protected override HttpMessageHandler CreateHandler(CreateHttpClientArgs args) => handler;
}
