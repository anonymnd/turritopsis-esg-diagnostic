using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Turritopsis.Application.Abstractions;
using Turritopsis.SharedKernel;
using Turritopsis.Modules.Companies.Application;
namespace Turritopsis.Modules.Companies.Infrastructure;
public static class ModuleRegistration {
 public static IServiceCollection AddCompaniesAdapters(this IServiceCollection services,IConfiguration configuration){
 services.AddDbContext<CompaniesDbContext>(o=>o.UseNpgsql(configuration.GetConnectionString("Default")));
 services.AddScoped<ICompanyRepository,CompanyRepository>();
 services.AddScoped<CompanyService>();services.AddScoped<ICompanyService>(p=>p.GetRequiredService<CompanyService>());
 services.AddScoped<ICompanyDirectory>(p=>p.GetRequiredService<CompanyService>());services.AddScoped<ICompanyRegistration>(p=>p.GetRequiredService<CompanyService>());
 return services;
 }
}
