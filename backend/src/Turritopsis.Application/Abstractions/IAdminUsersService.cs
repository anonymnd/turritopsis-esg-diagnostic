using Turritopsis.Application.Admin.Models;

namespace Turritopsis.Application.Abstractions;

public interface IAdminUsersService
{
    Task<CreateReviewerResult> CreateReviewerAsync(Guid actorId, CreateReviewerRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<ReviewerDto>> GetReviewersAsync(CancellationToken cancellationToken);

    // Undo an accidental promotion (e.g. AdminSeed matching an existing
    // PME account before the identity-blending guard existed). Only
    // "reviewer" and "admin" are valid targets — never a company role.
    Task<bool> RemoveRoleAsync(string email, string role, CancellationToken cancellationToken);
}
