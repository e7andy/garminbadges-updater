function isEmpty(str) {
    return !str.trim().length;
}

function updateStatus(msg) {
  var status = document.getElementById('status');
  status.textContent = msg;
  setTimeout(function() {
    status.textContent = '';
  }, 1500);
}

const isValidEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

function save_options() {
  var username = document.getElementById('displayname').value;
  var email = document.getElementById('emailAddress').value;

  //Validate input
  if(isEmpty(username) || isEmpty(email)) {
    updateStatus("All fields are required.")
    return;
  } else if(!isValidEmail(email)) {
    updateStatus("Not a valid email address.")
    return;
  }

  chrome.storage.sync.set({
    username: username,
    email: email
  }, function() {
    // Update status to let user know options were saved.
    updateStatus("Options saved.");
  });

  /*chrome.storage.sync.set({
    username: '',
    email: ''
  }, function() {
    // Update status to let user know options were saved.
    updateStatus("Options saved.");
  });*/
}

function restore_options() {
  chrome.storage.sync.get({
    username: '',
    email: ''
  }, function(data) {
    document.getElementById('displayname').value = data.username;
    document.getElementById('emailAddress').value = data.email;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('saveButton').addEventListener('click', save_options);
