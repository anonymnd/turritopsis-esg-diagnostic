using Microsoft.EntityFrameworkCore;
using Turritopsis.Domain.Entities;
namespace Turritopsis.Modules.Reviews.Infrastructure;
public static class RevisionPersistenceModel {
 public static void Configure(ModelBuilder b) {
  b.Entity<DossierRevision>().Ignore(x=>x.IsNew);
  b.Entity<DossierRevision>().ToTable("DossierRevisions");
  b.Entity<DossierRevision>().Property(x=>x.SnapshotJson).HasColumnType("jsonb");
  b.Entity<DossierRevision>().Property(x=>x.Status).HasMaxLength(20);
  b.Entity<DossierRevision>().HasIndex(x=>new {x.DossierId,x.Number}).IsUnique();
  b.Entity<DossierRevision>().HasOne(x=>x.Dossier).WithMany(x=>x.Revisions).HasForeignKey(x=>x.DossierId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<DossierNote>().HasOne<DossierRevision>().WithMany().HasForeignKey(x=>x.RevisionId).OnDelete(DeleteBehavior.Restrict);
 }
}
