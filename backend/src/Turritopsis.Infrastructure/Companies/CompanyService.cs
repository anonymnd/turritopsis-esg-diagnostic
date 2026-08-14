using Microsoft.EntityFrameworkCore;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Companies.Models;
using Turritopsis.Infrastructure.Persistence;

namespace Turritopsis.Infrastructure.Companies;

public class CompanyService : ICompanyService
{
    private readonly TurritopsisDbContext _db;

    public CompanyService(TurritopsisDbContext db)
    {
        _db = db;
    }

    public async Task<CompanyDto?> GetForUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _db.CompanyUsers
            .Where(cu => cu.UserId == userId)
            .Select(cu => new CompanyDto(
                cu.Company.Id,
                cu.Company.Name,
                cu.Company.Sector,
                cu.Company.City,
                cu.Role.ToString()))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
