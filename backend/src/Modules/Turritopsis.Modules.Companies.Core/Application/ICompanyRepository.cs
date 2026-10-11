using Turritopsis.Domain.Entities;
namespace Turritopsis.Modules.Companies.Application;
public interface ICompanyRepository {
 Task<CompanyUser?> FindMembershipAsync(Guid userId, CancellationToken ct);
 Task SaveAsync(CancellationToken ct);
 Task CreateAsync(Company company, CompanyUser owner, CancellationToken ct);
 Task<IReadOnlyList<Company>> ListAsync(CancellationToken ct);
 Task<IReadOnlyDictionary<Guid,string>> GetNamesAsync(IEnumerable<Guid> ids, CancellationToken ct);
}
