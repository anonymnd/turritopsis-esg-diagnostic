using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Admin.Models;
using Turritopsis.SharedKernel;
namespace Turritopsis.Modules.Administration.Application;
public sealed class AdminUsersService(IIdentityAccounts accounts,IAuditTrail audit) : IAdminUsersService {
 public async Task<CreateReviewerResult> CreateReviewerAsync(Guid actorId,CreateReviewerRequest request,CancellationToken ct){
  if(await accounts.FindByEmailAsync(request.Email,ct) is not null)return CreateReviewerResult.Fail("Un compte existe deja avec cet email.");
  var created=await accounts.CreateAsync(request.Email,request.Password,ct);if(created.Account is null)return CreateReviewerResult.Fail(created.Errors);
  if(!await accounts.AddRoleAsync(created.Account,"reviewer",ct))return CreateReviewerResult.Fail("Impossible d'attribuer le role reviseur.");
  await audit.WriteAsync(actorId,null,"reviewer_created",ct);return CreateReviewerResult.Ok(created.Account.Id);
 }
 public async Task<IReadOnlyList<ReviewerDto>> GetReviewersAsync(CancellationToken ct)=>(await accounts.ListInRoleAsync("reviewer",ct)).Select(a=>new ReviewerDto(a.Id,a.Email)).ToList();
 public Task<bool> RemoveRoleAsync(string email,string role,CancellationToken ct)=>role is "reviewer" or "admin"?accounts.RemoveRoleAsync(email,role,ct):Task.FromResult(false);
}
