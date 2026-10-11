using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Common;

namespace Turritopsis.Api.Controllers;

public record SubmitDossierRequest(int? DeclaredScore, int? ReviewedScore);
public record UpdateDossierRequest(string Status, int? FinalScore, string? Recommendations, Guid? RevisionId = null);
public record AddDossierNoteRequest(string? QuestionCode, string Text, Guid? RevisionId = null);

[ApiController]
[Authorize]
[Route("api/v1/dossiers")]
public class DossiersController : ControllerBase
{
    private static readonly string[] ReviewRoles = { "reviewer", "admin" };

    private readonly IDossierQueries _queries;
    private readonly IDossierCommands _commands;
    private readonly IDocumentService _documentService;
    private readonly ICurrentUserService _currentUser;

    public DossiersController(IDossierQueries queries, IDossierCommands commands, IDocumentService documentService, ICurrentUserService currentUser)
    {
        _queries = queries;
        _commands = commands;
        _documentService = documentService;
        _currentUser = currentUser;
    }

    private bool IsReviewer => _currentUser.Roles.Any(ReviewRoles.Contains);

    [HttpGet]
    public async Task<IActionResult> GetQueue([FromQuery] bool all, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null) return Unauthorized();

        var result = await _queries.GetQueueAsync(IsReviewer, all, cancellationToken);
        return result.Access == MembershipAccess.Forbidden ? Forbid() : Ok(result.Dossiers);
    }

    [HttpGet("history")]
    public async Task<IActionResult> History(CancellationToken ct) {
        if(_currentUser.UserId is not { } userId)return Unauthorized();
        var result=await _queries.GetHistoryAsync(userId,ct);
        return result.Access==MembershipAccess.Forbidden?Forbid():Ok(result.Dossiers);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();

        var result = await _queries.GetForCompanyOwnerAsync(userId, cancellationToken);
        return result.Access switch
        {
            MembershipAccess.Forbidden => Forbid(),
            MembershipAccess.Invalid => BadRequest(new { error = result.Error }),
            MembershipAccess.Conflict => Conflict(new { error = result.Error }),
            _ => Ok(result.Dossier)
        };
    }

    [HttpGet("{dossierId:guid}")]
    public async Task<IActionResult> GetById(Guid dossierId, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();

        var result = await _queries.GetByIdAsync(userId, IsReviewer, dossierId, cancellationToken);
        return result.Access switch
        {
            MembershipAccess.Forbidden => Forbid(),
            MembershipAccess.NotFound => NotFound(),
            _ => Ok(result.Dossier)
        };
    }

    [HttpPost]
    public async Task<IActionResult> Submit(SubmitDossierRequest request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();

        var result = await _commands.SubmitAsync(userId, request.DeclaredScore, request.ReviewedScore, cancellationToken);
        return result.Access switch
        {
            MembershipAccess.Forbidden => Forbid(),
            MembershipAccess.Invalid => BadRequest(new { error = result.Error }),
            MembershipAccess.Conflict => Conflict(new { error = result.Error }),
            _ => Ok(result.Dossier)
        };
    }

    [HttpPut("{dossierId:guid}")]
    public async Task<IActionResult> UpdateStatus(Guid dossierId, UpdateDossierRequest request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();
        if (!IsReviewer) return Forbid();

        var result = await _commands.UpdateStatusAsync(userId, dossierId, request.Status, request.FinalScore, request.Recommendations, cancellationToken, request.RevisionId);
        return result.Access switch
        {
            MembershipAccess.NotFound => NotFound(),
            MembershipAccess.Forbidden => Forbid(),
            MembershipAccess.Invalid => BadRequest(new { error = result.Error }),
            MembershipAccess.Conflict => Conflict(new { error = result.Error }),
            _ => Ok(result.Dossier)
        };
    }

    [HttpGet("{dossierId:guid}/revisions")]
    public async Task<IActionResult> Revisions(Guid dossierId,CancellationToken ct) {
        if(_currentUser.UserId is not { } userId)return Unauthorized();
        var result=await _queries.GetRevisionsAsync(userId,IsReviewer,dossierId,ct);
        return result.Access switch {MembershipAccess.Forbidden=>Forbid(),MembershipAccess.NotFound=>NotFound(),_=>Ok(result.Revisions)};
    }
    [HttpGet("{dossierId:guid}/revisions/{revisionId:guid}")]
    public async Task<IActionResult> Revision(Guid dossierId,Guid revisionId,CancellationToken ct) {
        if(_currentUser.UserId is not { } userId)return Unauthorized();
        var result=await _queries.GetRevisionsAsync(userId,IsReviewer,dossierId,ct);
        if(result.Access==MembershipAccess.Forbidden)return Forbid();
        var row=result.Revisions.SingleOrDefault(x=>x.Id==revisionId);
        return row is null?NotFound():Ok(row);
    }
    [HttpGet("{dossierId:guid}/revisions/{revisionId:guid}/documents/{itemId:guid}")]
    public async Task<IActionResult> FrozenDocument(Guid dossierId,Guid revisionId,Guid itemId,CancellationToken ct) {
        if(_currentUser.UserId is not { } userId)return Unauthorized();
        var result=await _documentService.GetFrozenDetailAsync(userId,IsReviewer,dossierId,revisionId,itemId,ct);
        return result.Access switch {MembershipAccess.Forbidden=>Forbid(),MembershipAccess.NotFound=>NotFound(),_=>Ok(result.Document)};
    }
    [HttpGet("{dossierId:guid}/documents")]
    public async Task<IActionResult> GetDocuments(Guid dossierId, CancellationToken cancellationToken, [FromQuery] Guid? revisionId = null)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();

        var result = await _documentService.ListForDossierAsync(userId, IsReviewer, dossierId, cancellationToken, revisionId);
        return result.Access switch
        {
            MembershipAccess.NotFound => NotFound(),
            MembershipAccess.Forbidden => Forbid(),
            _ => Ok(result.Documents)
        };
    }

    [HttpGet("{dossierId:guid}/notes")]
    public async Task<IActionResult> GetNotes(Guid dossierId, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();

        var result = await _queries.GetNotesAsync(userId, IsReviewer, dossierId, cancellationToken);
        return result.Access switch
        {
            MembershipAccess.NotFound => NotFound(),
            MembershipAccess.Forbidden => Forbid(),
            _ => Ok(result.Notes)
        };
    }

    [HttpPost("{dossierId:guid}/notes")]
    public async Task<IActionResult> AddNote(Guid dossierId, AddDossierNoteRequest request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();

        var access = await _commands.AddNoteAsync(userId, IsReviewer, dossierId, request.QuestionCode, request.Text, cancellationToken, request.RevisionId);
        return access switch
        {
            MembershipAccess.NotFound => NotFound(),
            MembershipAccess.Forbidden => Forbid(),
            MembershipAccess.Invalid => BadRequest(new { error = "Commentaire vide ou trop long." }),
            MembershipAccess.Conflict => Conflict(new { error = "Le dossier est verrouille ou a ete modifie. Rechargez-le." }),
            _ => NoContent()
        };
    }
}
