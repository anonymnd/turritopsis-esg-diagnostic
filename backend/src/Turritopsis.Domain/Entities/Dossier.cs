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
    // Reviewer-authored, confirmed at the same time as the validate/reject
    // decision — starts as an editable draft of the AI dossier review, but
    // the reviewer owns the final wording. Shown to the PME on the report.
    public string? Recommendations { get; set; }
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
