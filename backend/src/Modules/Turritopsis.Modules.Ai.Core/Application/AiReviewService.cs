
using System.Text.Json;


using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Ai.Models;

namespace Turritopsis.Modules.Ai.Application;

// Talks to any OpenAI-compatible chat-completions API (Groq by default —
// same request/response shape as OpenAI). When no ApiKey is configured,
// every call falls back to a heuristic instead of failing, so the
// feature still works (just less precisely) with zero external
// dependency.
public class AiReviewService : IAiReviewService
{
    private readonly IAiProvider _provider;
    private readonly IAiFailureReporter _reporter;
    public AiReviewService(IAiProvider provider,IAiFailureReporter reporter) { _provider=provider;_reporter=reporter; }

    public async Task<QuestionReviewResult> ReviewQuestionAsync(QuestionReviewRequest request, CancellationToken cancellationToken)
    {
        if (!_provider.Enabled)
        {
            return HeuristicQuestionReview(request);
        }

        try
        {
            var safe = AiEvidencePrivacyFilter.Project(request.QuestionCode, request.SelectedScore, request.ProofText);
            var content = await _provider.ReviewAsync(new[] { safe }, false, cancellationToken);
            return ParseQuestionReview(content) with { Privacy = AiPrivacyInfo.Remote };
        }
        catch (Exception ex)
        {
            // Provider/transport exceptions can contain echoed request bodies.
            // Never log the exception or its message with enterprise data.
            _reporter.Report("question",ex.GetType().Name);
            var fallback = HeuristicQuestionReview(request);
            return fallback with { Summary = $"Analyse IA indisponible, revue heuristique utilisee. {fallback.Summary}", Privacy = AiPrivacyInfo.Remote };
        }
    }

    public async Task<DossierReviewResult> ReviewDossierAsync(IReadOnlyList<DossierAnswerContext> answers, CancellationToken cancellationToken)
    {
        if (!_provider.Enabled)
        {
            return HeuristicDossierReview(answers);
        }

        try
        {
            var safe = AiEvidencePrivacyFilter.ProjectDossier(answers);
            var content = await _provider.ReviewAsync(safe, true, cancellationToken);
            return ParseDossierReview(content) with { Privacy = AiPrivacyInfo.Remote };
        }
        catch (Exception ex)
        {
            _reporter.Report("dossier",ex.GetType().Name);
            var fallback = HeuristicDossierReview(answers);
            return fallback with { Summary = $"Analyse IA indisponible, revue heuristique utilisee. {fallback.Summary}", Privacy = AiPrivacyInfo.Remote };
        }
    }

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private static string StripFences(string raw)
    {
        var trimmed = raw.Trim();
        if (trimmed.StartsWith("```"))
        {
            var firstNewline = trimmed.IndexOf('\n');
            trimmed = firstNewline >= 0 ? trimmed[(firstNewline + 1)..] : trimmed;
        }
        if (trimmed.EndsWith("```")) trimmed = trimmed[..^3];
        var start = trimmed.IndexOf('{');
        var end = trimmed.LastIndexOf('}');
        return start >= 0 && end > start ? trimmed[start..(end + 1)] : trimmed;
    }

    private static QuestionReviewResult ParseQuestionReview(string content)
    {
        var json = JsonSerializer.Deserialize<JsonElement>(StripFences(content), JsonOptions);
        double? suggestedScore = json.TryGetProperty("suggestedScore", out var s) && s.ValueKind != JsonValueKind.Null ? s.GetDouble() : null;
        var confidence = json.TryGetProperty("confidence", out var c) ? (int)c.GetDouble() : 50;
        var missing = json.TryGetProperty("missingEvidence", out var m) && m.ValueKind == JsonValueKind.Array
            ? m.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => x.Length > 0).ToList()
            : new List<string>();

        return new QuestionReviewResult(
            suggestedScore,
            confidence,
            json.TryGetProperty("proofStrength", out var ps) ? ps.GetString() ?? "moyenne" : "moyenne",
            json.TryGetProperty("riskLevel", out var rl) ? rl.GetString() ?? "modere" : "modere",
            json.TryGetProperty("summary", out var sm) ? sm.GetString() ?? "" : "",
            missing);
    }

    private static DossierReviewResult ParseDossierReview(string content)
    {
        var json = JsonSerializer.Deserialize<JsonElement>(StripFences(content), JsonOptions);
        var flags = new List<DossierFlag>();
        if (json.TryGetProperty("flaggedQuestions", out var fq) && fq.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in fq.EnumerateArray())
            {
                var code = item.TryGetProperty("questionCode", out var qc) ? qc.GetString() ?? "" : "";
                var reason = item.TryGetProperty("reason", out var r) ? r.GetString() ?? "" : "";
                if (code.Length > 0) flags.Add(new DossierFlag(code, reason));
            }
        }

        return new DossierReviewResult(
            json.TryGetProperty("assessment", out var a) ? a.GetString() ?? "revue manuelle requise" : "revue manuelle requise",
            json.TryGetProperty("summary", out var sm) ? sm.GetString() ?? "" : "",
            json.TryGetProperty("recommendedScore", out var rs) && rs.ValueKind != JsonValueKind.Null ? (int)rs.GetDouble() : null,
            flags);
    }

    private static QuestionReviewResult HeuristicQuestionReview(QuestionReviewRequest request)
    {
        var safe = AiEvidencePrivacyFilter.Project(request.QuestionCode, request.SelectedScore, request.ProofText);
        var signalCount = safe.Signals.MentionCount();
        var declared = safe.DeclaredScore switch { "1" => 1d, "0.5" => 0.5d, _ => 0d };
        var strong = signalCount >= 2;

        return new QuestionReviewResult(
            strong ? declared : Math.Min(declared, 0.5),
            strong ? 60 : 40,
            strong ? "moyenne" : "faible",
            strong ? "modere" : "eleve",
            "Revue locale provisoire sur des indices de preuve : le reviseur doit verifier les documents originaux.",
            new[] { "Document source identifiable", "Date ou periode de reporting", "Responsable ou validation interne" });
    }

    private static DossierReviewResult HeuristicDossierReview(IReadOnlyList<DossierAnswerContext> answers)
    {
        var flags = new List<DossierFlag>();
        foreach (var a in AiEvidencePrivacyFilter.ProjectDossier(answers))
        {
            var declaredHigh = a.DeclaredScore == "1" || a.DeclaredScore == "0.5";
            var hasStrongProof = a.Signals.MentionCount() >= 2;
            if (declaredHigh && !hasStrongProof)
            {
                flags.Add(new DossierFlag(a.Criterion, "Score eleve declare mais preuve faible ou absente."));
            }
        }

        var assessment = flags.Count == 0 ? "revue manuelle requise" : flags.Count >= 4 ? "score probablement surestime" : "preuves insuffisantes";
        var summary = flags.Count == 0
            ? "Revue locale provisoire : des indices ont ete trouves. Ils ne prouvent pas la conformite ; verifiez les documents originaux."
            : $"Revue locale provisoire : {flags.Count} critere(s) avec un score eleve ont peu d'indices de preuve. Verifiez les documents originaux avant validation.";

        return new DossierReviewResult(assessment, summary, null, flags);
    }
}
