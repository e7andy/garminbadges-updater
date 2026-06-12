// content.js — injects a floating "Sync Badges" button into Garmin Connect
(function () {
  if (window.__gb_widget_injected) return;
  window.__gb_widget_injected = true;

  let host = null;

  function injectWidget() {
    if (host) return;

    host = document.createElement('div');
    host.id = 'gb-sync-widget-host';
    host.style.cssText = 'all: initial; position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;';
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .gb-widget { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
      .gb-row { display: flex; align-items: center; gap: 6px; }
      .gb-sync-btn {
        display: flex; align-items: center; gap: 7px;
        padding: 10px 16px;
        background: #1a1a1a; color: #fff;
        border: none; border-radius: 999px;
        font-size: 13px; font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        border-bottom: 3px solid #e53935;
        transition: opacity 0.15s, background 0.15s;
      }
      .gb-sync-btn:hover:not(:disabled) { opacity: 0.9; }
      .gb-sync-btn:disabled, .gb-sync-btn.syncing { background: #555; cursor: default; }
      .gb-dismiss-btn {
        display: flex; align-items: center; justify-content: center;
        width: 26px; height: 26px;
        background: #1a1a1a; color: #fff;
        border: none; border-radius: 50%;
        cursor: pointer;
        font-size: 14px; line-height: 1;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        opacity: 0.6;
        transition: opacity 0.15s;
      }
      .gb-dismiss-btn:hover { opacity: 1; }
      .gb-icon { width: 15px; height: 15px; flex-shrink: 0; }
      .gb-icon.spin { animation: gb-spin 1s linear infinite; }
      @keyframes gb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .gb-status {
        max-width: 260px;
        padding: 8px 12px;
        background: #fff; color: #333;
        border-radius: 8px;
        font-size: 12px; line-height: 1.5;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        text-align: left;
        word-wrap: break-word;
      }
      .gb-status.error { color: #c5221f; }
      .gb-status.done  { color: #1e8e3e; }
      .gb-status.hidden { display: none; }
      .gb-settings-link {
        display: block; margin-top: 4px;
        background: none; border: none; padding: 0;
        color: #e53935; font-size: 12px; font-weight: 600; cursor: pointer;
        text-decoration: underline;
        text-align: left;
      }
    `;
    shadow.appendChild(style);

    const wrap = document.createElement('div');
    wrap.className = 'gb-widget';
    wrap.innerHTML = `
      <div id="gb-status" class="gb-status hidden"></div>
      <div class="gb-row">
        <button id="gb-sync-btn" class="gb-sync-btn">
          <svg class="gb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 4v6h6M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          <span id="gb-btn-text">Sync Badges</span>
        </button>
        <button id="gb-dismiss-btn" class="gb-dismiss-btn" title="Hide this button (re-enable in Settings)">✕</button>
      </div>
    `;
    shadow.appendChild(wrap);

    const btn        = shadow.getElementById('gb-sync-btn');
    const btnText    = shadow.getElementById('gb-btn-text');
    const btnIcon    = shadow.querySelector('.gb-icon');
    const statusEl   = shadow.getElementById('gb-status');
    const dismissBtn = shadow.getElementById('gb-dismiss-btn');

    let hideTimer = null;

    function setSyncing(on) {
      btn.disabled = on;
      btn.classList.toggle('syncing', on);
      btnIcon.classList.toggle('spin', on);
      btnText.textContent = on ? 'Syncing…' : 'Sync Badges';
    }

    function showStatus(text, type = '') {
      clearTimeout(hideTimer);
      statusEl.replaceChildren();
      statusEl.className = `gb-status ${type}`;
      statusEl.appendChild(document.createTextNode(text));

      if (type === 'error' && /Open Settings/i.test(text)) {
        const link = document.createElement('button');
        link.className = 'gb-settings-link';
        link.textContent = 'Open Settings';
        link.addEventListener('click', () => {
          chrome.runtime.sendMessage({ type: 'openOptions' });
        });
        statusEl.appendChild(link);
      }
    }

    function hideStatusLater(delay = 5000) {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => statusEl.classList.add('hidden'), delay);
    }

    btn.addEventListener('click', () => {
      if (window.__gb_sync_running) return;
      chrome.runtime.sendMessage({ type: 'sync:reset' });
      setSyncing(true);
      showStatus('Starting sync…');
      chrome.runtime.sendMessage({ type: 'widget:sync' });
    });

    dismissBtn.addEventListener('click', () => {
      chrome.storage.sync.set({ showSyncButton: false });
    });

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'sync:progress') {
        showStatus(msg.text);
      } else if (msg.type === 'sync:done') {
        setSyncing(false);
        const r = msg.result || {};
        showStatus(`✓ Synced — ${r.added ?? 0} added, ${r.updated ?? 0} updated, ${r.unchanged ?? 0} unchanged`, 'done');
        hideStatusLater();
      } else if (msg.type === 'sync:error') {
        setSyncing(false);
        showStatus(msg.text, 'error');
      }
    });
  }

  function removeWidget() {
    if (!host) return;
    host.remove();
    host = null;
  }

  chrome.storage.sync.get({ showSyncButton: true }, ({ showSyncButton }) => {
    if (showSyncButton) injectWidget();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !('showSyncButton' in changes)) return;
    if (changes.showSyncButton.newValue) injectWidget();
    else removeWidget();
  });
})();
