using Turritopsis.Domain.Entities;
namespace Turritopsis.Modules.Diagnostics.Application;
public interface ISnapshotRepository {
 Task<EsgSnapshot?> GetAsync(Guid companyId, CancellationToken ct);
 Task SaveAsync(EsgSnapshot snapshot, CancellationToken ct);
}
