using FluxQuant.Server.Domain.Enums;

namespace FluxQuant.Server.Domain;

/// <summary>
/// 用户实体
/// </summary>
public class User
{
    public int Id { get; set; }
    
    /// <summary>用户名（登录名）</summary>
    public required string Username { get; set; }
    
    /// <summary>邮箱</summary>
    public required string Email { get; set; }
    
    /// <summary>密码哈希</summary>
    public required string PasswordHash { get; set; }
    
    /// <summary>显示名称</summary>
    public string? DisplayName { get; set; }
    
    /// <summary>用户角色</summary>
    public UserRole Role { get; set; } = UserRole.Employee;
    
    /// <summary>创建时间</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>是否激活</summary>
    public bool IsActive { get; set; } = true;
    
    // 导航属性
    public ICollection<Allocation> Allocations { get; set; } = [];
    public ICollection<PoolAdjustmentLog> AdjustmentLogs { get; set; } = [];
}
