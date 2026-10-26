// Renders the projects list (index.html) and a project detail page (project.html?id=…) from projects.js.
import { SITE, GROUPS, PROJECTS } from './projects.js';

const UI = {
  projects: { en: 'Projects', zh: '项目' },
  github: { en: 'GitHub', zh: 'GitHub' },
  switchTo: { en: '中文', zh: 'English' },
  proposals: { en: 'proposals', zh: '个提案' },
  features: { en: 'features shipped as demos', zh: '个可演示的功能' },
  apis: { en: 'APIs and tools', zh: '个 API 与工具' },
  idea: { en: 'Core idea', zh: '核心洞察' },
  details: { en: 'View details →', zh: '查看详情 →' },
  openDemo: { en: 'Open demo ↗', zh: '打开演示 ↗' },
  back: { en: '← All projects', zh: '← 全部项目' },
  liveDemo: { en: 'Open the live demo', zh: '打开在线演示' },
  source: { en: 'Source on GitHub', zh: 'GitHub 源码' },
  problem: { en: 'The problem', zh: '问题' },
  insight: { en: 'The insight', zh: '洞察' },
  built: { en: 'What I built', zh: '做了什么' },
  metric: { en: 'New north star', zh: '新北极星指标' },
  business: { en: 'Why Google ships it', zh: '商业论证' },
  tech: { en: 'How it works', zh: '技术实现' },
  limits: { en: 'Known limits', zh: '已知局限' },
  notFound: { en: 'Project not found.', zh: '没有找到这个项目。' },
  foot: { en: 'Product proposals and prototypes. Not affiliated with Google.', zh: '产品提案与原型，与 Google 官方无关。' },
};
const API_TAGS = /API|Open-Meteo|Wikimedia|Gemini/;

// English by default for everyone; 中文 only when the visitor switches to it
let lang = localStorage.getItem('site:lang') === 'zh' ? 'zh' : 'en';
const t = v => (v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] ?? v.en) : v);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = ym => {
  const [y, m] = ym.split('-').map(Number);
  return lang === 'zh' ? `${y} 年 ${m} 月` : new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};
const chip = p => `<span class="chip"><i style="background:${p.productColor}"></i>${esc(p.product)}</span>`;

function header(active) {
  return `<header class="site-top"><div class="wrap">
    <a class="mark" href="./"><i><b style="background:#4285f4"></b><b style="background:#ea4335"></b><b style="background:#fbbc04"></b><b style="background:#34a853"></b></i>${esc(t(SITE.title))}</a>
    <nav class="site-nav"><a href="./" class="${active === 'projects' ? 'on' : ''}">${t(UI.projects)}</a><a href="${SITE.repo}" target="_blank" rel="noopener">${t(UI.github)} ↗</a></nav>
    <button class="lang" id="lang">${t(UI.switchTo)}</button>
  </div></header>`;
}
const footer = () => `<footer class="site-foot"><div class="wrap"><span>${esc(t(UI.foot))}</span><span>© ${new Date().getFullYear()}</span></div></footer>`;

function card(p) {
  return `<article class="card">
    <div class="thumbs">${p.shots.map(s => `<img src="${s}" alt="" loading="lazy" />`).join('')}</div>
    <div class="card-body">
      <div class="meta">${chip(p)}<span>${esc(t(p.kind))}</span><span>·</span><span>${fmtDate(p.date)}</span></div>
      <div>
        <h3><a href="project.html?id=${p.id}">${esc(t(p.title))}</a></h3>
        <p class="desc">${esc(t(p.tagline))}</p>
      </div>
      <div class="inset"><small>${t(UI.idea)}</small><p>${esc(t(p.idea))}</p></div>
      <div class="tags">${p.tags.map(x => `<span>${esc(x)}</span>`).join('')}</div>
      <div class="card-foot"><span class="more">${t(UI.details)}</span><a class="demo" href="${p.demo}" target="_blank" rel="noopener">${t(UI.openDemo)}</a></div>
    </div>
  </article>`;
}

function renderList() {
  document.title = `${t(UI.projects)} · ${t(SITE.title)}`;
  const features = PROJECTS.reduce((a, p) => a + p.features.length, 0);
  const apis = new Set(PROJECTS.flatMap(p => p.tags.filter(x => API_TAGS.test(x)))).size;
  document.body.innerHTML = `${header('projects')}
    <main class="wrap">
      <section class="page-head">
        <h1>${t(UI.projects)}</h1>
        <p>${esc(t(SITE.lead))}</p>
        <div class="stats">
          <div><b>${PROJECTS.length}</b>${t(UI.proposals)}</div>
          <div><b>${features}</b>${t(UI.features)}</div>
          <div><b>${apis}</b>${t(UI.apis)}</div>
        </div>
      </section>
      ${GROUPS.map(g => {
        const list = PROJECTS.filter(p => p.group === g.id);
        return list.length ? `<section class="group"><div class="group-head"><h2>${esc(t(g.title))}</h2><p>${esc(t(g.lead))}</p></div>
          <div class="grid">${list.map(card).join('')}</div></section>` : '';
      }).join('')}
    </main>${footer()}`;
}

function renderDetail(id) {
  const p = PROJECTS.find(x => x.id === id);
  if (!p) { document.body.innerHTML = `${header()}<main class="wrap"><a class="back" href="./">${t(UI.back)}</a><p>${t(UI.notFound)}</p></main>`; return; }
  document.title = `${t(p.title)} · ${p.product} · ${t(SITE.title)}`;
  const list = items => `<ul>${t(items).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  document.body.innerHTML = `${header()}
    <main class="wrap">
      <a class="back" href="./">${t(UI.back)}</a>
      <section class="detail-head">
        <div class="meta">${chip(p)}<span>${esc(t(p.kind))}</span><span>·</span><span>${fmtDate(p.date)}</span></div>
        <h1>${esc(t(p.title))}</h1>
        <p class="tagline">${esc(t(p.tagline))}</p>
        <div class="actions"><a class="btn primary" href="${p.demo}" target="_blank" rel="noopener">${t(UI.liveDemo)} ↗</a><a class="btn" href="${SITE.repo}/tree/main/${p.id}" target="_blank" rel="noopener">${t(UI.source)}</a></div>
      </section>
      <div class="gallery">${p.shots.map(s => `<img src="${s}" alt="" />`).join('')}</div>
      <section class="sec"><small>${t(UI.problem)}</small><p>${esc(t(p.problem))}</p></section>
      <section class="sec"><small>${t(UI.insight)}</small><div><p style="margin-bottom:14px">${esc(t(p.idea))}</p><div class="shift"><div class="from">${esc(p.shift.from)}</div><div class="to">${esc(p.shift.to)}</div></div></div></section>
      <section class="sec"><small>${t(UI.built)}</small><div class="features">${p.features.map((f, i) => `<div class="feature"><h4><span>0${i + 1}</span>${esc(t(f.name))}</h4><p>${esc(t(f.text))}</p></div>`).join('')}</div></section>
      <section class="sec"><small>${t(UI.metric)}</small><div><div class="metric"><span class="m from">${esc(t(p.metric.from))}</span><em>→</em><span class="m to">${esc(t(p.metric.to))}</span></div><p class="metric-note">${esc(t(p.metric.note))}</p></div></section>
      <section class="sec"><small>${t(UI.business)}</small>${list(p.business)}</section>
      <section class="sec"><small>${t(UI.tech)}</small>${list(p.tech)}</section>
      <section class="sec"><small>${t(UI.limits)}</small>${list(p.limits)}</section>
    </main>${footer()}`;
}

function render() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  const id = new URLSearchParams(location.search).get('id');
  document.body.dataset.page === 'detail' ? renderDetail(id) : renderList();
  document.getElementById('lang').addEventListener('click', () => {
    lang = lang === 'en' ? 'zh' : 'en';
    localStorage.setItem('site:lang', lang);
    render();
  });
}
render();
