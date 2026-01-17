using FluxQuant.Server.Features.Auth;
using FluxQuant.Tests.TestFixtures;
using Microsoft.Extensions.Configuration;

namespace FluxQuant.Tests.Features.Auth;

/// <summary>
/// AuthService 单元测试
/// </summary>
public class AuthServiceTests
{
    private readonly IConfiguration _configuration;

    public AuthServiceTests()
    {
        // 模拟 JWT 配置
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "Jwt:Key", "FluxQuantTestSecretKey1234567890ABCDEF" },
            { "Jwt:Issuer", "FluxQuant.Tests" },
            { "Jwt:Audience", "FluxQuant.Tests" },
            { "Jwt:ExpirationMinutes", "60" }
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();
    }

    #region 注册测试

    [Fact]
    public async Task RegisterAsync_WithValidData_ShouldSucceed()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = InMemoryDbContextFactory.CreateLogger<AuthService>();
        var service = new AuthService(dbContext, _configuration, logger);

        var request = new RegisterRequest
        {
            Username = "newuser",
            Email = "newuser@test.com",
            Password = "Password123!",
            DisplayName = "新用户"
        };

        // Act
        var result = await service.RegisterAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.User.Username.Should().Be("newuser");
        result.Data.User.Email.Should().Be("newuser@test.com");
        result.Data.Token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task RegisterAsync_WithDuplicateUsername_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = InMemoryDbContextFactory.CreateLogger<AuthService>();
        var service = new AuthService(dbContext, _configuration, logger);
        
        // 先创建一个用户
        InMemoryDbContextFactory.SeedTestUser(dbContext, "existinguser");

        var request = new RegisterRequest
        {
            Username = "existinguser", // 重复的用户名
            Email = "new@test.com",
            Password = "Password123!"
        };

        // Act
        var result = await service.RegisterAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("用户名已被使用");
    }

    [Fact]
    public async Task RegisterAsync_WithDuplicateEmail_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = InMemoryDbContextFactory.CreateLogger<AuthService>();
        var service = new AuthService(dbContext, _configuration, logger);
        
        // 先创建一个用户
        InMemoryDbContextFactory.SeedTestUser(dbContext, "testuser");

        var request = new RegisterRequest
        {
            Username = "newuser",
            Email = "testuser@test.com", // 重复的邮箱
            Password = "Password123!"
        };

        // Act
        var result = await service.RegisterAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("邮箱已被注册");
    }

    #endregion

    #region 登录测试

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldSucceed()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = InMemoryDbContextFactory.CreateLogger<AuthService>();
        var service = new AuthService(dbContext, _configuration, logger);
        
        // 创建测试用户
        InMemoryDbContextFactory.SeedTestUser(dbContext, "testuser");

        var request = new LoginRequest
        {
            UsernameOrEmail = "testuser",
            Password = "Test123!"
        };

        // Act
        var result = await service.LoginAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.User.Username.Should().Be("testuser");
        result.Data.Token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task LoginAsync_WithEmail_ShouldSucceed()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = InMemoryDbContextFactory.CreateLogger<AuthService>();
        var service = new AuthService(dbContext, _configuration, logger);
        
        InMemoryDbContextFactory.SeedTestUser(dbContext, "testuser");

        var request = new LoginRequest
        {
            UsernameOrEmail = "testuser@test.com", // 使用邮箱登录
            Password = "Test123!"
        };

        // Act
        var result = await service.LoginAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.User.Email.Should().Be("testuser@test.com");
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = InMemoryDbContextFactory.CreateLogger<AuthService>();
        var service = new AuthService(dbContext, _configuration, logger);
        
        InMemoryDbContextFactory.SeedTestUser(dbContext, "testuser");

        var request = new LoginRequest
        {
            UsernameOrEmail = "testuser",
            Password = "WrongPassword!"
        };

        // Act
        var result = await service.LoginAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("用户名或密码错误");
    }

    [Fact]
    public async Task LoginAsync_WithNonExistentUser_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = InMemoryDbContextFactory.CreateLogger<AuthService>();
        var service = new AuthService(dbContext, _configuration, logger);

        var request = new LoginRequest
        {
            UsernameOrEmail = "nonexistent",
            Password = "Password123!"
        };

        // Act
        var result = await service.LoginAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("用户名或密码错误");
    }

    [Fact]
    public async Task LoginAsync_WithInactiveUser_ShouldFail()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = InMemoryDbContextFactory.CreateLogger<AuthService>();
        var service = new AuthService(dbContext, _configuration, logger);
        
        // 创建已禁用的用户
        var user = new User
        {
            Username = "inactiveuser",
            Email = "inactive@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test123!"),
            DisplayName = "禁用用户",
            Role = UserRole.Employee,
            IsActive = false // 关键：禁用账户
        };
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        var request = new LoginRequest
        {
            UsernameOrEmail = "inactiveuser",
            Password = "Test123!"
        };

        // Act
        var result = await service.LoginAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("账户已被禁用");
    }

    #endregion

    #region 获取用户测试

    [Fact]
    public async Task GetUserByIdAsync_WithExistingUser_ShouldReturnUser()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = InMemoryDbContextFactory.CreateLogger<AuthService>();
        var service = new AuthService(dbContext, _configuration, logger);
        
        var user = InMemoryDbContextFactory.SeedTestUser(dbContext, "testuser");

        // Act
        var result = await service.GetUserByIdAsync(user.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Username.Should().Be("testuser");
        result.Email.Should().Be("testuser@test.com");
    }

    [Fact]
    public async Task GetUserByIdAsync_WithNonExistentId_ShouldReturnNull()
    {
        // Arrange
        using var dbContext = InMemoryDbContextFactory.Create();
        var logger = InMemoryDbContextFactory.CreateLogger<AuthService>();
        var service = new AuthService(dbContext, _configuration, logger);

        // Act
        var result = await service.GetUserByIdAsync(999);

        // Assert
        result.Should().BeNull();
    }

    #endregion
}
