using Carter;

namespace FluxQuant.Server.Features.Auth;

/// <summary>
/// 认证相关端点
/// </summary>
public class AuthEndpoints : ICarterModule
{
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
    }

    /// <summary>
    /// 用户注册
    /// </summary>
    private static async Task<IResult> Register(
        RegisterRequest request,
        AuthService authService,
        CancellationToken ct)
    {
        var result = await authService.RegisterAsync(request, ct);
        
        return result.IsSuccess 
            ? Results.Created($"/api/v1/users/{result.Data!.User.Id}", result.Data)
            : Results.BadRequest(new { Error = result.Error });
    }

    /// <summary>
    /// 用户登录
    /// </summary>
    private static async Task<IResult> Login(
        LoginRequest request,
        AuthService authService,
        CancellationToken ct)
    {
        var result = await authService.LoginAsync(request, ct);
        
        return result.IsSuccess 
            ? Results.Ok(result.Data)
            : Results.Unauthorized();
    }
}
