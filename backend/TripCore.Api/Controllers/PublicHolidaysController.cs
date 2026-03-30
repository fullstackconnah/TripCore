using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TripCore.Application.Common;
using TripCore.Application.DTOs;
using TripCore.Application.Interfaces;
using TripCore.Domain.Entities;
using TripCore.Infrastructure.Data;

namespace TripCore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/public-holidays")]
public class PublicHolidaysController : ControllerBase
{
    private readonly TripCoreDbContext _db;
    private readonly IPublicHolidaySyncService _syncService;

    public PublicHolidaysController(TripCoreDbContext db, IPublicHolidaySyncService syncService)
    {
        _db = db;
        _syncService = syncService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<PublicHolidayDto>>>> GetAll(
        [FromQuery] int? year, CancellationToken ct)
    {
        var query = _db.PublicHolidays.AsQueryable();
        if (year.HasValue) query = query.Where(h => h.Date.Year == year.Value);

        var items = await query.OrderBy(h => h.Date)
            .Select(h => new PublicHolidayDto { Id = h.Id, Date = h.Date, Name = h.Name, State = h.State })
            .ToListAsync(ct);

        return Ok(ApiResponse<List<PublicHolidayDto>>.Ok(items));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<PublicHolidayDto>>> Create(
        [FromBody] CreatePublicHolidayDto dto, CancellationToken ct)
    {
        var holiday = new PublicHoliday { Id = Guid.NewGuid(), Date = dto.Date, Name = dto.Name, State = dto.State };
        _db.PublicHolidays.Add(holiday);
        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<PublicHolidayDto>.Ok(
            new PublicHolidayDto { Id = holiday.Id, Date = holiday.Date, Name = holiday.Name, State = holiday.State }));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken ct)
    {
        var h = await _db.PublicHolidays.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (h == null) return NotFound(ApiResponse<bool>.Fail("Holiday not found"));
        _db.PublicHolidays.Remove(h);
        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpPost("sync")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<SyncResultDto>>> Sync(
        [FromBody] SyncHolidaysDto dto, CancellationToken ct)
    {
        var fromYear = dto.FromYear ?? DateTime.Now.Year;
        var toYear = dto.ToYear ?? DateTime.Now.Year + 1;

        var result = await _syncService.SyncAsync(fromYear, toYear, ct);

        return Ok(ApiResponse<SyncResultDto>.Ok(new SyncResultDto
        {
            YearsProcessed = result.YearsProcessed,
            HolidaysAdded = result.HolidaysAdded,
            HolidaysUpdated = result.HolidaysUpdated,
            Errors = result.Errors
        }));
    }
}
