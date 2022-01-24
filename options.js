let saveButton = document.getElementById("saveButton");

saveButton.addEventListener("click", handleButtonClick);

function handleButtonClick(event) {
  let username = document.getElementById("displayname");
  let email = document.getElementById("emailAddress");
  console.log("Save button clicked: " + username.value + " " + email.value);

  chrome.storage.sync.set({'username': username.value, 'email': email.value});

  //Write status to user
  //Close settings window?
}
