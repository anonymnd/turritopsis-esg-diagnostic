using Microsoft.EntityFrameworkCore;
using Turritopsis.Domain.Entities;
using Turritopsis.Modules.Reviews.Domain;

namespace Turritopsis.Modules.Reviews.Infrastructure;

public static class ReviewPersistenceModel
{
    public static void ConfigureWorkflow(ModelBuilder builder)
    {
        builder.Entity<Dossier>().Ignore(d => d.DomainEvents);
        builder.Entity<Dossier>().Property(d => d.Version).IsConcurrencyToken();
        var outbox = builder.Entity<ReviewOutboxMessage>();
        outbox.ToTable("ReviewOutboxMessages");
        outbox.Property(m => m.PayloadJson).HasColumnType("jsonb");
        outbox.Property(m => m.LastError).HasMaxLength(200);
        outbox.HasIndex(m => new { m.DossierId, m.AggregateVersion }).IsUnique();
        outbox.HasIndex(m => new { m.ProcessedAt, m.NextAttemptAt, m.LeaseUntil });
    }
}
