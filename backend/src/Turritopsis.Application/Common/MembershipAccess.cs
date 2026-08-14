namespace Turritopsis.Application.Common;

// Shared outcome shape for any company-scoped operation: distinguishes "no
// membership row" (403) from "not configured yet" (404) from success, so
// every feature service (snapshot, documents, dossiers) reports the same way.
public enum MembershipAccess
{
    Granted,
    Forbidden,
    NotFound
}
