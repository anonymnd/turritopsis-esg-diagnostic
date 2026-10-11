namespace Turritopsis.Modules.Reviews.Domain;

public sealed class ReviewOutboxMessage
{
    public Guid Id { get; set; }
    public Guid DossierId { get; set; }
    public long AggregateVersion { get; set; }
    public string PayloadJson { get; set; } = "{}";
    public DateTimeOffset OccurredAt { get; set; }
    public DateTimeOffset NextAttemptAt { get; set; }
    public int Attempts { get; set; }
    public Guid? LeaseToken { get; set; }
    public DateTimeOffset? LeaseUntil { get; set; }
    public DateTimeOffset? ProcessedAt { get; set; }
    public string? LastError { get; set; }
}
