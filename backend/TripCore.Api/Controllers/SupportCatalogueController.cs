using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TripCore.Application.Common;
using TripCore.Application.DTOs;
using TripCore.Infrastructure.Data;
using TripCore.Infrastructure.Services;

namespace TripCore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/support-catalogue")]
public class SupportCatalogueController : ControllerBase
{
    private readonly TripCoreDbContext _db;
    public SupportCatalogueController(TripCoreDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<SupportActivityGroupDto>>>> GetAll(CancellationToken ct)
    {
        var groups = await _db.SupportActivityGroups
            .Include(g => g.Items.Where(i => i.IsActive))
            .Where(g => g.IsActive)
            .OrderBy(g => g.DisplayName)
            .ToListAsync(ct);

        var result = groups.Select(g => new SupportActivityGroupDto
        {
            Id = g.Id, GroupCode = g.GroupCode, DisplayName = g.DisplayName,
            SupportCategory = g.SupportCategory, IsActive = g.IsActive,
            Items = g.Items.Select(i => new SupportCatalogueItemDto
            {
                Id = i.Id, ItemNumber = i.ItemNumber, Description = i.Description,
                Unit = i.Unit, DayType = i.DayType,
                PriceLimit_Standard = i.PriceLimit_Standard, PriceLimit_1to2 = i.PriceLimit_1to2,
                PriceLimit_1to3 = i.PriceLimit_1to3, PriceLimit_1to4 = i.PriceLimit_1to4,
                PriceLimit_1to5 = i.PriceLimit_1to5,
                CatalogueVersion = i.CatalogueVersion, EffectiveFrom = i.EffectiveFrom, IsActive = i.IsActive
            }).ToList()
        }).ToList();

        return Ok(ApiResponse<List<SupportActivityGroupDto>>.Ok(result));
    }

    [HttpPost("import/preview")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<CatalogueImportPreviewDto>>> PreviewImport(
        IFormFile file, [FromServices] CatalogueImportService importer, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<CatalogueImportPreviewDto>.Fail("No file uploaded."));

        if (!file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
            return BadRequest(ApiResponse<CatalogueImportPreviewDto>.Fail("File must be an .xlsx file."));

        try
        {
            await using var stream = file.OpenReadStream();
            var preview = await importer.PreviewImportAsync(stream, ct);
            return Ok(ApiResponse<CatalogueImportPreviewDto>.Ok(preview));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<CatalogueImportPreviewDto>.Fail(ex.Message));
        }
    }

    [HttpPost("import/confirm")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> ConfirmImport(
        [FromBody] ConfirmCatalogueImportDto dto, [FromServices] CatalogueImportService importer, CancellationToken ct)
    {
        if (dto.Rows.Count == 0)
            return BadRequest(ApiResponse<bool>.Fail("No rows to import."));

        try
        {
            await importer.CommitImportAsync(dto, ct);
            return Ok(ApiResponse<bool>.Ok(true, $"Imported {dto.Rows.Count} items for catalogue version {dto.CatalogueVersion}."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<bool>.Fail(ex.Message));
        }
    }
}
