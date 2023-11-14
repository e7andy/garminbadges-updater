let garminLoginButton = document.getElementById("garmin_login");
let updateMyDataButton = document.getElementById("update_my_data_button");

garminLoginButton.addEventListener("click", () => {
  window.open("https://connect.garmin.com/signin", "_blank");
});

updateMyDataButton.addEventListener("click", async () => {
  updateMyDataButton.textContent = "Wait...";
  updateMyDataButton.disabled = true;
  updateMyDataButton.style.background = 'gray';

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['functions.js', 'script_updatemydata.js'],
  });
});
