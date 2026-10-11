using Turritopsis.Modules.Documents.Application;
using Turritopsis.SharedKernel;
namespace Turritopsis.Modules.Documents.Infrastructure;
internal sealed class CompanyEvidenceReader(IDocumentRepository repository) : ICompanyEvidenceReader {
 public async Task<IReadOnlyList<EvidenceText>> ReadTextAsync(Guid id,CancellationToken ct)=>(await repository.ListAsync(id,ct)).Select(d=>new EvidenceText(d.QuestionCode,d.TextContent)).ToList();
}
