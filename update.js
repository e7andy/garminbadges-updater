// Update this list before cutting each release to describe what changed.
// Shown only to users who already have the extension configured — new users
// get the onboarding steps instead, since a changelog means nothing to them yet.
const CHANGES = [
  'Badge catalogue sync now includes expired/retired badges',
  'Fixes historical repeat-earn dates going missing for badges whose earning window has closed',
];

document.getElementById('title').textContent =
  `Extension updated to v${chrome.runtime.getManifest().version}`;

const list = document.getElementById('changes-returning');
for (const text of CHANGES) {
  const item = document.createElement('div');
  item.className = 'change-item';
  item.textContent = text;
  list.appendChild(item);
}

chrome.storage.sync.get({ apiKey: '' }, ({ apiKey }) => {
  document.getElementById('returning-user').hidden = !apiKey;
  document.getElementById('new-user').hidden = !!apiKey;
});
