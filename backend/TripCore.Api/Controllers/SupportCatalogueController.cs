using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TripCore.Application.Common;
using TripCore.Application.DTOs;
using TripCore.Infrastructure.Data;

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
}
