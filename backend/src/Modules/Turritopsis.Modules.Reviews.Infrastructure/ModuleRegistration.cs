using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Turritopsis.Application.Abstractions;
using Turritopsis.SharedKernel;
using Turritopsis.Modules.Reviews.Application;
namespace Turritopsis.Modules.Reviews.Infrastructure;
public static class ModuleRegistration
{
    public static IServiceCollection AddReviewsAdapters(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ReviewsDbContext>(o => o.UseNpgsql(configuration.GetConnectionString("Default")));
        services.AddScoped<IDossierReadRepository, DossierReadRepository>();
        services.AddScoped<IDossierQueries, DossierQueries>();
        services.AddScoped<IDossierCommands, DossierCommands>();
        services.AddScoped<IOutboxProcessor, ReviewOutboxProcessor>();
        services.AddScoped<IDossierRepository, DossierRepository>();
        services.AddScoped<DossierService>();
        services.AddScoped<IDossierService>(p => p.GetRequiredService<DossierService>());
        services.AddScoped<DossierReaders>();
        services.AddScoped<IDossierEvidenceLocator>(p => p.GetRequiredService<DossierReaders>());
        services.AddScoped<IDossierCompanyReader>(p => p.GetRequiredService<DossierReaders>());
        services.AddScoped<IDossierSummaryReader>(p => p.GetRequiredService<DossierReaders>());
        return services;
    }
}
