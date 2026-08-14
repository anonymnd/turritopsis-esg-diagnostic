namespace Turritopsis.Application.Companies.Models;

public record CompanyDto(Guid Id, string Name, string Sector, string? City, string Role);
