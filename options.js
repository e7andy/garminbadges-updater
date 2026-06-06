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

const DEFAULT_API_BASE = 'https://api.garminbadges.com/api';

document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save-btn').addEventListener('click', save);

document.getElementById('reset-api-url').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('apiBase').value = DEFAULT_API_BASE;
});

document.getElementById('toggleApiKey').addEventListener('click', () => {
  const input   = document.getElementById('apiKey');
  const eyeOn   = document.getElementById('eye-icon');
  const eyeOff  = document.getElementById('eye-off-icon');
  const visible = input.classList.toggle('visible');
  eyeOn.style.display  = visible ? 'none'  : '';
  eyeOff.style.display = visible ? ''      : 'none';
});
