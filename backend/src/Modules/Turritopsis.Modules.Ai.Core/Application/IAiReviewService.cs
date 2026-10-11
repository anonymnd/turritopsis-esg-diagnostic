using Turritopsis.Application.Ai.Models;

namespace Turritopsis.Application.Abstractions;

// A single AI-backed pass over either one questionnaire answer (PME side,
// "help me estimate this score") or a whole dossier (reviewer side,
// "does this declared score look right"). Falls back to a heuristic when
// no AI provider is configured — see AiReviewService.
public interface IAiReviewService
{
    Task<QuestionReviewResult> ReviewQuestionAsync(QuestionReviewRequest request, CancellationToken cancellationToken);
    Task<DossierReviewResult> ReviewDossierAsync(IReadOnlyList<DossierAnswerContext> answers, CancellationToken cancellationToken);
}
