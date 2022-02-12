chrome.runtime.onMessage.addListener((request) => {
  console.log("Request", request);
  if (request.name === "showOptions") {
    chrome.runtime.openOptionsPage();
  } else if(request.name === "openGarminbadgesMainPage") {
    chrome.tabs.create({ url: "https://garminbadges.com/index.php?userId=" + request.userId });
  } else if(request.name === "openGarminbadgesChallengePage") {
    chrome.tabs.create({ url: "https://garminbadges.com/challenges.php?userId=" + request.userId });
  }
});


