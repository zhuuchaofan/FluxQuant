using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using Npgsql;
using Testcontainers.PostgreSql;

namespace FluxQuant.Tests.TestFixtures;

/// <summary>
/// 用于测试的数据库工厂 - 提供 InMemory 和 PostgreSQL 两种模式
/// </summary>
public static class InMemoryDbContextFactory
{
    /// <summary>
    /// 创建内存数据库上下文（用于快速单元测试，不支持事务）
    /// </summary>
    public static FluxQuantDbContext Create(string? databaseName = null)
    {
        var options = new DbContextOptionsBuilder<FluxQuantDbContext>()
            .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
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

/// <summary>
/// PostgreSQL 测试容器工厂 - 用于需要事务支持的集成测试
/// </summary>
public class PostgresDbContextFactory : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("fluxquant_test")
        .WithUsername("test")
        .WithPassword("test")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();
    }

    public async Task DisposeAsync()
    {
        await _container.DisposeAsync();
    }

    /// <summary>
    /// 创建 PostgreSQL 数据库上下文（支持完整事务）
    /// </summary>
    public FluxQuantDbContext CreateDbContext()
    {
        var dataSourceBuilder = new NpgsqlDataSourceBuilder(ConnectionString);
        var dataSource = dataSourceBuilder.Build();

        var options = new DbContextOptionsBuilder<FluxQuantDbContext>()
            .UseNpgsql(dataSource)
            .Options;

        var context = new FluxQuantDbContext(options);
        context.Database.EnsureCreated();
        return context;
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
}
