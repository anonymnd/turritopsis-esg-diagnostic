using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Common;
using Turritopsis.Application.Documents.Models;

namespace Turritopsis.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/documents")]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly ICurrentUserService _currentUser;

    public DocumentsController(IDocumentService documentService, ICurrentUserService currentUser)
    {
        _documentService = documentService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();

        var result = await _documentService.ListForUserAsync(userId, cancellationToken);
        return result.Access == MembershipAccess.Forbidden ? Forbid() : Ok(result.Documents);
    }

    [HttpPost]
    public async Task<IActionResult> Upload(UpsertDocumentRequest request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();

        DocumentResult result;
        try
        {
            result = await _documentService.UploadAsync(userId, request, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        return result.Access switch
        {
            MembershipAccess.Forbidden => Forbid(),
            _ => Ok(result.Document)
        };
    }

    [HttpDelete("{documentId:guid}")]
    public async Task<IActionResult> Delete(Guid documentId, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId) return Unauthorized();

        var access = await _documentService.DeleteAsync(userId, documentId, cancellationToken);
        return access switch
        {
            MembershipAccess.Forbidden => Forbid(),
            MembershipAccess.NotFound => NotFound(),
            _ => NoContent()
        };
    }
}
