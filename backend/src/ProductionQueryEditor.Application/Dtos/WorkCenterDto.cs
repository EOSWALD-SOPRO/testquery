namespace ProductionQueryEditor.Application.Dtos;

public class WorkCenterDto
{
    public int             Id            { get; set; }
    public required string Name          { get; set; }
    public required string Title         { get; set; }
    public required string Establishment { get; set; }
}
