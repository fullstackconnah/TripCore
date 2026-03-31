using TripCore.Application.Models;

namespace TripCore.Application.Interfaces;

public interface IPublicHolidaySyncService
{
    Task<SyncResult> SyncAsync(int fromYear, int toYear, CancellationToken ct = default);
}
