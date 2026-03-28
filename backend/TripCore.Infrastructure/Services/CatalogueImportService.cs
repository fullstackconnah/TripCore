using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using TripCore.Application.DTOs;
using TripCore.Domain.Entities;
using TripCore.Domain.Enums;
using TripCore.Infrastructure.Data;

namespace TripCore.Infrastructure.Services;

public class CatalogueImportService
{
    private readonly TripCoreDbContext _db;

    public CatalogueImportService(TripCoreDbContext db) => _db = db;

    // Item number prefixes that identify day type for Category 04 / Reg Group 0125 access items
    // Based on NDIS Support Catalogue 2025-26: 04_102=PH, 04_104=Weekday, 04_105=Sat, 04_106=Sun
    private static readonly Dictionary<string, ClaimDayType> ItemPrefixToDayType = new()
    {
        { "04_104_", ClaimDayType.Weekday },
        { "04_105_", ClaimDayType.Saturday },
        { "04_106_", ClaimDayType.Sunday },
        { "04_102_", ClaimDayType.PublicHoliday }
    };

    /// <summary>
    /// Parses an NDIA support catalogue XLSX stream and returns a preview of what will change.
    /// Does NOT write to the database.
    /// </summary>
    public async Task<CatalogueImportPreviewDto> PreviewImportAsync(Stream xlsxStream, CancellationToken ct = default)
    {
        var rows = ParseXlsx(xlsxStream);
        if (!rows.Any())
            throw new InvalidOperationException(
                "No Category 04 / Registration Group 0125 items found. Ensure you are uploading the NDIS Support Catalogue XLSX.");

        var existingItems = await _db.SupportCatalogueItems
            .Where(i => i.IsActive)
            .ToListAsync(ct);

        var warnings = new List<string>();
        var previewRows = new List<CatalogueImportRowDto>();

        foreach (var row in rows)
        {
            var existing = existingItems.FirstOrDefault(i => i.ItemNumber == row.ItemNumber);
            var isNew = existing == null;
            var priceChanged = existing != null && existing.PriceLimit_Standard != row.PriceLimit_Standard;

            previewRows.Add(row with { IsNew = isNew, PriceChanged = priceChanged });
        }

        // Warn about active items that will be deactivated and not replaced
        var incomingCodes = rows.Select(r => r.ItemNumber).ToHashSet();
        foreach (var existing in existingItems.Where(e => !incomingCodes.Contains(e.ItemNumber)))
            warnings.Add($"Existing item {existing.ItemNumber} ({existing.Description}) is not in the new catalogue and will be deactivated.");

        // Detect version from current financial year
        var now = DateTime.UtcNow;
        var financialYear = now.Month >= 7
            ? $"{now.Year}-{now.Year + 1 - 2000:D2}"
            : $"{now.Year - 1}-{now.Year - 2000:D2}";

        return new CatalogueImportPreviewDto
        {
            DetectedVersion = financialYear,
            ItemsToAdd = previewRows.Count(r => r.IsNew),
            ItemsToDeactivate = existingItems.Count(e => !incomingCodes.Contains(e.ItemNumber)),
            Rows = previewRows,
            Warnings = warnings
        };
    }

    /// <summary>
    /// Commits the import: deactivates old items, inserts new ones.
    /// Call only after the user has reviewed the preview.
    /// </summary>
    public async Task CommitImportAsync(ConfirmCatalogueImportDto dto, CancellationToken ct = default)
    {
        var group = await _db.SupportActivityGroups
            .FirstOrDefaultAsync(g => g.GroupCode == "GRP_COMMUNITY_ACCESS", ct)
            ?? throw new InvalidOperationException("GRP_COMMUNITY_ACCESS activity group not found. Seed data may be missing.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Deactivate all currently active items for this group
        var existing = await _db.SupportCatalogueItems
            .Where(i => i.ActivityGroupId == group.Id && i.IsActive)
            .ToListAsync(ct);

        foreach (var item in existing)
        {
            item.IsActive = false;
            item.EffectiveTo = today;
        }

        // Insert replacement items
        foreach (var row in dto.Rows)
        {
            _db.SupportCatalogueItems.Add(new SupportCatalogueItem
            {
                Id = Guid.NewGuid(),
                ActivityGroupId = group.Id,
                ItemNumber = row.ItemNumber,
                Description = row.Description,
                Unit = "H",
                DayType = row.DayType,
                PriceLimit_Standard = row.PriceLimit_Standard,
                PriceLimit_1to2 = row.PriceLimit_1to2,
                PriceLimit_1to3 = row.PriceLimit_1to3,
                PriceLimit_1to4 = row.PriceLimit_1to4,
                PriceLimit_1to5 = row.PriceLimit_1to5,
                PriceLimit_Remote = 0,
                PriceLimit_VeryRemote = 0,
                CatalogueVersion = dto.CatalogueVersion,
                EffectiveFrom = today,
                IsActive = true
            });
        }

        await _db.SaveChangesAsync(ct);
    }

    private static List<CatalogueImportRowDto> ParseXlsx(Stream stream)
    {
        var results = new List<CatalogueImportRowDto>();

        using var wb = new XLWorkbook(stream);

        // Prefer a sheet named "Support Catalogue" or similar; fall back to first sheet
        var ws = wb.Worksheets.FirstOrDefault(s =>
            s.Name.Contains("Support", StringComparison.OrdinalIgnoreCase) ||
            s.Name.Contains("Catalogue", StringComparison.OrdinalIgnoreCase))
            ?? wb.Worksheets.First();

        // Scan first 10 rows for the header row ("Support Item Number" column)
        int headerRow = 0;
        for (int r = 1; r <= 10; r++)
        {
            var cell = ws.Cell(r, 1).GetString();
            if (cell.Contains("Support Item Number", StringComparison.OrdinalIgnoreCase) ||
                cell.Contains("SupportItemNumber", StringComparison.OrdinalIgnoreCase))
            {
                headerRow = r;
                break;
            }
        }

        if (headerRow == 0)
            return results;

        // Map column headers → column indices
        var headers = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var lastCol = ws.LastColumnUsed()?.ColumnNumber() ?? 30;
        for (int c = 1; c <= lastCol; c++)
        {
            var header = ws.Cell(headerRow, c).GetString().Trim();
            if (!string.IsNullOrWhiteSpace(header) && !headers.ContainsKey(header))
                headers[header] = c;
        }

        int ColIdx(params string[] names)
        {
            foreach (var n in names)
                if (headers.TryGetValue(n, out var idx)) return idx;
            return 0;
        }

        var colItemNumber = ColIdx("Support Item Number", "SupportItemNumber", "Item Number");
        var colDescription = ColIdx("Support Item Name", "SupportItemName", "Item Name", "Description");
        // Real NDIS catalogue uses per-state columns — VIC is the price limit for Victorian providers
        var colVic = ColIdx("VIC", "Vic");

        if (colItemNumber == 0)
            return results;

        var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1000;

        for (int r = headerRow + 1; r <= lastRow; r++)
        {
            var itemNumber = ws.Cell(r, colItemNumber).GetString().Trim();

            // Only Category 04 Registration Group 0125 access items
            if (!itemNumber.StartsWith("04_") || !itemNumber.Contains("_0125_"))
                continue;

            // Skip evening items (04_103) — not a distinct day type in our model
            if (itemNumber.StartsWith("04_103_"))
                continue;

            // Skip items whose prefix doesn't map to a known day type
            var prefixMatch = ItemPrefixToDayType.FirstOrDefault(kv => itemNumber.StartsWith(kv.Key));
            if (prefixMatch.Key == null)
                continue;

            var dayType = prefixMatch.Value;

            decimal Price(int col) => col > 0 &&
                decimal.TryParse(
                    ws.Cell(r, col).GetString().Replace("$", "").Trim(),
                    out var v) ? v : 0m;

            var vicPrice = Price(colVic);
            if (vicPrice == 0)
                continue; // Skip quote-only items with no listed price

            results.Add(new CatalogueImportRowDto
            {
                ItemNumber = itemNumber,
                Description = colDescription > 0 ? ws.Cell(r, colDescription).GetString().Trim() : itemNumber,
                DayType = dayType,
                PriceLimit_Standard = vicPrice,
                PriceLimit_1to2 = vicPrice,
                PriceLimit_1to3 = vicPrice,
                PriceLimit_1to4 = vicPrice,
                PriceLimit_1to5 = vicPrice
            });
        }

        return results;
    }
}
