# Firebase push notifications and the persistent delivery queue

Implementation is ready, but live delivery is disabled until a Firebase project is configured. A local Firebase CLI/Google Cloud login is not available in this workspace. No Firebase project, service account or production deployment was created by this change.

## Create and connect your Firebase project

1. Open the [Firebase console](https://console.firebase.google.com/) with your Google account and create a project. Analytics is optional for this application; Firebase Authentication and Firestore are not needed.
2. Register a Web app in Project settings > General. Copy its public web configuration: apiKey, authDomain, projectId, messagingSenderId and appId.
3. In Project settings > Cloud Messaging > Web configuration, generate a Web Push certificate key pair and copy its **public VAPID key**. Ensure the Firebase Cloud Messaging HTTP v1 API is enabled for this project. Follow the [official Web setup](https://firebase.google.com/docs/cloud-messaging/js/client).
4. In Project settings > Service accounts, generate a private service-account key for this project. Store the JSON outside the repository, for example `C:\Users\PC\.secrets\turritopsis-firebase-service-account.json`. Do not paste its private key in chat, put it in frontend variables or commit it. Server Application Default Credentials can also be used instead of a file.
5. Merge these public values into `frontend/.env.local` (keep its existing API base URL):

```dotenv
VITE_API_BASE_URL=http://localhost:5006/api/v1
VITE_FIREBASE_API_KEY=YOUR_PUBLIC_WEB_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_WEB_APP_ID
VITE_FIREBASE_VAPID_KEY=YOUR_PUBLIC_VAPID_KEY
```

6. Merge this section into the existing `backend/src/Turritopsis.Api/appsettings.Development.json`; keep the database/JWT settings intact:

```json
{
  "Firebase": {
    "Enabled": true,
    "ProjectId": "YOUR_PROJECT",
    "CredentialsPath": "C:\\Users\\PC\\.secrets\\turritopsis-firebase-service-account.json"
  }
}
```

Environment-variable equivalents are `Firebase__Enabled`, `Firebase__ProjectId`, and `Firebase__CredentialsPath`. If CredentialsPath is absent, the server uses Google Application Default Credentials. When a service-account file is supplied, its project ID must match the configured project ID. Use a service account allowed to send FCM messages in that project; see the [Admin SDK setup](https://firebase.google.com/docs/admin/setup).

7. Restart both API and frontend (`npm run dev:api`, `npm run dev`). The frontend start/build scripts bundle the Firebase service worker, including the public configuration. Do not edit generated `frontend/public/firebase-messaging-sw.js` directly. Changing Firebase frontend environment values requires rebuilding/restarting the worker too.
8. Log in, open **Notifications**, click **Activer les notifications push**, and accept the browser permission prompt. Click **Tester les push**: this queues a notification for your own registered browser. Repeat on a reviewer account to receive submission alerts. After a real review decision/comment, the company receives an alert.

The app must be served over HTTPS in production. Browsers treat loopback/localhost as a secure context for local development. Permission/support, background execution and platform restrictions affect actual receipt; completely terminating or disabling the browser's background process can prevent delivery. Check the [official background/foreground handling guide](https://firebase.google.com/docs/cloud-messaging/js/receive).

For the existing Vercel frontend, configure the public `VITE_FIREBASE_*` variables there and rebuild. For Render, configure the server Firebase variables and mount the service-account JSON as a secret file (typically `/etc/secrets/firebase-service-account.json`). Keep `VITE_API_BASE_URL` pointed to the production API. The code changes and migrations have only been applied locally.

## Delivery architecture

`Dossier domain event -> Reviews Outbox -> Audit handler -> Notifications + NotificationPushJobs -> PushQueueWorker -> Firebase Admin SDK -> browser service worker / foreground listener`.

Audit, the internal notification and per-device push jobs commit in one Audit transaction. The event/subscription unique key prevents replay from creating duplicate jobs. PostgreSQL is the durable queue: no in-memory-only job list, Redis or separate broker is required.

Queue jobs are claimed with `FOR UPDATE SKIP LOCKED` and a two-minute lease. Temporary errors retry with persisted exponential backoff, up to eight application attempts. Jobs expire 24 hours after the event; permanent/exhausted errors are retained as DeadLetter. Unregistered Firebase tokens deactivate their subscriptions. Expired leases survive worker restarts. Firebase being disabled leaves jobs pending without making provider calls.

Before each send the worker rereads the user's account, reviewer roles/company membership and subscription state. A revoked device or changed audience cancels the queued job. Registration uses the authenticated user's access and never accepts a client-supplied company or user ID. Tokens have one active owner/device binding. Token replacement creates a new subscription and deactivates the old one; pending jobs for the old subscription are cancelled instead of being redirected.

Delivery is **at least once**, not exactly once. A crash after Firebase accepts a message but before the queue acknowledgement may send it again. Browser notifications use the notification ID as their tag to replace an existing visible duplicate. Sent counts mean Firebase accepted the send; they do not prove the browser displayed it. The internal inbox remains the authoritative notification record.

## Privacy and browser lifecycle

Firebase receives the device registration token plus a data-only payload containing **notificationId, subscriptionId and route**. The browser displays fixed generic text. No company name, document content, filenames, ESG answers/scores, reviewer comments/recommendations or account email are sent to Firebase.

The IndexedDB binding allows display only for the current browser subscription. Logout removes that binding, revokes the user's server subscription and deletes the Firebase token. Messages already in transit for an old account are suppressed, including clicks on old notifications. Foreground receipt refreshes the internal inbox immediately; the 20-second polling remains as fallback. Permission is requested only after clicking the enable button; previously approved subscriptions refresh their token/binding on reload.

Push subscriptions contain FCM tokens in the server database, so protect database backups and access as you do other application data. Queue rows and failure logs contain job IDs and error categories, without tokens, provider response bodies or credentials. Firebase is used only for Cloud Messaging; no Analytics, Authentication or Firestore code is initialized. Firebase JS's unused Firestore dependency brings grpc transitively; a compatible patched grpc override avoids the current dependency advisory without downgrading Firebase.

The current Web SDK uses `getToken`; Firebase Admin's token target remains supported but is marked deprecated in favor of FIDs. The single token assignment has a documented, scoped warning suppression. Update the browser registration and sender together when adopting Firebase's FID registration flow.

## API and operation

All routes require the application's JWT:

| Route | Purpose |
|---|---|
| GET `/api/v1/notifications/push/status` | Whether server push delivery is enabled |
| POST `/api/v1/notifications/push/subscriptions` | Register `{ deviceId, token }` for the authenticated account |
| GET/DELETE `/api/v1/notifications/push/subscriptions/{id}` | Check/revoke only your own subscription |
| POST `/api/v1/notifications/push/subscriptions/{id}/test` | Queue your own device test; one per minute per API instance |
| GET `/api/v1/notifications/push/queue` | Admin-only counts and the latest 20 dead-letter jobs; no tokens |
| POST `/api/v1/notifications/push/queue/{id}/retry` | Admin-only retry of an unexpired dead-letter job |

The admin overview shows queue status and a retry button. Registration is limited per account per API instance. Those request limits are in memory; durable jobs and worker leases are shared in PostgreSQL across API instances. No automatic deletion/retention cleanup is configured for subscription or queue history.

Migration `AddFirebasePushQueue` adds `PushSubscriptions` and `NotificationPushJobs`, owned by the Audit/Notifications module. Existing tables/documents remain intact.

## Verification

`npm run check` runs architecture checks, builds, lint, existing AI privacy checks, module wiring and frontend push tests. `npm run test:modules:db` with a disposable PostgreSQL connection checks transactional enqueue rollback, event replay, parallel workers, leases/retries/dead letters, expiry, invalid tokens, revoked roles, changed company membership and authenticated endpoint boundaries. The real Firebase Admin SDK serializes through a captured HTTP handler; test tokens/credentials are fictional and no Firebase calls leave the test process. Browser logic tests cover consent, logout, cross-account suppression and safe notification clicks.

A real end-to-end browser/FCM delivery test is still required after the project, service account and VAPID key are configured.
