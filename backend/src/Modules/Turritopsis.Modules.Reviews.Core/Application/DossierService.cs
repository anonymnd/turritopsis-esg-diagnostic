using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Ai.Models;
using Turritopsis.Application.Common;
using Turritopsis.Application.Dossiers.Models;

namespace Turritopsis.Modules.Reviews.Application;

// Compatibility facade; HTTP endpoints use the separate command/query ports.
public sealed class DossierService(IDossierQueries queries, IDossierCommands commands) : IDossierService
{
    public Task<DossierListResult> GetHistoryAsync(Guid userId,CancellationToken ct) => queries.GetHistoryAsync(userId,ct);
    public Task<RevisionListResult> GetRevisionsAsync(Guid userId,bool isReviewer,Guid dossierId,CancellationToken ct) => queries.GetRevisionsAsync(userId,isReviewer,dossierId,ct);
    public Task<DossierListResult> GetQueueAsync(bool isReviewer, bool includeAll, CancellationToken cancellationToken) => queries.GetQueueAsync(isReviewer, includeAll, cancellationToken);
    public Task<DossierResult> GetForCompanyOwnerAsync(Guid userId, CancellationToken cancellationToken) => queries.GetForCompanyOwnerAsync(userId, cancellationToken);
    public Task<DossierResult> GetByIdAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken) => queries.GetByIdAsync(userId, isReviewer, dossierId, cancellationToken);
    public Task<DossierResult> SubmitAsync(Guid userId, int? declaredScore, int? reviewedScore, CancellationToken cancellationToken) => commands.SubmitAsync(userId, declaredScore, reviewedScore, cancellationToken);
    public Task<DossierResult> UpdateStatusAsync(Guid userId, Guid dossierId, string status, int? finalScore, string? recommendations, CancellationToken cancellationToken, Guid? revisionId = null) => commands.UpdateStatusAsync(userId, dossierId, status, finalScore, recommendations, cancellationToken, revisionId);
    public Task<DossierNoteListResult> GetNotesAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken) => queries.GetNotesAsync(userId, isReviewer, dossierId, cancellationToken);
    public Task<MembershipAccess> AddNoteAsync(Guid userId, bool isReviewer, Guid dossierId, string? questionCode, string text, CancellationToken cancellationToken, Guid? revisionId = null) => commands.AddNoteAsync(userId, isReviewer, dossierId, questionCode, text, cancellationToken, revisionId);
    public Task<DossierAiContextResult> GetAiContextAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken, Guid? revisionId = null) => queries.GetAiContextAsync(userId, isReviewer, dossierId, cancellationToken, revisionId);
}
