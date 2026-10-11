using Turritopsis.Modules.Companies.Infrastructure;
namespace Turritopsis.Api.Modules;
public static class CompaniesModule {
 public static IServiceCollection AddCompaniesModule(this IServiceCollection services,IConfiguration configuration) => services.AddCompaniesAdapters(configuration);
}
