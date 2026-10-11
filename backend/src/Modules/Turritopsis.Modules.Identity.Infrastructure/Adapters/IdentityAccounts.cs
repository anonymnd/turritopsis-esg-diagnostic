using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Turritopsis.Infrastructure.Identity;
using Turritopsis.SharedKernel;
namespace Turritopsis.Modules.Identity.Infrastructure;
internal sealed class IdentityAccounts(UserManager<ApplicationUser> users,RoleManager<IdentityRole<Guid>> roles,ILogger<IdentityAccounts> logger) : IIdentityAccounts,IIdentityBootstrap {
 private static Account Map(ApplicationUser user)=>new(user.Id,user.Email??string.Empty);
 private async Task<ApplicationUser> Resolve(Account account)=>await users.FindByIdAsync(account.Id.ToString())??throw new InvalidOperationException("Account no longer exists.");
 public async Task<Account?> FindByEmailAsync(string email,CancellationToken ct){var u=await users.FindByEmailAsync(email);return u is null?null:Map(u);}
 public async Task<AccountCreation> CreateAsync(string email,string password,CancellationToken ct){var u=new ApplicationUser{UserName=email,Email=email};var r=await users.CreateAsync(u,password);return new(r.Succeeded?Map(u):null,r.Errors.Select(e=>e.Description).ToArray());}
 public async Task<bool> CheckPasswordAsync(Account a,string password,CancellationToken ct)=>await users.CheckPasswordAsync(await Resolve(a),password);
 public async Task<IReadOnlyList<string>> GetRolesAsync(Account a,CancellationToken ct)=>(await users.GetRolesAsync(await Resolve(a))).ToArray();
 public async Task<string> CreateResetTokenAsync(Account a,CancellationToken ct)=>await users.GeneratePasswordResetTokenAsync(await Resolve(a));
 public async Task<string[]> ResetPasswordAsync(Account a,string token,string password,CancellationToken ct)=>(await users.ResetPasswordAsync(await Resolve(a),token,password)).Errors.Select(e=>e.Description).ToArray();
 public async Task<bool> AddRoleAsync(Account a,string role,CancellationToken ct)=>(await users.AddToRoleAsync(await Resolve(a),role)).Succeeded;
 public async Task<bool> RemoveRoleAsync(string email,string role,CancellationToken ct){var u=await users.FindByEmailAsync(email);return u is not null&&await users.IsInRoleAsync(u,role)&&(await users.RemoveFromRoleAsync(u,role)).Succeeded;}
 public async Task<IReadOnlyList<Account>> ListInRoleAsync(string role,CancellationToken ct)=>(await users.GetUsersInRoleAsync(role)).OrderBy(u=>u.Email).Select(Map).ToList();
 public async Task InitializeAsync(string? email,string? password,CancellationToken ct){
  foreach(var role in new[]{"reviewer","admin"})if(!await roles.RoleExistsAsync(role))await roles.CreateAsync(new IdentityRole<Guid>(role));
  if(string.IsNullOrWhiteSpace(email)||string.IsNullOrWhiteSpace(password))return;
  var user=await users.FindByEmailAsync(email);
  if(user is not null&&!await users.IsInRoleAsync(user,"admin")){logger.LogWarning("Admin seed email belongs to a non-admin account; refusing promotion.");return;}
  if(user is null){var created=await CreateAsync(email,password,ct);if(created.Account is null){logger.LogWarning("Admin seed account creation failed.");return;}await AddRoleAsync(created.Account,"admin",ct);}
 }
}
