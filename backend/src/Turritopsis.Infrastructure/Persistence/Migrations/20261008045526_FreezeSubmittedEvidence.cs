using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Turritopsis.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FreezeSubmittedEvidence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CurrentRevisionId",
                table: "Dossiers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RevisionNumber",
                table: "Dossiers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "RevisionId",
                table: "DossierNotes",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DossierRevisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DossierId = table.Column<Guid>(type: "uuid", nullable: false),
                    Number = table.Column<int>(type: "integer", nullable: false),
                    EvidenceSnapshotId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubmittedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    SubmittedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    SnapshotJson = table.Column<string>(type: "jsonb", nullable: false),
                    DeclaredScore = table.Column<int>(type: "integer", nullable: true),
                    ReviewedScore = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FinalScore = table.Column<int>(type: "integer", nullable: true),
                    Recommendations = table.Column<string>(type: "text", nullable: true),
                    ReviewerId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReviewedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DossierRevisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DossierRevisions_Dossiers_DossierId",
                        column: x => x.DossierId,
                        principalTable: "Dossiers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EvidenceSnapshots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CapturedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    CapturedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvidenceSnapshots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EvidenceSnapshotItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SnapshotId = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginalDocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Label = table.Column<string>(type: "text", nullable: true),
                    TextContent = table.Column<string>(type: "text", nullable: true),
                    FileName = table.Column<string>(type: "text", nullable: true),
                    UploadedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Sha256 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Content = table.Column<byte[]>(type: "bytea", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvidenceSnapshotItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvidenceSnapshotItems_EvidenceSnapshots_SnapshotId",
                        column: x => x.SnapshotId,
                        principalTable: "EvidenceSnapshots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DossierNotes_RevisionId",
                table: "DossierNotes",
                column: "RevisionId");

            migrationBuilder.CreateIndex(
                name: "IX_DossierRevisions_DossierId_Number",
                table: "DossierRevisions",
                columns: new[] { "DossierId", "Number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EvidenceSnapshotItems_SnapshotId",
                table: "EvidenceSnapshotItems",
                column: "SnapshotId");

            migrationBuilder.CreateIndex(
                name: "IX_EvidenceSnapshots_CompanyId",
                table: "EvidenceSnapshots",
                column: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_DossierNotes_DossierRevisions_RevisionId",
                table: "DossierNotes",
                column: "RevisionId",
                principalTable: "DossierRevisions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DossierNotes_DossierRevisions_RevisionId",
                table: "DossierNotes");

            migrationBuilder.DropTable(
                name: "DossierRevisions");

            migrationBuilder.DropTable(
                name: "EvidenceSnapshotItems");

            migrationBuilder.DropTable(
                name: "EvidenceSnapshots");

            migrationBuilder.DropIndex(
                name: "IX_DossierNotes_RevisionId",
                table: "DossierNotes");

            migrationBuilder.DropColumn(
                name: "CurrentRevisionId",
                table: "Dossiers");

            migrationBuilder.DropColumn(
                name: "RevisionNumber",
                table: "Dossiers");

            migrationBuilder.DropColumn(
                name: "RevisionId",
                table: "DossierNotes");
        }
    }
}
