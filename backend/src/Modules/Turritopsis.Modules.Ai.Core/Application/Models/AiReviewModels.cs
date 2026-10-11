namespace Turritopsis.Application.Ai.Models;

public record QuestionReviewRequest(string QuestionCode, string QuestionTitle, string? SelectedScore, string? ProofText);

public record QuestionReviewResult(
    double? SuggestedScore,
    int Confidence,
    string ProofStrength,
    string RiskLevel,
    string Summary,
    IReadOnlyList<string> MissingEvidence)
{
    public AiPrivacyInfo Privacy { get; init; } = AiPrivacyInfo.Local;
}

public record DossierAnswerContext(string QuestionCode, string QuestionTitle, string? SelectedScore, string? ProofText);

public record DossierReviewResult(
    string Assessment,
    string Summary,
    int? RecommendedScore,
    IReadOnlyList<DossierFlag> FlaggedQuestions)
{
    public AiPrivacyInfo Privacy { get; init; } = AiPrivacyInfo.Local;
}

public record DossierFlag(string QuestionCode, string Reason);

public record AiPrivacyInfo(string Mode, bool RawDocumentTextSent, bool RequiresHumanVerification)
{
    public static AiPrivacyInfo Local => new("local-only", false, true);
    public static AiPrivacyInfo Remote => new("signals-only", false, true);
}
