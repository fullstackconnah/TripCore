using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TripCore.Application.Common;
using TripCore.Application.DTOs;
using TripCore.Domain.Enums;
using TripCore.Infrastructure.Data;

namespace TripCore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/schedule")]
public class ScheduleController : ControllerBase
{
    private readonly TripCoreDbContext _db;
    public ScheduleController(TripCoreDbContext db) => _db = db;

    /// <summary>
    /// Returns a scheduling overview: all trips with staff/vehicle availability matrix.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<ScheduleOverviewDto>>> GetScheduleOverview(
        [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct)
    {
        // Default window: 3 months back to 12 months forward
        var windowStart = from ?? DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-3));
        var windowEnd = to ?? DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(12));

        // ── 1. Load trips in window ──
        var trips = await _db.TripInstances
            .Include(t => t.LeadCoordinator)
            .Include(t => t.Bookings)
            .Include(t => t.StaffAssignments)
            .Include(t => t.VehicleAssignments)
            .Where(t => t.Status != TripStatus.Cancelled && t.Status != TripStatus.Archived && t.Status != TripStatus.Completed)
            .Where(t => t.StartDate <= windowEnd && t.StartDate.AddDays(t.DurationDays - 1) >= windowStart)
            .OrderBy(t => t.StartDate)
            .ToListAsync(ct);

        var tripDtos = trips.Select(t => new ScheduleTripDto
        {
            Id = t.Id,
            TripName = t.TripName,
            TripCode = t.TripCode,
            Destination = t.Destination,
            Region = t.Region,
            StartDate = t.StartDate,
            EndDate = t.StartDate.AddDays(t.DurationDays - 1),
            DurationDays = t.DurationDays,
            Status = t.Status,
            MaxParticipants = t.MaxParticipants,
            CurrentParticipantCount = t.Bookings.Count(b =>
                b.BookingStatus != BookingStatus.Cancelled && b.BookingStatus != BookingStatus.NoLongerAttending),
            MinStaffRequired = t.MinStaffRequired,
            StaffRequired = t.CalculatedStaffRequired > 0
                ? (int)Math.Ceiling(t.CalculatedStaffRequired)
                : t.MinStaffRequired,
            StaffAssignedCount = t.StaffAssignments.Count(a => a.Status != AssignmentStatus.Cancelled),
            VehicleAssignedCount = t.VehicleAssignments.Count(a =>
                a.Status != VehicleAssignmentStatus.Cancelled && a.Status != VehicleAssignmentStatus.Unavailable),
            LeadCoordinatorName = t.LeadCoordinator != null
                ? t.LeadCoordinator.FirstName + " " + t.LeadCoordinator.LastName : null,
        }).ToList();

        if (trips.Count == 0)
        {
            return Ok(ApiResponse<ScheduleOverviewDto>.Ok(new ScheduleOverviewDto
            {
                Trips = tripDtos, Staff = new(), Vehicles = new()
            }));
        }

        // ── 2. Load all active staff with assignments & availability ──
        var allStaff = await _db.Staff
            .Where(s => s.IsActive)
            .OrderBy(s => s.LastName).ThenBy(s => s.FirstName)
            .ToListAsync(ct);

        var staffIds = allStaff.Select(s => s.Id).ToList();

        var staffAssignments = await _db.StaffAssignments
            .Where(a => staffIds.Contains(a.StaffId) && a.Status != AssignmentStatus.Cancelled)
            .ToListAsync(ct);

        // Load availability within the overall trip window
        var overallStart = trips.Min(t => t.StartDate).ToDateTime(TimeOnly.MinValue);
        var overallEnd = trips.Max(t => t.StartDate.AddDays(t.DurationDays - 1)).ToDateTime(TimeOnly.MaxValue);

        var staffAvailability = await _db.StaffAvailabilities
            .Where(a => staffIds.Contains(a.StaffId)
                && a.StartDateTime < overallEnd && a.EndDateTime > overallStart)
            .ToListAsync(ct);

        var staffDtos = allStaff.Select(s =>
        {
            var myAssignments = staffAssignments.Where(a => a.StaffId == s.Id).ToList();
            var myAvailability = staffAvailability.Where(a => a.StaffId == s.Id).ToList();

            var tripStatuses = trips.Select(t =>
            {
                var tripStart = t.StartDate;
                var tripEnd = t.StartDate.AddDays(t.DurationDays - 1);

                // Check if assigned to THIS trip
                var assignedToThis = myAssignments.FirstOrDefault(a => a.TripInstanceId == t.Id);
                if (assignedToThis != null)
                {
                    return new ScheduleStaffTripStatusDto
                    {
                        TripId = t.Id,
                        Status = "Assigned",
                        AssignmentRole = assignedToThis.AssignmentRole,
                        AssignmentStatus = assignedToThis.Status,
                        AssignmentId = assignedToThis.Id,
                    };
                }

                // Check if assigned to ANOTHER overlapping trip
                var conflicting = myAssignments.Any(a =>
                    a.TripInstanceId != t.Id
                    && a.AssignmentStart <= tripEnd && a.AssignmentEnd >= tripStart);
                if (conflicting)
                {
                    return new ScheduleStaffTripStatusDto
                    {
                        TripId = t.Id, Status = "Conflict"
                    };
                }

                // Check availability records for unavailability/leave
                var tripStartDt = tripStart.ToDateTime(TimeOnly.MinValue);
                var tripEndDt = tripEnd.ToDateTime(TimeOnly.MaxValue);
                var unavailable = myAvailability.Any(a =>
                    (a.AvailabilityType == AvailabilityType.Unavailable || a.AvailabilityType == AvailabilityType.Leave)
                    && a.StartDateTime < tripEndDt && a.EndDateTime > tripStartDt);
                if (unavailable)
                {
                    return new ScheduleStaffTripStatusDto
                    {
                        TripId = t.Id, Status = "Unavailable"
                    };
                }

                return new ScheduleStaffTripStatusDto
                {
                    TripId = t.Id, Status = "Available"
                };
            }).ToList();

            return new ScheduleStaffDto
            {
                Id = s.Id,
                FirstName = s.FirstName,
                LastName = s.LastName,
                FullName = s.FirstName + " " + s.LastName,
                Role = s.Role,
                Region = s.Region,
                IsDriverEligible = s.IsDriverEligible,
                IsFirstAidQualified = s.IsFirstAidQualified,
                IsMedicationCompetent = s.IsMedicationCompetent,
                IsManualHandlingCompetent = s.IsManualHandlingCompetent,
                IsOvernightEligible = s.IsOvernightEligible,
                TripStatuses = tripStatuses,
                Availability = myAvailability.Select(a => new StaffAvailabilityDto
                {
                    Id = a.Id, StaffId = a.StaffId,
                    StartDateTime = a.StartDateTime, EndDateTime = a.EndDateTime,
                    AvailabilityType = a.AvailabilityType,
                    IsRecurring = a.IsRecurring, RecurrenceNotes = a.RecurrenceNotes, Notes = a.Notes
                }).ToList()
            };
        }).ToList();

        // ── 3. Load all active vehicles with assignments ──
        var allVehicles = await _db.Vehicles
            .Where(v => v.IsActive)
            .OrderBy(v => v.VehicleName)
            .ToListAsync(ct);

        var vehicleIds = allVehicles.Select(v => v.Id).ToList();

        var vehicleAssignments = await _db.VehicleAssignments
            .Include(a => a.TripInstance)
            .Where(a => vehicleIds.Contains(a.VehicleId)
                && a.Status != VehicleAssignmentStatus.Cancelled
                && a.Status != VehicleAssignmentStatus.Unavailable)
            .ToListAsync(ct);

        var vehicleDtos = allVehicles.Select(v =>
        {
            var myAssignments = vehicleAssignments.Where(a => a.VehicleId == v.Id).ToList();

            var tripStatuses = trips.Select(t =>
            {
                var tripStart = t.StartDate;
                var tripEnd = t.StartDate.AddDays(t.DurationDays - 1);

                var assignedToThis = myAssignments.FirstOrDefault(a => a.TripInstanceId == t.Id);
                if (assignedToThis != null)
                {
                    return new ScheduleVehicleTripStatusDto
                    {
                        TripId = t.Id, Status = "Assigned",
                        AssignmentStatus = assignedToThis.Status
                    };
                }

                var conflicting = myAssignments.Any(a =>
                    a.TripInstanceId != t.Id
                    && a.TripInstance.StartDate <= tripEnd
                    && a.TripInstance.StartDate.AddDays(a.TripInstance.DurationDays - 1) >= tripStart);
                if (conflicting)
                {
                    return new ScheduleVehicleTripStatusDto
                    {
                        TripId = t.Id, Status = "Conflict"
                    };
                }

                return new ScheduleVehicleTripStatusDto
                {
                    TripId = t.Id, Status = "Available"
                };
            }).ToList();

            return new ScheduleVehicleDto
            {
                Id = v.Id,
                VehicleName = v.VehicleName,
                Registration = v.Registration,
                VehicleType = v.VehicleType,
                TotalSeats = v.TotalSeats,
                WheelchairPositions = v.WheelchairPositions,
                IsInternal = v.IsInternal,
                TripStatuses = tripStatuses
            };
        }).ToList();

        var result = new ScheduleOverviewDto
        {
            Trips = tripDtos,
            Staff = staffDtos,
            Vehicles = vehicleDtos
        };

        return Ok(ApiResponse<ScheduleOverviewDto>.Ok(result));
    }
}
