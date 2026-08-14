namespace Turritopsis.Domain.Entities;

public class Company
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Sector { get; set; } = string.Empty;
    public string? City { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<CompanyUser> Members { get; set; } = new List<CompanyUser>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<Dossier> Dossiers { get; set; } = new List<Dossier>();
}
