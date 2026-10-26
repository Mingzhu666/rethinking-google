// Renders the projects list (index.html) and a project detail page (project.html?id=…) from projects.js. English only.
import { SITE, GROUPS, PROJECTS } from './projects.js';

const UI = {
  projects: 'Projects',
  github: 'GitHub',
  proposals: 'proposals',
  features: 'features shipped as demos',
  apis: 'APIs and tools',
  idea: 'Core idea',
  details: 'View details →',
  openDemo: 'Open demo ↗',
  back: '← All projects',
  liveDemo: 'Open the live demo',
  source: 'Source on GitHub',
  problem: 'The problem',
  insight: 'The insight',
  built: 'What I built',
  metric: 'New north star',
  business: 'Why Google ships it',
  tech: 'How it works',
  limits: 'Known limits',
  notFound: 'Project not found.',
  foot: 'Product proposals and prototypes. Not affiliated with Google.',
};
const API_TAGS = /API|Open-Meteo|Wikimedia|Gemini/;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = ym => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};
const chip = p => `<span class="chip"><i style="background:${p.productColor}"></i>${esc(p.product)}</span>`;

function header(active) {
  return `<header class="site-top"><div class="wrap">
    <a class="mark" href="./"><i><b style="background:#4285f4"></b><b style="background:#ea4335"></b><b style="background:#fbbc04"></b><b style="background:#34a853"></b></i>${esc(SITE.title)}</a>
    <nav class="site-nav"><a href="./" class="${active === 'projects' ? 'on' : ''}">${UI.projects}</a><a href="${SITE.repo}" target="_blank" rel="noopener">${UI.github} ↗</a></nav>
  </div></header>`;
}
const footer = () => `<footer class="site-foot"><div class="wrap"><span>${esc(UI.foot)}</span><span>© ${new Date().getFullYear()}</span></div></footer>`;

function card(p) {
  return `<article class="card">
    <div class="thumbs">${p.shots.map(s => `<img src="${s}" alt="" loading="lazy" />`).join('')}</div>
    <div class="card-body">
      <div class="meta">${chip(p)}<span>${esc(p.kind)}</span><span>·</span><span>${fmtDate(p.date)}</span></div>
      <div>
        <h3><a href="project.html?id=${p.id}">${esc(p.title)}</a></h3>
        <p class="desc">${esc(p.tagline)}</p>
      </div>
      <div class="inset"><small>${UI.idea}</small><p>${esc(p.idea)}</p></div>
      <div class="tags">${p.tags.map(x => `<span>${esc(x)}</span>`).join('')}</div>
      <div class="card-foot"><span class="more">${UI.details}</span><a class="demo" href="${p.demo}" target="_blank" rel="noopener">${UI.openDemo}</a></div>
    </div>
  </article>`;
}

function renderList() {
  document.title = `${UI.projects} · ${SITE.title}`;
  const features = PROJECTS.reduce((a, p) => a + p.features.length, 0);
  const apis = new Set(PROJECTS.flatMap(p => p.tags.filter(x => API_TAGS.test(x)))).size;
  document.body.innerHTML = `${header('projects')}
    <main class="wrap">
      <section class="page-head">
        <h1>${UI.projects}</h1>
        <p>${esc(SITE.lead)}</p>
        <div class="stats">
          <div><b>${PROJECTS.length}</b>${UI.proposals}</div>
          <div><b>${features}</b>${UI.features}</div>
          <div><b>${apis}</b>${UI.apis}</div>
        </div>
      </section>
      ${GROUPS.map(g => {
        const list = PROJECTS.filter(p => p.group === g.id);
        return list.length ? `<section class="group"><div class="group-head"><h2>${esc(g.title)}</h2><p>${esc(g.lead)}</p></div>
          <div class="grid">${list.map(card).join('')}</div></section>` : '';
      }).join('')}
    </main>${footer()}`;
}

function renderDetail(id) {
  const p = PROJECTS.find(x => x.id === id);
  if (!p) { document.body.innerHTML = `${header()}<main class="wrap"><a class="back" href="./">${UI.back}</a><p>${UI.notFound}</p></main>`; return; }
  document.title = `${p.title} · ${p.product} · ${SITE.title}`;
  const list = items => `<ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  document.body.innerHTML = `${header()}
    <main class="wrap">
      <a class="back" href="./">${UI.back}</a>
      <section class="detail-head">
        <div class="meta">${chip(p)}<span>${esc(p.kind)}</span><span>·</span><span>${fmtDate(p.date)}</span></div>
        <h1>${esc(p.title)}</h1>
        <p class="tagline">${esc(p.tagline)}</p>
        <div class="actions"><a class="btn primary" href="${p.demo}" target="_blank" rel="noopener">${UI.liveDemo} ↗</a><a class="btn" href="${SITE.repo}/tree/main/${p.id}" target="_blank" rel="noopener">${UI.source}</a></div>
      </section>
      <div class="gallery">${p.shots.map(s => `<img src="${s}" alt="" />`).join('')}</div>
      <section class="sec"><small>${UI.problem}</small><p>${esc(p.problem)}</p></section>
      <section class="sec"><small>${UI.insight}</small><div><p style="margin-bottom:14px">${esc(p.idea)}</p><div class="shift"><div class="from">${esc(p.shift.from)}</div><div class="to">${esc(p.shift.to)}</div></div></div></section>
      <section class="sec"><small>${UI.built}</small><div class="features">${p.features.map((f, i) => `<div class="feature"><h4><span>0${i + 1}</span>${esc(f.name)}</h4><p>${esc(f.text)}</p></div>`).join('')}</div></section>
      <section class="sec"><small>${UI.metric}</small><div><div class="metric"><span class="m from">${esc(p.metric.from)}</span><em>→</em><span class="m to">${esc(p.metric.to)}</span></div><p class="metric-note">${esc(p.metric.note)}</p></div></section>
      <section class="sec"><small>${UI.business}</small>${list(p.business)}</section>
      <section class="sec"><small>${UI.tech}</small>${list(p.tech)}</section>
      <section class="sec"><small>${UI.limits}</small>${list(p.limits)}</section>
    </main>${footer()}`;
}

const id = new URLSearchParams(location.search).get('id');
document.body.dataset.page === 'detail' ? renderDetail(id) : renderList();
