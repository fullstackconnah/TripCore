using TripCore.Domain.Enums;

namespace TripCore.Domain.Entities;

/// <summary>
/// Master table for all staff members.
/// </summary>
public class Staff
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public StaffRole Role { get; set; }
    public string? Email { get; set; }
    public string? Mobile { get; set; }
    public string? Region { get; set; }
    public bool IsDriverEligible { get; set; }
    public bool IsFirstAidQualified { get; set; }
    public bool IsMedicationCompetent { get; set; }
    public bool IsManualHandlingCompetent { get; set; }
    public bool IsOvernightEligible { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<StaffAvailability> AvailabilityRecords { get; set; } = new List<StaffAvailability>();
    public ICollection<StaffAssignment> Assignments { get; set; } = new List<StaffAssignment>();
}
