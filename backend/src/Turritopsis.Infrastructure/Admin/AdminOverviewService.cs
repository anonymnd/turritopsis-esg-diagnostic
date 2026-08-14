using Microsoft.EntityFrameworkCore;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Admin.Models;
using Turritopsis.Infrastructure.Persistence;

namespace Turritopsis.Infrastructure.Admin;

public class AdminOverviewService : IAdminOverviewService
{
    private readonly TurritopsisDbContext _db;

    public AdminOverviewService(TurritopsisDbContext db)
    {
        _db = db;
    }

    public async Task<AdminOverviewDto> GetOverviewAsync(CancellationToken cancellationToken)
    {
        var companies = await _db.Companies
            .Select(c => new AdminCompanyDto(
                c.Id,
                c.Name,
                c.Sector,
                _db.Dossiers.Where(d => d.CompanyId == c.Id).OrderByDescending(d => d.CreatedAt).Select(d => d.Status.ToString()).FirstOrDefault(),
                _db.Dossiers.Where(d => d.CompanyId == c.Id).OrderByDescending(d => d.CreatedAt).Select(d => d.FinalScore ?? d.ReviewedScore).FirstOrDefault()))
            .ToListAsync(cancellationToken);

        var auditLog = await _db.AuditLogs
            .OrderByDescending(a => a.CreatedAt)
            .Take(50)
            .Select(a => new AdminAuditLogDto(a.Id, a.ActorId, a.CompanyId, a.Action, a.CreatedAt))
            .ToListAsync(cancellationToken);

        return new AdminOverviewDto(companies, auditLog);
    }
}
