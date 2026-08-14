using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Auth.Models;
using Turritopsis.Domain.Entities;
using Turritopsis.Domain.Enums;
using Turritopsis.Infrastructure.Identity;
using Turritopsis.Infrastructure.Persistence;

namespace Turritopsis.Infrastructure.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly TurritopsisDbContext _db;
    private readonly JwtTokenGenerator _tokenGenerator;

    public AuthService(UserManager<ApplicationUser> userManager, TurritopsisDbContext db, JwtTokenGenerator tokenGenerator)
    {
        _userManager = userManager;
        _db = db;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
        {
            return AuthResult.Fail("Un compte existe deja avec cet email.");
        }

        var user = new ApplicationUser { UserName = request.Email, Email = request.Email };
        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            return AuthResult.Fail(createResult.Errors.Select(e => e.Description).ToArray());
        }

        // Signup always creates the company in the same step, with the
        // signer-upper as owner — there's no "join later" path for owners.
        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = request.CompanyName,
            Sector = request.Sector,
            City = request.City,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.Companies.Add(company);
        _db.CompanyUsers.Add(new CompanyUser
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            UserId = user.Id,
            Role = CompanyRole.Owner,
            CreatedAt = DateTimeOffset.UtcNow
        });
        await _db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var (token, expiresAt) = _tokenGenerator.Generate(user, Array.Empty<string>());
        return AuthResult.Ok(token, expiresAt, user.Id, company.Id);
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            return AuthResult.Fail("Email ou mot de passe incorrect.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var companyId = await _db.CompanyUsers
            .Where(cu => cu.UserId == user.Id)
            .Select(cu => (Guid?)cu.CompanyId)
            .FirstOrDefaultAsync(cancellationToken);

        var (token, expiresAt) = _tokenGenerator.Generate(user, roles);
        return AuthResult.Ok(token, expiresAt, user.Id, companyId);
    }
}
