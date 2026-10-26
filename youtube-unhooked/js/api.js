// Data layer with three-tier fallback: live API → local cache → sample data.
// Every call returns { data, source }, where source is 'live' | 'cache' | 'mock'.

const KEY_STORE = 'uh:keys';
const CACHE_PREFIX = 'uh:cache:';

export function getKeys() {
  try { return JSON.parse(localStorage.getItem(KEY_STORE)) || {}; } catch { return {}; }
}
export function setKeys(k) { localStorage.setItem(KEY_STORE, JSON.stringify(k)); }

export const sourceLog = {}; // latest status per source, shown in the settings panel
function mark(name, source) {
  sourceLog[name] = source;
  document.dispatchEvent(new CustomEvent('uh:source', { detail: { name, source } }));
}

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
function cacheGet(id) {
  try { return JSON.parse(localStorage.getItem(CACHE_PREFIX + id)); } catch { return null; }
}
function cacheSet(id, data) {
  try { localStorage.setItem(CACHE_PREFIX + id, JSON.stringify(data)); } catch { /* storage full — skip */ }
}
export function clearCache() {
  Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX)).forEach(k => localStorage.removeItem(k));
}

// Try live; on failure fall back to cache, then to sample data
async function tiered(name, cacheId, liveFn, mockFn, timeout = 9000) {
  const keys = getKeys();
  if (!keys.offline) {
    try {
      const data = await withTimeout(liveFn(), timeout);
      cacheSet(cacheId, data);
      mark(name, 'live');
      return { data, source: 'live' };
    } catch (e) {
      console.warn(`[${name}] live failed:`, e.message);
    }
  }
  const cached = cacheGet(cacheId);
  if (cached) { mark(name, 'cache'); return { data: cached, source: 'cache' }; }
  const data = await mockFn();
  mark(name, 'mock');
  return { data, source: 'mock' };
}
function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}
async function getJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${r.status} ${url.split('?')[0]}`);
  return r.json();
}

// ---------- YouTube Data API v3 ----------
export async function ytSearch(params, mockFn) {
  const id = 'yt:' + hash(JSON.stringify(params));
  return tiered('YouTube Data API', id, async () => {
    const { yt } = getKeys();
    if (!yt) throw new Error('no youtube key');
    const q = new URLSearchParams({ part: 'snippet', type: 'video', maxResults: 8, key: yt, ...params });
    const s = await getJSON(`https://www.googleapis.com/youtube/v3/search?${q}`);
    const ids = s.items.map(i => i.id.videoId).filter(Boolean);
    if (!ids.length) throw new Error('empty result');
    const v = await getJSON(`https://www.googleapis.com/youtube/v3/videos?${new URLSearchParams({ part: 'snippet,statistics,contentDetails', id: ids.join(','), key: yt })}`);
    return v.items.map(it => ({
      id: it.id,
      title: it.snippet.title,
      channel: it.snippet.channelTitle,
      published: it.snippet.publishedAt,
      views: Number(it.statistics.viewCount || 0),
      duration: isoDur(it.contentDetails.duration),
      img: it.snippet.thumbnails.high?.url || it.snippet.thumbnails.medium?.url,
      url: `https://www.youtube.com/watch?v=${it.id}`,
    }));
  }, mockFn);
}
function isoDur(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) || [];
  const h = +m[1] || 0, mi = +m[2] || 0, s = +m[3] || 0;
  const pad = n => String(n).padStart(2, '0');
  return h ? `${h}:${pad(mi)}:${pad(s)}` : `${mi}:${pad(s)}`;
}

// ---------- Gemini API ----------
// Model names get retired often, so try a chain: the user's choice first, then fast fallbacks.
const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-flash-latest'];

export async function gemini(name, prompt, mockFn) {
  const id = 'gm:' + hash(prompt);
  return tiered(name, id, async () => {
    const { gm, model } = getKeys();
    if (!gm) throw new Error('no gemini key');
    const chain = [...new Set([model, ...GEMINI_MODELS].filter(Boolean))];
    const call = async m => {
      const res = await getJSON(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${gm}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(35000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
        }),
      });
      const text = res.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
      return JSON.parse(text);
    };
    // Race the first two models (whichever answers first wins), then fall back to the rest in order
    try {
      return await Promise.any(chain.slice(0, 2).map(call));
    } catch (e) {
      console.warn('[gemini] first models failed:', e.errors?.map(x => x.message).join(' / ') || e.message);
    }
    let lastErr;
    for (const m of chain.slice(2)) {
      try { return await call(m); } catch (e) { lastErr = e; console.warn(`[gemini] ${m} failed:`, e.message); }
    }
    throw lastErr || new Error('all gemini models failed');
  }, mockFn, 70000);
}

// ---------- Free public APIs (no key needed) ----------
export async function weather(lat, lon, mockFn) {
  const id = `wx:${lat.toFixed(1)},${lon.toFixed(1)}:${new Date().toDateString()}`;
  return tiered('Open-Meteo weather', id, () =>
    getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`)
      .then(r => ({ temp: Math.round(r.current.temperature_2m), code: r.current.weather_code, isDay: r.current.is_day })),
    mockFn);
}

export async function cityName(lat, lon) {
  const id = `city:en:${lat.toFixed(1)},${lon.toFixed(1)}`;
  return tiered('Reverse geocoding', id, () =>
    getJSON(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
      .then(r => r.city || r.locality || r.principalSubdivision || 'your city'),
    () => 'San Francisco');
}

export async function wikiRandom(mockFn) {
  // Random differs every call; cache per day so it replays offline
  const id = 'wiki:en:rand:' + new Date().toDateString();
  return tiered('Wikipedia random article', id, async () => {
    // skip disambiguation pages and stubs, up to 4 tries
    let r;
    for (let i = 0; i < 4; i++) {
      r = await getJSON('https://en.wikipedia.org/api/rest_v1/page/random/summary');
      if (r.type !== 'disambiguation' && (r.extract || '').length > 40) break;
    }
    return { title: r.title, extract: r.extract, img: r.thumbnail?.source, url: r.content_urls?.desktop?.page };
  }, mockFn);
}

export async function onThisDay(type, month, day, mockFn) {
  const mm = String(month).padStart(2, '0'), dd = String(day).padStart(2, '0');
  const id = `otd:en:${type}:${mm}${dd}`;
  return tiered('Wikipedia on this day', id, async () => {
    const r = await getJSON(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/${type}/${mm}/${dd}`);
    const list = r[type] || [];
    if (!list.length) throw new Error('empty');
    const isYear = t => /^\d+( BC)?$/.test(t || '');
    return list.map(e => {
      const page = (e.pages || []).find(p => !isYear(p.normalizedtitle || p.title));
      return {
        year: e.year, text: e.text,
        name: page ? (page.normalizedtitle || page.title) : e.text.split(/[,，]/)[0],
        img: page?.thumbnail?.source,
      };
    });
  }, mockFn);
}
