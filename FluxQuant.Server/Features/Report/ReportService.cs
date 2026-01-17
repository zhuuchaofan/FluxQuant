using FluxQuant.Server.Domain;
using FluxQuant.Server.Features.Auth;
using FluxQuant.Server.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace FluxQuant.Server.Features.Report;

/// <summary>
/// 填报服务
/// </summary>
public class ReportService
{
    private readonly FluxQuantDbContext _dbContext;
    private readonly ILogger<ReportService> _logger;

    public ReportService(FluxQuantDbContext dbContext, ILogger<ReportService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// 提交填报
    /// </summary>
    public async Task<Result<ReportResult>> SubmitReportAsync(
        ReportRequest request, 
        int userId, 
        CancellationToken ct = default)
    {
        // 1. 验证分配属于当前用户
        var allocation = await _dbContext.Allocations
            .FirstOrDefaultAsync(a => a.Id == request.AllocationId && a.UserId == userId, ct);

        if (allocation == null)
        {
            return Result<ReportResult>.Failure("未找到该任务分配或无权限");
        }

        // 2. 验证除外原因
        if (request.ExcludedQty > 0 && string.IsNullOrWhiteSpace(request.ExclusionReason))
        {
            return Result<ReportResult>.Failure("除外量大于0时必须填写除外原因");
        }

        // 3. 验证总量（允许 10% 溢出）
        var newTotal = allocation.CurrentValid + allocation.CurrentExcluded + request.ValidQty + request.ExcludedQty;
        var maxAllowed = (int)(allocation.TargetQuota * 1.1);
        if (newTotal > maxAllowed)
        {
            return Result<ReportResult>.Failure($"填报总量超出分配额度（最大允许 {maxAllowed}）");
        }

        // 4. 使用事务确保一致性
        await using var transaction = await _dbContext.Database.BeginTransactionAsync(ct);
        
        try
        {
            // 创建生产日志
            var log = new ProductionLog
            {
                AllocationId = request.AllocationId,
                LogDate = request.LogDate,
                ValidQty = request.ValidQty,
                ExcludedQty = request.ExcludedQty,
                ExclusionReason = request.ExclusionReason,
                Comment = request.Comment,
                IsBackfill = request.IsBackfill
            };

            _dbContext.ProductionLogs.Add(log);

            // 原子更新快照
            allocation.CurrentValid += request.ValidQty;
            allocation.CurrentExcluded += request.ExcludedQty;

            await _dbContext.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            _logger.LogInformation(
                "用户 {UserId} 填报成功: AllocationId={AllocationId}, Valid={Valid}, Excluded={Excluded}",
                userId, request.AllocationId, request.ValidQty, request.ExcludedQty);

            // 计算新进度
            var newProgressPercent = allocation.TargetQuota > 0
                ? Math.Round((decimal)(allocation.CurrentValid + allocation.CurrentExcluded) / allocation.TargetQuota * 100, 1)
                : 0;

            return Result<ReportResult>.Success(new ReportResult
            {
                LogId = log.Id,
                NewCurrentValid = allocation.CurrentValid,
                NewCurrentExcluded = allocation.CurrentExcluded,
                NewProgressPercent = newProgressPercent,
                IsCompleted = allocation.CurrentValid + allocation.CurrentExcluded >= allocation.TargetQuota
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(ct);
            _logger.LogError(ex, "填报失败: AllocationId={AllocationId}", request.AllocationId);
            return Result<ReportResult>.Failure("填报失败，请稍后重试");
        }
    }

    /// <summary>
    /// 撤回填报（24小时内）
    /// </summary>
    public async Task<Result<ReportResult>> RevertReportAsync(
        long logId, 
        int userId, 
        CancellationToken ct = default)
    {
        var log = await _dbContext.ProductionLogs
            .Include(l => l.Allocation)
            .FirstOrDefaultAsync(l => l.Id == logId && l.Allocation.UserId == userId, ct);

        if (log == null)
        {
            return Result<ReportResult>.Failure("未找到该填报记录或无权限");
        }

        // 检查 24 小时限制
        if (DateTime.UtcNow - log.CreatedAt > TimeSpan.FromHours(24))
        {
            return Result<ReportResult>.Failure("只能撤回24小时内的填报记录");
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(ct);

        try
        {
            // 创建冲销日志（负数）
            var revertLog = new ProductionLog
            {
                AllocationId = log.AllocationId,
                LogDate = log.LogDate,
                ValidQty = -log.ValidQty,
                ExcludedQty = -log.ExcludedQty,
                ExclusionReason = log.ExclusionReason,
                Comment = $"[撤回] 原记录ID: {log.Id}",
                IsBackfill = false
            };

            _dbContext.ProductionLogs.Add(revertLog);

            // 更新快照
            log.Allocation.CurrentValid -= log.ValidQty;
            log.Allocation.CurrentExcluded -= log.ExcludedQty;

            await _dbContext.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            _logger.LogInformation("用户 {UserId} 撤回填报: LogId={LogId}", userId, logId);

            var allocation = log.Allocation;
            var newProgressPercent = allocation.TargetQuota > 0
                ? Math.Round((decimal)(allocation.CurrentValid + allocation.CurrentExcluded) / allocation.TargetQuota * 100, 1)
                : 0;

            return Result<ReportResult>.Success(new ReportResult
            {
                LogId = revertLog.Id,
                NewCurrentValid = allocation.CurrentValid,
                NewCurrentExcluded = allocation.CurrentExcluded,
                NewProgressPercent = newProgressPercent,
                IsCompleted = allocation.CurrentValid + allocation.CurrentExcluded >= allocation.TargetQuota
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(ct);
            _logger.LogError(ex, "撤回失败: LogId={LogId}", logId);
            return Result<ReportResult>.Failure("撤回失败，请稍后重试");
        }
    }
}
