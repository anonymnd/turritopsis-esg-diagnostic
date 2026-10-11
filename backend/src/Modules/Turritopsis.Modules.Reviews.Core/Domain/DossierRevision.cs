namespace Turritopsis.Domain.Entities;
public sealed class DossierRevision {
 public Guid Id { get; set; }
 public bool IsNew { get; set; }
 public Guid DossierId { get; set; }
 public int Number { get; set; }
 public Guid EvidenceSnapshotId { get; set; }
 public Guid SubmittedBy { get; set; }
 public DateTimeOffset SubmittedAt { get; set; }
 public string SnapshotJson { get; set; } = "{}";
 public int? DeclaredScore { get; set; }
 public int? ReviewedScore { get; set; }
 public string Status { get; set; } = "Submitted";
 public int? FinalScore { get; set; }
 public string? Recommendations { get; set; }
 public Guid? ReviewerId { get; set; }
 public DateTimeOffset? ReviewedAt { get; set; }
 public Dossier Dossier { get; set; } = null!;
}
