using Microsoft.EntityFrameworkCore;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Common;
using Turritopsis.Application.Companies.Models;
using Turritopsis.Domain.Entities;
using Turritopsis.Domain.Enums;
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
        var membership = await FindMembershipAsync(userId, cancellationToken);
        return membership is null ? null : ToDto(membership.Company, membership.Role);
    }

    public async Task<CompanyProfileResult> UpdateProfileAsync(Guid userId, UpdateCompanyProfileRequest request, CancellationToken cancellationToken)
    {
        var membership = await FindMembershipAsync(userId, cancellationToken);
        if (membership is null || membership.Role == CompanyRole.Viewer)
        {
            return new CompanyProfileResult(MembershipAccess.Forbidden, null);
        }

        var company = membership.Company;
        company.City = request.City;
        company.Ice = request.Ice;
        company.EmployeeRange = request.EmployeeRange;
        company.Website = request.Website;
        company.Phone = request.Phone;
        company.ActivityDescription = request.ActivityDescription;

        await _db.SaveChangesAsync(cancellationToken);
        return new CompanyProfileResult(MembershipAccess.Granted, ToDto(company, membership.Role));
    }

    private Task<CompanyUser?> FindMembershipAsync(Guid userId, CancellationToken cancellationToken) =>
        _db.CompanyUsers.Include(cu => cu.Company).FirstOrDefaultAsync(cu => cu.UserId == userId, cancellationToken);

    private static CompanyDto ToDto(Company company, CompanyRole role)
    {
        var isComplete = !string.IsNullOrWhiteSpace(company.Ice)
            && !string.IsNullOrWhiteSpace(company.EmployeeRange)
            && !string.IsNullOrWhiteSpace(company.Phone)
            && !string.IsNullOrWhiteSpace(company.ActivityDescription);

        return new CompanyDto(
            company.Id,
            company.Name,
            company.Sector,
            company.City,
            role.ToString(),
            company.Ice,
            company.EmployeeRange,
            company.Website,
            company.Phone,
            company.ActivityDescription,
            isComplete);
    }
}
