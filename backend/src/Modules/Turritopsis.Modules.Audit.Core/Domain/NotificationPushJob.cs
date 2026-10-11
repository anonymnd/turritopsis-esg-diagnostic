namespace Turritopsis.Modules.Audit.Domain;
public enum PushJobStatus { Pending, Sent, DeadLetter, Cancelled, Expired }
public sealed class NotificationPushJob
{
    public Guid Id { get; set; }
    public Guid NotificationId { get; set; }
    public Guid SubscriptionId { get; set; }
    public Guid? CompanyId { get; set; }
    public bool ReviewerInbox { get; set; }
    public PushJobStatus Status { get; set; }
    public int Attempts { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset NextAttemptAt { get; set; }
    public Guid? LeaseToken { get; set; }
    public DateTimeOffset? LeaseUntil { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public string? LastError { get; set; }
}
