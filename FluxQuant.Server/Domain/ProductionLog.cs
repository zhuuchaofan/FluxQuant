namespace FluxQuant.Server.Domain;

/// <summary>
/// 生产日志实体 - 记录每一次填报
/// </summary>
public class ProductionLog
{
    public long Id { get; set; }
    
    /// <summary>关联的分配单元ID</summary>
    public int AllocationId { get; set; }
    
    /// <summary>业务日期（填报的工作日期）</summary>
    public DateOnly LogDate { get; set; }
    
    /// <summary>有效产出数量</summary>
    public int ValidQty { get; set; }
    
    /// <summary>除外数量</summary>
    public int ExcludedQty { get; set; }
    
    /// <summary>
    /// 除外原因
    /// 当 ExcludedQty > 0 时必填
    /// </summary>
    public string? ExclusionReason { get; set; }
    
    /// <summary>备注（如坏数据的文件名或ID）</summary>
    public string? Comment { get; set; }
    
    /// <summary>是否为补报</summary>
    public bool IsBackfill { get; set; }
    
    /// <summary>创建时间（系统时间戳）</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // 导航属性
    public Allocation Allocation { get; set; } = null!;
}
