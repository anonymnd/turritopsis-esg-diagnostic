namespace Turritopsis.Domain.Entities;

public class Document
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string QuestionCode { get; set; } = string.Empty;
    public string? Label { get; set; }
    public string? TextContent { get; set; }
    public string? StoragePath { get; set; }
    public string? FileName { get; set; }
    public Guid? UploadedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Company Company { get; set; } = null!;
}
