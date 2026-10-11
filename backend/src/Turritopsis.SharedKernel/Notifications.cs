namespace Turritopsis.SharedKernel;

public sealed record NotificationEntry(Guid Id, Guid DossierId, string Type, string Title, DateTimeOffset CreatedAt);

public interface INotificationReader
{
    Task<IReadOnlyList<NotificationEntry>> ListAsync(Guid? companyId, bool reviewerInbox, CancellationToken ct);
}
