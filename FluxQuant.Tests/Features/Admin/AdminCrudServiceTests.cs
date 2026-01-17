using FluxQuant.Server.Features.Admin;
using FluxQuant.Tests.TestFixtures;
using Microsoft.Extensions.Logging;

namespace FluxQuant.Tests.Features.Admin;

/// <summary>
/// AdminCrudService 单元测试
/// </summary>
public class AdminCrudServiceTests
{
    #region 项目管理测试

    [Fact]
    public async Task CreateProjectAsync_WithValidData_ShouldSucceed()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminCrudService>>().Object;
        var service = new AdminCrudService(dbContext, logger);

        var request = new CreateProjectRequest
        {
            Name = "新项目",
            Code = "PRJ001",
            Description = "测试描述"
        };

        // Act
        var result = await service.CreateProjectAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Name.Should().Be("新项目");
        result.Data.Code.Should().Be("PRJ001");
        result.Data.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task CreateProjectAsync_WithDuplicateCode_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminCrudService>>().Object;
        var service = new AdminCrudService(dbContext, logger);

        // 先创建一个项目
        dbContext.Projects.Add(new Project { Name = "已存在", Code = "EXIST", IsActive = true });
        await dbContext.SaveChangesAsync();

        var request = new CreateProjectRequest
        {
            Name = "新项目",
            Code = "EXIST" // 重复代码
        };

        // Act
        var result = await service.CreateProjectAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("项目代码已存在");
    }

    [Fact]
    public async Task UpdateProjectAsync_WithNonExistentId_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminCrudService>>().Object;
        var service = new AdminCrudService(dbContext, logger);

        var request = new UpdateProjectRequest
        {
            Name = "更新",
            Code = "UPD001"
        };

        // Act
        var result = await service.UpdateProjectAsync(999, request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("项目不存在");
    }

    [Fact]
    public async Task DeleteProjectAsync_WithProgress_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminCrudService>>().Object;
        var service = new AdminCrudService(dbContext, logger);

        // 创建有进度的项目
        var project = CreateTestProjectWithAllocation(dbContext, hasProgress: true);

        // Act
        var result = await service.DeleteProjectAsync(project.Id);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("项目下有进行中的任务，无法删除");
    }

    [Fact]
    public async Task DeleteProjectAsync_WithoutProgress_ShouldSucceed()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminCrudService>>().Object;
        var service = new AdminCrudService(dbContext, logger);

        // 创建无进度的项目
        var project = CreateTestProjectWithAllocation(dbContext, hasProgress: false);

        // Act
        var result = await service.DeleteProjectAsync(project.Id);

        // Assert
        result.IsSuccess.Should().BeTrue();
    }

    #endregion

    #region 阶段管理测试

    [Fact]
    public async Task CreateStageAsync_WithValidData_ShouldSucceed()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminCrudService>>().Object;
        var service = new AdminCrudService(dbContext, logger);

        var project = new Project { Name = "项目", Code = "P1", IsActive = true };
        dbContext.Projects.Add(project);
        await dbContext.SaveChangesAsync();

        var request = new CreateStageRequest
        {
            ProjectId = project.Id,
            Name = "阶段一",
            Order = 1
        };

        // Act
        var result = await service.CreateStageAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.Name.Should().Be("阶段一");
    }

    [Fact]
    public async Task CreateStageAsync_WithNonExistentProject_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminCrudService>>().Object;
        var service = new AdminCrudService(dbContext, logger);

        var request = new CreateStageRequest
        {
            ProjectId = 999,
            Name = "阶段一",
            Order = 1
        };

        // Act
        var result = await service.CreateStageAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("项目不存在");
    }

    [Fact]
    public async Task DeleteStageAsync_WithTaskPools_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminCrudService>>().Object;
        var service = new AdminCrudService(dbContext, logger);

        var project = new Project
        {
            Name = "项目",
            Code = "P1",
            IsActive = true,
            Stages = [new Stage
            {
                Name = "阶段",
                Order = 1,
                TaskPools = [new TaskPool { Name = "任务池", TotalQuota = 100 }]
            }]
        };
        dbContext.Projects.Add(project);
        await dbContext.SaveChangesAsync();

        var stageId = project.Stages.First().Id;

        // Act
        var result = await service.DeleteStageAsync(stageId);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("阶段下有任务池，无法删除");
    }

    #endregion

    #region 任务池管理测试

    [Fact]
    public async Task CreateTaskPoolAsync_WithValidData_ShouldSucceed()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminCrudService>>().Object;
        var service = new AdminCrudService(dbContext, logger);

        var project = new Project
        {
            Name = "项目",
            Code = "P1",
            IsActive = true,
            Stages = [new Stage { Name = "阶段", Order = 1 }]
        };
        dbContext.Projects.Add(project);
        await dbContext.SaveChangesAsync();

        var request = new CreateTaskPoolRequest
        {
            StageId = project.Stages.First().Id,
            Name = "任务池A",
            TotalQuota = 500
        };

        // Act
        var result = await service.CreateTaskPoolAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.TotalQuota.Should().Be(500);
    }

    [Fact]
    public async Task DeleteTaskPoolAsync_WithProgress_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminCrudService>>().Object;
        var service = new AdminCrudService(dbContext, logger);

        var user = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");
        var project = CreateTestProjectWithAllocation(dbContext, hasProgress: true);
        var taskPoolId = project.Stages.First().TaskPools.First().Id;

        // Act
        var result = await service.DeleteTaskPoolAsync(taskPoolId);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("任务池有进行中的工作，无法删除");
    }

    #endregion

    #region 用户管理测试

    [Fact]
    public async Task CreateUserAsync_WithValidData_ShouldSucceed()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminCrudService>>().Object;
        var service = new AdminCrudService(dbContext, logger);

        var request = new CreateUserRequest
        {
            Username = "newuser",
            Email = "newuser@test.com",
            Password = "Password123!",
            DisplayName = "新用户",
            Role = "Employee"
        };

        // Act
        var result = await service.CreateUserAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.Username.Should().Be("newuser");
        result.Data.Role.Should().Be("Employee");
    }

    [Fact]
    public async Task CreateUserAsync_WithDuplicateUsername_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminCrudService>>().Object;
        var service = new AdminCrudService(dbContext, logger);

        InMemoryDbContextFactory.SeedTestUser(dbContext, "existinguser");

        var request = new CreateUserRequest
        {
            Username = "existinguser",
            Email = "new@test.com",
            Password = "Password123!",
            Role = "Employee"
        };

        // Act
        var result = await service.CreateUserAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("用户名已存在");
    }

    [Fact]
    public async Task CreateUserAsync_WithInvalidRole_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminCrudService>>().Object;
        var service = new AdminCrudService(dbContext, logger);

        var request = new CreateUserRequest
        {
            Username = "newuser",
            Email = "new@test.com",
            Password = "Password123!",
            Role = "InvalidRole"
        };

        // Act
        var result = await service.CreateUserAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("无效的角色");
    }

    [Fact]
    public async Task DeleteUserAsync_WithAllocations_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminCrudService>>().Object;
        var service = new AdminCrudService(dbContext, logger);

        var user = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");
        var project = CreateTestProjectWithAllocation(dbContext, hasProgress: false);
        
        // 为用户创建分配
        var taskPool = project.Stages.First().TaskPools.First();
        dbContext.Allocations.Add(new Allocation
        {
            TaskPoolId = taskPool.Id,
            UserId = user.Id,
            TargetQuota = 100,
            IsActive = true
        });
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.DeleteUserAsync(user.Id);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("用户有任务分配，无法删除");
    }

    [Fact]
    public async Task ResetPasswordAsync_WithValidUser_ShouldSucceed()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminCrudService>>().Object;
        var service = new AdminCrudService(dbContext, logger);

        var user = InMemoryDbContextFactory.SeedTestUser(dbContext, "worker1");

        var request = new ResetPasswordRequest
        {
            NewPassword = "NewPassword123!"
        };

        // Act
        var result = await service.ResetPasswordAsync(user.Id, request);

        // Assert
        result.IsSuccess.Should().BeTrue();
    }

    #endregion

    #region 辅助方法

    private static Project CreateTestProjectWithAllocation(FluxQuantDbContext dbContext, bool hasProgress)
    {
        var user = new User
        {
            Username = $"user{Guid.NewGuid():N}".Substring(0, 10),
            Email = $"{Guid.NewGuid():N}@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test123!"),
            Role = UserRole.Employee,
            IsActive = true
        };
        dbContext.Users.Add(user);

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
                            Name = "任务池A",
                            TotalQuota = 1000,
                            Allocations =
                            [
                                new Allocation
                                {
                                    UserId = 0, // 临时值，稍后更新
                                    TargetQuota = 100,
                                    CurrentValid = hasProgress ? 50 : 0,
                                    CurrentExcluded = hasProgress ? 10 : 0,
                                    IsActive = true
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        dbContext.Projects.Add(project);
        dbContext.SaveChanges();

        // 更新分配的 UserId
        var allocation = project.Stages.First().TaskPools.First().Allocations.First();
        allocation.UserId = user.Id;
        dbContext.SaveChanges();

        return project;
    }

    #endregion
}
