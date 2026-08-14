using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Turritopsis.Domain.Entities;

namespace Turritopsis.Infrastructure.Persistence.Configurations;

public class DossierConfiguration : IEntityTypeConfiguration<Dossier>
{
    public void Configure(EntityTypeBuilder<Dossier> builder)
    {
        builder.Property(d => d.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(d => d.SnapshotJson).HasColumnType("jsonb");
        builder.HasIndex(d => new { d.CompanyId, d.Status });

        builder.HasOne(d => d.Company)
            .WithMany(c => c.Dossiers)
            .HasForeignKey(d => d.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
