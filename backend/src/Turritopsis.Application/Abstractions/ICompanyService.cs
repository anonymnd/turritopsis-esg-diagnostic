using Turritopsis.Application.Common;
using Turritopsis.Application.Companies.Models;

namespace Turritopsis.Application.Abstractions;

public record CompanyProfileResult(MembershipAccess Access, CompanyDto? Company);

public interface ICompanyService
{
    Task<CompanyDto?> GetForUserAsync(Guid userId, CancellationToken cancellationToken);
    Task<CompanyProfileResult> UpdateProfileAsync(Guid userId, UpdateCompanyProfileRequest request, CancellationToken cancellationToken);
}
