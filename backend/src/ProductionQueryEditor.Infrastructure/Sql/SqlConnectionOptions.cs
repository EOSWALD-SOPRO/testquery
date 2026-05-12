namespace ProductionQueryEditor.Infrastructure.Sql;

/// <summary>Connection strings per environment, bound from <c>ConnectionStrings:</c> in appsettings.</summary>
public sealed class SqlConnectionOptions
{
    public string SqlTRN { get; set; } = "";
    public string SqlPRD { get; set; } = "";
}
