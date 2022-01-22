// Initialize butotn with users's prefered color
let changeColor = document.getElementById("changeColor");

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});

// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: setPageBackgroundColor,
  });
});

// The body of this function will be execuetd as a content script inside the
// current page
async function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;
  });


  console.log("Call garmin.com with fetch");
  const garminResponse = await fetch('https://connect.garmin.com/modern/proxy/badge-service/badge/earned', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'nk': 'NT'
    },
  });
  const garminContent = await garminResponse.json();
  console.log("Garmin",garminContent, garminResponse);


  console.log("Call garminbadges.com");
  const gbResponse = await fetch('https://garminbadges.com/api/test.php', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(garminContent)
  });
  const gbContent = await gbResponse.json();

  console.log("GB",gbContent);
}
