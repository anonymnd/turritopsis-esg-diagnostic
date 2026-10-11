using Turritopsis.Api.Modules;
using Turritopsis.Api.Startup;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddApiHosting(builder.Configuration);
builder.Services.AddApplicationModules(builder.Configuration);

var app = builder.Build();
app.UseApiHosting();
await app.InitializeDatabaseAsync();
app.Run();
