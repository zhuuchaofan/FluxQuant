using System.ComponentModel.DataAnnotations;

namespace FluxQuant.Server.Features.Report;

/// <summary>
/// 填报请求 DTO
/// </summary>
public record ReportRequest
{
    /// <summary>分配ID</summary>
    [Required]
    public int AllocationId { get; init; }
    
    /// <summary>业务日期 (YYYY-MM-DD)</summary>
    [Required]
    public DateOnly LogDate { get; init; }
    
    /// <summary>有效产出数量</summary>
    [Range(0, int.MaxValue)]
    public int ValidQty { get; init; }
    
    /// <summary>除外数量</summary>
    [Range(0, int.MaxValue)]
    public int ExcludedQty { get; init; }
    
    /// <summary>除外原因（当 ExcludedQty > 0 时必填）</summary>
    public string? ExclusionReason { get; init; }
    
    /// <summary>备注</summary>
    public string? Comment { get; init; }
    
    /// <summary>是否为补报</summary>
    public bool IsBackfill { get; init; }
}

/// <summary>
/// 填报结果 DTO
/// </summary>
public record ReportResult
{
    public long LogId { get; init; }
    public int NewCurrentValid { get; init; }
    public int NewCurrentExcluded { get; init; }
    public decimal NewProgressPercent { get; init; }
    public bool IsCompleted { get; init; }
}

/// <summary>
/// 除外原因选项
/// </summary>
public static class ExclusionReasons
{
    public const string FileDamaged = "源文件损坏";
    public const string Duplicate = "数据重复";
    public const string InfoMissing = "信息缺失";
    public const string CannotRecognize = "无法辨认";
    public const string Other = "其他";
    
    public static readonly string[] All = 
    [
        FileDamaged,
        Duplicate,
        InfoMissing,
        CannotRecognize,
        Other
    ];
}
