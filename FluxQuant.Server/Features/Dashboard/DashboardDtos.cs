namespace FluxQuant.Server.Features.Dashboard;

/// <summary>
/// 仪表板统计 DTO
/// </summary>
public record DashboardStatsDto
{
    /// <summary>活跃项目数</summary>
    public int ActiveProjects { get; init; }
    
    /// <summary>总任务池数</summary>
    public int TotalTaskPools { get; init; }
    
    /// <summary>活跃员工数</summary>
    public int ActiveEmployees { get; init; }
    
    /// <summary>今日填报次数</summary>
    public int TodayReportCount { get; init; }
    
    /// <summary>今日有效产出</summary>
    public int TodayValidOutput { get; init; }
    
    /// <summary>今日除外量</summary>
    public int TodayExcludedOutput { get; init; }
    
    /// <summary>整体进度百分比</summary>
    public decimal OverallProgress { get; init; }
    
    /// <summary>异常任务池数量（除外率>10%）</summary>
    public int AnomalousPoolCount { get; init; }
    
    /// <summary>异常分配数量（员工除外率>10%）</summary>
    public int AnomalousAllocationCount { get; init; }
    
    /// <summary>最近活动</summary>
    public List<RecentActivityDto> RecentActivities { get; init; } = [];
    
    /// <summary>每日趋势（最近7天）</summary>
    public List<DailyTrendDto> DailyTrends { get; init; } = [];
    
    /// <summary>异常热点（任务池级别）</summary>
    public List<AnomalyHotspotDto> AnomalyHotspots { get; init; } = [];
    
    /// <summary>异常分配（员工级别）</summary>
    public List<AllocationAnomalyDto> AllocationAnomalies { get; init; } = [];
}

/// <summary>
/// 最近活动 DTO
/// </summary>
public record RecentActivityDto
{
    public long LogId { get; init; }
    public required string UserName { get; init; }
    public required string TaskPoolName { get; init; }
    public int ValidQty { get; init; }
    public int ExcludedQty { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>
/// 每日趋势 DTO
/// </summary>
public record DailyTrendDto
{
    public DateOnly Date { get; init; }
    public int ValidOutput { get; init; }
    public int ExcludedOutput { get; init; }
    public int ReportCount { get; init; }
}

/// <summary>
/// 异常热点 DTO（任务池级别）
/// </summary>
public record AnomalyHotspotDto
{
    public int TaskPoolId { get; init; }
    public required string TaskPoolName { get; init; }
    public required string StageName { get; init; }
    public required string ProjectName { get; init; }
    public int TotalQuota { get; init; }
    public int TotalExcluded { get; init; }
    public decimal ExclusionRate { get; init; }
    public required string TopReason { get; init; }
}

/// <summary>
/// 分配级别异常 DTO
/// </summary>
public record AllocationAnomalyDto
{
    public int AllocationId { get; init; }
    public required string UserName { get; init; }
    public required string TaskPoolName { get; init; }
    public required string ProjectName { get; init; }
    public int TargetQuota { get; init; }
    public int CurrentValid { get; init; }
    public int CurrentExcluded { get; init; }
    public decimal ExclusionRate { get; init; }
    public required string TopReason { get; init; }
}
