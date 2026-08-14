using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Turritopsis.Domain.Entities;

namespace Turritopsis.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.Property(a => a.Action).HasMaxLength(80).IsRequired();
        builder.Property(a => a.DetailsJson).HasColumnType("jsonb");
        builder.HasIndex(a => a.CreatedAt);
    }
}
