namespace Turritopsis.Api.Startup;

public static class ApiHosting
{
    public const string FrontendCorsPolicy = "Frontend";

    public static IServiceCollection AddApiHosting(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
        
        var frontendOrigins = (configuration["FrontendOrigins"] ?? "http://localhost:5173")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        services.AddCors(options =>
        {
            options.AddPolicy(FrontendCorsPolicy, policy =>
                policy.WithOrigins(frontendOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod());
        });
        return services;
    }

    public static WebApplication UseApiHosting(this WebApplication app)
    {
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
        return app;
    }
}
