using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TripCore.Application.DTOs;
using TripCore.Domain.Entities;
using TripCore.Infrastructure.Data;

namespace TripCore.Api.Controllers;

[ApiController]
[Route("api/v1/admin/tenants")]
[Authorize(Roles = "SuperAdmin")]
public class TenantsController : ControllerBase
{
    private readonly TripCoreDbContext _db;

    public TenantsController(TripCoreDbContext db) => _db = db;

    // GET api/v1/admin/tenants
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tenants = await _db.Tenants
            .OrderBy(t => t.Name)
            .Select(t => new TenantDto(t.Id, t.Name, t.EmailDomain, t.IsActive, t.CreatedAt))
            .ToListAsync();
        return Ok(tenants);
    }

    // POST api/v1/admin/tenants
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTenantDto dto)
    {
        if (await _db.Tenants.AnyAsync(t => t.EmailDomain == dto.EmailDomain))
            return Conflict("A tenant with this email domain already exists");

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            EmailDomain = dto.EmailDomain.ToLower(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.Tenants.Add(tenant);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new TenantDto(tenant.Id, tenant.Name, tenant.EmailDomain, tenant.IsActive, tenant.CreatedAt));
    }

    // PUT api/v1/admin/tenants/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTenantDto dto)
    {
        var tenant = await _db.Tenants.FindAsync(id);
        if (tenant is null)
            return NotFound();

        if (tenant.EmailDomain != dto.EmailDomain.ToLower() &&
            await _db.Tenants.AnyAsync(t => t.EmailDomain == dto.EmailDomain.ToLower() && t.Id != id))
            return Conflict("A tenant with this email domain already exists");

        tenant.Name = dto.Name;
        tenant.EmailDomain = dto.EmailDomain.ToLower();
        tenant.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new TenantDto(tenant.Id, tenant.Name, tenant.EmailDomain, tenant.IsActive, tenant.CreatedAt));
    }

    // GET api/v1/admin/tenants/{id}/users
    [HttpGet("{id:guid}/users")]
    public async Task<IActionResult> GetUsers(Guid id)
    {
        var tenant = await _db.Tenants.FindAsync(id);
        if (tenant is null)
            return NotFound();

        var users = await _db.Users
            .IgnoreQueryFilters()
            .Where(u => u.TenantId == id)
            .Select(u => new { u.Id, u.Username, u.FullName, u.Role, u.IsActive })
            .ToListAsync();
        return Ok(users);
    }
}
