using Turritopsis.Application.Abstractions;

namespace Turritopsis.Infrastructure.Storage;

// Local-disk implementation for dev. Production should bind IFileStorage
// to an Azure Blob/S3 implementation instead — nothing else in the app
// depends on how files are actually stored.
public class LocalFileStorage : IFileStorage
{
    private readonly string _rootPath;

    public LocalFileStorage(string rootPath)
    {
        _rootPath = rootPath;
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> SaveAsync(Guid companyId, string fileName, byte[] content, CancellationToken cancellationToken)
    {
        var safeName = Path.GetFileName(fileName);
        var relativePath = Path.Combine(companyId.ToString(), $"{Guid.NewGuid()}-{safeName}");
        var fullPath = Path.Combine(_rootPath, relativePath);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        await File.WriteAllBytesAsync(fullPath, content, cancellationToken);
        return relativePath.Replace('\\', '/');
    }

    public Task DeleteAsync(string storagePath, CancellationToken cancellationToken)
    {
        var fullPath = Path.Combine(_rootPath, storagePath.Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
        return Task.CompletedTask;
    }
}
