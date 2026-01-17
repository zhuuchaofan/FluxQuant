using FluxQuant.Server.Domain;
using FluxQuant.Server.Features.Auth;
using FluxQuant.Server.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace FluxQuant.Server.Features.Matrix;

/// <summary>
/// 管理端矩阵服务
/// </summary>
public class MatrixService
{
    private readonly FluxQuantDbContext _dbContext;
    private readonly ILogger<MatrixService> _logger;

    public MatrixService(FluxQuantDbContext dbContext, ILogger<MatrixService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// 获取项目列表
    /// </summary>
    public async Task<List<ProjectListDto>> GetProjectsAsync(CancellationToken ct = default)
    {
        var projects = await _dbContext.Projects
            .AsNoTracking()
            .Where(p => p.IsActive)
            .Select(p => new ProjectListDto
            {
                Id = p.Id,
                Name = p.Name,
                Code = p.Code,
                IsActive = p.IsActive,
                StageCount = p.Stages.Count,
                TaskPoolCount = p.Stages.SelectMany(s => s.TaskPools).Count(),
                OverallProgress = p.Stages.SelectMany(s => s.TaskPools).Sum(t => t.TotalQuota) > 0
                    ? Math.Round(
                        (decimal)p.Stages.SelectMany(s => s.TaskPools)
                            .SelectMany(t => t.Allocations)
                            .Sum(a => a.CurrentValid)
                        / p.Stages.SelectMany(s => s.TaskPools).Sum(t => t.TotalQuota) * 100, 1)
                    : 0
            })
            .ToListAsync(ct);

        return projects;
    }

    /// <summary>
    /// 获取矩阵数据
    /// </summary>
    public async Task<MatrixDataDto?> GetMatrixDataAsync(int projectId, CancellationToken ct = default)
    {
        var project = await _dbContext.Projects
            .AsNoTracking()
            .Include(p => p.Stages.OrderBy(s => s.Order))
                .ThenInclude(s => s.TaskPools)
                    .ThenInclude(t => t.Allocations)
                        .ThenInclude(a => a.User)
            .FirstOrDefaultAsync(p => p.Id == projectId, ct);

        if (project == null) return null;

        // 获取所有相关用户
        var userIds = project.Stages
            .SelectMany(s => s.TaskPools)
            .SelectMany(t => t.Allocations)
            .Where(a => a.UserId.HasValue)
            .Select(a => a.UserId!.Value)
            .Distinct()
            .ToList();

        var users = await _dbContext.Users
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new MatrixUserDto
            {
                Id = u.Id,
                Name = u.DisplayName ?? u.Username
            })
            .ToListAsync(ct);

        // 构建矩阵数据
        var stages = project.Stages.Select(stage => new MatrixStageDto
        {
            StageId = stage.Id,
            StageName = stage.Name,
            Order = stage.Order,
            TaskPools = stage.TaskPools.Select(pool => new MatrixRowDto
            {
                TaskPoolId = pool.Id,
                TaskPoolName = pool.Name,
                StageId = stage.Id,
                StageName = stage.Name,
                TotalQuota = pool.TotalQuota,
                AssignedTotal = pool.Allocations.Sum(a => a.TargetQuota),
                TotalValid = pool.Allocations.Sum(a => a.CurrentValid),
                TotalExcluded = pool.Allocations.Sum(a => a.CurrentExcluded),
                Allocations = pool.Allocations
                    .Where(a => a.UserId.HasValue && a.User != null)
                    .Select(a => new MatrixCellDto
                    {
                        AllocationId = a.Id,
                        UserId = a.UserId!.Value,
                        UserName = a.User!.DisplayName ?? a.User.Username,
                        TargetQuota = a.TargetQuota,
                        CurrentValid = a.CurrentValid,
                        CurrentExcluded = a.CurrentExcluded
                    }).ToList()
            }).ToList()
        }).ToList();

        return new MatrixDataDto
        {
            ProjectId = project.Id,
            ProjectName = project.Name,
            ProjectCode = project.Code,
            Users = users,
            Stages = stages
        };
    }

    /// <summary>
    /// 更新分配额度
    /// </summary>
    public async Task<Result<MatrixCellDto>> UpdateAllocationAsync(
        UpdateAllocationRequest request, 
        CancellationToken ct = default)
    {
        var allocation = await _dbContext.Allocations
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == request.AllocationId, ct);

        if (allocation == null)
        {
            return Result<MatrixCellDto>.Failure("未找到该分配");
        }

        allocation.TargetQuota = request.NewTargetQuota;
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("更新分配额度: AllocationId={Id}, NewQuota={Quota}", 
            allocation.Id, request.NewTargetQuota);

        return Result<MatrixCellDto>.Success(new MatrixCellDto
        {
            AllocationId = allocation.Id,
            UserId = allocation.UserId ?? 0,
            UserName = allocation.User?.DisplayName ?? allocation.User?.Username ?? "未分配",
            TargetQuota = allocation.TargetQuota,
            CurrentValid = allocation.CurrentValid,
            CurrentExcluded = allocation.CurrentExcluded
        });
    }

    /// <summary>
    /// 创建分配
    /// </summary>
    public async Task<Result<MatrixCellDto>> CreateAllocationAsync(
        CreateAllocationRequest request, 
        CancellationToken ct = default)
    {
        var taskPool = await _dbContext.TaskPools.FindAsync([request.TaskPoolId], ct);
        if (taskPool == null)
        {
            return Result<MatrixCellDto>.Failure("未找到该任务池");
        }

        var user = await _dbContext.Users.FindAsync([request.UserId], ct);
        if (user == null)
        {
            return Result<MatrixCellDto>.Failure("未找到该用户");
        }

        // 检查是否已存在分配
        var existing = await _dbContext.Allocations
            .AnyAsync(a => a.TaskPoolId == request.TaskPoolId && a.UserId == request.UserId, ct);
        if (existing)
        {
            return Result<MatrixCellDto>.Failure("该用户已有此任务的分配");
        }

        var allocation = new Allocation
        {
            TaskPoolId = request.TaskPoolId,
            UserId = request.UserId,
            TargetQuota = request.TargetQuota
        };

        _dbContext.Allocations.Add(allocation);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("创建分配: TaskPoolId={PoolId}, UserId={UserId}, Quota={Quota}",
            request.TaskPoolId, request.UserId, request.TargetQuota);

        return Result<MatrixCellDto>.Success(new MatrixCellDto
        {
            AllocationId = allocation.Id,
            UserId = user.Id,
            UserName = user.DisplayName ?? user.Username,
            TargetQuota = allocation.TargetQuota,
            CurrentValid = 0,
            CurrentExcluded = 0
        });
    }

    /// <summary>
    /// 调整任务池配额（必须记录审计日志）
    /// </summary>
    public async Task<Result<MatrixRowDto>> AdjustQuotaAsync(
        AdjustQuotaRequest request, 
        int operatorUserId,
        CancellationToken ct = default)
    {
        var taskPool = await _dbContext.TaskPools
            .Include(t => t.Stage)
            .Include(t => t.Allocations)
                .ThenInclude(a => a.User)
            .FirstOrDefaultAsync(t => t.Id == request.TaskPoolId, ct);

        if (taskPool == null)
        {
            return Result<MatrixRowDto>.Failure("未找到该任务池");
        }

        var oldQuota = taskPool.TotalQuota;

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(ct);

        try
        {
            // 更新配额
            taskPool.TotalQuota = request.NewQuota;

            // 记录审计日志
            var log = new PoolAdjustmentLog
            {
                TaskPoolId = taskPool.Id,
                OperatorUserId = operatorUserId,
                OldQuota = oldQuota,
                NewQuota = request.NewQuota,
                Reason = request.Reason
            };

            _dbContext.PoolAdjustmentLogs.Add(log);
            await _dbContext.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            _logger.LogInformation(
                "调整任务池配额: TaskPoolId={Id}, {Old}->{New}, 原因: {Reason}",
                taskPool.Id, oldQuota, request.NewQuota, request.Reason);

            return Result<MatrixRowDto>.Success(new MatrixRowDto
            {
                TaskPoolId = taskPool.Id,
                TaskPoolName = taskPool.Name,
                StageId = taskPool.Stage.Id,
                StageName = taskPool.Stage.Name,
                TotalQuota = taskPool.TotalQuota,
                AssignedTotal = taskPool.Allocations.Sum(a => a.TargetQuota),
                TotalValid = taskPool.Allocations.Sum(a => a.CurrentValid),
                TotalExcluded = taskPool.Allocations.Sum(a => a.CurrentExcluded),
                Allocations = taskPool.Allocations
                    .Where(a => a.UserId.HasValue)
                    .Select(a => new MatrixCellDto
                    {
                        AllocationId = a.Id,
                        UserId = a.UserId!.Value,
                        UserName = a.User?.DisplayName ?? a.User?.Username ?? "未知",
                        TargetQuota = a.TargetQuota,
                        CurrentValid = a.CurrentValid,
                        CurrentExcluded = a.CurrentExcluded
                    }).ToList()
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(ct);
            _logger.LogError(ex, "调整配额失败: TaskPoolId={Id}", request.TaskPoolId);
            return Result<MatrixRowDto>.Failure("调整配额失败，请稍后重试");
        }
    }

    /// <summary>
    /// 获取所有员工（用于分配下拉框）
    /// </summary>
    public async Task<List<MatrixUserDto>> GetEmployeesAsync(CancellationToken ct = default)
    {
        var employees = await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.IsActive)
            .OrderBy(u => u.Username)
            .Select(u => new MatrixUserDto
            {
                Id = u.Id,
                Name = u.DisplayName ?? u.Username
            })
            .ToListAsync(ct);

        return employees;
    }
}
