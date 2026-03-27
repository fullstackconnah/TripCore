namespace TripCore.Domain.Enums;

public enum PlanType
{
    SelfManaged,
    PlanManaged,
    AgencyManaged
}

public enum SupportRatio
{
    OneToOne,
    OneToTwo,
    TwoToOne,
    SharedSupport,
    Other,
    OneToThree,
    OneToFour,
    OneToFive
}

public enum PreferredContactMethod
{
    Email,
    Phone,
    Mobile,
    SMS
}

public enum TripStatus
{
    Draft,
    Planning,
    OpenForBookings,
    WaitlistOnly,
    Confirmed,
    InProgress,
    Completed,
    Cancelled,
    Archived
}

public enum BookingStatus
{
    Enquiry,
    Held,
    Confirmed,
    Waitlist,
    Cancelled,
    Completed,
    NoLongerAttending
}

public enum ReservationStatus
{
    Researching,
    Requested,
    Booked,
    Confirmed,
    Cancelled,
    Unavailable
}

public enum VehicleType
{
    Car,
    Van,
    Bus,
    MiniBus,
    AccessibleVan,
    Other
}

public enum VehicleAssignmentStatus
{
    Requested,
    Confirmed,
    Unavailable,
    Cancelled
}

public enum StaffRole
{
    SupportWorker,
    SeniorSupportWorker,
    Coordinator,
    TeamLeader,
    Other
}

public enum AvailabilityType
{
    Available,
    Unavailable,
    Leave,
    Training,
    Preferred,
    Tentative
}

public enum AssignmentStatus
{
    Proposed,
    Confirmed,
    Completed,
    Cancelled
}

public enum ScheduledActivityStatus
{
    Planned,
    Booked,
    Confirmed,
    Completed,
    Cancelled
}

public enum SleepoverType
{
    None,
    ActiveNight,
    PassiveNight,
    Sleepover
}

public enum ActivityCategory
{
    Leisure,
    Dining,
    Transport,
    Sightseeing,
    Adventure,
    Cultural,
    Sport,
    Other
}

public enum TaskType
{
    AccommodationRequest,
    AccommodationConfirmation,
    VehicleRequest,
    VehicleConfirmation,
    ParticipantConfirmation,
    FamilyContact,
    InvoiceOop,
    StaffingAllocation,
    RiskReview,
    MedicationCheck,
    PreDeparture,
    PostTrip,
    InsuranceConfirmation,
    GenerateNdisClaims,
    Other
}

public enum TaskPriority
{
    Low,
    Medium,
    High,
    Urgent
}

public enum TaskItemStatus
{
    NotStarted,
    InProgress,
    Completed,
    Overdue,
    Cancelled
}

public enum DocumentType
{
    ConsentForm,
    RiskAssessment,
    MedicalClearance,
    Invoice,
    TripPack,
    SupportPlan,
    Other
}

public enum UserRole
{
    Admin,
    Coordinator,
    SupportWorker,
    ReadOnly
}

public enum IncidentType
{
    Injury,
    Illness,
    MedicationError,
    BehaviourOfConcern,
    RestrictivePracticeUse,
    PropertyDamage,
    MissingPerson,
    Abuse,
    Neglect,
    Death,
    Other
}

public enum IncidentSeverity
{
    Low,
    Medium,
    High,
    Critical
}

public enum IncidentStatus
{
    Draft,
    Submitted,
    UnderReview,
    Escalated,
    Resolved,
    Closed
}

public enum QscReportingStatus
{
    NotRequired,
    Required,
    ReportedWithin24h,
    ReportedLate,
    Pending
}

public enum InsuranceStatus
{
    None,
    Pending,
    Confirmed,
    Expired,
    Cancelled
}

public enum PaymentStatus
{
    NotInvoiced = 0,
    InvoiceSent = 1,
    Partial     = 2,
    Paid        = 3,
    Overdue     = 4
}

public enum ContactType
{
    General = 0,
    Guardian = 1,
    EmergencyContact = 2,
    PlanManager = 3,
    SupportCoordinator = 4,
    Other = 5
}

public enum TripClaimStatus
{
    Draft = 0,
    Ready = 1,
    Submitted = 2,
    Paid = 3,
    PartiallyPaid = 4,
    Rejected = 5
}

public enum ClaimLineItemStatus
{
    Draft = 0,
    Submitted = 1,
    Paid = 2,
    Rejected = 3
}

public enum ClaimDayType
{
    Weekday = 0,
    Saturday = 1,
    Sunday = 2,
    PublicHoliday = 3
}

public enum ClaimType
{
    Standard = 0,
    Cancellation = 1
}

public enum GSTCode
{
    P1 = 0,
    P2 = 1,
    P5 = 2
}

public enum ClaimStatus
{
    NotClaimed = 0,
    InClaim = 1,
    Submitted = 2,
    Paid = 3,
    Rejected = 4
}

public enum OvernightSupportType
{
    None = 0,
    ActiveNight = 1,
    Sleepover = 2
}
