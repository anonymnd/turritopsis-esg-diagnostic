using Turritopsis.Application.Common;
namespace Turritopsis.Application.Dossiers.Models;
public record RevisionDto(Guid Id,Guid DossierId,int Number,Guid SubmittedBy,DateTimeOffset SubmittedAt,string SnapshotJson,
 int? DeclaredScore,int? ReviewedScore,string Status,int? FinalScore,string? Recommendations,Guid? ReviewerId,DateTimeOffset? ReviewedAt);
public record RevisionListResult(MembershipAccess Access,IReadOnlyList<RevisionDto> Revisions);
