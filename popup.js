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

// Load stored username immediately on popup open
chrome.storage.local.get({ username: '' }, ({ username }) => {
  if (username) showProfileLinks(username);
});

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

function showResult(result) {
  resultEl.classList.remove('hidden');
  resultEl.innerHTML = `
    <div class="result-row"><span class="result-label">Added</span><span class="result-val">${result.added ?? 0}</span></div>
    <div class="result-row"><span class="result-label">Updated</span><span class="result-val">${result.updated ?? 0}</span></div>
    <div class="result-row"><span class="result-label">Unchanged</span><span class="result-val">${result.unchanged ?? 0}</span></div>
    ${result.skipped ? `<div class="result-row muted"><span class="result-label">Skipped</span><span class="result-val">${result.skipped}</span></div>` : ''}
  `;
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

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const onGarmin = tab?.url?.includes('connect.garmin.com');

  if (!onGarmin) {
    setStatus('error', 'Not on Garmin Connect');
    appendLog('Navigate to connect.garmin.com and log in, then try again.');
    setSyncing(false);
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['sync.js'],
  });
});

// Settings button
document.getElementById('settings-btn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'openOptions' });
});
