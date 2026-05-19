# garminbadges-updater

Chrome extension that syncs your badge and challenge data from Garmin Connect to [Garmin Badge Database](https://garminbadges.com/).

## How to use

1. Install the extension from the [Chrome Web Store](https://chrome.google.com/webstore/detail/leapndollacahbkeedifbljmamdfljna).
2. Sign in to [garminbadges.com](https://garminbadges.com), go to your **Dashboard** and copy your **API key**.
3. Click the extension icon → **Settings** and paste your API key.
4. Browse to [Garmin Connect](https://connect.garmin.com) and make sure you are logged in.
5. Click the extension icon → **Sync now**.

Progress is shown in real time. When finished, the popup displays added, updated, and unchanged counts.

## What it syncs

- All earned badges
- Active (joined, not yet completed) challenges with current progress
- Ongoing repeatable badge progress

## How to test locally

1. In Chrome go to **Settings → Extensions → Manage Extensions**.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.
4. Disable the production extension so only the local version is active.
5. Pin the local extension to the toolbar for easy access.

To point the extension at a local backend, open **Settings** and change the API URL to `http://localhost:8000/api`.

## How to publish to the Chrome Web Store

1. Test locally.
2. Update the `version` in `manifest.json`.
3. Zip the files (not the folder — `manifest.json` must be at the zip root).
4. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
5. Click the extension → **Package** → **Upload new package** → select your zip file.