using Turritopsis.Domain.Entities;
namespace Turritopsis.Modules.Documents.Application;
public interface IDocumentRepository {
 Task<IReadOnlyList<Document>> ListAsync(Guid companyId, CancellationToken ct);
 Task<Document?> GetAsync(Guid id, CancellationToken ct);
 Task SaveAsync(Document document, CancellationToken ct);
 Task DeleteAsync(Document document, CancellationToken ct);
}
