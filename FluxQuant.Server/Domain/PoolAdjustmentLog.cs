namespace FluxQuant.Server.Domain;

/// <summary>
/// 配额调整日志实体 - 记录每一次分母变化
/// </summary>
public class PoolAdjustmentLog
{
    public int Id { get; set; }
    
    /// <summary>关联的任务池ID</summary>
    public int TaskPoolId { get; set; }
    
    /// <summary>操作者用户ID</summary>
    public int OperatorUserId { get; set; }
    
    /// <summary>调整前配额</summary>
    public int OldQuota { get; set; }
    
    /// <summary>调整后配额</summary>
    public int NewQuota { get; set; }
    
    /// <summary>变更原因（必填）</summary>
    public required string Reason { get; set; }
    
    /// <summary>创建时间</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // 导航属性
    public TaskPool TaskPool { get; set; } = null!;
    public User Operator { get; set; } = null!;
}
