using Turritopsis.Application.Admin.Models;

namespace Turritopsis.Application.Abstractions;

public interface IAdminUsersService
{
    Task<CreateReviewerResult> CreateReviewerAsync(Guid actorId, CreateReviewerRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<ReviewerDto>> GetReviewersAsync(CancellationToken cancellationToken);
}
