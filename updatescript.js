function isEmpty(str) {
  return !str.trim().length;
}

function isOptionsValid(username, email) {
  return !(isEmpty(username) || isEmpty(email));
}

function openOptionsPage() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
}

async function updateButtonClicked() {

  let username;
  let email;

  chrome.storage.sync.get({
    username: '',
    email: ''
  }, async function(data) {
    username = data.username;
    email = data.email;

    if(!isOptionsValid(username, email)) {
      openOptionsPage();
    } else {
      //TODO: Fetch update key for username and email from garminbadges.com
      const userJson = {
        "username": username,
        "email": email
      }
      console.log("Fetch update key for: ", userJson);
      const gbUserResponse = await fetch('https://garminbadges.com/api/test.php', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userJson)
      });
      const gbUserContent = await gbUserResponse.json();
      console.log("GB user response: ", gbUserContent);
      let updateKey = "1234567-example";

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
      const strippedGarminEarnedJson = createGarminBadgesJson(garminEarnedJson, updateKey);

      //Send new earned json to garminbadges.com
      //TODO: garminbadges.com returns with an array of badgeIds to fetch from Garmin
      console.log("Send stripped earned json to garminbadges.com");
      const gbEarnedResponse = await fetch('https://garminbadges.com/api/test.php', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(strippedGarminEarnedJson)
      });
      const gbEarnedContent = await gbEarnedResponse.json();
      console.log("GB earned response: ", gbEarnedContent);

      //Fetch badge data for each badgeId
      const testBadgeIdsToFetch = [1439, 1440, 1441];
      const garminBadgeJsonArray = await fetchBadgesFromGarmin(testBadgeIdsToFetch);

      //Create new badge json
      const garminBadgeJson = createGarminBadgesJson(garminBadgeJsonArray, updateKey);

      //TODO: Send new badge json to garminbadges.com
      console.log("Send badge json to garminbadges.com");
      const gbBadgeResponse = await fetch('https://garminbadges.com/api/test.php', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(garminBadgeJson)
      });
      const gbBadgeContent = await gbBadgeResponse.json();

      alertUser("Garminbadges.com is now updated with your data.");
    }
  });
}

async function fetchBadgesFromGarmin(badgeIdArray) {
  let badgeJson = [];
  for (const id of badgeIdArray) {
    const garminBadgeResponse = await fetch('https://connect.garmin.com/modern/proxy/badge-service/badge/detail/v2/' + id, {
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

function createGarminBadgesJson(json, updateKey) {
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
    "updateKey": updateKey,
    "badges": newJson
  }
  return newJson;
}

function isOnGarminConnect() {
  let hostname = window.location.hostname.toLowerCase();
  return hostname.search("connect.garmin.com") >= 0;
}

function alertUser(msg) {
  alert("Garmin Badges\n" + msg);
}

if(isOnGarminConnect()) {
  updateButtonClicked();  
} else {
  alertUser("Go to Garmin Connect and log in before you click the button.");
}

