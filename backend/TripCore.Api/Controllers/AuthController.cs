using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TripCore.Application.Common;
using TripCore.Application.DTOs;
using Microsoft.AspNetCore.RateLimiting;
using TripCore.Infrastructure.Data;

namespace TripCore.Api.Controllers;

/// <summary>
/// Authentication endpoints for JWT token management.
/// </summary>
[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly TripCoreDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(TripCoreDbContext db, IConfiguration config, ILogger<AuthController> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Authenticate and receive a JWT token.
    /// </summary>
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginDto dto, CancellationToken ct)
    {
        // 1. Resolve tenant from email domain
        var domain = dto.Email.Contains('@')
            ? dto.Email.Split('@').Last().ToLower()
            : string.Empty;

        // SuperAdmin bypass: @tripcore.com.au users skip tenant resolution entirely
        if (domain == "tripcore.com.au")
        {
            var superAdminUser = await _db.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Username == dto.Username
                                          && u.IsActive, ct);

            if (superAdminUser == null || !VerifyPassword(dto.Password, superAdminUser.PasswordHash))
            {
                _logger.LogWarning("Failed SuperAdmin login attempt for username: {Username}", dto.Username);
                return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Invalid username or password"));
            }

            superAdminUser.LastLoginAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            var superAdminToken = GenerateSuperAdminJwtToken(superAdminUser);
            var superAdminResponse = new AuthResponseDto
            {
                Token = superAdminToken,
                ExpiresAt = DateTime.UtcNow.AddHours(8),
                Username = superAdminUser.Username,
                FullName = $"{superAdminUser.FirstName} {superAdminUser.LastName}",
                Role = "SuperAdmin",
                TenantName = null,
                TenantId = null
            };

            return Ok(ApiResponse<AuthResponseDto>.Ok(superAdminResponse));
        }

        var tenant = await _db.Tenants
            .FirstOrDefaultAsync(t => t.EmailDomain == domain && t.IsActive, ct);

        if (tenant is null)
        {
            _logger.LogWarning("Failed login attempt — unknown email domain: {Domain}", domain);
            return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Invalid username or password"));
        }

        // 2. Resolve user within that tenant (bypass query filter; not authenticated yet)
        var user = await _db.Users
            .IgnoreQueryFilters()
            .Include(u => u.Staff)
            .FirstOrDefaultAsync(u => u.Username == dto.Username
                                      && u.TenantId == tenant.Id
                                      && u.IsActive, ct);

        if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt for username: {Username}", dto.Username);
            return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Invalid username or password"));
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var token = GenerateJwtToken(user, tenant.Id);
        var response = new AuthResponseDto
        {
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(8),
            Username = user.Username,
            FullName = $"{user.FirstName} {user.LastName}",
            Role = user.Role.ToString(),
            TenantName = tenant.Name,
            TenantId = tenant.Id
        };

        return Ok(ApiResponse<AuthResponseDto>.Ok(response));
    }

    /// <summary>
    /// Refresh an existing JWT token.
    /// </summary>
    [HttpPost("refresh")]
    public ActionResult<ApiResponse<AuthResponseDto>> Refresh()
    {
        // Simplified refresh — in production, validate refresh token from DB
        return Ok(ApiResponse<AuthResponseDto>.Fail("Refresh not yet implemented"));
    }

    private string GenerateJwtToken(Domain.Entities.User user, Guid tenantId)
    {
        var secret = _config["Jwt:Secret"]
            ?? Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? throw new InvalidOperationException("JWT secret not configured");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("fullName", $"{user.FirstName} {user.LastName}"),
            new Claim("tenant_id", tenantId.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: "TripCore",
            audience: "TripCore",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateSuperAdminJwtToken(Domain.Entities.User user)
    {
        var secret = _config["Jwt:Secret"]
            ?? Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? throw new InvalidOperationException("JWT secret not configured");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // SuperAdmin tokens have Role=SuperAdmin and no tenant_id claim
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, "SuperAdmin"),
            new Claim("fullName", $"{user.FirstName} {user.LastName}")
        };

        var token = new JwtSecurityToken(
            issuer: "TripCore",
            audience: "TripCore",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
