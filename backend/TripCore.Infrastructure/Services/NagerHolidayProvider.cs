using Nager.Date;
using Nager.Date.Models;

namespace TripCore.Infrastructure.Services;

public record HolidayRecord(DateOnly Date, string Name, string[] Counties);

public interface IHolidayProvider
{
    IEnumerable<HolidayRecord> GetHolidays(int year, string countryCode);
}

public class NagerHolidayProvider : IHolidayProvider
{
    public IEnumerable<HolidayRecord> GetHolidays(int year, string countryCode)
    {
        if (!Enum.TryParse<CountryCode>(countryCode, out var code))
            return [];

        return HolidaySystem.GetHolidays(year, code)
            .Select(h => new HolidayRecord(
                DateOnly.FromDateTime(h.Date),
                h.LocalName,
                h.SubdivisionCodes?.ToArray() ?? []
            ));
    }
}
