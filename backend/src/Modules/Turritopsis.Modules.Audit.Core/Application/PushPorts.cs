using Turritopsis.Modules.Audit.Domain;
using Turritopsis.Application.Common;
namespace Turritopsis.Modules.Audit.Application;

public sealed record PushRegistrationResult(MembershipAccess Access, Guid? SubscriptionId = null, string? Error = null);
public sealed record FailedPushJob(Guid Id, int Attempts, string? Error, DateTimeOffset CreatedAt);
public sealed record PushQueueOverview(bool Enabled, int Pending, int Sent, int DeadLetter, int Cancelled, int Expired, IReadOnlyList<FailedPushJob> FailedJobs);
public enum PushSendOutcome { Sent, Retry, PermanentFailure, InvalidSubscription }
public sealed record PushSendResult(PushSendOutcome Outcome, string? ErrorCode = null);
public interface IPushSender
{
    bool Enabled { get; }
    Task<PushSendResult> SendAsync(string token, Guid notificationId, Guid subscriptionId, bool reviewerInbox, CancellationToken ct);
}
public interface IPushSubscriptionRepository
{
    Task<PushRegistrationResult> RegisterAsync(Guid userId, Guid deviceId, Guid? companyId, bool reviewerInbox, string token, CancellationToken ct);
    Task<bool> RevokeAsync(Guid userId, Guid subscriptionId, CancellationToken ct);
    Task<bool> IsActiveAsync(Guid userId, Guid subscriptionId, CancellationToken ct);
    Task<bool> QueueTestAsync(Guid userId, Guid subscriptionId, CancellationToken ct);
}
public interface IPushSubscriptions
{
    Task<PushRegistrationResult> RegisterAsync(Guid userId, Guid deviceId, string token, CancellationToken ct);
    Task<bool> RevokeAsync(Guid userId, Guid subscriptionId, CancellationToken ct);
    Task<bool> IsActiveAsync(Guid userId, Guid subscriptionId, CancellationToken ct);
    Task<bool> QueueTestAsync(Guid userId, Guid subscriptionId, CancellationToken ct);
}
public interface IPushQueueProcessor
{
    Task<int> ProcessBatchAsync(int batchSize, CancellationToken ct);
    Task<PushQueueOverview> OverviewAsync(CancellationToken ct);
    Task<bool> RetryAsync(Guid jobId, CancellationToken ct);
}
