using Turritopsis.SharedKernel;
using Turritopsis.Modules.Documents.Application;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Common;
using Turritopsis.Application.Documents.Models;
using Turritopsis.Domain.Entities;


namespace Turritopsis.Modules.Documents.Application;

public class DocumentService : IDocumentService
{
    private const int MaxFileBytes = 4 * 1024 * 1024;

    private readonly IDocumentRepository _repository;
    private readonly ICompanyDirectory _companies;
    private readonly IDossierCompanyReader _dossiers;
    private readonly IFrozenEvidenceStore _frozen;
    private readonly IDossierEvidenceLocator _locator;
    private readonly IFileStorage _fileStorage;

    public DocumentService(IDocumentRepository repository, IFileStorage fileStorage, ICompanyDirectory companies, IDossierCompanyReader dossiers, IFrozenEvidenceStore frozen, IDossierEvidenceLocator locator)
    {
        _repository = repository;
        _companies = companies;
        _dossiers = dossiers;
        _frozen=frozen;_locator=locator;
        _fileStorage = fileStorage;
    }

    public async Task<DocumentListResult> ListForUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var membership = await FindMembershipAsync(userId, cancellationToken);
        if (membership is null) return new DocumentListResult(MembershipAccess.Forbidden, Array.Empty<DocumentDto>());

        var documents = (await _repository.ListAsync(membership.CompanyId, cancellationToken)).Select(ToDto).ToList();

        return new DocumentListResult(MembershipAccess.Granted, documents);
    }

    public async Task<DocumentResult> UploadAsync(Guid userId, UpsertDocumentRequest request, CancellationToken cancellationToken)
    {
        var membership = await FindMembershipAsync(userId, cancellationToken);
        if (membership is null || !membership.CanWrite)
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
            // for optional attachment storage.
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
        await _repository.SaveAsync(document, cancellationToken);

        return new DocumentResult(
            MembershipAccess.Granted,
            new DocumentDto(document.Id, document.QuestionCode, document.Label, document.TextContent, document.FileName, document.CreatedAt));
    }

    public async Task<MembershipAccess> DeleteAsync(Guid userId, Guid documentId, CancellationToken cancellationToken)
    {
        var membership = await FindMembershipAsync(userId, cancellationToken);
        if (membership is null || !membership.CanWrite)
        {
            return MembershipAccess.Forbidden;
        }

        var document = await _repository.GetAsync(documentId, cancellationToken);
        if (document is null || document.CompanyId != membership.CompanyId) return MembershipAccess.NotFound;

        if (document.StoragePath is not null)
        {
            await _fileStorage.DeleteAsync(document.StoragePath, cancellationToken);
        }
        await _repository.DeleteAsync(document, cancellationToken);
        return MembershipAccess.Granted;
    }

    public async Task<DocumentListResult> ListForDossierAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken, Guid? revisionId = null)
    {
        var location=await _locator.LocateAsync(dossierId,revisionId,cancellationToken);
        var companyId=location?.CompanyId;
        if (companyId is null) return new DocumentListResult(MembershipAccess.NotFound, Array.Empty<DocumentDto>());

        if (!isReviewer)
        {
            var membership = await FindMembershipAsync(userId, cancellationToken);
            if (membership is null || membership.CompanyId != companyId.Value)
            {
                return new DocumentListResult(MembershipAccess.Forbidden, Array.Empty<DocumentDto>());
            }
        }

        var documents = location!.SnapshotId is { } snapshotId
            ? (await _frozen.ReadAsync(companyId.Value,snapshotId,cancellationToken)).Select(x=>new DocumentDto(x.Id,x.QuestionCode,x.Label,x.TextContent,x.FileName,x.CreatedAt,x.Sha256)).ToList()
            : (await _repository.ListAsync(companyId.Value, cancellationToken)).Select(ToDto).ToList();

        return new DocumentListResult(MembershipAccess.Granted, documents);
    }

    public async Task<DocumentDetailResult> GetDetailAsync(Guid userId, bool isReviewer, Guid documentId, CancellationToken cancellationToken)
    {
        var document = await _repository.GetAsync(documentId, cancellationToken);
        if (document is null) return new DocumentDetailResult(MembershipAccess.NotFound, null);

        if (!isReviewer)
        {
            var membership = await FindMembershipAsync(userId, cancellationToken);
            if (membership is null || membership.CompanyId != document.CompanyId)
            {
                return new DocumentDetailResult(MembershipAccess.Forbidden, null);
            }
        }

        string? fileBase64 = null;
        if (document.StoragePath is not null)
        {
            var bytes = await _fileStorage.ReadAsync(document.StoragePath, cancellationToken);
            if (bytes is not null) fileBase64 = Convert.ToBase64String(bytes);
        }

        return new DocumentDetailResult(
            MembershipAccess.Granted,
            new DocumentDetailDto(document.Id, document.QuestionCode, document.Label, document.TextContent, document.FileName, fileBase64, document.CreatedAt));
    }

    public async Task<DocumentDetailResult> GetFrozenDetailAsync(Guid userId,bool isReviewer,Guid dossierId,Guid revisionId,Guid itemId,CancellationToken ct) {
        var location=await _locator.LocateAsync(dossierId,revisionId,ct);
        if(location?.SnapshotId is not { } snapshotId)return new(MembershipAccess.NotFound,null);
        if(!isReviewer && (await _companies.FindMembershipAsync(userId,ct))?.CompanyId!=location.CompanyId) return new(MembershipAccess.Forbidden,null);
        var item=await _frozen.ReadItemAsync(location.CompanyId,snapshotId,itemId,ct);
        return item is null?new(MembershipAccess.NotFound,null):new(MembershipAccess.Granted,new DocumentDetailDto(item.Id,item.QuestionCode,item.Label,item.TextContent,item.FileName,item.Content is null?null:Convert.ToBase64String(item.Content),item.CreatedAt));
    }

    private Task<CompanyMembership?> FindMembershipAsync(Guid userId,CancellationToken ct) => _companies.FindMembershipAsync(userId,ct);
    private static DocumentDto ToDto(Document d) => new(d.Id,d.QuestionCode,d.Label,d.TextContent,d.FileName,d.CreatedAt);
}
