// Relay sync messages to the popup and store current sync state.
let syncState = { status: 'idle', log: [], result: null };

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'sync:progress') {
    syncState = { status: 'syncing', log: [...syncState.log, msg.text].slice(-20), result: null };
  } else if (msg.type === 'sync:done') {
    syncState = { status: 'done', log: syncState.log, result: msg.result };
  } else if (msg.type === 'sync:error') {
    syncState = { status: 'error', log: [...syncState.log, msg.text], result: null };
  } else if (msg.type === 'sync:reset') {
    syncState = { status: 'idle', log: [], result: null };
  } else if (msg.type === 'popup:getState') {
    return true; // async response below
  } else if (msg.type === 'openOptions') {
    chrome.runtime.openOptionsPage();
  }
});

// Respond to popup state requests
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'popup:getState') {
    sendResponse(syncState);
    return true;
  }
});
