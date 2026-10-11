namespace Turritopsis.Application.Auth.Models;

public record AuthResult
{
    public bool Success { get; init; }
    public string? AccessToken { get; init; }
    public DateTimeOffset? ExpiresAt { get; init; }
    public Guid? UserId { get; init; }
    public Guid? CompanyId { get; init; }
    public IReadOnlyList<string> Roles { get; init; } = Array.Empty<string>();
    public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();

    public static AuthResult Fail(params string[] errors) => new() { Success = false, Errors = errors };

    public static AuthResult Ok(string token, DateTimeOffset expiresAt, Guid userId, Guid? companyId = null, IReadOnlyList<string>? roles = null) =>
        new() { Success = true, AccessToken = token, ExpiresAt = expiresAt, UserId = userId, CompanyId = companyId, Roles = roles ?? Array.Empty<string>() };
}
