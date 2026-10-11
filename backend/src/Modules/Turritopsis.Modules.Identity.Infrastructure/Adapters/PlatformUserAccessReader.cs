using Microsoft.AspNetCore.Identity;
using Turritopsis.Infrastructure.Identity;
using Turritopsis.SharedKernel;
namespace Turritopsis.Modules.Identity.Infrastructure;
internal sealed class PlatformUserAccessReader(UserManager<ApplicationUser> users) : IPlatformUserAccessReader
{
    public async Task<PlatformUserAccess> ReadAsync(Guid userId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        var user = await users.FindByIdAsync(userId.ToString());
        if (user is null) return new(false, false);
        var roles = await users.GetRolesAsync(user);
        return new(true, roles.Any(r => r is "reviewer" or "admin"));
    }
}
