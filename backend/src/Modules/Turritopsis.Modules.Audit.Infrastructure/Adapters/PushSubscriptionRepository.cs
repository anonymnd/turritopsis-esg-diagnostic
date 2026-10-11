using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Turritopsis.Application.Common;
using Turritopsis.Modules.Audit.Application;
using Turritopsis.Modules.Audit.Domain;
namespace Turritopsis.Modules.Audit.Infrastructure;

internal sealed class PushSubscriptionRepository(AuditDbContext db) : IPushSubscriptionRepository
{
    public async Task<PushRegistrationResult> RegisterAsync(Guid userId, Guid deviceId, Guid? companyId, bool reviewerInbox, string token, CancellationToken ct)
    {
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var current = await db.Set<PushSubscription>().Where(s => s.Active && (s.TokenHash == hash || (s.UserId == userId && s.DeviceId == deviceId))).ToListAsync(ct);
        if (current.Any(s => s.UserId != userId || s.DeviceId != deviceId))
            return new(MembershipAccess.Conflict, Error: "Cet appareil appartient deja a un autre abonnement. Desactivez-le avant de changer de compte.");
        var same = current.SingleOrDefault(s => s.TokenHash == hash && s.CompanyId == companyId && s.ReviewerInbox == reviewerInbox);
        if (same is not null)
        {
            same.LastSeenAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return new(MembershipAccess.Granted, same.Id);
        }
        try
        {
            foreach (var subscription in current) subscription.Active = false;
            // Release active uniqueness constraints before inserting the replacement, within one transaction.
            await db.SaveChangesAsync(ct);
            var now = DateTimeOffset.UtcNow;
            var created = new PushSubscription { Id = Guid.NewGuid(), UserId = userId, DeviceId = deviceId,
                CompanyId = companyId, ReviewerInbox = reviewerInbox, Token = token, TokenHash = hash,
                CreatedAt = now, LastSeenAt = now };
            db.Add(created);
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return new(MembershipAccess.Granted, created.Id);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
        {
            await transaction.RollbackAsync(ct);
            db.ChangeTracker.Clear();
            return new(MembershipAccess.Conflict, Error: "Un abonnement a ete modifie en parallele. Reessayez.");
        }
    }
    public async Task<bool> RevokeAsync(Guid userId, Guid subscriptionId, CancellationToken ct)
        => await db.Set<PushSubscription>().Where(s => s.UserId == userId && s.Id == subscriptionId)
            .ExecuteUpdateAsync(set => set.SetProperty(s => s.Active, false), ct) == 1;
    public Task<bool> IsActiveAsync(Guid userId, Guid subscriptionId, CancellationToken ct)
        => db.Set<PushSubscription>().AsNoTracking().AnyAsync(s => s.UserId == userId && s.Id == subscriptionId && s.Active, ct);
    public async Task<bool> QueueTestAsync(Guid userId, Guid subscriptionId, CancellationToken ct)
    {
        var subscription = await db.Set<PushSubscription>().AsNoTracking().FirstOrDefaultAsync(s => s.UserId == userId && s.Id == subscriptionId && s.Active, ct);
        if (subscription is null) return false;
        var now = DateTimeOffset.UtcNow;
        db.Add(new NotificationPushJob { Id = Guid.NewGuid(), NotificationId = Guid.NewGuid(), SubscriptionId = subscription.Id,
            CompanyId = subscription.CompanyId, ReviewerInbox = subscription.ReviewerInbox, CreatedAt = now,
            ExpiresAt = now.AddDays(1), NextAttemptAt = now });
        await db.SaveChangesAsync(ct);
        return true;
    }
}
