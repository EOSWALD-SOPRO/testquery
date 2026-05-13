namespace ProductionQueryEditor.Domain.ValueObjects;

/// <summary>
/// Valeurs des placeholders qu'un script peut reference (<c>@WorkCenter</c>,
/// <c>@AttributeModel</c>...). Mirroir des deux champs du QueryDto actif cote UI :
/// l'editeur les envoie au backend a chaque execution pour que SQL Server resolve
/// les placeholders comme le ferait le moteur SOPROFEN en production.
/// </summary>
/// <remarks>
/// Tous les champs sont optionnels :
///   - Un <c>WorkCenterId</c> null + un script qui reference <c>@WorkCenter</c>
///     laissera SQL Server lever "Must declare the scalar variable" — c'est
///     volontaire (signal clair que le contexte d'execution est incomplet).
///   - L'<c>AttributeModel</c> est null pour les CUParameter (le modele n'a pas
///     cette notion). Le script CU ne doit pas y faire reference.
/// </remarks>
public sealed record SqlQueryParameters(int? WorkCenterId, string? AttributeModel)
{
    public static SqlQueryParameters None { get; } = new(null, null);

    public bool HasAny => WorkCenterId is not null || !string.IsNullOrEmpty(AttributeModel);
}
