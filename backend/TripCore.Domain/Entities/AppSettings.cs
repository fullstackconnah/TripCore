using System.ComponentModel.DataAnnotations.Schema;

namespace TripCore.Domain.Entities;

public class AppSettings
{
    /// <summary>Always 1 — this is a single-row settings table.</summary>
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int Id { get; set; }

    public int QualificationWarningDays { get; set; } = 30;
}
