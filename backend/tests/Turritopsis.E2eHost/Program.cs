using Microsoft.EntityFrameworkCore;
using Npgsql;
using Turritopsis.Api.Controllers;
using Turritopsis.Api.Modules;
using Turritopsis.Api.Startup;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Auth.Models;
using Turritopsis.Application.Admin.Models;
using Turritopsis.Application.Companies.Models;
using Turritopsis.Modules.Reviews.Application;
using Turritopsis.Infrastructure.Persistence;
using Turritopsis.Domain.Entities;

// Test-only executable: never registered in the production API.
var source=Environment.GetEnvironmentVariable("TURRITOPSIS_TEST_CONNECTION")
 ?? throw new InvalidOperationException("TURRITOPSIS_TEST_CONNECTION is required; no application database fallback.");
var connection=new NpgsqlConnectionStringBuilder(source);
var database="turritopsis_e2e_"+Guid.NewGuid().ToString("N");
var admin=new NpgsqlConnection(new NpgsqlConnectionStringBuilder(source){Database="postgres",Pooling=false}.ConnectionString);
await admin.OpenAsync();
await using(var command=new NpgsqlCommand($"CREATE DATABASE \"{database}\"",admin)){await command.ExecuteNonQueryAsync();}
connection.Database=database;
try {
 var builder=WebApplication.CreateBuilder(new WebApplicationOptions{EnvironmentName="Development"});
 builder.Logging.ClearProviders();
 builder.Configuration.AddInMemoryCollection(new Dictionary<string,string?> {
  ["ConnectionStrings:Default"]=connection.ConnectionString,["Jwt:Key"]="fictional-e2e-signing-key-32-characters-long",
  ["Jwt:Issuer"]="turritopsis-e2e",["Jwt:Audience"]="turritopsis-e2e-browser",
  ["Ai:AllowRemote"]="false",["Email:Enabled"]="false",["Firebase:Enabled"]="false",
  ["AdminSeed:Email"]="admin@e2e.example",["AdminSeed:Password"]="Fixture-Test-42!",
  ["FrontendOrigins"]="http://127.0.0.1:5175",["Frontend:BaseUrl"]="http://127.0.0.1:5175"
 });
 builder.Services.AddApiHosting(builder.Configuration);builder.Services.AddApplicationModules(builder.Configuration);
 builder.Services.AddControllers().AddApplicationPart(typeof(AuthController).Assembly);
 await using var app=builder.Build();
 await app.InitializeDatabaseAsync();
 using(var scope=app.Services.CreateScope()) {
  var p=scope.ServiceProvider;var ct=CancellationToken.None;
  var reviewer=await p.GetRequiredService<IAdminUsersService>().CreateReviewerAsync(Guid.NewGuid(),new CreateReviewerRequest("reviewer@e2e.example","Fixture-Test-42!"),ct);
  if(!reviewer.Success)throw new InvalidOperationException("Reviewer fixture failed");
  var owner=await p.GetRequiredService<IAuthService>().RegisterAsync(new RegisterRequest("legacy@e2e.example","Fixture-Test-42!","Legacy Company","Industry","Rabat"),ct);
  await p.GetRequiredService<ICompanyService>().UpdateProfileAsync(owner.UserId!.Value,new UpdateCompanyProfileRequest("Rabat","TEST-ICE","10-50",null,"fixture-phone","fixture-activity"),ct);
  var dossier=new Dossier{Id=Guid.NewGuid(),CompanyId=owner.CompanyId!.Value,CreatedAt=DateTimeOffset.UtcNow};
  dossier.Submit(owner.UserId.Value,"{}",50,50);
  await p.GetRequiredService<IDossierRepository>().SaveAsync(dossier,ct);
 }
 app.UseApiHosting();
 await app.RunAsync("http://127.0.0.1:5017");
} finally {
 NpgsqlConnection.ClearAllPools();
 await using var drop=new NpgsqlCommand($"DROP DATABASE \"{database}\" WITH (FORCE)",admin);await drop.ExecuteNonQueryAsync();await admin.DisposeAsync();
}
