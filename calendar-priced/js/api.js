// Data layer with three-tier fallback: live API → local cache → sample data.
// Every call returns { data, source }, where source is 'live' | 'cache' | 'mock'.

const KEY_STORE = 'uh:keys'; // shared with the other demos on the same origin
const CACHE_PREFIX = 'cp:cache:';

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

// ---------- Gemini API ----------
// Model names get retired often, so try a chain: the user's choice first, then fast fallbacks.
const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-flash-latest'];

export async function gemini(name, prompt, mockFn) {
  // mockFn may be async; sample data keeps the demo running without a key
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
