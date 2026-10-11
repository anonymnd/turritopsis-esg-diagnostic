namespace Turritopsis.SharedKernel;

public record CompanyMembership(Guid CompanyId, string Role) { public bool CanWrite => Role != "Viewer"; }
public record CompanySummary(Guid Id, string Name, string Sector);
public record EvidenceText(string QuestionCode, string? TextContent);
public record DossierSummary(Guid CompanyId, string Status, int? Score, DateTimeOffset CreatedAt);
public record AuditEntry(Guid Id, Guid? ActorId, Guid? CompanyId, string Action, DateTimeOffset CreatedAt);
public record Account(Guid Id, string Email);
public record AccountCreation(Account? Account, string[] Errors);

public interface ICompanyDirectory {
 Task<CompanyMembership?> FindMembershipAsync(Guid userId, CancellationToken ct);
 Task<IReadOnlyList<CompanySummary>> ListCompaniesAsync(CancellationToken ct);
 Task<IReadOnlyDictionary<Guid,string>> GetNamesAsync(IEnumerable<Guid> companyIds, CancellationToken ct);
}
public interface ICompanyRegistration { Task<Guid> CreateOwnedCompanyAsync(Guid userId, string name, string sector, string? city, CancellationToken ct); }
public interface ISnapshotReader { Task<string> ReadForCompanyAsync(Guid companyId, CancellationToken ct); }
public interface ICompanyEvidenceReader { Task<IReadOnlyList<EvidenceText>> ReadTextAsync(Guid companyId, CancellationToken ct); }
public interface IDossierCompanyReader { Task<Guid?> FindCompanyIdAsync(Guid dossierId, CancellationToken ct); }
public interface IDossierSummaryReader { Task<IReadOnlyList<DossierSummary>> LatestByCompanyAsync(CancellationToken ct); }
public interface IAuditTrail {
 Task WriteAsync(Guid actorId, Guid? companyId, string action, CancellationToken ct);
 Task<IReadOnlyList<AuditEntry>> LatestAsync(CancellationToken ct);
}
public interface IIdentityAccounts {
 Task<Account?> FindByEmailAsync(string email, CancellationToken ct);
 Task<AccountCreation> CreateAsync(string email, string password, CancellationToken ct);
 Task<bool> CheckPasswordAsync(Account account, string password, CancellationToken ct);
 Task<IReadOnlyList<string>> GetRolesAsync(Account account, CancellationToken ct);
 Task<string> CreateResetTokenAsync(Account account, CancellationToken ct);
 Task<string[]> ResetPasswordAsync(Account account, string token, string password, CancellationToken ct);
 Task<bool> AddRoleAsync(Account account, string role, CancellationToken ct);
 Task<bool> RemoveRoleAsync(string email, string role, CancellationToken ct);
 Task<IReadOnlyList<Account>> ListInRoleAsync(string role, CancellationToken ct);
}
public interface ITokenIssuer { (string Token, DateTimeOffset ExpiresAt) Generate(Account account, IReadOnlyList<string> roles); }
public interface IIdentityBootstrap { Task InitializeAsync(string? email, string? password, CancellationToken ct); }
