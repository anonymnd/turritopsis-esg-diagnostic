using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Turritopsis.Application.Ai;
using Turritopsis.Application.Ai.Models;

namespace Turritopsis.Modules.Ai.Application;

// A closed-schema projection, NOT regex redaction of text. Matching is local;
// only booleans and public/finite catalog values may cross the AI boundary.
public static class AiEvidencePrivacyFilter
{
    private const int MaxLocalText = 64_000;
    private static readonly TimeSpan MatchTimeout = TimeSpan.FromMilliseconds(100);

    public static SafeQuestionEvidence Project(string? questionCode, string? selectedScore, string? proofText)
    {
        var known = questionCode is not null && QuestionCatalog.Titles.ContainsKey(questionCode);
        var code = known ? questionCode! : "UNKNOWN";
        var score = selectedScore is "0" or "0.5" or "1" or "NA" ? selectedScore : "unknown";
        var text = proofText ?? string.Empty;
        text = text[..Math.Min(text.Length, MaxLocalText)];
        var normalized = new StringBuilder();
        foreach (var c in text.Normalize(NormalizationForm.FormD))
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                normalized.Append(char.ToLowerInvariant(c));
        }
        var local = normalized.ToString();
        bool Has(string pattern) => Regex.IsMatch(local, pattern, RegexOptions.CultureInvariant, MatchTimeout);
        return new SafeQuestionEvidence(
            code,
            known ? QuestionCatalog.Titles[code] : "Critere ESG inconnu",
            known ? code[..1] : "unknown",
            score,
            new SafeEvidenceSignals(
                !string.IsNullOrWhiteSpace(text),
                Has(@"\b(audit|audits)\b"),
                Has(@"\b(certificat|certificats|certification|certifications|certificate|certificates|iso)\b"),
                Has(@"\b(politique|politiques|policy|policies|charte|chartes)\b"),
                Has(@"\b(facture|factures|invoice|invoices)\b"),
                Has(@"\b(rapport|rapports|report|reports|bilan|bilans)\b"),
                Has(@"\b(registre|registres|register|registers)\b"),
                Has(@"\b(formation|formations|training)\b"),
                Has(@"\b(dashboard|suivi|monitoring|indicateur|indicateurs|kpi)\b"),
                Has(@"\b(?:19|20)\d{2}\b|\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b")));
    }

    public static IReadOnlyList<SafeQuestionEvidence> ProjectDossier(IReadOnlyList<DossierAnswerContext> answers)
    {
        // Fixed catalog order, one item per criterion; arbitrary/duplicate codes
        // cannot be used as prompt text or inflate the remote request.
        var safe = new List<SafeQuestionEvidence>();
        foreach (var code in QuestionCatalog.Titles.Keys)
        {
            var answer = answers.FirstOrDefault(a => a.QuestionCode == code);
            if (answer is not null) safe.Add(Project(code, answer.SelectedScore, answer.ProofText));
        }
        return safe;
    }
}

public sealed record SafeQuestionEvidence(string Criterion, string PublicTitle, string Pillar, string DeclaredScore, SafeEvidenceSignals Signals);

public sealed record SafeEvidenceSignals(
    bool TextProvided, bool AuditMentioned, bool CertificateMentioned,
    bool PolicyMentioned, bool InvoiceMentioned, bool ReportMentioned,
    bool RegisterMentioned, bool TrainingMentioned, bool MonitoringMentioned,
    bool DateMentioned)
{
    // Explicit method prevents this local convenience count becoming a JSON field.
    public int MentionCount() => new[] { AuditMentioned, CertificateMentioned, PolicyMentioned,
        InvoiceMentioned, ReportMentioned, RegisterMentioned, TrainingMentioned, MonitoringMentioned }.Count(x => x);
}
