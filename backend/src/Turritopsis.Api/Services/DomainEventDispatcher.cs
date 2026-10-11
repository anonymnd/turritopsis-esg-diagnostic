using Turritopsis.SharedKernel;

namespace Turritopsis.Api.Services;

public sealed class DomainEventDispatcher(IEnumerable<IDomainEventHandler> handlers) : IDomainEventDispatcher
{
    public async Task DispatchAsync(DomainEvent domainEvent, CancellationToken ct)
    {
        var matching = handlers.Where(h => h.CanHandle(domainEvent)).ToArray();
        if (matching.Length == 0) throw new InvalidOperationException("No handler for domain event");
        foreach (var handler in matching) await handler.HandleAsync(domainEvent, ct);
    }
}
