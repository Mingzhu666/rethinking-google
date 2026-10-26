// 02 盲盒频道：由日期、天气、陌生人的生日、维基百科随机条目来决定今天看什么。
import { weather, cityName, onThisDay, wikiRandom, gemini, ytSearch } from './api.js';
import { mockVideos } from './data.js';
import { $, $$, esc, sleep, thumbHTML, fmtViews, setBadge, mergeSources, toast } from './ui.js';

const WMO = {
  0: ['晴', '阳光正好'], 1: ['晴间多云', '光线柔和'], 2: ['多云', '云层很厚'], 3: ['阴', '天色灰蓝'],
  45: ['雾', '世界变得很近'], 48: ['雾凇', '世界变得很近'],
  51: ['毛毛雨', '适合待在屋里'], 53: ['小雨', '适合待在屋里'], 55: ['中雨', '雨声很密'],
  61: ['小雨', '适合待在屋里'], 63: ['中雨', '雨声很密'], 65: ['大雨', '适合听雨'],
  71: ['小雪', '很安静'], 73: ['中雪', '很安静'], 75: ['大雪', '整座城市都静音了'],
  80: ['阵雨', '时下时停'], 81: ['阵雨', '时下时停'], 82: ['暴雨', '最好别出门'], 95: ['雷阵雨', '天空在打鼓'],
};
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const COLORS = { date: '#c79a00', weather: '#2f7fd0', birthday: '#d8455a', wiki: '#14a46c' };
const THUMB = { date: '今天\n的日期', weather: '窗外\n的天气', birthday: '陌生人\n的生日', wiki: '随机\n一页' };
const todayKey = () => 'uh:box:' + new Date().toDateString();

export function initBlindBox() {
  const now = new Date();
  $('#box-date').textContent = `${now.getMonth() + 1} 月 ${now.getDate()} 日 · ${WEEK[now.getDay()]} · 今日盲盒`;
  const saved = load();
  if (saved) {
    $('#open-box').textContent = '重播今天的开箱';
    $('#box-hint').textContent = '今天的盲盒已经开过了，明天 00:00 换新。（按住 Shift 点击可强制重抽）';
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
  $('#playlist').innerHTML = '<div class="curating">外部世界正在为你策展</div>';
  await sleep(box.fresh ? 300 : 1400);
  renderPlaylist(box.items);
  setBadge($('#box-src'), box.source);
  delete box.fresh;
  localStorage.setItem(todayKey(), JSON.stringify(box));
  btn.disabled = false;
  btn.textContent = '重播今天的开箱';
  $('#box-hint').textContent = '这就是今天外部世界替你选的。明天会完全不同。';
}

async function getPosition() {
  try {
    const p = await new Promise((res, rej) => {
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000, maximumAge: 36e5 });
      setTimeout(() => rej(new Error('timeout')), 4500);
    });
    return { lat: p.coords.latitude, lon: p.coords.longitude };
  } catch { return { lat: 31.23, lon: 121.47 }; } // 默认上海
}

async function draw() {
  const now = new Date();
  const m = now.getMonth() + 1, d = now.getDate();
  const pos = await getPosition();
  const [wx, city, births, wiki] = await Promise.all([
    weather(pos.lat, pos.lon, () => ({ temp: 16, code: 61, isDay: 1 })),
    cityName(pos.lat, pos.lon),
    onThisDay('births', m, d, () => [{ year: 1946, name: '一位陌生人', text: '一位你从未听说过的人在这天出生' }]),
    wikiRandom(() => ({ title: '灯塔看守人', extract: '灯塔看守人是负责维护灯塔运转的人。随着自动化普及，这个职业在 20 世纪末几乎消失。' })),
  ]);

  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
  const [wxName, wxMood] = WMO[wx.data.code] || ['多云', '天色一般'];
  const people = births.data.filter(p => p.name);
  const person = people[Math.floor(Math.random() * Math.min(people.length, 30))] || births.data[0];
  const clues = {
    date: { text: `${m}月${d}日，今年的第 ${dayOfYear} 天`, html: `<small>日期</small><h4>${m} 月 ${d} 日</h4><p>今年的第 ${dayOfYear} 天 · 还剩 ${365 - dayOfYear} 天</p>` },
    weather: { text: `${city.data}现在${wxName}，${wx.data.temp}°C，${wxMood}`, html: `<small>${esc(city.data)} · 现在</small><h4>${wxName} ${wx.data.temp}°</h4><p>${wxMood}</p>` },
    birthday: { text: `今天是 ${person.name}（${person.year}）的生日：${person.text}`, html: `<small>一个陌生人的生日</small>${person.img ? `<img src="${esc(person.img)}" alt="" />` : ''}<h4>${esc(person.name)}</h4><p>生于 ${person.year} 年 · ${esc(person.text)}</p>` },
    wiki: { text: `维基百科随机条目「${wiki.data.title}」：${(wiki.data.extract || '').slice(0, 120)}`, html: `<small>维基百科 · 随机条目</small><h4>${esc(wiki.data.title)}</h4><p>${esc(wiki.data.extract)}</p>` },
  };

  const prompt = `你是 YouTube「盲盒频道」的策展人。今天的内容不由用户的历史决定，而由外部世界决定。四条线索：
date: ${clues.date.text}
weather: ${clues.weather.text}
birthday: ${clues.birthday.text}
wiki: ${clues.wiki.text}
为每条线索设计一个视频：给出能在 YouTube 搜到高质量长内容的搜索词（中文或英文均可，避免标题党），以及一句给用户看的“为什么今天给你看这个”（第二人称，像一位有点诗意的朋友，不超过 45 字）。
只返回 JSON：{"items": [{"clue": "date|weather|birthday|wiki", "query": string, "why": string}]}`;
  const plan = await gemini('Gemini 盲盒策展', prompt, () => ({ items: [
    { clue: 'date', query: `${m}月${d}日 历史上的今天 纪录片`, why: `${m} 月 ${d} 日在历史上发生过很多事，今天你和它们站在同一个日期上。` },
    { clue: 'weather', query: wxName.includes('雨') ? 'rain ambience piano 1 hour' : wxName.includes('晴') ? 'city walk sunny day 4k' : 'cozy cloudy day lofi', why: `${city.data}现在${wxName}，${wxMood}。这一段刚好配得上窗外。` },
    { clue: 'birthday', query: `${person.name} documentary`, why: `${person.year} 年的今天，${person.name}出生了。你本来永远不会点开关于这个人的视频。` },
    { clue: 'wiki', query: `${wiki.data.title} 纪录片`, why: `维基百科随手翻开的一页是「${wiki.data.title}」。世界上大部分有趣的东西，都在你的推荐流之外。` },
  ] }));

  const items = await Promise.all(plan.data.items.slice(0, 4).map(async it => {
    const r = await ytSearch({ q: it.query, maxResults: 1, videoDuration: 'medium', safeSearch: 'strict' },
      () => mockVideos(it.query, 1, { titles: [it.query], queries: [it.query] })
        .map(v => ({ ...v, channel: 'YouTube 搜索', views: null, thumbText: THUMB[it.clue] || '盲盒' })));
    return { ...it, video: r.data[0], source: r.source };
  }));

  const source = mergeSources([wx.source, births.source, wiki.source, plan.source, ...items.map(i => i.source)]);
  if (source !== 'live') toast('部分数据来自缓存或示例，可在右上角设置 API key');
  return { clues, items, source, fresh: true };
}

function renderPlaylist(items) {
  const label = { date: '因为今天的日期', weather: '因为窗外的天气', birthday: '因为一个陌生人的生日', wiki: '因为维基百科的随机一页' };
  $('#playlist').innerHTML = items.map((it, i) => {
    const v = it.video;
    return `<a class="pl-item" href="${esc(v.url)}" target="_blank" rel="noopener" style="--k:${COLORS[it.clue]}">
      <span class="idx">${i + 1}</span>
      <div class="thumb-wrap">${thumbHTML(v)}</div>
      <div>
        <h4>${esc(v.title)}</h4>
        <span class="ch">${esc(v.channel)}${v.views ? ' · ' + fmtViews(v.views) + '次观看' : ''}${v.mock ? ' · 点击打开搜索结果 ↗' : ''}</span>
        <div class="why"><small>${label[it.clue] || '因为外部世界'}</small>${esc(it.why)}</div>
      </div></a>`;
  }).join('');
  $$('.pl-item').forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 220));
}
