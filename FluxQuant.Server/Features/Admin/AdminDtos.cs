namespace FluxQuant.Server.Features.Admin;

/// <summary>
/// 项目相关 DTO
/// </summary>
public record CreateProjectRequest
{
    public required string Name { get; init; }
    public required string Code { get; init; }
    public string? Description { get; init; }
}

public record UpdateProjectRequest
{
    public required string Name { get; init; }
    public required string Code { get; init; }
    public string? Description { get; init; }
    public bool IsActive { get; init; } = true;
}

public record ProjectDetailDto
{
    public int Id { get; init; }
    public required string Name { get; init; }
    public required string Code { get; init; }
    public string? Description { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public List<StageDto> Stages { get; init; } = [];
}

/// <summary>
/// 阶段相关 DTO
/// </summary>
public record CreateStageRequest
{
    public int ProjectId { get; init; }
    public required string Name { get; init; }
    public int Order { get; init; }
    public string? Description { get; init; }
}

public record UpdateStageRequest
{
    public required string Name { get; init; }
    public int Order { get; init; }
    public string? Description { get; init; }
}

public record StageDto
{
    public int Id { get; init; }
    public int ProjectId { get; init; }
    public required string Name { get; init; }
    public int Order { get; init; }
    public string? Description { get; init; }
    public int TaskPoolCount { get; init; }
    public int TotalQuota { get; init; }
}

/// <summary>
/// 任务池相关 DTO
/// </summary>
public record CreateTaskPoolRequest
{
    public int StageId { get; init; }
    public required string Name { get; init; }
    public int TotalQuota { get; init; }
    public string? Description { get; init; }
}

public record UpdateTaskPoolRequest
{
    public required string Name { get; init; }
    public int TotalQuota { get; init; }
    public string? Description { get; init; }
}

public record TaskPoolDto
{
    public int Id { get; init; }
    public int StageId { get; init; }
    public required string StageName { get; init; }
    public required string Name { get; init; }
    public int TotalQuota { get; init; }
    public string? Description { get; init; }
    public int AssignedQuota { get; init; }
    public int CompletedQuota { get; init; }
    public int AllocationCount { get; init; }
}

/// <summary>
/// 用户相关 DTO
/// </summary>
public record CreateUserRequest
{
    public required string Username { get; init; }
    public required string Email { get; init; }
    public required string Password { get; init; }
    public string? DisplayName { get; init; }
    public required string Role { get; init; } // Admin, Manager, Employee
}

public record UpdateUserRequest
{
    public string? DisplayName { get; init; }
    public string? Email { get; init; }
    public required string Role { get; init; }
    public bool IsActive { get; init; } = true;
}

public record ResetPasswordRequest
{
    public required string NewPassword { get; init; }
}

public record UserListDto
{
    public int Id { get; init; }
    public required string Username { get; init; }
    public required string Email { get; init; }
    public string? DisplayName { get; init; }
    public required string Role { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public int AllocationCount { get; init; }
}
