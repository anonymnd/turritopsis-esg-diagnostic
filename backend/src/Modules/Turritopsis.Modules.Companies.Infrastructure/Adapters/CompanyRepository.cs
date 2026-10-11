using Microsoft.EntityFrameworkCore;
using Turritopsis.Domain.Entities;
using Turritopsis.Modules.Companies.Application;
namespace Turritopsis.Modules.Companies.Infrastructure;
internal sealed class CompanyRepository(CompaniesDbContext db) : ICompanyRepository {
 public Task<CompanyUser?> FindMembershipAsync(Guid id,CancellationToken ct) => db.CompanyUsers.Include(c=>c.Company).FirstOrDefaultAsync(c=>c.UserId==id,ct);
 public async Task SaveAsync(CancellationToken ct) => await db.SaveChangesAsync(ct);
 public async Task CreateAsync(Company company,CompanyUser owner,CancellationToken ct) {
  await using var tx=await db.Database.BeginTransactionAsync(ct);db.Companies.Add(company);db.CompanyUsers.Add(owner);await db.SaveChangesAsync(ct);await tx.CommitAsync(ct);
 }
 public async Task<IReadOnlyList<Company>> ListAsync(CancellationToken ct) => await db.Companies.AsNoTracking().ToListAsync(ct);
 public async Task<IReadOnlyDictionary<Guid,string>> GetNamesAsync(IEnumerable<Guid> ids,CancellationToken ct) { var keys=ids.Distinct().ToArray();return await db.Companies.AsNoTracking().Where(c=>keys.Contains(c.Id)).ToDictionaryAsync(c=>c.Id,c=>c.Name,ct); }
}
