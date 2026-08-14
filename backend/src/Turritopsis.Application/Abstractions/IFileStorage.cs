namespace Turritopsis.Application.Abstractions;

// Abstracted so local dev can write to disk while production swaps in
// Azure Blob/S3 without touching any caller — see docs/rewrite/02.
public interface IFileStorage
{
    Task<string> SaveAsync(Guid companyId, string fileName, byte[] content, CancellationToken cancellationToken);
    Task DeleteAsync(string storagePath, CancellationToken cancellationToken);
}
