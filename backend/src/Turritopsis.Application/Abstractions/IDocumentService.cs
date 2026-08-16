using Turritopsis.Application.Common;
using Turritopsis.Application.Documents.Models;

namespace Turritopsis.Application.Abstractions;

public record DocumentListResult(MembershipAccess Access, IReadOnlyList<DocumentDto> Documents);
public record DocumentResult(MembershipAccess Access, DocumentDto? Document);
public record DocumentDetailResult(MembershipAccess Access, DocumentDetailDto? Document);

public interface IDocumentService
{
    Task<DocumentListResult> ListForUserAsync(Guid userId, CancellationToken cancellationToken);
    Task<DocumentResult> UploadAsync(Guid userId, UpsertDocumentRequest request, CancellationToken cancellationToken);
    Task<MembershipAccess> DeleteAsync(Guid userId, Guid documentId, CancellationToken cancellationToken);

    // Reviewer/admin OR a member of the dossier's own company — lets a
    // reviewer see the proofs a PME attached before validating a dossier.
    Task<DocumentListResult> ListForDossierAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken);

    // Same access rule, single document, including the file bytes (base64)
    // so the reviewer can actually open/download what was uploaded.
    Task<DocumentDetailResult> GetDetailAsync(Guid userId, bool isReviewer, Guid documentId, CancellationToken cancellationToken);
}
