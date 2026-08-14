using System.Security.Claims;
using Turritopsis.Application.Abstractions;

namespace Turritopsis.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        var user = httpContextAccessor.HttpContext?.User;
        var sub = user?.FindFirstValue(ClaimTypes.NameIdentifier) ?? user?.FindFirstValue("sub");
        UserId = Guid.TryParse(sub, out var id) ? id : null;
        Roles = user?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToArray() ?? Array.Empty<string>();
    }

    public Guid? UserId { get; }
    public IReadOnlyList<string> Roles { get; }
}
