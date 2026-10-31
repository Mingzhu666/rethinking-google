// Renders slides as HTML. Sizes use container units, so the same markup works as a thumbnail or full size.
import { esc } from './ui.js';

export function slideHTML(s, opts = {}) {
  return `<div class="slide-box">${inner(s, opts)}</div>`;
}

function inner(s, { bulletClass = () => '', n } = {}) {
  const num = n != null ? `<span class="sl-num">${n}</span>` : '';
  if (s.layout === 'title') {
    return `<div class="slide title-slide"><div class="sl-accent"></div><h2>${esc(s.title)}</h2><p>${esc(s.subtitle)}</p>${num}</div>`;
  }
  if (s.layout === 'stats') {
    return `<div class="slide"><h3>${esc(s.title)}</h3><div class="sl-stats">${s.stats.map(x =>
      `<div class="sl-stat ${bulletClass(x.id)}" data-b="${x.id}"><b>${esc(x.value)}</b><span>${esc(x.label)}</span></div>`).join('')}</div>${num}</div>`;
  }
  return `<div class="slide"><h3>${esc(s.title)}</h3><ul>${s.bullets.map(b =>
    `<li class="${bulletClass(b.id)}" data-b="${b.id}">${esc(b.text)}</li>`).join('')}</ul>${num}</div>`;
}

// Plain text of a slide, for prompts
export const slideText = s => [s.title, s.subtitle, ...(s.bullets || []).map(b => '- ' + b.text), ...(s.stats || []).map(x => `- ${x.value} ${x.label}`)].filter(Boolean).join('\n');
