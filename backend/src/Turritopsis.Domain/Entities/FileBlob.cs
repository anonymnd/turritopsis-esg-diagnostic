namespace Turritopsis.Domain.Entities;

// Raw bytes for an uploaded proof, stored in Postgres so files survive
// redeploys — Render's free-tier disk is wiped on every deploy, but the
// database is persistent. See DatabaseFileStorage.
public class FileBlob
{
    public Guid Id { get; set; }
    public byte[] Content { get; set; } = Array.Empty<byte>();
    public DateTimeOffset CreatedAt { get; set; }
}
