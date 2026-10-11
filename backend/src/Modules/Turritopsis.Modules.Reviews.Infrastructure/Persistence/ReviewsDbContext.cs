using Microsoft.EntityFrameworkCore;
using Turritopsis.Domain.Entities;
namespace Turritopsis.Modules.Reviews.Infrastructure;
internal sealed class ReviewsDbContext(DbContextOptions<ReviewsDbContext> options) : DbContext(options)
{
    public DbSet<Turritopsis.Modules.Reviews.Domain.ReviewOutboxMessage> OutboxMessages => Set<Turritopsis.Modules.Reviews.Domain.ReviewOutboxMessage>();
    public DbSet<Dossier> Dossiers => Set<Dossier>();
    public DbSet<DossierNote> DossierNotes => Set<DossierNote>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    protected override void OnModelCreating(ModelBuilder builder)
    {
        ReviewPersistenceModel.ConfigureWorkflow(builder);
        RevisionPersistenceModel.Configure(builder);
        builder.Entity<Dossier>().ToTable("Dossiers");
        builder.Entity<DossierNote>().ToTable("DossierNotes");
        builder.Entity<Certificate>().ToTable("Certificates");
        builder.Entity<Dossier>().Property(d => d.Status).HasConversion<string>().HasMaxLength(20);
        builder.Entity<Dossier>().Property(d => d.SnapshotJson).HasColumnType("jsonb");
        builder.Entity<Dossier>().HasIndex(d => new { d.CompanyId, d.Status });
        builder.Entity<DossierNote>().Property(n => n.Text).HasMaxLength(2000).IsRequired();
        builder.Entity<DossierNote>().HasOne(n => n.Dossier).WithMany(d => d.Notes).HasForeignKey(n => n.DossierId).OnDelete(DeleteBehavior.Cascade);
    }
}
