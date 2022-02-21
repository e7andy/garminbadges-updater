function isEmpty(str) {
  return !str.trim().length;
}

function isOptionsValid(username, email) {
  return !(isEmpty(username) || isEmpty(email));
}

function openOptionsPage() {
    const msg = {
    'name': 'showOptions'
  };
  chrome.runtime.sendMessage(msg);
}

function openGarminbadgesMainPage(userId) {
  const msg = {
    'name': 'openGarminbadgesMainPage',
    'userId': userId
  };
  chrome.runtime.sendMessage(msg);
}

function openGarminbadgesChallengePage(userId) {
  const msg = {
    'name': 'openGarminbadgesChallengePage',
    'userId': userId
  };
  chrome.runtime.sendMessage(msg);
}

async function updateButtonClicked() {

  let username;
  let email;
  let password;
  let shouldOpenGarminbadgesMainPage;
  let shouldOpenGarminbadgesChallengePage;
  let shouldShowSuccessfulAlert;

  chrome.storage.sync.get({
    username: '',
    email: '',
    password: '',
    shouldOpenGarminbadgesMainPage: true,
    shouldOpenGarminbadgesChallengePage: false,
    shouldShowSuccessfulAlert: true
  }, async function(data) {
    username = data.username;
    email = data.email;
    shouldOpenGarminbadgesMainPage = data.shouldOpenGarminbadgesMainPage;
    shouldOpenGarminbadgesChallengePage = data.shouldOpenGarminbadgesChallengePage;
    shouldShowSuccessfulAlert = data.shouldShowSuccessfulAlert;

    if(!isOptionsValid(username, email)) {
      openOptionsPage();
    } else {

      //Fetch update key for username and email from garminbadges.com
      const gbUserResponse = await fetch('https://garminbadges.com/api/index.php/user/updatekey?username='+username+'&email='+email, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      const gbUserContent = await gbUserResponse.json();
      if(gbUserContent.error) {
        alertUser("Garminbadges could not handle your request. Did you use the correct username and email in the extension options?");
        throw new Error("Error: Fetch of user data failed.");
      }
      let update_key = gbUserContent.update_key;
      let userId = gbUserContent.id;

      //Fetch earned json from Garmin
      const garminEarnedResponse = await fetch('https://connect.garmin.com/modern/proxy/badge-service/badge/earned', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'nk': 'NT'
        },
      }).catch((error) => {
        alertUser("Fetching badge data failed. Are you logged in to Garmin Connect?");
        throw new Error("Error: Fetch of badge data failed.");
      });
      const garminEarnedJson = await garminEarnedResponse.json();

      //Create new earned json
      const strippedGarminEarnedJson = createGarminBadgesJson(garminEarnedJson, update_key);

      //Send new earned json to garminbadges.com
      //garminbadges.com returns with an array of badgeIds to fetch from Garmin
      const gbEarnedResponse = await fetch('https://garminbadges.com/api/index.php/user/earned', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(strippedGarminEarnedJson)
      });
      const gbBadgesToFetch = await gbEarnedResponse.json();

      //Fetch badge data for each badgeId
      const badgeIdsToFetch = gbBadgesToFetch;
      const garminBadgeJsonArray = await fetchBadgesFromGarmin(badgeIdsToFetch);

      //Create new badge json
      const garminBadgeJson = createGarminBadgesJson(garminBadgeJsonArray, update_key);

      //Send new badge json to garminbadges.com
      const gbBadgeResponse = await fetch('https://garminbadges.com/api/index.php/user/challenges', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(garminBadgeJson)
      });
      const gbBadgeContent = await gbBadgeResponse.json();

      if(shouldShowSuccessfulAlert) {
        alertUser("Garminbadges.com is now updated with your data.");
      }

      if(shouldOpenGarminbadgesMainPage) {
        openGarminbadgesMainPage(userId);
      }
      if(shouldOpenGarminbadgesChallengePage) {
        openGarminbadgesChallengePage(userId);
      }

      console.log("INFO: Garminbadges.com is updated with your data from Garmin Connect.");
    }
  });
}

async function fetchBadgesFromGarmin(badgeIdArray = []) {
  let badgeJson = [];
  for (const item of badgeIdArray) {
    const garminBadgeResponse = await fetch('https://connect.garmin.com/modern/proxy/badge-service/badge/detail/v2/' + item.badgeNo, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'nk': 'NT'
      },
    });
    const garminBadgeJson = await garminBadgeResponse.json();
    badgeJson.push(garminBadgeJson);
  }
  return badgeJson;
}

function createGarminBadgesJson(json = [], update_key = '') {
  let newJson = [];
    
  const unitArray = {
    1: "mi_km",
    2: "ft_m",
    3: "activities",
    4: "days",
    5: "steps",
    6: "mi",
    7: "seconds"
  };

  json.forEach((badge) => {
    const newBadge = {
      "badgeId": badge.badgeId,
      "badgeName": badge.badgeName,
      "count": badge.badgeEarnedNumber,
      "earned_date": badge.badgeEarnedDate,
      "badgeProgressValue": badge.badgeProgressValue,
      "badgeTargetValue": badge.badgeTargetValue,
      "badgeUnit": unitArray[badge.badgeUnitId]
    }
    newJson.push(newBadge);
  });

  newJson = {
    "update_key": update_key,
    "badges": newJson
  }
  return newJson;
}

function isOnGarminConnect() {
  let hostname = window.location.hostname.toLowerCase();
  return hostname.search("connect.garmin.com") >= 0;
}

function alertUser(msg = 'Sorry! Something went wrong. Try again. Contact garminbadges.com if issue persists.') {
  alert("Garmin Badges\n" + msg);
}
