using Microsoft.EntityFrameworkCore;
using Turritopsis.Modules.Audit.Domain;

namespace Turritopsis.Modules.Audit.Infrastructure;

public static class AuditPersistenceModel
{
    public static void ConfigureNotifications(ModelBuilder builder)
    {
        var subscription = builder.Entity<PushSubscription>();
        subscription.ToTable("PushSubscriptions");
        subscription.Property(s => s.Token).HasMaxLength(4096);
        subscription.Property(s => s.TokenHash).HasMaxLength(64);
        subscription.HasIndex(s => s.TokenHash).IsUnique().HasFilter("\"Active\"");
        subscription.HasIndex(s => new { s.UserId, s.DeviceId }).IsUnique().HasFilter("\"Active\"");
        subscription.HasIndex(s => new { s.CompanyId, s.ReviewerInbox, s.Active });
        var job = builder.Entity<NotificationPushJob>();
        job.ToTable("NotificationPushJobs");
        job.Property(j => j.Status).HasConversion<string>().HasMaxLength(20);
        job.Property(j => j.LastError).HasMaxLength(200);
        job.HasIndex(j => new { j.NotificationId, j.SubscriptionId }).IsUnique();
        job.HasIndex(j => new { j.Status, j.NextAttemptAt, j.LeaseUntil });
        var notification = builder.Entity<AppNotification>();
        notification.ToTable("Notifications");
        notification.Property(n => n.Type).HasMaxLength(80);
        notification.Property(n => n.Title).HasMaxLength(200);
        notification.HasIndex(n => new { n.CompanyId, n.ReviewerInbox, n.CreatedAt });
    }
}
