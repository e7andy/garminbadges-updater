// Open the update page on install or upgrade.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    chrome.tabs.create({ url: chrome.runtime.getURL('update.html') });
  }
});

// Sync state — persists while the service worker is alive.
let syncState = { status: 'idle', log: [], result: null };

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // ── Sync state updates (from injected content script) ──────────────────────
  if (msg.type === 'sync:progress') {
    syncState = { status: 'syncing', log: [...syncState.log, msg.text].slice(-20), result: null };
    return;
  }
  if (msg.type === 'sync:done') {
    syncState = { status: 'done', log: syncState.log, result: msg.result };
    return;
  }
  if (msg.type === 'sync:error') {
    syncState = { status: 'error', log: [...syncState.log, msg.text], result: null };
    return;
  }
  if (msg.type === 'sync:reset') {
    syncState = { status: 'idle', log: [], result: null };
    return;
  }

  // ── Popup requests ─────────────────────────────────────────────────────────
  if (msg.type === 'popup:getState') {
    sendResponse(syncState);
    return true;
  }

  if (msg.type === 'openOptions') {
    chrome.runtime.openOptionsPage();
    return;
  }

  // ── Fetch proxy (used by injected content scripts for cross-origin calls) ──
  if (msg.type === 'fetch') {
    const ALLOWED_HOSTS = ['garminbadges.com', 'localhost'];
    let urlHost;
    try { urlHost = new URL(msg.url).hostname; } catch { urlHost = ''; }
    if (!ALLOWED_HOSTS.some(h => urlHost === h || urlHost.endsWith('.' + h))) {
      sendResponse({ ok: false, status: 0, error: 'URL not in allowlist' });
      return true;
    }

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
