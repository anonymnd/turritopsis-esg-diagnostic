using Microsoft.EntityFrameworkCore;
using Turritopsis.Infrastructure.Persistence;
using Turritopsis.SharedKernel;
namespace Turritopsis.Api.Startup;
public static class DatabaseInitialization {
 public static async Task InitializeDatabaseAsync(this WebApplication app) {
  using var scope=app.Services.CreateScope();
  await scope.ServiceProvider.GetRequiredService<TurritopsisDbContext>().Database.MigrateAsync();
  await scope.ServiceProvider.GetRequiredService<IIdentityBootstrap>().InitializeAsync(app.Configuration["AdminSeed:Email"],app.Configuration["AdminSeed:Password"],CancellationToken.None);
 }
}
