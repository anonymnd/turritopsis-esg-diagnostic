using System.Data;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Turritopsis.Modules.Documents.Domain;
using Turritopsis.SharedKernel;
namespace Turritopsis.Modules.Documents.Infrastructure;
internal sealed class FrozenEvidenceStore(DocumentsDbContext db) : IFrozenEvidenceStore {
 public async Task<Guid> CaptureAsync(Guid companyId, Guid actorId, CancellationToken ct) {
  await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead, ct);
  var snapshot = new EvidenceSnapshot { Id=Guid.NewGuid(), CompanyId=companyId, CapturedBy=actorId, CapturedAt=DateTimeOffset.UtcNow };
  var documents = await db.Documents.AsNoTracking().Where(d=>d.CompanyId==companyId).OrderBy(d=>d.CreatedAt).ToListAsync(ct);
  foreach(var d in documents) {
   byte[]? content=null;
   if(d.StoragePath is not null) {
    if(!Guid.TryParse(d.StoragePath,out var blobId)) throw new EvidenceCaptureException("Une piece est indisponible. Televersez-la a nouveau avant de soumettre.");
    content=await db.FileBlobs.AsNoTracking().Where(x=>x.Id==blobId).Select(x=>x.Content).SingleOrDefaultAsync(ct);
    if(content is null) throw new EvidenceCaptureException("Une piece est indisponible. Televersez-la a nouveau avant de soumettre.");
   } else if(d.FileName is not null) throw new EvidenceCaptureException("Une piece est indisponible. Televersez-la a nouveau avant de soumettre.");
   db.Add(new EvidenceSnapshotItem { Id=Guid.NewGuid(), SnapshotId=snapshot.Id, OriginalDocumentId=d.Id,
    QuestionCode=d.QuestionCode,Label=d.Label,TextContent=d.TextContent,FileName=d.FileName,UploadedBy=d.UploadedBy,
    CreatedAt=d.CreatedAt,Content=content,Sha256=content is null?null:Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant() });
  }
  db.Add(snapshot);await db.SaveChangesAsync(ct);await transaction.CommitAsync(ct);return snapshot.Id;
 }
 public async Task<IReadOnlyList<FrozenEvidenceItem>> ReadAsync(Guid companyId,Guid snapshotId,CancellationToken ct) {
  if(!await db.Set<EvidenceSnapshot>().AnyAsync(x=>x.Id==snapshotId&&x.CompanyId==companyId,ct)) return Array.Empty<FrozenEvidenceItem>();
  return await db.Set<EvidenceSnapshotItem>().AsNoTracking().Where(x=>x.SnapshotId==snapshotId).OrderBy(x=>x.CreatedAt)
   .Select(x=>new FrozenEvidenceItem(x.Id,x.OriginalDocumentId,x.QuestionCode,x.Label,x.TextContent,x.FileName,x.UploadedBy,x.CreatedAt,x.Sha256,null)).ToListAsync(ct);
 }
 public async Task<FrozenEvidenceItem?> ReadItemAsync(Guid companyId,Guid snapshotId,Guid itemId,CancellationToken ct) {
  if(!await db.Set<EvidenceSnapshot>().AnyAsync(x=>x.Id==snapshotId&&x.CompanyId==companyId,ct)) return null;
  return await db.Set<EvidenceSnapshotItem>().AsNoTracking().Where(x=>x.SnapshotId==snapshotId&&x.Id==itemId)
   .Select(x=>new FrozenEvidenceItem(x.Id,x.OriginalDocumentId,x.QuestionCode,x.Label,x.TextContent,x.FileName,x.UploadedBy,x.CreatedAt,x.Sha256,x.Content)).SingleOrDefaultAsync(ct);
 }
}
