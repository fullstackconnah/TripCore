using FirebaseAdmin.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TripCore.Application.Common;
using TripCore.Application.DTOs;
using TripCore.Domain.Entities;
using TripCore.Domain.Enums;
using TripCore.Infrastructure.Data;

namespace TripCore.Api.Controllers;

[ApiController]
[Route("api/v1/admin/users")]
[Authorize(Roles = "SuperAdmin")]
public class AdminUsersController : ControllerBase
{
    private readonly TripCoreDbContext _db;

    public AdminUsersController(TripCoreDbContext db) => _db = db;

    // GET api/v1/admin/users?tenantId=&role=&status=&search=&page=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? tenantId,
        [FromQuery] string? role,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _db.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .AsQueryable();

        if (tenantId.HasValue)
            query = query.Where(u => u.TenantId == tenantId.Value);

        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var parsedRole))
            query = query.Where(u => u.Role == parsedRole);

        if (!string.IsNullOrWhiteSpace(status))
        {
            var isActive = status.Equals("active", StringComparison.OrdinalIgnoreCase);
            query = query.Where(u => u.IsActive == isActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(u =>
                u.FirstName.ToLower().Contains(term) ||
                u.LastName.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term) ||
                u.Username.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(ct);

        var users = await query
            .OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto(
                u.Id,
                u.FirstName,
                u.LastName,
                u.FirstName + " " + u.LastName,
                u.Email,
                u.Username,
                u.Role.ToString(),
                u.TenantId,
                u.Tenant != null ? u.Tenant.Name : "",
                u.StaffId,
                u.IsActive,
                u.CreatedAt,
                u.LastLoginAt))
            .ToListAsync(ct);

        var result = new PagedResult<AdminUserDto>
        {
            Items = users,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(ApiResponse<PagedResult<AdminUserDto>>.Ok(result));
    }

    // GET api/v1/admin/users/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var user = await _db.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (user is null)
            return NotFound(ApiResponse<object>.Fail("User not found"));

        var dto = new AdminUserDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.FullName,
            user.Email,
            user.Username,
            user.Role.ToString(),
            user.TenantId,
            user.Tenant?.Name ?? "",
            user.StaffId,
            user.IsActive,
            user.CreatedAt,
            user.LastLoginAt);

        return Ok(ApiResponse<AdminUserDto>.Ok(dto));
    }

    // POST api/v1/admin/users
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAdminUserDto dto, CancellationToken ct)
    {
        // Validate tenant exists
        var tenant = await _db.Tenants.FindAsync([dto.TenantId], ct);
        if (tenant is null)
            return BadRequest(ApiResponse<object>.Fail("Tenant not found"));

        // Validate role
        if (!Enum.TryParse<UserRole>(dto.Role, true, out var role) || role == UserRole.SuperAdmin)
            return BadRequest(ApiResponse<object>.Fail("Invalid role. SuperAdmin cannot be assigned."));

        // Validate email uniqueness across all tenants
        var emailExists = await _db.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower(), ct);
        if (emailExists)
            return Conflict(ApiResponse<object>.Fail("A user with this email already exists"));

        // Validate username uniqueness across all tenants
        var usernameExists = await _db.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Username.ToLower() == dto.Username.ToLower(), ct);
        if (usernameExists)
            return Conflict(ApiResponse<object>.Fail("A user with this username already exists"));

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = dto.TenantId,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            Username = dto.Username,
            Role = role,
            StaffId = dto.StaffId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        // Create Firebase Auth user so they can sign in
        try
        {
            await FirebaseAuth.DefaultInstance.CreateUserAsync(new UserRecordArgs
            {
                Email = dto.Email,
                DisplayName = $"{dto.FirstName} {dto.LastName}",
                Disabled = false,
            }, ct);
        }
        catch (FirebaseAuthException ex) when (ex.AuthErrorCode == AuthErrorCode.EmailAlreadyExists)
        {
            // User already exists in Firebase — that's OK, they'll be able to sign in
        }

        var result = new AdminUserDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.FullName,
            user.Email,
            user.Username,
            user.Role.ToString(),
            user.TenantId,
            tenant.Name,
            user.StaffId,
            user.IsActive,
            user.CreatedAt,
            user.LastLoginAt);

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, ApiResponse<AdminUserDto>.Ok(result));
    }

    // PUT api/v1/admin/users/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAdminUserDto dto, CancellationToken ct)
    {
        var user = await _db.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (user is null)
            return NotFound(ApiResponse<object>.Fail("User not found"));

        // Validate role
        if (!Enum.TryParse<UserRole>(dto.Role, true, out var role) || role == UserRole.SuperAdmin)
            return BadRequest(ApiResponse<object>.Fail("Invalid role. SuperAdmin cannot be assigned."));

        // Validate email uniqueness (excluding current user)
        var emailExists = await _db.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower() && u.Id != id, ct);
        if (emailExists)
            return Conflict(ApiResponse<object>.Fail("A user with this email already exists"));

        // Validate username uniqueness (excluding current user)
        var usernameExists = await _db.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Username.ToLower() == dto.Username.ToLower() && u.Id != id, ct);
        if (usernameExists)
            return Conflict(ApiResponse<object>.Fail("A user with this username already exists"));

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.Email = dto.Email;
        user.Username = dto.Username;
        user.Role = role;
        user.StaffId = dto.StaffId;
        user.IsActive = dto.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        // Sync changes to Firebase Auth
        // NOTE: Email changes are not synced here — Firebase Admin SDK email updates
        // require the user to re-authenticate, so we only sync DisplayName and Disabled.
        try
        {
            var firebaseUser = await FirebaseAuth.DefaultInstance.GetUserByEmailAsync(user.Email, ct);
            await FirebaseAuth.DefaultInstance.UpdateUserAsync(new UserRecordArgs
            {
                Uid = firebaseUser.Uid,
                DisplayName = $"{dto.FirstName} {dto.LastName}",
                Disabled = !dto.IsActive,
            }, ct);
        }
        catch (FirebaseAuthException)
        {
            // Firebase user may not exist if they were created before this feature — skip
        }

        var result = new AdminUserDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.FullName,
            user.Email,
            user.Username,
            user.Role.ToString(),
            user.TenantId,
            user.Tenant?.Name ?? "",
            user.StaffId,
            user.IsActive,
            user.CreatedAt,
            user.LastLoginAt);

        return Ok(ApiResponse<AdminUserDto>.Ok(result));
    }
}
