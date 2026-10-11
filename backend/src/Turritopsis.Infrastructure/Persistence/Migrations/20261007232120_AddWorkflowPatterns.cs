using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Turritopsis.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowPatterns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "Version",
                table: "Dossiers",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DossierId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReviewerInbox = table.Column<bool>(type: "boolean", nullable: false),
                    Type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReviewOutboxMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DossierId = table.Column<Guid>(type: "uuid", nullable: false),
                    AggregateVersion = table.Column<long>(type: "bigint", nullable: false),
                    PayloadJson = table.Column<string>(type: "jsonb", nullable: false),
                    OccurredAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    NextAttemptAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Attempts = table.Column<int>(type: "integer", nullable: false),
                    LeaseToken = table.Column<Guid>(type: "uuid", nullable: true),
                    LeaseUntil = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ProcessedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastError = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewOutboxMessages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_CompanyId_ReviewerInbox_CreatedAt",
                table: "Notifications",
                columns: new[] { "CompanyId", "ReviewerInbox", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ReviewOutboxMessages_DossierId_AggregateVersion",
                table: "ReviewOutboxMessages",
                columns: new[] { "DossierId", "AggregateVersion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReviewOutboxMessages_ProcessedAt_NextAttemptAt_LeaseUntil",
                table: "ReviewOutboxMessages",
                columns: new[] { "ProcessedAt", "NextAttemptAt", "LeaseUntil" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "ReviewOutboxMessages");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Dossiers");
        }
    }
}
