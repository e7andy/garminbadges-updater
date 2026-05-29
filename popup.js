const syncBtn       = document.getElementById('sync-btn');
const btnText       = document.getElementById('btn-text');
const statusDot     = document.getElementById('status-dot');
const statusText    = document.getElementById('status-text');
const logEl         = document.getElementById('log');
const resultEl      = document.getElementById('result');
const profileLinks  = document.getElementById('profile-links');
const linkProfile   = document.getElementById('link-profile');
const linkChallenges= document.getElementById('link-challenges');

const SITE = 'https://garminbadges.com';

function showProfileLinks(username) {
  if (!username) return;
  linkProfile.href    = `${SITE}/users/${username}`;
  linkChallenges.href = `${SITE}/users/${username}/challenges`;
  profileLinks.classList.remove('hidden');
}

// Load username on popup open — use cache if available, otherwise fetch directly from API
// (The popup runs in the extension context and can fetch any URL in host_permissions.)
async function loadUsername() {
  const { username } = await chrome.storage.local.get({ username: '' });
  if (username) { showProfileLinks(username); return; }

  const { apiKey, apiBase } = await chrome.storage.sync.get({
    apiKey: '', apiBase: 'https://api.garminbadges.com/api',
  });
  if (!apiKey) return;

  try {
    const resp = await fetch(`${apiBase}/sync/whoami`, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
    });
    if (resp.ok) {
      const user = await resp.json();
      const name = user.username ?? user.name ?? null;
      if (name) {
        await chrome.storage.local.set({ username: name });
        showProfileLinks(name);
      }
    } else if (resp.status === 401) {
      setStatus('error', 'Invalid API key — check Settings');
    }
  } catch (e) {
    // Network error — silently ignore, links just won't appear
  }
}

loadUsername();

function setStatus(state, text) {
  statusDot.className = `status-dot ${state}`;
  statusText.textContent = text;
}

function appendLog(text) {
  logEl.classList.remove('hidden');
  const line = document.createElement('div');
  line.className = 'log-line';
  line.textContent = text;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function makeResultRow(label, val, muted = false) {
  const row = document.createElement('div');
  row.className = muted ? 'result-row muted' : 'result-row';
  const l = document.createElement('span'); l.className = 'result-label'; l.textContent = label;
  const v = document.createElement('span'); v.className = 'result-val';   v.textContent = val;
  row.append(l, v);
  return row;
}

function showResult(result) {
  resultEl.classList.remove('hidden');
  resultEl.replaceChildren(
    makeResultRow('Added',     result.added     ?? 0),
    makeResultRow('Updated',   result.updated   ?? 0),
    makeResultRow('Unchanged', result.unchanged ?? 0),
    makeResultRow('Removed',   result.removed   ?? 0, true),
    ...(result.skipped ? [makeResultRow('Skipped', result.skipped, true)] : []),
  );
  if (result.username) showProfileLinks(result.username);
}

function setSyncing(on) {
  syncBtn.disabled = on;
  btnText.textContent = on ? 'Syncing…' : 'Sync now';
  syncBtn.classList.toggle('syncing', on);
}

function reset() {
  logEl.innerHTML = '';
  logEl.classList.add('hidden');
  resultEl.innerHTML = '';
  resultEl.classList.add('hidden');
  chrome.runtime.sendMessage({ type: 'sync:reset' });
}

// Restore state from background on open
chrome.runtime.sendMessage({ type: 'popup:getState' }, (state) => {
  if (!state) return;
  if (state.status === 'syncing') {
    setStatus('syncing', 'Syncing…');
    setSyncing(true);
    state.log.forEach(appendLog);
  } else if (state.status === 'done') {
    setStatus('done', 'Sync complete');
    state.log.forEach(appendLog);
    if (state.result) showResult(state.result);
  } else if (state.status === 'error') {
    setStatus('error', 'Sync failed');
    state.log.forEach(appendLog);
  }
});

// Listen for live messages during a sync
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'sync:progress') {
    setStatus('syncing', 'Syncing…');
    appendLog(msg.text);
  } else if (msg.type === 'sync:done') {
    setStatus('done', 'Sync complete');
    setSyncing(false);
    if (msg.result) showResult(msg.result);
  } else if (msg.type === 'sync:error') {
    setStatus('error', msg.text);
    setSyncing(false);
    appendLog(msg.text);
  }
});

// Sync button
syncBtn.addEventListener('click', async () => {
  reset();
  setStatus('syncing', 'Starting…');
  setSyncing(true);

  // Prefer the active tab; fall back to any open Garmin Connect tab
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let targetTab = activeTab?.url?.includes('connect.garmin.com') ? activeTab : null;

  if (!targetTab) {
    const garminTabs = await chrome.tabs.query({ url: '*://connect.garmin.com/*' });
    if (garminTabs.length > 0) {
      targetTab = garminTabs[0];
      appendLog('Using existing Garmin Connect tab…');
    }
  }

  if (!targetTab) {
    setStatus('error', 'Garmin Connect not open');
    appendLog('Open connect.garmin.com and log in, then try again.');
    setSyncing(false);
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: targetTab.id },
    files: ['sync.js'],
  });
});

// Settings button
document.getElementById('settings-btn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'openOptions' });
});
