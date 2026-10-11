using Turritopsis.Modules.Audit.Infrastructure;
using Turritopsis.Api.Services;
using Turritopsis.Application.Abstractions;

namespace Turritopsis.Api.Modules;

public static class ApplicationModules
{
    public static IServiceCollection AddApplicationModules(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddPersistenceModule(configuration);
        services.AddAuditAdapters(configuration);
        services.AddAuthenticationModule(configuration);
        services.AddCompaniesModule(configuration);
        services.AddQuestionnaireModule(configuration);
        services.AddDocumentsModule(configuration);
        services.AddDossiersModule(configuration);
        services.AddAdministrationModule(configuration);
        services.AddAiModule(configuration);
        services.AddEmailModule(configuration);
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddSingleton<SlidingWindowRateLimiter>();
        services.AddScoped<Turritopsis.SharedKernel.IDomainEventDispatcher, DomainEventDispatcher>();
        services.AddHostedService<OutboxWorker>();
        services.AddHostedService<PushQueueWorker>();
        return services;
    }
}
