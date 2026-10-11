namespace Turritopsis.Application.Companies.Models;

public record CompanyDto(
    Guid Id,
    string Name,
    string Sector,
    string? City,
    string Role,
    string? Ice,
    string? EmployeeRange,
    string? Website,
    string? Phone,
    string? ActivityDescription,
    bool IsProfileComplete);

public record UpdateCompanyProfileRequest(string? City, string? Ice, string? EmployeeRange, string? Website, string? Phone, string? ActivityDescription);
