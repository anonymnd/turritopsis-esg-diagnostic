using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Turritopsis.Domain.Entities;

namespace Turritopsis.Infrastructure.Persistence.Configurations;

public class DossierNoteConfiguration : IEntityTypeConfiguration<DossierNote>
{
    public void Configure(EntityTypeBuilder<DossierNote> builder)
    {
        builder.Property(n => n.Text).HasMaxLength(2000).IsRequired();

        builder.HasOne(n => n.Dossier)
            .WithMany(d => d.Notes)
            .HasForeignKey(n => n.DossierId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
