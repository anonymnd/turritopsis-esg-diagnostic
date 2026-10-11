using Turritopsis.Modules.Documents.Infrastructure;
namespace Turritopsis.Api.Modules;
public static class DocumentsModule {
 public static IServiceCollection AddDocumentsModule(this IServiceCollection services,IConfiguration configuration) => services.AddDocumentsAdapters(configuration);
}
