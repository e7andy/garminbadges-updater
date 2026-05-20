# garminbadges-updater

Chrome extension that syncs your badge and challenge data from Garmin Connect to [Garmin Badge Database](https://garminbadges.com/).

## How to use

1. Install the extension — see [Installation](#installation) below.
2. Sign in to [garminbadges.com](https://garminbadges.com), go to your **Dashboard** and copy your **API key**.
3. Click the extension icon → **Settings** and paste your API key.
4. Browse to [Garmin Connect](https://connect.garmin.com) and make sure you are logged in.
5. Click the extension icon → **Sync now**.

Progress is shown in real time. When finished, the popup displays added, updated, and unchanged counts, plus links to your Profile and Challenges pages.

## What it syncs

- All earned badges (including repeat counts for repeatable badges)
- Active (joined, not yet completed) challenges with current progress
- Ongoing repeatable badge progress

## Installation

The extension is not yet on the Chrome Web Store. Install it manually:

1. Download **garminbadges-updater.zip** from the [Garmin Badge Database sync page](https://garminbadges.com/upload) and unzip it.
2. In Chrome go to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked** and select the unzipped folder.
5. Pin the extension to your toolbar for easy access.

## Settings

Open the extension and click **Settings**:

| Setting | Description |
|---------|-------------|
| **API key** | Your personal key from the [Dashboard](https://garminbadges.com/dashboard). Required. |
| **API URL** | Backend URL. Default: `https://garminbadges.com/api`. Change to `http://localhost:8000/api` for local development. |

## How to test locally

1. In Chrome go to **Settings → Extensions → Manage Extensions**.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select this repo folder.
4. Disable the production extension so only the local version is active.
5. Open the extension **Settings** and set the API URL to `http://localhost:8000/api`.
6. Set your API key from `http://localhost:4200/dashboard`.

## How to publish a new release

Releases are automated. Pushing to `main` triggers the **Release Extension** GitHub Actions workflow, which reads the version from `manifest.json`, auto-increments the patch, commits the updated manifest back, and publishes a GitHub release with the packaged zip. The next garminbadges frontend build will automatically fetch the new zip and serve it at `/tools/garminbadges-updater.zip`.

**To release a new version:**

1. Test locally.
2. Update `update.html` with the new version number and release notes.
3. Push to `main` — the CI handles versioning, packaging, and the GitHub release automatically.

To release a specific version (e.g. a minor or major bump) instead of a patch increment, trigger the workflow manually from **Actions → Release Extension → Run workflow** and enter the version number.

**To submit to the Chrome Web Store:**

1. Download the zip from the [latest GitHub release](../../releases/latest).
2. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Click the extension → **Package** → **Upload new package** → select the zip.

## Architecture

The extension injects `sync.js` into the active Garmin Connect tab when the user clicks **Sync now**. Running inside `connect.garmin.com`, the script can call Garmin's internal API endpoints directly using the user's existing browser session.

All calls to the garminbadges.com API are routed through the background service worker (`background.js`) to avoid mixed-content and CORS restrictions that apply to injected content scripts. The background worker only forwards requests to an allowlisted set of domains (`garminbadges.com`, `localhost`).

Authentication uses the `api_key` field from the user's Dashboard — not a Sanctum session token. The extension calls `GET /api/sync/whoami` to resolve the username and `POST /api/sync` to upload badge data.

### Repeat badge counts

The authoritative repeat count comes from the `badgeEarnedNumber` field in Garmin's `badge/earned` endpoint response (not `earnedNumber`, which is often 1 and unreliable). The sync script reads `badgeEarnedNumber` and falls back to `earnedNumber` only if the former is absent.
