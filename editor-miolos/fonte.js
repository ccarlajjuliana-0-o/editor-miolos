/* Ajuste 75 — Fonte estilo Word: barra de texto (fonte, tamanho, Aa, N I S, tachado, marca-texto, cor, alinhamento)
   usada na segunda janela translúcida (#dbar, abaixo da barra superior) e no painel direito (substitui os campos soltos de fonte). */
(function () {
  'use strict';
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const kk = (b, n) => (b ? b + cap(n) : n);
  const hex = (v) => (/^#[0-9a-f]{6}$/i.test(v || '') ? v : null);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CASES = [['', 'Como está'], ['sentence', 'Primeira letra da frase em maiúscula'], ['lower', 'minúsculas'], ['upper', 'MAIÚSCULAS'], ['title', 'Colocar Cada Palavra Em Maiúscula']];
  const NAMES = ['font', 'size', 'weight', 'italic', 'color', 'align'];
  const svg = (d, w) => `<svg viewBox="0 0 24 24" width="${w || 16}" height="${w || 16}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const AL = { left: 'M4 6h16M4 10h10M4 14h16M4 18h10', center: 'M4 6h16M7 10h10M4 14h16M7 18h10', right: 'M4 6h16M10 10h10M4 14h16M10 18h10' };
  let lastHl = '#FFF176';

  function get(e, b, n) { const v = e[kk(b, n)]; return v === undefined && b ? e[n] : v; }

  /* has: nomes dos campos disponíveis; deco: aceita caixa alta/marca-texto/sublinhado (só texto) */
  function build(e, b, has, deco, title) {
    const H = (n) => has.includes(n), d = e.deco || {}, F = get(e, b, 'font') || '', sz = e[kk(b, 'size')];
    const L = (typeof fontList === 'function' ? fontList() : []); if (F && !L.includes(F)) L.push(F);
    const wt = get(e, b, 'weight') || 400, col = hex(get(e, b, 'color')) || '#3E3550', al = get(e, b, 'align');
    const B = (f, t, inner, on, cls) => `<button type="button" class="rb${cls ? ' ' + cls : ''}${on ? ' on' : ''}" data-f="${f}" title="${t}" aria-label="${t}" aria-pressed="${!!on}">${inner}</button>`;
    let r1 = '', r2 = '';
    if (H('font')) r1 += `<select class="rf" data-f="font" title="Fonte" aria-label="Fonte">${L.map((n) => `<option${n === F ? ' selected' : ''} style="font-family:'${esc(n)}'">${esc(n)}</option>`).join('')}</select>`;
    if (H('size')) r1 += `<input class="rn" type="number" step="0.5" min="0" data-f="size" value="${sz == null ? '' : Math.round(sz * 10) / 10}" placeholder="auto" title="Tamanho (pt)" aria-label="Tamanho"><span class="rg">${B('s+', 'Aumentar a fonte', '<b>A</b><sup>▴</sup>')}${B('s-', 'Diminuir a fonte', '<b>A</b><sup>▾</sup>')}</span>`;
    if (deco) {
      r1 += `<label class="rb rcase" title="Maiúsculas e minúsculas" aria-label="Maiúsculas e minúsculas"><span>Aa</span><select data-f="caps">${CASES.map(([v, t]) => `<option value="${v}"${(d.caps || '') === v ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`;
      r1 += B('clr', 'Limpar formatação', '<span class="rclr">A<i>✕</i></span>');
    }
    if (H('weight')) r2 += B('b', 'Negrito', '<b>N</b>', wt >= 600);
    if (H('italic')) r2 += B('i', 'Itálico', '<i>I</i>', !!get(e, b, 'italic'));
    if (deco) {
      r2 += B('u', 'Sublinhado', '<u>S</u>', !!d.u) + B('st', 'Tachado', '<s>ab</s>', !!d.s);
      r2 += `<span class="rg rhl">${B('hl', 'Cor de realce do texto (marca-texto)', svg('<path d="M9 11l6 6M4 20l4-1 11-11-3-3L5 16l-1 4z"/>', 16) + `<em style="background:${hex(d.hl) || lastHl}"></em>`, !!d.hl, 'rhb')}<label class="rb rcol" title="Escolher a cor do marca-texto"><span>▾</span><input type="color" data-f="hlc" value="${hex(d.hl) || lastHl}" aria-label="Cor do marca-texto"></label></span>`;
    }
    if (H('color')) r2 += `<label class="rb rcol rfc" title="Cor da fonte"><span class="rA">A</span><em style="background:${col}"></em><input type="color" data-f="color" value="${col}" aria-label="Cor da fonte"></label>`;
    if (H('align')) r2 += `<span class="rg">${['left', 'center', 'right'].map((v) => B('al:' + v, { left: 'Alinhar à esquerda', center: 'Centralizar', right: 'Alinhar à direita' }[v], svg(`<path d="${AL[v]}"/>`), (al || 'left') === v)).join('')}</span>`;
    return `<div class="rib" data-base="${b}" data-has="${has.join(',')}" data-deco="${deco ? 1 : 0}">${title ? `<span class="ribt">${esc(title)}</span>` : ''}<div class="rr">${r1}</div><div class="rr">${r2}</div></div>`;
  }

  /* aplicar uma ação da barra */
  function run(rib, f, val) {
    const p = curPage(); if (!p) return; const b = rib.dataset.base || '', K = (n) => kk(b, n);
    const els = selEls().filter((e) => !e.locked); if (!els.length) return;
    const dec = (fn) => els.forEach((e) => { if (e.type !== 'text') return; const d = Object.assign({}, e.deco || {}); fn(d); Object.keys(d).forEach((k) => { if (!d[k]) delete d[k]; }); if (Object.keys(d).length) e.deco = d; else delete e.deco; });
    let fn = null;
    if (f === 'font') fn = (e) => { e[K('font')] = val; };
    else if (f === 'size') { const v = parseFloat(val); fn = (e) => { e[K('size')] = v > 0 ? Math.round(v * 10) / 10 : (b ? 0 : e[K('size')]); }; }
    else if (f === 's+' || f === 's-') fn = (e) => { const c = e[K('size')] || e.size || 10; e[K('size')] = Math.max(1, Math.round((c + (f === 's+' ? 1 : -1)) * 10) / 10); };
    else if (f === 'b') fn = (e) => { const c = get(e, b, 'weight') || 400; e[K('weight')] = c >= 600 ? 400 : 700; };
    else if (f === 'i') fn = (e) => { e[K('italic')] = !get(e, b, 'italic'); };
    else if (f === 'color') fn = (e) => { e[K('color')] = val; };
    else if (f.startsWith('al:')) fn = (e) => { e[K('align')] = f.slice(3); };
    else if (f === 'ws') fn = (e) => { e.weekStart = +val; };
    else if (f === 'wdfmt') fn = (e) => { e.wdFmt = val; };
    else if (f === 'u') fn = () => dec((d) => { d.u = !d.u; });
    else if (f === 'st') fn = () => dec((d) => { d.s = !d.s; });
    else if (f === 'caps') fn = () => dec((d) => { d.caps = val; });
    else if (f === 'hl') fn = () => dec((d) => { d.hl = d.hl ? '' : lastHl; });
    else if (f === 'hlc') { lastHl = val; fn = () => dec((d) => { d.hl = val; }); }
    else if (f === 'clr') fn = (e) => { dec(() => { }); if (e.type === 'text') { delete e.deco; e[K('weight')] = 400; e[K('italic')] = false; } };
    if (!fn) return;
    change([p.id], () => els.forEach(fn)); redraw(); renderProps(); thumbRefresh(p.id);
  }
  document.addEventListener('click', (ev) => { const b = ev.target.closest('.rib button[data-f]'); if (!b) return; run(b.closest('.rib'), b.dataset.f); });
  document.addEventListener('change', (ev) => { const t = ev.target; if (!t.matches || !t.matches('.rib [data-f], #dbar [data-f]')) return; run(t.closest('.rib') || { dataset: { base: '' } }, t.dataset.f, t.value); });

  /* ---------- painel direito: troca os campos soltos pela barra ---------- */
  function decorate() {
    const P = document.getElementById('props'); if (!P) return; P.querySelectorAll('.ribw').forEach((x) => x.remove());
    P.querySelectorAll('[data-k][hidden]').forEach((x) => { x.hidden = false; });
    const sel = typeof selEls === 'function' ? selEls() : []; if (sel.length !== 1 || S.view !== 'editor') return; const e = sel[0];
    P.querySelectorAll('select[data-k]').forEach((s) => {
      const k = s.dataset.k; if (!(k === 'font' || /[a-z]Font$/.test(k)) || s.closest('.rib')) return;
      const b = k === 'font' ? '' : k.slice(0, -4), lab = s.closest('.pfield'); if (!lab || lab.hidden) return;
      const has = NAMES.filter((n) => P.querySelector(`[data-k="${kk(b, n)}"]`)), hide = [];
      has.forEach((n) => { const x = P.querySelector(`[data-k="${kk(b, n)}"]`).closest('.pfield,.chk'); if (x) hide.push(x); });
      const w = document.createElement('div'); w.className = 'ribw'; w.innerHTML = build(e, b, has, !b && e.type === 'text', (lab.querySelector('span') || {}).textContent || 'Fonte');
      const ref = lab.closest('.crow') || lab; ref.parentNode.insertBefore(w, ref);
      hide.forEach((x) => { x.hidden = true; const c = x.parentNode; if (c && c.classList.contains('crow') && [...c.children].every((y) => y.hidden)) c.hidden = true; });
    });
  }
  const r0 = renderProps; renderProps = function () { const r = r0.apply(this, arguments); try { decorate(); } catch (err) { console.warn(err); } return r; };

  /* ---------- segunda janela (docked) ---------- */
  const dock = document.createElement('div'); dock.id = 'dbar'; dock.hidden = true; dock.setAttribute('role', 'toolbar'); dock.setAttribute('aria-label', 'Formatação de texto');
  const host = document.getElementById('wsw') || document.body; host.appendChild(dock);
  dock.addEventListener('pointerdown', (e) => e.stopPropagation());
  const opt = (v, t, c) => `<option value="${v}"${String(v) === String(c) ? ' selected' : ''}>${t}</option>`;
  let dsig = '';
  function html(els) {
    const e = els[0], t = e.type; if (els.some((x) => x.type !== t) || typeof FIELDS === 'undefined') return '';
    const fl = (FIELDS[t] || []).map((f) => f[0]); if (!fl.includes('font')) return '';
    const has = NAMES.filter((n) => fl.includes(n)), name = (typeof TYPE_NAME !== 'undefined' && TYPE_NAME[t]) || 'Texto';
    let x = build(e, '', has, t === 'text', '');
    if (t === 'calendar' || t === 'yearcal') x += `<div class="rib rext"><span class="ribt">Dias da semana</span><div class="rr"><select data-f="wdfmt" title="Nomes dos dias da semana" aria-label="Nomes dos dias da semana">${[['auto', 'Automático'], ['letra', 'Só a inicial (D, S…)'], ['abrev', 'Abreviado (dom…)'], ['extenso', 'Por extenso']].map(([v, tt]) => opt(v, tt, e.wdFmt || 'auto')).join('')}</select><select data-f="ws" title="A semana começa em" aria-label="A semana começa em">${opt(0, 'Começa no domingo', e.weekStart || 0)}${opt(1, 'Começa na segunda', e.weekStart || 0)}</select></div></div>`;
    return `<div class="dkw"><span class="dkt">${esc(name)}</span>${x}</div>`;
  }
  function sync(els) {
    if (!els || !els.length) { dock.hidden = true; dsig = ''; return; }
    const key = JSON.stringify(els.map((e) => [e.id, e.type, e.font, e.size, e.weight, e.italic, e.color, e.align, e.deco, e.wdFmt, e.weekStart, e.locked])) + (typeof S !== 'undefined' ? S.tab : '');
    if (key !== dsig) { const h = html(els); dsig = key; if (!dock.contains(document.activeElement) || !document.activeElement.matches('input,select')) dock.innerHTML = h; dock.dataset.empty = h ? '' : '1'; }
    dock.hidden = dock.dataset.empty === '1';
  }
  window.Dock = { sync, el: dock, build };
})();
