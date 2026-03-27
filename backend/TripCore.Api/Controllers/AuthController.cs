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
        var user = await _db.Users.Include(u => u.Staff)
            .FirstOrDefaultAsync(u => u.Username == dto.Username && u.IsActive, ct);

        if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt for username: {Username}", dto.Username);
            return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Invalid username or password"));
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var token = GenerateJwtToken(user);
        var response = new AuthResponseDto
        {
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(8),
            Username = user.Username,
            FullName = $"{user.FirstName} {user.LastName}",
            Role = user.Role.ToString()
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

    private string GenerateJwtToken(Domain.Entities.User user)
    {
        var secret = _config["Jwt:Secret"];
        if (string.IsNullOrWhiteSpace(secret) || secret.StartsWith("CHANGE-ME"))
            secret = Environment.GetEnvironmentVariable("JWT_SECRET");
        if (string.IsNullOrWhiteSpace(secret) || secret.StartsWith("CHANGE-ME"))
            secret = "TripCore-Dev-Only-Secret-Min32Characters!!";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
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
