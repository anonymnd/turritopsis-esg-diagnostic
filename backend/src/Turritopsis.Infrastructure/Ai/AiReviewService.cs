using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Ai.Models;

namespace Turritopsis.Infrastructure.Ai;

// Talks to any OpenAI-compatible chat-completions API (Groq by default —
// same request/response shape as OpenAI). When no ApiKey is configured,
// every call falls back to a heuristic instead of failing, so the
// feature still works (just less precisely) with zero external
// dependency — mirrors the old Node prototype's design.
public class AiReviewService : IAiReviewService
{
    private static readonly string[] StrongSignalWords =
        { "audit", "certificat", "iso", "rapport", "facture", "dashboard", "registre", "politique", "preuve", "controle" };

    private readonly HttpClient _http;
    private readonly AiOptions _options;
    private readonly ILogger<AiReviewService> _logger;

    public AiReviewService(HttpClient http, IOptions<AiOptions> options, ILogger<AiReviewService> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<QuestionReviewResult> ReviewQuestionAsync(QuestionReviewRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(_options.ApiKey))
        {
            return HeuristicQuestionReview(request);
        }

        var prompt = BuildQuestionPrompt(request);
        try
        {
            var content = await CallChatCompletionsAsync(prompt, cancellationToken);
            return ParseQuestionReview(content);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI question review failed, falling back to heuristic");
            var fallback = HeuristicQuestionReview(request);
            return fallback with { Summary = $"Analyse IA indisponible, revue heuristique utilisee. {fallback.Summary}" };
        }
    }

    public async Task<DossierReviewResult> ReviewDossierAsync(IReadOnlyList<DossierAnswerContext> answers, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(_options.ApiKey))
        {
            return HeuristicDossierReview(answers);
        }

        var prompt = BuildDossierPrompt(answers);
        try
        {
            var content = await CallChatCompletionsAsync(prompt, cancellationToken);
            return ParseDossierReview(content);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI dossier review failed, falling back to heuristic");
            var fallback = HeuristicDossierReview(answers);
            return fallback with { Summary = $"Analyse IA indisponible, revue heuristique utilisee. {fallback.Summary}" };
        }
    }

    private async Task<string> CallChatCompletionsAsync(string prompt, CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"{_options.BaseUrl.TrimEnd('/')}/chat/completions")
        {
            Content = JsonContent.Create(new
            {
                model = _options.Model,
                messages = new[] { new { role = "user", content = prompt } },
                temperature = 0.2,
                response_format = new { type = "json_object" }
            })
        };
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _options.ApiKey);

        var response = await _http.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
        return payload.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";
    }

    private static string BuildQuestionPrompt(QuestionReviewRequest request) => string.Join("\n", new[]
    {
        "Tu es un auditeur ESG pour PME marocaines. Analyse la reponse et la preuve fournie pour un critere.",
        "Retourne uniquement un JSON valide avec : suggestedScore (0, 0.5 ou 1), confidence (0-100), proofStrength (faible/moyenne/forte), riskLevel (faible/modere/eleve), summary (une phrase), missingEvidence (liste courte).",
        "N'utilise pas de Markdown ni de bloc ```json. La reponse doit commencer par { et finir par }.",
        "",
        $"Critere : {request.QuestionCode} - {request.QuestionTitle}",
        $"Score declare par la PME : {request.SelectedScore ?? "non renseigne"}",
        $"Preuve fournie : {(string.IsNullOrWhiteSpace(request.ProofText) ? "aucune" : request.ProofText)}"
    });

    private static string BuildDossierPrompt(IReadOnlyList<DossierAnswerContext> answers)
    {
        var lines = new List<string>
        {
            "Tu es un auditeur ESG senior qui aide un reviseur humain a valider un dossier PME.",
            "Pour chaque critere ci-dessous, la PME a declare un score et fourni une preuve (ou non).",
            "Analyse la coherence globale entre les scores declares et les preuves fournies.",
            "Retourne uniquement un JSON valide avec : assessment (une des valeurs : \"coherent\", \"score probablement surestime\", \"preuves insuffisantes\", \"revue manuelle requise\"), summary (2-3 phrases pour le reviseur), recommendedScore (0-100, note globale suggeree ou null), flaggedQuestions (liste d'objets {questionCode, reason} pour les criteres les plus douteux, vide si aucun).",
            "N'utilise pas de Markdown ni de bloc ```json. La reponse doit commencer par { et finir par }.",
            ""
        };
        foreach (var a in answers)
        {
            lines.Add($"- {a.QuestionCode} ({a.QuestionTitle}) : score={a.SelectedScore ?? "?"} ; preuve={(string.IsNullOrWhiteSpace(a.ProofText) ? "aucune" : a.ProofText)}");
        }
        return string.Join("\n", lines);
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
        var text = (request.ProofText ?? "").ToLowerInvariant();
        var signalCount = StrongSignalWords.Count(word => text.Contains(word));
        var declared = double.TryParse(request.SelectedScore, out var parsed) ? parsed : 0;
        var strong = signalCount >= 2;

        return new QuestionReviewResult(
            strong ? declared : Math.Min(declared, 0.5),
            strong ? 74 : 48,
            strong ? "moyenne" : "faible",
            strong ? "modere" : "eleve",
            "Analyse automatique provisoire : ajoutez des preuves datees, verifiables et reliees a la pratique.",
            new[] { "Document source identifiable", "Date ou periode de reporting", "Responsable ou validation interne" });
    }

    private static DossierReviewResult HeuristicDossierReview(IReadOnlyList<DossierAnswerContext> answers)
    {
        var flags = new List<DossierFlag>();
        foreach (var a in answers)
        {
            var declaredHigh = a.SelectedScore == "1" || a.SelectedScore == "0.5";
            var text = (a.ProofText ?? "").ToLowerInvariant();
            var hasStrongProof = StrongSignalWords.Count(word => text.Contains(word)) >= 2;
            if (declaredHigh && !hasStrongProof)
            {
                flags.Add(new DossierFlag(a.QuestionCode, "Score eleve declare mais preuve faible ou absente."));
            }
        }

        var assessment = flags.Count == 0 ? "coherent" : flags.Count >= 4 ? "score probablement surestime" : "preuves insuffisantes";
        var summary = flags.Count == 0
            ? "Analyse automatique provisoire : les scores declares semblent globalement appuyes par des preuves."
            : $"Analyse automatique provisoire : {flags.Count} critere(s) declares avec un score eleve manquent de preuve solide. Verifiez ces criteres avant validation.";

        return new DossierReviewResult(assessment, summary, null, flags);
    }
}
