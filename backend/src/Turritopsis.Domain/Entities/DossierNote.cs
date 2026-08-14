namespace Turritopsis.Domain.Entities;

// Reviewer -> PME comment thread on a dossier. Reviewer/admin-only to post;
// see the note on ReviewController for why PMEs don't reply in this thread.
public class DossierNote
{
    public Guid Id { get; set; }
    public Guid DossierId { get; set; }
    public Guid? AuthorId { get; set; }
    public string? QuestionCode { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }

    public Dossier Dossier { get; set; } = null!;
}
