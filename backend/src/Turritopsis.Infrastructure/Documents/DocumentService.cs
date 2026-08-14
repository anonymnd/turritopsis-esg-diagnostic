using Microsoft.EntityFrameworkCore;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Common;
using Turritopsis.Application.Documents.Models;
using Turritopsis.Domain.Entities;
using Turritopsis.Domain.Enums;
using Turritopsis.Infrastructure.Persistence;

namespace Turritopsis.Infrastructure.Documents;

public class DocumentService : IDocumentService
{
    private const int MaxFileBytes = 4 * 1024 * 1024;

    private readonly TurritopsisDbContext _db;
    private readonly IFileStorage _fileStorage;

    public DocumentService(TurritopsisDbContext db, IFileStorage fileStorage)
    {
        _db = db;
        _fileStorage = fileStorage;
    }

    public async Task<DocumentListResult> ListForUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var membership = await FindMembershipAsync(userId, cancellationToken);
        if (membership is null) return new DocumentListResult(MembershipAccess.Forbidden, Array.Empty<DocumentDto>());

        var documents = await _db.Documents
            .Where(d => d.CompanyId == membership.CompanyId)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new DocumentDto(d.Id, d.QuestionCode, d.Label, d.TextContent, d.FileName, d.CreatedAt))
            .ToListAsync(cancellationToken);

        return new DocumentListResult(MembershipAccess.Granted, documents);
    }

    public async Task<DocumentResult> UploadAsync(Guid userId, UpsertDocumentRequest request, CancellationToken cancellationToken)
    {
        var membership = await FindMembershipAsync(userId, cancellationToken);
        if (membership is null || membership.Role == CompanyRole.Viewer)
        {
            return new DocumentResult(MembershipAccess.Forbidden, null);
        }

        string? storagePath = null;
        string? fileName = null;
        if (!string.IsNullOrEmpty(request.FileBase64) && !string.IsNullOrEmpty(request.FileName))
        {
            var bytes = Convert.FromBase64String(request.FileBase64);
            if (bytes.Length > MaxFileBytes)
            {
                throw new InvalidOperationException("Le fichier depasse la taille maximale autorisee (4 Mo).");
            }
            // Storage upload is best-effort: a failed write still keeps the
            // text content, matching the "never block on storage" contract
            // from the previous Node implementation.
            try
            {
                storagePath = await _fileStorage.SaveAsync(membership.CompanyId, request.FileName, bytes, cancellationToken);
                fileName = request.FileName;
            }
            catch
            {
                storagePath = null;
                fileName = null;
            }
        }

        var document = new Document
        {
            Id = Guid.NewGuid(),
            CompanyId = membership.CompanyId,
            QuestionCode = request.QuestionCode,
            Label = request.Label,
            TextContent = request.TextContent,
            StoragePath = storagePath,
            FileName = fileName,
            UploadedBy = userId,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.Documents.Add(document);
        await _db.SaveChangesAsync(cancellationToken);

        return new DocumentResult(
            MembershipAccess.Granted,
            new DocumentDto(document.Id, document.QuestionCode, document.Label, document.TextContent, document.FileName, document.CreatedAt));
    }

    public async Task<MembershipAccess> DeleteAsync(Guid userId, Guid documentId, CancellationToken cancellationToken)
    {
        var membership = await FindMembershipAsync(userId, cancellationToken);
        if (membership is null || membership.Role == CompanyRole.Viewer)
        {
            return MembershipAccess.Forbidden;
        }

        var document = await _db.Documents.FirstOrDefaultAsync(d => d.Id == documentId && d.CompanyId == membership.CompanyId, cancellationToken);
        if (document is null) return MembershipAccess.NotFound;

        if (document.StoragePath is not null)
        {
            await _fileStorage.DeleteAsync(document.StoragePath, cancellationToken);
        }
        _db.Documents.Remove(document);
        await _db.SaveChangesAsync(cancellationToken);
        return MembershipAccess.Granted;
    }

    private Task<CompanyUser?> FindMembershipAsync(Guid userId, CancellationToken cancellationToken) =>
        _db.CompanyUsers.FirstOrDefaultAsync(cu => cu.UserId == userId, cancellationToken);
}
