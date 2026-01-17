using System.Security.Claims;
using Carter;

namespace FluxQuant.Server.Features.Report;

/// <summary>
/// 填报相关端点
/// </summary>
public class ReportEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/report")
            .WithTags("Report")
            .RequireAuthorization();

        group.MapPost("/", SubmitReport)
            .WithName("SubmitReport")
            .WithSummary("提交填报")
            .WithDescription("提交有效产出和除外量");

        group.MapPost("/{logId:long}/revert", RevertReport)
            .WithName("RevertReport")
            .WithSummary("撤回填报")
            .WithDescription("撤回24小时内的填报记录");

        group.MapGet("/reasons", GetExclusionReasons)
            .WithName("GetExclusionReasons")
            .WithSummary("获取除外原因选项")
            .AllowAnonymous();
    }

    /// <summary>
    /// 提交填报
    /// </summary>
    private static async Task<IResult> SubmitReport(
        ReportRequest request,
        ClaimsPrincipal user,
        ReportService service,
        CancellationToken ct)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Results.Unauthorized();
        }

        var result = await service.SubmitReportAsync(request, userId, ct);
        
        return result.IsSuccess 
            ? Results.Ok(result.Data)
            : Results.BadRequest(new { Error = result.Error });
    }

    /// <summary>
    /// 撤回填报
    /// </summary>
    private static async Task<IResult> RevertReport(
        long logId,
        ClaimsPrincipal user,
        ReportService service,
        CancellationToken ct)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Results.Unauthorized();
        }

        var result = await service.RevertReportAsync(logId, userId, ct);
        
        return result.IsSuccess 
            ? Results.Ok(result.Data)
            : Results.BadRequest(new { Error = result.Error });
    }

    /// <summary>
    /// 获取除外原因选项
    /// </summary>
    private static IResult GetExclusionReasons()
    {
        return Results.Ok(ExclusionReasons.All);
    }
}
