using FluxQuant.Server.Features.Report;
using FluxQuant.Tests.TestFixtures;
using Microsoft.Extensions.Logging;

namespace FluxQuant.Tests.Features.Report;

/// <summary>
/// ReportService 单元测试 - 使用 PostgreSQL 容器（支持事务）
/// </summary>
public class ReportServiceTests : IClassFixture<PostgresDbContextFactory>
{
    private readonly PostgresDbContextFactory _factory;

    public ReportServiceTests(PostgresDbContextFactory factory)
    {
        _factory = factory;
    }

    #region 提交填报测试

    [Fact]
    public async Task SubmitReportAsync_WithValidData_ShouldSucceed()
    {
        // Arrange
        await using var dbContext = _factory.CreateDbContext();
        var logger = new Mock<ILogger<ReportService>>().Object;
        var service = new ReportService(dbContext, logger);
        
        var user = PostgresDbContextFactory.SeedTestUser(dbContext, $"worker_{Guid.NewGuid():N}"[..15]);
        var allocation = await CreateTestAllocationAsync(dbContext, user.Id, targetQuota: 100);

        var request = new ReportRequest
        {
            AllocationId = allocation.Id,
            LogDate = DateOnly.FromDateTime(DateTime.Today),
            ValidQty = 10,
            ExcludedQty = 0
        };

        // Act
        var result = await service.SubmitReportAsync(request, user.Id);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.NewCurrentValid.Should().Be(10);
        result.Data.NewProgressPercent.Should().Be(10m);
    }

    [Fact]
    public async Task SubmitReportAsync_WithExcludedQtyWithoutReason_ShouldFail()
    {
        // Arrange
        await using var dbContext = _factory.CreateDbContext();
        var logger = new Mock<ILogger<ReportService>>().Object;
        var service = new ReportService(dbContext, logger);
        
        var user = PostgresDbContextFactory.SeedTestUser(dbContext, $"worker_{Guid.NewGuid():N}"[..15]);
        var allocation = await CreateTestAllocationAsync(dbContext, user.Id);

        var request = new ReportRequest
        {
            AllocationId = allocation.Id,
            LogDate = DateOnly.FromDateTime(DateTime.Today),
            ValidQty = 10,
            ExcludedQty = 5,
            ExclusionReason = null
        };

        // Act
        var result = await service.SubmitReportAsync(request, user.Id);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("除外量大于0时必须填写除外原因");
    }

    [Fact]
    public async Task SubmitReportAsync_WithExcludedQtyAndReason_ShouldSucceed()
    {
        // Arrange
        await using var dbContext = _factory.CreateDbContext();
        var logger = new Mock<ILogger<ReportService>>().Object;
        var service = new ReportService(dbContext, logger);
        
        var user = PostgresDbContextFactory.SeedTestUser(dbContext, $"worker_{Guid.NewGuid():N}"[..15]);
        var allocation = await CreateTestAllocationAsync(dbContext, user.Id, targetQuota: 100);

        var request = new ReportRequest
        {
            AllocationId = allocation.Id,
            LogDate = DateOnly.FromDateTime(DateTime.Today),
            ValidQty = 10,
            ExcludedQty = 5,
            ExclusionReason = "源文件损坏"
        };

        // Act
        var result = await service.SubmitReportAsync(request, user.Id);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.NewCurrentExcluded.Should().Be(5);
        result.Data.NewProgressPercent.Should().Be(15m);
    }

    [Fact]
    public async Task SubmitReportAsync_ExceedingQuota_ShouldFail()
    {
        // Arrange
        await using var dbContext = _factory.CreateDbContext();
        var logger = new Mock<ILogger<ReportService>>().Object;
        var service = new ReportService(dbContext, logger);
        
        var user = PostgresDbContextFactory.SeedTestUser(dbContext, $"worker_{Guid.NewGuid():N}"[..15]);
        var allocation = await CreateTestAllocationAsync(dbContext, user.Id, targetQuota: 100);

        var request = new ReportRequest
        {
            AllocationId = allocation.Id,
            LogDate = DateOnly.FromDateTime(DateTime.Today),
            ValidQty = 150,
            ExcludedQty = 0
        };

        // Act
        var result = await service.SubmitReportAsync(request, user.Id);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("填报总量超出分配额度");
    }

    [Fact]
    public async Task SubmitReportAsync_WithNonOwnedAllocation_ShouldFail()
    {
        // Arrange
        await using var dbContext = _factory.CreateDbContext();
        var logger = new Mock<ILogger<ReportService>>().Object;
        var service = new ReportService(dbContext, logger);
        
        var user1 = PostgresDbContextFactory.SeedTestUser(dbContext, $"worker1_{Guid.NewGuid():N}"[..15]);
        var user2 = PostgresDbContextFactory.SeedTestUser(dbContext, $"worker2_{Guid.NewGuid():N}"[..15]);
        var allocation = await CreateTestAllocationAsync(dbContext, user1.Id);

        var request = new ReportRequest
        {
            AllocationId = allocation.Id,
            LogDate = DateOnly.FromDateTime(DateTime.Today),
            ValidQty = 10,
            ExcludedQty = 0
        };

        // Act
        var result = await service.SubmitReportAsync(request, user2.Id);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("未找到该任务分配或无权限");
    }

    [Fact]
    public async Task SubmitReportAsync_ShouldUpdateAllocationSnapshot()
    {
        // Arrange
        await using var dbContext = _factory.CreateDbContext();
        var logger = new Mock<ILogger<ReportService>>().Object;
        var service = new ReportService(dbContext, logger);
        
        var user = PostgresDbContextFactory.SeedTestUser(dbContext, $"worker_{Guid.NewGuid():N}"[..15]);
        var allocation = await CreateTestAllocationAsync(dbContext, user.Id, targetQuota: 100);

        // 第一次填报
        var request1 = new ReportRequest
        {
            AllocationId = allocation.Id,
            LogDate = DateOnly.FromDateTime(DateTime.Today),
            ValidQty = 30,
            ExcludedQty = 0
        };
        await service.SubmitReportAsync(request1, user.Id);

        // 第二次填报
        var request2 = new ReportRequest
        {
            AllocationId = allocation.Id,
            LogDate = DateOnly.FromDateTime(DateTime.Today),
            ValidQty = 20,
            ExcludedQty = 5,
            ExclusionReason = "数据重复"
        };

        // Act
        var result = await service.SubmitReportAsync(request2, user.Id);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.NewCurrentValid.Should().Be(50);
        result.Data.NewCurrentExcluded.Should().Be(5);
        result.Data.NewProgressPercent.Should().Be(55m);
    }

    #endregion

    #region 撤回填报测试

    [Fact]
    public async Task RevertReportAsync_WithinTimeLimit_ShouldSucceed()
    {
        // Arrange
        await using var dbContext = _factory.CreateDbContext();
        var logger = new Mock<ILogger<ReportService>>().Object;
        var service = new ReportService(dbContext, logger);
        
        var user = PostgresDbContextFactory.SeedTestUser(dbContext, $"worker_{Guid.NewGuid():N}"[..15]);
        var allocation = await CreateTestAllocationAsync(dbContext, user.Id, targetQuota: 100);

        // 先提交一个填报
        var submitRequest = new ReportRequest
        {
            AllocationId = allocation.Id,
            LogDate = DateOnly.FromDateTime(DateTime.Today),
            ValidQty = 20,
            ExcludedQty = 0
        };
        var submitResult = await service.SubmitReportAsync(submitRequest, user.Id);
        var logId = submitResult.Data!.LogId;

        // Act
        var result = await service.RevertReportAsync(logId, user.Id);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.NewCurrentValid.Should().Be(0);
    }

    [Fact]
    public async Task RevertReportAsync_WithNonOwnedLog_ShouldFail()
    {
        // Arrange
        await using var dbContext = _factory.CreateDbContext();
        var logger = new Mock<ILogger<ReportService>>().Object;
        var service = new ReportService(dbContext, logger);
        
        var user1 = PostgresDbContextFactory.SeedTestUser(dbContext, $"worker1_{Guid.NewGuid():N}"[..15]);
        var user2 = PostgresDbContextFactory.SeedTestUser(dbContext, $"worker2_{Guid.NewGuid():N}"[..15]);
        var allocation = await CreateTestAllocationAsync(dbContext, user1.Id);

        // user1 提交填报
        var submitRequest = new ReportRequest
        {
            AllocationId = allocation.Id,
            LogDate = DateOnly.FromDateTime(DateTime.Today),
            ValidQty = 20,
            ExcludedQty = 0
        };
        var submitResult = await service.SubmitReportAsync(submitRequest, user1.Id);
        var logId = submitResult.Data!.LogId;

        // Act - user2 尝试撤回
        var result = await service.RevertReportAsync(logId, user2.Id);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("未找到该填报记录或无权限");
    }

    #endregion

    #region 辅助方法

    private static async Task<Allocation> CreateTestAllocationAsync(
        FluxQuantDbContext dbContext, 
        int userId, 
        int targetQuota = 100)
    {
        var project = new Project
        {
            Name = $"测试项目_{Guid.NewGuid():N}"[..20],
            Code = $"TEST{Guid.NewGuid():N}"[..10],
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
        await dbContext.SaveChangesAsync();

        var taskPool = project.Stages.First().TaskPools.First();
        var allocation = new Allocation
        {
            TaskPoolId = taskPool.Id,
            UserId = userId,
            TargetQuota = targetQuota,
            IsActive = true
        };

        dbContext.Allocations.Add(allocation);
        await dbContext.SaveChangesAsync();
        return allocation;
    }

    #endregion
}
