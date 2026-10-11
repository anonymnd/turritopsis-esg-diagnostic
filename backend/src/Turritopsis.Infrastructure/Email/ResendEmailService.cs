using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Turritopsis.Application.Abstractions;

namespace Turritopsis.Infrastructure.Email;

// Calls Resend directly over HTTP. Email delivery is best effort.
public class ResendEmailService : IEmailService
{
    private readonly HttpClient _http;
    private readonly EmailOptions _options;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(HttpClient http, IOptions<EmailOptions> options, ILogger<ResendEmailService> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
        _http.BaseAddress = new Uri("https://api.resend.com/");
    }

    public async Task SendAsync(string to, string subject, string html, CancellationToken cancellationToken)
    {
        if (!_options.Enabled || string.IsNullOrEmpty(_options.ApiKey) || string.IsNullOrWhiteSpace(to))
        {
            return;
        }

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post, "emails")
            {
                Content = JsonContent.Create(new { from = _options.FromAddress, to, subject, html })
            };
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _options.ApiKey);

            var response = await _http.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Email send to {To} failed with status {Status}: {Body}", to, response.StatusCode, body);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Email send to {To} threw", to);
        }
    }
}
