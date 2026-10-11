using Turritopsis.Modules.Reviews.Infrastructure;
namespace Turritopsis.Api.Modules;
public static class DossiersModule {
 public static IServiceCollection AddDossiersModule(this IServiceCollection services,IConfiguration configuration) => services.AddReviewsAdapters(configuration);
}
