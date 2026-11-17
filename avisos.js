/* Sino de avisos: guarda todos os avisos (toasts) com a hora, para rever depois. */
(function () {
  'use strict';
  const KEY = 'cnu.estudio.avisos', MAX = 50;
  let list = []; try { list = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { list = []; }
  let unread = 0;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); } catch (e) { /* sem armazenamento */ } };
  const bell = document.createElement('button');
  bell.className = 'ib'; bell.id = 'bBell'; bell.title = 'Avisos'; bell.setAttribute('aria-label', 'Avisos'); bell.setAttribute('aria-haspopup', 'true');
  bell.innerHTML = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a1.9 1.9 0 003.4 0"/></svg><span class="bdg" hidden></span>';
  const more = document.getElementById('bMore'); if (more && more.parentNode) more.parentNode.insertBefore(bell, more.nextSibling);
  const panel = document.createElement('div'); panel.id = 'avisos'; panel.hidden = true; document.body.appendChild(panel);
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const hm = (t) => { const d = new Date(t); return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
  const day = (t) => { const d = new Date(t), n = new Date(); return d.toDateString() === n.toDateString() ? 'Hoje' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); };
  function paintBadge() { const b = bell.querySelector('.bdg'); b.hidden = !unread; b.textContent = unread > 9 ? '9+' : String(unread); }
  function render() {
    panel.innerHTML = `<div class="avh"><b>Avisos</b>${list.length ? '<button type="button" id="avClr">Limpar</button>' : ''}</div>` +
      (list.length ? `<ul>${list.map((a) => `<li><time>${day(a.t)} · ${hm(a.t)}</time><p>${esc(a.m)}</p></li>`).join('')}</ul>` : '<p class="avempty">Nenhum aviso por aqui 🌸</p>');
    const c = panel.querySelector('#avClr'); if (c) c.onclick = () => { list = []; save(); render(); };
  }
  function place() { const r = bell.getBoundingClientRect(); panel.style.top = r.bottom + 8 + 'px'; panel.style.right = Math.max(8, innerWidth - r.right - 4) + 'px'; }
  bell.onclick = (e) => { e.stopPropagation(); if (panel.hidden) { render(); place(); panel.hidden = false; unread = 0; paintBadge(); } else panel.hidden = true; };
  document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target)) panel.hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') panel.hidden = true; });
  function add(m) { m = String(m || '').trim(); if (!m) return; if (list[0] && list[0].m === m && Date.now() - list[0].t < 4000) return; list.unshift({ t: Date.now(), m }); list = list.slice(0, MAX); save(); if (panel.hidden) { unread++; paintBadge(); } else render(); }
  // todo toast passa a ser registrado
  const t0 = window.toast;
  window.toast = function (m, o) { if (!(o && o.nolog)) add(m); return t0.apply(this, arguments); };
  window.Avisos = { add };
})();
