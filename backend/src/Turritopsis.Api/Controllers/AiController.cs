using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turritopsis.Api.Services;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Ai.Models;
using Turritopsis.Application.Common;

namespace Turritopsis.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/ai")]
public class AiController : ControllerBase
{
    private static readonly string[] ReviewRoles = { "reviewer", "admin" };

    // Generous enough for a real session (batch-checking a full 27-criteria
    // dossier) while still bounding a runaway loop or scripted abuse
    // hitting the real AI provider on this app's own API key.
    private const int RateLimitPerMinute = 30;

    private readonly IAiReviewService _aiReviewService;
    private readonly IDossierService _dossierService;
    private readonly ICurrentUserService _currentUser;
    private readonly SlidingWindowRateLimiter _rateLimiter;

    public AiController(
        IAiReviewService aiReviewService,
        IDossierService dossierService,
        ICurrentUserService currentUser,
        SlidingWindowRateLimiter rateLimiter)
    {
        _aiReviewService = aiReviewService;
        _dossierService = dossierService;
        _currentUser = currentUser;
        _rateLimiter = rateLimiter;
    }

    private bool IsReviewer => _currentUser.Roles.Any(ReviewRoles.Contains);

    [HttpPost("review-question")]
    public async Task<IActionResult> ReviewQuestion(QuestionReviewRequest request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();
        if (!_rateLimiter.TryAcquire($"ai-question:{userId}", RateLimitPerMinute, TimeSpan.FromMinutes(1)))
        {
            return StatusCode(429, new { error = "Trop d'analyses en peu de temps, reessayez dans une minute." });
        }

        var result = await _aiReviewService.ReviewQuestionAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("review-dossier/{dossierId:guid}")]
    public async Task<IActionResult> ReviewDossier(Guid dossierId, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();
        if (!IsReviewer) return Forbid();
        if (!_rateLimiter.TryAcquire($"ai-dossier:{userId}", RateLimitPerMinute, TimeSpan.FromMinutes(1)))
        {
            return StatusCode(429, new { error = "Trop d'analyses en peu de temps, reessayez dans une minute." });
        }

        var context = await _dossierService.GetAiContextAsync(userId, IsReviewer, dossierId, cancellationToken);
        if (context.Access == MembershipAccess.NotFound) return NotFound();
        if (context.Access == MembershipAccess.Forbidden) return Forbid();

        var result = await _aiReviewService.ReviewDossierAsync(context.Answers, cancellationToken);
        return Ok(result);
    }
}
