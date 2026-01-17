using System.ComponentModel.DataAnnotations;

namespace FluxQuant.Server.Features.Auth;

/// <summary>
/// 用户注册请求 DTO
/// </summary>
public record RegisterRequest
{
    /// <summary>用户名</summary>
    [Required]
    [StringLength(50, MinimumLength = 3)]
    public required string Username { get; init; }
    
    /// <summary>邮箱</summary>
    [Required]
    [EmailAddress]
    public required string Email { get; init; }
    
    /// <summary>密码</summary>
    [Required]
    [StringLength(100, MinimumLength = 6)]
    public required string Password { get; init; }
    
    /// <summary>显示名称（可选）</summary>
    public string? DisplayName { get; init; }
}

/// <summary>
/// 用户登录请求 DTO
/// </summary>
public record LoginRequest
{
    /// <summary>用户名或邮箱</summary>
    [Required]
    public required string UsernameOrEmail { get; init; }
    
    /// <summary>密码</summary>
    [Required]
    public required string Password { get; init; }
}

/// <summary>
/// 认证响应 DTO
/// </summary>
public record AuthResponse
{
    /// <summary>JWT 令牌</summary>
    public required string Token { get; init; }
    
    /// <summary>令牌过期时间</summary>
    public DateTime ExpiresAt { get; init; }
    
    /// <summary>用户信息</summary>
    public required UserDto User { get; init; }
}

/// <summary>
/// 用户信息 DTO
/// </summary>
public record UserDto
{
    public int Id { get; init; }
    public required string Username { get; init; }
    public required string Email { get; init; }
    public string? DisplayName { get; init; }
    public required string Role { get; init; }
}
