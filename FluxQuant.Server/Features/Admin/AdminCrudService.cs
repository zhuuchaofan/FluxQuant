using FluxQuant.Server.Domain;
using FluxQuant.Server.Domain.Enums;
using FluxQuant.Server.Features.Auth;
using FluxQuant.Server.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace FluxQuant.Server.Features.Admin;

/// <summary>
/// 管理后台 CRUD 服务
/// </summary>
public class AdminCrudService
{
    private readonly FluxQuantDbContext _dbContext;
    private readonly ILogger<AdminCrudService> _logger;

    public AdminCrudService(FluxQuantDbContext dbContext, ILogger<AdminCrudService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    #region 项目管理

    public async Task<List<ProjectDetailDto>> GetProjectsAsync(CancellationToken ct = default)
    {
        return await _dbContext.Projects
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProjectDetailDto
            {
                Id = p.Id,
                Name = p.Name,
                Code = p.Code,
                Description = p.Description,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                Stages = p.Stages.OrderBy(s => s.Order).Select(s => new StageDto
                {
                    Id = s.Id,
                    ProjectId = p.Id,
                    Name = s.Name,
                    Order = s.Order,
                    Description = s.Description,
                    TaskPoolCount = s.TaskPools.Count,
                    TotalQuota = s.TaskPools.Sum(t => t.TotalQuota)
                }).ToList()
            })
            .ToListAsync(ct);
    }

    public async Task<ProjectDetailDto?> GetProjectByIdAsync(int id, CancellationToken ct = default)
    {
        return await _dbContext.Projects
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new ProjectDetailDto
            {
                Id = p.Id,
                Name = p.Name,
                Code = p.Code,
                Description = p.Description,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                Stages = p.Stages.OrderBy(s => s.Order).Select(s => new StageDto
                {
                    Id = s.Id,
                    ProjectId = p.Id,
                    Name = s.Name,
                    Order = s.Order,
                    Description = s.Description,
                    TaskPoolCount = s.TaskPools.Count,
                    TotalQuota = s.TaskPools.Sum(t => t.TotalQuota)
                }).ToList()
            })
            .FirstOrDefaultAsync(ct);
    }

    public async Task<Result<ProjectDetailDto>> CreateProjectAsync(CreateProjectRequest request, CancellationToken ct = default)
    {
        // 检查 Code 是否重复
        var exists = await _dbContext.Projects.AnyAsync(p => p.Code == request.Code, ct);
        if (exists)
        {
            return Result<ProjectDetailDto>.Failure("项目代码已存在");
        }

        var project = new Project
        {
            Name = request.Name,
            Code = request.Code,
            Description = request.Description
        };

        _dbContext.Projects.Add(project);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("创建项目: {Name} ({Code})", project.Name, project.Code);

        return Result<ProjectDetailDto>.Success(new ProjectDetailDto
        {
            Id = project.Id,
            Name = project.Name,
            Code = project.Code,
            Description = project.Description,
            IsActive = project.IsActive,
            CreatedAt = project.CreatedAt,
            Stages = []
        });
    }

    public async Task<Result<ProjectDetailDto>> UpdateProjectAsync(int id, UpdateProjectRequest request, CancellationToken ct = default)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Stages)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (project == null)
        {
            return Result<ProjectDetailDto>.Failure("项目不存在");
        }

        // 检查 Code 是否与其他项目重复
        var codeExists = await _dbContext.Projects.AnyAsync(p => p.Code == request.Code && p.Id != id, ct);
        if (codeExists)
        {
            return Result<ProjectDetailDto>.Failure("项目代码已被其他项目使用");
        }

        project.Name = request.Name;
        project.Code = request.Code;
        project.Description = request.Description;
        project.IsActive = request.IsActive;

        await _dbContext.SaveChangesAsync(ct);

        return Result<ProjectDetailDto>.Success(new ProjectDetailDto
        {
            Id = project.Id,
            Name = project.Name,
            Code = project.Code,
            Description = project.Description,
            IsActive = project.IsActive,
            CreatedAt = project.CreatedAt,
            Stages = project.Stages.Select(s => new StageDto
            {
                Id = s.Id,
                ProjectId = project.Id,
                Name = s.Name,
                Order = s.Order,
                Description = s.Description
            }).ToList()
        });
    }

    public async Task<Result<bool>> DeleteProjectAsync(int id, CancellationToken ct = default)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Stages)
                .ThenInclude(s => s.TaskPools)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (project == null)
        {
            return Result<bool>.Failure("项目不存在");
        }

        // 检查是否有任务池有进度
        var hasProgress = project.Stages
            .SelectMany(s => s.TaskPools)
            .Any(t => t.Allocations.Any(a => a.CurrentValid > 0 || a.CurrentExcluded > 0));

        if (hasProgress)
        {
            return Result<bool>.Failure("项目下有进行中的任务，无法删除");
        }

        _dbContext.Projects.Remove(project);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("删除项目: {Id}", id);

        return Result<bool>.Success(true);
    }

    #endregion

    #region 阶段管理

    public async Task<Result<StageDto>> CreateStageAsync(CreateStageRequest request, CancellationToken ct = default)
    {
        var project = await _dbContext.Projects.FindAsync([request.ProjectId], ct);
        if (project == null)
        {
            return Result<StageDto>.Failure("项目不存在");
        }

        var stage = new Stage
        {
            ProjectId = request.ProjectId,
            Name = request.Name,
            Order = request.Order,
            Description = request.Description
        };

        _dbContext.Stages.Add(stage);
        await _dbContext.SaveChangesAsync(ct);

        return Result<StageDto>.Success(new StageDto
        {
            Id = stage.Id,
            ProjectId = stage.ProjectId,
            Name = stage.Name,
            Order = stage.Order,
            Description = stage.Description,
            TaskPoolCount = 0,
            TotalQuota = 0
        });
    }

    public async Task<Result<StageDto>> UpdateStageAsync(int id, UpdateStageRequest request, CancellationToken ct = default)
    {
        var stage = await _dbContext.Stages
            .Include(s => s.TaskPools)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

        if (stage == null)
        {
            return Result<StageDto>.Failure("阶段不存在");
        }

        stage.Name = request.Name;
        stage.Order = request.Order;
        stage.Description = request.Description;

        await _dbContext.SaveChangesAsync(ct);

        return Result<StageDto>.Success(new StageDto
        {
            Id = stage.Id,
            ProjectId = stage.ProjectId,
            Name = stage.Name,
            Order = stage.Order,
            Description = stage.Description,
            TaskPoolCount = stage.TaskPools.Count,
            TotalQuota = stage.TaskPools.Sum(t => t.TotalQuota)
        });
    }

    public async Task<Result<bool>> DeleteStageAsync(int id, CancellationToken ct = default)
    {
        var stage = await _dbContext.Stages
            .Include(s => s.TaskPools)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

        if (stage == null)
        {
            return Result<bool>.Failure("阶段不存在");
        }

        if (stage.TaskPools.Count != 0)
        {
            return Result<bool>.Failure("阶段下有任务池，无法删除");
        }

        _dbContext.Stages.Remove(stage);
        await _dbContext.SaveChangesAsync(ct);

        return Result<bool>.Success(true);
    }

    #endregion

    #region 任务池管理

    public async Task<List<TaskPoolDto>> GetTaskPoolsAsync(int? stageId = null, CancellationToken ct = default)
    {
        var query = _dbContext.TaskPools
            .AsNoTracking()
            .Include(t => t.Stage)
            .Include(t => t.Allocations)
            .AsQueryable();

        if (stageId.HasValue)
        {
            query = query.Where(t => t.StageId == stageId.Value);
        }

        return await query
            .Select(t => new TaskPoolDto
            {
                Id = t.Id,
                StageId = t.StageId,
                StageName = t.Stage.Name,
                Name = t.Name,
                TotalQuota = t.TotalQuota,
                Description = t.Description,
                AssignedQuota = t.Allocations.Sum(a => a.TargetQuota),
                CompletedQuota = t.Allocations.Sum(a => a.CurrentValid + a.CurrentExcluded),
                AllocationCount = t.Allocations.Count
            })
            .ToListAsync(ct);
    }

    public async Task<Result<TaskPoolDto>> CreateTaskPoolAsync(CreateTaskPoolRequest request, CancellationToken ct = default)
    {
        var stage = await _dbContext.Stages
            .Include(s => s.Project)
            .FirstOrDefaultAsync(s => s.Id == request.StageId, ct);

        if (stage == null)
        {
            return Result<TaskPoolDto>.Failure("阶段不存在");
        }

        var taskPool = new TaskPool
        {
            StageId = request.StageId,
            Name = request.Name,
            TotalQuota = request.TotalQuota,
            Description = request.Description
        };

        _dbContext.TaskPools.Add(taskPool);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("创建任务池: {Name}, 配额: {Quota}", taskPool.Name, taskPool.TotalQuota);

        return Result<TaskPoolDto>.Success(new TaskPoolDto
        {
            Id = taskPool.Id,
            StageId = taskPool.StageId,
            StageName = stage.Name,
            Name = taskPool.Name,
            TotalQuota = taskPool.TotalQuota,
            Description = taskPool.Description,
            AssignedQuota = 0,
            CompletedQuota = 0,
            AllocationCount = 0
        });
    }

    public async Task<Result<TaskPoolDto>> UpdateTaskPoolAsync(int id, UpdateTaskPoolRequest request, CancellationToken ct = default)
    {
        var taskPool = await _dbContext.TaskPools
            .Include(t => t.Stage)
            .Include(t => t.Allocations)
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (taskPool == null)
        {
            return Result<TaskPoolDto>.Failure("任务池不存在");
        }

        taskPool.Name = request.Name;
        taskPool.TotalQuota = request.TotalQuota;
        taskPool.Description = request.Description;

        await _dbContext.SaveChangesAsync(ct);

        return Result<TaskPoolDto>.Success(new TaskPoolDto
        {
            Id = taskPool.Id,
            StageId = taskPool.StageId,
            StageName = taskPool.Stage.Name,
            Name = taskPool.Name,
            TotalQuota = taskPool.TotalQuota,
            Description = taskPool.Description,
            AssignedQuota = taskPool.Allocations.Sum(a => a.TargetQuota),
            CompletedQuota = taskPool.Allocations.Sum(a => a.CurrentValid + a.CurrentExcluded),
            AllocationCount = taskPool.Allocations.Count
        });
    }

    public async Task<Result<bool>> DeleteTaskPoolAsync(int id, CancellationToken ct = default)
    {
        var taskPool = await _dbContext.TaskPools
            .Include(t => t.Allocations)
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (taskPool == null)
        {
            return Result<bool>.Failure("任务池不存在");
        }

        // 检查是否有进度
        var hasProgress = taskPool.Allocations.Any(a => a.CurrentValid > 0 || a.CurrentExcluded > 0);
        if (hasProgress)
        {
            return Result<bool>.Failure("任务池有进行中的工作，无法删除");
        }

        _dbContext.TaskPools.Remove(taskPool);
        await _dbContext.SaveChangesAsync(ct);

        return Result<bool>.Success(true);
    }

    #endregion

    #region 用户管理

    public async Task<List<UserListDto>> GetUsersAsync(CancellationToken ct = default)
    {
        return await _dbContext.Users
            .AsNoTracking()
            .OrderBy(u => u.Role)
            .ThenBy(u => u.Username)
            .Select(u => new UserListDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                DisplayName = u.DisplayName,
                Role = u.Role.ToString(),
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                AllocationCount = u.Allocations.Count
            })
            .ToListAsync(ct);
    }

    public async Task<Result<UserListDto>> CreateUserAsync(CreateUserRequest request, CancellationToken ct = default)
    {
        // 检查用户名是否存在
        var usernameExists = await _dbContext.Users.AnyAsync(u => u.Username == request.Username, ct);
        if (usernameExists)
        {
            return Result<UserListDto>.Failure("用户名已存在");
        }

        // 检查邮箱是否存在
        var emailExists = await _dbContext.Users.AnyAsync(u => u.Email == request.Email, ct);
        if (emailExists)
        {
            return Result<UserListDto>.Failure("邮箱已被使用");
        }

        // 解析角色
        if (!Enum.TryParse<UserRole>(request.Role, out var role))
        {
            return Result<UserListDto>.Failure("无效的角色");
        }

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            DisplayName = request.DisplayName,
            Role = role
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("创建用户: {Username}, 角色: {Role}", user.Username, user.Role);

        return Result<UserListDto>.Success(new UserListDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            DisplayName = user.DisplayName,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            AllocationCount = 0
        });
    }

    public async Task<Result<UserListDto>> UpdateUserAsync(int id, UpdateUserRequest request, CancellationToken ct = default)
    {
        var user = await _dbContext.Users
            .Include(u => u.Allocations)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (user == null)
        {
            return Result<UserListDto>.Failure("用户不存在");
        }

        // 解析角色
        if (!Enum.TryParse<UserRole>(request.Role, out var role))
        {
            return Result<UserListDto>.Failure("无效的角色");
        }

        // 检查邮箱
        if (!string.IsNullOrEmpty(request.Email) && request.Email != user.Email)
        {
            var emailExists = await _dbContext.Users.AnyAsync(u => u.Email == request.Email && u.Id != id, ct);
            if (emailExists)
            {
                return Result<UserListDto>.Failure("邮箱已被其他用户使用");
            }
            user.Email = request.Email;
        }

        user.DisplayName = request.DisplayName;
        user.Role = role;
        user.IsActive = request.IsActive;

        await _dbContext.SaveChangesAsync(ct);

        return Result<UserListDto>.Success(new UserListDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            DisplayName = user.DisplayName,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            AllocationCount = user.Allocations.Count
        });
    }

    public async Task<Result<bool>> ResetPasswordAsync(int id, ResetPasswordRequest request, CancellationToken ct = default)
    {
        var user = await _dbContext.Users.FindAsync([id], ct);

        if (user == null)
        {
            return Result<bool>.Failure("用户不存在");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("重置用户密码: {Username}", user.Username);

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> DeleteUserAsync(int id, CancellationToken ct = default)
    {
        var user = await _dbContext.Users
            .Include(u => u.Allocations)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (user == null)
        {
            return Result<bool>.Failure("用户不存在");
        }

        // 检查是否有分配
        if (user.Allocations.Count != 0)
        {
            return Result<bool>.Failure("用户有任务分配，无法删除。请先移除分配或禁用用户。");
        }

        _dbContext.Users.Remove(user);
        await _dbContext.SaveChangesAsync(ct);

        return Result<bool>.Success(true);
    }

    #endregion
}
