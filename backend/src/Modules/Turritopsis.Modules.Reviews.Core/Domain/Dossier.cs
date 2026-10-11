using Turritopsis.Domain.Enums;
using Turritopsis.Modules.Reviews.Domain;
using Turritopsis.SharedKernel;

namespace Turritopsis.Domain.Entities;

// A frozen submission of a company's ESG snapshot, tracked through the
// review lifecycle. Re-submitting reuses the existing non-validated row
// rather than creating a duplicate — see DossierService.
public class Dossier
{
    public Guid Id
    {
        get; set;
    }
    public Guid CompanyId
    {
        get; set;
    }
    public DossierStatus Status { get; private set; } = DossierStatus.Submitted;
    public long Version
    {
        get; private set;
    }
    private readonly List<DomainEvent> _domainEvents = new();
    public IReadOnlyList<DomainEvent> DomainEvents => _domainEvents;
    public int? DeclaredScore
    {
        get; private set;
    }
    public int? ReviewedScore
    {
        get; private set;
    }
    public int? FinalScore
    {
        get; private set;
    }
    // Reviewer-authored, confirmed at the same time as the validate/reject
    // decision — starts as an editable draft of the AI dossier review, but
    // the reviewer owns the final wording. Shown to the PME on the report.
    public string? Recommendations
    {
        get; private set;
    }
    public string SnapshotJson { get; private set; } = "{}";
    public Guid? SubmittedBy
    {
        get; private set;
    }
    public Guid? ReviewerId
    {
        get; private set;
    }
    public DateTimeOffset SubmittedAt
    {
        get; private set;
    }
    public DateTimeOffset? ReviewedAt
    {
        get; private set;
    }
    public DateTimeOffset UpdatedAt
    {
        get; private set;
    }
    public DateTimeOffset CreatedAt
    {
        get; set;
    }

    public Guid? CurrentRevisionId { get; private set; }
    public int RevisionNumber { get; private set; }
    public ICollection<DossierRevision> Revisions { get; set; } = new List<DossierRevision>();

    public void AttachEvidence(Guid snapshotId) {
        var revision = new DossierRevision { IsNew=true, Id=Guid.NewGuid(),DossierId=Id,Number=++RevisionNumber,
            EvidenceSnapshotId=snapshotId,SubmittedBy=SubmittedBy!.Value,SubmittedAt=SubmittedAt,SnapshotJson=SnapshotJson,
            DeclaredScore=DeclaredScore,ReviewedScore=ReviewedScore };
        CurrentRevisionId=revision.Id;Revisions.Add(revision);
    }

    public void CheckRevision(Guid? revisionId) {
        if(CurrentRevisionId != revisionId) throw new DossierTransitionException("La revision a change. Rechargez le dossier avant de continuer.");
    }

    public ICollection<DossierNote> Notes { get; set; } = new List<DossierNote>();

    public void Submit(Guid actorId, string snapshotJson, int? declaredScore, int? reviewedScore)
    {
        if (!DossierState.For(Status).CanSubmit)
            throw new DossierTransitionException("Le dossier est en revue ou deja valide. La resoumission est impossible.");
        ValidateScore(declaredScore);
        ValidateScore(reviewedScore);
        Status = DossierStatus.Submitted;
        SnapshotJson = snapshotJson;
        DeclaredScore = declaredScore;
        ReviewedScore = reviewedScore;
        FinalScore = null;
        Recommendations = null;
        ReviewerId = null;
        ReviewedAt = null;
        SubmittedBy = actorId;
        SubmittedAt = DateTimeOffset.UtcNow;
        UpdatedAt = SubmittedAt;
        Raise("dossier.submitted", actorId);
    }

    public void Review(Guid actorId, DossierStatus target, int? finalScore, string? recommendations)
    {
        if (!DossierState.For(Status).CanReview(target))
            throw new DossierTransitionException("Transition impossible. Un dossier valide ne peut plus etre modifie; un dossier rejete doit etre resoumis.");
        ValidateScore(finalScore);
        if (target == DossierStatus.Validated && finalScore is null)
            throw new DossierValidationException("Un score final est obligatoire pour valider le dossier.");
        Status = target;
        FinalScore = target == DossierStatus.Rejected ? null : finalScore ?? FinalScore;
        if (recommendations is not null)
            Recommendations = recommendations;
        ReviewerId = actorId;
        ReviewedAt = DateTimeOffset.UtcNow;
        UpdatedAt = ReviewedAt.Value;
        var revision=Revisions.SingleOrDefault(x=>x.Id==CurrentRevisionId);
        if(revision is not null) { revision.Status=Status.ToString();revision.FinalScore=FinalScore;revision.Recommendations=Recommendations;revision.ReviewerId=ReviewerId;revision.ReviewedAt=ReviewedAt; }
        Raise($"dossier.{target.ToString().ToLowerInvariant()}", actorId);
    }

    public void RecordNote(Guid actorId)
    {
        if (!DossierState.For(Status).CanAddNote)
            throw new DossierTransitionException("Les commentaires d'un dossier valide sont verrouilles.");
        UpdatedAt = DateTimeOffset.UtcNow;
        Raise("dossier.note_added", actorId);
    }

    public void ClearDomainEvents() => _domainEvents.Clear();

    private void Raise(string type, Guid actorId)
    {
        Version++;
        _domainEvents.Add(new DomainEvent(Guid.NewGuid(), type, Id, CompanyId, actorId, Version, UpdatedAt));
    }

    private static void ValidateScore(int? score)
    {
        if (score is < 0 or > 100)
            throw new DossierValidationException("Le score doit etre compris entre 0 et 100.");
    }
}
