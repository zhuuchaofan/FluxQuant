using FluxQuant.Server.Features.Dashboard;
using FluxQuant.Tests.TestFixtures;
using Microsoft.Extensions.Logging;

namespace FluxQuant.Tests.Features.Dashboard;

/// <summary>
/// DashboardService 单元测试
/// </summary>
public class DashboardServiceTests
{
    #region 基础统计测试

    [Fact]
    public async Task GetStatsAsync_WithEmptyDatabase_ShouldReturnZeroStats()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<DashboardService>>().Object;
        var service = new DashboardService(dbContext, logger);

        // Act
        var result = await service.GetStatsAsync();

        // Assert
        result.Should().NotBeNull();
        result.ActiveProjects.Should().Be(0);
        result.TotalTaskPools.Should().Be(0);
        result.ActiveEmployees.Should().Be(0);
        result.OverallProgress.Should().Be(0);
    }

    [Fact]
    public async Task GetStatsAsync_ShouldCountActiveProjectsCorrectly()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<DashboardService>>().Object;
        var service = new DashboardService(dbContext, logger);

        // 创建项目
        dbContext.Projects.Add(new Project { Name = "活跃项目1", Code = "P1", IsActive = true });
        dbContext.Projects.Add(new Project { Name = "活跃项目2", Code = "P2", IsActive = true });
        dbContext.Projects.Add(new Project { Name = "归档项目", Code = "P3", IsActive = false });
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.GetStatsAsync();

        // Assert
        result.ActiveProjects.Should().Be(2); // 只统计活跃项目
    }

    [Fact]
    public async Task GetStatsAsync_ShouldCountActiveEmployeesCorrectly()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<DashboardService>>().Object;
        var service = new DashboardService(dbContext, logger);

        // 创建用户
        InMemoryDbContextFactory.SeedTestUser(dbContext, "employee1");
        InMemoryDbContextFactory.SeedTestUser(dbContext, "employee2");
        InMemoryDbContextFactory.SeedTestAdmin(dbContext, "admin1");
        
        // 创建一个禁用用户
        dbContext.Users.Add(new User
        {
            Username = "inactive",
            Email = "inactive@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test123!"),
            Role = UserRole.Employee,
            IsActive = false
        });
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.GetStatsAsync();

        // Assert
        result.ActiveEmployees.Should().Be(3); // 2 employees + 1 admin = 3 active
    }

    [Fact]
    public async Task GetStatsAsync_ShouldCalculateOverallProgressCorrectly()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<DashboardService>>().Object;
        var service = new DashboardService(dbContext, logger);

        // 创建有进度的数据
        var user = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");
        var project = CreateTestProject(dbContext);
        var taskPool = project.Stages.First().TaskPools.First();
        
        // 创建分配并设置进度
        var allocation = new Allocation
        {
            TaskPoolId = taskPool.Id,
            UserId = user.Id,
            TargetQuota = 100,
            CurrentValid = 40,
            CurrentExcluded = 10, // 总进度应该是 40/(1000-10) = 40/990 ≈ 4%
            IsActive = true
        };
        dbContext.Allocations.Add(allocation);
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.GetStatsAsync();

        // Assert
        result.OverallProgress.Should().BeGreaterThan(0);
    }

    #endregion

    #region 今日统计测试

    [Fact]
    public async Task GetStatsAsync_ShouldCountTodayReportsCorrectly()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<DashboardService>>().Object;
        var service = new DashboardService(dbContext, logger);

        var user = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");
        var project = CreateTestProject(dbContext);
        var taskPool = project.Stages.First().TaskPools.First();
        
        var allocation = new Allocation
        {
            TaskPoolId = taskPool.Id,
            UserId = user.Id,
            TargetQuota = 100,
            IsActive = true
        };
        dbContext.Allocations.Add(allocation);
        await dbContext.SaveChangesAsync();

        // 添加今日和昨日的日志
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        dbContext.ProductionLogs.Add(new ProductionLog
        {
            AllocationId = allocation.Id,
            LogDate = today,
            ValidQty = 10,
            ExcludedQty = 5
        });
        dbContext.ProductionLogs.Add(new ProductionLog
        {
            AllocationId = allocation.Id,
            LogDate = today,
            ValidQty = 20,
            ExcludedQty = 0
        });
        dbContext.ProductionLogs.Add(new ProductionLog
        {
            AllocationId = allocation.Id,
            LogDate = today.AddDays(-1), // 昨天
            ValidQty = 100,
            ExcludedQty = 0
        });
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.GetStatsAsync();

        // Assert
        result.TodayReportCount.Should().Be(2);
        result.TodayValidOutput.Should().Be(30); // 10 + 20
        result.TodayExcludedOutput.Should().Be(5);
    }

    #endregion

    #region 异常检测测试

    [Fact]
    public async Task GetStatsAsync_ShouldDetectAnomalousPoolsCorrectly()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<DashboardService>>().Object;
        var service = new DashboardService(dbContext, logger);

        var user = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");
        
        // 创建一个小配额的任务池，使除外率容易超过 10%
        var project = new Project
        {
            Name = "异常测试项目",
            Code = "ANOMALY",
            IsActive = true,
            Stages =
            [
                new Stage
                {
                    Name = "阶段一",
                    Order = 1,
                    TaskPools =
                    [
                        new TaskPool
                        {
                            Name = "任务池A",
                            TotalQuota = 100 // 小配额
                        }
                    ]
                }
            ]
        };
        dbContext.Projects.Add(project);
        await dbContext.SaveChangesAsync();

        var taskPool = project.Stages.First().TaskPools.First();
        
        // 创建一个异常分配：
        // - 已处理 > 50 (40 + 20 = 60)
        // - 除外率 > 10% (20/100 = 20%)
        var allocation = new Allocation
        {
            TaskPoolId = taskPool.Id,
            UserId = user.Id,
            TargetQuota = 100,
            CurrentValid = 40,
            CurrentExcluded = 20, // 20/100 = 20% 除外率
            IsActive = true
        };
        dbContext.Allocations.Add(allocation);
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.GetStatsAsync();

        // Assert
        result.AnomalousPoolCount.Should().BeGreaterThanOrEqualTo(1);
    }

    #endregion

    #region 辅助方法

    private static Project CreateTestProject(FluxQuantDbContext dbContext)
    {
        var project = new Project
        {
            Name = "测试项目",
            Code = "TEST001",
            IsActive = true,
            Stages =
            [
                new Stage
                {
                    Name = "阶段一",
                    Order = 1,
                    TaskPools =
                    [
                        new TaskPool
                        {
                            Name = "任务池A",
                            TotalQuota = 1000
                        }
                    ]
                }
            ]
        };

        dbContext.Projects.Add(project);
        dbContext.SaveChanges();
        return project;
    }

    #endregion
}
