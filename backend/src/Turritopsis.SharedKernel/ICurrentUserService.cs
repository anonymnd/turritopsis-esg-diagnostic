namespace Turritopsis.Application.Abstractions;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    IReadOnlyList<string> Roles { get; }
}
