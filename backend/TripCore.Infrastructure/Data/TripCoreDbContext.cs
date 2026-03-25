using Microsoft.EntityFrameworkCore;
using TripCore.Domain.Entities;
using TripCore.Domain.Enums;

namespace TripCore.Infrastructure.Data;

/// <summary>
/// Primary database context for TripCore application.
/// Configures all entity relationships, indexes, and constraints.
/// </summary>
public class TripCoreDbContext : DbContext
{
    public TripCoreDbContext(DbContextOptions<TripCoreDbContext> options) : base(options) { }

    public DbSet<Participant> Participants => Set<Participant>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<ParticipantContact> ParticipantContacts => Set<ParticipantContact>();
    public DbSet<SupportProfile> SupportProfiles => Set<SupportProfile>();
    public DbSet<EventTemplate> EventTemplates => Set<EventTemplate>();
    public DbSet<TripInstance> TripInstances => Set<TripInstance>();
    public DbSet<ParticipantBooking> ParticipantBookings => Set<ParticipantBooking>();
    public DbSet<AccommodationProperty> AccommodationProperties => Set<AccommodationProperty>();
    public DbSet<AccommodationReservation> AccommodationReservations => Set<AccommodationReservation>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<VehicleAssignment> VehicleAssignments => Set<VehicleAssignment>();
    public DbSet<Staff> Staff => Set<Staff>();
    public DbSet<StaffAvailability> StaffAvailabilities => Set<StaffAvailability>();
    public DbSet<StaffAssignment> StaffAssignments => Set<StaffAssignment>();
    public DbSet<TripDay> TripDays => Set<TripDay>();
    public DbSet<ScheduledActivity> ScheduledActivities => Set<ScheduledActivity>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<BookingTask> BookingTasks => Set<BookingTask>();
    public DbSet<TripDocument> TripDocuments => Set<TripDocument>();
    public DbSet<User> Users => Set<User>();
    public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Participant ──────────────────────────────────────────
        modelBuilder.Entity<Participant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PreferredName).HasMaxLength(100);
            entity.Property(e => e.NdisNumber).HasMaxLength(20);
            entity.Property(e => e.Region).HasMaxLength(100);
            entity.Property(e => e.FundingOrganisation).HasMaxLength(200);
            entity.Ignore(e => e.FullName);

            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.Region);
            entity.HasIndex(e => e.NdisNumber);
            entity.HasIndex(e => e.SupportRatio);
        });

        // ── Contact ──────────────────────────────────────────────
        modelBuilder.Entity<Contact>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(200);
            entity.Property(e => e.Mobile).HasMaxLength(20);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Organisation).HasMaxLength(200);
            entity.Property(e => e.RoleRelationship).HasMaxLength(100);
            entity.Property(e => e.Suburb).HasMaxLength(100);
            entity.Property(e => e.State).HasMaxLength(10);
            entity.Property(e => e.Postcode).HasMaxLength(10);
            entity.Ignore(e => e.FullName);

            entity.HasIndex(e => e.IsActive);
        });

        // ── ParticipantContact (M:N join) ────────────────────────
        modelBuilder.Entity<ParticipantContact>(entity =>
        {
            entity.HasKey(e => new { e.ParticipantId, e.ContactId });

            entity.HasOne(e => e.Participant)
                .WithMany(p => p.ParticipantContacts)
                .HasForeignKey(e => e.ParticipantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Contact)
                .WithMany(c => c.ParticipantContacts)
                .HasForeignKey(e => e.ContactId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── SupportProfile (1:1 with Participant) ────────────────
        modelBuilder.Entity<SupportProfile>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Participant)
                .WithOne(p => p.SupportProfile)
                .HasForeignKey<SupportProfile>(e => e.ParticipantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.ParticipantId).IsUnique();
        });

        // ── EventTemplate ────────────────────────────────────────
        modelBuilder.Entity<EventTemplate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EventCode).HasMaxLength(20).IsRequired();
            entity.Property(e => e.EventName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.DefaultDestination).HasMaxLength(200);
            entity.Property(e => e.DefaultRegion).HasMaxLength(100);
            entity.Property(e => e.PreferredTimeOfYear).HasMaxLength(100);

            entity.HasIndex(e => e.EventCode).IsUnique();
            entity.HasIndex(e => e.IsActive);
        });

        // ── TripInstance ─────────────────────────────────────────
        modelBuilder.Entity<TripInstance>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TripName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.TripCode).HasMaxLength(20);
            entity.Property(e => e.Destination).HasMaxLength(200);
            entity.Property(e => e.Region).HasMaxLength(100);
            entity.Ignore(e => e.EndDate);
            entity.Ignore(e => e.OopDueDate);

            entity.HasOne(e => e.EventTemplate)
                .WithMany(t => t.TripInstances)
                .HasForeignKey(e => e.EventTemplateId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.LeadCoordinator)
                .WithMany()
                .HasForeignKey(e => e.LeadCoordinatorId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.StartDate);
            entity.HasIndex(e => e.Region);
            entity.HasIndex(e => e.TripCode).IsUnique().HasFilter("\"TripCode\" IS NOT NULL");
        });

        // ── ParticipantBooking ───────────────────────────────────
        modelBuilder.Entity<ParticipantBooking>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.TripInstance)
                .WithMany(t => t.Bookings)
                .HasForeignKey(e => e.TripInstanceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Participant)
                .WithMany(p => p.Bookings)
                .HasForeignKey(e => e.ParticipantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.BookingStatus);
            entity.HasIndex(e => e.InsuranceStatus);
            entity.HasIndex(e => new { e.TripInstanceId, e.ParticipantId }).IsUnique();
        });

        // ── AccommodationProperty ────────────────────────────────
        modelBuilder.Entity<AccommodationProperty>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PropertyName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.ProviderOwner).HasMaxLength(200);
            entity.Property(e => e.Location).HasMaxLength(200);
            entity.Property(e => e.Region).HasMaxLength(100);
            entity.Property(e => e.Suburb).HasMaxLength(100);
            entity.Property(e => e.State).HasMaxLength(10);
            entity.Property(e => e.Postcode).HasMaxLength(10);
            entity.Property(e => e.Email).HasMaxLength(200);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Mobile).HasMaxLength(20);
            entity.Property(e => e.Website).HasMaxLength(300);

            entity.HasIndex(e => e.Region);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.IsWheelchairAccessible);
        });

        // ── AccommodationReservation ─────────────────────────────
        modelBuilder.Entity<AccommodationReservation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Cost).HasPrecision(18, 2);
            entity.Property(e => e.ConfirmationReference).HasMaxLength(100);

            entity.HasOne(e => e.TripInstance)
                .WithMany(t => t.AccommodationReservations)
                .HasForeignKey(e => e.TripInstanceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.AccommodationProperty)
                .WithMany(a => a.Reservations)
                .HasForeignKey(e => e.AccommodationPropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.ReservationStatus);
            entity.HasIndex(e => new { e.AccommodationPropertyId, e.CheckInDate, e.CheckOutDate });
        });

        // ── Vehicle ──────────────────────────────────────────────
        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.VehicleName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Registration).HasMaxLength(20);

            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.VehicleType);
        });

        // ── VehicleAssignment ────────────────────────────────────
        modelBuilder.Entity<VehicleAssignment>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.TripInstance)
                .WithMany(t => t.VehicleAssignments)
                .HasForeignKey(e => e.TripInstanceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Vehicle)
                .WithMany(v => v.Assignments)
                .HasForeignKey(e => e.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DriverStaff)
                .WithMany()
                .HasForeignKey(e => e.DriverStaffId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.Status);
        });

        // ── Staff ────────────────────────────────────────────────
        modelBuilder.Entity<Staff>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(200);
            entity.Property(e => e.Mobile).HasMaxLength(20);
            entity.Property(e => e.Region).HasMaxLength(100);
            entity.Ignore(e => e.FullName);

            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.Role);
            entity.HasIndex(e => e.Region);
        });

        // ── StaffAvailability ────────────────────────────────────
        modelBuilder.Entity<StaffAvailability>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Staff)
                .WithMany(s => s.AvailabilityRecords)
                .HasForeignKey(e => e.StaffId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.StaffId, e.StartDateTime, e.EndDateTime });
            entity.HasIndex(e => e.AvailabilityType);
        });

        // ── StaffAssignment ─────────────────────────────────────
        modelBuilder.Entity<StaffAssignment>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.TripInstance)
                .WithMany(t => t.StaffAssignments)
                .HasForeignKey(e => e.TripInstanceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Staff)
                .WithMany(s => s.Assignments)
                .HasForeignKey(e => e.StaffId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => new { e.StaffId, e.AssignmentStart, e.AssignmentEnd });
        });

        // ── TripDay ──────────────────────────────────────────────
        modelBuilder.Entity<TripDay>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.TripInstance)
                .WithMany(t => t.TripDays)
                .HasForeignKey(e => e.TripInstanceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.TripInstanceId, e.DayNumber }).IsUnique();
        });

        // ── ScheduledActivity ────────────────────────────────────
        modelBuilder.Entity<ScheduledActivity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();

            entity.HasOne(e => e.TripDay)
                .WithMany(d => d.ScheduledActivities)
                .HasForeignKey(e => e.TripDayId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Activity)
                .WithMany(a => a.ScheduledActivities)
                .HasForeignKey(e => e.ActivityId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.SortOrder);
            entity.Property(e => e.Status).HasDefaultValue(ScheduledActivityStatus.Planned);
            entity.Property(e => e.BookingReference).HasMaxLength(200);
            entity.Property(e => e.ProviderName).HasMaxLength(200);
            entity.Property(e => e.ProviderPhone).HasMaxLength(50);
            entity.Property(e => e.ProviderEmail).HasMaxLength(200);
            entity.Property(e => e.ProviderWebsite).HasMaxLength(500);
            entity.Property(e => e.EstimatedCost).HasPrecision(18, 2);
            entity.HasIndex(e => e.Status);
        });

        // ── Activity ─────────────────────────────────────────────
        modelBuilder.Entity<Activity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ActivityName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Location).HasMaxLength(200);

            entity.HasOne(e => e.EventTemplate)
                .WithMany(t => t.Activities)
                .HasForeignKey(e => e.EventTemplateId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.IsActive);
        });

        // ── BookingTask ──────────────────────────────────────────
        modelBuilder.Entity<BookingTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(300).IsRequired();

            entity.HasOne(e => e.TripInstance)
                .WithMany(t => t.Tasks)
                .HasForeignKey(e => e.TripInstanceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ParticipantBooking)
                .WithMany(b => b.Tasks)
                .HasForeignKey(e => e.ParticipantBookingId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.AccommodationReservation)
                .WithMany(r => r.Tasks)
                .HasForeignKey(e => e.AccommodationReservationId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.VehicleAssignment)
                .WithMany(v => v.Tasks)
                .HasForeignKey(e => e.VehicleAssignmentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.StaffAssignment)
                .WithMany(s => s.Tasks)
                .HasForeignKey(e => e.StaffAssignmentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Owner)
                .WithMany()
                .HasForeignKey(e => e.OwnerId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.DueDate);
            entity.HasIndex(e => e.Priority);
            entity.HasIndex(e => e.TaskType);
        });

        // ── TripDocument ─────────────────────────────────────────
        modelBuilder.Entity<TripDocument>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FileName).HasMaxLength(300).IsRequired();
            entity.Property(e => e.FilePath).HasMaxLength(500);

            entity.HasOne(e => e.TripInstance)
                .WithMany(t => t.Documents)
                .HasForeignKey(e => e.TripInstanceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ParticipantBooking)
                .WithMany(b => b.Documents)
                .HasForeignKey(e => e.ParticipantBookingId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.DocumentType);
        });

        // ── IncidentReport ───────────────────────────────────────
        modelBuilder.Entity<IncidentReport>(e =>
        {
            e.HasKey(i => i.Id);
            e.Property(i => i.Title).HasMaxLength(300).IsRequired();

            e.HasOne(i => i.TripInstance).WithMany(t => t.IncidentReports).HasForeignKey(i => i.TripInstanceId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(i => i.InvolvedParticipant).WithMany().HasForeignKey(i => i.InvolvedParticipantId);
            e.HasOne(i => i.InvolvedStaff).WithMany().HasForeignKey(i => i.InvolvedStaffId);
            e.HasOne(i => i.ReportedByStaff).WithMany().HasForeignKey(i => i.ReportedByStaffId);
            e.HasOne(i => i.ReviewedByStaff).WithMany().HasForeignKey(i => i.ReviewedByStaffId);
            e.HasOne(i => i.ParticipantBooking).WithMany().HasForeignKey(i => i.ParticipantBookingId);

            e.HasIndex(i => i.Status);
            e.HasIndex(i => i.Severity);
            e.HasIndex(i => i.QscReportingStatus);
            e.HasIndex(i => i.IsActive);
        });

        // ── User ─────────────────────────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(200).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(500).IsRequired();
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Ignore(e => e.FullName);

            entity.HasOne(e => e.Staff)
                .WithMany()
                .HasForeignKey(e => e.StaffId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.IsActive);
        });
    }
}
