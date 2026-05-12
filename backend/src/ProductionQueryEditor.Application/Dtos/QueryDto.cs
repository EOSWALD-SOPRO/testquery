namespace ProductionQueryEditor.Application.Dtos;

// Shape consumed by the React frontend (src/data/mockData.js).
// Two source variants:
//   "production_screen" → 1 row of dbo.ProductionScreen
//   "cu_parameter"      → 1 row of dbo.CUParameter
public class QueryDto
{
    public required string Id              { get; set; }
    public required string Source          { get; set; }
    public required string Name            { get; set; }
    public int?            RequestId       { get; set; }
    public int             WorkCenterId    { get; set; }
    public required string WorkCenter      { get; set; }
    public required string Establishment   { get; set; }
    public string?         AttributeModel  { get; set; }
    public bool?           ShouldUseComponent { get; set; }
    public bool?           IsReadonly         { get; set; }
    public bool?           UseColumnSelection { get; set; }
    public required string Sql             { get; set; }
    public string          Branch          { get; set; } = "main";
    public string          Status          { get; set; } = "clean";
    public string          Author          { get; set; } = "";
}
