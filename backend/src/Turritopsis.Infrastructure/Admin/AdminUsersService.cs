using Microsoft.AspNetCore.Identity;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Admin.Models;
using Turritopsis.Domain.Entities;
using Turritopsis.Infrastructure.Identity;
using Turritopsis.Infrastructure.Persistence;

namespace Turritopsis.Infrastructure.Admin;

public class AdminUsersService : IAdminUsersService
{
    private const string ReviewerRole = "reviewer";

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly TurritopsisDbContext _db;

    public AdminUsersService(UserManager<ApplicationUser> userManager, TurritopsisDbContext db)
    {
        _userManager = userManager;
        _db = db;
    }

    public async Task<CreateReviewerResult> CreateReviewerAsync(Guid actorId, CreateReviewerRequest request, CancellationToken cancellationToken)
    {
        // Reject any email already in use — by a PME account or otherwise —
        // so a reviewer identity can never overlap a company identity.
        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
        {
            return CreateReviewerResult.Fail("Un compte existe deja avec cet email.");
        }

        var user = new ApplicationUser { UserName = request.Email, Email = request.Email };
        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            return CreateReviewerResult.Fail(createResult.Errors.Select(e => e.Description).ToArray());
        }

        await _userManager.AddToRoleAsync(user, ReviewerRole);

        try
        {
            _db.AuditLogs.Add(new AuditLog
            {
                Id = Guid.NewGuid(),
                ActorId = actorId,
                CompanyId = null,
                Action = "reviewer_created",
                CreatedAt = DateTimeOffset.UtcNow
            });
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            // Best-effort: a failed audit write should never fail account creation.
        }

        return CreateReviewerResult.Ok(user.Id);
    }

    public async Task<IReadOnlyList<ReviewerDto>> GetReviewersAsync(CancellationToken cancellationToken)
    {
        var reviewers = await _userManager.GetUsersInRoleAsync(ReviewerRole);
        return reviewers
            .OrderBy(u => u.Email)
            .Select(u => new ReviewerDto(u.Id, u.Email ?? string.Empty))
            .ToList();
    }

    public async Task<bool> RemoveRoleAsync(string email, string role, CancellationToken cancellationToken)
    {
        if (role != "reviewer" && role != "admin")
        {
            return false;
        }

        var user = await _userManager.FindByEmailAsync(email);
        if (user is null || !await _userManager.IsInRoleAsync(user, role))
        {
            return false;
        }

        var result = await _userManager.RemoveFromRoleAsync(user, role);
        return result.Succeeded;
    }
}
