using Turritopsis.SharedKernel;
using Turritopsis.Modules.Companies.Application;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Common;
using Turritopsis.Application.Companies.Models;
using Turritopsis.Domain.Entities;
using Turritopsis.Domain.Enums;

namespace Turritopsis.Modules.Companies.Application;

public class CompanyService : ICompanyService, ICompanyDirectory, ICompanyRegistration
{
    private readonly ICompanyRepository _repository;

    public CompanyService(ICompanyRepository repository)
    {
        _repository = repository;
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

        await _repository.SaveAsync(cancellationToken);
        return new CompanyProfileResult(MembershipAccess.Granted, ToDto(company, membership.Role));
    }

    private Task<CompanyUser?> FindMembershipAsync(Guid userId, CancellationToken cancellationToken) =>
        _repository.FindMembershipAsync(userId, cancellationToken);

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
    async Task<CompanyMembership?> ICompanyDirectory.FindMembershipAsync(Guid userId,CancellationToken ct) {
        var m=await _repository.FindMembershipAsync(userId,ct);return m is null?null:new CompanyMembership(m.CompanyId,m.Role.ToString());
    }
    public async Task<IReadOnlyList<CompanySummary>> ListCompaniesAsync(CancellationToken ct) => (await _repository.ListAsync(ct)).Select(c=>new CompanySummary(c.Id,c.Name,c.Sector)).ToList();
    public Task<IReadOnlyDictionary<Guid,string>> GetNamesAsync(IEnumerable<Guid> ids,CancellationToken ct) => _repository.GetNamesAsync(ids,ct);
    public async Task<Guid> CreateOwnedCompanyAsync(Guid userId,string name,string sector,string? city,CancellationToken ct) {
        var company=new Company {Id=Guid.NewGuid(),Name=name,Sector=sector,City=city,CreatedAt=DateTimeOffset.UtcNow};
        var owner=new CompanyUser {Id=Guid.NewGuid(),CompanyId=company.Id,UserId=userId,Role=CompanyRole.Owner,CreatedAt=DateTimeOffset.UtcNow};
        await _repository.CreateAsync(company,owner,ct);return company.Id;
    }
}