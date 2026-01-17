namespace FluxQuant.Server.Domain;

/// <summary>
/// 项目实体 - 宏观容器
/// </summary>
public class Project
{
    public int Id { get; set; }
    
    /// <summary>项目名称</summary>
    public required string Name { get; set; }
    
    /// <summary>项目代码（如 2026-Q1）</summary>
    public required string Code { get; set; }
    
    /// <summary>项目描述</summary>
    public string? Description { get; set; }
    
    /// <summary>是否激活</summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>创建时间</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // 导航属性
    public ICollection<Stage> Stages { get; set; } = [];
}
