using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Turritopsis.Application.Abstractions;
using Turritopsis.Infrastructure.Email;
namespace Turritopsis.Api.Modules;

public static class EmailModule
{
    public static IServiceCollection AddEmailModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.SectionName));
        services.AddHttpClient<IEmailService, ResendEmailService>();
        return services;
    }
}
