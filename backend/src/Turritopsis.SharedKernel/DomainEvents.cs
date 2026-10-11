namespace Turritopsis.SharedKernel;

// Internal integration data only: no document text, filenames or score details.
public sealed record DomainEvent(Guid Id, string Type, Guid DossierId, Guid CompanyId,
    Guid ActorId, long AggregateVersion, DateTimeOffset OccurredAt);

public interface IDomainEventHandler
{
    bool CanHandle(DomainEvent domainEvent);
    Task HandleAsync(DomainEvent domainEvent, CancellationToken cancellationToken);
}

public interface IDomainEventDispatcher
{
    Task DispatchAsync(DomainEvent domainEvent, CancellationToken cancellationToken);
}

public interface IOutboxProcessor
{
    Task<int> ProcessBatchAsync(int batchSize, CancellationToken cancellationToken);
}
