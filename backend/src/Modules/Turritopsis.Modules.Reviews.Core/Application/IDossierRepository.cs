using Turritopsis.Domain.Entities;
namespace Turritopsis.Modules.Reviews.Application;
public interface IDossierRepository
{
    Task<Dossier?> LatestAsync(Guid companyId, bool excludeValidated, CancellationToken ct);
    Task<Dossier?> GetAsync(Guid id, CancellationToken ct);
    Task SaveAsync(Dossier dossier, CancellationToken ct);
    Task AddNoteAsync(Dossier dossier, DossierNote note, CancellationToken ct);
}
public interface IDossierReadRepository
{
    Task<IReadOnlyList<Dossier>> ForCompanyAsync(Guid companyId,CancellationToken ct);
    Task<IReadOnlyList<DossierRevision>> RevisionsAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<Dossier>> QueueAsync(bool includeAll, CancellationToken ct);
    Task<Dossier?> LatestAsync(Guid companyId, bool excludeValidated, CancellationToken ct);
    Task<Dossier?> GetAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<DossierNote>> NotesAsync(Guid dossierId, CancellationToken ct);
    Task<IReadOnlyList<Dossier>> LatestByCompanyAsync(CancellationToken ct);
}
