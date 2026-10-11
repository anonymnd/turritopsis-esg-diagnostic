using Turritopsis.Application.Snapshots.Models;

namespace Turritopsis.Application.Abstractions;

public interface ISnapshotService
{
    Task<SnapshotResult> GetForUserAsync(Guid userId, CancellationToken cancellationToken);
    Task<SnapshotResult> UpsertForUserAsync(Guid userId, string dataJson, CancellationToken cancellationToken);
}
