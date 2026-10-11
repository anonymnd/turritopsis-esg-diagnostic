using Microsoft.EntityFrameworkCore;
using Turritopsis.Domain.Entities;
using Turritopsis.Modules.Documents.Application;
namespace Turritopsis.Modules.Documents.Infrastructure;
internal sealed class DocumentRepository(DocumentsDbContext db) : IDocumentRepository {
 public async Task<IReadOnlyList<Document>> ListAsync(Guid id,CancellationToken ct) => await db.Documents.Where(d=>d.CompanyId==id).OrderByDescending(d=>d.CreatedAt).ToListAsync(ct);
 public Task<Document?> GetAsync(Guid id,CancellationToken ct) => db.Documents.FirstOrDefaultAsync(d=>d.Id==id,ct);
 public async Task SaveAsync(Document document,CancellationToken ct) {db.Documents.Add(document);await db.SaveChangesAsync(ct);}
 public async Task DeleteAsync(Document document,CancellationToken ct) {db.Documents.Remove(document);await db.SaveChangesAsync(ct);}
}
