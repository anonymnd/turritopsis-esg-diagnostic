namespace Turritopsis.Domain.Entities;

public class Certificate
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid DossierId { get; set; }
    public bool Active { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public string? StripeSessionId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Company Company { get; set; } = null!;
}
