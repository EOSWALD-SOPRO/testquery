using System.Data;
using System.Diagnostics;
using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Infrastructure.Sql;

/// <summary>
/// SQL Server adapter for <see cref="ISqlExecutor"/>. The read-only guard already ran
/// (the SqlScript VO won't construct otherwise), so this class only opens the connection,
/// runs the reader, and shapes the result.
/// </summary>
public sealed class SqlServerExecutor : ISqlExecutor
{
    private readonly SqlConnectionFactory _factory;
    private readonly ILogger<SqlServerExecutor> _logger;

    // Capture les references a un parametre nomme dans le script. Le lookbehind exclut
    // les variables systeme "@@version" / "@@rowcount" qui ne sont pas des parametres
    // bindables. La regex matche meme dans les commentaires/chaines : ce n'est pas un
    // probleme — un SqlParameter declare mais non utilise au runtime est tolere par
    // sp_executesql (sous-jacent a SqlCommand parametre).
    private static readonly Regex ParameterReferenceRegex = new(
        @"(?<!@)@([A-Za-z_][A-Za-z0-9_]*)",
        RegexOptions.Compiled);

    public SqlServerExecutor(SqlConnectionFactory factory, ILogger<SqlServerExecutor> logger)
    {
        _factory = factory;
        _logger  = logger;
    }

    public async Task<ExecuteQueryResponse> ExecuteAsync(
        SqlScript sql,
        EnvironmentName env,
        int? rowLimit,
        SqlQueryParameters parameters,
        CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();

        await using var conn = _factory.Create(env);
        await conn.OpenAsync(ct);

        await using var cmd = new SqlCommand(sql.Sql, conn) { CommandTimeout = 60 };
        BindParameters(cmd, sql.Sql, parameters);
        await using var reader = await cmd.ExecuteReaderAsync(ct);

        var columns = new string[reader.FieldCount];
        for (int i = 0; i < reader.FieldCount; i++) columns[i] = reader.GetName(i);

        var rows = new List<object?[]>();
        var truncated = false;
        while (await reader.ReadAsync(ct))
        {
            // Stop the reader as soon as we've buffered `rowLimit` rows. Note we don't
            // inject TOP into the SQL because (a) the script can contain CTEs/ORDER BY
            // that would conflict, and (b) we want the limit to apply even when the user
            // writes their own TOP — whichever is smaller wins.
            if (rowLimit is int limit && rows.Count >= limit)
            {
                truncated = true;
                break;
            }

            var row = new object?[reader.FieldCount];
            for (int i = 0; i < reader.FieldCount; i++)
                row[i] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            rows.Add(row);
        }

        sw.Stop();
        _logger.LogInformation("ExecuteQuery {Env} -> {RowCount} rows in {Took}ms (limit={Limit}, truncated={Truncated})",
            env.Value, rows.Count, sw.ElapsedMilliseconds, rowLimit, truncated);

        return new ExecuteQueryResponse
        {
            Columns      = columns,
            Rows         = rows.ToArray(),
            RowCount     = rows.Count,
            Took         = sw.ElapsedMilliseconds,
            Plan         = $"Executed on {env.Value} in {sw.ElapsedMilliseconds}ms",
            Truncated    = truncated,
            AppliedLimit = rowLimit,
        };
    }

    /// <summary>
    /// Lie les placeholders connus (<c>@WorkCenter</c> / <c>@WorkCenterId</c> /
    /// <c>@AttributeModel</c>) en <see cref="SqlParameter"/> sur la commande.
    /// On ne lie que ceux effectivement reference dans le script : cela laisse
    /// SQL Server lever une erreur explicite si l'editeur a oublie de transmettre
    /// une valeur attendue, plutot que d'injecter silencieusement un parametre.
    /// </summary>
    private static void BindParameters(SqlCommand cmd, string scriptSql, SqlQueryParameters parameters)
    {
        if (!parameters.HasAny) return;

        var referenced = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (Match m in ParameterReferenceRegex.Matches(scriptSql))
            referenced.Add(m.Groups[1].Value);

        // Bind retourne la SqlParameter ajoutee (utile pour preciser le type/taille
        // explicitement). Le nom utilise est l'orthographe trouvee dans le script,
        // ce qui rend les traces d'erreur SQL coherentes avec le buffer affiche.
        void TryBind(string canonicalName, SqlDbType type, int size, object value)
        {
            // SqlParameter est case-insensitive sur le nom, donc on prend la premiere
            // orthographe rencontree dans le script (ex. "@Workcenter" plutot que "@WorkCenter").
            string? spelling = null;
            foreach (var r in referenced)
            {
                if (string.Equals(r, canonicalName, StringComparison.OrdinalIgnoreCase))
                {
                    spelling = r;
                    break;
                }
            }
            if (spelling is null) return;

            var p = cmd.Parameters.Add("@" + spelling, type, size);
            p.Value = value;
        }

        if (parameters.WorkCenterId is int wcId)
        {
            // Le schema reel a deux conventions selon les Request : "WorkCenter" (sans suffixe,
            // dans les CUParameter recents) ou "WorkCenterId" (style classique des ProductionScreen).
            // On lie les deux quand ils sont presents — un script peut tres bien utiliser l'un
            // OU l'autre, jamais les deux a la fois.
            TryBind("WorkCenter",   SqlDbType.Int, 0, wcId);
            TryBind("WorkCenterId", SqlDbType.Int, 0, wcId);
        }

        if (parameters.AttributeModel is { Length: > 0 } attrModel)
        {
            // AttributeModel cote dbo.Component est un nvarchar; on cible 64 (les
            // valeurs reelles font au plus une vingtaine de caracteres).
            TryBind("AttributeModel", SqlDbType.NVarChar, 64, attrModel);
        }
    }
}
