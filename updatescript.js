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

function updateButtonClicked() {

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
      console.log("Fetch update key for: " + username + ", " + email);

      //TODO: Fetch earned json from Garmin
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
      console.log("Garmin - earned json: ",JSON.stringify(garminEarnedJson));

      //TODO: Create new earned json
      const strippedGarminEarnedJson = stripEarnedJson(garminEarnedJson);
      console.log("Garmin - stripped earned json: ",JSON.stringify(strippedGarminEarnedJson));

      //TODO: Send new earned json to garminbadges.com
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

      //TODO: Fetch badge data for each badgeId
      const garminBadgeJsonArray = []; //<--- This array will hold each reply

      //TODO: Create new badge json
      const garminBadgeJson = createBadgeJson(garminBadgeJsonArray);

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
      console.log("GB badge response: ",gbBadgeContent);

      //TODO: Done!
      console.log("Done!");
      alertUser("Garminbadges.com is now updated with your data.");
    }
  });
}

function stripEarnedJson(json) {
  //TODO
  return json;
}

function createBadgeJson(json) {
  //TODO
  return json;
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

