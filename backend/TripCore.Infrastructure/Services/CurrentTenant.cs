using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using TripCore.Application.Services;

namespace TripCore.Infrastructure.Services;

/// <summary>
/// Reads the current tenant from the JWT "tenant_id" claim via IHttpContextAccessor.
/// When a SuperAdmin sends X-View-As-Tenant header, scopes them to that tenant.
/// Registered as Scoped in DI — one instance per HTTP request.
/// </summary>
public sealed class CurrentTenant : ICurrentTenant
{
    public Guid? TenantId { get; private set; }
    public bool IsSuperAdmin { get; private set; }

    public CurrentTenant(IHttpContextAccessor accessor)
    {
        var user = accessor.HttpContext?.User;
        var claim = user?.FindFirst("tenant_id")?.Value;
        TenantId = Guid.TryParse(claim, out var parsed) ? parsed : null;
        IsSuperAdmin = user?.IsInRole("SuperAdmin") ?? false;

        // SuperAdmin header override: scope to a specific tenant for this request
        if (IsSuperAdmin)
        {
            var header = accessor.HttpContext?.Request.Headers["X-View-As-Tenant"].FirstOrDefault();
            if (Guid.TryParse(header, out var overrideTenant))
            {
                TenantId = overrideTenant;
                IsSuperAdmin = false;
            }
        }
    }
}
