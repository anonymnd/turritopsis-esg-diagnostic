using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Turritopsis.Modules.Audit.Application;
using Turritopsis.Modules.Audit.Domain;
using Turritopsis.SharedKernel;
namespace Turritopsis.Modules.Audit.Infrastructure;

internal sealed class PushQueueProcessor(AuditDbContext db, IPushSender sender, ICompanyDirectory companies,
    IPlatformUserAccessReader platform, ILogger<PushQueueProcessor> logger) : IPushQueueProcessor
{
    public async Task<int> ProcessBatchAsync(int batchSize, CancellationToken ct)
    {
        if (!sender.Enabled) return 0;
        var processed = 0;
        for (var i = 0; i < Math.Clamp(batchSize, 1, 100); i++)
        {
            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            var now = DateTimeOffset.UtcNow;
            var rows = await db.Set<NotificationPushJob>().FromSqlInterpolated($"""
                SELECT * FROM "NotificationPushJobs" WHERE "Status" = 'Pending' AND "NextAttemptAt" <= {now}
                AND ("LeaseUntil" IS NULL OR "LeaseUntil" < {now}) ORDER BY "CreatedAt", "Id"
                LIMIT 1 FOR UPDATE SKIP LOCKED
                """).AsTracking().ToListAsync(ct);
            if (rows.Count == 0) { await transaction.CommitAsync(ct); break; }
            var job = rows[0];
            var lease = Guid.NewGuid();
            job.Attempts++;
            job.LeaseToken = lease;
            job.LeaseUntil = now.AddMinutes(2);
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            db.Entry(job).State = EntityState.Detached;
            PushJobStatus status;
            string? error = null;
            try
            {
                var subscription = await db.Set<PushSubscription>().AsNoTracking().FirstOrDefaultAsync(s => s.Id == job.SubscriptionId, ct);
                if (job.ExpiresAt <= now) status = PushJobStatus.Expired;
                else if (subscription is null || !subscription.Active || subscription.CompanyId != job.CompanyId || subscription.ReviewerInbox != job.ReviewerInbox)
                    status = PushJobStatus.Cancelled;
                else
                {
                    var user = await platform.ReadAsync(subscription.UserId, ct);
                    var membership = job.ReviewerInbox ? null : await companies.FindMembershipAsync(subscription.UserId, ct);
                    if (!user.Exists || (job.ReviewerInbox ? !user.IsReviewer : membership?.CompanyId != job.CompanyId))
                        status = PushJobStatus.Cancelled;
                    else
                    {
                        var result = await sender.SendAsync(subscription.Token, job.NotificationId, subscription.Id, job.ReviewerInbox, ct);
                        error = result.ErrorCode;
                        status = result.Outcome switch
                        {
                            PushSendOutcome.Sent => PushJobStatus.Sent,
                            PushSendOutcome.Retry => job.Attempts >= 8 ? PushJobStatus.DeadLetter : PushJobStatus.Pending,
                            _ => PushJobStatus.DeadLetter
                        };
                        if (result.Outcome == PushSendOutcome.InvalidSubscription)
                            await db.Set<PushSubscription>().Where(s => s.Id == subscription.Id).ExecuteUpdateAsync(set => set.SetProperty(s => s.Active, false), ct);
                    }
                }
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (Exception ex) { status = job.Attempts >= 8 ? PushJobStatus.DeadLetter : PushJobStatus.Pending; error = ex.GetType().Name; }
            var completedAt = status == PushJobStatus.Pending ? (DateTimeOffset?)null : DateTimeOffset.UtcNow;
            var retryAt = DateTimeOffset.UtcNow.AddSeconds(Math.Min(3600, 5 * Math.Pow(2, Math.Min(job.Attempts, 10))));
            var acknowledged = await db.Set<NotificationPushJob>().Where(j => j.Id == job.Id && j.LeaseToken == lease)
                .ExecuteUpdateAsync(set => set.SetProperty(j => j.Status, status).SetProperty(j => j.CompletedAt, completedAt)
                    .SetProperty(j => j.NextAttemptAt, retryAt).SetProperty(j => j.LastError, error)
                    .SetProperty(j => j.LeaseToken, (Guid?)null).SetProperty(j => j.LeaseUntil, (DateTimeOffset?)null), ct);
            if (acknowledged == 1 && status != PushJobStatus.Pending) processed++;
            if (error is not null) logger.LogWarning("Push job {JobId}: {Status} ({ErrorCode})", job.Id, status, error);
        }
        return processed;
    }
    public async Task<PushQueueOverview> OverviewAsync(CancellationToken ct)
    {
        var groups = await db.Set<NotificationPushJob>().AsNoTracking().GroupBy(j => j.Status).Select(g => new { Status = g.Key, Count = g.Count() }).ToListAsync(ct);
        int Count(PushJobStatus status) => groups.SingleOrDefault(g => g.Status == status)?.Count ?? 0;
        var failed = await db.Set<NotificationPushJob>().AsNoTracking().Where(j => j.Status == PushJobStatus.DeadLetter)
            .OrderByDescending(j => j.CreatedAt).Take(20).Select(j => new FailedPushJob(j.Id, j.Attempts, j.LastError, j.CreatedAt)).ToListAsync(ct);
        return new(sender.Enabled, Count(PushJobStatus.Pending), Count(PushJobStatus.Sent), Count(PushJobStatus.DeadLetter), Count(PushJobStatus.Cancelled), Count(PushJobStatus.Expired), failed);
    }
    public async Task<bool> RetryAsync(Guid jobId, CancellationToken ct)
    {
        if (!sender.Enabled) return false;
        var now = DateTimeOffset.UtcNow;
        return await db.Set<NotificationPushJob>().Where(j => j.Id == jobId && j.Status == PushJobStatus.DeadLetter && j.ExpiresAt > now)
            .ExecuteUpdateAsync(set => set.SetProperty(j => j.Status, PushJobStatus.Pending).SetProperty(j => j.Attempts, 0)
                .SetProperty(j => j.LastError, (string?)null).SetProperty(j => j.NextAttemptAt, now)
                .SetProperty(j => j.CompletedAt, (DateTimeOffset?)null).SetProperty(j => j.LeaseToken, (Guid?)null)
                .SetProperty(j => j.LeaseUntil, (DateTimeOffset?)null), ct) == 1;
    }
}
