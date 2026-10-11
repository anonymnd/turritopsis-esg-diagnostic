namespace Turritopsis.SharedKernel;
public record FrozenEvidenceItem(Guid Id, Guid OriginalDocumentId, string QuestionCode, string? Label,
 string? TextContent, string? FileName, Guid? UploadedBy, DateTimeOffset CreatedAt, string? Sha256, byte[]? Content = null);
public interface IFrozenEvidenceStore {
 Task<Guid> CaptureAsync(Guid companyId, Guid actorId, CancellationToken ct);
 Task<IReadOnlyList<FrozenEvidenceItem>> ReadAsync(Guid companyId, Guid snapshotId, CancellationToken ct);
 Task<FrozenEvidenceItem?> ReadItemAsync(Guid companyId, Guid snapshotId, Guid itemId, CancellationToken ct);
}
public record DossierEvidenceLocation(Guid CompanyId, Guid? SnapshotId);
public interface IDossierEvidenceLocator {
 Task<DossierEvidenceLocation?> LocateAsync(Guid dossierId, Guid? revisionId, CancellationToken ct);
}
public sealed class EvidenceCaptureException(string message) : Exception(message);
