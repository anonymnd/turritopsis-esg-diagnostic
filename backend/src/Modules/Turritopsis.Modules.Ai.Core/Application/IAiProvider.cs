namespace Turritopsis.Modules.Ai.Application;
public interface IAiProvider {
 bool Enabled {get;}
 Task<string> ReviewAsync(IReadOnlyList<SafeQuestionEvidence> evidence,bool dossier,CancellationToken ct);
}
public interface IAiFailureReporter {void Report(string scope,string exceptionType);}
