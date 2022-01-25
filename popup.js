let updateButton = document.getElementById("update_button");

// When the button is clicked, inject updatescript.js into current page
updateButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['updatescript.js'],
  });
});