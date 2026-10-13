# Deployment guide

## Local or static deployment

1. Install Node.js 22.12 or later and run `npm ci`.
2. Run `npm test` (separate valuation suite).
3. Run `npm run build` (TypeScript + Vite), then upload `dist/` to a static HTTPS host. Relative assets support subdirectory hosting.
4. For local development, `npm run dev` starts Vite.

Without `.env.local`, all local features operate and Firebase sign-in is explicitly disabled. Data is stored per browser/origin. A hosted demo is not a live Firebase deployment.

## Connect Firebase

1. Create/select your own Firebase project and register a Web App in its console.
2. Enable Authentication → Google provider. Configure the support email and authorized domains for your actual deployment and localhost as appropriate.
3. Create a Cloud Firestore database. Review `firestore.rules`; never deploy test-mode open rules.
4. Copy `.env.example` to `.env.local` and fill the four `VITE_FIREBASE_*` values from the registered web app. Do not put admin credentials or private keys in Vite environment variables.
5. Install the Firebase CLI with `npm install -g firebase-tools`; run `firebase login` and select your project with `firebase use --add`.
6. Run `npm ci`, `npm test`, and `npm run build`.
7. Deploy with `firebase deploy --only firestore:rules,hosting --project YOUR_PROJECT_ID`.
8. Add the actual hosted domain to Authentication authorized domains. Sign in using the app's Settings tab.
9. For an existing cloud workspace, **Load cloud** before saving. For a new cloud workspace, use **Save to cloud**. The app will not overwrite a newer revision silently.

## Required deployment acceptance checks

These checks require your configured project and were not run here:

- Google sign-in/out on the deployed authorized domain.
- Save, refresh, sign in and load the exact workspace.
- Two-tab stale-revision conflict; the second stale save must be rejected.
- Unauthenticated access and a different UID cannot read/write another user's document.
- Firestore emulator tests for ownership, schema constraints and revision checks before production use.
- A backup export/import round trip and CSV opening in your target spreadsheet application.
- Desktop (1440×1000) and phone (390×844) navigation, dialogs, horizontal table scroll, keyboard focus, and no console errors.

## GitHub Pages

This repository publishes through `.github/workflows/pages.yml`. In Settings → Pages, the source is **GitHub Actions**. Each push to `main` runs `npm ci`, the separate valuation tests, and the TypeScript/Vite production build before deploying `dist/`. A failed test or build blocks that deployment. The workflow can also be run manually from Actions.

The public demo runs in browser-local mode. The workflow currently does not supply Firebase configuration; enable it only after configuring your project and authorized domains as described above. The code uses relative asset URLs so it works under the repository's Pages subdirectory.

The original private Sites deployment is separate. Its hosting identity was intentionally omitted from this portable GitHub repository.

## Browser data and operations

Back up JSON before switching domains or clearing browser data. Signing out does not erase local inventory. Keep the report end date aligned with your movements. Use a new exported ledger for a new reporting period; automated close/reopen and cross-period returns are outside this MVP.

## Build size

The production bundle includes Firebase Authentication and Firestore and may trigger Vite's >500 KB chunk advisory. This is a performance advisory, not a build failure. It is an optimization candidate before a large public launch.
