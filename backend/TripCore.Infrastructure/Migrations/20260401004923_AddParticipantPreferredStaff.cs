using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TripCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddParticipantPreferredStaff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PreferredStaffId",
                table: "Participants",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EntityType = table.Column<string>(type: "text", nullable: false),
                    EntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<int>(type: "integer", nullable: false),
                    ChangedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ChangedById = table.Column<Guid>(type: "uuid", nullable: true),
                    ChangedByName = table.Column<string>(type: "text", nullable: true),
                    Changes = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Participants_PreferredStaffId",
                table: "Participants",
                column: "PreferredStaffId");

            migrationBuilder.AddForeignKey(
                name: "FK_Participants_Staff_PreferredStaffId",
                table: "Participants",
                column: "PreferredStaffId",
                principalTable: "Staff",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Participants_Staff_PreferredStaffId",
                table: "Participants");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_Participants_PreferredStaffId",
                table: "Participants");

            migrationBuilder.DropColumn(
                name: "PreferredStaffId",
                table: "Participants");
        }
    }
}
