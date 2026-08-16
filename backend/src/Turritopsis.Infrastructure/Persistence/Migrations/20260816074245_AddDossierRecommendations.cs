using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Turritopsis.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDossierRecommendations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Recommendations",
                table: "Dossiers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Recommendations",
                table: "Dossiers");
        }
    }
}
