using Microsoft.EntityFrameworkCore;
using Turritopsis.Domain.Entities;
namespace Turritopsis.Modules.Companies.Infrastructure;
internal sealed class CompaniesDbContext(DbContextOptions<CompaniesDbContext> options) : DbContext(options) {
 public DbSet<Company> Companies => Set<Company>();
 public DbSet<CompanyUser> CompanyUsers => Set<CompanyUser>();
 protected override void OnModelCreating(ModelBuilder builder) {
 builder.Entity<Company>().ToTable("Companies");
 builder.Entity<CompanyUser>().ToTable("CompanyUsers");
 builder.Entity<Company>().Property(c=>c.Name).HasMaxLength(200).IsRequired();
 builder.Entity<Company>().Property(c=>c.Sector).HasMaxLength(120).IsRequired();
 builder.Entity<Company>().Property(c=>c.City).HasMaxLength(120);
 builder.Entity<CompanyUser>().Property(c=>c.Role).HasConversion<string>().HasMaxLength(20);
 builder.Entity<CompanyUser>().HasIndex(c=>new {c.CompanyId,c.UserId}).IsUnique();
 builder.Entity<CompanyUser>().HasOne(c=>c.Company).WithMany(c=>c.Members).HasForeignKey(c=>c.CompanyId).OnDelete(DeleteBehavior.Cascade);
 }
}
