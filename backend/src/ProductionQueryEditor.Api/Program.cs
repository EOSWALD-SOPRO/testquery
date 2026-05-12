using Microsoft.OpenApi.Models;
using ProductionQueryEditor.Api.ExceptionHandlers;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Application.UseCases.ExecuteQuery;
using ProductionQueryEditor.Application.UseCases.Git.CheckoutBranch;
using ProductionQueryEditor.Application.UseCases.Git.Commit;
using ProductionQueryEditor.Application.UseCases.Git.CreateBranch;
using ProductionQueryEditor.Application.UseCases.Git.GetBranches;
using ProductionQueryEditor.Application.UseCases.Git.GetCommitHistory;
using ProductionQueryEditor.Application.UseCases.Git.Push;
using ProductionQueryEditor.Application.UseCases.Github.GetPullRequestStatus;
using ProductionQueryEditor.Application.UseCases.Github.ListCollaborators;
using ProductionQueryEditor.Application.UseCases.Github.ListPullRequests;
using ProductionQueryEditor.Application.UseCases.Github.MergePullRequest;
using ProductionQueryEditor.Application.UseCases.Github.OpenPullRequest;
using ProductionQueryEditor.Application.UseCases.ListAttributeModels;
using ProductionQueryEditor.Application.UseCases.ListQueries;
using ProductionQueryEditor.Application.UseCases.ListWorkCenters;
using ProductionQueryEditor.Infrastructure.Git;
using ProductionQueryEditor.Infrastructure.GitHub;
using ProductionQueryEditor.Infrastructure.Sql;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(opts =>
{
    opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// ── Typed options ──────────────────────────────────────────────────────────────
builder.Services.Configure<SqlConnectionOptions>(builder.Configuration.GetSection("ConnectionStrings"));
builder.Services.Configure<GitOptions>          (builder.Configuration.GetSection("Git"));
builder.Services.Configure<GitHubOptions>       (builder.Configuration.GetSection("GitHub"));

// ── Infrastructure adapters ────────────────────────────────────────────────────
builder.Services.AddSingleton<SqlConnectionFactory>();
builder.Services.AddSingleton<ISqlExecutor,              SqlServerExecutor>();
builder.Services.AddSingleton<ISqlConnectivityChecker,   SqlServerConnectivityChecker>();
builder.Services.AddSingleton<IQueryRepository,          DapperQueryRepository>();
builder.Services.AddSingleton<IWorkCenterRepository,     DapperWorkCenterRepository>();
builder.Services.AddSingleton<IAttributeModelRepository, DapperAttributeModelRepository>();
builder.Services.AddSingleton<IGitOperations,            LibGit2GitOperations>();
builder.Services.AddSingleton<IGitHubClient,             OctokitGitHubClient>();

// ── Use case handlers ──────────────────────────────────────────────────────────
builder.Services.AddScoped<ExecuteQueryHandler>();
builder.Services.AddScoped<ListQueriesHandler>();
builder.Services.AddScoped<ListWorkCentersHandler>();
builder.Services.AddScoped<ListAttributeModelsHandler>();
builder.Services.AddScoped<GetBranchesHandler>();
builder.Services.AddScoped<CreateBranchHandler>();
builder.Services.AddScoped<CheckoutBranchHandler>();
builder.Services.AddScoped<CommitHandler>();
builder.Services.AddScoped<PushHandler>();
builder.Services.AddScoped<GetCommitHistoryHandler>();
builder.Services.AddScoped<ListPullRequestsHandler>();
builder.Services.AddScoped<OpenPullRequestHandler>();
builder.Services.AddScoped<GetPullRequestStatusHandler>();
builder.Services.AddScoped<MergePullRequestHandler>();
builder.Services.AddScoped<ListCollaboratorsHandler>();

// ── Cross-cutting (story 07) ───────────────────────────────────────────────────
// Order matters: SqlExceptionHandler tries first, GlobalExceptionHandler is the fallback.
builder.Services.AddExceptionHandler<SqlExceptionHandler>();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddCors(opt => opt.AddDefaultPolicy(p => p
    .WithOrigins(builder.Configuration["Cors:Origins"]?.Split(',') ?? new[] { "http://localhost:5173" })
    .AllowAnyHeader()
    .AllowAnyMethod()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opts =>
{
    opts.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "Production Query Editor API",
        Version     = "v1",
        Description = "SOPROFEN — internal SQL editor for production-screen queries (TRN/PRD pipeline).",
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseExceptionHandler();   // built-in middleware that calls registered IExceptionHandlers in order
app.MapControllers();
app.Run();

public partial class Program { }
