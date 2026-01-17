using System.Security.Claims;
using Carter;
using FluxQuant.Server.Domain.Enums;

namespace FluxQuant.Server.Features.Admin;

/// <summary>
/// 管理后台 CRUD API 端点
/// </summary>
public class AdminCrudEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin")
            .WithTags("Admin CRUD")
            .RequireAuthorization();

        // 项目管理
        group.MapGet("/projects/all", GetAllProjects)
            .WithName("GetAllProjects")
            .WithSummary("获取所有项目（含阶段）");

        group.MapGet("/projects/{id:int}", GetProjectById)
            .WithName("GetProjectById")
            .WithSummary("获取项目详情");

        group.MapPost("/projects", CreateProject)
            .WithName("CreateProject")
            .WithSummary("创建项目");

        group.MapPut("/projects/{id:int}", UpdateProject)
            .WithName("UpdateProject")
            .WithSummary("更新项目");

        group.MapDelete("/projects/{id:int}", DeleteProject)
            .WithName("DeleteProject")
            .WithSummary("删除项目");

        // 阶段管理
        group.MapPost("/stages", CreateStage)
            .WithName("CreateStage")
            .WithSummary("创建阶段");

        group.MapPut("/stages/{id:int}", UpdateStage)
            .WithName("UpdateStage")
            .WithSummary("更新阶段");

        group.MapDelete("/stages/{id:int}", DeleteStage)
            .WithName("DeleteStage")
            .WithSummary("删除阶段");

        // 任务池管理
        group.MapGet("/pools", GetTaskPools)
            .WithName("GetTaskPools")
            .WithSummary("获取任务池列表");

        group.MapPost("/pools", CreateTaskPool)
            .WithName("CreateTaskPool")
            .WithSummary("创建任务池");

        group.MapPut("/pools/{id:int}", UpdateTaskPool)
            .WithName("UpdateTaskPool")
            .WithSummary("更新任务池");

        group.MapDelete("/pools/{id:int}", DeleteTaskPool)
            .WithName("DeleteTaskPool")
            .WithSummary("删除任务池");

        // 用户管理
        group.MapGet("/users", GetUsers)
            .WithName("GetUsers")
            .WithSummary("获取用户列表");

        group.MapPost("/users", CreateUser)
            .WithName("CreateUser")
            .WithSummary("创建用户");

        group.MapPut("/users/{id:int}", UpdateUser)
            .WithName("UpdateUser")
            .WithSummary("更新用户");

        group.MapPost("/users/{id:int}/reset-password", ResetPassword)
            .WithName("ResetPassword")
            .WithSummary("重置用户密码");

        group.MapDelete("/users/{id:int}", DeleteUser)
            .WithName("DeleteUser")
            .WithSummary("删除用户");
    }

    private static bool IsAdmin(ClaimsPrincipal user)
    {
        var role = user.FindFirst(ClaimTypes.Role)?.Value;
        return role == UserRole.Admin.ToString() || role == UserRole.Manager.ToString();
    }

    #region 项目管理

    private static async Task<IResult> GetAllProjects(
        AdminCrudService service,
        CancellationToken ct)
    {
        var projects = await service.GetProjectsAsync(ct);
        return Results.Ok(projects);
    }

    private static async Task<IResult> GetProjectById(
        int id,
        AdminCrudService service,
        CancellationToken ct)
    {
        var project = await service.GetProjectByIdAsync(id, ct);
        return project != null ? Results.Ok(project) : Results.NotFound();
    }

    private static async Task<IResult> CreateProject(
        CreateProjectRequest request,
        ClaimsPrincipal user,
        AdminCrudService service,
        CancellationToken ct)
    {
        if (!IsAdmin(user)) return Results.Forbid();

        var result = await service.CreateProjectAsync(request, ct);
        return result.IsSuccess
            ? Results.Created($"/api/v1/admin/projects/{result.Data!.Id}", result.Data)
            : Results.BadRequest(new { Error = result.Error });
    }

    private static async Task<IResult> UpdateProject(
        int id,
        UpdateProjectRequest request,
        ClaimsPrincipal user,
        AdminCrudService service,
        CancellationToken ct)
    {
        if (!IsAdmin(user)) return Results.Forbid();

        var result = await service.UpdateProjectAsync(id, request, ct);
        return result.IsSuccess
            ? Results.Ok(result.Data)
            : Results.BadRequest(new { Error = result.Error });
    }

    private static async Task<IResult> DeleteProject(
        int id,
        ClaimsPrincipal user,
        AdminCrudService service,
        CancellationToken ct)
    {
        if (!IsAdmin(user)) return Results.Forbid();

        var result = await service.DeleteProjectAsync(id, ct);
        return result.IsSuccess
            ? Results.NoContent()
            : Results.BadRequest(new { Error = result.Error });
    }

    #endregion

    #region 阶段管理

    private static async Task<IResult> CreateStage(
        CreateStageRequest request,
        ClaimsPrincipal user,
        AdminCrudService service,
        CancellationToken ct)
    {
        if (!IsAdmin(user)) return Results.Forbid();

        var result = await service.CreateStageAsync(request, ct);
        return result.IsSuccess
            ? Results.Created($"/api/v1/admin/stages/{result.Data!.Id}", result.Data)
            : Results.BadRequest(new { Error = result.Error });
    }

    private static async Task<IResult> UpdateStage(
        int id,
        UpdateStageRequest request,
        ClaimsPrincipal user,
        AdminCrudService service,
        CancellationToken ct)
    {
        if (!IsAdmin(user)) return Results.Forbid();

        var result = await service.UpdateStageAsync(id, request, ct);
        return result.IsSuccess
            ? Results.Ok(result.Data)
            : Results.BadRequest(new { Error = result.Error });
    }

    private static async Task<IResult> DeleteStage(
        int id,
        ClaimsPrincipal user,
        AdminCrudService service,
        CancellationToken ct)
    {
        if (!IsAdmin(user)) return Results.Forbid();

        var result = await service.DeleteStageAsync(id, ct);
        return result.IsSuccess
            ? Results.NoContent()
            : Results.BadRequest(new { Error = result.Error });
    }

    #endregion

    #region 任务池管理

    private static async Task<IResult> GetTaskPools(
        int? stageId,
        AdminCrudService service,
        CancellationToken ct)
    {
        var pools = await service.GetTaskPoolsAsync(stageId, ct);
        return Results.Ok(pools);
    }

    private static async Task<IResult> CreateTaskPool(
        CreateTaskPoolRequest request,
        ClaimsPrincipal user,
        AdminCrudService service,
        CancellationToken ct)
    {
        if (!IsAdmin(user)) return Results.Forbid();

        var result = await service.CreateTaskPoolAsync(request, ct);
        return result.IsSuccess
            ? Results.Created($"/api/v1/admin/pools/{result.Data!.Id}", result.Data)
            : Results.BadRequest(new { Error = result.Error });
    }

    private static async Task<IResult> UpdateTaskPool(
        int id,
        UpdateTaskPoolRequest request,
        ClaimsPrincipal user,
        AdminCrudService service,
        CancellationToken ct)
    {
        if (!IsAdmin(user)) return Results.Forbid();

        var result = await service.UpdateTaskPoolAsync(id, request, ct);
        return result.IsSuccess
            ? Results.Ok(result.Data)
            : Results.BadRequest(new { Error = result.Error });
    }

    private static async Task<IResult> DeleteTaskPool(
        int id,
        ClaimsPrincipal user,
        AdminCrudService service,
        CancellationToken ct)
    {
        if (!IsAdmin(user)) return Results.Forbid();

        var result = await service.DeleteTaskPoolAsync(id, ct);
        return result.IsSuccess
            ? Results.NoContent()
            : Results.BadRequest(new { Error = result.Error });
    }

    #endregion

    #region 用户管理

    private static async Task<IResult> GetUsers(
        AdminCrudService service,
        CancellationToken ct)
    {
        var users = await service.GetUsersAsync(ct);
        return Results.Ok(users);
    }

    private static async Task<IResult> CreateUser(
        CreateUserRequest request,
        ClaimsPrincipal user,
        AdminCrudService service,
        CancellationToken ct)
    {
        if (!IsAdmin(user)) return Results.Forbid();

        var result = await service.CreateUserAsync(request, ct);
        return result.IsSuccess
            ? Results.Created($"/api/v1/admin/users/{result.Data!.Id}", result.Data)
            : Results.BadRequest(new { Error = result.Error });
    }

    private static async Task<IResult> UpdateUser(
        int id,
        UpdateUserRequest request,
        ClaimsPrincipal user,
        AdminCrudService service,
        CancellationToken ct)
    {
        if (!IsAdmin(user)) return Results.Forbid();

        var result = await service.UpdateUserAsync(id, request, ct);
        return result.IsSuccess
            ? Results.Ok(result.Data)
            : Results.BadRequest(new { Error = result.Error });
    }

    private static async Task<IResult> ResetPassword(
        int id,
        ResetPasswordRequest request,
        ClaimsPrincipal user,
        AdminCrudService service,
        CancellationToken ct)
    {
        if (!IsAdmin(user)) return Results.Forbid();

        var result = await service.ResetPasswordAsync(id, request, ct);
        return result.IsSuccess
            ? Results.Ok(new { Message = "密码已重置" })
            : Results.BadRequest(new { Error = result.Error });
    }

    private static async Task<IResult> DeleteUser(
        int id,
        ClaimsPrincipal user,
        AdminCrudService service,
        CancellationToken ct)
    {
        if (!IsAdmin(user)) return Results.Forbid();

        var result = await service.DeleteUserAsync(id, ct);
        return result.IsSuccess
            ? Results.NoContent()
            : Results.BadRequest(new { Error = result.Error });
    }

    #endregion
}
