using FluentValidation;
using Turritopsis.Application.Auth.Models;

namespace Turritopsis.Application.Auth.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.CompanyName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Sector).NotEmpty().MaximumLength(120);
        RuleFor(x => x.City).MaximumLength(120);
    }
}
