using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Turritopsis.Application.Abstractions;

namespace Turritopsis.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/companies")]
public class CompaniesController : ControllerBase
{
    private readonly ICompanyService _companyService;
    private readonly ICurrentUserService _currentUser;

    public CompaniesController(ICompanyService companyService, ICurrentUserService currentUser)
    {
        _companyService = companyService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is not { } userId)
        {
            return Unauthorized();
        }

        var company = await _companyService.GetForUserAsync(userId, cancellationToken);
        return company is null ? NotFound() : Ok(company);
    }
}
