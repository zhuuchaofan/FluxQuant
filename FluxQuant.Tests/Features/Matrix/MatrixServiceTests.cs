using FluxQuant.Server.Features.Matrix;
using FluxQuant.Tests.TestFixtures;
using Microsoft.Extensions.Logging;

namespace FluxQuant.Tests.Features.Matrix;

/// <summary>
/// MatrixService 单元测试
/// </summary>
public class MatrixServiceTests
{
    #region 创建分配测试

    [Fact]
    public async Task CreateAllocationAsync_WithValidData_ShouldSucceed()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<MatrixService>>().Object;
        var service = new MatrixService(dbContext, logger);
        
        // 创建测试数据
        var user = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");
        var project = CreateTestProject(dbContext);
        var taskPool = project.Stages.First().TaskPools.First();

        var request = new CreateAllocationRequest
        {
            TaskPoolId = taskPool.Id,
            UserId = user.Id,
            TargetQuota = 100
        };

        // Act
        var result = await service.CreateAllocationAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.UserId.Should().Be(user.Id);
        result.Data.TargetQuota.Should().Be(100);
        result.Data.CurrentValid.Should().Be(0);
    }

    [Fact]
    public async Task CreateAllocationAsync_WithNonExistentTaskPool_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<MatrixService>>().Object;
        var service = new MatrixService(dbContext, logger);
        
        var user = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");

        var request = new CreateAllocationRequest
        {
            TaskPoolId = 999, // 不存在的任务池
            UserId = user.Id,
            TargetQuota = 100
        };

        // Act
        var result = await service.CreateAllocationAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("未找到该任务池");
    }

    [Fact]
    public async Task CreateAllocationAsync_WithNonExistentUser_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<MatrixService>>().Object;
        var service = new MatrixService(dbContext, logger);
        
        var project = CreateTestProject(dbContext);
        var taskPool = project.Stages.First().TaskPools.First();

        var request = new CreateAllocationRequest
        {
            TaskPoolId = taskPool.Id,
            UserId = 999, // 不存在的用户
            TargetQuota = 100
        };

        // Act
        var result = await service.CreateAllocationAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("未找到该用户");
    }

    [Fact]
    public async Task CreateAllocationAsync_WithDuplicateAllocation_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<MatrixService>>().Object;
        var service = new MatrixService(dbContext, logger);
        
        var user = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");
        var project = CreateTestProject(dbContext);
        var taskPool = project.Stages.First().TaskPools.First();

        var request = new CreateAllocationRequest
        {
            TaskPoolId = taskPool.Id,
            UserId = user.Id,
            TargetQuota = 100
        };

        // 第一次创建
        await service.CreateAllocationAsync(request);

        // Act - 第二次创建相同分配
        var result = await service.CreateAllocationAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("该用户已有此任务的分配");
    }

    #endregion

    #region 更新分配测试

    [Fact]
    public async Task UpdateAllocationAsync_WithValidData_ShouldSucceed()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<MatrixService>>().Object;
        var service = new MatrixService(dbContext, logger);
        
        var user = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");
        var project = CreateTestProject(dbContext);
        var taskPool = project.Stages.First().TaskPools.First();

        // 先创建一个分配
        var allocation = new Allocation
        {
            TaskPoolId = taskPool.Id,
            UserId = user.Id,
            TargetQuota = 100
        };
        dbContext.Allocations.Add(allocation);
        await dbContext.SaveChangesAsync();

        var updateRequest = new UpdateAllocationRequest
        {
            AllocationId = allocation.Id,
            NewTargetQuota = 200
        };

        // Act
        var result = await service.UpdateAllocationAsync(updateRequest);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.TargetQuota.Should().Be(200);
    }

    [Fact]
    public async Task UpdateAllocationAsync_WithNonExistentAllocation_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<MatrixService>>().Object;
        var service = new MatrixService(dbContext, logger);

        var request = new UpdateAllocationRequest
        {
            AllocationId = 999, // 不存在的分配
            NewTargetQuota = 200
        };

        // Act
        var result = await service.UpdateAllocationAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("未找到该分配");
    }

    #endregion

    #region 禁用/启用分配测试

    [Fact]
    public async Task ToggleAllocationAsync_ShouldToggleActiveState()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<MatrixService>>().Object;
        var service = new MatrixService(dbContext, logger);
        
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

        // Act - 第一次切换（禁用）
        var result1 = await service.ToggleAllocationAsync(allocation.Id);

        // Assert
        result1.IsSuccess.Should().BeTrue();
        result1.Data!.IsActive.Should().BeFalse();

        // Act - 第二次切换（启用）
        var result2 = await service.ToggleAllocationAsync(allocation.Id);

        // Assert
        result2.IsSuccess.Should().BeTrue();
        result2.Data!.IsActive.Should().BeTrue();
    }

    #endregion

    #region 获取员工列表测试

    [Fact]
    public async Task GetEmployeesAsync_ShouldReturnOnlyActiveEmployees()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<MatrixService>>().Object;
        var service = new MatrixService(dbContext, logger);
        
        // 创建员工
        InMemoryDbContextFactory.SeedTestUser(dbContext, "employee1");
        InMemoryDbContextFactory.SeedTestUser(dbContext, "employee2");
        
        // 创建管理员（应该被过滤掉）
        InMemoryDbContextFactory.SeedTestAdmin(dbContext, "admin1");
        
        // 创建禁用的员工（应该被过滤掉）
        var inactiveUser = new User
        {
            Username = "inactive",
            Email = "inactive@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test123!"),
            Role = UserRole.Employee,
            IsActive = false
        };
        dbContext.Users.Add(inactiveUser);
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.GetEmployeesAsync();

        // Assert
        result.Should().HaveCount(2);
        result.Should().OnlyContain(u => u.Name.StartsWith("employee") || u.Name == "测试用户");
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
