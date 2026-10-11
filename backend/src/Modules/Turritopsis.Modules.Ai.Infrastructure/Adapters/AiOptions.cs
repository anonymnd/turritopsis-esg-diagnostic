using Turritopsis.Modules.Ai.Application;
namespace Turritopsis.Modules.Ai.Infrastructure;

public class AiOptions
{
    public const string SectionName = "Ai";

    // "groq" (or any OpenAI-compatible provider). Empty ApiKey means: use
    // the heuristic fallback instead of calling out to a real provider.
    public string Provider { get; set; } = "groq";
    public string BaseUrl { get; set; } = "https://api.groq.com/openai/v1";
    public string Model { get; set; } = "llama-3.3-70b-versatile";
    public string ApiKey { get; set; } = string.Empty;

    // Set Ai__AllowRemote=false for local heuristic review without any AI
    // provider calls. When true, only the closed-schema privacy projection
    // may leave the server. There is deliberately no raw-document override.
    public bool AllowRemote { get; set; } = true;
}
