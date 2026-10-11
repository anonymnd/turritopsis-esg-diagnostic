using Microsoft.EntityFrameworkCore;
using Turritopsis.Domain.Entities;
namespace Turritopsis.Modules.Documents.Infrastructure;
internal sealed class DocumentsDbContext(DbContextOptions<DocumentsDbContext> options) : DbContext(options) {
 public DbSet<Document> Documents => Set<Document>();
 public DbSet<FileBlob> FileBlobs => Set<FileBlob>();
 public override Task<int> SaveChangesAsync(CancellationToken ct=default) {
  if(ChangeTracker.Entries().Any(e => (e.Entity is Turritopsis.Modules.Documents.Domain.EvidenceSnapshot or Turritopsis.Modules.Documents.Domain.EvidenceSnapshotItem) && (e.State==EntityState.Modified || e.State==EntityState.Deleted)))
   throw new InvalidOperationException("Submitted evidence is immutable.");
  return base.SaveChangesAsync(ct);
 }
 protected override void OnModelCreating(ModelBuilder builder) {
 EvidencePersistenceModel.Configure(builder);
 builder.Entity<Document>().ToTable("Documents");
 builder.Entity<FileBlob>().ToTable("FileBlobs");
 builder.Entity<Document>().Property(d=>d.QuestionCode).HasMaxLength(20).IsRequired();
 builder.Entity<Document>().HasIndex(d=>new {d.CompanyId,d.QuestionCode});
 }
}
