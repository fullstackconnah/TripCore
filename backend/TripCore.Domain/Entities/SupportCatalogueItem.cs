using TripCore.Domain.Enums;

namespace TripCore.Domain.Entities;

public class SupportCatalogueItem
{
    public Guid Id { get; set; }
    public Guid ActivityGroupId { get; set; }
    public SupportActivityGroup ActivityGroup { get; set; } = null!;

    public string ItemNumber { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Unit { get; set; } = "H";
    public ClaimDayType DayType { get; set; }

    public decimal PriceLimit_Standard { get; set; }
    public decimal PriceLimit_1to2 { get; set; }
    public decimal PriceLimit_1to3 { get; set; }
    public decimal PriceLimit_1to4 { get; set; }
    public decimal PriceLimit_1to5 { get; set; }
    public decimal PriceLimit_Remote { get; set; }
    public decimal PriceLimit_VeryRemote { get; set; }

    public string CatalogueVersion { get; set; } = string.Empty;
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public bool IsActive { get; set; } = true;
}
