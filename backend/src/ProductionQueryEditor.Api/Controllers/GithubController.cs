using Microsoft.AspNetCore.Mvc;
using ProductionQueryEditor.Api.Common;
using ProductionQueryEditor.Application.Dtos;
// Note: per-endpoint [ProducesResponseType] for success types is omitted on this controller
// for brevity — endpoints return varied shapes. Class-level annotations cover the error cases.
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

namespace ProductionQueryEditor.Api.Controllers;

[ApiController]
[Route("api/github")]
[ProducesResponseType(typeof(ErrorResponse), 400)]
[ProducesResponseType(typeof(ErrorResponse), 500)]
public class GithubController : ControllerBase
{
    private readonly GetBranchesHandler          _getBranches;
    private readonly CreateBranchHandler         _createBranch;
    private readonly CheckoutBranchHandler       _checkoutBranch;
    private readonly CommitHandler               _commit;
    private readonly PushHandler                 _push;
    private readonly GetCommitHistoryHandler     _history;
    private readonly ListPullRequestsHandler     _listPrs;
    private readonly OpenPullRequestHandler      _openPr;
    private readonly GetPullRequestStatusHandler _prStatus;
    private readonly MergePullRequestHandler     _mergePr;
    private readonly ListCollaboratorsHandler    _collaborators;

    public GithubController(
        GetBranchesHandler getBranches, CreateBranchHandler createBranch,
        CheckoutBranchHandler checkoutBranch, CommitHandler commit, PushHandler push,
        GetCommitHistoryHandler history,
        ListPullRequestsHandler listPrs, OpenPullRequestHandler openPr,
        GetPullRequestStatusHandler prStatus, MergePullRequestHandler mergePr,
        ListCollaboratorsHandler collaborators)
    {
        _getBranches = getBranches; _createBranch = createBranch;
        _checkoutBranch = checkoutBranch; _commit = commit; _push = push;
        _history = history;
        _listPrs = listPrs; _openPr = openPr; _prStatus = prStatus;
        _mergePr = mergePr; _collaborators = collaborators;
    }

    // ── Git ─────────────────────────────────────────────────────────────────────
    [HttpGet("branches")]
    public async Task<IActionResult> Branches(CancellationToken ct)
        => (await _getBranches.HandleAsync(new GetBranchesQuery(), ct)).ToActionResult();

    [HttpPost("branches")]
    public async Task<IActionResult> CreateBranch([FromBody] CreateBranchRequest req, CancellationToken ct)
        => (await _createBranch.HandleAsync(new CreateBranchCommand(req.Name), ct)).ToActionResult();

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest req, CancellationToken ct)
        => (await _checkoutBranch.HandleAsync(new CheckoutBranchCommand(req.Branch), ct)).ToActionResult();

    [HttpPost("commit")]
    public async Task<IActionResult> Commit([FromBody] CommitRequest req, CancellationToken ct)
        => (await _commit.HandleAsync(new CommitCommand(req.Message, req.Files), ct)).ToActionResult();

    [HttpPost("push")]
    public async Task<IActionResult> Push([FromBody] CheckoutRequest? req, CancellationToken ct)
        => (await _push.HandleAsync(new PushCommand(req?.Branch), ct)).ToActionResult();

    [HttpGet("history")]
    public async Task<IActionResult> History([FromQuery] int limit = 20, CancellationToken ct = default)
        => (await _history.HandleAsync(new GetCommitHistoryQuery(limit), ct)).ToActionResult();

    // ── GitHub ──────────────────────────────────────────────────────────────────
    [HttpGet("pull-requests")]
    public async Task<IActionResult> ListPrs([FromQuery] string state = "open", CancellationToken ct = default)
        => (await _listPrs.HandleAsync(new ListPullRequestsQuery(state), ct)).ToActionResult();

    [HttpPost("pull-requests")]
    public async Task<IActionResult> OpenPr([FromBody] PullRequestCreateRequest req, CancellationToken ct)
        => (await _openPr.HandleAsync(
            new OpenPullRequestCommand(req.Title, req.Body, req.Branch, req.BaseBranch, req.Reviewers),
            ct)).ToActionResult();

    [HttpGet("pull-requests/{number:int}/status")]
    public async Task<IActionResult> PrStatus(int number, CancellationToken ct)
        => (await _prStatus.HandleAsync(new GetPullRequestStatusQuery(number), ct)).ToActionResult();

    [HttpPost("pull-requests/{number:int}/merge")]
    public async Task<IActionResult> Merge(int number, [FromBody] Dictionary<string, string>? body, CancellationToken ct)
    {
        var method = body != null && body.TryGetValue("mergeMethod", out var m) ? m : null;
        return (await _mergePr.HandleAsync(new MergePullRequestCommand(number, method), ct)).ToActionResult();
    }

    [HttpGet("collaborators")]
    public async Task<IActionResult> Collaborators(CancellationToken ct)
        => (await _collaborators.HandleAsync(new ListCollaboratorsQuery(), ct)).ToActionResult();
}
