# FantasyEAi Android release

Status (2026-10-09): Android source and packaging workflow prepared; NOT submission-ready. No Play listing, signing key, native build/device test, or production deployment has been completed.

## Package and build

Capacitor 8 bundles the frontend; it does not load a remote server.url. Application ID is `com.fantasyeai.app`, based on the existing domain; confirm before first Play upload. Debug installs use `com.fantasyeai.app.dev`. Minimum Android API is 24; target/compile API is 36; minimum WebView is 107. Java 21 and Android SDK 36 are required.

Internet is the only permission. Cleartext traffic, mixed content, release WebView debugging and Android backups are disabled.

Copy `native.env.example` to `.env.native.local`, fill the three public Base44 routing identifiers, then run `npm ci`, `npm run lint`, `npm test`, and `npm run android:debug`. Never put service-role credentials in VITE variables. Build fails if backend configuration is absent. Install `android/app/build/outputs/apk/debug/app-debug.apk` on a test device.

Alternatively, configure the `Android Development` GitHub environment with the three variables. Once this workflow is reviewed and present on the clone’s default branch, manually run `Android package` with the desired branch selected. It builds an APK artifact; it does not publish or deploy the website.

## Confirmed blockers

- Base44 lists separate app IDs: FantasyEAi `6aa483eab525018797301877` and Clonefantasyeai- `6abaaaa2d6934c0fe0e75a02`. Their backend origins, Git connections and data separation remain unverified. Confirm CORS/auth supports the packaged `https://localhost` origin. Web API routing remains same-origin.
- Existing Base44 provider login redirects window.location. Google OAuth cannot run inside an embedded WebView. Implement and verify a supported system-browser sign-in and secure Base44 callback/session exchange before release; opening a browser alone does not transfer login back to the app. Test email/password, registration/OTP, recovery and app relaunch too.
- `deleteMyAccount` deletes selected records but only attempts User deletion. Identity, linked leagues, conversations, uploads and processor-held data require an ownership/deletion audit. The UI now reports failure when app user-record deletion is not confirmed; complete identity and related-data deletion is still unverified. Do not test deletion on production users.
- Publish an accurate privacy policy and public account-deletion request page. Confirm retention, processors, analytics, AI handling and support contact. No unsupported legal promises have been drafted.
- Complete Play Data safety, app-access instructions, content rating, target audience, ads declaration and store assets using actual behavior. Review the new vector launcher mark and supply final store artwork before release. Review billing policy if digital purchases are introduced; a Stripe dependency does not prove payments are active.
- This workspace has Java 17 but no Android SDK/emulator or signing key, so native compilation and real-device compatibility are unverified. Existing repository-wide type-check failures remain.

## Device verification

Record device model, Android and WebView versions. Test a physical Android device and API 36 emulator: login/recovery, keyboard and back, open drawers, orientation/large text, offline recovery, file input, account switching, search filters, tab query parameters, trade picks and fresh data. Test drawer at 767px and desktop dropdown at 768px. Review the Play pre-launch report.

## Signed bundle

Use Play App Signing and securely retain an upload key outside Git. Configure `Android Release` environment secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Its routing variables must identify the verified release backend.

Record actual test evidence in `review.json` only after completion. `npm run release:check` blocks incomplete release preparation. `npm run android:bundle` builds with signing environment variables locally; the manual workflow's release variant produces a signed AAB artifact. It does not upload to Google Play. Each upload requires a higher versionCode; the workflow uses its run number, so coordinate local uploads.

Upload to internal testing first. Qualifying new personal developer accounts require 12 testers opted in continuously for 14 days before applying for production access. Account verification, terms and factual declarations need the account owner.

## Primary references

- https://support.google.com/googleplay/android-developer/answer/11926878
- https://capacitorjs.com/docs/getting-started/environment-setup
- https://developers.google.com/identity/protocols/oauth2/policies
- https://support.google.com/googleplay/android-developer/answer/13327111
- https://support.google.com/googleplay/android-developer/answer/14151465
