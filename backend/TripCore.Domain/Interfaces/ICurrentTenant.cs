namespace TripCore.Domain.Interfaces;

/// <summary>
/// Provides the tenant context for the current HTTP request.
/// Resolved from the JWT "tenant_id" claim.
/// SuperAdmin users have TenantId = null and IsSuperAdmin = true.
/// </summary>
public interface ICurrentTenant
{
    /// <summary>The current tenant's Guid, or null for SuperAdmin users.</summary>
    Guid? TenantId { get; }

    /// <summary>True when the authenticated user has the SuperAdmin role.</summary>
    bool IsSuperAdmin { get; }
}
