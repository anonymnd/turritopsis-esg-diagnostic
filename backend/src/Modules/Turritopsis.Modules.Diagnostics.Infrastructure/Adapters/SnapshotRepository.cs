using Microsoft.EntityFrameworkCore;
using Turritopsis.Domain.Entities;
using Turritopsis.Modules.Diagnostics.Application;
namespace Turritopsis.Modules.Diagnostics.Infrastructure;
internal sealed class SnapshotRepository(DiagnosticsDbContext db) : ISnapshotRepository {
 public Task<EsgSnapshot?> GetAsync(Guid id,CancellationToken ct) => db.EsgSnapshots.FirstOrDefaultAsync(s=>s.CompanyId==id,ct);
 public async Task SaveAsync(EsgSnapshot snapshot,CancellationToken ct) { if(db.Entry(snapshot).State==EntityState.Detached)db.EsgSnapshots.Add(snapshot);await db.SaveChangesAsync(ct); }
}
