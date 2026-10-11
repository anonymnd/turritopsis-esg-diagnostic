using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Turritopsis.Application.Abstractions;
using Turritopsis.Modules.Administration.Application;
namespace Turritopsis.Api.Modules;

public static class AdministrationModule
{
    public static IServiceCollection AddAdministrationModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IAdminOverviewService, AdminOverviewService>();
        services.AddScoped<IAdminUsersService, AdminUsersService>();
        return services;
    }
}
