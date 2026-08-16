using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Turritopsis.Api.Services;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Auth.Validators;
using Turritopsis.Infrastructure.Ai;
using Turritopsis.Infrastructure.Auth;
using Turritopsis.Infrastructure.Admin;
using Turritopsis.Infrastructure.Companies;
using Turritopsis.Infrastructure.Documents;
using Turritopsis.Infrastructure.Dossiers;
using Turritopsis.Infrastructure.Email;
using Turritopsis.Infrastructure.Identity;
using Turritopsis.Infrastructure.Persistence;
using Turritopsis.Infrastructure.Snapshots;
using Turritopsis.Infrastructure.Storage;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<TurritopsisDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.Password.RequiredLength = 8;
        options.User.RequireUniqueEmail = true;
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<TurritopsisDbContext>()
    .AddDefaultTokenProviders();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<FrontendOptions>(builder.Configuration.GetSection(FrontendOptions.SectionName));
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection(EmailOptions.SectionName));
builder.Services.AddHttpClient<IEmailService, ResendEmailService>();
builder.Services.AddSingleton<JwtTokenGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICompanyService, CompanyService>();
builder.Services.AddScoped<ISnapshotService, SnapshotService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IDossierService, DossierService>();
builder.Services.AddScoped<IAdminOverviewService, AdminOverviewService>();
builder.Services.AddScoped<IAdminUsersService, AdminUsersService>();
builder.Services.AddScoped<IFileStorage, DatabaseFileStorage>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

builder.Services.Configure<AiOptions>(builder.Configuration.GetSection(AiOptions.SectionName));
builder.Services.AddHttpClient<IAiReviewService, AiReviewService>();
builder.Services.AddSingleton<Turritopsis.Api.Services.SlidingWindowRateLimiter>();

builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

const string FrontendCorsPolicy = "Frontend";
var frontendOrigins = (builder.Configuration["FrontendOrigins"] ?? "http://localhost:5173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
        policy.WithOrigins(frontendOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors(FrontendCorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    // Apply pending migrations on startup so a fresh database (e.g. a new
    // deploy target) ends up schema-complete without a manual step.
    var db = scope.ServiceProvider.GetRequiredService<TurritopsisDbContext>();
    await db.Database.MigrateAsync();

    // Ensure the platform-level roles exist. There is no self-service signup
    // for reviewer/admin — promoting a user to one of these roles is a manual
    // step (see docs/rewrite), this just guarantees the roles themselves exist.
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    foreach (var role in new[] { "reviewer", "admin" })
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole<Guid>(role));
        }
    }

    // Bootstrap the very first admin from config (env vars in prod). This is
    // the only path that creates an admin — everything after that goes
    // through POST /api/v1/admin/reviewers, which itself requires an admin
    // JWT. Idempotent and a no-op when unset, so it's safe to leave wired
    // on every deploy.
    var adminEmail = builder.Configuration["AdminSeed:Email"];
    var adminPassword = builder.Configuration["AdminSeed:Password"];
    if (!string.IsNullOrWhiteSpace(adminEmail) && !string.IsNullOrWhiteSpace(adminPassword))
    {
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser is not null && !await userManager.IsInRoleAsync(adminUser, "admin"))
        {
            // This email already belongs to some other account (a PME
            // signup, most likely) — never blend that identity into admin
            // access. Pick a dedicated AdminSeed email instead.
            app.Logger.LogWarning(
                "AdminSeed: {Email} already exists as a non-admin account — refusing to promote it. Use a dedicated email for AdminSeed:Email.",
                adminEmail);
            adminUser = null;
        }
        else if (adminUser is null)
        {
            var candidate = new ApplicationUser { UserName = adminEmail, Email = adminEmail };
            var createResult = await userManager.CreateAsync(candidate, adminPassword);
            if (!createResult.Succeeded)
            {
                app.Logger.LogWarning(
                    "AdminSeed: could not create admin account for {Email}: {Errors}",
                    adminEmail,
                    string.Join("; ", createResult.Errors.Select(e => e.Description)));
                adminUser = null;
            }
            else
            {
                adminUser = candidate;
            }
        }

        if (adminUser is not null && !await userManager.IsInRoleAsync(adminUser, "admin"))
        {
            await userManager.AddToRoleAsync(adminUser, "admin");
        }
    }
}

app.Run();
