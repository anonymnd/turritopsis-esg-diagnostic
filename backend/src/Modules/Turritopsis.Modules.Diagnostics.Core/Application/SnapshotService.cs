using Turritopsis.SharedKernel;
using Turritopsis.Modules.Diagnostics.Application;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Common;
using Turritopsis.Application.Snapshots.Models;
using Turritopsis.Domain.Entities;


namespace Turritopsis.Modules.Diagnostics.Application;

public class SnapshotService : ISnapshotService, ISnapshotReader
{
    private readonly ISnapshotRepository _repository;
    private readonly ICompanyDirectory _companies;

    public SnapshotService(ISnapshotRepository repository, ICompanyDirectory companies)
    {
        _repository = repository;
        _companies = companies;
    }

    public async Task<SnapshotResult> GetForUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var membership = await FindMembershipAsync(userId, cancellationToken);
        if (membership is null)
        {
            return new SnapshotResult(MembershipAccess.Forbidden, null);
        }

        var entity = await _repository.GetAsync(membership.CompanyId, cancellationToken);
        var snapshot = entity is null ? null : new SnapshotDto(entity.CompanyId, entity.DataJson, entity.UpdatedAt);

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

        if (!membership.CanWrite)
        {
            return new SnapshotResult(MembershipAccess.Forbidden, null);
        }

        var existing = await _repository.GetAsync(membership.CompanyId, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        if (existing is null)
        {
            existing = new EsgSnapshot { Id = Guid.NewGuid(), CompanyId = membership.CompanyId, DataJson = dataJson, UpdatedAt = now };

        }
        else
        {
            existing.DataJson = dataJson;
            existing.UpdatedAt = now;
        }

        await _repository.SaveAsync(existing, cancellationToken);
        return new SnapshotResult(MembershipAccess.Granted, new SnapshotDto(existing.CompanyId, existing.DataJson, existing.UpdatedAt));
    }

    private Task<CompanyMembership?> FindMembershipAsync(Guid userId,CancellationToken ct) => _companies.FindMembershipAsync(userId,ct);
    public async Task<string> ReadForCompanyAsync(Guid companyId,CancellationToken ct) => (await _repository.GetAsync(companyId,ct))?.DataJson ?? "{}";
}
