using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turritopsis.Application.Abstractions;

namespace Turritopsis.Api.Controllers;

[ApiController]
[Authorize(Roles = "admin")]
[Route("api/v1/admin/overview")]
public class AdminOverviewController : ControllerBase
{
    private readonly IAdminOverviewService _overviewService;

    public AdminOverviewController(IAdminOverviewService overviewService)
    {
        _overviewService = overviewService;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var overview = await _overviewService.GetOverviewAsync(cancellationToken);
        return Ok(overview);
    }
}
