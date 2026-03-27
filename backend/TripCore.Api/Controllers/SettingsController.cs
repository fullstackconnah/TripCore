using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TripCore.Application.Common;
using TripCore.Application.DTOs;
using TripCore.Domain.Entities;
using TripCore.Infrastructure.Data;

namespace TripCore.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Coordinator")]
[Route("api/v1/settings")]
public class SettingsController : ControllerBase
{
    private readonly TripCoreDbContext _db;
    public SettingsController(TripCoreDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<AppSettingsDto>>> Get(CancellationToken ct)
    {
        var s = await _db.AppSettings.FirstOrDefaultAsync(ct);
        return Ok(ApiResponse<AppSettingsDto>.Ok(new AppSettingsDto
        {
            QualificationWarningDays = s?.QualificationWarningDays ?? 30
        }));
    }

    [HttpPut]
    public async Task<ActionResult<ApiResponse<AppSettingsDto>>> Update(
        [FromBody] UpdateAppSettingsDto dto, CancellationToken ct)
    {
        var s = await _db.AppSettings.FirstOrDefaultAsync(ct);
        if (s == null)
        {
            s = new AppSettings { Id = 1, QualificationWarningDays = dto.QualificationWarningDays };
            _db.AppSettings.Add(s);
        }
        else
        {
            s.QualificationWarningDays = dto.QualificationWarningDays;
        }
        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<AppSettingsDto>.Ok(new AppSettingsDto
        {
            QualificationWarningDays = s.QualificationWarningDays
        }));
    }
}
