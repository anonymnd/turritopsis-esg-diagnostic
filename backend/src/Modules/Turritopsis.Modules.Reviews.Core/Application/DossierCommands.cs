using Turritopsis.SharedKernel;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Common;
using Turritopsis.Application.Dossiers.Models;
using Turritopsis.Domain.Entities;
using Turritopsis.Domain.Enums;
using Turritopsis.Modules.Reviews.Domain;
namespace Turritopsis.Modules.Reviews.Application;

public sealed class DossierCommands(IDossierRepository repository, ICompanyDirectory companies,
    ISnapshotReader snapshots, IDossierQueries queries, IFrozenEvidenceStore evidence) : IDossierCommands
{
    public async Task<DossierResult> SubmitAsync(Guid userId, int? declaredScore, int? reviewedScore, CancellationToken ct)
    {
        var membership = await companies.FindMembershipAsync(userId, ct);
        if (membership is null || !membership.CanWrite)
            return new(MembershipAccess.Forbidden, null);
        var dossier = await repository.LatestAsync(membership.CompanyId, false, ct);
        if (dossier is null || dossier.Status == DossierStatus.Validated)
            dossier = new Dossier { Id = Guid.NewGuid(), CompanyId = membership.CompanyId, CreatedAt = DateTimeOffset.UtcNow };
        try
        {
            dossier.Submit(userId, await snapshots.ReadForCompanyAsync(membership.CompanyId, ct), declaredScore, reviewedScore);
            dossier.AttachEvidence(await evidence.CaptureAsync(membership.CompanyId,userId,ct));
            await repository.SaveAsync(dossier, ct);
            return await queries.GetByIdAsync(userId, false, dossier.Id, ct);
        }
        catch (EvidenceCaptureException ex) { return new(MembershipAccess.Invalid, null, ex.Message); }
        catch (DossierValidationException ex) { return new(MembershipAccess.Invalid, null, ex.Message); }
        catch (DossierTransitionException ex) { return new(MembershipAccess.Conflict, null, ex.Message); }
        catch (DossierConcurrencyException ex) { return new(MembershipAccess.Conflict, null, ex.Message); }
    }

    public async Task<DossierResult> UpdateStatusAsync(Guid userId, Guid dossierId, string status, int? finalScore, string? recommendations, CancellationToken ct, Guid? revisionId = null)
    {
        if (!Enum.TryParse<DossierStatus>(status, out var target) || !Enum.IsDefined(target) || target.ToString() != status || target == DossierStatus.Submitted)
            return new(MembershipAccess.Invalid, null, "Statut de revue invalide.");
        var dossier = await repository.GetAsync(dossierId, ct);
        if (dossier is null)
            return new(MembershipAccess.NotFound, null);
        try
        {
            dossier.CheckRevision(revisionId);
            dossier.Review(userId, target, finalScore, recommendations);
            await repository.SaveAsync(dossier, ct);
            return await queries.GetByIdAsync(userId, true, dossierId, ct);
        }
        catch (EvidenceCaptureException ex) { return new(MembershipAccess.Invalid, null, ex.Message); }
        catch (DossierValidationException ex) { return new(MembershipAccess.Invalid, null, ex.Message); }
        catch (DossierTransitionException ex) { return new(MembershipAccess.Conflict, null, ex.Message); }
        catch (DossierConcurrencyException ex) { return new(MembershipAccess.Conflict, null, ex.Message); }
    }

    public async Task<MembershipAccess> AddNoteAsync(Guid userId, bool isReviewer, Guid dossierId, string? questionCode, string text, CancellationToken ct, Guid? revisionId = null)
    {
        if (!isReviewer)
            return MembershipAccess.Forbidden;
        if (string.IsNullOrWhiteSpace(text) || text.Length > 2000)
            return MembershipAccess.Invalid;
        var dossier = await repository.GetAsync(dossierId, ct);
        if (dossier is null)
            return MembershipAccess.NotFound;
        try
        {
            dossier.CheckRevision(revisionId);
            dossier.RecordNote(userId);
            await repository.AddNoteAsync(dossier, new DossierNote
            {
                Id = Guid.NewGuid(),
                DossierId = dossierId,
                RevisionId = dossier.CurrentRevisionId,
                AuthorId = userId,
                QuestionCode = questionCode,
                Text = text,
                CreatedAt = DateTimeOffset.UtcNow
            }, ct);
            return MembershipAccess.Granted;
        }
        catch (DossierTransitionException) { return MembershipAccess.Conflict; }
        catch (DossierConcurrencyException) { return MembershipAccess.Conflict; }
    }
}
