namespace TripCore.Domain.Interfaces;

/// <summary>
/// Marks a root aggregate entity as tenant-scoped.
/// TripCoreDbContext.SaveChangesAsync auto-populates TenantId from ICurrentTenant.
/// </summary>
public interface ITenantEntity
{
    Guid TenantId { get; set; }
}
