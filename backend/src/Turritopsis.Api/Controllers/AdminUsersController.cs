using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Admin.Models;

namespace Turritopsis.Api.Controllers;

// Admin-only: creating a reviewer account is deliberately not self-service
// (see docs/rewrite) — this is the sole way a reviewer identity comes into
// existence, gated behind an admin JWT.
[ApiController]
[Authorize(Roles = "admin")]
[Route("api/v1/admin/reviewers")]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUsersService _adminUsersService;
    private readonly IValidator<CreateReviewerRequest> _validator;
    private readonly ICurrentUserService _currentUser;

    public AdminUsersController(IAdminUsersService adminUsersService, IValidator<CreateReviewerRequest> validator, ICurrentUserService currentUser)
    {
        _adminUsersService = adminUsersService;
        _validator = validator;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetReviewers(CancellationToken cancellationToken)
    {
        var reviewers = await _adminUsersService.GetReviewersAsync(cancellationToken);
        return Ok(reviewers);
    }

    [HttpPost]
    public async Task<IActionResult> CreateReviewer(CreateReviewerRequest request, CancellationToken cancellationToken)
    {
        var validation = await _validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));
        }

        if (_currentUser.UserId is null) return Unauthorized();

        var result = await _adminUsersService.CreateReviewerAsync(_currentUser.UserId.Value, request, cancellationToken);
        return result.Success ? Ok(new { userId = result.UserId }) : BadRequest(new { errors = result.Errors });
    }
}
