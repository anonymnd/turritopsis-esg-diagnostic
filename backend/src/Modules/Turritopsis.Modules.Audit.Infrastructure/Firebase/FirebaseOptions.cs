namespace Turritopsis.Modules.Audit.Infrastructure;
public sealed class FirebaseOptions
{
    public const string SectionName = "Firebase";
    public bool Enabled { get; set; }
    public string ProjectId { get; set; } = "";
    public string? CredentialsPath { get; set; }
}
