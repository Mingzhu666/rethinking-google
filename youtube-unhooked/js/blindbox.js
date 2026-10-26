// 02 Blind box channel: today's date, the weather, a stranger's birthday, and a random Wikipedia article decide what you watch.
import { weather, cityName, onThisDay, wikiRandom, gemini, ytSearch } from './api.js';
import { mockVideos } from './data.js';
import { $, $$, esc, sleep, thumbHTML, fmtViews, setBadge, mergeSources, toast } from './ui.js';

// WMO weather codes → [name, mood]
const WMO = {
  0: ['Clear', 'Sun is out'], 1: ['Mostly clear', 'Soft light'], 2: ['Partly cloudy', 'Clouds drifting'], 3: ['Overcast', 'A grey-blue sky'],
  45: ['Fog', 'The world feels close'], 48: ['Freezing fog', 'The world feels close'],
  51: ['Drizzle', 'A good day to stay in'], 53: ['Light rain', 'A good day to stay in'], 55: ['Rain', 'Steady rain on the window'],
  61: ['Light rain', 'A good day to stay in'], 63: ['Rain', 'Steady rain on the window'], 65: ['Heavy rain', 'Made for listening to rain'],
  71: ['Light snow', 'Everything is quiet'], 73: ['Snow', 'Everything is quiet'], 75: ['Heavy snow', 'The whole city on mute'],
  80: ['Showers', 'On and off'], 81: ['Showers', 'On and off'], 82: ['Downpour', 'Better not go out'], 95: ['Thunderstorm', 'The sky is drumming'],
};
const COLORS = { date: '#c79a00', weather: '#2f7fd0', birthday: '#d8455a', wiki: '#14a46c' };
const THUMB = { date: 'Today\'s\ndate', weather: 'Out the\nwindow', birthday: 'A stranger\'s\nbirthday', wiki: 'Random\npage' };
const todayKey = () => 'uh:box:en:' + new Date().toDateString();

export function initBlindBox() {
  const now = new Date();
  $('#box-date').textContent = `${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Today's box`;
  if (load()) {
    $('#open-box').textContent = 'Replay today\'s opening';
    $('#box-hint').textContent = 'Today\'s box is already open. A new one arrives at midnight. (Shift-click to force a redraw.)';
  }
  $('#open-box').addEventListener('click', e => open(e.shiftKey));
}

function load() { try { return JSON.parse(localStorage.getItem(todayKey())); } catch { return null; } }

async function open(force) {
  const btn = $('#open-box');
  btn.disabled = true;
  $('#playlist').innerHTML = '';
  $$('.clue').forEach(c => c.classList.remove('open'));
  await sleep(500);
  $$('.clue').forEach(c => c.classList.add('rolling'));

  let box = !force && load();
  if (!box) box = await draw();
  else await sleep(1200);

  for (const k of ['date', 'weather', 'birthday', 'wiki']) {
    const c = $(`.clue[data-k=${k}]`);
    $('.clue-front', c).innerHTML = box.clues[k].html;
    c.classList.remove('rolling'); c.classList.add('open');
    await sleep(650);
  }
  $('#playlist').innerHTML = '<div class="curating">The outside world is curating for you</div>';
  await sleep(box.fresh ? 300 : 1400);
  renderPlaylist(box.items);
  setBadge($('#box-src'), box.source);
  delete box.fresh;
  localStorage.setItem(todayKey(), JSON.stringify(box));
  btn.disabled = false;
  btn.textContent = 'Replay today\'s opening';
  $('#box-hint').textContent = 'This is what the world picked for you today. Tomorrow will be completely different.';
}

async function getPosition() {
  try {
    const p = await new Promise((res, rej) => {
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000, maximumAge: 36e5 });
      setTimeout(() => rej(new Error('timeout')), 4500);
    });
    return { lat: p.coords.latitude, lon: p.coords.longitude };
  } catch { return { lat: 37.77, lon: -122.42 }; } // default: San Francisco
}

async function draw() {
  const now = new Date();
  const m = now.getMonth() + 1, d = now.getDate();
  const dateLabel = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const pos = await getPosition();
  const [wx, city, births, wiki] = await Promise.all([
    weather(pos.lat, pos.lon, () => ({ temp: 16, code: 61, isDay: 1 })),
    cityName(pos.lat, pos.lon),
    onThisDay('births', m, d, () => [{ year: 1946, name: 'A stranger', text: 'someone you have never heard of' }]),
    wikiRandom(() => ({ title: 'Lighthouse keeper', extract: 'A lighthouse keeper is the person responsible for tending a lighthouse. Automation made the job almost disappear by the end of the 20th century.' })),
  ]);

  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
  const [wxName, wxMood] = WMO[wx.data.code] || ['Cloudy', 'An ordinary sky'];
  const people = births.data.filter(p => p.name);
  const person = people[Math.floor(Math.random() * Math.min(people.length, 30))] || births.data[0];
  const clues = {
    date: { text: `${dateLabel}, day ${dayOfYear} of the year`, html: `<small>The date</small><h4>${dateLabel}</h4><p>Day ${dayOfYear} of the year · ${365 - dayOfYear} to go</p>` },
    weather: { text: `It's ${wxName.toLowerCase()} and ${wx.data.temp}°C in ${city.data} right now — ${wxMood.toLowerCase()}`, html: `<small>${esc(city.data)} · right now</small><h4>${wxName}, ${wx.data.temp}°C</h4><p>${wxMood}</p>` },
    birthday: { text: `Today is the birthday of ${person.name} (born ${person.year}): ${person.text}`, html: `<small>A stranger's birthday</small>${person.img ? `<img src="${esc(person.img)}" alt="" />` : ''}<h4>${esc(person.name)}</h4><p>Born ${person.year} · ${esc(person.text)}</p>` },
    wiki: { text: `Random Wikipedia article "${wiki.data.title}": ${(wiki.data.extract || '').slice(0, 200)}`, html: `<small>Wikipedia · random article</small><h4>${esc(wiki.data.title)}</h4><p>${esc(wiki.data.extract)}</p>` },
  };

  const prompt = `You curate YouTube's "Blind box" channel. Today's picks are not based on the viewer's history — the outside world decides. Four clues:
date: ${clues.date.text}
weather: ${clues.weather.text}
birthday: ${clues.birthday.text}
wiki: ${clues.wiki.text}
For each clue, design one video: a short YouTube search query (2–5 words, concrete nouns, no dates or numbers unless essential) likely to surface a thoughtful, long-form video (no clickbait), and one line for the viewer explaining "why you're seeing this today" — second person, like a slightly poetic friend, max 22 words, in English.
Return JSON only: {"items": [{"clue": "date|weather|birthday|wiki", "query": string, "why": string}]}`;
  const plan = await gemini('Gemini blind box curator', prompt, () => ({ items: [
    { clue: 'date', query: `${dateLabel} on this day in history documentary`, why: `A lot has happened on ${dateLabel}. Today you're standing on the same date as all of it.` },
    { clue: 'weather', query: /rain|drizzle|shower/i.test(wxName) ? 'rain ambience piano 1 hour' : /clear/i.test(wxName) ? 'city walk sunny day 4k' : 'cozy cloudy day lofi', why: `It's ${wxName.toLowerCase()} in ${city.data}. This one fits what's outside your window.` },
    { clue: 'birthday', query: `${person.name} documentary`, why: `${person.name} was born on this day in ${person.year}. You'd never have clicked on this on your own.` },
    { clue: 'wiki', query: `${wiki.data.title} documentary`, why: `Wikipedia fell open to "${wiki.data.title}". Most of the interesting world lives outside your feed.` },
  ] }));

  const items = await Promise.all(plan.data.items.slice(0, 4).map(async it => {
    const sample = () => mockVideos(it.query, 1, { titles: [it.query], queries: [it.query] })
      .map(v => ({ ...v, channel: 'YouTube search', views: null, thumbText: THUMB[it.clue] || 'Blind box' }));
    // Strict first; if nothing comes back, retry with a shorter query and no duration filter
    let r = await ytSearch({ q: it.query, maxResults: 1, videoDuration: 'medium', safeSearch: 'strict', relevanceLanguage: 'en' }, () => null);
    if (!r.data?.length) r = await ytSearch({ q: it.query.split(/\s+/).slice(0, 4).join(' '), maxResults: 1, safeSearch: 'strict' }, sample);
    return { ...it, video: r.data[0], source: r.source };
  }));

  const source = mergeSources([wx.source, births.source, wiki.source, plan.source, ...items.map(i => i.source)]);
  if (source !== 'live') toast('Some data is cached or sample — add API keys in the top-right');
  return { clues, items, source, fresh: true };
}

function renderPlaylist(items) {
  const label = { date: 'Because of today\'s date', weather: 'Because of the weather', birthday: 'Because of a stranger\'s birthday', wiki: 'Because of a random Wikipedia page' };
  $('#playlist').innerHTML = items.map((it, i) => {
    const v = it.video;
    return `<a class="pl-item" href="${esc(v.url)}" target="_blank" rel="noopener" style="--k:${COLORS[it.clue]}">
      <span class="idx">${i + 1}</span>
      <div class="thumb-wrap">${thumbHTML(v)}</div>
      <div>
        <h4>${esc(v.title)}</h4>
        <span class="ch">${esc(v.channel)}${v.views ? ' · ' + fmtViews(v.views) + ' views' : ''}${v.mock ? ' · open search results ↗' : ''}</span>
        <div class="why"><small>${label[it.clue] || 'Because of the outside world'}</small>${esc(it.why)}</div>
      </div></a>`;
  }).join('');
  $$('.pl-item').forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 220));
}
