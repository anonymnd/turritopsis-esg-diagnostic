using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Common;

namespace Turritopsis.Api.Controllers;

public record UpsertSnapshotRequest(string DataJson);

[ApiController]
[Authorize]
[Route("api/v1/snapshots")]
public class SnapshotsController : ControllerBase
{
    private readonly ISnapshotService _snapshotService;
    private readonly ICurrentUserService _currentUser;

    public SnapshotsController(ISnapshotService snapshotService, ICurrentUserService currentUser)
    {
        _snapshotService = snapshotService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();

        var result = await _snapshotService.GetForUserAsync(userId, cancellationToken);
        return result.Access switch
        {
            MembershipAccess.Forbidden => Forbid(),
            _ => Ok(result.Snapshot)
        };
    }

    [HttpPut]
    public async Task<IActionResult> Upsert(UpsertSnapshotRequest request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();

        var result = await _snapshotService.UpsertForUserAsync(userId, request.DataJson, cancellationToken);
        return result.Access switch
        {
            MembershipAccess.Forbidden => Forbid(),
            _ => Ok(result.Snapshot)
        };
    }
}
