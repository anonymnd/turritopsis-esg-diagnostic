namespace Turritopsis.Application.Auth.Models;

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(string Email, string Token, string NewPassword);

public record PasswordResetResult
{
    public bool Success { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();

    public static PasswordResetResult Ok() => new() { Success = true };

    public static PasswordResetResult Fail(params string[] errors) => new() { Success = false, Errors = errors };
}
