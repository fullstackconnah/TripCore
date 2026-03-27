using System.Text;
using Microsoft.EntityFrameworkCore;
using TripCore.Domain.Enums;
using TripCore.Infrastructure.Data;

namespace TripCore.Infrastructure.Services;

public class BprCsvService
{
    private readonly TripCoreDbContext _db;

    public BprCsvService(TripCoreDbContext db) => _db = db;

    /// <summary>
    /// Generates a BPR CSV byte array for all agency-managed line items in the given claim.
    /// Columns: 13 (non-PACE) or 15 (PACE, adds ClaimType + ABN columns).
    /// </summary>
    public async Task<(byte[] Content, string FileName)> GenerateBprCsvAsync(Guid claimId, CancellationToken ct = default)
    {
        var claim = await _db.TripClaims
            .Include(c => c.TripInstance)
            .Include(c => c.AuthorisedByStaff)
            .Include(c => c.LineItems)
                .ThenInclude(l => l.ParticipantBooking)
                    .ThenInclude(b => b.Participant)
            .FirstOrDefaultAsync(c => c.Id == claimId, ct)
            ?? throw new InvalidOperationException("Claim not found.");

        var settings = await _db.ProviderSettings.FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Provider settings not configured.");

        // Only agency-managed bookings go in the BPR
        var agencyItems = claim.LineItems
            .Where(l => (l.ParticipantBooking.PlanTypeOverride ?? l.ParticipantBooking.Participant?.PlanType) == PlanType.AgencyManaged)
            .ToList();

        var authorisedBy = claim.AuthorisedByStaff != null
            ? $"{claim.AuthorisedByStaff.FirstName} {claim.AuthorisedByStaff.LastName}"
            : string.Empty;

        var sb = new StringBuilder();

        // Header row
        if (settings.IsPaceProvider)
            sb.AppendLine("RegistrationNumber,NDISNumber,SupportsDeliveredFrom,SupportsDeliveredTo,SupportNumber,ClaimReference,Quantity,Hours,UnitPrice,GSTCode,AuthorisedBy,ParticipantApproved,InKindFundingProgram,ClaimType,ABNofSupportProvider");
        else
            sb.AppendLine("RegistrationNumber,NDISNumber,SupportsDeliveredFrom,SupportsDeliveredTo,SupportNumber,ClaimReference,Quantity,Hours,UnitPrice,GSTCode,AuthorisedBy,ParticipantApproved,InKindFundingProgram");

        foreach (var item in agencyItems)
        {
            var participant = item.ParticipantBooking.Participant;
            var ndisNumber = participant?.NdisNumber ?? string.Empty;
            var fromDate = item.SupportsDeliveredFrom.ToString("yyyy-MM-dd");
            var toDate = item.SupportsDeliveredTo.ToString("yyyy-MM-dd");
            var hours = FormatHours(item.Hours);
            var unitPrice = item.UnitPrice.ToString("F2");
            // GSTCode enum values are P1/P2/P5 — ToString() produces the correct BPR string directly
            var gstCode = MapGstCode(item.GSTCode);
            var approved = item.ParticipantApproved ? "Y" : "N";
            // ClaimReference per BPR row = short line item ID (max 50 chars)
            var rowRef = item.Id.ToString("N")[..20];
            // Map ClaimType to BPR string (STAN=standard, CANC=cancellation)
            var claimTypeBpr = MapClaimType(item.ClaimType);

            if (settings.IsPaceProvider)
                sb.AppendLine($"{settings.RegistrationNumber},{ndisNumber},{fromDate},{toDate},{item.SupportItemCode},{rowRef},,{hours},{unitPrice},{gstCode},{CsvEscape(authorisedBy)},{approved},,{claimTypeBpr},{settings.ABN}");
            else
                sb.AppendLine($"{settings.RegistrationNumber},{ndisNumber},{fromDate},{toDate},{item.SupportItemCode},{rowRef},,{hours},{unitPrice},{gstCode},{CsvEscape(authorisedBy)},{approved},");
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"BPR-{claim.ClaimReference}-{DateTime.UtcNow:yyyyMMdd}.csv";
        return (bytes, fileName);
    }

    private static string MapGstCode(GSTCode code)
    {
        // Enum values are P1=0, P2=1, P5=2 — ToString() produces "P1"/"P2"/"P5" directly,
        // which are the exact BPR column values required by the NDIA payment portal.
        return code.ToString();
    }

    private static string MapClaimType(ClaimType type)
    {
        // Standard → "STAN", Cancellation → "CANC" (PACE bulk payment request format)
        return type == ClaimType.Standard ? "STAN" : "CANC";
    }

    // Format decimal hours as HHH:MM — e.g. 8.5 → "008:30"
    private static string FormatHours(decimal hours)
    {
        var totalMinutes = (int)Math.Round(hours * 60);
        var h = totalMinutes / 60;
        var m = totalMinutes % 60;
        return $"{h:D3}:{m:D2}";
    }

    private static string CsvEscape(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }
}
