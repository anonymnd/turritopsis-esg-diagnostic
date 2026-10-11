using Turritopsis.Modules.Reviews.Application;
using Turritopsis.SharedKernel;
namespace Turritopsis.Modules.Reviews.Infrastructure;
internal sealed class DossierReaders(IDossierReadRepository repository) : IDossierCompanyReader,IDossierSummaryReader,IDossierEvidenceLocator {
 public async Task<DossierEvidenceLocation?> LocateAsync(Guid id,Guid? revisionId,CancellationToken ct) {
 var d=await repository.GetAsync(id,ct);if(d is null)return null;
 var selected=revisionId??d.CurrentRevisionId;if(selected is null)return new(d.CompanyId,null);
 var row=(await repository.RevisionsAsync(id,ct)).SingleOrDefault(x=>x.Id==selected);
 return row is null?null:new(d.CompanyId,row.EvidenceSnapshotId);
 }
 public async Task<Guid?> FindCompanyIdAsync(Guid id,CancellationToken ct)=>(await repository.GetAsync(id,ct))?.CompanyId;
 public async Task<IReadOnlyList<DossierSummary>> LatestByCompanyAsync(CancellationToken ct)=>(await repository.LatestByCompanyAsync(ct)).Select(d=>new DossierSummary(d.CompanyId,d.Status.ToString(),d.FinalScore??d.ReviewedScore,d.CreatedAt)).ToList();
}
