using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Turritopsis.Domain.Entities;

namespace Turritopsis.Infrastructure.Persistence.Configurations;

public class CompanyUserConfiguration : IEntityTypeConfiguration<CompanyUser>
{
    public void Configure(EntityTypeBuilder<CompanyUser> builder)
    {
        builder.Property(cu => cu.Role).HasConversion<string>().HasMaxLength(20);
        // A user has exactly one role in a given company — matches the
        // membership-check contract every company-scoped endpoint relies on.
        builder.HasIndex(cu => new { cu.CompanyId, cu.UserId }).IsUnique();

        builder.HasOne(cu => cu.Company)
            .WithMany(c => c.Members)
            .HasForeignKey(cu => cu.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
