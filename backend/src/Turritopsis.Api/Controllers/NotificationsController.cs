using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turritopsis.SharedKernel;
using Turritopsis.Application.Abstractions;

namespace Turritopsis.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/notifications")]
public sealed class NotificationsController(INotificationReader notifications, ICompanyDirectory companies,
    ICurrentUserService user) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        if (user.UserId is not { } userId) return Unauthorized();
        var reviewer = user.Roles.Any(r => r is "reviewer" or "admin");
        var companyId = reviewer ? null : (await companies.FindMembershipAsync(userId, ct))?.CompanyId;
        if (!reviewer && companyId is null) return Forbid();
        return Ok(await notifications.ListAsync(companyId, reviewer, ct));
    }
}
