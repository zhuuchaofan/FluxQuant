using FluxQuant.Server.Domain;
using FluxQuant.Server.Domain.Enums;
using FluxQuant.Server.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace FluxQuant.Server.Features.Seed;

/// <summary>
/// 测试数据种子服务
/// </summary>
public class SeedService
{
    private readonly FluxQuantDbContext _dbContext;
    private readonly ILogger<SeedService> _logger;

    public SeedService(FluxQuantDbContext dbContext, ILogger<SeedService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// 播种测试数据
    /// </summary>
    public async Task SeedAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("开始播种测试数据...");

        // 1. 确保管理员和经理用户存在
        var adminUser = await EnsureUserAsync("admin", "admin@fluxquant.io", "admin123", "系统管理员", UserRole.Admin, ct);
        var managerUser = await EnsureUserAsync("manager", "manager@fluxquant.io", "manager123", "项目经理", UserRole.Manager, ct);

        // 2. 检查是否已有项目数据
        if (await _dbContext.Projects.AnyAsync(ct))
        {
            _logger.LogInformation("项目数据已存在，跳过项目种子");
            return;
        }

        // 3. 创建员工用户
        var employees = new List<User>();
        var employeeNames = new[] { "张三", "李四", "王五", "赵六", "陈七" };
        for (int i = 0; i < employeeNames.Length; i++)
        {
            var emp = await EnsureUserAsync(
                $"employee{i + 1}", 
                $"employee{i + 1}@fluxquant.io", 
                "emp123", 
                employeeNames[i], 
                UserRole.Employee, 
                ct);
            employees.Add(emp);
        }

        // 4. 创建项目
        var project = new Project
        {
            Name = "2026年Q1数据处理项目",
            Code = "DP-2026Q1",
            Description = "处理客户提供的历史数据，包括清洗、校验和归档"
        };

        _dbContext.Projects.Add(project);
        await _dbContext.SaveChangesAsync(ct);

        // 5. 创建阶段
        var stages = new[]
        {
            new Stage { ProjectId = project.Id, Name = "数据清洗", Order = 1, Description = "初步清理和格式化" },
            new Stage { ProjectId = project.Id, Name = "数据校验", Order = 2, Description = "业务规则校验" },
            new Stage { ProjectId = project.Id, Name = "数据归档", Order = 3, Description = "最终归档入库" }
        };

        _dbContext.Stages.AddRange(stages);
        await _dbContext.SaveChangesAsync(ct);

        // 6. 创建任务池
        var taskPools = new List<TaskPool>();
        var poolConfigs = new[]
        {
            (stages[0].Id, "客户A历史订单", 500),
            (stages[0].Id, "客户B交易记录", 800),
            (stages[0].Id, "客户C用户档案", 300),
            (stages[1].Id, "订单校验批次1", 400),
            (stages[1].Id, "交易校验批次1", 600),
            (stages[2].Id, "归档批次1", 350),
            (stages[2].Id, "归档批次2", 450),
        };

        foreach (var (stageId, name, quota) in poolConfigs)
        {
            taskPools.Add(new TaskPool
            {
                StageId = stageId,
                Name = name,
                TotalQuota = quota
            });
        }

        _dbContext.TaskPools.AddRange(taskPools);
        await _dbContext.SaveChangesAsync(ct);

        // 7. 分配任务
        var random = new Random(42);
        var allocations = new List<Allocation>();

        foreach (var pool in taskPools)
        {
            // 每个任务池分配给 2-3 个员工
            var assignCount = random.Next(2, 4);
            var selectedEmployees = employees.OrderBy(_ => random.Next()).Take(assignCount).ToList();
            var remainingQuota = pool.TotalQuota;

            for (int i = 0; i < selectedEmployees.Count; i++)
            {
                var isLast = i == selectedEmployees.Count - 1;
                var quota = isLast ? remainingQuota : random.Next(50, remainingQuota / 2 + 1);
                remainingQuota -= quota;

                // 模拟一些进度
                var progress = random.NextDouble() * 0.8; // 0-80% 进度
                var validOutput = (int)(quota * progress * 0.9);
                var excludedOutput = (int)(quota * progress * 0.1);

                allocations.Add(new Allocation
                {
                    TaskPoolId = pool.Id,
                    UserId = selectedEmployees[i].Id,
                    TargetQuota = quota,
                    CurrentValid = validOutput,
                    CurrentExcluded = excludedOutput
                });
            }
        }

        _dbContext.Allocations.AddRange(allocations);
        await _dbContext.SaveChangesAsync(ct);

        // 8. 生成一些生产日志
        var logs = new List<ProductionLog>();
        var exclusionReasons = new[] { "源文件损坏", "数据重复", "信息缺失", "无法辨认" };

        foreach (var allocation in allocations)
        {
            // 每个分配生成 3-7 条日志
            var logCount = random.Next(3, 8);
            var remainingValid = allocation.CurrentValid;
            var remainingExcluded = allocation.CurrentExcluded;

            for (int i = 0; i < logCount && (remainingValid > 0 || remainingExcluded > 0); i++)
            {
                var valid = Math.Min(remainingValid, random.Next(10, 50));
                var excluded = Math.Min(remainingExcluded, random.Next(0, 10));
                remainingValid -= valid;
                remainingExcluded -= excluded;

                logs.Add(new ProductionLog
                {
                    AllocationId = allocation.Id,
                    LogDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-random.Next(0, 7))),
                    ValidQty = valid,
                    ExcludedQty = excluded,
                    ExclusionReason = excluded > 0 ? exclusionReasons[random.Next(exclusionReasons.Length)] : null,
                    CreatedAt = DateTime.UtcNow.AddDays(-random.Next(0, 7)).AddHours(-random.Next(0, 12))
                });
            }
        }

        _dbContext.ProductionLogs.AddRange(logs);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "测试数据播种完成: {Users}用户, {Projects}项目, {Stages}阶段, {Pools}任务池, {Allocations}分配, {Logs}日志",
            2 + employees.Count, 1, stages.Length, taskPools.Count, allocations.Count, logs.Count);
    }

    /// <summary>
    /// 确保用户存在，不存在则创建
    /// </summary>
    private async Task<User> EnsureUserAsync(
        string username, 
        string email, 
        string password, 
        string displayName, 
        UserRole role, 
        CancellationToken ct)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Username == username, ct);
        
        if (user != null)
        {
            _logger.LogInformation("用户已存在: {Username}", username);
            return user;
        }

        user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            DisplayName = displayName,
            Role = role
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(ct);
        
        _logger.LogInformation("创建用户: {Username} ({Role})", username, role);
        return user;
    }
}
