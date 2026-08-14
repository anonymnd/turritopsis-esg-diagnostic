using Turritopsis.Domain.Enums;

namespace Turritopsis.Domain.Entities;

// A frozen submission of a company's ESG snapshot, tracked through the
// review lifecycle. Re-submitting reuses the existing non-validated row
// rather than creating a duplicate — see DossierService.
public class Dossier
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public DossierStatus Status { get; set; } = DossierStatus.Submitted;
    public int? DeclaredScore { get; set; }
    public int? ReviewedScore { get; set; }
    public int? FinalScore { get; set; }
    public string SnapshotJson { get; set; } = "{}";
    public Guid? SubmittedBy { get; set; }
    public Guid? ReviewerId { get; set; }
    public DateTimeOffset SubmittedAt { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Company Company { get; set; } = null!;
    public ICollection<DossierNote> Notes { get; set; } = new List<DossierNote>();
}
