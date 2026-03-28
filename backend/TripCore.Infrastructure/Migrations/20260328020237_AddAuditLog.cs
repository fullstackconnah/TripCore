using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TripCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_IncidentReports_TripInstances_TripInstanceId",
                table: "IncidentReports");

            migrationBuilder.DropColumn(
                name: "OopPaymentStatus",
                table: "ParticipantBookings");

            migrationBuilder.AddColumn<DateOnly>(
                name: "DriverLicenceExpiryDate",
                table: "Staff",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "FirstAidExpiryDate",
                table: "Staff",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "ManualHandlingExpiryDate",
                table: "Staff",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "MedicationCompetencyExpiryDate",
                table: "Staff",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PaymentStatus",
                table: "ParticipantBookings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "AppSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    QualificationWarningDays = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EntityType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ChangedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ChangedById = table.Column<Guid>(type: "uuid", nullable: true),
                    ChangedByName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Changes = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_ChangedAt",
                table: "AuditLogs",
                column: "ChangedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_EntityType_EntityId",
                table: "AuditLogs",
                columns: new[] { "EntityType", "EntityId" });

            migrationBuilder.AddForeignKey(
                name: "FK_IncidentReports_TripInstances_TripInstanceId",
                table: "IncidentReports",
                column: "TripInstanceId",
                principalTable: "TripInstances",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_IncidentReports_TripInstances_TripInstanceId",
                table: "IncidentReports");

            migrationBuilder.DropTable(
                name: "AppSettings");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "DriverLicenceExpiryDate",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "FirstAidExpiryDate",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "ManualHandlingExpiryDate",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "MedicationCompetencyExpiryDate",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "ParticipantBookings");

            migrationBuilder.AddColumn<string>(
                name: "OopPaymentStatus",
                table: "ParticipantBookings",
                type: "text",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_IncidentReports_TripInstances_TripInstanceId",
                table: "IncidentReports",
                column: "TripInstanceId",
                principalTable: "TripInstances",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
