using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Auth.Models;
using Turritopsis.SharedKernel;
namespace Turritopsis.Modules.Identity.Application;
public sealed class AuthService(IIdentityAccounts accounts,ICompanyRegistration companies,ICompanyDirectory directory,ITokenIssuer tokens,IEmailService email,FrontendOptions frontend) : IAuthService {
 public async Task<AuthResult> RegisterAsync(RegisterRequest request,CancellationToken ct) {
  if(await accounts.FindByEmailAsync(request.Email,ct) is not null)return AuthResult.Fail("Un compte existe deja avec cet email.");
  var created=await accounts.CreateAsync(request.Email,request.Password,ct);
  if(created.Account is null)return AuthResult.Fail(created.Errors);
  var companyId=await companies.CreateOwnedCompanyAsync(created.Account.Id,request.CompanyName,request.Sector,request.City,ct);
  var (token,expires)=tokens.Generate(created.Account,Array.Empty<string>());return AuthResult.Ok(token,expires,created.Account.Id,companyId);
 }
 public async Task<AuthResult> LoginAsync(LoginRequest request,CancellationToken ct) {
  var account=await accounts.FindByEmailAsync(request.Email,ct);
  if(account is null||!await accounts.CheckPasswordAsync(account,request.Password,ct))return AuthResult.Fail("Email ou mot de passe incorrect.");
  var roles=await accounts.GetRolesAsync(account,ct);var membership=await directory.FindMembershipAsync(account.Id,ct);var (token,expires)=tokens.Generate(account,roles);
  return AuthResult.Ok(token,expires,account.Id,membership?.CompanyId,roles);
 }
 public async Task RequestPasswordResetAsync(ForgotPasswordRequest request,CancellationToken ct) {
  var account=await accounts.FindByEmailAsync(request.Email,ct);if(account is null)return;
  var token=await accounts.CreateResetTokenAsync(account,ct);
  var link=$"{frontend.BaseUrl}/auth/reset-password?email={Uri.EscapeDataString(request.Email)}&token={Uri.EscapeDataString(token)}";
  var html=$"<p>Bonjour,</p><p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p><p><a href=\"{link}\">{link}</a></p><p>Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>";
  await email.SendAsync(request.Email,"Reinitialisation de votre mot de passe Turritopsis",html,ct);
 }
 public async Task<PasswordResetResult> ResetPasswordAsync(ResetPasswordRequest request,CancellationToken ct) {
  var account=await accounts.FindByEmailAsync(request.Email,ct);if(account is null)return PasswordResetResult.Fail("Lien invalide ou expire.");
  var errors=await accounts.ResetPasswordAsync(account,request.Token,request.NewPassword,ct);return errors.Length==0?PasswordResetResult.Ok():PasswordResetResult.Fail(errors);
 }
}
