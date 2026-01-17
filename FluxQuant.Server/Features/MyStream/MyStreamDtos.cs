namespace FluxQuant.Server.Features.MyStream;

/// <summary>
/// 我的分配任务 DTO
/// </summary>
public record MyAllocationDto
{
    public int Id { get; init; }
    public int TaskPoolId { get; init; }
    public required string TaskPoolName { get; init; }
    public required string StageName { get; init; }
    public required string ProjectName { get; init; }
    public int TargetQuota { get; init; }
    public int CurrentValid { get; init; }
    public int CurrentExcluded { get; init; }
    
    /// <summary>剩余量 = 目标 - 已完成 - 除外</summary>
    public int Remaining => TargetQuota - CurrentValid - CurrentExcluded;
    
    /// <summary>进度百分比</summary>
    public decimal ProgressPercent => TargetQuota > 0 
        ? Math.Round((decimal)(CurrentValid + CurrentExcluded) / TargetQuota * 100, 1) 
        : 0;
    
    /// <summary>是否已达标</summary>
    public bool IsCompleted => CurrentValid + CurrentExcluded >= TargetQuota;
    
    /// <summary>最近一次填报</summary>
    public LastReportDto? LastReport { get; init; }
}

/// <summary>
/// 最近一次填报信息
/// </summary>
public record LastReportDto
{
    public DateTime CreatedAt { get; init; }
    public int ValidQty { get; init; }
    public int ExcludedQty { get; init; }
}

/// <summary>
/// 生产日志详情 DTO
/// </summary>
public record ProductionLogDto
{
    public long Id { get; init; }
    public DateOnly LogDate { get; init; }
    public int ValidQty { get; init; }
    public int ExcludedQty { get; init; }
    public string? ExclusionReason { get; init; }
    public string? Comment { get; init; }
    public bool IsBackfill { get; init; }
    public DateTime CreatedAt { get; init; }
}
