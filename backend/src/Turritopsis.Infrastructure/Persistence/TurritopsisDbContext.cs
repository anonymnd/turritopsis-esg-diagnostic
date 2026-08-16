using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Turritopsis.Domain.Entities;
using Turritopsis.Infrastructure.Identity;

namespace Turritopsis.Infrastructure.Persistence;

public class TurritopsisDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public TurritopsisDbContext(DbContextOptions<TurritopsisDbContext> options) : base(options)
    {
    }

    public DbSet<Company> Companies => Set<Company>();
    public DbSet<CompanyUser> CompanyUsers => Set<CompanyUser>();
    public DbSet<EsgSnapshot> EsgSnapshots => Set<EsgSnapshot>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Dossier> Dossiers => Set<Dossier>();
    public DbSet<DossierNote> DossierNotes => Set<DossierNote>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<FileBlob> FileBlobs => Set<FileBlob>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(TurritopsisDbContext).Assembly);
    }
}
