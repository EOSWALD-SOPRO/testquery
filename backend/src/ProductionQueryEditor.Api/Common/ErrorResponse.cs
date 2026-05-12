namespace ProductionQueryEditor.Api.Common;

/// <summary>Single shape used by every error response (validation, infra, exception). Kept stable for the React client.</summary>
public sealed record ErrorResponse(string Error, string Code);
