# garminbadges-updater

Updates [Garmin Badge Database](https://garminbadges.com/) with your badge and challenge data from Garmin Connect.

## How to use
1. Install the extension from [Chrome Web Store](https://chrome.google.com/webstore/detail/leapndollacahbkeedifbljmamdfljna).
2. Enter username and email address for your garminbadges.com account in the extension options.
3. Browse to Garmin Connect (https://connect.garmin.com) and login.
4. Click the extension to display the Update button.
5. Click the Update button and wait until you get the message that the update is finished.

Every time you got updated badge or challenge data in Garmin Connect you just press the Update button and Garmin Badge Database will be updated with your latest data.

## How to test and debug
1. Go to [Chrome Extension](chrome://extensions/)
2. Click Load Unpacked
3. Select the local folder with the extension code
4. Disable the production extension to hide it from Chrome
5. Pin the local extension to make it visiable in the extension bar

## How to publish in the Chrome Web Store
1. Test the extension locally.
2. Review the manifest and set the new version.
3. Zip the files (not the folder) and make sure the manifest is in the root.
4. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
5. Sign in to the developer account.
6. Click the **extension** to update > **Package** menu item > **Upload new package** button.
7. Click Choose file > your zip file > Upload. If your item's manifest and ZIP file are valid, you can edit your item on the next page.
