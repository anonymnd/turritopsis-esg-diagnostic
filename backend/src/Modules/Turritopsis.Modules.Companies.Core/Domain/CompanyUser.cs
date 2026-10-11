using Turritopsis.Domain.Enums;

namespace Turritopsis.Domain.Entities;

public class CompanyUser
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid UserId { get; set; }
    public CompanyRole Role { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Company Company { get; set; } = null!;
}
