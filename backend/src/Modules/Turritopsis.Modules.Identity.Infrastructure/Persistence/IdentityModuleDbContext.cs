using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Turritopsis.Infrastructure.Identity;
namespace Turritopsis.Modules.Identity.Infrastructure;
internal sealed class IdentityModuleDbContext(DbContextOptions<IdentityModuleDbContext> options) : IdentityDbContext<ApplicationUser,IdentityRole<Guid>,Guid>(options);
