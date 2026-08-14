using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Turritopsis.Domain.Entities;

namespace Turritopsis.Infrastructure.Persistence.Configurations;

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.Property(d => d.QuestionCode).HasMaxLength(20).IsRequired();
        builder.HasIndex(d => new { d.CompanyId, d.QuestionCode });

        builder.HasOne(d => d.Company)
            .WithMany(c => c.Documents)
            .HasForeignKey(d => d.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
