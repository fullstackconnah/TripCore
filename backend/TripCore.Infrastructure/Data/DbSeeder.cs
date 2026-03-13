using Microsoft.EntityFrameworkCore;
using TripCore.Domain.Entities;
using TripCore.Domain.Enums;

namespace TripCore.Infrastructure.Data;

/// <summary>
/// Seeds realistic Australian NDIS sample data for development and demonstration.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(TripCoreDbContext context, CancellationToken ct = default)
    {
        if (await context.Participants.AnyAsync(ct))
            return; // Already seeded

        // ── Staff (5) ────────────────────────────────────────────
        var staff = new List<Staff>
        {
            new() { Id = Guid.Parse("a1000000-0000-0000-0000-000000000001"), FirstName = "Sarah", LastName = "Mitchell", Role = StaffRole.Coordinator, Email = "sarah.mitchell@tripcore.com.au", Mobile = "0412345001", Region = "South East QLD", IsDriverEligible = true, IsFirstAidQualified = true, IsMedicationCompetent = true, IsManualHandlingCompetent = true, IsOvernightEligible = true },
            new() { Id = Guid.Parse("a1000000-0000-0000-0000-000000000002"), FirstName = "James", LastName = "O'Brien", Role = StaffRole.SeniorSupportWorker, Email = "james.obrien@tripcore.com.au", Mobile = "0412345002", Region = "South East QLD", IsDriverEligible = true, IsFirstAidQualified = true, IsMedicationCompetent = true, IsManualHandlingCompetent = true, IsOvernightEligible = true },
            new() { Id = Guid.Parse("a1000000-0000-0000-0000-000000000003"), FirstName = "Emily", LastName = "Nguyen", Role = StaffRole.SupportWorker, Email = "emily.nguyen@tripcore.com.au", Mobile = "0412345003", Region = "Greater Sydney", IsDriverEligible = true, IsFirstAidQualified = true, IsMedicationCompetent = false, IsManualHandlingCompetent = true, IsOvernightEligible = true },
            new() { Id = Guid.Parse("a1000000-0000-0000-0000-000000000004"), FirstName = "Daniel", LastName = "Williams", Role = StaffRole.SupportWorker, Email = "daniel.williams@tripcore.com.au", Mobile = "0412345004", Region = "South East QLD", IsDriverEligible = false, IsFirstAidQualified = true, IsMedicationCompetent = true, IsManualHandlingCompetent = false, IsOvernightEligible = false },
            new() { Id = Guid.Parse("a1000000-0000-0000-0000-000000000005"), FirstName = "Rachel", LastName = "Thompson", Role = StaffRole.TeamLeader, Email = "rachel.thompson@tripcore.com.au", Mobile = "0412345005", Region = "Melbourne Metro", IsDriverEligible = true, IsFirstAidQualified = true, IsMedicationCompetent = true, IsManualHandlingCompetent = true, IsOvernightEligible = true }
        };
        context.Staff.AddRange(staff);

        // ── Users (seeded accounts) ──────────────────────────────
        var users = new List<User>
        {
            new() { Id = Guid.Parse("b1000000-0000-0000-0000-000000000001"), Username = "admin", Email = "admin@tripcore.com.au", PasswordHash = BCryptHash("Admin123!"), FirstName = "System", LastName = "Admin", Role = UserRole.Admin },
            new() { Id = Guid.Parse("b1000000-0000-0000-0000-000000000002"), Username = "sarah.mitchell", Email = "sarah.mitchell@tripcore.com.au", PasswordHash = BCryptHash("Coord123!"), FirstName = "Sarah", LastName = "Mitchell", Role = UserRole.Coordinator, StaffId = staff[0].Id },
            new() { Id = Guid.Parse("b1000000-0000-0000-0000-000000000003"), Username = "james.obrien", Email = "james.obrien@tripcore.com.au", PasswordHash = BCryptHash("Staff123!"), FirstName = "James", LastName = "O'Brien", Role = UserRole.SupportWorker, StaffId = staff[1].Id }
        };
        context.Users.AddRange(users);

        // ── Event Templates (3) ──────────────────────────────────
        var templates = new List<EventTemplate>
        {
            new() { Id = Guid.Parse("c1000000-0000-0000-0000-000000000001"), EventCode = "GCBB", EventName = "Gold Coast Beach Break", DefaultDestination = "Gold Coast, QLD", DefaultRegion = "South East QLD", PreferredTimeOfYear = "March-May, September-November", StandardDurationDays = 5, AccessibilityNotes = "Beach wheelchair available from Surfers Paradise SLSC. Accessible boardwalk at Broadwater Parklands.", FullyModifiedAccommodationNotes = "Fully modified units available at Mermaid Waters complex", WheelchairAccessNotes = "Flat terrain, accessible tram and bus network" },
            new() { Id = Guid.Parse("c1000000-0000-0000-0000-000000000002"), EventCode = "BMA", EventName = "Blue Mountains Adventure", DefaultDestination = "Katoomba, NSW", DefaultRegion = "Greater Sydney", PreferredTimeOfYear = "October-April", StandardDurationDays = 4, AccessibilityNotes = "Some lookouts wheelchair accessible. Scenic Railway has limited wheelchair access.", FullyModifiedAccommodationNotes = "Mountain Heritage Lodge has two fully modified rooms", WheelchairAccessNotes = "Steep terrain — plan carefully for wheelchair users" },
            new() { Id = Guid.Parse("c1000000-0000-0000-0000-000000000003"), EventCode = "MAW", EventName = "Melbourne Arts Weekend", DefaultDestination = "Melbourne, VIC", DefaultRegion = "Melbourne Metro", PreferredTimeOfYear = "Year-round, avoid Jan school holidays", StandardDurationDays = 3, AccessibilityNotes = "Most galleries and museums are fully accessible. Trams have low-floor access.", FullyModifiedAccommodationNotes = "Several CBD hotels with accessible rooms", WheelchairAccessNotes = "Generally flat CBD, excellent public transport accessibility" }
        };
        context.EventTemplates.AddRange(templates);

        // ── Participants (10) ────────────────────────────────────
        var participants = new List<Participant>
        {
            new() { Id = Guid.Parse("d1000000-0000-0000-0000-000000000001"), FirstName = "Liam", LastName = "Johnson", DateOfBirth = new DateOnly(1995, 3, 15), NdisNumber = "430567891", PlanType = PlanType.PlanManaged, Region = "South East QLD", FundingOrganisation = "Maple Plan Management", IsRepeatClient = true, WheelchairRequired = true, IsHighSupport = false, RequiresOvernightSupport = false, SupportRatio = SupportRatio.OneToOne, MobilityNotes = "Manual wheelchair user, independent transfers", EquipmentRequirements = "Standard manual wheelchair", TransportRequirements = "Vehicle with wheelchair ramp", MedicalSummary = "Spinal cord injury L1-L2. Independent with ADLs.", Notes = "Loves the beach. Very social." },
            new() { Id = Guid.Parse("d1000000-0000-0000-0000-000000000002"), FirstName = "Sophie", LastName = "Brown", PreferredName = "Soph", DateOfBirth = new DateOnly(1988, 7, 22), NdisNumber = "430567892", PlanType = PlanType.AgencyManaged, Region = "South East QLD", FundingOrganisation = "NDIA", IsRepeatClient = true, WheelchairRequired = false, IsHighSupport = true, RequiresOvernightSupport = true, HasRestrictivePracticeFlag = true, SupportRatio = SupportRatio.TwoToOne, MobilityNotes = "Ambulant with some support for balance", MedicalSummary = "Acquired brain injury. Epilepsy — breakthrough seizures.", BehaviourRiskSummary = "Can become distressed in loud environments. De-escalation strategies in BSP.", Notes = "Enjoys art and music. Needs structured routine." },
            new() { Id = Guid.Parse("d1000000-0000-0000-0000-000000000003"), FirstName = "Noah", LastName = "Taylor", DateOfBirth = new DateOnly(2001, 11, 5), NdisNumber = "430567893", PlanType = PlanType.SelfManaged, Region = "Greater Sydney", IsRepeatClient = false, WheelchairRequired = false, IsHighSupport = false, RequiresOvernightSupport = false, SupportRatio = SupportRatio.SharedSupport, MobilityNotes = "Fully ambulant", Notes = "First trip with us. Interested in bushwalking." },
            new() { Id = Guid.Parse("d1000000-0000-0000-0000-000000000004"), FirstName = "Olivia", LastName = "Wilson", DateOfBirth = new DateOnly(1992, 1, 30), NdisNumber = "430567894", PlanType = PlanType.PlanManaged, Region = "Melbourne Metro", FundingOrganisation = "MyCareSpace Plan Management", IsRepeatClient = true, WheelchairRequired = true, IsHighSupport = true, RequiresOvernightSupport = true, SupportRatio = SupportRatio.OneToOne, MobilityNotes = "Electric wheelchair. Requires hoist for transfers.", EquipmentRequirements = "Electric wheelchair, ceiling hoist or mobile hoist", TransportRequirements = "Accessible vehicle with tie-down system", MedicalSummary = "Cerebral palsy — quadriplegia. PEG feeding.", Notes = "Loves galleries and live music." },
            new() { Id = Guid.Parse("d1000000-0000-0000-0000-000000000005"), FirstName = "Ethan", LastName = "Davis", DateOfBirth = new DateOnly(1999, 5, 18), NdisNumber = "430567895", PlanType = PlanType.AgencyManaged, Region = "South East QLD", FundingOrganisation = "NDIA", IsRepeatClient = true, WheelchairRequired = false, IsHighSupport = false, RequiresOvernightSupport = false, SupportRatio = SupportRatio.OneToTwo, Notes = "Enjoys outdoor activities. Good swimmer." },
            new() { Id = Guid.Parse("d1000000-0000-0000-0000-000000000006"), FirstName = "Mia", LastName = "Anderson", DateOfBirth = new DateOnly(1997, 9, 12), NdisNumber = "430567896", PlanType = PlanType.PlanManaged, Region = "South East QLD", FundingOrganisation = "My Plan Manager", IsRepeatClient = false, WheelchairRequired = false, IsHighSupport = false, RequiresOvernightSupport = false, SupportRatio = SupportRatio.SharedSupport, Notes = "Quiet personality. Enjoys reading and cooking." },
            new() { Id = Guid.Parse("d1000000-0000-0000-0000-000000000007"), FirstName = "Jack", LastName = "Thomas", DateOfBirth = new DateOnly(1990, 12, 3), NdisNumber = "430567897", PlanType = PlanType.SelfManaged, Region = "Greater Sydney", IsRepeatClient = true, WheelchairRequired = true, IsHighSupport = false, RequiresOvernightSupport = false, SupportRatio = SupportRatio.OneToOne, MobilityNotes = "Manual wheelchair. Independent pusher.", TransportRequirements = "Accessible vehicle", Notes = "Very independent. Likes photography." },
            new() { Id = Guid.Parse("d1000000-0000-0000-0000-000000000008"), FirstName = "Charlotte", LastName = "White", PreferredName = "Charlie", DateOfBirth = new DateOnly(2003, 4, 25), NdisNumber = "430567898", PlanType = PlanType.AgencyManaged, Region = "Melbourne Metro", FundingOrganisation = "NDIA", IsRepeatClient = false, WheelchairRequired = false, IsHighSupport = true, RequiresOvernightSupport = true, HasRestrictivePracticeFlag = true, SupportRatio = SupportRatio.OneToOne, MedicalSummary = "Autism spectrum — level 3. Anxiety disorder.", BehaviourRiskSummary = "Flight risk in unfamiliar environments. Requires 1:1 line-of-sight supervision.", Notes = "Loves animals and nature." },
            new() { Id = Guid.Parse("d1000000-0000-0000-0000-000000000009"), FirstName = "William", LastName = "Martin", DateOfBirth = new DateOnly(1985, 8, 14), NdisNumber = "430567899", PlanType = PlanType.PlanManaged, Region = "South East QLD", FundingOrganisation = "Maple Plan Management", IsRepeatClient = true, WheelchairRequired = false, IsHighSupport = false, RequiresOvernightSupport = false, SupportRatio = SupportRatio.OneToTwo, Notes = "Experienced traveller. Enjoys sports." },
            new() { Id = Guid.Parse("d1000000-0000-0000-0000-000000000010"), FirstName = "Amelia", LastName = "Garcia", DateOfBirth = new DateOnly(1994, 6, 8), NdisNumber = "430567900", PlanType = PlanType.PlanManaged, Region = "Melbourne Metro", FundingOrganisation = "MyCareSpace Plan Management", IsRepeatClient = true, WheelchairRequired = true, IsHighSupport = false, RequiresOvernightSupport = false, SupportRatio = SupportRatio.OneToOne, MobilityNotes = "Electric wheelchair. Independent.", TransportRequirements = "Accessible vehicle with ramp", Notes = "Very social. Enjoys cafes and shopping." }
        };
        context.Participants.AddRange(participants);

        // ── Support Profiles ─────────────────────────────────────
        var supportProfiles = new List<SupportProfile>
        {
            new() { Id = Guid.NewGuid(), ParticipantId = participants[1].Id, CommunicationNotes = "Uses key word signing and some verbal communication. Allow extra processing time.", BehaviourSupportNotes = "BSP in place. Avoid loud/crowded environments. Use visual schedule. De-escalation: quiet space, deep pressure.", RestrictivePracticeDetails = "Environmental restriction — locked doors during sleep. Authorised by NDIS Commission.", MedicationHealthSummary = "Epilepsy medication — Keppra 500mg BD. PRN Midazolam nasal spray for prolonged seizures.", EmergencyConsiderations = "Seizure first aid protocol attached. Ambulance if seizure > 5 min.", TravelSpecificNotes = "Needs own room with staff nearby. Extra transition time between activities.", ReviewDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(3)) },
            new() { Id = Guid.NewGuid(), ParticipantId = participants[3].Id, CommunicationNotes = "Uses AAC device (Proloquo2Go on iPad). Understands verbal communication well.", ManualHandlingNotes = "Requires ceiling hoist or mobile hoist for all transfers. Two-person assist for bed positioning.", MedicationHealthSummary = "Multiple medications — see medication chart. PEG feeding schedule attached.", EmergencyConsiderations = "Autonomic dysreflexia risk — see emergency protocol.", TravelSpecificNotes = "Equipment list attached. Check accommodation has ceiling hoists or book mobile hoist.", ReviewDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(1)) },
            new() { Id = Guid.NewGuid(), ParticipantId = participants[7].Id, CommunicationNotes = "Limited verbal. Uses PECS. Responds well to visual schedules and social stories.", BehaviourSupportNotes = "Runs when anxious — line-of-sight supervision required at all times in community. Social stories prepared before each new environment.", RestrictivePracticeDetails = "Continuous supervision in community settings. GPS tracker watch. Authorised.", EmergencyConsiderations = "If missing — call 000 immediately. Has limited safety awareness around roads and water.", TravelSpecificNotes = "Pre-trip social stories essential. Visit photos of accommodation/activities sent to family 2 weeks prior.", ReviewDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(2)) }
        };
        context.SupportProfiles.AddRange(supportProfiles);

        // ── Contacts ─────────────────────────────────────────────
        var contacts = new List<Contact>
        {
            new() { Id = Guid.Parse("e1000000-0000-0000-0000-000000000001"), FirstName = "Margaret", LastName = "Johnson", RoleRelationship = "Mother", Email = "margaret.johnson@email.com.au", Mobile = "0498765001", Phone = "07 3456 7891", Address = "42 Jacaranda Street", Suburb = "Coorparoo", State = "QLD", Postcode = "4151", PreferredContactMethod = PreferredContactMethod.Mobile },
            new() { Id = Guid.Parse("e1000000-0000-0000-0000-000000000002"), FirstName = "David", LastName = "Brown", RoleRelationship = "Father / Guardian", Email = "david.brown@email.com.au", Mobile = "0498765002", Address = "18 Banksia Avenue", Suburb = "Toowong", State = "QLD", Postcode = "4066", PreferredContactMethod = PreferredContactMethod.Email },
            new() { Id = Guid.Parse("e1000000-0000-0000-0000-000000000003"), FirstName = "Karen", LastName = "Wilson", RoleRelationship = "Support Coordinator", Organisation = "Inclusive Support Solutions", Email = "karen.wilson@iss.com.au", Mobile = "0498765003", PreferredContactMethod = PreferredContactMethod.Email },
            new() { Id = Guid.Parse("e1000000-0000-0000-0000-000000000004"), FirstName = "Robert", LastName = "White", RoleRelationship = "Father", Email = "robert.white@email.com.au", Mobile = "0498765004", Address = "7 Elm Court", Suburb = "Hawthorn", State = "VIC", Postcode = "3122", PreferredContactMethod = PreferredContactMethod.Phone, Phone = "03 9876 5432" },
            new() { Id = Guid.Parse("e1000000-0000-0000-0000-000000000005"), FirstName = "Lisa", LastName = "Thomas", RoleRelationship = "House Manager", Organisation = "Compass Living", Email = "lisa.thomas@compassliving.com.au", Mobile = "0498765005", PreferredContactMethod = PreferredContactMethod.Mobile }
        };
        context.Contacts.AddRange(contacts);

        // ── ParticipantContacts ──────────────────────────────────
        var participantContacts = new List<ParticipantContact>
        {
            new() { ParticipantId = participants[0].Id, ContactId = contacts[0].Id },
            new() { ParticipantId = participants[1].Id, ContactId = contacts[1].Id },
            new() { ParticipantId = participants[3].Id, ContactId = contacts[2].Id },
            new() { ParticipantId = participants[3].Id, ContactId = contacts[3].Id },
            new() { ParticipantId = participants[7].Id, ContactId = contacts[3].Id },
            new() { ParticipantId = participants[6].Id, ContactId = contacts[4].Id }
        };
        context.ParticipantContacts.AddRange(participantContacts);

        // ── Accommodation Properties (4) ─────────────────────────
        var properties = new List<AccommodationProperty>
        {
            new() { Id = Guid.Parse("f1000000-0000-0000-0000-000000000001"), PropertyName = "Mermaid Waters Accessible Villas", ProviderOwner = "Accessible Holidays QLD", Location = "Gold Coast, QLD", Region = "South East QLD", Address = "123 Markeri Street", Suburb = "Mermaid Waters", State = "QLD", Postcode = "4218", ContactPerson = "Jenny Park", Email = "bookings@accessibleholidaysqld.com.au", Phone = "07 5555 1234", IsFullyModified = true, IsWheelchairAccessible = true, BedroomCount = 4, BedCount = 6, MaxCapacity = 8, BeddingConfiguration = "2x king (adjustable), 2x single, 1x double", HoistBathroomNotes = "Ceiling hoists in master and bedroom 2. Roll-in showers both bathrooms.", AccessibilityNotes = "Fully ramped entry, wide doorways, accessible kitchen." },
            new() { Id = Guid.Parse("f1000000-0000-0000-0000-000000000002"), PropertyName = "Mountain Heritage Lodge", ProviderOwner = "Blue Mountains Retreats", Location = "Katoomba, NSW", Region = "Greater Sydney", Address = "45 Great Western Highway", Suburb = "Katoomba", State = "NSW", Postcode = "2780", ContactPerson = "Tom Henderson", Email = "stays@mountainheritage.com.au", Phone = "02 4782 1234", IsFullyModified = false, IsSemiModified = true, IsWheelchairAccessible = true, BedroomCount = 6, BedCount = 10, MaxCapacity = 12, BeddingConfiguration = "3x queen, 4x single, 1x double", AccessibilityNotes = "Ground floor rooms accessible. Upper floor via stairs only." },
            new() { Id = Guid.Parse("f1000000-0000-0000-0000-000000000003"), PropertyName = "CBD Accessible Apartments", ProviderOwner = "Inclusive Stay Melbourne", Location = "Melbourne, VIC", Region = "Melbourne Metro", Address = "200 Spencer Street", Suburb = "Melbourne", State = "VIC", Postcode = "3000", ContactPerson = "Alicia Tran", Email = "reservations@inclusivestay.com.au", Phone = "03 9000 1234", IsFullyModified = true, IsWheelchairAccessible = true, BedroomCount = 3, BedCount = 4, MaxCapacity = 6, BeddingConfiguration = "1x king (adjustable), 2x single, 1x sofa bed", HoistBathroomNotes = "Mobile hoist available. Roll-in shower.", AccessibilityNotes = "Lift access, auto doors, close to Southern Cross Station." },
            new() { Id = Guid.Parse("f1000000-0000-0000-0000-000000000004"), PropertyName = "Surfers Paradise Holiday Unit", ProviderOwner = "GC Stays", Location = "Gold Coast, QLD", Region = "South East QLD", Address = "88 Surfers Paradise Boulevard", Suburb = "Surfers Paradise", State = "QLD", Postcode = "4217", ContactPerson = "Mark Chen", Email = "bookings@gcstays.com.au", Phone = "07 5555 5678", IsFullyModified = false, IsSemiModified = true, IsWheelchairAccessible = false, BedroomCount = 3, BedCount = 5, MaxCapacity = 6, BeddingConfiguration = "1x queen, 2x single, 1x double", AccessibilityNotes = "Step-free entry but narrow bathroom doorway. Not suitable for wheelchair users." }
        };
        context.AccommodationProperties.AddRange(properties);

        // ── Vehicles (2) ─────────────────────────────────────────
        var vehicles = new List<Vehicle>
        {
            new() { Id = Guid.Parse("f2000000-0000-0000-0000-000000000001"), VehicleName = "Toyota HiAce Accessible Van", Registration = "123ABC", VehicleType = VehicleType.AccessibleVan, TotalSeats = 8, WheelchairPositions = 2, RampHoistDetails = "Electric rear ramp, 300kg capacity. Wheelchair tie-down system.", DriverRequirements = "LR licence. Manual handling cert for ramp operation.", IsInternal = true, ServiceDueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(2)), RegistrationDueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(8)) },
            new() { Id = Guid.Parse("f2000000-0000-0000-0000-000000000002"), VehicleName = "Kia Carnival", Registration = "456XYZ", VehicleType = VehicleType.Van, TotalSeats = 8, WheelchairPositions = 0, DriverRequirements = "Standard C licence", IsInternal = true, ServiceDueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(4)), RegistrationDueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(10)) }
        };
        context.Vehicles.AddRange(vehicles);

        // ── Trip Instances (5) ───────────────────────────────────
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var trips = new List<TripInstance>
        {
            new() { Id = Guid.Parse("01000000-0000-0000-0000-000000000001"), TripName = "Gold Coast Beach Break — Autumn 2026", TripCode = "GCBB-2026A", EventTemplateId = templates[0].Id, Destination = "Gold Coast, QLD", Region = "South East QLD", StartDate = today.AddDays(45), DurationDays = 5, Status = TripStatus.OpenForBookings, LeadCoordinatorId = staff[0].Id, MinParticipants = 4, MaxParticipants = 6, RequiredWheelchairCapacity = 2, RequiredBeds = 6, RequiredBedrooms = 4, MinStaffRequired = 3, Notes = "Main autumn trip. Focus on beach and water activities." },
            new() { Id = Guid.Parse("01000000-0000-0000-0000-000000000002"), TripName = "Blue Mountains Adventure — Spring 2026", TripCode = "BMA-2026S", EventTemplateId = templates[1].Id, Destination = "Katoomba, NSW", Region = "Greater Sydney", StartDate = today.AddDays(90), DurationDays = 4, Status = TripStatus.Planning, LeadCoordinatorId = staff[0].Id, MinParticipants = 3, MaxParticipants = 5, RequiredBeds = 5, RequiredBedrooms = 3, MinStaffRequired = 2, Notes = "Nature and adventure focus." },
            new() { Id = Guid.Parse("01000000-0000-0000-0000-000000000003"), TripName = "Melbourne Arts Weekend — June 2026", TripCode = "MAW-2026J", EventTemplateId = templates[2].Id, Destination = "Melbourne, VIC", Region = "Melbourne Metro", StartDate = today.AddDays(120), DurationDays = 3, Status = TripStatus.Draft, LeadCoordinatorId = staff[4].Id, MinParticipants = 2, MaxParticipants = 4, RequiredWheelchairCapacity = 1, RequiredBeds = 4, RequiredBedrooms = 3, MinStaffRequired = 2, Notes = "Arts and culture experience." },
            new() { Id = Guid.Parse("01000000-0000-0000-0000-000000000004"), TripName = "Gold Coast Beach Break — Summer 2025/26", TripCode = "GCBB-2025S", EventTemplateId = templates[0].Id, Destination = "Gold Coast, QLD", Region = "South East QLD", StartDate = today.AddDays(-30), DurationDays = 5, Status = TripStatus.Completed, LeadCoordinatorId = staff[0].Id, MaxParticipants = 6, MinStaffRequired = 3, Notes = "Successfully completed." },
            new() { Id = Guid.Parse("01000000-0000-0000-0000-000000000005"), TripName = "Adelaide Food & Wine", TripCode = "AFW-2026", Destination = "Adelaide, SA", Region = "Adelaide", StartDate = today.AddDays(60), DurationDays = 3, Status = TripStatus.Cancelled, Notes = "Cancelled due to insufficient bookings." }
        };
        context.TripInstances.AddRange(trips);

        // ── Bookings ─────────────────────────────────────────────
        var bookings = new List<ParticipantBooking>
        {
            // Trip 1 — Gold Coast Autumn (OpenForBookings)
            new() { Id = Guid.Parse("02000000-0000-0000-0000-000000000001"), TripInstanceId = trips[0].Id, ParticipantId = participants[0].Id, BookingStatus = BookingStatus.Confirmed, BookingDate = today.AddDays(-20), WheelchairRequired = true, SupportRatioOverride = SupportRatio.OneToOne },
            new() { Id = Guid.Parse("02000000-0000-0000-0000-000000000002"), TripInstanceId = trips[0].Id, ParticipantId = participants[1].Id, BookingStatus = BookingStatus.Confirmed, BookingDate = today.AddDays(-18), HighSupportRequired = true, NightSupportRequired = true, HasRestrictivePracticeFlag = true, SupportRatioOverride = SupportRatio.TwoToOne, RiskSupportNotes = "See BSP. Seizure protocol in place." },
            new() { Id = Guid.Parse("02000000-0000-0000-0000-000000000003"), TripInstanceId = trips[0].Id, ParticipantId = participants[4].Id, BookingStatus = BookingStatus.Confirmed, BookingDate = today.AddDays(-15) },
            new() { Id = Guid.Parse("02000000-0000-0000-0000-000000000004"), TripInstanceId = trips[0].Id, ParticipantId = participants[5].Id, BookingStatus = BookingStatus.Held, BookingDate = today.AddDays(-10), BookingNotes = "Awaiting OOC payment confirmation" },
            new() { Id = Guid.Parse("02000000-0000-0000-0000-000000000005"), TripInstanceId = trips[0].Id, ParticipantId = participants[8].Id, BookingStatus = BookingStatus.Waitlist, BookingDate = today.AddDays(-5) },

            // Trip 2 — Blue Mountains (Planning)
            new() { Id = Guid.Parse("02000000-0000-0000-0000-000000000006"), TripInstanceId = trips[1].Id, ParticipantId = participants[2].Id, BookingStatus = BookingStatus.Enquiry, BookingDate = today.AddDays(-7) },
            new() { Id = Guid.Parse("02000000-0000-0000-0000-000000000007"), TripInstanceId = trips[1].Id, ParticipantId = participants[6].Id, BookingStatus = BookingStatus.Enquiry, BookingDate = today.AddDays(-3), WheelchairRequired = true },

            // Trip 3 — Melbourne Arts (Draft)
            new() { Id = Guid.Parse("02000000-0000-0000-0000-000000000008"), TripInstanceId = trips[2].Id, ParticipantId = participants[3].Id, BookingStatus = BookingStatus.Enquiry, BookingDate = today, WheelchairRequired = true, HighSupportRequired = true, NightSupportRequired = true },
            new() { Id = Guid.Parse("02000000-0000-0000-0000-000000000009"), TripInstanceId = trips[2].Id, ParticipantId = participants[9].Id, BookingStatus = BookingStatus.Enquiry, BookingDate = today, WheelchairRequired = true },

            // Trip 4 — Completed
            new() { Id = Guid.Parse("02000000-0000-0000-0000-000000000010"), TripInstanceId = trips[3].Id, ParticipantId = participants[0].Id, BookingStatus = BookingStatus.Completed, BookingDate = today.AddDays(-60), WheelchairRequired = true },
            new() { Id = Guid.Parse("02000000-0000-0000-0000-000000000011"), TripInstanceId = trips[3].Id, ParticipantId = participants[4].Id, BookingStatus = BookingStatus.Completed, BookingDate = today.AddDays(-55) },
            new() { Id = Guid.Parse("02000000-0000-0000-0000-000000000012"), TripInstanceId = trips[3].Id, ParticipantId = participants[8].Id, BookingStatus = BookingStatus.Completed, BookingDate = today.AddDays(-50) }
        };
        context.ParticipantBookings.AddRange(bookings);

        // ── Accommodation Reservations ───────────────────────────
        var reservations = new List<AccommodationReservation>
        {
            new() { Id = Guid.Parse("03000000-0000-0000-0000-000000000001"), TripInstanceId = trips[0].Id, AccommodationPropertyId = properties[0].Id, CheckInDate = trips[0].StartDate, CheckOutDate = trips[0].StartDate.AddDays(trips[0].DurationDays), ReservationStatus = ReservationStatus.Confirmed, ConfirmationReference = "AHQ-2026-0451", DateBooked = today.AddDays(-15), DateConfirmed = today.AddDays(-10), BedroomsReserved = 4, BedsReserved = 6, Cost = 2800.00m, Comments = "Full villa booked. Confirmed ceiling hoist in master bedroom." },
            new() { Id = Guid.Parse("03000000-0000-0000-0000-000000000002"), TripInstanceId = trips[1].Id, AccommodationPropertyId = properties[1].Id, CheckInDate = trips[1].StartDate, CheckOutDate = trips[1].StartDate.AddDays(trips[1].DurationDays), ReservationStatus = ReservationStatus.Requested, RequestSentDate = today.AddDays(-5), BedroomsReserved = 3, BedsReserved = 5, Comments = "Awaiting confirmation from Mountain Heritage." }
        };
        context.AccommodationReservations.AddRange(reservations);

        // ── Vehicle Assignments ──────────────────────────────────
        var vehicleAssignments = new List<VehicleAssignment>
        {
            new() { Id = Guid.Parse("04000000-0000-0000-0000-000000000001"), TripInstanceId = trips[0].Id, VehicleId = vehicles[0].Id, Status = VehicleAssignmentStatus.Confirmed, ConfirmedDate = today.AddDays(-10), DriverStaffId = staff[1].Id, SeatRequirement = 6, WheelchairPositionRequirement = 1, PickupTravelNotes = "Pickup from Coorparoo 7:00 AM, then Toowong 7:30 AM" },
            new() { Id = Guid.Parse("04000000-0000-0000-0000-000000000002"), TripInstanceId = trips[0].Id, VehicleId = vehicles[1].Id, Status = VehicleAssignmentStatus.Requested, DriverStaffId = staff[2].Id, SeatRequirement = 4 }
        };
        context.VehicleAssignments.AddRange(vehicleAssignments);

        // ── Staff Assignments ────────────────────────────────────
        var staffAssignments = new List<StaffAssignment>
        {
            new() { Id = Guid.Parse("05000000-0000-0000-0000-000000000001"), TripInstanceId = trips[0].Id, StaffId = staff[0].Id, AssignmentRole = "Lead Coordinator", AssignmentStart = trips[0].StartDate, AssignmentEnd = trips[0].StartDate.AddDays(trips[0].DurationDays - 1), Status = AssignmentStatus.Confirmed, SleepoverType = SleepoverType.ActiveNight },
            new() { Id = Guid.Parse("05000000-0000-0000-0000-000000000002"), TripInstanceId = trips[0].Id, StaffId = staff[1].Id, AssignmentRole = "Senior Support / Driver", AssignmentStart = trips[0].StartDate, AssignmentEnd = trips[0].StartDate.AddDays(trips[0].DurationDays - 1), Status = AssignmentStatus.Confirmed, IsDriver = true, SleepoverType = SleepoverType.Sleepover },
            new() { Id = Guid.Parse("05000000-0000-0000-0000-000000000003"), TripInstanceId = trips[0].Id, StaffId = staff[2].Id, AssignmentRole = "Support Worker", AssignmentStart = trips[0].StartDate, AssignmentEnd = trips[0].StartDate.AddDays(trips[0].DurationDays - 1), Status = AssignmentStatus.Proposed, SleepoverType = SleepoverType.Sleepover }
        };
        context.StaffAssignments.AddRange(staffAssignments);

        // ── Staff Availability ───────────────────────────────────
        var staffAvailability = new List<StaffAvailability>
        {
            new() { Id = Guid.NewGuid(), StaffId = staff[0].Id, StartDateTime = trips[0].StartDate.ToDateTime(TimeOnly.MinValue), EndDateTime = trips[0].StartDate.AddDays(trips[0].DurationDays).ToDateTime(TimeOnly.MinValue), AvailabilityType = AvailabilityType.Available, Notes = "Booked for GC trip" },
            new() { Id = Guid.NewGuid(), StaffId = staff[1].Id, StartDateTime = trips[0].StartDate.ToDateTime(TimeOnly.MinValue), EndDateTime = trips[0].StartDate.AddDays(trips[0].DurationDays).ToDateTime(TimeOnly.MinValue), AvailabilityType = AvailabilityType.Available },
            new() { Id = Guid.NewGuid(), StaffId = staff[3].Id, StartDateTime = trips[0].StartDate.ToDateTime(TimeOnly.MinValue), EndDateTime = trips[0].StartDate.AddDays(3).ToDateTime(TimeOnly.MinValue), AvailabilityType = AvailabilityType.Leave, Notes = "Annual leave" }
        };
        context.StaffAvailabilities.AddRange(staffAvailability);

        // ── Activities (20) ──────────────────────────────────────
        var activities = new List<Activity>
        {
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000001"), EventTemplateId = templates[0].Id, ActivityName = "Beach Morning — Surfers Paradise", Category = ActivityCategory.Leisure, Location = "Surfers Paradise Beach", AccessibilityNotes = "Beach wheelchair available", SuitabilityNotes = "All abilities" },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000002"), EventTemplateId = templates[0].Id, ActivityName = "Currumbin Wildlife Sanctuary", Category = ActivityCategory.Sightseeing, Location = "Currumbin", AccessibilityNotes = "Fully wheelchair accessible", SuitabilityNotes = "All abilities. Some animal encounters may not suit sensory sensitivities." },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000003"), EventTemplateId = templates[0].Id, ActivityName = "Broadwater Parklands Picnic", Category = ActivityCategory.Leisure, Location = "Southport", AccessibilityNotes = "Accessible paths and facilities" },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000004"), EventTemplateId = templates[0].Id, ActivityName = "Pacific Fair Shopping", Category = ActivityCategory.Leisure, Location = "Broadbeach", AccessibilityNotes = "Fully accessible shopping centre" },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000005"), EventTemplateId = templates[0].Id, ActivityName = "Gold Coast Aquatic Centre", Category = ActivityCategory.Sport, Location = "Southport", AccessibilityNotes = "Pool hoist available. Accessible change rooms.", SuitabilityNotes = "Swimming ability varies — assess individually" },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000006"), EventTemplateId = templates[1].Id, ActivityName = "Three Sisters Lookout", Category = ActivityCategory.Sightseeing, Location = "Echo Point, Katoomba", AccessibilityNotes = "Main lookout wheelchair accessible", SuitabilityNotes = "All abilities at lookout. Walking tracks require mobility." },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000007"), EventTemplateId = templates[1].Id, ActivityName = "Scenic World", Category = ActivityCategory.Adventure, Location = "Katoomba", AccessibilityNotes = "Skyway and Railway have accessibility limitations. Cableway is accessible.", SuitabilityNotes = "May not suit anxiety/heights" },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000008"), EventTemplateId = templates[1].Id, ActivityName = "Leura Village Walk", Category = ActivityCategory.Leisure, Location = "Leura", AccessibilityNotes = "Footpaths mostly level. Some shops have steps." },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000009"), EventTemplateId = templates[1].Id, ActivityName = "Govetts Leap Lookout", Category = ActivityCategory.Sightseeing, Location = "Blackheath", AccessibilityNotes = "Lookout accessible. Walking tracks are not." },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000010"), EventTemplateId = templates[2].Id, ActivityName = "National Gallery of Victoria", Category = ActivityCategory.Cultural, Location = "Melbourne CBD", AccessibilityNotes = "Fully accessible", SuitabilityNotes = "All abilities. Quiet hours available." },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000011"), EventTemplateId = templates[2].Id, ActivityName = "Melbourne Museum", Category = ActivityCategory.Cultural, Location = "Carlton", AccessibilityNotes = "Fully accessible. Sensory guides available." },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000012"), EventTemplateId = templates[2].Id, ActivityName = "Lygon Street Lunch", Category = ActivityCategory.Dining, Location = "Carlton", AccessibilityNotes = "Most restaurants have step-free access" },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000013"), EventTemplateId = templates[2].Id, ActivityName = "Queen Victoria Market", Category = ActivityCategory.Sightseeing, Location = "Melbourne CBD", AccessibilityNotes = "Outdoor areas accessible. Some indoor sheds have narrow aisles." },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000014"), ActivityName = "Group Dinner Out", Category = ActivityCategory.Dining, Location = "Various", SuitabilityNotes = "Check dietary requirements and sensory environment" },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000015"), ActivityName = "Movie Night In", Category = ActivityCategory.Leisure, Location = "Accommodation", SuitabilityNotes = "All abilities. Good wind-down activity." },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000016"), ActivityName = "Arrival & Settling In", Category = ActivityCategory.Transport, SuitabilityNotes = "Allow extra time for transitions" },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000017"), ActivityName = "Departure & Travel Home", Category = ActivityCategory.Transport },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000018"), ActivityName = "Free Time / Rest", Category = ActivityCategory.Leisure, SuitabilityNotes = "All abilities. Build into every day." },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000019"), ActivityName = "Bowling", Category = ActivityCategory.Sport, AccessibilityNotes = "Most bowling alleys have ramps and lightweight balls", SuitabilityNotes = "All abilities with support" },
            new() { Id = Guid.Parse("06000000-0000-0000-0000-000000000020"), ActivityName = "Local Café Visit", Category = ActivityCategory.Dining, Location = "Various", AccessibilityNotes = "Check accessibility per venue" }
        };
        context.Activities.AddRange(activities);

        // ── Trip Days + Scheduled Activities (Trip 1) ────────────
        var tripDays = new List<TripDay>();
        var scheduledActivities = new List<ScheduledActivity>();
        for (int i = 0; i < trips[0].DurationDays; i++)
        {
            var day = new TripDay
            {
                Id = Guid.Parse($"07000000-0000-0000-0000-00000000000{i + 1}"),
                TripInstanceId = trips[0].Id,
                DayNumber = i + 1,
                Date = trips[0].StartDate.AddDays(i),
                DayTitle = i == 0 ? "Arrival Day" : i == trips[0].DurationDays - 1 ? "Departure Day" : $"Day {i + 1} — {(i == 1 ? "Beach Day" : i == 2 ? "Wildlife & Shopping" : "Pool & Relaxation")}"
            };
            tripDays.Add(day);

            if (i == 0)
            {
                scheduledActivities.Add(new() { Id = Guid.NewGuid(), TripDayId = day.Id, ActivityId = activities[15].Id, Title = "Arrival & Settling In", StartTime = new TimeOnly(10, 0), EndTime = new TimeOnly(14, 0), SortOrder = 1 });
                scheduledActivities.Add(new() { Id = Guid.NewGuid(), TripDayId = day.Id, ActivityId = activities[2].Id, Title = "Broadwater Parklands Picnic", StartTime = new TimeOnly(15, 0), EndTime = new TimeOnly(17, 0), SortOrder = 2 });
                scheduledActivities.Add(new() { Id = Guid.NewGuid(), TripDayId = day.Id, ActivityId = activities[13].Id, Title = "Group Dinner Out", StartTime = new TimeOnly(18, 0), EndTime = new TimeOnly(20, 0), SortOrder = 3 });
            }
            else if (i == 1)
            {
                scheduledActivities.Add(new() { Id = Guid.NewGuid(), TripDayId = day.Id, ActivityId = activities[0].Id, Title = "Beach Morning — Surfers Paradise", StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(12, 0), SortOrder = 1 });
                scheduledActivities.Add(new() { Id = Guid.NewGuid(), TripDayId = day.Id, ActivityId = activities[17].Id, Title = "Free Time / Rest", StartTime = new TimeOnly(12, 30), EndTime = new TimeOnly(14, 0), SortOrder = 2 });
                scheduledActivities.Add(new() { Id = Guid.NewGuid(), TripDayId = day.Id, ActivityId = activities[14].Id, Title = "Movie Night In", StartTime = new TimeOnly(19, 0), EndTime = new TimeOnly(21, 0), SortOrder = 3 });
            }
            else if (i == trips[0].DurationDays - 1)
            {
                scheduledActivities.Add(new() { Id = Guid.NewGuid(), TripDayId = day.Id, ActivityId = activities[16].Id, Title = "Departure & Travel Home", StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(14, 0), SortOrder = 1 });
            }
        }
        context.TripDays.AddRange(tripDays);
        context.ScheduledActivities.AddRange(scheduledActivities);

        // ── Tasks ────────────────────────────────────────────────
        var tasks = new List<BookingTask>
        {
            new() { Id = Guid.Parse("08000000-0000-0000-0000-000000000001"), TripInstanceId = trips[0].Id, TaskType = TaskType.AccommodationConfirmation, Title = "Confirm accommodation booking — Mermaid Waters Villas", OwnerId = staff[0].Id, Priority = TaskPriority.High, DueDate = today.AddDays(-5), Status = TaskItemStatus.Completed, CompletedDate = today.AddDays(-6) },
            new() { Id = Guid.Parse("08000000-0000-0000-0000-000000000002"), TripInstanceId = trips[0].Id, ParticipantBookingId = bookings[1].Id, TaskType = TaskType.RiskReview, Title = "Review BSP and seizure protocol — Sophie Brown", OwnerId = staff[0].Id, Priority = TaskPriority.Urgent, DueDate = today.AddDays(7), Status = TaskItemStatus.InProgress },
            new() { Id = Guid.Parse("08000000-0000-0000-0000-000000000003"), TripInstanceId = trips[0].Id, ParticipantBookingId = bookings[3].Id, TaskType = TaskType.InvoiceOop, Title = "Chase OOC payment — Mia Anderson", OwnerId = staff[0].Id, Priority = TaskPriority.Medium, DueDate = today.AddDays(14), Status = TaskItemStatus.NotStarted },
            new() { Id = Guid.Parse("08000000-0000-0000-0000-000000000004"), TripInstanceId = trips[0].Id, TaskType = TaskType.VehicleConfirmation, Title = "Confirm second vehicle — Kia Carnival", OwnerId = staff[1].Id, Priority = TaskPriority.Medium, DueDate = today.AddDays(21), Status = TaskItemStatus.NotStarted },
            new() { Id = Guid.Parse("08000000-0000-0000-0000-000000000005"), TripInstanceId = trips[0].Id, TaskType = TaskType.StaffingAllocation, Title = "Confirm third staff member for GC trip", OwnerId = staff[0].Id, Priority = TaskPriority.High, DueDate = today.AddDays(14), Status = TaskItemStatus.NotStarted },
            new() { Id = Guid.Parse("08000000-0000-0000-0000-000000000006"), TripInstanceId = trips[0].Id, TaskType = TaskType.MedicationCheck, Title = "Medication chart updated — all confirmed participants", OwnerId = staff[1].Id, Priority = TaskPriority.High, DueDate = today.AddDays(30), Status = TaskItemStatus.NotStarted },
            new() { Id = Guid.Parse("08000000-0000-0000-0000-000000000007"), TripInstanceId = trips[0].Id, TaskType = TaskType.PreDeparture, Title = "Send pre-trip info packs to families", OwnerId = staff[0].Id, Priority = TaskPriority.Medium, DueDate = today.AddDays(35), Status = TaskItemStatus.NotStarted },
            new() { Id = Guid.Parse("08000000-0000-0000-0000-000000000008"), TripInstanceId = trips[1].Id, TaskType = TaskType.AccommodationRequest, Title = "Send accommodation request — Mountain Heritage Lodge", OwnerId = staff[0].Id, Priority = TaskPriority.Medium, DueDate = today.AddDays(10), Status = TaskItemStatus.InProgress },
            // Overdue task for dashboard
            new() { Id = Guid.Parse("08000000-0000-0000-0000-000000000009"), TripInstanceId = trips[0].Id, TaskType = TaskType.FamilyContact, Title = "Contact Sophie's guardian re: trip consent", OwnerId = staff[0].Id, Priority = TaskPriority.High, DueDate = today.AddDays(-3), Status = TaskItemStatus.Overdue }
        };
        context.BookingTasks.AddRange(tasks);

        await context.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Simple BCrypt-compatible hash for seed passwords.
    /// Uses SHA256 as a placeholder — replace with BCrypt in production service.
    /// </summary>
    private static string BCryptHash(string password)
    {
        using var sha = System.Security.Cryptography.SHA256.Create();
        var bytes = sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }
}
