// Update this list before cutting each release to describe what changed.
// Shown only to users who already have the extension configured — new users
// get the onboarding steps instead, since a changelog means nothing to them yet.
const CHANGES = [
  'The spinner in the FAB (floation action button) now spins in the correct direction.',
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
