using Turritopsis.Modules.Ai.Infrastructure;
namespace Turritopsis.Api.Modules;
public static class AiModule {
public static IServiceCollection AddAiModule(this IServiceCollection services,IConfiguration configuration) => services.AddAiAdapters(configuration);
}
