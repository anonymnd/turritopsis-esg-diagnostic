using Turritopsis.Application.Companies.Models;

namespace Turritopsis.Application.Abstractions;

public interface ICompanyService
{
    Task<CompanyDto?> GetForUserAsync(Guid userId, CancellationToken cancellationToken);
}
