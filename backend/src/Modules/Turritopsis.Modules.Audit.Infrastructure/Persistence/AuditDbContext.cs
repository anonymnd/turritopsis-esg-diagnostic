using Microsoft.EntityFrameworkCore;
using Turritopsis.Domain.Entities;
namespace Turritopsis.Modules.Audit.Infrastructure;
internal sealed class AuditDbContext(DbContextOptions<AuditDbContext> options) : DbContext(options)
{
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    protected override void OnModelCreating(ModelBuilder builder)
    {
        AuditPersistenceModel.ConfigureNotifications(builder);
        builder.Entity<AuditLog>().ToTable("AuditLogs");
        builder.Entity<AuditLog>().Property(a => a.Action).HasMaxLength(80).IsRequired();
        builder.Entity<AuditLog>().Property(a => a.DetailsJson).HasColumnType("jsonb");
        builder.Entity<AuditLog>().HasIndex(a => a.CreatedAt);
    }
}
