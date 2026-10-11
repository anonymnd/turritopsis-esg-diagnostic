using Turritopsis.Application.Admin.Models;

namespace Turritopsis.Application.Abstractions;

public interface IAdminOverviewService
{
    Task<AdminOverviewDto> GetOverviewAsync(CancellationToken cancellationToken);
}
