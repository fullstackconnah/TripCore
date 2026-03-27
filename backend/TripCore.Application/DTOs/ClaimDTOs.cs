using System.ComponentModel.DataAnnotations;
using TripCore.Domain.Enums;

namespace TripCore.Application.DTOs;

// ══════════════════════════════════════════════════════════════
// TRIP CLAIM DTOs
// ══════════════════════════════════════════════════════════════

public record TripClaimListDto
{
    public Guid Id { get; init; }
    public Guid TripInstanceId { get; init; }
    public string TripName { get; init; } = string.Empty;
    public TripClaimStatus Status { get; init; }
    public string ClaimReference { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? SubmittedDate { get; init; }
}

public record TripClaimDetailDto : TripClaimListDto
{
    public decimal TotalApprovedAmount { get; init; }
    public Guid? AuthorisedByStaffId { get; init; }
    public string? AuthorisedByStaffName { get; init; }
    public DateTime? PaidDate { get; init; }
    public string? Notes { get; init; }
    public List<ClaimLineItemDto> LineItems { get; init; } = new();
}

public record ClaimLineItemDto
{
    public Guid Id { get; init; }
    public Guid TripClaimId { get; init; }
    public Guid ParticipantBookingId { get; init; }
    public string ParticipantName { get; init; } = string.Empty;
    public string NdisNumber { get; init; } = string.Empty;
    public PlanType PlanType { get; init; }
    public string SupportItemCode { get; init; } = string.Empty;
    public ClaimDayType DayType { get; init; }
    public DateOnly SupportsDeliveredFrom { get; init; }
    public DateOnly SupportsDeliveredTo { get; init; }
    public decimal Hours { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal TotalAmount { get; init; }
    public GSTCode GSTCode { get; init; }
    public ClaimType ClaimType { get; init; }
    public bool ParticipantApproved { get; init; }
    public ClaimLineItemStatus Status { get; init; }
    public string? RejectionReason { get; init; }
    public decimal? PaidAmount { get; init; }
}

public record UpdateClaimDto
{
    public Guid? AuthorisedByStaffId { get; init; }
    [StringLength(2000)]
    public string? Notes { get; init; }
    public TripClaimStatus? Status { get; init; }
}

public record UpdateClaimLineItemDto
{
    public decimal? Hours { get; init; }
    public decimal? UnitPrice { get; init; }
    [StringLength(50)]
    public string? SupportItemCode { get; init; }
    public ClaimType? ClaimType { get; init; }
    public bool? ParticipantApproved { get; init; }
    public ClaimLineItemStatus? Status { get; init; }
    [StringLength(1000)]
    public string? RejectionReason { get; init; }
    public decimal? PaidAmount { get; init; }
}

// ══════════════════════════════════════════════════════════════
// PROVIDER SETTINGS DTOs
// ══════════════════════════════════════════════════════════════

public record ProviderSettingsDto
{
    public Guid Id { get; init; }
    public string RegistrationNumber { get; init; } = string.Empty;
    public string ABN { get; init; } = string.Empty;
    public string OrganisationName { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public bool GSTRegistered { get; init; }
    public bool IsPaceProvider { get; init; }
    public string? BankAccountName { get; init; }
    public string? BSB { get; init; }
    public string? AccountNumber { get; init; }
    public string? InvoiceFooterNotes { get; init; }
}

public record UpsertProviderSettingsDto
{
    [Required, StringLength(20)]
    public string RegistrationNumber { get; init; } = string.Empty;
    [Required, StringLength(20)]
    public string ABN { get; init; } = string.Empty;
    [Required, StringLength(200)]
    public string OrganisationName { get; init; } = string.Empty;
    [Required, StringLength(500)]
    public string Address { get; init; } = string.Empty;
    public bool GSTRegistered { get; init; }
    public bool IsPaceProvider { get; init; }
    [StringLength(200)]
    public string? BankAccountName { get; init; }
    [StringLength(10)]
    public string? BSB { get; init; }
    [StringLength(20)]
    public string? AccountNumber { get; init; }
    [StringLength(2000)]
    public string? InvoiceFooterNotes { get; init; }
}

// ══════════════════════════════════════════════════════════════
// SUPPORT CATALOGUE DTOs
// ══════════════════════════════════════════════════════════════

public record SupportActivityGroupDto
{
    public Guid Id { get; init; }
    public string GroupCode { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public int SupportCategory { get; init; }
    public bool IsActive { get; init; }
    public List<SupportCatalogueItemDto> Items { get; init; } = new();
}

public record SupportCatalogueItemDto
{
    public Guid Id { get; init; }
    public string ItemNumber { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Unit { get; init; } = string.Empty;
    public ClaimDayType DayType { get; init; }
    public decimal PriceLimit_Standard { get; init; }
    public decimal PriceLimit_1to2 { get; init; }
    public decimal PriceLimit_1to3 { get; init; }
    public decimal PriceLimit_1to4 { get; init; }
    public decimal PriceLimit_1to5 { get; init; }
    public string CatalogueVersion { get; init; } = string.Empty;
    public DateOnly EffectiveFrom { get; init; }
    public bool IsActive { get; init; }
}

// ══════════════════════════════════════════════════════════════
// PUBLIC HOLIDAY DTOs
// ══════════════════════════════════════════════════════════════

public record PublicHolidayDto
{
    public Guid Id { get; init; }
    public DateOnly Date { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? State { get; init; }
}

public record CreatePublicHolidayDto
{
    [Required]
    public DateOnly Date { get; init; }
    [Required, StringLength(100)]
    public string Name { get; init; } = string.Empty;
    [StringLength(10)]
    public string? State { get; init; }
}
