namespace Turritopsis.Application.Abstractions;

public interface IEmailService
{
    Task SendAsync(string to, string subject, string html, CancellationToken cancellationToken);
}
