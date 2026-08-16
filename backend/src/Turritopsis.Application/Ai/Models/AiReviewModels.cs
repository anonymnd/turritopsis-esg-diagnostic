namespace Turritopsis.Application.Ai.Models;

public record QuestionReviewRequest(string QuestionCode, string QuestionTitle, string? SelectedScore, string? ProofText);

public record QuestionReviewResult(
    double? SuggestedScore,
    int Confidence,
    string ProofStrength,
    string RiskLevel,
    string Summary,
    IReadOnlyList<string> MissingEvidence);

public record DossierAnswerContext(string QuestionCode, string QuestionTitle, string? SelectedScore, string? ProofText);

public record DossierReviewResult(
    string Assessment,
    string Summary,
    int? RecommendedScore,
    IReadOnlyList<DossierFlag> FlaggedQuestions);

public record DossierFlag(string QuestionCode, string Reason);
