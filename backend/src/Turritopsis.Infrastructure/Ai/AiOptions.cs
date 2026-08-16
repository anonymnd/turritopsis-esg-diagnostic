namespace Turritopsis.Infrastructure.Ai;

public class AiOptions
{
    public const string SectionName = "Ai";

    // "groq" (or any OpenAI-compatible provider). Empty ApiKey means: use
    // the heuristic fallback instead of calling out to a real provider.
    public string Provider { get; set; } = "groq";
    public string BaseUrl { get; set; } = "https://api.groq.com/openai/v1";
    public string Model { get; set; } = "llama-3.3-70b-versatile";
    public string ApiKey { get; set; } = string.Empty;
}
