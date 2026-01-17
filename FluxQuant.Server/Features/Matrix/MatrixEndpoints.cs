using System.Security.Claims;
using Carter;
using FluxQuant.Server.Domain.Enums;

namespace FluxQuant.Server.Features.Matrix;

/// <summary>
/// 管理端矩阵 API 端点
/// </summary>
public class MatrixEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin")
            .WithTags("Admin Matrix")
            .RequireAuthorization();

        // 项目管理
        group.MapGet("/projects", GetProjects)
            .WithName("GetProjects")
            .WithSummary("获取项目列表");

        // 矩阵数据
        group.MapGet("/matrix/{projectId:int}", GetMatrixData)
            .WithName("GetMatrixData")
            .WithSummary("获取项目矩阵数据");

        // 分配管理
        group.MapPost("/allocations", CreateAllocation)
            .WithName("CreateAllocation")
            .WithSummary("创建分配");

        group.MapPatch("/allocations/{id:int}", UpdateAllocation)
            .WithName("UpdateAllocation")
            .WithSummary("更新分配额度");

        // 配额调整
        group.MapPatch("/pools/{id:int}/quota", AdjustQuota)
            .WithName("AdjustQuota")
            .WithSummary("调整任务池配额（需记录原因）");

        // 员工列表
        group.MapGet("/employees", GetEmployees)
            .WithName("GetEmployees")
            .WithSummary("获取员工列表");
    }

    private static async Task<IResult> GetProjects(
        MatrixService service,
        CancellationToken ct)
    {
        var projects = await service.GetProjectsAsync(ct);
        return Results.Ok(projects);
    }

    private static async Task<IResult> GetMatrixData(
        int projectId,
        MatrixService service,
        CancellationToken ct)
    {
        var data = await service.GetMatrixDataAsync(projectId, ct);
        return data != null ? Results.Ok(data) : Results.NotFound();
    }

    private static async Task<IResult> CreateAllocation(
        CreateAllocationRequest request,
        ClaimsPrincipal user,
        MatrixService service,
        CancellationToken ct)
    {
        // 验证管理员权限
        var role = user.FindFirst(ClaimTypes.Role)?.Value;
        if (role != UserRole.Admin.ToString() && role != UserRole.Manager.ToString())
        {
            return Results.Forbid();
        }

        var result = await service.CreateAllocationAsync(request, ct);
        return result.IsSuccess 
            ? Results.Created($"/api/v1/admin/allocations/{result.Data!.AllocationId}", result.Data)
            : Results.BadRequest(new { Error = result.Error });
    }

    private static async Task<IResult> UpdateAllocation(
        int id,
        UpdateAllocationRequest request,
        ClaimsPrincipal user,
        MatrixService service,
        CancellationToken ct)
    {
        var role = user.FindFirst(ClaimTypes.Role)?.Value;
        if (role != UserRole.Admin.ToString() && role != UserRole.Manager.ToString())
        {
            return Results.Forbid();
        }

        var updateRequest = request with { AllocationId = id };
        var result = await service.UpdateAllocationAsync(updateRequest, ct);
        return result.IsSuccess 
            ? Results.Ok(result.Data)
            : Results.BadRequest(new { Error = result.Error });
    }

    private static async Task<IResult> AdjustQuota(
        int id,
        AdjustQuotaRequest request,
        ClaimsPrincipal user,
        MatrixService service,
        CancellationToken ct)
    {
        var role = user.FindFirst(ClaimTypes.Role)?.Value;
        if (role != UserRole.Admin.ToString() && role != UserRole.Manager.ToString())
        {
            return Results.Forbid();
        }

        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var operatorId))
        {
            return Results.Unauthorized();
        }

        var adjustRequest = request with { TaskPoolId = id };
        var result = await service.AdjustQuotaAsync(adjustRequest, operatorId, ct);
        return result.IsSuccess 
            ? Results.Ok(result.Data)
            : Results.BadRequest(new { Error = result.Error });
    }

    private static async Task<IResult> GetEmployees(
        MatrixService service,
        CancellationToken ct)
    {
        var employees = await service.GetEmployeesAsync(ct);
        return Results.Ok(employees);
    }
}
