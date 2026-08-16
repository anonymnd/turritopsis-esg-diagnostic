using System.Collections.Concurrent;

namespace Turritopsis.Api.Services;

// In-memory only — bounds abuse within a single warm instance, resets on
// redeploy/restart. Fine for this app's traffic; a shared store (Redis)
// would be needed under real multi-instance load.
public class SlidingWindowRateLimiter
{
    private readonly ConcurrentDictionary<string, (DateTimeOffset WindowStart, int Count)> _store = new();

    public bool TryAcquire(string key, int limit, TimeSpan window)
    {
        var now = DateTimeOffset.UtcNow;
        var entry = _store.AddOrUpdate(
            key,
            _ => (now, 1),
            (_, existing) => now - existing.WindowStart > window ? (now, 1) : (existing.WindowStart, existing.Count + 1));

        return entry.Count <= limit;
    }
}
