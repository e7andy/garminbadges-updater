// sync.js — injected into the Garmin Connect page context
(async function () {
  if (window.__gb_sync_running) return;
  window.__gb_sync_running = true;

  function send(type, data = {}) {
    try { chrome.runtime.sendMessage({ type, ...data }); } catch (_) {}
  }

  function progress(text) { send('sync:progress', { text }); }
  function done(result)   { send('sync:done',     { result }); window.__gb_sync_running = false; }
  function fail(text)     { send('sync:error',    { text });   window.__gb_sync_running = false; }

  // ── Config ──────────────────────────────────────────────────────────────────

  const opts = await chrome.storage.sync.get({
    apiKey:  '',
    apiBase: 'https://garminbadges.com/api',
  });

  if (!opts.apiKey) {
    fail('No API key set. Open Settings and enter your API key from the dashboard.');
    return;
  }

  // ── CSRF token ──────────────────────────────────────────────────────────────

  const csrfMeta = document.querySelector("meta[name='_token']")
                || document.querySelector("meta[name='csrf-token']");
  if (!csrfMeta) {
    fail('Could not find session token. Make sure you are logged in to Garmin Connect.');
    return;
  }
  const csrfToken = csrfMeta.content;

  // ── Garmin Connect fetch helper ──────────────────────────────────────────────

  async function garminGet(path, params = {}) {
    const url = new URL('https://connect.garmin.com/gc-api' + path);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const resp = await fetch(url.href, {
      headers: {
        'Accept':              'application/json',
        'di-backend':          'connectapi.garmin.com',
        'nk':                  'NT',
        'connect-csrf-token':  csrfToken,
      },
    });
    if (!resp.ok) throw new Error(`Garmin API error: ${resp.status} ${resp.statusText}`);
    return resp.json();
  }

  // ── Main sync ────────────────────────────────────────────────────────────────

  try {
    // 1. Earned badges
    progress('Fetching earned badges…');
    const earned = await garminGet('/badge-service/badge/earned');
    progress(`Found ${earned.length} earned badge records`);

    // 2. Non-completed challenges
    progress('Fetching active challenges…');
    let challenges = [];
    try {
      const raw = await garminGet('/badgechallenge-service/badgeChallenge/non-completed', {
        desc: 'true', start: 1, includeExclusive: 'true', limit: 10000,
      });
      challenges = Array.isArray(raw) ? raw : (raw?.badgeChallengeList ?? []);
      progress(`Found ${challenges.length} active challenges`);
    } catch (_) {
      progress('Could not fetch challenges — skipping');
    }

    // 3. Determine which badges need a v3 detail fetch
    const earnedIds    = new Set(earned.map(b => b.badgeId).filter(Boolean));
    const challengeIds = new Set(challenges.map(c => c.badgeId).filter(Boolean));
    const relevantIds  = new Set(challengeIds);

    try {
      const resp = await new Promise(resolve =>
        chrome.runtime.sendMessage({ type: 'fetch', url: `${opts.apiBase}/badges` }, resolve)
      );
      if (resp?.ok) {
        for (const b of resp.data) {
          if (earnedIds.has(b.id) && !b.end_date && b.target_value !== null && b.repeatable) {
            relevantIds.add(b.id);
          }
        }
      }
    } catch (_) {}

    // 4. Fetch v3 details in parallel
    const details = {};
    if (relevantIds.size > 0) {
      progress(`Fetching progress for ${relevantIds.size} badges…`);
      await Promise.all([...relevantIds].map(async (id) => {
        try { details[id] = await garminGet(`/badge-service/badge/detail/v3/${id}`); } catch (_) {}
      }));
    }

    // 5. Map to schema
    const records = [];
    const seen    = new Set();

    // Earned records
    for (const b of earned) {
      const badgeId = b.badgeId;
      if (!badgeId) continue;
      const num = parseInt(b.earnedNumber) || 1;
      const key = `${badgeId}:${num}`;
      if (seen.has(key)) continue;
      seen.add(key);
      records.push({
        badge_id:       badgeId,
        earned_number:  num,
        earned_date:    b.badgeEarnedDate   || null,
        progress_value: b.badgeProgressValue ?? null,
        assoc_type_id:  b.badgeAssocTypeId  ?? null,
        assoc_data_id:  b.badgeAssocDataId  ? String(b.badgeAssocDataId) : null,
        create_date:    b.badgeCreateDate || b.badgeEarnedDate || null,
      });
    }

    // In-progress records from v3 detail
    for (const [idStr, detail] of Object.entries(details)) {
      const badgeId  = parseInt(idStr);
      const progress = detail.badgeProgressValue;
      if (progress == null) continue;
      const target   = detail.badgeTargetValue;
      const earnedDate = detail.badgeEarnedDate;
      if (earnedDate && target != null && parseFloat(progress) >= parseFloat(target)) continue;
      const lastNum  = parseInt(detail.badgeEarnedNumber) || 0;
      const num      = lastNum + 1;
      const key      = `${badgeId}:${num}`;
      if (seen.has(key)) continue;
      seen.add(key);
      records.push({
        badge_id:       badgeId,
        earned_number:  num,
        earned_date:    null,
        progress_value: progress,
        assoc_type_id:  detail.badgeAssocTypeId ?? null,
        assoc_data_id:  detail.badgeAssocDataId ? String(detail.badgeAssocDataId) : null,
        create_date:    detail.createDate || null,
      });
    }

    // Challenge records (joined, not earned)
    const earnedBadgeIds = new Set(records.map(r => r.badge_id));
    for (const c of challenges) {
      const badgeId = c.badgeId;
      if (!badgeId || earnedBadgeIds.has(badgeId)) continue;
      const key = `${badgeId}:1`;
      if (seen.has(key)) continue;
      seen.add(key);
      records.push({
        badge_id:       badgeId,
        earned_number:  1,
        earned_date:    null,
        progress_value: c.userProfileBadgeProgressValue ?? c.badgeProgressValue ?? c.progressValue ?? 0,
        assoc_type_id:  c.badgeAssocTypeId ?? null,
        assoc_data_id:  null,
        create_date:    c.joinDateLocal || c.createDate || null,
      });
    }

    // 6. Upload via background (avoids mixed-content block on HTTPS pages)
    progress(`Uploading ${records.length} records…`);

    function bgFetch(url, method, headers, body) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'fetch', url, method, headers, body }, resolve);
      });
    }

    const authHeaders = {
      'Authorization': `Bearer ${opts.apiKey}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
    };

    const upload = await bgFetch(
      `${opts.apiBase}/sync`, 'POST', authHeaders,
      JSON.stringify({ user_badges: records })
    );

    if (!upload.ok) {
      if (upload.status === 401) fail('Invalid API key. Check your key in Settings.');
      else if (upload.status === 422) fail('Validation error — check your API key and try again.');
      else if (upload.status === 0) fail(`Could not reach ${opts.apiBase}. Check the API URL in Settings.`);
      else fail(`Upload failed (${upload.status}). Please try again.`);
      return;
    }

    // Fetch username so the popup can link to the profile and challenges pages
    let username = null;
    try {
      const userResp = await bgFetch(`${opts.apiBase}/user`, 'GET', {
        'Authorization': `Bearer ${opts.apiKey}`, 'Accept': 'application/json',
      });
      if (userResp.ok) username = userResp.data?.username ?? userResp.data?.name ?? null;
    } catch (_) {}

    done({ ...upload.data, username });

  } catch (err) {
    fail(err.message || 'An unexpected error occurred.');
  }
})();
