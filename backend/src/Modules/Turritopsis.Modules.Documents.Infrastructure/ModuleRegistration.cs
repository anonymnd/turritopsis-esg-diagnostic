using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Turritopsis.Application.Abstractions;
using Turritopsis.SharedKernel;
using Turritopsis.Modules.Documents.Application;
using Turritopsis.Infrastructure.Storage;
namespace Turritopsis.Modules.Documents.Infrastructure;
public static class ModuleRegistration {
 public static IServiceCollection AddDocumentsAdapters(this IServiceCollection services,IConfiguration configuration){
 services.AddDbContext<DocumentsDbContext>(o=>o.UseNpgsql(configuration.GetConnectionString("Default")));
 services.AddScoped<IFrozenEvidenceStore,FrozenEvidenceStore>();
 services.AddScoped<IDocumentRepository,DocumentRepository>();services.AddScoped<DocumentService>();
 services.AddScoped<IDocumentService>(p=>p.GetRequiredService<DocumentService>());services.AddScoped<ICompanyEvidenceReader,CompanyEvidenceReader>();services.AddScoped<IFileStorage,DatabaseFileStorage>();
 return services;
 }
}
