using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Turritopsis.Api.Services;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Auth.Models;

namespace Turritopsis.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private const int ForgotPasswordLimitPerWindow = 3;
    private static readonly TimeSpan ForgotPasswordWindow = TimeSpan.FromMinutes(15);

    private static readonly object GenericForgotPasswordResponse =
        new { message = "Si un compte existe avec cet email, un lien de reinitialisation a ete envoye." };

    private readonly IAuthService _authService;
    private readonly IValidator<RegisterRequest> _registerValidator;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly IValidator<ForgotPasswordRequest> _forgotPasswordValidator;
    private readonly IValidator<ResetPasswordRequest> _resetPasswordValidator;
    private readonly SlidingWindowRateLimiter _rateLimiter;

    public AuthController(
        IAuthService authService,
        IValidator<RegisterRequest> registerValidator,
        IValidator<LoginRequest> loginValidator,
        IValidator<ForgotPasswordRequest> forgotPasswordValidator,
        IValidator<ResetPasswordRequest> resetPasswordValidator,
        SlidingWindowRateLimiter rateLimiter)
    {
        _authService = authService;
        _registerValidator = registerValidator;
        _loginValidator = loginValidator;
        _forgotPasswordValidator = forgotPasswordValidator;
        _resetPasswordValidator = resetPasswordValidator;
        _rateLimiter = rateLimiter;
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

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var validation = await _forgotPasswordValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));
        }

        // Same generic response whether the email exists, the request was
        // rate-limited, or the reset link actually got sent — never give a
        // prober a way to tell accounts apart from noise.
        if (_rateLimiter.TryAcquire($"forgot-password:{request.Email.ToLowerInvariant()}", ForgotPasswordLimitPerWindow, ForgotPasswordWindow))
        {
            await _authService.RequestPasswordResetAsync(request, cancellationToken);
        }

        return Ok(GenericForgotPasswordResponse);
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var validation = await _resetPasswordValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));
        }

        var result = await _authService.ResetPasswordAsync(request, cancellationToken);
        return result.Success ? Ok() : BadRequest(new { errors = result.Errors });
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
