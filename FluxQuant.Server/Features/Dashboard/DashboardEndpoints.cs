using Carter;

namespace FluxQuant.Server.Features.Dashboard;

/// <summary>
/// Dashboard API 端点
/// </summary>
public class DashboardEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/dashboard")
            .WithTags("Dashboard")
            .RequireAuthorization();

        group.MapGet("/stats", GetStats)
            .WithName("GetDashboardStats")
            .WithSummary("获取仪表板统计数据");
    }

    private static async Task<IResult> GetStats(
        DashboardService service,
        CancellationToken ct)
    {
        var stats = await service.GetStatsAsync(ct);
        return Results.Ok(stats);
    }
}
