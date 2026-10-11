namespace Turritopsis.Modules.Audit.Domain;
public sealed class PushSubscription
{
    public Guid Id { get; set; }
    public Guid DeviceId { get; set; }
    public Guid UserId { get; set; }
    public Guid? CompanyId { get; set; }
    public bool ReviewerInbox { get; set; }
    public string Token { get; set; } = "";
    public string TokenHash { get; set; } = "";
    public bool Active { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset LastSeenAt { get; set; }
}
