using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TripCore.Application.Common;
using TripCore.Application.DTOs;
using TripCore.Domain.Entities;
using TripCore.Infrastructure.Data;

namespace TripCore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/public-holidays")]
public class PublicHolidaysController : ControllerBase
{
    private readonly TripCoreDbContext _db;
    public PublicHolidaysController(TripCoreDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<PublicHolidayDto>>>> GetAll([FromQuery] int? year, CancellationToken ct)
    {
        var query = _db.PublicHolidays.AsQueryable();
        if (year.HasValue) query = query.Where(h => h.Date.Year == year.Value);

        var items = await query.OrderBy(h => h.Date)
            .Select(h => new PublicHolidayDto { Id = h.Id, Date = h.Date, Name = h.Name, State = h.State })
            .ToListAsync(ct);

        return Ok(ApiResponse<List<PublicHolidayDto>>.Ok(items));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<PublicHolidayDto>>> Create([FromBody] CreatePublicHolidayDto dto, CancellationToken ct)
    {
        var holiday = new PublicHoliday { Id = Guid.NewGuid(), Date = dto.Date, Name = dto.Name, State = dto.State };
        _db.PublicHolidays.Add(holiday);
        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<PublicHolidayDto>.Ok(new PublicHolidayDto { Id = holiday.Id, Date = holiday.Date, Name = holiday.Name, State = holiday.State }));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken ct)
    {
        var h = await _db.PublicHolidays.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (h == null) return NotFound(ApiResponse<bool>.Fail("Holiday not found"));
        _db.PublicHolidays.Remove(h);
        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<bool>.Ok(true));
    }
}
