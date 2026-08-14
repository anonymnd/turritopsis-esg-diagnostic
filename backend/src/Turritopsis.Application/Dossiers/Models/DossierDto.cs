namespace Turritopsis.Application.Dossiers.Models;

public record DossierDto(
    Guid Id,
    Guid CompanyId,
    string? CompanyName,
    string Status,
    int? DeclaredScore,
    int? ReviewedScore,
    int? FinalScore,
    string SnapshotJson,
    DateTimeOffset SubmittedAt,
    DateTimeOffset? ReviewedAt,
    DateTimeOffset UpdatedAt);

public record DossierNoteDto(Guid Id, Guid DossierId, string? QuestionCode, string Text, DateTimeOffset CreatedAt);
