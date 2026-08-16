using FluentValidation;
using Turritopsis.Application.Admin.Models;

namespace Turritopsis.Application.Admin.Validators;

public class CreateReviewerRequestValidator : AbstractValidator<CreateReviewerRequest>
{
    public CreateReviewerRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
    }
}
