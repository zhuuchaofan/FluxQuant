using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FluxQuant.Server.Domain;
using FluxQuant.Server.Domain.Enums;
using FluxQuant.Server.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace FluxQuant.Server.Features.Auth;

/// <summary>
/// 认证服务
/// </summary>
public class AuthService
{
    private readonly FluxQuantDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        FluxQuantDbContext dbContext,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// 用户注册
    /// </summary>
    public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        // 检查用户名是否已存在
        if (await _dbContext.Users.AnyAsync(u => u.Username == request.Username, ct))
        {
            return Result<AuthResponse>.Failure("用户名已被使用");
        }

        // 检查邮箱是否已存在
        if (await _dbContext.Users.AnyAsync(u => u.Email == request.Email, ct))
        {
            return Result<AuthResponse>.Failure("邮箱已被注册");
        }

        // 创建用户
        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            DisplayName = request.DisplayName,
            Role = UserRole.Employee // 默认为员工角色
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("新用户注册成功: {Username}", user.Username);

        // 生成 Token 并返回
        return Result<AuthResponse>.Success(GenerateAuthResponse(user));
    }

    /// <summary>
    /// 用户登录
    /// </summary>
    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        // 查找用户（支持用户名或邮箱登录）
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => 
                u.Username == request.UsernameOrEmail || 
                u.Email == request.UsernameOrEmail, ct);

        if (user == null)
        {
            return Result<AuthResponse>.Failure("用户名或密码错误");
        }

        // 验证密码
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Result<AuthResponse>.Failure("用户名或密码错误");
        }

        // 检查用户是否激活
        if (!user.IsActive)
        {
            return Result<AuthResponse>.Failure("账户已被禁用");
        }

        _logger.LogInformation("用户登录成功: {Username}", user.Username);

        return Result<AuthResponse>.Success(GenerateAuthResponse(user));
    }

    /// <summary>
    /// 根据 ID 获取用户信息
    /// </summary>
    public async Task<UserDto?> GetUserByIdAsync(int id, CancellationToken ct = default)
    {
        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (user == null) return null;

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            DisplayName = user.DisplayName,
            Role = user.Role.ToString()
        };
    }

    /// <summary>
    /// 生成 JWT Token 和响应
    /// </summary>
    private AuthResponse GenerateAuthResponse(User user)
    {
        var jwtKey = _configuration["Jwt:Key"]!;
        var jwtIssuer = _configuration["Jwt:Issuer"];
        var jwtAudience = _configuration["Jwt:Audience"];
        var expirationMinutes = int.Parse(_configuration["Jwt:ExpirationMinutes"] ?? "1440");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var expiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return new AuthResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAt = expiresAt,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                DisplayName = user.DisplayName,
                Role = user.Role.ToString()
            }
        };
    }
}

/// <summary>
/// 通用结果包装器
/// </summary>
public record Result<T>
{
    public bool IsSuccess { get; init; }
    public T? Data { get; init; }
    public string? Error { get; init; }

    public static Result<T> Success(T data) => new() { IsSuccess = true, Data = data };
    public static Result<T> Failure(string error) => new() { IsSuccess = false, Error = error };
}
