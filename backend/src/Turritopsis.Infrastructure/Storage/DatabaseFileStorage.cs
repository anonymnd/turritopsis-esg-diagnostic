using Microsoft.EntityFrameworkCore;
using Turritopsis.Application.Abstractions;
using Turritopsis.Domain.Entities;
using Turritopsis.Infrastructure.Persistence;

namespace Turritopsis.Infrastructure.Storage;

// Stores file bytes in Postgres instead of local disk. Render's free-tier
// web service has no persistent disk — anything written to the container
// filesystem is gone after the next deploy — but the database is
// persistent, so this is what actually survives redeploys on the free
// tier. The "storagePath" callers pass around is just the FileBlob's id.
public class DatabaseFileStorage : IFileStorage
{
    private readonly TurritopsisDbContext _db;

    public DatabaseFileStorage(TurritopsisDbContext db)
    {
        _db = db;
    }

    public async Task<string> SaveAsync(Guid companyId, string fileName, byte[] content, CancellationToken cancellationToken)
    {
        var blob = new FileBlob { Id = Guid.NewGuid(), Content = content, CreatedAt = DateTimeOffset.UtcNow };
        _db.FileBlobs.Add(blob);
        await _db.SaveChangesAsync(cancellationToken);
        return blob.Id.ToString();
    }

    public async Task DeleteAsync(string storagePath, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(storagePath, out var id)) return;
        var blob = await _db.FileBlobs.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (blob is null) return;
        _db.FileBlobs.Remove(blob);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<byte[]?> ReadAsync(string storagePath, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(storagePath, out var id)) return null;
        var blob = await _db.FileBlobs.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        return blob?.Content;
    }
}
