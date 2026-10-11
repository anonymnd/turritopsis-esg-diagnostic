using Turritopsis.Application.Ai.Models;
using Turritopsis.Application.Common;
using Turritopsis.Application.Dossiers.Models;

namespace Turritopsis.Application.Abstractions;

public record DossierListResult(MembershipAccess Access, IReadOnlyList<DossierDto> Dossiers);
public record DossierResult(MembershipAccess Access, DossierDto? Dossier, string? Error = null);
public record DossierNoteListResult(MembershipAccess Access, IReadOnlyList<DossierNoteDto> Notes);
public record DossierAiContextResult(MembershipAccess Access, IReadOnlyList<DossierAnswerContext> Answers);

public interface IDossierQueries
{
    Task<DossierListResult> GetHistoryAsync(Guid userId,CancellationToken ct);
    Task<RevisionListResult> GetRevisionsAsync(Guid userId,bool isReviewer,Guid dossierId,CancellationToken ct);
    Task<DossierListResult> GetQueueAsync(bool isReviewer, bool includeAll, CancellationToken cancellationToken);
    Task<DossierResult> GetForCompanyOwnerAsync(Guid userId, CancellationToken cancellationToken);
    Task<DossierResult> GetByIdAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken);
    Task<DossierNoteListResult> GetNotesAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken);
    Task<DossierAiContextResult> GetAiContextAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken, Guid? revisionId = null);
}

public interface IDossierCommands
{
    Task<DossierResult> SubmitAsync(Guid userId, int? declaredScore, int? reviewedScore, CancellationToken cancellationToken);
    Task<DossierResult> UpdateStatusAsync(Guid userId, Guid dossierId, string status, int? finalScore, string? recommendations, CancellationToken cancellationToken, Guid? revisionId = null);
    Task<MembershipAccess> AddNoteAsync(Guid userId, bool isReviewer, Guid dossierId, string? questionCode, string text, CancellationToken cancellationToken, Guid? revisionId = null);
}

public interface IDossierService : IDossierQueries, IDossierCommands
{
}
