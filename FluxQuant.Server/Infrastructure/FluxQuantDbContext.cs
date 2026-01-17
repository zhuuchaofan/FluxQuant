using FluxQuant.Server.Domain;
using Microsoft.EntityFrameworkCore;

namespace FluxQuant.Server.Infrastructure;

/// <summary>
/// FluxQuant 数据库上下文
/// </summary>
public class FluxQuantDbContext : DbContext
{
    public FluxQuantDbContext(DbContextOptions<FluxQuantDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Stage> Stages => Set<Stage>();
    public DbSet<TaskPool> TaskPools => Set<TaskPool>();
    public DbSet<Allocation> Allocations => Set<Allocation>();
    public DbSet<ProductionLog> ProductionLogs => Set<ProductionLog>();
    public DbSet<PoolAdjustmentLog> PoolAdjustmentLogs => Set<PoolAdjustmentLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // === User 配置 ===
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Username).IsUnique();
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Username).HasMaxLength(50);
            entity.Property(u => u.Email).HasMaxLength(100);
            entity.Property(u => u.DisplayName).HasMaxLength(100);
        });

        // === Project 配置 ===
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasIndex(p => p.Code).IsUnique();
            entity.Property(p => p.Name).HasMaxLength(200);
            entity.Property(p => p.Code).HasMaxLength(50);
        });

        // === Stage 配置 ===
        modelBuilder.Entity<Stage>(entity =>
        {
            entity.Property(s => s.Name).HasMaxLength(100);
            entity.HasOne(s => s.Project)
                .WithMany(p => p.Stages)
                .HasForeignKey(s => s.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // === TaskPool 配置 ===
        modelBuilder.Entity<TaskPool>(entity =>
        {
            entity.Property(t => t.Name).HasMaxLength(200);
            
            entity.HasOne(t => t.Stage)
                .WithMany(s => s.TaskPools)
                .HasForeignKey(t => t.StageId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // === Allocation 配置 ===
        modelBuilder.Entity<Allocation>(entity =>
        {
            entity.HasIndex(a => new { a.TaskPoolId, a.UserId });
            
            entity.HasOne(a => a.TaskPool)
                .WithMany(t => t.Allocations)
                .HasForeignKey(a => a.TaskPoolId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.User)
                .WithMany(u => u.Allocations)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // === ProductionLog 配置 ===
        modelBuilder.Entity<ProductionLog>(entity =>
        {
            entity.HasIndex(p => new { p.AllocationId, p.LogDate });
            entity.Property(p => p.ExclusionReason).HasMaxLength(100);
            entity.Property(p => p.Comment).HasMaxLength(500);
            
            entity.HasOne(p => p.Allocation)
                .WithMany(a => a.Logs)
                .HasForeignKey(p => p.AllocationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // === PoolAdjustmentLog 配置 ===
        modelBuilder.Entity<PoolAdjustmentLog>(entity =>
        {
            entity.HasIndex(p => p.TaskPoolId);
            entity.Property(p => p.Reason).HasMaxLength(500);
            
            entity.HasOne(p => p.TaskPool)
                .WithMany(t => t.AdjustmentLogs)
                .HasForeignKey(p => p.TaskPoolId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.Operator)
                .WithMany(u => u.AdjustmentLogs)
                .HasForeignKey(p => p.OperatorUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
