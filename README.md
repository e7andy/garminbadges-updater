# garminbadges-updater

Chrome extension (v2.0) that syncs your badge and challenge data from Garmin Connect to [Garmin Badge Database](https://garminbadges.com/).

## How to use

1. Install the extension — see [Installation](#installation) below.
2. Sign in to [garminbadges.com](https://garminbadges.com), go to your **Dashboard** and copy your **API key**.
3. Click the extension icon → **Settings** and paste your API key.
4. Browse to [Garmin Connect](https://connect.garmin.com) and make sure you are logged in.
5. Click the extension icon → **Sync now**.

Progress is shown in real time. When finished, the popup displays added, updated, and unchanged counts, plus links to your Profile and Challenges pages.

## What it syncs

- All earned badges
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

## How to publish to the Chrome Web Store

1. Test locally and bump the `version` in `manifest.json`.
2. Zip the extension files — `manifest.json` must be at the zip root (not inside a subfolder).
3. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
4. Click the extension → **Package** → **Upload new package** → select your zip.

## Architecture

The extension injects `sync.js` into the active Garmin Connect tab when the user clicks **Sync now**. Running inside `connect.garmin.com`, the script can call Garmin's internal API endpoints directly using the user's existing browser session.

All calls to the garminbadges.com API are routed through the background service worker (`background.js`) to avoid mixed-content and CORS restrictions that apply to injected content scripts.

Authentication uses the `api_key` field from the user's Dashboard — not a Sanctum session token. The extension calls `GET /api/sync/whoami` to resolve the username and `POST /api/sync` to upload badge data.
