namespace ProductionQueryEditor.Application.Dtos;

public class ExecuteQueryRequest
{
    public required string Sql { get; set; }
    public required string Env { get; set; }   // "TRN" | "PRD"

    /// <summary>
    /// Maximum number of rows to return. Null = unlimited (dangerous for huge result sets,
    /// can crash the browser). The frontend exposes preset choices (100/500/1000/5000/10000/null).
    /// </summary>
    public int? RowLimit { get; set; }

    /// <summary>
    /// WorkCenter Id du QueryDto actif. Lie <c>@WorkCenter</c> / <c>@WorkCenterId</c>
    /// quand ces placeholders sont presents dans le script — c'est ce que le moteur
    /// SOPROFEN de prod fait au runtime. Null = aucune liaison (le serveur SQL plantera
    /// si le script y fait reference, ce qui est le comportement attendu).
    /// </summary>
    public int? WorkCenterId { get; set; }

    /// <summary>
    /// Nom de l'AttributeModel du QueryDto actif (ex. "COULISSE", "POC"). Lie
    /// <c>@AttributeModel</c> lorsqu'il est reference. Null pour les CUParameter
    /// (qui n'ont pas de notion d'AttributeModel).
    /// </summary>
    public string? AttributeModel { get; set; }
}
