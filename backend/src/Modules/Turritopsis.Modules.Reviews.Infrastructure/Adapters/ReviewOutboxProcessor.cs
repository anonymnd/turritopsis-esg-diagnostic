using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Turritopsis.SharedKernel;

namespace Turritopsis.Modules.Reviews.Infrastructure;

internal sealed class ReviewOutboxProcessor(ReviewsDbContext db, IDomainEventDispatcher dispatcher,
    ILogger<ReviewOutboxProcessor> logger) : IOutboxProcessor
{
    public async Task<int> ProcessBatchAsync(int batchSize, CancellationToken ct)
    {
        var processed = 0;
        for (var i = 0; i < Math.Clamp(batchSize, 1, 100); i++)
        {
            // Claim quickly, then release the database transaction before executing handlers.
            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            var now = DateTimeOffset.UtcNow;
            var message = await db.OutboxMessages.FromSqlInterpolated($"""
                SELECT m.* FROM "ReviewOutboxMessages" m
                WHERE m."ProcessedAt" IS NULL AND m."NextAttemptAt" <= {now}
                  AND (m."LeaseUntil" IS NULL OR m."LeaseUntil" < {now})
                  AND NOT EXISTS (SELECT 1 FROM "ReviewOutboxMessages" earlier
                    WHERE earlier."DossierId" = m."DossierId" AND earlier."ProcessedAt" IS NULL
                      AND earlier."AggregateVersion" < m."AggregateVersion")
                ORDER BY m."OccurredAt", m."Id" LIMIT 1 FOR UPDATE OF m SKIP LOCKED
                """).AsTracking().ToListAsync(ct);
            if (message.Count == 0) { await transaction.CommitAsync(ct); break; }
            var claimed = message[0];
            var token = Guid.NewGuid();
            claimed.Attempts++;
            claimed.LeaseToken = token;
            claimed.LeaseUntil = now.AddMinutes(2);
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            db.Entry(claimed).State = EntityState.Detached;
            try
            {
                var domainEvent = JsonSerializer.Deserialize<DomainEvent>(claimed.PayloadJson)
                    ?? throw new InvalidOperationException("Invalid outbox event");
                if (domainEvent.Id != claimed.Id || domainEvent.DossierId != claimed.DossierId
                    || domainEvent.AggregateVersion != claimed.AggregateVersion)
                    throw new InvalidOperationException("Outbox envelope mismatch");
                await dispatcher.DispatchAsync(domainEvent, ct);
                var acknowledged = await db.OutboxMessages.Where(m => m.Id == claimed.Id && m.LeaseToken == token)
                    .ExecuteUpdateAsync(set => set.SetProperty(m => m.ProcessedAt, DateTimeOffset.UtcNow)
                        .SetProperty(m => m.LeaseToken, (Guid?)null).SetProperty(m => m.LeaseUntil, (DateTimeOffset?)null)
                        .SetProperty(m => m.LastError, (string?)null), ct);
                if (acknowledged == 1) processed++;
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                // Store only the exception type: provider/database messages can contain private data.
                var error = ex.GetType().Name;
                var retryAt = DateTimeOffset.UtcNow.AddSeconds(Math.Min(900, Math.Pow(2, Math.Min(claimed.Attempts, 10))));
                await db.OutboxMessages.Where(m => m.Id == claimed.Id && m.LeaseToken == token)
                    .ExecuteUpdateAsync(set => set.SetProperty(m => m.NextAttemptAt, retryAt)
                        .SetProperty(m => m.LastError, error).SetProperty(m => m.LeaseToken, (Guid?)null)
                        .SetProperty(m => m.LeaseUntil, (DateTimeOffset?)null), ct);
                logger.LogWarning("Outbox event {EventId} will retry ({ExceptionType})", claimed.Id, error);
            }
        }
        return processed;
    }
}
