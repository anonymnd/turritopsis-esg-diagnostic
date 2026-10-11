using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Admin.Models;
using Turritopsis.SharedKernel;
namespace Turritopsis.Modules.Administration.Application;
public sealed class AdminOverviewService(ICompanyDirectory companies,IDossierSummaryReader dossiers,IAuditTrail audit) : IAdminOverviewService {
 public async Task<AdminOverviewDto> GetOverviewAsync(CancellationToken ct){
  var list=await companies.ListCompaniesAsync(ct);var latest=(await dossiers.LatestByCompanyAsync(ct)).ToDictionary(d=>d.CompanyId);
  var rows=list.Select(c=>{latest.TryGetValue(c.Id,out var d);return new AdminCompanyDto(c.Id,c.Name,c.Sector,d?.Status,d?.Score);}).ToList();
  var entries=(await audit.LatestAsync(ct)).Select(a=>new AdminAuditLogDto(a.Id,a.ActorId,a.CompanyId,a.Action,a.CreatedAt)).ToList();
  return new(rows,entries);
 }
}
