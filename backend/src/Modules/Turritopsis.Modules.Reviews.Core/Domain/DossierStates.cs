using Turritopsis.Domain.Enums;

namespace Turritopsis.Modules.Reviews.Domain;

public abstract class DossierState
{
    public abstract bool CanSubmit
    {
        get;
    }
    public abstract bool CanReview(DossierStatus target);
    public virtual bool CanAddNote => true;

    public static DossierState For(DossierStatus status) => status switch
    {
        DossierStatus.Submitted => new SubmittedState(),
        DossierStatus.InReview => new InReviewState(),
        DossierStatus.Rejected => new RejectedState(),
        DossierStatus.Validated => new ValidatedState(),
        _ => throw new DossierTransitionException("Etat du dossier inconnu.")
    };
}

public sealed class SubmittedState : DossierState
{
    public override bool CanSubmit => true;
    public override bool CanReview(DossierStatus target) => target is DossierStatus.InReview or DossierStatus.Validated or DossierStatus.Rejected;
}

public sealed class InReviewState : DossierState
{
    public override bool CanSubmit => false;
    public override bool CanReview(DossierStatus target) => target is DossierStatus.InReview or DossierStatus.Validated or DossierStatus.Rejected;
}

public sealed class RejectedState : DossierState
{
    public override bool CanSubmit => true;
    public override bool CanReview(DossierStatus target) => false;
}

public sealed class ValidatedState : DossierState
{
    public override bool CanSubmit => false;
    public override bool CanAddNote => false;
    public override bool CanReview(DossierStatus target) => false;
}

public sealed class DossierTransitionException(string message) : Exception(message);
public sealed class DossierValidationException(string message) : Exception(message);
public sealed class DossierConcurrencyException : Exception
{
    public DossierConcurrencyException() : base("Le dossier a change. Actualisez la page avant de reessayer.") { }
}
