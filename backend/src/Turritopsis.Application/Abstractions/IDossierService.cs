using Turritopsis.Application.Ai.Models;
using Turritopsis.Application.Common;
using Turritopsis.Application.Dossiers.Models;

namespace Turritopsis.Application.Abstractions;

public record DossierListResult(MembershipAccess Access, IReadOnlyList<DossierDto> Dossiers);
public record DossierResult(MembershipAccess Access, DossierDto? Dossier);
public record DossierNoteListResult(MembershipAccess Access, IReadOnlyList<DossierNoteDto> Notes);
public record DossierAiContextResult(MembershipAccess Access, IReadOnlyList<DossierAnswerContext> Answers);

public interface IDossierService
{
    // Reviewer/admin queue — role-based, not membership-based.
    Task<DossierListResult> GetQueueAsync(bool isReviewer, bool includeAll, CancellationToken cancellationToken);

    // A PME's own latest dossier, membership-checked.
    Task<DossierResult> GetForCompanyOwnerAsync(Guid userId, CancellationToken cancellationToken);

    // Reviewer/admin OR a member of the dossier's own company.
    Task<DossierResult> GetByIdAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken);

    // Owner/collaborator only. Freezes the current snapshot into the dossier.
    Task<DossierResult> SubmitAsync(Guid userId, int? declaredScore, int? reviewedScore, CancellationToken cancellationToken);

    // Reviewer/admin only.
    Task<DossierResult> UpdateStatusAsync(Guid userId, Guid dossierId, string status, int? finalScore, string? recommendations, CancellationToken cancellationToken);

    Task<DossierNoteListResult> GetNotesAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken);
    Task<MembershipAccess> AddNoteAsync(Guid userId, bool isReviewer, Guid dossierId, string? questionCode, string text, CancellationToken cancellationToken);

    // Reviewer/admin only. Gathers the frozen snapshot answers joined with
    // each question's proof (note + file name) for the AI dossier review.
    Task<DossierAiContextResult> GetAiContextAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken);
}
