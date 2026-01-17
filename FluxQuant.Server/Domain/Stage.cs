namespace FluxQuant.Server.Domain;

/// <summary>
/// 阶段实体 - 项目的逻辑切片
/// </summary>
public class Stage
{
    public int Id { get; set; }
    
    /// <summary>所属项目ID</summary>
    public int ProjectId { get; set; }
    
    /// <summary>阶段名称（如：扫描、清洗、录入）</summary>
    public required string Name { get; set; }
    
    /// <summary>排序顺序</summary>
    public int Order { get; set; }
    
    /// <summary>阶段描述</summary>
    public string? Description { get; set; }
    
    // 导航属性
    public Project Project { get; set; } = null!;
    public ICollection<TaskPool> TaskPools { get; set; } = [];
}
