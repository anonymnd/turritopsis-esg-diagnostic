namespace Turritopsis.Domain.Entities;

// One row per company: the PME's current, editable ESG answers. Frozen into
// a Dossier at submission time, so this stays mutable/live between submits.
public class EsgSnapshot
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string DataJson { get; set; } = "{}";
    public DateTimeOffset UpdatedAt { get; set; }

    public Company Company { get; set; } = null!;
}
