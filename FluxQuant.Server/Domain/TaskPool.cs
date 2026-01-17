namespace FluxQuant.Server.Domain;

/// <summary>
/// 任务池实体 - 核心实体，承载工作量的蓄水池
/// </summary>
public class TaskPool
{
    public int Id { get; set; }
    
    /// <summary>所属阶段ID</summary>
    public int StageId { get; set; }
    
    /// <summary>任务池名称（如：合同扫描_批次A）</summary>
    public required string Name { get; set; }
    
    /// <summary>
    /// 当前总量（动态分母）
    /// 修改此值必须创建 PoolAdjustmentLog
    /// </summary>
    public int TotalQuota { get; set; }
    
    /// <summary>任务池描述</summary>
    public string? Description { get; set; }
    
    /// <summary>创建时间</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // 导航属性
    public Stage Stage { get; set; } = null!;
    public ICollection<Allocation> Allocations { get; set; } = [];
    public ICollection<PoolAdjustmentLog> AdjustmentLogs { get; set; } = [];
}
