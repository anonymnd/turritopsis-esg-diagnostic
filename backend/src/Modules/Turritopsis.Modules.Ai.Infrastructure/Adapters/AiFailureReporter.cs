using Turritopsis.Modules.Ai.Application;
using Microsoft.Extensions.Logging;
namespace Turritopsis.Modules.Ai.Infrastructure;
public sealed class AiFailureReporter(ILogger<AiReviewService> logger) : IAiFailureReporter {
 public void Report(string scope,string exceptionType)=>logger.LogWarning("AI {Scope} review failed ({ExceptionType}); using local heuristic",scope,exceptionType);
}
