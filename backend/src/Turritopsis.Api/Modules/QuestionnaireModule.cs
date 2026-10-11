using Turritopsis.Modules.Diagnostics.Infrastructure;
namespace Turritopsis.Api.Modules;
public static class QuestionnaireModule {
 public static IServiceCollection AddQuestionnaireModule(this IServiceCollection services,IConfiguration configuration) => services.AddDiagnosticsAdapters(configuration);
}
