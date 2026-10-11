using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turritopsis.Api.Services;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Common;
using Turritopsis.Modules.Audit.Application;
namespace Turritopsis.Api.Controllers;

public sealed record RegisterPushRequest(Guid DeviceId, string Token);
[ApiController]
[Authorize]
[Route("api/v1/notifications/push")]
public sealed class PushNotificationsController(IPushSubscriptions subscriptions, IPushQueueProcessor queue,
    IPushSender sender, ICurrentUserService user, SlidingWindowRateLimiter limiter) : ControllerBase
{
    [HttpGet("status")]
    public IActionResult Status() => Ok(new { enabled = sender.Enabled });
    [HttpGet("subscriptions/{subscriptionId:guid}")]
    public async Task<IActionResult> GetSubscription(Guid subscriptionId, CancellationToken ct)
    {
        if (user.UserId is not { } userId) return Unauthorized();
        return Ok(new { active = await subscriptions.IsActiveAsync(userId, subscriptionId, ct) });
    }
    [HttpPost("subscriptions")]
    public async Task<IActionResult> Register(RegisterPushRequest request, CancellationToken ct)
    {
        if (user.UserId is not { } userId) return Unauthorized();
        if (!sender.Enabled) return StatusCode(503, new { error = "Les notifications push sont indisponibles." });
        if (!limiter.TryAcquire($"push-register:{userId}", 20, TimeSpan.FromMinutes(1))) return StatusCode(429);
        var result = await subscriptions.RegisterAsync(userId, request.DeviceId, request.Token, ct);
        return result.Access switch
        {
            MembershipAccess.Forbidden => Forbid(),
            MembershipAccess.Invalid => BadRequest(new { error = result.Error }),
            MembershipAccess.Conflict => Conflict(new { error = result.Error }),
            _ => Ok(new { subscriptionId = result.SubscriptionId })
        };
    }
    [HttpDelete("subscriptions/{subscriptionId:guid}")]
    public async Task<IActionResult> Revoke(Guid subscriptionId, CancellationToken ct)
    {
        if (user.UserId is not { } userId) return Unauthorized();
        return await subscriptions.RevokeAsync(userId, subscriptionId, ct) ? NoContent() : NotFound();
    }
    [HttpPost("subscriptions/{subscriptionId:guid}/test")]
    public async Task<IActionResult> Test(Guid subscriptionId, CancellationToken ct)
    {
        if (user.UserId is not { } userId) return Unauthorized();
        if (!sender.Enabled) return StatusCode(503);
        if (!limiter.TryAcquire($"push-test:{userId}", 1, TimeSpan.FromMinutes(1))) return StatusCode(429);
        return await subscriptions.QueueTestAsync(userId, subscriptionId, ct) ? Accepted() : NotFound();
    }
    [Authorize(Roles = "admin")]
    [HttpGet("queue")]
    public async Task<IActionResult> Queue(CancellationToken ct)
    {
        if (!user.Roles.Contains("admin")) return Forbid();
        return Ok(await queue.OverviewAsync(ct));
    }
    [Authorize(Roles = "admin")]
    [HttpPost("queue/{jobId:guid}/retry")]
    public async Task<IActionResult> Retry(Guid jobId, CancellationToken ct)
    {
        if (!user.Roles.Contains("admin")) return Forbid();
        return await queue.RetryAsync(jobId, ct) ? Accepted() : Conflict(new { error = "Ce job ne peut pas etre relance: verifiez la configuration, son statut et son expiration." });
    }
}
