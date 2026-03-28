using Microsoft.EntityFrameworkCore;
using TripCore.Domain.Entities;
using TripCore.Domain.Enums;
using TripCore.Infrastructure.Data;

namespace TripCore.Infrastructure.Services;

public class ClaimGenerationService
{
    private readonly TripCoreDbContext _db;

    public ClaimGenerationService(TripCoreDbContext db) => _db = db;

    /// <summary>
    /// Generates a Draft TripClaim for a completed trip.
    /// Returns the new claim, or throws InvalidOperationException with a user-facing message.
    /// </summary>
    public async Task<TripClaim> GenerateDraftClaimAsync(Guid tripInstanceId, CancellationToken ct = default)
    {
        var trip = await _db.TripInstances
            .Include(t => t.TripDays)
            .Include(t => t.Bookings).ThenInclude(b => b.Participant)
            .FirstOrDefaultAsync(t => t.Id == tripInstanceId, ct)
            ?? throw new InvalidOperationException("Trip not found.");

        if (trip.Status != TripStatus.Completed)
            throw new InvalidOperationException("Claims can only be generated for completed trips.");

        if (await _db.TripClaims.AnyAsync(c => c.TripInstanceId == tripInstanceId && c.Status != TripClaimStatus.Rejected, ct))
            throw new InvalidOperationException("An active claim already exists for this trip.");

        var settings = await _db.ProviderSettings.FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Provider settings are not configured. Please configure them in Settings before generating claims.");

        // Resolve activity group — use trip's default, or fall back to GRP_COMMUNITY_ACCESS
        var activityGroupId = trip.DefaultActivityGroupId;
        if (activityGroupId == null)
        {
            var defaultGroup = await _db.SupportActivityGroups
                .FirstOrDefaultAsync(g => g.GroupCode == "GRP_COMMUNITY_ACCESS", ct)
                ?? throw new InvalidOperationException("No activity group is configured. Please import the support catalogue in Settings first.");
            activityGroupId = defaultGroup.Id;
        }

        var confirmedBookings = trip.Bookings
            .Where(b => b.BookingStatus == BookingStatus.Confirmed)
            .ToList();

        if (!confirmedBookings.Any())
            throw new InvalidOperationException("No confirmed bookings found on this trip.");

        // Load public holidays that overlap trip dates
        var tripEnd = trip.StartDate.AddDays(trip.DurationDays - 1);
        var publicHolidays = (await _db.PublicHolidays
            .Where(h => h.Date >= trip.StartDate && h.Date <= tripEnd && (h.State == null || h.State == "VIC"))
            .Select(h => h.Date)
            .ToListAsync(ct))
            .ToHashSet();

        // Load active catalogue items for this activity group
        var catalogueItems = await _db.SupportCatalogueItems
            .Where(i => i.ActivityGroupId == activityGroupId && i.IsActive)
            .ToListAsync(ct);

        if (!catalogueItems.Any())
            throw new InvalidOperationException("No support catalogue items found. Please import the NDIS Support Catalogue in Settings before generating claims.");

        var claimReference = BuildClaimReference(trip);
        var claim = new TripClaim
        {
            Id = Guid.NewGuid(),
            TripInstanceId = tripInstanceId,
            Status = TripClaimStatus.Draft,
            ClaimReference = claimReference,
            CreatedAt = DateTime.UtcNow
        };
        _db.TripClaims.Add(claim);

        var lineItems = new List<ClaimLineItem>();

        foreach (var booking in confirmedBookings)
        {
            if (booking.Participant == null || string.IsNullOrWhiteSpace(booking.Participant.NdisNumber))
                continue; // Skip bookings without a participant or NDIS number

            var ratio = booking.SupportRatioOverride ?? booking.Participant.SupportRatio;
            // GSTCode.P1 = GST applies, GSTCode.P2 = GST-free
            var gstCode = settings.GSTRegistered ? GSTCode.P1 : GSTCode.P2;

            // Group trip days by day type, get date ranges
            var dayGroups = GroupDaysByType(trip.TripDays.OrderBy(d => d.Date).ToList(), publicHolidays);

            foreach (var group in dayGroups)
            {
                var catalogueItem = catalogueItems.FirstOrDefault(i => i.DayType == group.DayType);
                if (catalogueItem == null)
                    continue;

                var unitPrice = GetPriceForRatio(catalogueItem, ratio);
                var hours = group.DayCount * trip.ActiveHoursPerDay;
                var total = hours * unitPrice;

                var lineItem = new ClaimLineItem
                {
                    Id = Guid.NewGuid(),
                    TripClaimId = claim.Id,
                    ParticipantBookingId = booking.Id,
                    SupportItemCode = catalogueItem.ItemNumber,
                    DayType = group.DayType,
                    SupportsDeliveredFrom = group.From,
                    SupportsDeliveredTo = group.To,
                    Hours = hours,
                    UnitPrice = unitPrice,
                    TotalAmount = total,
                    GSTCode = gstCode,
                    ClaimType = ClaimType.Standard,
                    Status = ClaimLineItemStatus.Draft
                };
                lineItems.Add(lineItem);
            }

            booking.ClaimStatus = ClaimStatus.InClaim;
        }

        _db.ClaimLineItems.AddRange(lineItems);
        claim.TotalAmount = lineItems.Sum(l => l.TotalAmount);

        await _db.SaveChangesAsync(ct);
        return claim;
    }

    private static string BuildClaimReference(TripInstance trip)
    {
        var code = trip.TripCode ?? trip.Id.ToString("N")[..8].ToUpper();
        var date = DateTime.UtcNow.ToString("yyyyMMdd");
        var raw = $"TC-{code}-{date}";
        return raw.Length > 50 ? raw[..50] : raw;
    }

    private static List<DayGroup> GroupDaysByType(List<TripDay> days, HashSet<DateOnly> publicHolidays)
    {
        var result = new List<DayGroup>();
        DayGroup? current = null;

        foreach (var day in days)
        {
            var dayType = ResolveDayType(day.Date, day.IsPublicHoliday || publicHolidays.Contains(day.Date));

            if (current == null || current.DayType != dayType || current.To.AddDays(1) != day.Date)
            {
                current = new DayGroup { DayType = dayType, From = day.Date, To = day.Date, DayCount = 1 };
                result.Add(current);
            }
            else
            {
                current.To = day.Date;
                current.DayCount++;
            }
        }

        return result;
    }

    private static ClaimDayType ResolveDayType(DateOnly date, bool isPublicHoliday)
    {
        if (isPublicHoliday) return ClaimDayType.PublicHoliday;
        return date.DayOfWeek switch
        {
            DayOfWeek.Saturday => ClaimDayType.Saturday,
            DayOfWeek.Sunday => ClaimDayType.Sunday,
            _ => ClaimDayType.Weekday
        };
    }

    private static decimal GetPriceForRatio(SupportCatalogueItem item, SupportRatio ratio)
    {
        return ratio switch
        {
            SupportRatio.OneToTwo => item.PriceLimit_1to2,
            SupportRatio.OneToThree => item.PriceLimit_1to3,
            SupportRatio.OneToFour => item.PriceLimit_1to4,
            SupportRatio.OneToFive => item.PriceLimit_1to5,
            _ => item.PriceLimit_Standard
        };
    }

    private class DayGroup
    {
        public ClaimDayType DayType { get; set; }
        public DateOnly From { get; set; }
        public DateOnly To { get; set; }
        public int DayCount { get; set; }
    }
}
