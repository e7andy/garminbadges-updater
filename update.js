// Update this list before cutting each release to describe what changed.
// Shown only to users who already have the extension configured — new users
// get the onboarding steps instead, since a changelog means nothing to them yet.
const CHANGES = [
  'Fixed repeatable badges (e.g. Challenge Champ) sometimes being saved twice, with another earn going missing, when several earns share the same timestamp.',
  'Badges that have reached their earn limit (e.g. 250) no longer show a phantom "next" in-progress entry.',
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
