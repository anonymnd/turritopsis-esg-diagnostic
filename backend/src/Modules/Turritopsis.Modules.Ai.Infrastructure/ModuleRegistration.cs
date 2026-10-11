using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Turritopsis.Application.Abstractions;
using Turritopsis.Modules.Ai.Application;
using Turritopsis.Modules.Ai.Infrastructure;
namespace Turritopsis.Modules.Ai.Infrastructure;
public static class ModuleRegistration {
 public static IServiceCollection AddAiAdapters(this IServiceCollection services,IConfiguration configuration) {
 services.Configure<AiOptions>(configuration.GetSection(AiOptions.SectionName));services.AddHttpClient<IAiProvider,OpenAiCompatibleProvider>();
 services.AddScoped<IAiFailureReporter,AiFailureReporter>();services.AddScoped<IAiReviewService,AiReviewService>();return services;
 }
}
