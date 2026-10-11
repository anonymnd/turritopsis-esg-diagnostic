using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Options;
using Turritopsis.Modules.Audit.Application;
namespace Turritopsis.Modules.Audit.Infrastructure;

public sealed class FirebasePushSender : IPushSender, IDisposable
{
    private readonly FirebaseOptions _options;
    private readonly SemaphoreSlim _initialization = new(1, 1);
    private FirebaseApp? _app;
    private FirebaseMessaging? _messaging;
    public bool Enabled => _options.Enabled;
    public FirebasePushSender(IOptions<FirebaseOptions> options) { _options = options.Value; }
    // Uses the real Admin SDK with an injectable transport in tests.
    public FirebasePushSender(FirebaseOptions options, FirebaseMessaging messaging) { _options = options; _messaging = messaging; }

    public async Task<PushSendResult> SendAsync(string token, Guid notificationId, Guid subscriptionId, bool reviewerInbox, CancellationToken ct)
    {
        if (!Enabled) return new(PushSendOutcome.Retry, "firebase-disabled");
        try
        {
            var messaging = await MessagingAsync(ct);
            await messaging.SendAsync(new Message
            {
                // The current Web Messaging SDK still registers via getToken; Admin accepts this target.
#pragma warning disable CS0618
                Token = token,
#pragma warning restore CS0618
                Data = new Dictionary<string, string> {
                    ["notificationId"] = notificationId.ToString(),
                    ["subscriptionId"] = subscriptionId.ToString(),
                    ["route"] = reviewerInbox ? "/reviewer" : "/app"
                },
                Webpush = new WebpushConfig { Headers = new Dictionary<string, string> { ["TTL"] = "86400", ["Urgency"] = "normal" } }
            }, ct);
            return new(PushSendOutcome.Sent);
        }
        catch (FirebaseMessagingException ex)
        {
            var outcome = ex.MessagingErrorCode switch
            {
                MessagingErrorCode.Unregistered => PushSendOutcome.InvalidSubscription,
                MessagingErrorCode.InvalidArgument or MessagingErrorCode.SenderIdMismatch => PushSendOutcome.PermanentFailure,
                _ => PushSendOutcome.Retry
            };
            return new(outcome, ex.MessagingErrorCode?.ToString() ?? ex.ErrorCode.ToString());
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex) { return new(PushSendOutcome.Retry, ex.GetType().Name); }
    }
    private async Task<FirebaseMessaging> MessagingAsync(CancellationToken ct)
    {
        if (_messaging is not null) return _messaging;
        await _initialization.WaitAsync(ct);
        try
        {
            if (_messaging is not null) return _messaging;
            GoogleCredential credential;
            if (!string.IsNullOrWhiteSpace(_options.CredentialsPath))
            {
                using var stream = File.OpenRead(_options.CredentialsPath);
                var account = ServiceAccountCredential.FromServiceAccountData(stream);
                if (account.ProjectId != _options.ProjectId) throw new InvalidOperationException("Firebase credential project mismatch");
                credential = GoogleCredential.FromServiceAccountCredential(account);
            }
            else credential = await GoogleCredential.GetApplicationDefaultAsync(ct);
            _app = FirebaseApp.Create(new AppOptions { ProjectId = _options.ProjectId, Credential = credential }, "turritopsis-push");
            _messaging = FirebaseMessaging.GetMessaging(_app);
            return _messaging;
        }
        finally { _initialization.Release(); }
    }
    public void Dispose() { _app?.Delete(); _initialization.Dispose(); }
}
