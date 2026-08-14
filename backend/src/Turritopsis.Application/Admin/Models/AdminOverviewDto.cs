namespace Turritopsis.Application.Admin.Models;

public record AdminCompanyDto(Guid Id, string Name, string Sector, string? DossierStatus, int? Score);
public record AdminAuditLogDto(Guid Id, Guid? ActorId, Guid? CompanyId, string Action, DateTimeOffset CreatedAt);

public record AdminOverviewDto(
    IReadOnlyList<AdminCompanyDto> Companies,
    IReadOnlyList<AdminAuditLogDto> AuditLog);
