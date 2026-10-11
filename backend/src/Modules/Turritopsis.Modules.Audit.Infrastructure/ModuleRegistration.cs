using Microsoft.EntityFrameworkCore;
using Turritopsis.Modules.Audit.Application;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Turritopsis.Application.Abstractions;
using Turritopsis.SharedKernel;

namespace Turritopsis.Modules.Audit.Infrastructure;
public static class ModuleRegistration
{
    public static IServiceCollection AddAuditAdapters(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AuditDbContext>(o => o.UseNpgsql(configuration.GetConnectionString("Default")));
        services.AddScoped<IAuditTrail, AuditTrail>();
        services.AddScoped<IDomainEventHandler, DossierEventHandler>();
        services.AddScoped<INotificationReader, NotificationReader>();
        services.AddOptions<FirebaseOptions>().Bind(configuration.GetSection(FirebaseOptions.SectionName))
            .Validate(o => !o.Enabled || !string.IsNullOrWhiteSpace(o.ProjectId), "Firebase:ProjectId is required when enabled.").ValidateOnStart();
        services.AddSingleton<IPushSender, FirebasePushSender>();
        services.AddScoped<IPushSubscriptionRepository, PushSubscriptionRepository>();
        services.AddScoped<IPushSubscriptions, PushSubscriptions>();
        services.AddScoped<IPushQueueProcessor, PushQueueProcessor>();
        return services;
    }
}
