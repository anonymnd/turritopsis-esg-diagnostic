using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Turritopsis.Domain.Entities;

namespace Turritopsis.Infrastructure.Persistence.Configurations;

public class EsgSnapshotConfiguration : IEntityTypeConfiguration<EsgSnapshot>
{
    public void Configure(EntityTypeBuilder<EsgSnapshot> builder)
    {
        builder.Property(s => s.DataJson).HasColumnType("jsonb");
        builder.HasIndex(s => s.CompanyId).IsUnique();

        builder.HasOne(s => s.Company)
            .WithMany()
            .HasForeignKey(s => s.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
