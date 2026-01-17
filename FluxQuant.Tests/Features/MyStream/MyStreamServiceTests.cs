using FluxQuant.Server.Features.MyStream;
using FluxQuant.Tests.TestFixtures;
using Microsoft.Extensions.Logging;

namespace FluxQuant.Tests.Features.MyStream;

/// <summary>
/// MyStreamService 单元测试
/// </summary>
public class MyStreamServiceTests
{
    #region 获取分配列表测试

    [Fact]
    public async Task GetMyAllocationsAsync_ShouldReturnOnlyUserAllocations()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<MyStreamService>>().Object;
        var service = new MyStreamService(dbContext, logger);
        
        var user1 = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");
        var user2 = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker2");
        
        // 为两个用户创建分配
        CreateTestAllocation(dbContext, user1.Id, "任务池A");
        CreateTestAllocation(dbContext, user1.Id, "任务池B");
        CreateTestAllocation(dbContext, user2.Id, "任务池C");

        // Act
        var result = await service.GetMyAllocationsAsync(user1.Id);

        // Assert
        result.Should().HaveCount(2);
        result.Should().OnlyContain(a => 
            a.TaskPoolName == "任务池A" || a.TaskPoolName == "任务池B");
    }

    [Fact]
    public async Task GetMyAllocationsAsync_ShouldExcludeInactiveAllocations()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<MyStreamService>>().Object;
        var service = new MyStreamService(dbContext, logger);
        
        var user = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");
        
        // 创建活跃和非活跃分配
        CreateTestAllocation(dbContext, user.Id, "活跃任务", isActive: true);
        CreateTestAllocation(dbContext, user.Id, "禁用任务", isActive: false);

        // Act
        var result = await service.GetMyAllocationsAsync(user.Id);

        // Assert
        result.Should().HaveCount(1);
        result.First().TaskPoolName.Should().Be("活跃任务");
    }

    [Fact]
    public async Task GetMyAllocationsAsync_ShouldCalculateProgressCorrectly()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<MyStreamService>>().Object;
        var service = new MyStreamService(dbContext, logger);
        
        var user = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");
        
        // 创建一个有进度的分配
        var allocation = CreateTestAllocation(dbContext, user.Id, "任务池A", targetQuota: 100);
        allocation.CurrentValid = 30;
        allocation.CurrentExcluded = 20;
        dbContext.SaveChanges();

        // Act
        var result = await service.GetMyAllocationsAsync(user.Id);

        // Assert
        result.Should().HaveCount(1);
        var dto = result.First();
        dto.CurrentValid.Should().Be(30);
        dto.CurrentExcluded.Should().Be(20);
        dto.ProgressPercent.Should().Be(50m); // (30+20)/100 = 50%
        dto.Remaining.Should().Be(50); // 100 - 30 - 20 = 50
        dto.IsCompleted.Should().BeFalse();
    }

    [Fact]
    public async Task GetMyAllocationsAsync_WithNoAllocations_ShouldReturnEmptyList()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<MyStreamService>>().Object;
        var service = new MyStreamService(dbContext, logger);
        
        var user = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");

        // Act
        var result = await service.GetMyAllocationsAsync(user.Id);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region 获取历史记录测试

    [Fact]
    public async Task GetAllocationHistoryAsync_ShouldReturnLogsForOwnAllocation()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<MyStreamService>>().Object;
        var service = new MyStreamService(dbContext, logger);
        
        var user = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");
        var allocation = CreateTestAllocation(dbContext, user.Id, "任务池A");
        
        // 添加一些日志
        dbContext.ProductionLogs.Add(new ProductionLog
        {
            AllocationId = allocation.Id,
            LogDate = DateOnly.FromDateTime(DateTime.Today),
            ValidQty = 10,
            ExcludedQty = 0
        });
        dbContext.ProductionLogs.Add(new ProductionLog
        {
            AllocationId = allocation.Id,
            LogDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-1)),
            ValidQty = 15,
            ExcludedQty = 5,
            ExclusionReason = "数据重复"
        });
        dbContext.SaveChanges();

        // Act
        var result = await service.GetAllocationHistoryAsync(allocation.Id, user.Id);

        // Assert
        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAllocationHistoryAsync_WithNonOwnedAllocation_ShouldReturnEmpty()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<MyStreamService>>().Object;
        var service = new MyStreamService(dbContext, logger);
        
        var user1 = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");
        var user2 = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker2");
        var allocation = CreateTestAllocation(dbContext, user1.Id, "任务池A");
        
        // 添加日志
        dbContext.ProductionLogs.Add(new ProductionLog
        {
            AllocationId = allocation.Id,
            LogDate = DateOnly.FromDateTime(DateTime.Today),
            ValidQty = 10,
            ExcludedQty = 0
        });
        dbContext.SaveChanges();

        // Act - user2 尝试获取 user1 的历史
        var result = await service.GetAllocationHistoryAsync(allocation.Id, user2.Id);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region 辅助方法

    private static Allocation CreateTestAllocation(
        FluxQuantDbContext dbContext, 
        int userId, 
        string taskPoolName = "任务池",
        int targetQuota = 100,
        bool isActive = true)
    {
        var project = new Project
        {
            Name = "测试项目",
            Code = $"TEST{Guid.NewGuid():N}".Substring(0, 10),
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
                            Name = taskPoolName,
                            TotalQuota = 1000
                        }
                    ]
                }
            ]
        };

        dbContext.Projects.Add(project);
        dbContext.SaveChanges();

        var taskPool = project.Stages.First().TaskPools.First();
        var allocation = new Allocation
        {
            TaskPoolId = taskPool.Id,
            UserId = userId,
            TargetQuota = targetQuota,
            IsActive = isActive
        };

        dbContext.Allocations.Add(allocation);
        dbContext.SaveChanges();
        return allocation;
    }

    #endregion
}
