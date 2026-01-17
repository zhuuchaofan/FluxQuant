using System.Text;
using Carter;
using FluxQuant.Server.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using Serilog;

// === Serilog 配置 ===
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

try
{
    Log.Information("启动 FluxQuant 服务器...");

    var builder = WebApplication.CreateBuilder(args);

    // 使用 Serilog
    builder.Host.UseSerilog();

    // === 服务注册 ===

    // EF Core + PostgreSQL
    builder.Services.AddDbContext<FluxQuantDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

    // JWT 认证
    var jwtKey = builder.Configuration["Jwt:Key"] 
        ?? throw new InvalidOperationException("JWT Key 未配置");
    var jwtIssuer = builder.Configuration["Jwt:Issuer"];
    var jwtAudience = builder.Configuration["Jwt:Audience"];

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
            };
        });

    builder.Services.AddAuthorization();

    // 业务服务
    builder.Services.AddScoped<FluxQuant.Server.Features.Auth.AuthService>();

    // Carter (Minimal API 路由)
    builder.Services.AddCarter();

    // OpenAPI (.NET 10 原生支持)
    builder.Services.AddOpenApi();

    // CORS（开发环境允许前端访问）
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("Development", policy =>
        {
            policy.WithOrigins("http://localhost:3000")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
    });

    var app = builder.Build();

    // === 中间件管道 ===

    // 开发环境启用 OpenAPI UI
    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference(options =>
        {
            options.Title = "FluxQuant API";
            options.Theme = ScalarTheme.BluePlanet;
        });
        app.UseCors("Development");
    }

    app.UseHttpsRedirection();

    // 认证 & 授权
    app.UseAuthentication();
    app.UseAuthorization();

    // 注册 Carter 路由
    app.MapCarter();

    // 健康检查端点
    app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Timestamp = DateTime.UtcNow }))
        .WithName("HealthCheck")
        .WithTags("Health");

    Log.Information("FluxQuant 服务器已启动，访问 /scalar/v1 查看 API 文档");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "应用程序启动失败");
}
finally
{
    Log.CloseAndFlush();
}
