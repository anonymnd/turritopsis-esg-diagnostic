namespace Turritopsis.Application.Admin.Models;

// Only an admin can call this — there is no self-service signup for the
// reviewer role. Rejects emails already in use by any account (including
// PME accounts) so a reviewer identity never overlaps a company identity.
public record CreateReviewerRequest(string Email, string Password);

public record ReviewerDto(Guid Id, string Email);

public record CreateReviewerResult
{
    public bool Success { get; init; }
    public Guid? UserId { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();

    public static CreateReviewerResult Fail(params string[] errors) => new() { Success = false, Errors = errors };

    public static CreateReviewerResult Ok(Guid userId) => new() { Success = true, UserId = userId };
}
