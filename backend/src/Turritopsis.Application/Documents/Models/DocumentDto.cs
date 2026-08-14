namespace Turritopsis.Application.Documents.Models;

public record DocumentDto(Guid Id, string QuestionCode, string? Label, string? TextContent, string? FileName, DateTimeOffset CreatedAt);

public record UpsertDocumentRequest(string QuestionCode, string? Label, string? TextContent, string? FileBase64, string? FileName);
