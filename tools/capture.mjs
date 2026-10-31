// Capture 4:3 cover screenshots for the projects page.
// Usage: serve the repo root on :5173, then `node tools/capture.mjs [projectId ...]` (no ids = all).
// Each shot opens a demo with an empty localStorage (sample data), optionally clicks through to a
// key moment, and saves the 1440×1080 (4:3) viewport scrolled to the top of `selector`.
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:5173/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Add an entry here for each new project
const SHOTS = {
  'youtube-unhooked': [
    { file: 'cover-1.jpg', url: 'youtube-unhooked/', selector: 'body', wait: 3500 },
    {
      file: 'cover-2.jpg', url: 'youtube-unhooked/', selector: '#demo-anti .yt-window', offset: -20, wait: 1800,
      prepare: async page => {
        await page.evaluate(() => { document.querySelector('[data-k="binge"]').click(); document.querySelector('[data-k="drama"]').click(); });
      },
    },
    {
      file: 'trap-map.jpg', url: 'youtube-unhooked/', selector: '#demo-takeout .yt-window', offset: -20, wait: 1500,
      prepare: async page => { await page.evaluate(() => document.querySelector('#use-persona').click()); await sleep(4500); },
    },
    {
      file: 'report.jpg', url: 'youtube-unhooked/', selector: '#report', offset: 40, wait: 2500,
      prepare: async page => { await page.evaluate(() => document.querySelector('#use-persona').click()); await sleep(4500); },
    },
    {
      file: 'blind-box.jpg', url: 'youtube-unhooked/', selector: '#demo-box .yt-window', offset: -20, wait: 1500,
      prepare: async page => { await page.evaluate(() => document.querySelector('#open-box').click()); await sleep(11000); },
    },
    {
      file: 'time-capsule.jpg', url: 'youtube-unhooked/', selector: '#capsule-dial', offset: -20, wait: 2500,
      prepare: async page => { await page.evaluate(() => document.querySelector('#capsule-dial [data-y="10"]').click()); },
    },
  ],
  'meet-rehearsed': [
    { file: 'cover-1.jpg', url: 'meet-rehearsed/', selector: 'body', wait: 3500 },
    {
      file: 'cover-2.jpg', url: 'meet-rehearsed/', selector: '#sim-window', offset: -20, wait: 1500,
      prepare: async page => {
        await page.evaluate(() => document.querySelector('#run-btn').click());
        await sleep(7000);
      },
    },
    {
      file: 'simulator-fixed.jpg', url: 'meet-rehearsed/', selector: '#sim-window', offset: -20, wait: 1500,
      prepare: async page => {
        await page.evaluate(() => document.querySelector('#run-btn').click());
        await sleep(7000);
        await page.evaluate(() => document.querySelector('#fix-btn').click());
        await sleep(9000);
      },
    },
    {
      file: 'rehearsal.jpg', url: 'meet-rehearsed/', selector: '#demo-rehearse .gw-window', offset: -20, wait: 1500,
      prepare: async page => {
        await page.waitForSelector('.q');
        await page.evaluate(() => {
          document.querySelector('#answer').value = 'We buy the index but own ranking. On-call stays with search infra, and I think we can maybe have the RACI done by Thursday.';
          document.querySelector('#coach-btn').click();
        });
        await sleep(1500);
      },
    },
    {
      file: 'mirror.jpg', url: 'meet-rehearsed/', selector: '#demo-mirror .meet-window', offset: -20, wait: 2500,
      prepare: async page => { await page.evaluate(() => document.querySelector('#mirror-btn').click()); await sleep(2000); },
    },
  ],
};

// Calendar: shots run after a few clicks, so share the setup
const calCosts = async page => { await page.evaluate(() => document.querySelector('#cost-toggle').click()); await sleep(900); };
SHOTS['calendar-priced'] = [
  { file: 'cover-1.jpg', url: 'calendar-priced/', selector: 'body', wait: 3000 },
  { file: 'cover-2.jpg', url: 'calendar-priced/', selector: '#cal-window', offset: -20, wait: 800, prepare: calCosts },
  {
    file: 'price-detail.jpg', url: 'calendar-priced/', selector: '#cal-window', offset: -20, wait: 800,
    prepare: async page => { await calCosts(page); await page.evaluate(() => document.querySelector('[data-id="standup-0"]').click()); },
  },
  {
    file: 'create.jpg', url: 'calendar-priced/', selector: '#cal-window', offset: -20, wait: 1500,
    prepare: async page => {
      await calCosts(page);
      await page.evaluate(() => { document.querySelector('#create-btn').click(); document.querySelector('#c-example').click(); document.querySelector('#c-check').click(); });
    },
  },
  {
    file: 'value-check.jpg', url: 'calendar-priced/', selector: '#demo-veto .gw-window', offset: -20, wait: 800,
    prepare: async page => {
      await page.evaluate(() => document.querySelector('#veto-send').click());
      await sleep(5500);
      await page.evaluate(() => document.querySelector('.ph-opt[data-v="notes"]').click());
    },
  },
  {
    file: 'receipt.jpg', url: 'calendar-priced/', selector: '#receipt', offset: -10, wait: 1000,
    prepare: async page => {
      await page.evaluate(() => document.querySelector('#veto-send').click());
      await sleep(5500);
      await page.evaluate(() => document.querySelector('#veto-cancel').click());
      await sleep(800);
      await page.evaluate(() => { const el = document.querySelector('#receipt'); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 74); });
    },
  },
];

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SHOTS);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });
try {
  for (const id of ids) {
    if (!SHOTS[id]) { console.warn(`No shots defined for ${id}`); continue; }
    await mkdir(path.join(ROOT, 'assets', id), { recursive: true });
    for (const shot of SHOTS[id]) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 1080, deviceScaleFactor: 1 });
      await page.evaluateOnNewDocument(() => { try { localStorage.setItem('uh:keys', JSON.stringify({ offline: true })); } catch {} });
      await page.goto(BASE + shot.url, { waitUntil: 'networkidle2' });
      await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
      if (shot.selector !== 'body') {
        await page.evaluate((sel, off) => {
          const el = document.querySelector(sel);
          window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + (off || 0) - 64);
        }, shot.selector, shot.offset);
        await sleep(1500); // let scroll reveals finish
        // Windows slide in with a transform, so measure again once they've settled
        await page.evaluate((sel, off) => {
          const el = document.querySelector(sel);
          window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + (off || 0) - 64);
        }, shot.selector, shot.offset);
        await sleep(300);
      }
      if (shot.prepare) await shot.prepare(page);
      await sleep(shot.wait || 1000);
      const out = path.join(ROOT, 'assets', id, shot.file);
      await page.screenshot({ path: out, type: 'jpeg', quality: 82 }); // the 1440×1080 viewport is already 4:3
      console.log('saved', path.relative(ROOT, out));
      await page.close();
    }
  }
} finally {
  await browser.close();
}
