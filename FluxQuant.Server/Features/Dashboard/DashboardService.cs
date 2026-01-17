using FluxQuant.Server.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace FluxQuant.Server.Features.Dashboard;

/// <summary>
/// 仪表板服务
/// </summary>
public class DashboardService
{
    private readonly FluxQuantDbContext _dbContext;
    private readonly ILogger<DashboardService> _logger;

    public DashboardService(FluxQuantDbContext dbContext, ILogger<DashboardService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// 获取仪表板统计数据
    /// </summary>
    public async Task<DashboardStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var weekAgo = today.AddDays(-7);

        // 基础统计
        var activeProjects = await _dbContext.Projects
            .CountAsync(p => p.IsActive, ct);

        var totalTaskPools = await _dbContext.TaskPools.CountAsync(ct);

        var activeEmployees = await _dbContext.Users
            .CountAsync(u => u.IsActive, ct);

        // 今日统计
        var todayLogs = await _dbContext.ProductionLogs
            .Where(l => l.LogDate == today)
            .GroupBy(l => 1)
            .Select(g => new
            {
                Count = g.Count(),
                ValidSum = g.Sum(l => l.ValidQty),
                ExcludedSum = g.Sum(l => l.ExcludedQty)
            })
            .FirstOrDefaultAsync(ct);

        // 整体进度
        var totalQuota = await _dbContext.TaskPools.SumAsync(t => t.TotalQuota, ct);
        var totalValid = await _dbContext.Allocations.SumAsync(a => a.CurrentValid, ct);
        var totalExcluded = await _dbContext.Allocations.SumAsync(a => a.CurrentExcluded, ct);
        var effectiveTotal = totalQuota - totalExcluded;
        var overallProgress = effectiveTotal > 0 
            ? Math.Round((decimal)totalValid / effectiveTotal * 100, 1) 
            : 0;

        // 异常任务池
        var anomalousCount = await GetAnomalousPoolCountAsync(ct);

        // 最近活动
        var recentActivities = await GetRecentActivitiesAsync(10, ct);

        // 每日趋势
        var dailyTrends = await GetDailyTrendsAsync(weekAgo, today, ct);

        // 异常热点
        var anomalyHotspots = await GetAnomalyHotspotsAsync(5, ct);

        return new DashboardStatsDto
        {
            ActiveProjects = activeProjects,
            TotalTaskPools = totalTaskPools,
            ActiveEmployees = activeEmployees,
            TodayReportCount = todayLogs?.Count ?? 0,
            TodayValidOutput = todayLogs?.ValidSum ?? 0,
            TodayExcludedOutput = todayLogs?.ExcludedSum ?? 0,
            OverallProgress = overallProgress,
            AnomalousPoolCount = anomalousCount,
            RecentActivities = recentActivities,
            DailyTrends = dailyTrends,
            AnomalyHotspots = anomalyHotspots
        };
    }

    private async Task<int> GetAnomalousPoolCountAsync(CancellationToken ct)
    {
        // 异常定义：除外率>10% 且 已处理>50
        var pools = await _dbContext.TaskPools
            .Include(t => t.Allocations)
            .ToListAsync(ct);

        return pools.Count(t =>
        {
            var totalProcessed = t.Allocations.Sum(a => a.CurrentValid + a.CurrentExcluded);
            var totalExcluded = t.Allocations.Sum(a => a.CurrentExcluded);
            if (totalProcessed <= 50) return false;
            var rate = (decimal)totalExcluded / t.TotalQuota * 100;
            return rate > 10;
        });
    }

    private async Task<List<RecentActivityDto>> GetRecentActivitiesAsync(int count, CancellationToken ct)
    {
        return await _dbContext.ProductionLogs
            .AsNoTracking()
            .Include(l => l.Allocation)
                .ThenInclude(a => a.User)
            .Include(l => l.Allocation)
                .ThenInclude(a => a.TaskPool)
            .OrderByDescending(l => l.CreatedAt)
            .Take(count)
            .Select(l => new RecentActivityDto
            {
                LogId = l.Id,
                UserName = l.Allocation.User != null 
                    ? l.Allocation.User.DisplayName ?? l.Allocation.User.Username 
                    : "未知",
                TaskPoolName = l.Allocation.TaskPool.Name,
                ValidQty = l.ValidQty,
                ExcludedQty = l.ExcludedQty,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync(ct);
    }

    private async Task<List<DailyTrendDto>> GetDailyTrendsAsync(
        DateOnly startDate, 
        DateOnly endDate, 
        CancellationToken ct)
    {
        var logs = await _dbContext.ProductionLogs
            .AsNoTracking()
            .Where(l => l.LogDate >= startDate && l.LogDate <= endDate)
            .GroupBy(l => l.LogDate)
            .Select(g => new DailyTrendDto
            {
                Date = g.Key,
                ValidOutput = g.Sum(l => l.ValidQty),
                ExcludedOutput = g.Sum(l => l.ExcludedQty),
                ReportCount = g.Count()
            })
            .OrderBy(d => d.Date)
            .ToListAsync(ct);

        return logs;
    }

    private async Task<List<AnomalyHotspotDto>> GetAnomalyHotspotsAsync(int count, CancellationToken ct)
    {
        var pools = await _dbContext.TaskPools
            .AsNoTracking()
            .Include(t => t.Stage)
                .ThenInclude(s => s.Project)
            .Include(t => t.Allocations)
                .ThenInclude(a => a.Logs)
            .ToListAsync(ct);

        var hotspots = pools
            .Select(t =>
            {
                var totalExcluded = t.Allocations.Sum(a => a.CurrentExcluded);
                var rate = t.TotalQuota > 0 
                    ? Math.Round((decimal)totalExcluded / t.TotalQuota * 100, 1) 
                    : 0;

                // 找出最常见的除外原因
                var reasons = t.Allocations
                    .SelectMany(a => a.Logs)
                    .Where(l => l.ExcludedQty > 0 && !string.IsNullOrEmpty(l.ExclusionReason))
                    .GroupBy(l => l.ExclusionReason)
                    .OrderByDescending(g => g.Sum(l => l.ExcludedQty))
                    .FirstOrDefault();

                return new
                {
                    Pool = t,
                    TotalExcluded = totalExcluded,
                    Rate = rate,
                    TopReason = reasons?.Key ?? "未知"
                };
            })
            .Where(x => x.Rate > 10)
            .OrderByDescending(x => x.Rate)
            .Take(count)
            .Select(x => new AnomalyHotspotDto
            {
                TaskPoolId = x.Pool.Id,
                TaskPoolName = x.Pool.Name,
                StageName = x.Pool.Stage.Name,
                ProjectName = x.Pool.Stage.Project.Name,
                TotalQuota = x.Pool.TotalQuota,
                TotalExcluded = x.TotalExcluded,
                ExclusionRate = x.Rate,
                TopReason = x.TopReason
            })
            .ToList();

        return hotspots;
    }
}
