namespace TripCore.Domain.Entities;

/// <summary>
/// Individual activity item within a trip day's schedule.
/// </summary>
public class ScheduledActivity
{
    public Guid Id { get; set; }
    public Guid TripDayId { get; set; }
    public TripDay TripDay { get; set; } = null!;
    public Guid? ActivityId { get; set; }
    public Activity? Activity { get; set; }
    public string Title { get; set; } = string.Empty;
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? Location { get; set; }
    public string? AccessibilityNotes { get; set; }
    public string? Notes { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
