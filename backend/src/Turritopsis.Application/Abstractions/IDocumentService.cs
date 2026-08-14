using Turritopsis.Application.Common;
using Turritopsis.Application.Documents.Models;

namespace Turritopsis.Application.Abstractions;

public record DocumentListResult(MembershipAccess Access, IReadOnlyList<DocumentDto> Documents);
public record DocumentResult(MembershipAccess Access, DocumentDto? Document);

public interface IDocumentService
{
    Task<DocumentListResult> ListForUserAsync(Guid userId, CancellationToken cancellationToken);
    Task<DocumentResult> UploadAsync(Guid userId, UpsertDocumentRequest request, CancellationToken cancellationToken);
    Task<MembershipAccess> DeleteAsync(Guid userId, Guid documentId, CancellationToken cancellationToken);
}
