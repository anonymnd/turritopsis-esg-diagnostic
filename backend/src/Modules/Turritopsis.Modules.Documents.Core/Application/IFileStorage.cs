namespace Turritopsis.Application.Abstractions;

// Storage abstraction; the registered implementation stores bytes in PostgreSQL.
public interface IFileStorage
{
    Task<string> SaveAsync(Guid companyId, string fileName, byte[] content, CancellationToken cancellationToken);
    Task DeleteAsync(string storagePath, CancellationToken cancellationToken);
    Task<byte[]?> ReadAsync(string storagePath, CancellationToken cancellationToken);
}
