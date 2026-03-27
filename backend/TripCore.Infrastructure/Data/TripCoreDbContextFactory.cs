using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using TripCore.Application.Services;

namespace TripCore.Infrastructure.Data;

/// <summary>
/// Design-time factory used by EF Core tooling (dotnet ef migrations add/update).
/// Provides a stub ICurrentTenant so the DbContext can be constructed without
/// the full DI container being available.
/// </summary>
public class TripCoreDbContextFactory : IDesignTimeDbContextFactory<TripCoreDbContext>
{
    public TripCoreDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<TripCoreDbContext>();

        var connectionString =
            Environment.GetEnvironmentVariable("POSTGRES_CONNECTION_STRING")
            ?? "Host=localhost;Port=5432;Database=tripcore;Username=postgres;Password=postgres";

        optionsBuilder.UseNpgsql(connectionString);

        return new TripCoreDbContext(optionsBuilder.Options, new DesignTimeTenant());
    }

    /// <summary>
    /// Stub tenant used only during design-time operations (migrations).
    /// Acts as SuperAdmin so no query filters interfere with schema generation.
    /// </summary>
    private sealed class DesignTimeTenant : ICurrentTenant
    {
        public Guid? TenantId => null;
        public bool IsSuperAdmin => true;
    }
}
