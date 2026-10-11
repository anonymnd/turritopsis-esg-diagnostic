using Turritopsis.SharedKernel;
using System.Text.Json;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Ai;
using Turritopsis.Application.Ai.Models;
using Turritopsis.Application.Common;
using Turritopsis.Application.Dossiers.Models;
using Turritopsis.Domain.Entities;
using Turritopsis.Domain.Enums;

namespace Turritopsis.Modules.Reviews.Application;

public class DossierQueries : IDossierQueries
{

    private readonly IDossierReadRepository _repository;
    private readonly ICompanyDirectory _companies;
    private readonly ICompanyEvidenceReader _evidence;
    private readonly IFrozenEvidenceStore _frozen;


    public DossierQueries(IDossierReadRepository repository, ICompanyDirectory companies, ICompanyEvidenceReader evidence, IFrozenEvidenceStore frozen)
    {
        _repository = repository;
        _companies = companies;
        _evidence = evidence;
        _frozen = frozen;
    }

    public async Task<DossierListResult> GetQueueAsync(bool isReviewer, bool includeAll, CancellationToken cancellationToken)
    {
        if (!isReviewer)
            return new DossierListResult(MembershipAccess.Forbidden, Array.Empty<DossierDto>());

        var dossiers = await _repository.QueueAsync(includeAll, cancellationToken);
        var names = await _companies.GetNamesAsync(dossiers.Select(d => d.CompanyId), cancellationToken);
        return new DossierListResult(MembershipAccess.Granted, dossiers.Select(d => ToDto(d, names.GetValueOrDefault(d.CompanyId))).ToList());
    }

    public async Task<DossierResult> GetForCompanyOwnerAsync(Guid userId, CancellationToken cancellationToken)
    {
        var membership = await FindMembershipAsync(userId, cancellationToken);
        if (membership is null)
            return new DossierResult(MembershipAccess.Forbidden, null);

        var dossier = await _repository.LatestAsync(membership.CompanyId, false, cancellationToken);

        return new DossierResult(MembershipAccess.Granted, dossier is null ? null : await ToDtoAsync(dossier, cancellationToken));
    }

    public async Task<DossierResult> GetByIdAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken)
    {
        var dossier = await _repository.GetAsync(dossierId, cancellationToken);
        if (dossier is null)
            return new DossierResult(MembershipAccess.NotFound, null);

        if (!isReviewer)
        {
            var membership = await FindMembershipAsync(userId, cancellationToken);
            if (membership is null || membership.CompanyId != dossier.CompanyId)
            {
                return new DossierResult(MembershipAccess.Forbidden, null);
            }
        }

        return new DossierResult(MembershipAccess.Granted, await ToDtoAsync(dossier, cancellationToken));
    }





    public async Task<DossierNoteListResult> GetNotesAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken)
    {
        var access = await CheckDossierAccessAsync(userId, isReviewer, dossierId, cancellationToken);
        if (access != MembershipAccess.Granted)
            return new DossierNoteListResult(access, Array.Empty<DossierNoteDto>());

        var notes = (await _repository.NotesAsync(dossierId, cancellationToken)).Select(n => new DossierNoteDto(n.Id, n.DossierId, n.QuestionCode, n.Text, n.CreatedAt, n.RevisionId)).ToList();

        return new DossierNoteListResult(MembershipAccess.Granted, notes);
    }



    public async Task<DossierAiContextResult> GetAiContextAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken, Guid? revisionId = null)
    {
        if (!isReviewer)
            return new DossierAiContextResult(MembershipAccess.Forbidden, Array.Empty<DossierAnswerContext>());

        var dossier = await _repository.GetAsync(dossierId, cancellationToken);
        if (dossier is null)
            return new DossierAiContextResult(MembershipAccess.NotFound, Array.Empty<DossierAnswerContext>());

        var revisions=await _repository.RevisionsAsync(dossierId,cancellationToken);
        var revision=revisions.FirstOrDefault(x=>x.Id==(revisionId??dossier.CurrentRevisionId));
        if((revisionId??dossier.CurrentRevisionId) is not null && revision is null) return new(MembershipAccess.NotFound,Array.Empty<DossierAnswerContext>());
        Dictionary<string, JsonElement> answers;
        try
        {
            answers = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(revision?.SnapshotJson ?? dossier.SnapshotJson) ?? new();
        }
        catch
        {
            answers = new();
        }

        var documents = revision is null ? await _evidence.ReadTextAsync(dossier.CompanyId, cancellationToken) : (await _frozen.ReadAsync(dossier.CompanyId,revision.EvidenceSnapshotId,cancellationToken)).Select(x=>new EvidenceText(x.QuestionCode,x.TextContent)).ToArray();
        var documentsByCode = documents.ToLookup(d => d.QuestionCode);

        var contexts = new List<DossierAnswerContext>();
        foreach (var (code, value) in answers)
        {
            var score = value.TryGetProperty("score", out var s) ? s.GetString() : null;
            if (string.IsNullOrEmpty(score))
                continue;

            var note = value.TryGetProperty("note", out var n) ? n.GetString() : null;
            var document = documentsByCode[code].FirstOrDefault();
            var proofParts = new List<string>();
            if (!string.IsNullOrWhiteSpace(note))
                proofParts.Add(note!);
            if (!string.IsNullOrWhiteSpace(document?.TextContent))
                proofParts.Add(document!.TextContent!);

            contexts.Add(new DossierAnswerContext(code, QuestionCatalog.TitleFor(code), score, string.Join(" ", proofParts)));
        }

        return new DossierAiContextResult(MembershipAccess.Granted, contexts);
    }

    public async Task<DossierListResult> GetHistoryAsync(Guid userId,CancellationToken ct) {
        var member=await _companies.FindMembershipAsync(userId,ct);
        if(member is null)return new(MembershipAccess.Forbidden,Array.Empty<DossierDto>());
        var rows=await _repository.ForCompanyAsync(member.CompanyId,ct);
        return new(MembershipAccess.Granted,rows.Select(x=>ToDto(x,null)).ToArray());
    }

    public async Task<RevisionListResult> GetRevisionsAsync(Guid userId,bool isReviewer,Guid dossierId,CancellationToken ct) {
        var access=await CheckDossierAccessAsync(userId,isReviewer,dossierId,ct);
        if(access!=MembershipAccess.Granted) return new(access,Array.Empty<RevisionDto>());
        var rows=await _repository.RevisionsAsync(dossierId,ct);
        return new(access,rows.Select(x=>new RevisionDto(x.Id,x.DossierId,x.Number,x.SubmittedBy,x.SubmittedAt,x.SnapshotJson,x.DeclaredScore,x.ReviewedScore,x.Status,x.FinalScore,x.Recommendations,x.ReviewerId,x.ReviewedAt)).ToArray());
    }

    private async Task<MembershipAccess> CheckDossierAccessAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken)
    {
        var dossier = await _repository.GetAsync(dossierId, cancellationToken);
        if (dossier is null)
            return MembershipAccess.NotFound;
        if (isReviewer)
            return MembershipAccess.Granted;

        var membership = await FindMembershipAsync(userId, cancellationToken);
        return membership is not null && membership.CompanyId == dossier.CompanyId ? MembershipAccess.Granted : MembershipAccess.Forbidden;
    }

    private Task<CompanyMembership?> FindMembershipAsync(Guid userId, CancellationToken ct) => _companies.FindMembershipAsync(userId, ct);
    private async Task<DossierDto> ToDtoAsync(Dossier d, CancellationToken ct)
    {
        var names = await _companies.GetNamesAsync(new[] { d.CompanyId }, ct);
        return ToDto(d, names.GetValueOrDefault(d.CompanyId));
    }

    private static DossierDto ToDto(Dossier d, string? companyName) => new(
        d.Id,
        d.CompanyId,
        companyName,
        d.Status.ToString(),
        d.DeclaredScore,
        d.ReviewedScore,
        d.FinalScore,
        d.Recommendations,
        d.SnapshotJson,
        d.SubmittedAt,
        d.ReviewedAt,
        d.UpdatedAt, d.CurrentRevisionId, d.RevisionNumber);
}
