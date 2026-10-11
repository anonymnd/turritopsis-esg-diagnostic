using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Turritopsis.Domain.Entities;
using Turritopsis.Domain.Enums;
using Turritopsis.Modules.Reviews.Application;
using Turritopsis.Modules.Reviews.Domain;
namespace Turritopsis.Modules.Reviews.Infrastructure;
internal sealed class DossierRepository(ReviewsDbContext db) : IDossierRepository
{
    public Task<Dossier?> LatestAsync(Guid id, bool excludeValidated, CancellationToken ct) => db.Dossiers.Include(d=>d.Revisions).Where(d => d.CompanyId == id && (!excludeValidated || d.Status != DossierStatus.Validated)).OrderByDescending(d => d.CreatedAt).FirstOrDefaultAsync(ct);
    public Task<Dossier?> GetAsync(Guid id, CancellationToken ct) => db.Dossiers.Include(d=>d.Revisions).FirstOrDefaultAsync(d => d.Id == id, ct);
    public async Task SaveAsync(Dossier dossier, CancellationToken ct)
    {
        if (db.Entry(dossier).State == EntityState.Detached)
            db.Dossiers.Add(dossier);
        foreach(var revision in dossier.Revisions)
            if(revision.IsNew) db.Entry(revision).State=EntityState.Added;
        foreach (var message in dossier.DomainEvents)
            db.OutboxMessages.Add(new ReviewOutboxMessage
            {
                Id = message.Id,
                DossierId = message.DossierId,
                AggregateVersion = message.AggregateVersion,
                PayloadJson = JsonSerializer.Serialize(message),
                OccurredAt = message.OccurredAt,
                NextAttemptAt = message.OccurredAt
            });
        try
        {
            await db.SaveChangesAsync(ct);
            foreach(var revision in dossier.Revisions) revision.IsNew=false;
            dossier.ClearDomainEvents();
        }
        catch (DbUpdateConcurrencyException) { db.ChangeTracker.Clear(); throw new DossierConcurrencyException(); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException
        { SqlState: "23505", ConstraintName: "IX_ReviewOutboxMessages_DossierId_AggregateVersion" })
        {
            // EF may insert the outbox row before updating the versioned aggregate.
            // Either conflict rolls back the complete SaveChanges transaction.
            db.ChangeTracker.Clear();
            throw new DossierConcurrencyException();
        }
    }
    public async Task AddNoteAsync(Dossier dossier, DossierNote note, CancellationToken ct)
    {
        db.DossierNotes.Add(note);
        await SaveAsync(dossier, ct);
    }
}
