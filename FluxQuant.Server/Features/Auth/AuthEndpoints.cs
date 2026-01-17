using Carter;

namespace FluxQuant.Server.Features.Auth;

/// <summary>
/// 认证相关端点
/// </summary>
public class AuthEndpoints : ICarterModule
{
    private const string AuthCookieName = "fluxquant_token";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/auth")
            .WithTags("Auth");

        group.MapPost("/register", Register)
            .WithName("Register")
            .WithSummary("用户注册")
            .WithDescription("创建新用户账户");

        group.MapPost("/login", Login)
            .WithName("Login")
            .WithSummary("用户登录")
            .WithDescription("使用用户名/邮箱和密码登录");

        group.MapPost("/logout", Logout)
            .WithName("Logout")
            .WithSummary("用户登出")
            .WithDescription("清除认证 Cookie");

        group.MapGet("/me", GetCurrentUser)
            .WithName("GetCurrentUser")
            .WithSummary("获取当前用户信息")
            .RequireAuthorization();
    }

    /// <summary>
    /// 用户注册
    /// </summary>
    private static async Task<IResult> Register(
        RegisterRequest request,
        AuthService authService,
        HttpContext httpContext,
        CancellationToken ct)
    {
        var result = await authService.RegisterAsync(request, ct);
        
        if (!result.IsSuccess)
        {
            return Results.BadRequest(new { Error = result.Error });
        }

        // 设置 HttpOnly Cookie
        SetAuthCookie(httpContext, result.Data!.Token);
        
        return Results.Created($"/api/v1/users/{result.Data!.User.Id}", result.Data);
    }

    /// <summary>
    /// 用户登录
    /// </summary>
    private static async Task<IResult> Login(
        LoginRequest request,
        AuthService authService,
        HttpContext httpContext,
        CancellationToken ct)
    {
        var result = await authService.LoginAsync(request, ct);
        
        if (!result.IsSuccess)
        {
            return Results.Unauthorized();
        }

        // 设置 HttpOnly Cookie
        SetAuthCookie(httpContext, result.Data!.Token);
        
        return Results.Ok(result.Data);
    }

    /// <summary>
    /// 用户登出
    /// </summary>
    private static IResult Logout(HttpContext httpContext)
    {
        // 清除 Cookie
        httpContext.Response.Cookies.Delete(AuthCookieName, new CookieOptions
        {
            Path = "/",
            HttpOnly = true,
            Secure = false, // 开发环境使用 HTTP
            SameSite = SameSiteMode.Lax
        });

        return Results.Ok(new { Message = "已登出" });
    }

    /// <summary>
    /// 获取当前用户信息
    /// </summary>
    private static async Task<IResult> GetCurrentUser(
        AuthService authService,
        HttpContext httpContext,
        CancellationToken ct)
    {
        var userId = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out var id))
        {
            return Results.Unauthorized();
        }

        var user = await authService.GetUserByIdAsync(id, ct);
        return user != null ? Results.Ok(user) : Results.Unauthorized();
    }

    private static void SetAuthCookie(HttpContext httpContext, string token)
    {
        httpContext.Response.Cookies.Append(AuthCookieName, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = false, // 开发环境使用 HTTP，生产环境应设为 true
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromDays(7) // 7 天过期
        });
    }
}
