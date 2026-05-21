function restore() {
  chrome.storage.sync.get({ apiKey: '', apiBase: 'https://api.garminbadges.com/api' }, (data) => {
    document.getElementById('apiKey').value   = data.apiKey;
    document.getElementById('apiBase').value  = data.apiBase;
  });
}

function save() {
  const apiKey  = document.getElementById('apiKey').value.trim();
  const apiBase = document.getElementById('apiBase').value.trim() || 'https://api.garminbadges.com/api';
  const status  = document.getElementById('save-status');

  if (!apiKey) {
    status.textContent = 'API key is required';
    status.className = 'save-status error';
    return;
  }

  chrome.storage.sync.set({ apiKey, apiBase }, () => {
    status.textContent = 'Saved';
    status.className = 'save-status success';
    setTimeout(() => { status.textContent = ''; status.className = 'save-status'; }, 2000);
  });
}

document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save-btn').addEventListener('click', save);
