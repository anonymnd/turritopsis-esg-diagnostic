using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Turritopsis.Domain.Entities;
using Turritopsis.SharedKernel;
namespace Turritopsis.Modules.Audit.Infrastructure;
internal sealed class AuditTrail(AuditDbContext db,ILogger<AuditTrail> logger) : IAuditTrail {
 public async Task WriteAsync(Guid actorId,Guid? companyId,string action,CancellationToken ct) {
  var entry=new AuditLog {Id=Guid.NewGuid(),ActorId=actorId,CompanyId=companyId,Action=action,CreatedAt=DateTimeOffset.UtcNow};
  try {db.AuditLogs.Add(entry);await db.SaveChangesAsync(ct);}
  catch(Exception ex) {db.Entry(entry).State=EntityState.Detached;logger.LogWarning("Audit write failed ({ExceptionType})",ex.GetType().Name);}
 }
 public async Task<IReadOnlyList<AuditEntry>> LatestAsync(CancellationToken ct) => await db.AuditLogs.AsNoTracking().OrderByDescending(a=>a.CreatedAt).Take(50).Select(a=>new AuditEntry(a.Id,a.ActorId,a.CompanyId,a.Action,a.CreatedAt)).ToListAsync(ct);
}
