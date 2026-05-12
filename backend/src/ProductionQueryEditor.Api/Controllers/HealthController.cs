using Microsoft.AspNetCore.Mvc;
using ProductionQueryEditor.Application.Ports;
using EnvironmentName = ProductionQueryEditor.Domain.ValueObjects.EnvironmentName;

namespace ProductionQueryEditor.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly ISqlConnectivityChecker _ping;
    public HealthController(ISqlConnectivityChecker ping) => _ping = ping;

    [HttpGet]
    public async Task<IActionResult> Check(CancellationToken ct)
    {
        var services = new Dictionary<string, string> { { "api", "healthy" } };
        var status   = "ok";

        foreach (var env in new[] { EnvironmentName.Trn, EnvironmentName.Prd })
        {
            var ok = await _ping.PingAsync(env, ct);
            services[$"database_{env.Value.ToLower()}"] = ok ? "healthy" : "unhealthy";
            if (!ok) status = "degraded";
        }

        var resp = new { status, timestamp = DateTimeOffset.UtcNow.ToString("O"), uptime = Environment.TickCount64 / 1000.0, services };
        return status == "ok" ? Ok(resp) : StatusCode(503, resp);
    }
}
