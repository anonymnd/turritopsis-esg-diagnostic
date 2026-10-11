using Microsoft.EntityFrameworkCore;
using Turritopsis.Domain.Entities;
using Turritopsis.Domain.Enums;
using Turritopsis.Modules.Reviews.Application;
namespace Turritopsis.Modules.Reviews.Infrastructure;
internal sealed class DossierReadRepository(ReviewsDbContext db) : IDossierReadRepository
{
    public async Task<IReadOnlyList<Dossier>> ForCompanyAsync(Guid companyId,CancellationToken ct) => await db.Dossiers.AsNoTracking().Where(x=>x.CompanyId==companyId).OrderByDescending(x=>x.SubmittedAt).ToListAsync(ct);
    public async Task<IReadOnlyList<DossierRevision>> RevisionsAsync(Guid id,CancellationToken ct) => await db.Set<DossierRevision>().AsNoTracking().Where(x=>x.DossierId==id).OrderByDescending(x=>x.Number).ToListAsync(ct);
    public async Task<IReadOnlyList<Dossier>> QueueAsync(bool all, CancellationToken ct) => await db.Dossiers.AsNoTracking().Where(d => all || d.Status == DossierStatus.Submitted || d.Status == DossierStatus.InReview).OrderByDescending(d => d.SubmittedAt).ToListAsync(ct);
    public Task<Dossier?> LatestAsync(Guid id, bool excludeValidated, CancellationToken ct) => db.Dossiers.AsNoTracking().Where(d => d.CompanyId == id && (!excludeValidated || d.Status != DossierStatus.Validated)).OrderByDescending(d => d.CreatedAt).FirstOrDefaultAsync(ct);
    public Task<Dossier?> GetAsync(Guid id, CancellationToken ct) => db.Dossiers.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id, ct);
    public async Task<IReadOnlyList<DossierNote>> NotesAsync(Guid id, CancellationToken ct) => await db.DossierNotes.AsNoTracking().Where(n => n.DossierId == id).OrderBy(n => n.CreatedAt).ToListAsync(ct);
    public async Task<IReadOnlyList<Dossier>> LatestByCompanyAsync(CancellationToken ct) => await db.Dossiers.AsNoTracking().GroupBy(d => d.CompanyId).Select(g => g.OrderByDescending(d => d.CreatedAt).First()).ToListAsync(ct);
}
