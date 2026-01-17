using FluxQuant.Server.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace FluxQuant.Server.Features.MyStream;

/// <summary>
/// 员工任务流服务
/// </summary>
public class MyStreamService
{
    private readonly FluxQuantDbContext _dbContext;
    private readonly ILogger<MyStreamService> _logger;

    public MyStreamService(FluxQuantDbContext dbContext, ILogger<MyStreamService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// 获取当前用户的所有分配任务
    /// </summary>
    public async Task<List<MyAllocationDto>> GetMyAllocationsAsync(int userId, CancellationToken ct = default)
    {
        var allocations = await _dbContext.Allocations
            .AsNoTracking()
            .Where(a => a.UserId == userId && a.IsActive)
            .Include(a => a.TaskPool)
                .ThenInclude(t => t.Stage)
                    .ThenInclude(s => s.Project)
            .Include(a => a.Logs.OrderByDescending(l => l.CreatedAt).Take(1))
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new MyAllocationDto
            {
                Id = a.Id,
                TaskPoolId = a.TaskPoolId,
                TaskPoolName = a.TaskPool.Name,
                StageName = a.TaskPool.Stage.Name,
                ProjectName = a.TaskPool.Stage.Project.Name,
                TargetQuota = a.TargetQuota,
                CurrentValid = a.CurrentValid,
                CurrentExcluded = a.CurrentExcluded,
                LastReport = a.Logs.Select(l => new LastReportDto
                {
                    CreatedAt = l.CreatedAt,
                    ValidQty = l.ValidQty,
                    ExcludedQty = l.ExcludedQty
                }).FirstOrDefault()
            })
            .ToListAsync(ct);

        return allocations;
    }

    /// <summary>
    /// 获取指定分配的历史记录
    /// </summary>
    public async Task<List<ProductionLogDto>> GetAllocationHistoryAsync(
        int allocationId, 
        int userId, 
        CancellationToken ct = default)
    {
        // 验证该分配属于当前用户
        var allocation = await _dbContext.Allocations
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == allocationId && a.UserId == userId, ct);

        if (allocation == null)
        {
            return [];
        }

        var logs = await _dbContext.ProductionLogs
            .AsNoTracking()
            .Where(l => l.AllocationId == allocationId)
            .OrderByDescending(l => l.LogDate)
            .ThenByDescending(l => l.CreatedAt)
            .Select(l => new ProductionLogDto
            {
                Id = l.Id,
                LogDate = l.LogDate,
                ValidQty = l.ValidQty,
                ExcludedQty = l.ExcludedQty,
                ExclusionReason = l.ExclusionReason,
                Comment = l.Comment,
                IsBackfill = l.IsBackfill,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync(ct);

        return logs;
    }
}
