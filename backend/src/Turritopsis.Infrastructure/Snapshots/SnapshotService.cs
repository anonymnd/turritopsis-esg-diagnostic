using Microsoft.EntityFrameworkCore;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Common;
using Turritopsis.Application.Snapshots.Models;
using Turritopsis.Domain.Entities;
using Turritopsis.Domain.Enums;
using Turritopsis.Infrastructure.Persistence;

namespace Turritopsis.Infrastructure.Snapshots;

public class SnapshotService : ISnapshotService
{
    private readonly TurritopsisDbContext _db;

    public SnapshotService(TurritopsisDbContext db)
    {
        _db = db;
    }

    public async Task<SnapshotResult> GetForUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var membership = await FindMembershipAsync(userId, cancellationToken);
        if (membership is null)
        {
            return new SnapshotResult(MembershipAccess.Forbidden, null);
        }

        var snapshot = await _db.EsgSnapshots
            .Where(s => s.CompanyId == membership.CompanyId)
            .Select(s => new SnapshotDto(s.CompanyId, s.DataJson, s.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);

        // No row yet is a normal "questionnaire not started" state, not an
        // error — the caller still has access, there's just nothing saved.
        return new SnapshotResult(MembershipAccess.Granted, snapshot);
    }

    public async Task<SnapshotResult> UpsertForUserAsync(Guid userId, string dataJson, CancellationToken cancellationToken)
    {
        var membership = await FindMembershipAsync(userId, cancellationToken);
        if (membership is null)
        {
            return new SnapshotResult(MembershipAccess.Forbidden, null);
        }

        if (membership.Role == CompanyRole.Viewer)
        {
            return new SnapshotResult(MembershipAccess.Forbidden, null);
        }

        var existing = await _db.EsgSnapshots.FirstOrDefaultAsync(s => s.CompanyId == membership.CompanyId, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        if (existing is null)
        {
            existing = new EsgSnapshot { Id = Guid.NewGuid(), CompanyId = membership.CompanyId, DataJson = dataJson, UpdatedAt = now };
            _db.EsgSnapshots.Add(existing);
        }
        else
        {
            existing.DataJson = dataJson;
            existing.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return new SnapshotResult(MembershipAccess.Granted, new SnapshotDto(existing.CompanyId, existing.DataJson, existing.UpdatedAt));
    }

    private Task<CompanyUser?> FindMembershipAsync(Guid userId, CancellationToken cancellationToken) =>
        _db.CompanyUsers.FirstOrDefaultAsync(cu => cu.UserId == userId, cancellationToken);
}
