using Turritopsis.Application.Common;
using Turritopsis.SharedKernel;
namespace Turritopsis.Modules.Audit.Application;

public sealed class PushSubscriptions(IPushSubscriptionRepository repository, ICompanyDirectory companies,
    IPlatformUserAccessReader platform, IPushSender sender) : IPushSubscriptions
{
    public async Task<PushRegistrationResult> RegisterAsync(Guid userId, Guid deviceId, string token, CancellationToken ct)
    {
        if (!sender.Enabled) return new(MembershipAccess.Conflict, Error: "Les notifications push sont indisponibles.");
        if (deviceId == Guid.Empty || string.IsNullOrWhiteSpace(token) || token.Length > 4096 || token.Any(char.IsWhiteSpace))
            return new(MembershipAccess.Invalid, Error: "Abonnement push invalide.");
        var access = await platform.ReadAsync(userId, ct);
        if (!access.Exists) return new(MembershipAccess.Forbidden);
        var membership = access.IsReviewer ? null : await companies.FindMembershipAsync(userId, ct);
        if (!access.IsReviewer && membership is null) return new(MembershipAccess.Forbidden);
        return await repository.RegisterAsync(userId, deviceId, membership?.CompanyId, access.IsReviewer, token, ct);
    }
    public Task<bool> RevokeAsync(Guid userId, Guid subscriptionId, CancellationToken ct) => repository.RevokeAsync(userId, subscriptionId, ct);
    public Task<bool> IsActiveAsync(Guid userId, Guid subscriptionId, CancellationToken ct) => repository.IsActiveAsync(userId, subscriptionId, ct);
    public Task<bool> QueueTestAsync(Guid userId, Guid subscriptionId, CancellationToken ct) => sender.Enabled
        ? repository.QueueTestAsync(userId, subscriptionId, ct) : Task.FromResult(false);
}
