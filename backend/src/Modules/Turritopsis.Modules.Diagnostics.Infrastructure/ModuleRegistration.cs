using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Turritopsis.Application.Abstractions;
using Turritopsis.SharedKernel;
using Turritopsis.Modules.Diagnostics.Application;
namespace Turritopsis.Modules.Diagnostics.Infrastructure;
public static class ModuleRegistration {
 public static IServiceCollection AddDiagnosticsAdapters(this IServiceCollection services,IConfiguration configuration){
 services.AddDbContext<DiagnosticsDbContext>(o=>o.UseNpgsql(configuration.GetConnectionString("Default")));
 services.AddScoped<ISnapshotRepository,SnapshotRepository>();services.AddScoped<SnapshotService>();
 services.AddScoped<ISnapshotService>(p=>p.GetRequiredService<SnapshotService>());services.AddScoped<ISnapshotReader>(p=>p.GetRequiredService<SnapshotService>());
 return services;
 }
}
