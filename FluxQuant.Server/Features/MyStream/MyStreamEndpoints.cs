using System.Security.Claims;
using Carter;

namespace FluxQuant.Server.Features.MyStream;

/// <summary>
/// 员工任务流端点
/// </summary>
public class MyStreamEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/my")
            .WithTags("My Stream")
            .RequireAuthorization();

        group.MapGet("/allocations", GetMyAllocations)
            .WithName("GetMyAllocations")
            .WithSummary("获取我的任务分配列表")
            .WithDescription("返回当前登录用户的所有任务分配");

        group.MapGet("/allocations/{id:int}/history", GetAllocationHistory)
            .WithName("GetAllocationHistory")
            .WithSummary("获取分配的填报历史")
            .WithDescription("返回指定分配任务的所有填报记录");
    }

    /// <summary>
    /// 获取我的任务分配列表
    /// </summary>
    private static async Task<IResult> GetMyAllocations(
        ClaimsPrincipal user,
        MyStreamService service,
        CancellationToken ct)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Results.Unauthorized();
        }

        var allocations = await service.GetMyAllocationsAsync(userId, ct);
        return Results.Ok(allocations);
    }

    /// <summary>
    /// 获取分配的填报历史
    /// </summary>
    private static async Task<IResult> GetAllocationHistory(
        int id,
        ClaimsPrincipal user,
        MyStreamService service,
        CancellationToken ct)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Results.Unauthorized();
        }

        var history = await service.GetAllocationHistoryAsync(id, userId, ct);
        return Results.Ok(history);
    }
}
