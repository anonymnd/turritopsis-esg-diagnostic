using Microsoft.EntityFrameworkCore;
using Turritopsis.Modules.Documents.Domain;
namespace Turritopsis.Modules.Documents.Infrastructure;
public static class EvidencePersistenceModel {
 public static void Configure(ModelBuilder b) {
  b.Entity<EvidenceSnapshot>().ToTable("EvidenceSnapshots");
  b.Entity<EvidenceSnapshot>().HasIndex(x => x.CompanyId);
  b.Entity<EvidenceSnapshotItem>().ToTable("EvidenceSnapshotItems");
  b.Entity<EvidenceSnapshotItem>().Property(x => x.QuestionCode).HasMaxLength(20);
  b.Entity<EvidenceSnapshotItem>().Property(x => x.Sha256).HasMaxLength(64);
  b.Entity<EvidenceSnapshotItem>().HasOne<EvidenceSnapshot>().WithMany().HasForeignKey(x=>x.SnapshotId).OnDelete(DeleteBehavior.Restrict);
 }
}
