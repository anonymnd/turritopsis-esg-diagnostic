namespace Turritopsis.Modules.Audit.Domain;

public sealed class AppNotification
{
    public Guid Id { get; set; }
    public Guid DossierId { get; set; }
    public Guid CompanyId { get; set; }
    public bool ReviewerInbox { get; set; }
    public string Type { get; set; } = "";
    public string Title { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
}
