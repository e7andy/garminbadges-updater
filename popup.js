// Initialize butotn with users's prefered color
let updateButton = document.getElementById("update_button");

let username;
let email;

// When the button is clicked, inject updateData into current page
updateButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: updateButtonClicked,
  });
});

// The body of this function will be execuetd as a content script inside the
// current page
async function updateButtonClicked() {
  const isEmpty = (str) => {
    return !str.trim().length;
  };

  async function updateData() {
    const setStatus = (msg) => {
      var status = document.getElementById("update_button");
      console.log("status", status);
      status.textContent = msg;
      setTimeout(function() {
        status.textContent = 'Update';
      }, 1500);
    };

    console.log("Call garmin.com with fetch for: " + username + ", " + email);
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

    setStatus("Done");
  }

  let username;
  let email;

  chrome.storage.sync.get({
    username: '',
    email: ''
  }, function(data) {
    username = data.username;
    email = data.email;

    if(isEmpty(username) || isEmpty(email)) {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options.html'));
      }
    } else {
      updateData();
    }
  });
}
