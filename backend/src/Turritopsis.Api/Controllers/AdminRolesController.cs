using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turritopsis.Application.Abstractions;

namespace Turritopsis.Api.Controllers;

// Admin-only: undoes a reviewer/admin role grant. Exists because a role
// can end up on an account it shouldn't be on (e.g. AdminSeed matching an
// existing PME account before the identity-blending guard was added) —
// this is how that gets corrected without direct database access.
[ApiController]
[Authorize(Roles = "admin")]
[Route("api/v1/admin/roles")]
public class AdminRolesController : ControllerBase
{
    private readonly IAdminUsersService _adminUsersService;

    public AdminRolesController(IAdminUsersService adminUsersService)
    {
        _adminUsersService = adminUsersService;
    }

    [HttpDelete]
    public async Task<IActionResult> RemoveRole([FromQuery] string email, [FromQuery] string role, CancellationToken cancellationToken)
    {
        var removed = await _adminUsersService.RemoveRoleAsync(email, role, cancellationToken);
        return removed ? NoContent() : NotFound();
    }
}
