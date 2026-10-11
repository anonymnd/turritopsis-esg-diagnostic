using Microsoft.EntityFrameworkCore;
using Turritopsis.Domain.Entities;
namespace Turritopsis.Modules.Diagnostics.Infrastructure;
internal sealed class DiagnosticsDbContext(DbContextOptions<DiagnosticsDbContext> options) : DbContext(options) {
 public DbSet<EsgSnapshot> EsgSnapshots => Set<EsgSnapshot>();
 protected override void OnModelCreating(ModelBuilder builder) {
 builder.Entity<EsgSnapshot>().ToTable("EsgSnapshots");
 builder.Entity<EsgSnapshot>().Property(s=>s.DataJson).HasColumnType("jsonb");
 builder.Entity<EsgSnapshot>().HasIndex(s=>s.CompanyId).IsUnique();
 }
}
