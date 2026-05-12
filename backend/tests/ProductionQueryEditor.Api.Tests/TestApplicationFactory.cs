using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Application.Tests.Fakes;

namespace ProductionQueryEditor.Api.Tests;

/// <summary>
/// Boots the full API in-process with all infrastructure ports replaced by fakes from
/// <c>Application.Tests/Fakes</c>. Tests get a hermetic environment — no SQL Server, no git, no GitHub.
/// </summary>
public sealed class TestApplicationFactory : WebApplicationFactory<Program>
{
    public FakeQueryRepository           Queries        { get; } = new();
    public FakeWorkCenterRepository      WorkCenters    { get; } = new();
    public FakeAttributeModelRepository  AttributeModels{ get; } = new();
    public FakeSqlExecutor               SqlExecutor    { get; } = new();
    public FakeSqlConnectivityChecker    SqlConnectivity{ get; } = new();
    public FakeGitOperations             Git            { get; } = new();
    public FakeGitHubClient              GitHub         { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IQueryRepository>();
            services.RemoveAll<IWorkCenterRepository>();
            services.RemoveAll<IAttributeModelRepository>();
            services.RemoveAll<ISqlExecutor>();
            services.RemoveAll<ISqlConnectivityChecker>();
            services.RemoveAll<IGitOperations>();
            services.RemoveAll<IGitHubClient>();

            services.AddSingleton<IQueryRepository>(Queries);
            services.AddSingleton<IWorkCenterRepository>(WorkCenters);
            services.AddSingleton<IAttributeModelRepository>(AttributeModels);
            services.AddSingleton<ISqlExecutor>(SqlExecutor);
            services.AddSingleton<ISqlConnectivityChecker>(SqlConnectivity);
            services.AddSingleton<IGitOperations>(Git);
            services.AddSingleton<IGitHubClient>(GitHub);
        });
    }
}
