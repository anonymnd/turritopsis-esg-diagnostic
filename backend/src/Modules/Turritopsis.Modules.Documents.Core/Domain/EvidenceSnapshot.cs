namespace Turritopsis.Modules.Documents.Domain;
public sealed class EvidenceSnapshot {
 public Guid Id { get; set; }
 public Guid CompanyId { get; set; }
 public Guid CapturedBy { get; set; }
 public DateTimeOffset CapturedAt { get; set; }
}
public sealed class EvidenceSnapshotItem {
 public Guid Id { get; set; }
 public Guid SnapshotId { get; set; }
 public Guid OriginalDocumentId { get; set; }
 public string QuestionCode { get; set; } = "";
 public string? Label { get; set; }
 public string? TextContent { get; set; }
 public string? FileName { get; set; }
 public Guid? UploadedBy { get; set; }
 public DateTimeOffset CreatedAt { get; set; }
 public string? Sha256 { get; set; }
 public byte[]? Content { get; set; }
}
