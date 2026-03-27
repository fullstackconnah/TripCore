using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using TripCore.Application.Services;

namespace TripCore.Infrastructure.Services;

/// <summary>
/// Reads the current tenant from the JWT "tenant_id" claim via IHttpContextAccessor.
/// Registered as Scoped in DI — one instance per HTTP request.
/// </summary>
public sealed class CurrentTenant : ICurrentTenant
{
    public Guid? TenantId { get; }
    public bool IsSuperAdmin { get; }

    public CurrentTenant(IHttpContextAccessor accessor)
    {
        var user = accessor.HttpContext?.User;
        var claim = user?.FindFirst("tenant_id")?.Value;
        TenantId = claim is not null ? Guid.Parse(claim) : null;
        IsSuperAdmin = user?.IsInRole("SuperAdmin") ?? false;
    }
}
