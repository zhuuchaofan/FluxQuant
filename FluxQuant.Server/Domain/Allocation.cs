namespace FluxQuant.Server.Domain;

/// <summary>
/// 分配单元实体 - 连接 TaskPool 与 User 的桥梁
/// </summary>
public class Allocation
{
    public int Id { get; set; }
    
    /// <summary>关联的任务池ID</summary>
    public int TaskPoolId { get; set; }
    
    /// <summary>
    /// 分配给的用户ID
    /// 允许为空以支持"公共池"或"抢单模式"
    /// </summary>
    public int? UserId { get; set; }
    
    /// <summary>目标配额（分配给该用户的量）</summary>
    public int TargetQuota { get; set; }
    
    // === 快照字段（通过事务原子更新）===
    
    /// <summary>当前有效产出（快照）</summary>
    public int CurrentValid { get; set; }
    
    /// <summary>当前除外量（快照）</summary>
    public int CurrentExcluded { get; set; }
    
    /// <summary>是否活跃（禁用后为 false，员工看不到但保留历史数据）</summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>创建时间</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // 导航属性
    public TaskPool TaskPool { get; set; } = null!;
    public User? User { get; set; }
    public ICollection<ProductionLog> Logs { get; set; } = [];
}
