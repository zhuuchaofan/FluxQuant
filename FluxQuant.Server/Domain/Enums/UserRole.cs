namespace FluxQuant.Server.Domain.Enums;

/// <summary>
/// 用户角色枚举
/// </summary>
public enum UserRole
{
    /// <summary>员工 - 仅能填报和查看自己的任务</summary>
    Employee = 0,
    
    /// <summary>组长/经理 - 可管理团队任务分配</summary>
    Manager = 1,
    
    /// <summary>管理员 - 全局权限</summary>
    Admin = 2
}
