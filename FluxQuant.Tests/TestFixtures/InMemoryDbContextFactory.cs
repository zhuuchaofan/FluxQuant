using Microsoft.Extensions.Logging;

namespace FluxQuant.Tests.TestFixtures;

/// <summary>
/// 用于测试的内存数据库工厂
/// </summary>
public static class InMemoryDbContextFactory
{
    /// <summary>
    /// 创建带有测试数据的内存数据库上下文
    /// </summary>
    public static FluxQuantDbContext Create(string? databaseName = null)
    {
        var options = new DbContextOptionsBuilder<FluxQuantDbContext>()
            .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString())
            .Options;

        var context = new FluxQuantDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    /// <summary>
    /// 创建测试用 Logger Mock
    /// </summary>
    public static ILogger<T> CreateLogger<T>()
    {
        return new Mock<ILogger<T>>().Object;
    }

    /// <summary>
    /// 添加标准测试用户到数据库
    /// </summary>
    public static User SeedTestUser(FluxQuantDbContext context, string username = "testuser")
    {
        var user = new User
        {
            Username = username,
            Email = $"{username}@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test123!"),
            DisplayName = "测试用户",
            Role = UserRole.Employee,
            IsActive = true
        };
        
        context.Users.Add(user);
        context.SaveChanges();
        return user;
    }

    /// <summary>
    /// 添加测试管理员到数据库
    /// </summary>
    public static User SeedTestAdmin(FluxQuantDbContext context, string username = "admin")
    {
        var user = new User
        {
            Username = username,
            Email = $"{username}@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            DisplayName = "测试管理员",
            Role = UserRole.Admin,
            IsActive = true
        };
        
        context.Users.Add(user);
        context.SaveChanges();
        return user;
    }
}
