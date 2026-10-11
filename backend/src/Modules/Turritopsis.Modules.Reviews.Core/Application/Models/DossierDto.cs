namespace Turritopsis.Application.Dossiers.Models;

public record DossierDto(
    Guid Id,
    Guid CompanyId,
    string? CompanyName,
    string Status,
    int? DeclaredScore,
    int? ReviewedScore,
    int? FinalScore,
    string? Recommendations,
    string SnapshotJson,
    DateTimeOffset SubmittedAt,
    DateTimeOffset? ReviewedAt,
    DateTimeOffset UpdatedAt, Guid? CurrentRevisionId = null, int RevisionNumber = 0);

public record DossierNoteDto(Guid Id, Guid DossierId, string? QuestionCode, string Text, DateTimeOffset CreatedAt, Guid? RevisionId = null);
