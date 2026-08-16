namespace Turritopsis.Infrastructure.Email;

public class EmailOptions
{
    public const string SectionName = "Email";

    // Off by default — a redeploy with no config set should never start
    // sending mail. Mirrors AiOptions' empty-ApiKey-means-off convention.
    public bool Enabled { get; set; }
    public string ApiKey { get; set; } = string.Empty;
    public string FromAddress { get; set; } = "Turritopsis ESG <no-reply@turritopsis.org>";
}
