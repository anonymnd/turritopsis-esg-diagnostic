namespace Turritopsis.SharedKernel;
public sealed record PlatformUserAccess(bool Exists, bool IsReviewer);
public interface IPlatformUserAccessReader
{
    Task<PlatformUserAccess> ReadAsync(Guid userId, CancellationToken ct);
}
