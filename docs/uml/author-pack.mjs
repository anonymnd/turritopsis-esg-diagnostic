import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(path.join(root, 'sources'), { recursive: true });
const diagrams = [];
function add(id, title, type, scope, description, evidence, body) {
  diagrams.push({ id, title, type, scope, description, evidence });
  const header = `@startuml\n' Turritopsis ESG Diagnostic | repository inspection 2026-10-07\n' Scope: ${scope}\n' Evidence: ${evidence.join('; ')}\nskinparam backgroundColor #FFFFFF\nskinparam defaultFontName Arial\nskinparam defaultFontSize 14\nskinparam shadowing false\nskinparam ArrowColor #30465E\nskinparam packageBackgroundColor #F3F6FA\nskinparam classBackgroundColor #F3F6FA\nskinparam componentBackgroundColor #F3F6FA\nskinparam noteBackgroundColor #FFF5DF\nskinparam noteBorderColor #C79C56\nskinparam sequenceMessageAlign center\nhide empty members\ntitle ${title}\n`;
  fs.writeFileSync(path.join(root, 'sources', `${id}.puml`), header + body.trim() + '\n@enduml\n');
}
const infra = 'backend/src/Turritopsis.Infrastructure/';
const api = 'backend/src/Turritopsis.Api/Controllers/';
const front = 'frontend/src/';
add('01-use-cases', 'Application use cases', 'Use case', 'Application — implemented capabilities',
  'Actors and available actions. Company roles govern writes; platform reviewer/admin roles govern review. Membership provisioning for collaborators/viewers is outside the implemented UI.',
  [front+'app/router.tsx', api+'DossiersController.cs', api+'AdminUsersController.cs', 'backend/src/Modules/Turritopsis.Modules.Documents.Core/Application/DocumentService.cs'], String.raw`
left to right direction
actor Visitor
actor "Company member" as Member
actor "Owner / collaborator" as Writer
actor Viewer
actor Reviewer
actor Admin
Writer --|> Member
Viewer --|> Member
Admin --|> Reviewer
rectangle "Turritopsis ESG Diagnostic — .NET application" {
 usecase "Read public presentation" as Public
 usecase "Register company account" as Register
 usecase "Log in / reset password" as Auth
 usecase "View company, answers,\nproofs and dossier status" as Read
 usecase "Update company profile" as Profile
 usecase "Answer ESG questionnaire" as Answer
 usecase "Upload / delete evidence" as Proof
 usecase "Request question AI advice" as Advice
 usecase "Apply suggested answer" as Apply
 usecase "Submit / resubmit dossier" as Submit
 usecase "View validated report\nand print / save PDF" as Report
 usecase "View review queue / history" as Queue
 usecase "Inspect dossier and proofs" as Inspect
 usecase "Request dossier AI advice" as DAi
 usecase "Add reviewer comment" as Comment
 usecase "Validate / reject with\nscore and recommendations" as Decide
 usecase "View administrative overview" as Overview
 usecase "Create / list reviewers" as Reviewers
 usecase "Remove platform role\n(API capability)" as Revoke
}
Visitor --> Public
Visitor --> Register
Visitor --> Auth
Member --> Read
Member --> Report
Writer --> Profile
Writer --> Answer
Writer --> Proof
Member --> Advice
Writer --> Apply
Writer --> Submit
Reviewer --> Queue
Reviewer --> Inspect
Reviewer --> DAi
Reviewer --> Comment
Reviewer --> Decide
Admin --> Overview
Admin --> Reviewers
Admin --> Revoke
Apply ..> Advice : <<extend>>
DAi ..> Inspect : <<extend>>
note bottom of Submit
 Snapshot may be empty; completeness is not
 enforced by SubmitAsync. Viewer writes denied.
end note
note bottom of Report
 Final report displayed only for Validated.
 Payments/certificates have no application controller.
end note
`);
add('02-domain-classes', 'Domain classes and persisted relationships', 'Class', 'Application — code and EF mappings',
  'Persisted domain entities including Outbox and internal Notifications, Identity user and enums. Solid associations represent configured domain foreign keys; dotted links are identifier references without configured foreign keys.',
  [infra+'Persistence/Configurations/', 'backend/src/Modules/', 'backend/src/Modules/', 'backend/src/Modules/Turritopsis.Modules.Identity.Infrastructure/Adapters/ApplicationUser.cs'], String.raw`
class Company {
 +Id : Guid
 +Name : string
 +Sector : string
 +City : string?
 +Ice : string?
 +EmployeeRange : string?
 +Website : string?
 +Phone : string?
 +ActivityDescription : string?
 +CreatedAt : DateTimeOffset
}
class CompanyUser {
 +Id : Guid
 +CompanyId : Guid
 +UserId : Guid
 +Role : CompanyRole
 +CreatedAt : DateTimeOffset
}
class EsgSnapshot {
 +Id : Guid
 +CompanyId : Guid
 +DataJson : string = "{}"
 +UpdatedAt : DateTimeOffset
}
class Document {
 +Id : Guid
 +CompanyId : Guid
 +QuestionCode : string
 +Label : string?
 +TextContent : string?
 +StoragePath : string?
 +FileName : string?
 +UploadedBy : Guid?
 +CreatedAt : DateTimeOffset
}
class FileBlob {
 +Id : Guid
 +Content : byte[]
 +CreatedAt : DateTimeOffset
}
class Dossier {
 +Id : Guid
 +CompanyId : Guid
 +Status : DossierStatus (private set)
 +Version : long (concurrency token)
 +DeclaredScore : int?
 +ReviewedScore : int?
 +FinalScore : int?
 +Recommendations : string?
 +SnapshotJson : string = "{}"
 +SubmittedBy : Guid?
 +ReviewerId : Guid?
 +SubmittedAt : DateTimeOffset
 +ReviewedAt : DateTimeOffset?
 +UpdatedAt : DateTimeOffset
 +CreatedAt : DateTimeOffset
}
class DossierNote {
 +Id : Guid
 +DossierId : Guid
 +AuthorId : Guid?
 +QuestionCode : string?
 +Text : string
 +CreatedAt : DateTimeOffset
}
class Certificate <<scaffold>> {
 +Id : Guid
 +CompanyId : Guid
 +DossierId : Guid
 +Active : bool
 +ExpiresAt : DateTimeOffset?
 +StripeSessionId : string?
 +CreatedAt : DateTimeOffset
}
class AuditLog {
 +Id : Guid
 +ActorId : Guid?
 +CompanyId : Guid?
 +Action : string
 +DetailsJson : string
 +CreatedAt : DateTimeOffset
}
class ReviewOutboxMessage {
 +Id : Guid (event ID)
 +DossierId : Guid
 +AggregateVersion : long
 +PayloadJson : jsonb (ID-only event)
 +Attempts : int
 +NextAttemptAt : DateTimeOffset
 +LeaseToken : Guid?
 +LeaseUntil : DateTimeOffset?
 +ProcessedAt : DateTimeOffset?
 +LastError : string? (exception type)
}
class AppNotification {
 +Id : Guid (event ID)
 +DossierId : Guid
 +CompanyId : Guid
 +ReviewerInbox : bool
 +Type : string
 +Title : string (fixed wording)
 +CreatedAt : DateTimeOffset
}
ReviewOutboxMessage ..> Dossier : DossierId / ordered Version
AppNotification ..> Dossier : DossierId
AppNotification ..> Company : CompanyId / audience
class "IdentityUser<Guid>" as IU <<framework>>
class ApplicationUser
ApplicationUser --|> IU
enum CompanyRole {
 Owner
 Collaborator
 Viewer
}
enum DossierStatus {
 Submitted
 InReview
 Validated
 Rejected
}
Company "1" -- "0..*" CompanyUser : Members
Company "1" -- "0..1" EsgSnapshot : current answers
Company "1" -- "0..*" Document : Documents
Company "1" -- "0..*" Dossier : Dossiers
Company "1" -- "0..*" Certificate
Dossier "1" -- "0..*" DossierNote : Notes
CompanyUser ..> ApplicationUser : UserId
Document ..> FileBlob : StoragePath = blob Id
Certificate ..> Dossier : DossierId (no configured FK)
AuditLog ..> Company : CompanyId?
AuditLog ..> ApplicationUser : ActorId?
Dossier ..> ApplicationUser : SubmittedBy? / ReviewerId?
DossierNote ..> ApplicationUser : AuthorId?
Document ..> ApplicationUser : UploadedBy?
CompanyUser ..> CompanyRole
Dossier ..> DossierStatus
note bottom of CompanyUser
 Unique (CompanyId, UserId).
 Services resolve first membership by UserId;
 multiple-company selection is not implemented.
end note
note bottom of EsgSnapshot
 Unique CompanyId; DataJson is jsonb.
 Questionnaire is a code catalog, not an EF table.
 Answers copied into Dossier.SnapshotJson.
end note
`);
add('03-object-example', 'Example submitted dossier — object snapshot', 'Object', 'Illustrative data using application entities',
  'Fictional objects demonstrate membership, a mutable snapshot, a submitted copy, and an evidence attachment. These are examples, not extracted customer records.',
  ['backend/src/Modules/', 'backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierService.cs'], String.raw`
object "atlas : Company" as c {
 Id = company-01
 Name = "Atlas Example PME"
 Sector = "Services"
}
object "owner : ApplicationUser" as u {
 Id = user-01
 Email = "owner@example.test"
}
object "membership : CompanyUser" as m {
 CompanyId = company-01
 UserId = user-01
 Role = Owner
}
object "live : EsgSnapshot" as s {
 CompanyId = company-01
 DataJson = { E1: {score: "1"} }
}
object "submission : Dossier" as d {
 CompanyId = company-01
 Status = Submitted
 SnapshotJson = { E1: {score: "1"} }
 SubmittedBy = user-01
 FinalScore = null
}
object "proof : Document" as doc {
 CompanyId = company-01
 QuestionCode = "E1"
 FileName = "policy.pdf"
 StoragePath = blob-01
}
object "attachment : FileBlob" as b {
 Id = blob-01
 Content = [binary bytes]
}
c -- m
m .. u : UserId
c -- s
c -- d
c -- doc
doc .. b : identifier reference
s ..> d : copied at submission
note bottom of d
 Snapshot is copied, not a live reference.
 Documents remain company-level records.
end note
`);
add('04-components', 'Application runtime components', 'Component', 'Application — implemented wiring',
  'React feature areas call versioned controllers. Infrastructure implements application interfaces; AI and email are optional external integrations.',
  [front+'app/router.tsx', 'backend/src/Turritopsis.Api/Modules/ApplicationModules.cs', infra+'Persistence/TurritopsisDbContext.cs'], String.raw`
left to right direction
package "React TypeScript SPA" {
 [Feature pages / lazy routes] as UI
 [Shared Axios transport] as Http
 UI --> Http
}
package "ASP.NET Core host" {
 [Versioned controllers\nHTTP inbound adapters] as API
 [Module composition / JWT / CORS] as Host
}
package "Module cores — no EF / HTTP framework" {
 [Companies / Identity use cases] as Identity
 [Diagnostics / Documents use cases] as Evidence
 [Reviews / Administration use cases] as Reviews
 [AI orchestration + privacy projection] as Ai
 [Shared DTO integration ports] as Contracts
}
package "Module infrastructure adapters" {
 [Owned EF repositories\n6 isolated contexts] as Repos
 [Identity / JWT adapter] as IdentityAdapter
 [AI provider HTTP adapter] as AiAdapter
 [Email HTTP adapter] as Email
}
database "One PostgreSQL database\nExisting tables / migration history" as DB
Http --> API
API --> Identity
API --> Evidence
API --> Reviews
API --> Ai
Identity --> Contracts
Evidence --> Contracts
Reviews --> Contracts
Identity --> Repos : repository port
Identity --> IdentityAdapter : identity / token ports
Identity --> Email : email port
Evidence --> Repos : repository / storage ports
Reviews --> Repos : repository port
Ai --> AiAdapter : minimized evidence only\nIAiProvider
Repos --> DB
IdentityAdapter --> DB
note bottom of Contracts
 Modules exchange DTOs and IDs through interfaces.
 No cross-module DbContext or EF entity navigation.
 The combined context is used only for existing migrations.
end note
`);
add('05-composite-structure', 'Dossier review collaboration — composite structure', 'Composite structure', 'Design view of implemented object collaboration',
  'Internal collaborating parts of a review request. The outer ReviewRequestContext is a modeling boundary, not a C# class.',
  [api+'DossiersController.cs', api+'AiController.cs', 'backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierService.cs', 'backend/src/Turritopsis.Api/Program.cs'], String.raw`
left to right direction
rectangle "review : ReviewRequestContext\n<<model boundary>>" as boundary {
 portin "HTTP request" as input
 portout "DTO response" as output
 rectangle "controller : DossiersController" as ctl
 rectangle "actor : ICurrentUserService" as usr
 rectangle "dossiers : IDossierQueries / IDossierCommands" as ds
 rectangle "documents : IDocumentService" as docs
 rectangle "persistence : Owning module context" as db
 input --> ctl
 ctl --> usr : userId / reviewer roles
 ctl --> ds : queue / dossier / notes / decision
 ctl --> docs : proof list
 ds --> db
 docs --> db
 ctl --> output
}
note bottom of boundary
 Parts correspond to constructor-injected dependencies.
 Dossier AI uses a separate AiController collaboration.
 This boundary groups objects; it is not a deployed service.
end note
`);
add('06-packages', 'Source packages and project dependencies', 'Package', 'Application — source organization',
  'Actual project-reference directions and frontend module grouping. Domain does not depend on infrastructure.',
  ['backend/src/Turritopsis.Api/Turritopsis.Api.csproj', 'backend/src/Turritopsis.Application/Turritopsis.Application.csproj', 'backend/src/Turritopsis.Infrastructure/Turritopsis.Infrastructure.csproj', front+'app/router.tsx', 'backend/src/Turritopsis.Api/Modules/ApplicationModules.cs'], String.raw`
left to right direction
package "frontend/src" {
 package "app / lazy route composition" as App
 package "features / public interfaces" as Features
 package "shared / neutral session / transport" as Shared
 App ..> Features
 Features ..> Shared
}
package "ASP.NET Core host" as Api
package "SharedKernel\nintegration DTOs / ports" as Kernel
package "Owned module Core assemblies" as Core {
 [Entities / business use cases]
 [Inbound / repository ports]
}
package "Owned module Infrastructure assemblies" as Infra {
 [Internal repositories / contexts]
 [Public module registrations]
}
package "Compatibility assemblies\nApplication / Domain / Infrastructure" as Compat
Api ..> Compat : endpoint namespaces / composition
Compat ..> Core
Compat ..> Infra
Infra ..> Core : own module only
Core ..> Kernel
note bottom of Core
 Pure business code has no EF Core, Npgsql or ASP.NET imports.
 Reviews additionally references AI's public criterion/context types.
end note
note bottom of Compat
 Existing migration history remains centralized.
 Runtime use cases never receive its combined DbContext.
end note
`);
add('07-deployment', 'Application deployment topology', 'Deployment', 'Supported topology — not verification of live hosting',
  'Deployable artifacts inferred from the Dockerfile, EF configuration and frontend API client. Provider names are intentionally unspecified.',
  ['backend/Dockerfile', 'backend/docker-compose.yml', 'backend/src/Turritopsis.Api/Program.cs', front+'shared/api-client/httpClient.ts'], String.raw`
node "User device" {
 node "Web browser" as browser {
  artifact "React TypeScript SPA\nfrontend build assets" as spa
 }
}
node "Static frontend host\n(provider configurable)" as host {
 artifact "HTML / JS / CSS" as assets
}
node "Backend host" {
 node "Container / .NET 8 runtime\nPORT or 8080" as runtime {
  artifact "Turritopsis.Api.dll" as apiDll
  artifact "Application / Infrastructure / Domain DLLs" as libs
 }
}
node "Database host" {
 database "PostgreSQL" as db {
  artifact "Identity + ESG tables" as tables
  artifact "FileBlobs attachment bytes" as files
 }
}
cloud "Configured chat-completions provider" as ai
cloud "Resend email service" as mail
host --> browser : serve static assets
spa --> runtime : HTTP(S) /api/v1\nBearer JWT / CORS
runtime --> db : Npgsql / connection string
runtime --> ai : HTTPS (when API key configured)
runtime --> mail : HTTPS (when email enabled)
note bottom of runtime
 Startup applies EF migrations and ensures reviewer/admin roles.
 Admin seed runs only when configured.
 Hosting ingress / TLS must be configured by the deployment.
end note
note bottom of db
 Local docker-compose supplies PostgreSQL 16,
 port 5432 and a named data volume.
end note
`);
add('08-model-profile', 'Documentation profile for ESG models', 'Profile', 'Proposed notation only — no runtime implementation',
  'A small UML profile formalizes documentary stereotypes. This is a modeling aid, not an implemented application feature or a claimed profile already present in the repository.',
  ['backend/src/Modules/', 'backend/src/Modules/Turritopsis.Modules.Ai.Core/Application/AiReviewService.cs', 'backend/src/Modules/Turritopsis.Modules.Documents.Infrastructure/Adapters/DatabaseFileStorage.cs'], String.raw`
package "ESGDocumentation <<profile>>" {
 class "UML::Class" as ClassMeta <<metaclass>>
 class "UML::Component" as ComponentMeta <<metaclass>>
 class CompanyScoped <<stereotype>> {
  tenantKey : String = "CompanyId"
 }
 class FrozenSubmission <<stereotype>> {
  copiedField : String = "SnapshotJson"
  evidenceFrozen : Boolean = false
 }
 class AdvisoryAI <<stereotype>> {
  finalDecisionBy : String = "Reviewer"
  fallback : String = "Heuristic"
 }
 class Scaffold <<stereotype>> {
  workflowImplemented : Boolean = false
 }
 CompanyScoped --|> ClassMeta : <<extension>>
 FrozenSubmission --|> ClassMeta : <<extension>>
 Scaffold --|> ClassMeta : <<extension>>
 AdvisoryAI --|> ComponentMeta : <<extension>>
}
note bottom of FrozenSubmission
 Example application: Dossier.
 Describes copying answers at submission;
 does not claim database immutability.
end note
note bottom of Scaffold
 Example application: Certificate entity.
 No application payment/certificate workflow exists.
end note
`);
add('09-activity-diagnostic', 'Diagnostic and human review workflow', 'Activity', 'Application — typical user journey',
  'End-to-end activity with optional AI advice and the rejection/resubmission loop. Completion is a user journey, not a backend submission prerequisite.',
  [front+'features/dossiers/pages/analysis/AnalysisPage.tsx', front+'features/documents/pages/ProofsPage.tsx', front+'features/review/pages/detail/DossierDetailPage.tsx', front+'features/dossiers/pages/report/ReportPage.tsx'], String.raw`
start
partition PME {
 :Register or log in;
 :Complete company profile;
 :Select ESG answers and autosave;
 :Add evidence text / files;
 if (Request question advice?) then (yes)
  :Read AI or heuristic suggestion;
  if (Accept suggestion?) then (yes)
   :Save suggested score into live answers;
  endif
 endif
 :Inspect provisional E/S/G score;
 :Submit current snapshot;
}
repeat
 partition Reviewer {
  :Open dossier from queue;
  :Inspect copied answers and current company proofs;
  if (Request dossier AI advice?) then (yes)
   :Read assessment and flagged criteria;
   :Optionally use suggested score / recommendation draft;
  endif
  :Choose human decision and recommendations;
  if (Accept dossier?) then (yes)
   :Save Validated + final score;
  else (no)
   :Save Rejected + recommendations;
   :Optionally add reviewer note;
  endif
 }
 if (Validated?) then (yes)
  partition PME {
   :Read validated report;
   :Print or save PDF using browser;
  }
  stop
 else (no)
  partition PME {
   :Read reviewer feedback;
   :Update answers / evidence;
   :Resubmit existing non-validated dossier;
  }
 endif
repeat while (Resubmitted?) is (yes)
stop
`);
add('10-dossier-state', 'Dossier lifecycle and enforced transitions', 'State machine', 'Application — implemented workflow patterns',
  'Domain State implementations enforce transitions and lock validated records. A later submission creates another dossier.',
  ['backend/src/Modules/Turritopsis.Modules.Reviews.Core/Domain/DossierStates.cs', 'backend/src/Modules/Turritopsis.Modules.Reviews.Core/Domain/Dossier.cs', 'backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierCommands.cs'], String.raw`
state "Editable answers\n(no persisted Draft)" as Draft
state Submitted
state InReview
state Rejected
state Validated
[*] --> Draft
Draft --> Submitted : submit / freeze answers
Submitted --> Submitted : resubmit / reset old review
Submitted --> InReview : reviewer starts review
Submitted --> Validated : reviewer validates / score required
Submitted --> Rejected : reviewer rejects
InReview --> InReview : update review
InReview --> Validated : reviewer validates
InReview --> Rejected : reviewer rejects
Rejected --> Submitted : company corrects / resubmits
Validated --> [*] : immutable closed dossier
note right of Validated
 A new company submission creates a separate dossier.
 This validated row cannot change or receive notes.
end note
note left of InReview
 Company resubmission returns 409 during review.
 Stale concurrent writes return 409.
 Invalid scores / status values return 400.
end note
`);
add('11-sequence-registration', 'Company account registration', 'Sequence', 'Application — registration path',
  'Input validation, Identity account creation, company/membership transaction and JWT issuance. The Identity user is created before the company transaction.',
  [api+'AuthController.cs', 'backend/src/Modules/Turritopsis.Modules.Identity.Core/Application/AuthService.cs', 'backend/src/Modules/Turritopsis.Modules.Identity.Infrastructure/Adapters/JwtTokenGenerator.cs'], String.raw`
actor PME
participant AuthPage as UI
participant AuthController as API
participant "Register validator" as V
participant AuthService as S
participant "IIdentityAccounts\nIdentity adapter" as I
participant "Owned repository / integration ports\nPostgreSQL adapters" as DB
participant JwtTokenGenerator as JWT
PME -> UI : Company details + email/password
UI -> API : POST /api/v1/auth/register
API -> V : ValidateAsync(request)
alt Invalid input
 API --> UI : ValidationProblem
else Valid input
 API -> S : RegisterAsync(request)
 S -> I : FindByEmailAsync(email)
 alt Email exists / Identity creation fails
  S --> API : AuthResult.Fail
  API --> UI : 400 errors
 else New account
  S -> I : CreateAsync(user, password)
  I -> DB : persist Identity user
  S -> DB : ICompanyRegistration.CreateOwnedCompanyAsync
  DB -> DB : Companies adapter transaction\ninsert Company + owner; commit
  S -> JWT : Generate(user, no platform roles)
  JWT --> S : token + expiry
  S --> API : userId, companyId, token
  API --> UI : 200 auth result
  UI --> PME : Authenticated workspace
 end
end
note over I,DB
 Identity creation precedes the company transaction;
 these writes are not one atomic registration transaction.
end note
`);
add('12-sequence-login', 'Login and protected API access', 'Sequence', 'Application — authentication',
  'Company membership and platform roles are distinct. Axios attaches the JWT and clears the local session on HTTP 401; there is no implemented refresh endpoint.',
  ['backend/src/Modules/Turritopsis.Modules.Identity.Core/Application/AuthService.cs', 'backend/src/Turritopsis.Api/Program.cs', front+'shared/api-client/httpClient.ts'], String.raw`
actor User
participant "Auth / reviewer login page" as UI
participant AuthController as Auth
participant AuthService as S
participant "IIdentityAccounts\nIdentity adapter" as I
participant "Owned repository / integration ports\nPostgreSQL adapters" as DB
participant JwtTokenGenerator as JWT
participant "JWT middleware + protected controller" as API
User -> UI : email/password
UI -> Auth : POST /api/v1/auth/login
Auth -> S : LoginAsync
S -> I : FindByEmail + CheckPassword
alt Wrong credentials
 S --> Auth : failure
 Auth --> UI : 401
else Valid credentials
 S -> I : GetRolesAsync(user)
 S -> DB : first company membership (if any)
 S -> JWT : Generate(user, platform roles)
 S --> Auth : JWT + expiry + companyId + roles
 Auth --> UI : 200
 UI -> UI : persist session
 UI -> API : next request + Authorization: Bearer JWT
 API -> API : validate signature, issuer, audience, expiry\nthen check endpoint roles / membership
 alt Authorized
  API --> UI : resource DTO
 else JWT invalid / expired
  API --> UI : 401
  UI -> UI : clearSession()
 else Authenticated but insufficient access
  API --> UI : 403
 end
end
`);
add('13-sequence-questionnaire', 'Questionnaire autosave and scoring', 'Sequence', 'Application — answers and calculation',
  'Each choice triggers snapshot upsert; the server rejects viewer writes. Scoring excludes N/A and unanswered values and averages the three rounded pillar scores.',
  [front+'features/questionnaire/pages/QuestionnairePage.tsx', front+'features/questionnaire/scoring.ts', 'backend/src/Modules/Turritopsis.Modules.Diagnostics.Core/Application/SnapshotService.cs'], String.raw`
actor "Owner / collaborator" as PME
participant QuestionnairePage as UI
participant "Questionnaire API client" as Client
participant SnapshotsController as API
participant SnapshotService as S
participant "Owned repository / integration ports\nPostgreSQL adapters" as DB
participant "computeScores()" as Scores
UI -> API : GET /api/v1/snapshots + JWT
API -> S : GetForUserAsync(userId)
S -> DB : resolve membership + current snapshot
S --> UI : dataJson or null
loop Each answer choice
 PME -> UI : choose 1 / 0.5 / 0 / NA
 UI -> UI : update local answers
 UI -> Client : saveSnapshot(answers)
 Client -> API : PUT /api/v1/snapshots {dataJson}
 API -> S : UpsertForUserAsync(userId, dataJson)
 S -> DB : first membership
 alt Missing membership / Viewer
  S --> API : Forbidden
  API --> UI : 403
 else Writable company membership
  S -> DB : insert or update one snapshot per company
  S --> API : SnapshotDto
  API --> Client : 200
  Client --> UI : invalidate snapshot query
 end
end
UI -> Scores : answers (when score view needs them)
Scores -> Scores : for E/S/G: retain 1, 0.5, 0 only
Scores -> Scores : pillar = round(mean * 100), empty = 0
Scores -> Scores : overall = round((E + S + G) / 3)
Scores --> UI : E, S, G, overall
note over UI,S
 The JSON snapshot is persisted; the server does not
 recompute the declared submission scores.
end note
`);
add('14-sequence-evidence', 'Evidence upload, retrieval and deletion', 'Sequence', 'Application — file storage',
  'Optional files are base64 encoded, capped at 4 MiB decoded, and saved as FileBlob bytes. Attachment-save failure preserves text. Retrieval checks company membership or reviewer/admin access.',
  ['backend/src/Modules/Turritopsis.Modules.Documents.Core/Application/DocumentService.cs', 'backend/src/Modules/Turritopsis.Modules.Documents.Infrastructure/Adapters/DatabaseFileStorage.cs', api+'DocumentsController.cs'], String.raw`
actor "Company writer" as PME
participant ProofsPage as UI
participant DocumentsController as API
participant DocumentService as S
participant DatabaseFileStorage as Files
participant "Owned repository / integration ports\nPostgreSQL adapters" as DB
PME -> UI : note + optional file
UI -> API : POST /api/v1/documents\nquestionCode, textContent, fileName, fileBase64
API -> S : UploadAsync(userId, request)
S -> DB : resolve membership
alt Missing membership / Viewer
 S --> API : Forbidden
 API --> UI : 403
else Allowed
 opt fileBase64 and fileName present
  S -> S : decode base64; check <= 4 MiB
  break Invalid base64 / too large
   S --> API : exception; request aborts
   API --> UI : too large -> 400; invalid base64 -> unhandled FormatException
  end
   S -> Files : SaveAsync(companyId, name, bytes)
   Files -> DB : insert FileBlob
   alt Save succeeds
    Files --> S : blob Id as storagePath
   else Attachment save fails
    Files --> S : exception
    S -> S : catch; clear storagePath and fileName
   end
 end
 S -> DB : insert Document (text + optional blob reference)
 S --> UI : DocumentDto
end
== Separate authorized retrieval ==
UI -> API : GET /api/v1/documents/{id}
API -> S : GetDetailAsync(userId, isReviewer, id)
S -> DB : load document; check tenant / role
opt Attached bytes exist
 S -> Files : ReadAsync(storagePath)
 Files -> DB : select FileBlob
 Files --> S : byte[] or null
end
S --> UI : detail + optional fileBase64 (or 403/404)
== Separate writer deletion ==
UI -> API : DELETE /api/v1/documents/{id}
API -> S : DeleteAsync(userId, id)
S -> DB : check writable membership + same company
opt Stored file
 S -> Files : DeleteAsync(storagePath)
 Files -> DB : delete blob
end
S -> DB : delete document
S --> UI : access result
`);
add('15-sequence-ai', 'AI advice and heuristic fallback', 'Sequence', 'Application — advisory AI',
  'Per-question advice is authenticated; whole-dossier advice is reviewer/admin-only. A mandatory local privacy projection excludes source text/filenames from provider requests. Local-only mode skips provider calls.',
  [api+'AiController.cs', 'backend/src/Modules/Turritopsis.Modules.Ai.Core/Application/AiReviewService.cs', 'backend/src/Modules/Turritopsis.Modules.Ai.Core/Application/AiEvidencePrivacyFilter.cs', 'backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierQueries.cs', front+'features/documents/pages/ProofsPage.tsx'], String.raw`
actor "PME / reviewer" as User
participant "Proofs / dossier detail page" as UI
participant AiController as API
participant SlidingWindowRateLimiter as Limit
participant DossierQueries as DS
participant "Owned repository / integration ports\nPostgreSQL adapters" as DB
participant AiReviewService as AI
participant AiEvidencePrivacyFilter as Privacy
participant "Chat-completions provider" as Provider
User -> UI : request advice
alt Question review
 UI -> API : POST /api/v1/ai/review-question\nquestion + selected score + proof text
else Whole dossier review
 UI -> API : POST /api/v1/ai/review-dossier/{id}
 API -> API : require reviewer/admin
end
API -> Limit : acquire per-user endpoint bucket\n30 requests / minute
alt Rate exceeded
 API --> UI : 429
else Allowed and authorized
 opt Whole dossier review
  API -> DS : GetAiContextAsync
  DS -> DB : copied answers + current company documents
  DS --> API : notes + first matching document text per code\n(internal application context only)
 end
 API -> AI : ReviewQuestionAsync / ReviewDossierAsync
 AI -> Privacy : project raw context locally
 Privacy --> AI : canonical criterion / finite score / boolean signals
 alt AllowRemote=false or API key absent
  AI -> AI : keyword heuristic
 else Provider configured
  AI -> Provider : IAiProvider.ReviewAsync -> POST /chat/completions\nminimized signals only; no proof text / filenames
  alt Valid response
   Provider --> AI : JSON advice
   AI -> AI : parse response
  else HTTP / parsing failure
   Provider --> AI : error / unusable response
   AI -> AI : log exception type only; heuristic fallback
  end
 end
 AI --> API : suggested score, confidence / flags, summary
 API --> UI : 200 advice
 UI --> User : show recommendation
 opt User explicitly accepts
  UI -> UI : PME applies answer OR reviewer drafts decision
 end
end
note over API,AI
 Diagram groups shared logic. Dossier context loading
 requires dossier existence and reviewer authorization.
 No automatic final decision; no binary file extraction.
 Raw proof text never enters a provider prompt.
end note
`);
add('16-sequence-submit', 'Submit with a transactional outbox', 'Sequence', 'Application — implemented workflow patterns',
  'Submission freezes answers, applies State rules and persists minimal domain events atomically. Audit and notifications are asynchronous.',
  ['backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierCommands.cs', 'backend/src/Modules/Turritopsis.Modules.Reviews.Infrastructure/Adapters/DossierRepository.cs', 'backend/src/Turritopsis.Api/Services/OutboxWorker.cs'], String.raw`
actor Company
participant AnalysisPage as UI
participant DossiersController as API
participant DossierCommands as C
participant "Membership / snapshot ports" as Ports
participant Dossier as D
participant DossierRepository as Repo
database PostgreSQL as DB
Company -> UI : Submit
UI -> API : POST /dossiers
API -> C : SubmitAsync
C -> Ports : writable membership / current snapshot
C -> Repo : latest dossier (tracked)
Repo -> DB : read
alt Latest dossier is InReview
 C -> D : Submit
 D --> C : transition rejected
 C --> UI : 409 conflict
else No dossier / latest Validated
 C -> D : create new dossier / Submit
else Latest Submitted / Rejected
 C -> D : Submit / clear previous decision
end
opt Submission permitted
 D -> D : increment Version / raise dossier.submitted
 C -> Repo : SaveAsync
 Repo -> DB : BEGIN; write dossier + ReviewOutboxMessages
 alt Version / unique-version conflict
  DB --> Repo : rollback complete transaction
  Repo --> UI : 409 reload required
 else Success
  Repo -> DB : COMMIT
  C --> UI : 200 DossierDto
 end
end
ref over API,DB : 26 — asynchronous Outbox delivery
`);
add('17-sequence-review', 'Human review with state and concurrency guards', 'Sequence', 'Application — implemented workflow patterns',
  'Reads use query ports. Commands enforce State rules, optimistic versions and atomic dossier/note plus event storage.',
  [api+'DossiersController.cs', 'backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierQueries.cs', 'backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierCommands.cs', 'backend/src/Modules/Turritopsis.Modules.Reviews.Core/Domain/Dossier.cs'], String.raw`
actor Reviewer
participant DossierDetailPage as UI
participant DossiersController as API
participant DossierQueries as Q
participant DossierCommands as C
participant Dossier as D
participant DossierRepository as Repo
database PostgreSQL as DB
Reviewer -> UI : open dossier
UI -> API : GET dossier / notes / evidence
API -> Q : authorized read queries
Q -> DB : AsNoTracking dossier / notes
Q --> UI : read DTOs
opt Start review
 UI -> API : PUT status=InReview
 API -> C : UpdateStatusAsync
end
Reviewer -> UI : validate / reject / comment
UI -> API : PUT decision or POST note
API -> API : reviewer/admin authorization
API -> C : execute command
C -> Repo : load tracked dossier
C -> D : Review or RecordNote
alt Invalid score / status
 D --> UI : 400 validation error
else Closed state / stale concurrent version
 D --> UI : 409 conflict
else Allowed
 D -> D : update state / increment Version / raise minimal event
 C -> Repo : SaveAsync (including note when applicable)
 Repo -> DB : dossier + note + outbox in one transaction
 DB --> Repo : COMMIT
 C --> UI : 200 DTO / 204 note
end
ref over API,DB : 26 — audit and internal notification delivery
`);
add('18-sequence-report', 'Report visibility and PDF printing', 'Sequence', 'Application — report page',
  'The company sees the latest dossier. A validated report uses the reviewer score when present, with pillar scores recalculated from the copied answers. PDF output uses browser printing.',
  [front+'features/dossiers/pages/report/ReportPage.tsx', 'backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierQueries.cs'], String.raw`
actor "Company member" as PME
participant ReportPage as UI
participant DossiersController as API
participant DossierQueries as S
participant "Owned repository / integration ports\nPostgreSQL adapters" as DB
participant "Browser print dialog" as Print
PME -> UI : /app/report
UI -> API : GET /api/v1/dossiers/mine
API -> S : GetForCompanyOwnerAsync(userId)
S -> DB : membership; latest company dossier by CreatedAt
S --> UI : DossierDto or null
alt No dossier
 UI --> PME : no submission message
else Status != Validated
 UI --> PME : status + recommendations if present
else Validated
 UI -> UI : parse snapshotJson (invalid JSON -> {})
 UI -> UI : compute pillar scores from copied answers
 UI -> UI : finalScore = dossier.finalScore ?? computed overall
 UI --> PME : final score, E/S/G, recommendations, review date
 PME -> UI : Download report (PDF)
 UI -> Print : window.print()
 Print --> PME : print / Save as PDF
end
note over UI,API
 No server-side PDF generation or application certificate checkout.
 Latest pending submission can hide an earlier validated report.
end note
`);
add('19-sequence-admin', 'Administrator creates a reviewer', 'Sequence', 'Application — account separation',
  'Only an admin can create reviewer accounts. Existing emails are rejected to avoid combining company and reviewer identities. Audit logging is best effort.',
  [api+'AdminUsersController.cs', 'backend/src/Modules/Turritopsis.Modules.Administration.Core/Application/AdminUsersService.cs', 'backend/src/Turritopsis.Api/Program.cs'], String.raw`
actor Admin
participant ReviewersPage as UI
participant "JWT / role middleware" as Guard
participant AdminUsersController as API
participant "CreateReviewer validator" as V
participant AdminUsersService as S
participant "IIdentityAccounts\nIdentity adapter" as I
participant "Owned repository / integration ports\nPostgreSQL adapters" as DB
Admin -> UI : new reviewer email/password
UI -> Guard : POST /api/v1/admin/reviewers + JWT
alt Missing / invalid JWT or not admin
 Guard --> UI : 401 / 403
else Admin
 Guard -> API : request
 API -> V : validate
 API -> S : CreateReviewerAsync(actorId, request)\n[valid input]
 S -> I : FindByEmailAsync
 alt Existing email
  S --> UI : 400 errors
 else Unused email
  S -> I : CreateAsync(user, password)
  I -> DB : Identity user
  S -> I : AddToRoleAsync(user, "reviewer")
  I -> DB : Identity role membership
  S -> DB : best-effort AuditLog("reviewer_created")
  S --> API : success + userId
  API --> UI : 200
 end
end
note over S,I
 No self-service reviewer/admin signup.
 Role removal is separate DELETE /api/v1/admin/roles.
end note
`);
add('20-sequence-password-reset', 'Password reset with generic response', 'Sequence', 'Application — password reset',
  'The request response is deliberately generic, including throttled/nonexistent accounts. Email is optional and best effort; the reset step validates the Identity token.',
  [api+'AuthController.cs', 'backend/src/Modules/Turritopsis.Modules.Identity.Core/Application/AuthService.cs', infra+'Email/ResendEmailService.cs'], String.raw`
actor User
participant "Auth / ResetPassword page" as UI
participant AuthController as API
participant SlidingWindowRateLimiter as Rate
participant AuthService as S
participant "IIdentityAccounts\nIdentity adapter" as I
participant ResendEmailService as Email
participant Resend
User -> UI : forgot password(email)
UI -> API : POST /auth/forgot-password
API -> API : validate request
API -> Rate : 3 requests / 15 minutes per email
opt Limit permits request
 API -> S : RequestPasswordResetAsync
 S -> I : FindByEmailAsync
 opt Account exists
  S -> I : GeneratePasswordResetTokenAsync
  S -> Email : SendAsync(reset link)
  opt Email enabled + configured
   Email -> Resend : POST /emails
   Resend --> Email : delivery API result
  end
 end
end
API --> UI : 200 generic message (valid input)
User -> UI : open emailed link + new password
UI -> API : POST /auth/reset-password\nemail, token, newPassword
API -> API : validate request
API -> S : ResetPasswordAsync
S -> I : find user; ResetPasswordAsync(token, password)
alt Token/account invalid
 S --> UI : 400 errors
else Reset succeeds
 S --> UI : 200
end
note over Email,Resend
 Disabled/unconfigured sends are skipped;
 send failures are logged and do not fail the request.
end note
`);
add('21-communication', 'Submission collaboration — numbered messages', 'Communication', 'Application — submit interaction',
  'Object links and numbered messages show the same successful submission collaboration as the submission sequence diagram.',
  [api+'DossiersController.cs', 'backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierService.cs'], String.raw`
allowmixing
left to right direction
actor "writer : Company member" as actor
object "page : AnalysisPage" as ui
object "controller : DossiersController" as ctl
object "command : DossierCommands" as svc
object "db : Owning module context" as db
actor --> ui : 1: submit()
ui --> ctl : 1.1: POST /dossiers(scores)
ctl --> svc : 1.1.1: SubmitAsync(userId, scores)
svc --> db : 1.1.1.1: resolve writable membership\n1.1.1.2: load live snapshot\n1.1.1.3: find reusable dossier\n1.1.1.4: save copied submission\n1.1.1.5: outbox event in same transaction
svc --> ctl : 1.1.2: DossierDto
ctl --> ui : 1.2: 200 response
ui --> actor : 2: confirmation
note bottom of db
 Preconditions: JWT authenticated;
 company membership is Owner or Collaborator.
 Validated dossiers are excluded from reuse.
end note
`);
add('22-interaction-overview', 'Diagnostic interaction overview', 'Interaction overview', 'Application — interactions composed into a journey',
  'UML activity control flow connects referenced interaction frames. Numbers point to detailed sequence diagrams in this pack.',
  [front+'app/router.tsx', 'backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierService.cs', front+'features/dossiers/pages/report/ReportPage.tsx'], String.raw`
start
if (New company account?) then (yes)
 :<<interaction>>\n11 Registration;
else (no)
 :<<interaction>>\n12 Login;
endif
:Complete company profile;
repeat
 :<<interaction>>\n13 Questionnaire autosave;
 :<<interaction>>\n14 Evidence upload;
 if (Need question advice?) then (yes)
  :<<interaction>>\n15 AI advice and fallback;
 endif
 :<<interaction>>\n16 Submit / resubmit;
 :<<interaction>>\n17 Human review and decision;
repeat while (Rejected and company chooses to revise?) is (yes)
:<<interaction>>\n18 Report status / validated report;
stop
`);
add('23-timing', 'Illustrative submission and review timing', 'Timing', 'Illustrative event order — no measured durations',
  'Shows the relative state changes of answers, dossier status and report availability. Time units are arbitrary event positions, not measured latency or service-level commitments.',
  ['backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierService.cs', front+'features/dossiers/pages/report/ReportPage.tsx'], String.raw`
robust "Live answers" as Answers
robust "Dossier record" as Dossier
robust "Report page" as Report
scale 10 as 120 pixels
@0
Answers is "Editable"
Dossier is "Absent"
Report is "No dossier"
@10
Answers is "Editable"
Dossier is "Submitted"
Report is "Pending"
@20
Dossier is "Rejected"
Report is "Feedback"
@30
Answers is "Revised"
@40
Dossier is "Submitted"
Report is "Pending"
@50
Dossier is "Validated"
Report is "Final report"
@60
Answers is "Editable"
@80
Dossier is "Validated"
Report is "Final report"
@10
Answers -> Dossier : copy answers on submit
@40
Answers -> Dossier : replace copy on resubmit
@50
Dossier -> Report : final score + advice
note top of Dossier : Same row reused until validated; event units are illustrative
`);
add('24-ai-privacy-boundary', 'Enterprise evidence privacy boundary', 'Sequence', 'Application — mandatory server-side minimization',
  'Original documents stay within the application/reviewer path. External AI receives only public criterion metadata, a finite score and boolean evidence mentions. Local-only mode performs no provider review request.',
  ['backend/src/Modules/Turritopsis.Modules.Ai.Core/Application/AiEvidencePrivacyFilter.cs', 'backend/src/Modules/Turritopsis.Modules.Ai.Infrastructure/Adapters/AiOptions.cs', 'docs/AI-DATA-PRIVACY.md'], String.raw`
actor Company
participant "Application UI" as UI
box "Application server — original data boundary" #F3F6FA
 participant "Authorized review endpoint" as API
 participant "Local privacy projection" as Filter
 database "Application evidence storage" as DB
end box
participant "External AI provider" as Provider
actor "Authorized human reviewer" as Reviewer
Company -> UI : submit proof text / files to application
UI -> API : request provisional advice
API -> Filter : inspect proof text locally\nnever use a remote model for filtering
Filter -> Filter : public catalog allowlist\nfinite answer values\nfixed boolean mention extraction
Filter --> API : criterion, public title, pillar, score, signals
alt Local-only configured
 API -> API : local heuristic review\nno provider request
else Signals-only configured
 API -> Provider : fixed instructions + minimized evidence signals
 note over API,Provider
  Excluded: source text, filenames, company/person names,
  contacts, account/tax IDs, amounts, exact dates,
  attachment bytes and arbitrary metadata.
 end note
 Provider --> API : cautious provisional advice
end
API --> UI : result + server-owned privacy metadata
Reviewer -> DB : authorized access to original evidence
DB --> Reviewer : documents and company context
Reviewer -> API : human validation / rejection and final score
note over Filter,Provider
 Signals are mentions, not verified compliance.
 Scores/signals still disclose limited business information.
 Use local-only when these must also stay in the application.
end note
`);
add('25-hexagonal-modules', 'Hexagonal module ownership and communication', 'Component', 'Implemented compile-time and EF model boundaries',
  'Modules own core use cases and isolated runtime contexts. Cross-module collaboration uses DTO ports. Database tables and migration history are retained; this is code isolation, not separate database credentials.',
  ['backend/src/Turritopsis.SharedKernel/ModulePorts.cs', 'backend/src/Turritopsis.Api/Modules/ApplicationModules.cs', 'backend/tests/Turritopsis.ModuleChecks/Program.cs', 'scripts/check-architecture.mjs'], String.raw`
left to right direction
actor "HTTP controllers" as API
package "Companies module" {
 [Company use cases] as Companies
 [ICompanyRepository] as CompanyPort
 [CompaniesDbContext\nCompanies + CompanyUsers] as CompanyDb
 Companies --> CompanyPort
 CompanyPort <|.. CompanyDb
}
package "Reviews module" {
 [Dossier use cases] as Reviews
 [IDossierRepository] as ReviewPort
 [ReviewsDbContext\nDossiers + Notes + Certificates + Outbox] as ReviewDb
 Reviews --> ReviewPort
 ReviewPort <|.. ReviewDb
}
package "Diagnostics module" {
 [Snapshot use cases] as Snapshot
 [DiagnosticsDbContext\nEsgSnapshots] as SnapshotDb
 Snapshot --> SnapshotDb : repository port
}
package "Documents module" {
 [Evidence use cases / readers] as Evidence
 [DocumentsDbContext\nDocuments + FileBlobs] as DocumentDb
 Evidence --> DocumentDb : repository / storage ports
}
package "Identity module" {
 [Auth use cases] as Auth
 [IdentityModuleDbContext\nAspNet tables] as IdentityDb
 Auth --> IdentityDb : identity account adapter
}
package "Audit module" {
 [IAuditTrail adapter] as Audit
 [AuditDbContext\nAuditLogs + Notifications + PushSubscriptions + PushJobs] as AuditDb
 Audit --> AuditDb
}
database "One PostgreSQL database" as DB
API --> Reviews
API --> Auth
API --> Evidence
Reviews --> Companies : ICompanyDirectory\nDTO membership / names
Reviews --> Snapshot : ISnapshotReader\nJSON snapshot
Reviews --> Evidence : ICompanyEvidenceReader\ntext DTOs
Reviews --> Audit : Domain Events via Outbox / dispatcher
Evidence --> ReviewDb : IDossierCompanyReader adapter\nreturns company ID only
Auth --> Companies : ICompanyRegistration
CompanyDb --> DB
ReviewDb --> DB
SnapshotDb --> DB
DocumentDb --> DB
IdentityDb --> DB
AuditDb --> DB
note bottom of DB
 Tables retain their names and public schema for compatibility.
 Existing physical foreign keys remain in the database.
 Shared credentials are not a database permission boundary.
end note
`);
add('26-outbox-events', 'Durable Domain Events and internal notifications', 'Sequence', 'Implemented at-least-once delivery',
  'A short row lease allows concurrent workers. Retry state and aggregate order survive restarts. Event IDs deduplicate audit and notification effects.',
  ['backend/src/Turritopsis.Api/Services/OutboxWorker.cs', 'backend/src/Modules/Turritopsis.Modules.Reviews.Infrastructure/Adapters/ReviewOutboxProcessor.cs', 'backend/src/Modules/Turritopsis.Modules.Audit.Infrastructure/Adapters/DossierEventHandler.cs'], String.raw`
participant OutboxWorker as Worker
participant ReviewOutboxProcessor as Processor
database "Reviews owned outbox" as Outbox
participant DomainEventDispatcher as Dispatcher
participant "Audit module event handler" as Audit
database "AuditLogs + Notifications + PushJobs" as Effects
Worker -> Processor : ProcessBatchAsync (new DI scope)
Processor -> Outbox : BEGIN / pending first event per dossier\nFOR UPDATE SKIP LOCKED
Processor -> Outbox : persist Attempts + lease token (2 min)
Processor -> Outbox : COMMIT claim
Processor -> Dispatcher : DispatchAsync (minimal ID-only event)
Dispatcher -> Audit : HandleAsync
Audit -> Effects : BEGIN / insert audit + notification + per-device push jobs\nON CONFLICT(event ID) DO NOTHING
Audit -> Effects : COMMIT both effects
alt All handlers succeed
 Processor -> Outbox : acknowledge if lease token still owned
else Failure / interruption
 Processor -> Outbox : persist retry backoff / exception type only
 note over Processor,Effects
  Effects may already have committed before interruption.
  Redelivery is safe because their event ID is unique.
  A crashed lease expires and another worker can recover it.
  Later events for the same dossier wait for acknowledgement.
 end note
end
`);
add('27-cqrs-state', 'State and lightweight CQRS inside Reviews', 'Component', 'Implemented command and query ports',
  'Commands use tracked stateful aggregates and the outbox. Queries return DTOs with no tracked entities. Both share one database; no Strategy pattern was added.',
  ['backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/IDossierService.cs', 'backend/src/Modules/Turritopsis.Modules.Reviews.Core/Domain/DossierStates.cs', 'backend/src/Modules/Turritopsis.Modules.Reviews.Infrastructure/ModuleRegistration.cs'], String.raw`
left to right direction
[HTTP controllers] as HTTP
package "Reviews Core" {
 [IDossierCommands / DossierCommands] as Commands
 [IDossierQueries / DossierQueries] as Queries
 [Dossier aggregate] as Dossier
 [State: Submitted / InReview / Rejected / Validated] as State
 [DomainEvent ID-only payload] as Event
 Commands --> Dossier
 Dossier --> State : enforce transition
 Dossier --> Event : raise after change
}
package "Reviews Infrastructure" {
 [IDossierRepository / tracked writes] as Write
 [IDossierReadRepository / AsNoTracking] as Read
 [ReviewOutboxProcessor] as Outbox
}
database "Same PostgreSQL database" as DB
HTTP --> Commands : POST / PUT
HTTP --> Queries : GET
Commands --> Write
Queries --> Read
Write --> DB : aggregate + event / one transaction
Read --> DB : read projection
Outbox --> DB : lease / retry / acknowledge
`);
add('28-firebase-push-queue', 'Firebase push through a durable notification queue', 'Sequence', 'Implemented integration; Firebase credentials needed for live delivery',
  'Opt-in device registration and leased PostgreSQL jobs deliver generic ID-only alerts. Access is rechecked, failures retry/dead-letter and logout suppresses old-account messages.',
  ['backend/src/Modules/Turritopsis.Modules.Audit.Infrastructure/Adapters/PushQueueProcessor.cs', 'backend/src/Modules/Turritopsis.Modules.Audit.Infrastructure/Firebase/FirebasePushSender.cs', 'frontend/src/features/notifications/firebase-messaging-sw.ts', 'docs/FIREBASE-PUSH-SETUP.md'], String.raw`
actor User
participant "React push controls" as UI
participant "Authenticated subscription API" as API
database "Audit owned PushSubscriptions / PushJobs" as DB
participant PushQueueWorker as Worker
participant "Membership / identity ports" as Access
participant "Firebase Admin SDK / FCM" as FCM
participant "Browser service worker" as SW
User -> UI : enable push / grant browser permission
UI -> FCM : getToken with public VAPID key
UI -> API : register deviceId + token with JWT
API -> Access : determine current user / permitted audience
API -> DB : persist immutable device subscription
API --> UI : subscription ID only
UI -> SW : persist active subscription binding in IndexedDB
ref over API,DB : Domain Outbox handler commits notification + per-device jobs atomically
Worker -> DB : claim pending job / SKIP LOCKED / 2-minute lease
Worker -> Access : recheck current recipient permission
alt Expired / revoked device / access changed
 Worker -> DB : mark Expired or Cancelled
else Authorized
 Worker -> FCM : token + notificationId + subscriptionId + safe route
 alt Accepted
  Worker -> DB : mark Sent if lease still owned
  FCM -> SW : background data-only message
  SW -> SW : check active binding / display fixed generic text
 else Temporary error
  Worker -> DB : backoff / retry / dead letter after 8 attempts
 else Unregistered token
  Worker -> DB : disable subscription / dead letter
 end
end
User -> UI : logout
UI -> SW : clear active binding / suppress old-account delivery
UI -> API : revoke owned subscription
UI -> FCM : delete token
note over DB,FCM
 Queue is durable; Firebase acceptance is not proof of display.
 Crash redelivery is possible; notification tags replace visible duplicates.
 No document text, company names, scores or reviewer comments go to FCM.
end note
`);
fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(diagrams, null, 2) + '\n');
console.log(`Authored ${diagrams.length} PlantUML sources.`);

