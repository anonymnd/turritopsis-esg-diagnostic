using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Turritopsis.Infrastructure.Persistence;
namespace Turritopsis.Api.Modules;

public static class PersistenceModule
{
    public static IServiceCollection AddPersistenceModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<TurritopsisDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Default")));
        return services;
    }
}
