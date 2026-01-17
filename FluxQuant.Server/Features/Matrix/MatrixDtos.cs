namespace FluxQuant.Server.Features.Matrix;

/// <summary>
/// 矩阵单元格 DTO
/// </summary>
public record MatrixCellDto
{
    public int AllocationId { get; init; }
    public int UserId { get; init; }
    public required string UserName { get; init; }
    public int TargetQuota { get; init; }
    public int CurrentValid { get; init; }
    public int CurrentExcluded { get; init; }
    
    /// <summary>是否活跃（未禁用）</summary>
    public bool IsActive { get; init; } = true;
    
    /// <summary>进度百分比</summary>
    public decimal ProgressPercent => TargetQuota > 0 
        ? Math.Round((decimal)(CurrentValid + CurrentExcluded) / TargetQuota * 100, 1) 
        : 0;
    
    /// <summary>是否已完成</summary>
    public bool IsCompleted => CurrentValid + CurrentExcluded >= TargetQuota;
    
    /// <summary>是否滞后（进度低于50%且有分配）</summary>
    public bool IsLagging => TargetQuota > 0 && ProgressPercent < 50;
}

/// <summary>
/// 矩阵行 DTO（一个任务池）
/// </summary>
public record MatrixRowDto
{
    public int TaskPoolId { get; init; }
    public required string TaskPoolName { get; init; }
    public int StageId { get; init; }
    public required string StageName { get; init; }
    public int TotalQuota { get; init; }
    
    /// <summary>已分配总量</summary>
    public int AssignedTotal { get; init; }
    
    /// <summary>未分配量</summary>
    public int Unassigned => TotalQuota - AssignedTotal;
    
    /// <summary>总有效产出</summary>
    public int TotalValid { get; init; }
    
    /// <summary>总除外量</summary>
    public int TotalExcluded { get; init; }
    
    /// <summary>进度百分比</summary>
    public decimal ProgressPercent
    {
        get
        {
            var effectiveTotal = TotalQuota - TotalExcluded;
            if (effectiveTotal <= 0) return 0;
            return Math.Round((decimal)TotalValid / effectiveTotal * 100, 1);
        }
    }
    
    /// <summary>除外率</summary>
    public decimal ExclusionRate => TotalQuota > 0 
        ? Math.Round((decimal)TotalExcluded / TotalQuota * 100, 1) 
        : 0;
    
    /// <summary>是否触发异常预警（除外率>10% 且 已处理>50）</summary>
    public bool IsAnomalous => ExclusionRate > 10 && (TotalValid + TotalExcluded) > 50;
    
    /// <summary>分配单元格</summary>
    public List<MatrixCellDto> Allocations { get; init; } = [];
}

/// <summary>
/// 矩阵数据 DTO
/// </summary>
public record MatrixDataDto
{
    public int ProjectId { get; init; }
    public required string ProjectName { get; init; }
    public required string ProjectCode { get; init; }
    
    /// <summary>用户列表（用于矩阵列头）</summary>
    public List<MatrixUserDto> Users { get; init; } = [];
    
    /// <summary>阶段分组的任务池行</summary>
    public List<MatrixStageDto> Stages { get; init; } = [];
}

/// <summary>
/// 矩阵用户 DTO
/// </summary>
public record MatrixUserDto
{
    public int Id { get; init; }
    public required string Name { get; init; }
}

/// <summary>
/// 矩阵阶段分组 DTO
/// </summary>
public record MatrixStageDto
{
    public int StageId { get; init; }
    public required string StageName { get; init; }
    public int Order { get; init; }
    public List<MatrixRowDto> TaskPools { get; init; } = [];
}

/// <summary>
/// 更新分配请求
/// </summary>
public record UpdateAllocationRequest
{
    public int AllocationId { get; init; }
    public int NewTargetQuota { get; init; }
}

/// <summary>
/// 创建分配请求
/// </summary>
public record CreateAllocationRequest
{
    public int TaskPoolId { get; init; }
    public int UserId { get; init; }
    public int TargetQuota { get; init; }
}

/// <summary>
/// 调整配额请求
/// </summary>
public record AdjustQuotaRequest
{
    public int TaskPoolId { get; init; }
    public int NewQuota { get; init; }
    public required string Reason { get; init; }
}

/// <summary>
/// 项目列表项 DTO
/// </summary>
public record ProjectListDto
{
    public int Id { get; init; }
    public required string Name { get; init; }
    public required string Code { get; init; }
    public bool IsActive { get; init; }
    public int StageCount { get; init; }
    public int TaskPoolCount { get; init; }
    public decimal OverallProgress { get; init; }
}

/// <summary>
/// 分配切换响应 DTO
/// </summary>
public record AllocationToggleDto
{
    public int AllocationId { get; init; }
    public int UserId { get; init; }
    public required string UserName { get; init; }
    public required string TaskPoolName { get; init; }
    public bool IsActive { get; init; }
}
