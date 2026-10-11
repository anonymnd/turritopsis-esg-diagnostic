using Microsoft.EntityFrameworkCore;
using Turritopsis.Modules.Audit.Domain;
using Turritopsis.SharedKernel;

namespace Turritopsis.Modules.Audit.Infrastructure;

internal sealed class DossierEventHandler(AuditDbContext db) : IDomainEventHandler
{
    public bool CanHandle(DomainEvent e) => e.Type is "dossier.submitted" or "dossier.inreview"
        or "dossier.validated" or "dossier.rejected" or "dossier.note_added";

    public async Task HandleAsync(DomainEvent e, CancellationToken ct)
    {
        var title = e.Type switch
        {
            "dossier.submitted" => "Nouveau dossier soumis",
            "dossier.inreview" => "Votre dossier est en revue",
            "dossier.validated" => "Votre dossier est valide",
            "dossier.rejected" => "Votre dossier demande des corrections",
            _ => "Un commentaire a ete ajoute au dossier"
        };
        var action = e.Type == "dossier.submitted" ? "dossier.submit" : e.Type;
        var reviewer = e.Type == "dossier.submitted";
        var details = "{}";
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        // Event IDs are the primary keys: retrying delivery cannot duplicate either effect.
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "AuditLogs" ("Id", "ActorId", "CompanyId", "Action", "DetailsJson", "CreatedAt")
            VALUES ({e.Id}, {e.ActorId}, {e.CompanyId}, {action}, {details}::jsonb, {e.OccurredAt}) ON CONFLICT ("Id") DO NOTHING
            """, ct);
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "Notifications" ("Id", "DossierId", "CompanyId", "ReviewerInbox", "Type", "Title", "CreatedAt")
            VALUES ({e.Id}, {e.DossierId}, {e.CompanyId}, {reviewer}, {e.Type}, {title}, {e.OccurredAt}) ON CONFLICT ("Id") DO NOTHING
            """, ct);
        var expiresAt = e.OccurredAt.AddDays(1);
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "NotificationPushJobs" ("Id", "NotificationId", "SubscriptionId", "CompanyId", "ReviewerInbox",
                "Status", "Attempts", "CreatedAt", "ExpiresAt", "NextAttemptAt")
            SELECT gen_random_uuid(), {e.Id}, s."Id", s."CompanyId", s."ReviewerInbox",
                'Pending', 0, {e.OccurredAt}, {expiresAt}, {e.OccurredAt}
            FROM "PushSubscriptions" s WHERE s."Active" AND s."CreatedAt" <= {e.OccurredAt}
                AND s."LastSeenAt" >= {e.OccurredAt.AddDays(-90)}
                AND (({reviewer} AND s."ReviewerInbox") OR (NOT {reviewer} AND NOT s."ReviewerInbox" AND s."CompanyId"={e.CompanyId}))
            ON CONFLICT ("NotificationId", "SubscriptionId") DO NOTHING
            """, ct);
        await transaction.CommitAsync(ct);
    }
}

internal sealed class NotificationReader(AuditDbContext db) : INotificationReader
{
    public async Task<IReadOnlyList<NotificationEntry>> ListAsync(Guid? companyId, bool reviewerInbox, CancellationToken ct)
        => await db.Set<AppNotification>().AsNoTracking()
            .Where(n => reviewerInbox ? n.ReviewerInbox : !n.ReviewerInbox && companyId != null && n.CompanyId == companyId)
            .OrderByDescending(n => n.CreatedAt).Take(50)
            .Select(n => new NotificationEntry(n.Id, n.DossierId, n.Type, n.Title, n.CreatedAt)).ToListAsync(ct);
}
