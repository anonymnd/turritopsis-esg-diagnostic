using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Auth.Models;

namespace Turritopsis.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IValidator<RegisterRequest> _registerValidator;
    private readonly IValidator<LoginRequest> _loginValidator;

    public AuthController(
        IAuthService authService,
        IValidator<RegisterRequest> registerValidator,
        IValidator<LoginRequest> loginValidator)
    {
        _authService = authService;
        _registerValidator = registerValidator;
        _loginValidator = loginValidator;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var validation = await _registerValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));
        }

        var result = await _authService.RegisterAsync(request, cancellationToken);
        return result.Success ? Ok(ToResponse(result)) : BadRequest(new { errors = result.Errors });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var validation = await _loginValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));
        }

        var result = await _authService.LoginAsync(request, cancellationToken);
        return result.Success ? Ok(ToResponse(result)) : Unauthorized(new { errors = result.Errors });
    }

    private static object ToResponse(AuthResult result) => new
    {
        accessToken = result.AccessToken,
        expiresAt = result.ExpiresAt,
        userId = result.UserId,
        companyId = result.CompanyId,
        roles = result.Roles
    };
}
