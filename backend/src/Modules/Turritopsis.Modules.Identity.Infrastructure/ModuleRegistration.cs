using Turritopsis.Modules.Identity.Application;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Turritopsis.Application.Abstractions;
using Turritopsis.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Turritopsis.Infrastructure.Identity;
using Turritopsis.Infrastructure.Auth;
namespace Turritopsis.Modules.Identity.Infrastructure;
public static class ModuleRegistration {
 public static IServiceCollection AddIdentityAdapters(this IServiceCollection services,IConfiguration configuration){
 services.AddDbContext<IdentityModuleDbContext>(o=>o.UseNpgsql(configuration.GetConnectionString("Default")));
 services.AddIdentityCore<ApplicationUser>(o=>{o.Password.RequiredLength=8;o.User.RequireUniqueEmail=true;}).AddRoles<IdentityRole<Guid>>().AddEntityFrameworkStores<IdentityModuleDbContext>().AddDefaultTokenProviders();
 services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
 services.AddSingleton(configuration.GetSection(FrontendOptions.SectionName).Get<FrontendOptions>()??new FrontendOptions());
 services.AddSingleton<ITokenIssuer,JwtTokenGenerator>();services.AddScoped<IdentityAccounts>();
 services.AddScoped<IIdentityAccounts>(p=>p.GetRequiredService<IdentityAccounts>());services.AddScoped<IIdentityBootstrap>(p=>p.GetRequiredService<IdentityAccounts>());services.AddScoped<IAuthService,AuthService>();
 services.AddScoped<IPlatformUserAccessReader,PlatformUserAccessReader>();
 return services;
 }
}
