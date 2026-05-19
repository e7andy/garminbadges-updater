// Open the update page on install or upgrade.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    chrome.tabs.create({ url: chrome.runtime.getURL('update.html') });
  }
});

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

// Respond to popup state requests and proxy API fetches from content scripts.
// Background service workers can fetch any URL (no mixed-content or CORS restrictions).
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'popup:getState') {
    sendResponse(syncState);
    return true;
  }

  if (msg.type === 'fetch') {
    fetch(msg.url, {
      method:  msg.method || 'GET',
      headers: msg.headers || {},
      body:    msg.body   || undefined,
    })
      .then(async r => {
        const data = await r.json().catch(() => null);
        sendResponse({ ok: r.ok, status: r.status, data });
      })
      .catch(err => sendResponse({ ok: false, status: 0, error: err.message }));
    return true; // keep channel open for async response
  }
});
