namespace Turritopsis.Application.Snapshots.Models;

public record SnapshotDto(Guid CompanyId, string DataJson, DateTimeOffset UpdatedAt);

public record SnapshotResult(Turritopsis.Application.Common.MembershipAccess Access, SnapshotDto? Snapshot);
