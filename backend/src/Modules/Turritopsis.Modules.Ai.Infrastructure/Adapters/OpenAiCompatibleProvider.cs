using Turritopsis.Modules.Ai.Application;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
namespace Turritopsis.Modules.Ai.Infrastructure;
public sealed class OpenAiCompatibleProvider(HttpClient http,IOptions<AiOptions> options) : IAiProvider {
 private readonly HttpClient _http=http;
 private AiOptions _options=>options.Value;
 public bool Enabled=>_options.AllowRemote&&!string.IsNullOrEmpty(_options.ApiKey);
    public async Task<string> ReviewAsync(IReadOnlyList<SafeQuestionEvidence> evidence, bool dossier, CancellationToken cancellationToken)
    {
        var prompt = BuildSafePrompt(evidence, dossier);
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_options.BaseUrl.TrimEnd('/')}/chat/completions")
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

        using var response = await _http.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
        return payload.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";
    }

    private static string BuildSafePrompt(IReadOnlyList<SafeQuestionEvidence> evidence, bool dossier)
    {
        var schema = dossier
            ? "assessment (coherent / preuves insuffisantes / revue manuelle requise), summary, recommendedScore (0-100 ou null), flaggedQuestions (liste {questionCode, reason})"
            : "suggestedScore (0, 0.5 ou 1), confidence (0-100), proofStrength, riskLevel, summary, missingEvidence (liste)";
        return string.Join("\n", new[]
        {
            "Tu aides un reviseur humain ESG. Les documents restent sur le serveur de l'application.",
            "Tu recois uniquement des indices booleens extraits localement, jamais le texte des documents ni leurs details.",
            "Un indice signifie qu'un mot est mentionne. Il ne prouve ni conformite, ni authenticite, ni adequation au critere.",
            "Ne deduis pas de noms, montants, dates, identifiants ou faits absents. Ne pretends pas avoir lu les documents.",
            "Reste prudent: les scores declares sont provisoires et la verification humaine est obligatoire.",
            $"Retourne uniquement un JSON valide avec : {schema}.",
            "Donnees minimisees :",
            JsonSerializer.Serialize(evidence, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })
        });
    }

}
