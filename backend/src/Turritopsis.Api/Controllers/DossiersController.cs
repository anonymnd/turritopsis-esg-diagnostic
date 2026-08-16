using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Common;

namespace Turritopsis.Api.Controllers;

public record SubmitDossierRequest(int? DeclaredScore, int? ReviewedScore);
public record UpdateDossierRequest(string Status, int? FinalScore, string? Recommendations);
public record AddDossierNoteRequest(string? QuestionCode, string Text);

[ApiController]
[Authorize]
[Route("api/v1/dossiers")]
public class DossiersController : ControllerBase
{
    private static readonly string[] ReviewRoles = { "reviewer", "admin" };

    private readonly IDossierService _dossierService;
    private readonly IDocumentService _documentService;
    private readonly ICurrentUserService _currentUser;

    public DossiersController(IDossierService dossierService, IDocumentService documentService, ICurrentUserService currentUser)
    {
        _dossierService = dossierService;
        _documentService = documentService;
        _currentUser = currentUser;
    }

    private bool IsReviewer => _currentUser.Roles.Any(ReviewRoles.Contains);

    [HttpGet]
    public async Task<IActionResult> GetQueue(CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null) return Unauthorized();

        var result = await _dossierService.GetQueueAsync(IsReviewer, cancellationToken);
        return result.Access == MembershipAccess.Forbidden ? Forbid() : Ok(result.Dossiers);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();

        var result = await _dossierService.GetForCompanyOwnerAsync(userId, cancellationToken);
        return result.Access == MembershipAccess.Forbidden ? Forbid() : Ok(result.Dossier);
    }

    [HttpGet("{dossierId:guid}")]
    public async Task<IActionResult> GetById(Guid dossierId, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();

        var result = await _dossierService.GetByIdAsync(userId, IsReviewer, dossierId, cancellationToken);
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

        var result = await _dossierService.SubmitAsync(userId, request.DeclaredScore, request.ReviewedScore, cancellationToken);
        return result.Access == MembershipAccess.Forbidden ? Forbid() : Ok(result.Dossier);
    }

    [HttpPut("{dossierId:guid}")]
    public async Task<IActionResult> UpdateStatus(Guid dossierId, UpdateDossierRequest request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();
        if (!IsReviewer) return Forbid();

        var result = await _dossierService.UpdateStatusAsync(userId, dossierId, request.Status, request.FinalScore, request.Recommendations, cancellationToken);
        return result.Access switch
        {
            MembershipAccess.NotFound => NotFound(),
            MembershipAccess.Forbidden => Forbid(),
            _ => Ok(result.Dossier)
        };
    }

    [HttpGet("{dossierId:guid}/documents")]
    public async Task<IActionResult> GetDocuments(Guid dossierId, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();

        var result = await _documentService.ListForDossierAsync(userId, IsReviewer, dossierId, cancellationToken);
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

        var result = await _dossierService.GetNotesAsync(userId, IsReviewer, dossierId, cancellationToken);
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

        var access = await _dossierService.AddNoteAsync(userId, IsReviewer, dossierId, request.QuestionCode, request.Text, cancellationToken);
        return access switch
        {
            MembershipAccess.NotFound => NotFound(),
            MembershipAccess.Forbidden => Forbid(),
            _ => NoContent()
        };
    }
}
