/* =====================================================================
   Proteção dos projetos: lixeira, histórico de versões e cópia na nuvem.
   Carrega depois do app.js e antes do recursos.js.
   ===================================================================== */
'use strict';
const Prot = (() => {
  const KEEP = 15;                 // versões guardadas por projeto
  const EVERY = 15 * 60 * 1000;    // intervalo mínimo entre versões automáticas
  const BUCKET = 'estudio';
  const fmt = (t) => new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const lastSnap = {};
  const LS = {
    get() { try { return JSON.parse(localStorage.getItem('cnu.estudio.sync') || '{}'); } catch (e) { return {}; } },
    set(o) { try { localStorage.setItem('cnu.estudio.sync', JSON.stringify(o)); } catch (e) { /* sem armazenamento */ } },
  };
  const range = (pid) => IDBKeyRange.bound(pid + '/', pid + '/￿');

  /* ---------- versões (neste aparelho) ---------- */
  const vers = {
    keys(pid) {
      return new Promise((res, rej) => {
        const out = [], rq = IDB.db.transaction('versoes', 'readonly').objectStore('versoes').openKeyCursor(range(pid));
        rq.onsuccess = () => { const c = rq.result; if (c) { out.push(c.key); c.continue(); } else res(out); };
        rq.onerror = () => rej(rq.error);
      });
    },
    list(pid) {
      return new Promise((res, rej) => {
        const out = [], rq = IDB.db.transaction('versoes', 'readonly').objectStore('versoes').openCursor(range(pid));
        rq.onsuccess = () => { const c = rq.result; if (c) { out.push({ key: c.key, ts: c.value.ts, motivo: c.value.motivo, paginas: c.value.paginas, nome: c.value.nome }); c.continue(); } else res(out.sort((a, b) => b.ts - a.ts)); };
        rq.onerror = () => rej(rq.error);
      });
    },
    async snap(pid, motivo, meta, pages) {
      if (!pid || !meta) return;
      const ts = Date.now(), order = (meta.order || []).filter((id) => pages[id]);
      const m = Object.assign({}, meta); delete m.id;
      await IDB.put('versoes', pid + '/' + String(ts).padStart(14, '0'), { pid, ts, motivo, nome: meta.name, paginas: order.length, meta: m, pages: Object.fromEntries(order.map((id) => [id, pages[id]])) });
      lastSnap[pid] = ts;
      const ks = await this.keys(pid);
      for (const k of ks.slice(0, Math.max(0, ks.length - KEEP))) await IDB.del('versoes', k);
    },
    async snapOpen(motivo) { if (S.pid) await this.snap(S.pid, motivo, metaDoc(), S.pages); },
    async removeAll(pid) { for (const k of await this.keys(pid)) await IDB.del('versoes', k); },
  };

  /* ---------- lixeira ---------- */
  const allMeta = async () => (await IDB.all('meta')).map(([id, m]) => Object.assign(clone(m), { id }));

  /* ---------- nuvem ---------- */
  const online = () => !!(Cloud.sb && Cloud.user);
  const setCloud = (t) => { const e = $('#cloudSt'); if (e) e.textContent = t; S.cloudMsg = t; };
  const bucket = () => Cloud.sb.storage.from(BUCKET);
  const Sync = {
    busy: false, timer: null, have: null, pending: null,
    async haveAssets(force) {
      if (this.have && !force) return this.have;
      const u = Cloud.user.id, s = new Set();
      for (let off = 0; ; off += 1000) {
        const { data, error } = await bucket().list(u + '/assets', { limit: 1000, offset: off });
        if (error) throw error;
        (data || []).forEach((f) => s.add(f.name));
        if (!data || data.length < 1000) break;
      }
      return (this.have = s);
    },
    async upAssets(ids) {
      const u = Cloud.user.id, have = await this.haveAssets();
      for (const id of ids) {
        if (have.has(id)) continue;
        const blob = await IDB.get('assets', id);
        if (!blob) continue;
        const { error } = await bucket().upload(u + '/assets/' + id, blob, { upsert: true, contentType: blob.type || 'application/octet-stream' });
        if (error) throw error;
        have.add(id);
      }
    },
    async downAssets(ids) {
      const u = Cloud.user.id;
      for (const id of ids) {
        if (ASSET_URL.has(id)) continue;
        const { data, error } = await bucket().download(u + '/assets/' + id);
        if (error || !data) continue;
        await IDB.put('assets', id, data);
        ASSET_URL.set(id, URL.createObjectURL(data));
      }
    },
    refsIn(text) { const out = []; for (const k of ASSET_URL.keys()) if (text.includes(k)) out.push(k); return out; },
    async pushProject(pid) {
      if (!online()) return false;
      const meta = await IDB.get('meta', pid);
      if (!meta) return false;
      const order = meta.order || [], pages = await Store.loadPages(pid, order);
      const body = JSON.stringify({ formato: 'craft-notes-unique/estudio-projeto', versao: 1, meta, pages });
      await this.upAssets(this.refsIn(body));
      const u = Cloud.user.id;
      let r = await bucket().upload(u + '/projetos/' + pid + '.json', new Blob([body], { type: 'application/json' }), { upsert: true, contentType: 'application/json' });
      if (r.error) throw r.error;
      r = await Cloud.sb.from('estudio_projetos').upsert({
        user_id: u, id: pid, nome: meta.name || '', paginas: order.length, tamanhos: Object.keys(meta.sizes || {}).join(' + '),
        versao: meta.updatedAt || 0, criado_em: meta.createdAt || 0, excluido_em: meta.deletedAt || null, atualizado_em: new Date().toISOString(),
      }, { onConflict: 'user_id,id' });
      if (r.error) throw r.error;
      const st = LS.get(); st[pid] = { at: meta.updatedAt || 0 }; LS.set(st);
      return true;
    },
    async pullProject(row) {
      const u = Cloud.user.id;
      const { data, error } = await bucket().download(u + '/projetos/' + row.id + '.json');
      if (error || !data) throw error || new Error('arquivo ausente');
      const text = await data.text(), d = JSON.parse(text);
      if (!d || d.formato !== 'craft-notes-unique/estudio-projeto') throw new Error('formato inesperado');
      const ids = new Set();
      (function walk(o) { if (typeof o === 'string') { if (/^a[a-z0-9]{8,12}$/.test(o)) ids.add(o); } else if (o && typeof o === 'object') Object.values(o).forEach(walk); })(d);
      await this.downAssets([...ids].filter((i) => !ASSET_URL.has(i)));
      const old = await IDB.get('meta', row.id);
      if (old) for (const id of old.order || []) if (!(d.meta.order || []).includes(id)) await Store.delPage(row.id, id);
      for (const id of d.meta.order || []) if (d.pages[id]) await Store.savePage(row.id, id, d.pages[id]);
      await Store.saveMeta(row.id, d.meta);
      const st = LS.get(); st[row.id] = { at: row.versao }; LS.set(st);
    },
    async libRun() {
      const u = Cloud.user.id;
      let cloud = [];
      const dl = await bucket().download(u + '/biblioteca.json');
      if (dl.data) { try { cloud = JSON.parse(await dl.data.text()).lib || []; } catch (e) { cloud = []; } }
      const local = await IDB.all('lib'), lids = new Set(local.map(([k]) => k)), cids = new Set(cloud.map(([k]) => k));
      let changed = false;
      for (const [k, v] of cloud) if (!lids.has(k)) { if (v.src) await this.downAssets([v.src]); await IDB.put('lib', k, v); changed = true; }
      if (local.some(([k]) => !cids.has(k))) {
        const merged = [...cloud, ...local.filter(([k]) => !cids.has(k))];
        await this.upAssets(merged.map(([, v]) => v.src).filter(Boolean));
        const r = await bucket().upload(u + '/biblioteca.json', new Blob([JSON.stringify({ lib: merged })], { type: 'application/json' }), { upsert: true, contentType: 'application/json' });
        if (r.error) throw r.error;
      }
      if (changed) { S.lib = await Store.listLib(); S.lib.filter((x) => x.kind === 'font').forEach(loadUserFont); renderBrand(); renderAppLinks(); }
    },
    async run() {
      if (!online()) return;
      if (this.busy) { this.pending = true; return; }
      this.busy = true; setCloud('Nuvem: sincronizando…');
      try {
        await this.libRun();
        const { data: rows, error } = await Cloud.sb.from('estudio_projetos').select('*');
        if (error) throw error;
        const local = new Map((await allMeta()).map((m) => [m.id, m])), st = LS.get(), seen = new Set(); let moved = 0;
        this.cloudOnly = []; this.conflicts = [];
        for (const r of rows || []) {
          seen.add(r.id);
          const m = local.get(r.id), at = (st[r.id] && st[r.id].at) || 0;
          if (!m) { this.cloudOnly.push(r); continue; }
          const lv = m.updatedAt || 0, cc = r.versao > at, lc = lv > at;
          if (r.versao === lv) { st[r.id] = { at: lv }; LS.set(st); continue; }
          if (cc && !lc) { await this.pullProject(r); moved++; }
          else if (cc && lc) { this.conflicts.push({ row: r, meta: m }); }
          else if (lc) { await this.pushProject(r.id); }
        }
        for (const [id, m] of local) if (!seen.has(id)) await this.pushProject(id);
        setCloud('Nuvem: em dia ✓');
        S.cloudAt = Date.now(); this.moved = moved;
      } catch (e) {
        console.error(e); setCloud('Nuvem: não consegui agora');
      } finally { this.busy = false; }
      if (this.pending) { this.pending = false; return this.run(); }
      if (S.view === 'home') { if (this.moved) { this.moved = 0; await origLoadHome(); } await refreshHome(); }
    },
    soon(pid) {
      if (!online()) return;
      clearTimeout(this.timer); setCloud('Nuvem: aguardando…');
      this.timer = setTimeout(async () => {
        if (this.busy) { this.soon(pid); return; }
        this.busy = true; setCloud('Nuvem: enviando…');
        try { const mm = await IDB.get('meta', pid); if (mm && ((LS.get()[pid] || {}).at === (mm.updatedAt || 0))) { setCloud('Nuvem: em dia ✓'); } else { await this.pushProject(pid); setCloud('Nuvem: salvo ✓'); } } catch (e) { console.error(e); setCloud('Nuvem: não consegui agora'); } finally { this.busy = false; }
      }, 12000);
    },
    async purge(pid) {
      if (!online()) return;
      const u = Cloud.user.id;
      await bucket().remove([u + '/projetos/' + pid + '.json']);
      await Cloud.sb.from('estudio_projetos').delete().eq('user_id', u).eq('id', pid);
      const st = LS.get(); delete st[pid]; LS.set(st);
    },
  };

  /* ---------- interface ---------- */
  async function refreshHome() {
    const L = $('#plist'); if (!L) return;
    let box = $('#cloudBox');
    if (!box) { box = document.createElement('div'); box.id = 'cloudBox'; L.after(box); }
    const co = (Sync.cloudOnly || []).filter((r) => !r.excluido_em), cf = Sync.conflicts || [];
    let h = '';
    if (cf.length) {
      h += `<div class="notice"><h3>Mudou aqui e na nuvem</h3><p class="hint">Estes projetos foram editados neste aparelho e em outro. Escolha qual versão vale; a outra fica guardada no histórico.</p>${cf.map((c) => `<div class="vrow"><span><b>${esc(c.meta.name)}</b><br><small>aqui: ${fmt(c.meta.updatedAt)} · nuvem: ${fmt(c.row.versao)}</small></span><span class="row"><button class="btn sm" data-useCloud="${esc(c.row.id)}">Usar a da nuvem</button><button class="btn sm" data-keepHere="${esc(c.row.id)}">Manter a deste aparelho</button></span></div>`).join('')}</div>`;
    }
    if (co.length) {
      h += `<div class="notice"><h3>Na nuvem, ainda não neste aparelho</h3>${co.map((r) => `<div class="vrow"><span><b>${esc(r.nome || 'Projeto')}</b><br><small>${r.paginas || 0} páginas${r.tamanhos ? ' · ' + esc(r.tamanhos) : ''} · ${fmt(r.versao)}</small></span><button class="btn sm pri" data-down="${esc(r.id)}">Baixar para este aparelho</button></div>`).join('')}</div>`;
    }
    box.innerHTML = h;
    $$('[data-down]', box).forEach((b) => b.onclick = async () => {
      b.disabled = true; b.textContent = 'Baixando…';
      try { await Sync.pullProject(Sync.cloudOnly.find((r) => r.id === b.dataset.down)); toast('Projeto baixado. 🌸'); await loadHome(); } catch (e) { console.error(e); toast('Não consegui baixar agora.'); b.disabled = false; b.textContent = 'Baixar para este aparelho'; }
    });
    $$('[data-useCloud]', box).forEach((b) => b.onclick = async () => {
      const c = Sync.conflicts.find((x) => x.row.id === b.dataset.useCloud); b.disabled = true;
      try {
        const pages = await Store.loadPages(c.meta.id, c.meta.order || []); await vers.snap(c.meta.id, 'Antes de usar a da nuvem', c.meta, pages);
        await Sync.pullProject(c.row); toast('Pronto: usei a versão da nuvem.'); await loadHome();
      } catch (e) { console.error(e); toast('Não consegui agora.'); b.disabled = false; }
    });
    $$('[data-keepHere]', box).forEach((b) => b.onclick = async () => {
      const c = Sync.conflicts.find((x) => x.row.id === b.dataset.keepHere); b.disabled = true;
      try {
        const rm = await bucket().download(Cloud.user.id + '/projetos/' + c.row.id + '.json');
        if (rm.data) { const d = JSON.parse(await rm.data.text()); await vers.snap(c.row.id, 'Versão da nuvem (antes de substituir)', d.meta, d.pages); }
        await Sync.pushProject(c.meta.id); toast('Pronto: a versão deste aparelho foi para a nuvem.'); await loadHome();
      } catch (e) { console.error(e); toast('Não consegui agora.'); b.disabled = false; }
    });
    const tr = (await allMeta()).filter((m) => m.deletedAt).length, tb = $('#trashBtn');
    if (tb) tb.textContent = tr ? `Lixeira (${tr})` : 'Lixeira';
    const sy = $('#syncBtn'); if (sy) sy.hidden = !online();
    const hs = $('#hstatus span'); if (hs && Cloud.sb) hs.textContent = 'Projetos guardados neste aparelho' + (Cloud.user ? ' · cópia na nuvem' + (S.cloudMsg ? ' (' + S.cloudMsg.replace('Nuvem: ', '') + ')' : '') : ' · entre na nuvem para guardar uma cópia');
  }

  async function trashModal() {
    const list = (await allMeta()).filter((m) => m.deletedAt).sort((a, b) => b.deletedAt - a.deletedAt);
    const cloudDel = (Sync.cloudOnly || []).filter((r) => r.excluido_em);
    modal(`<h2>Lixeira</h2><p class="hint">Os projetos excluídos ficam aqui até você apagar de vez.</p>
      ${list.length || cloudDel.length ? '' : '<p class="hint">A lixeira está vazia.</p>'}
      <div class="vlist">${list.map((m) => `<div class="vrow"><span><b>${esc(m.name)}</b><br><small>excluído em ${fmt(m.deletedAt)} · ${m.count || (m.order || []).length} páginas</small></span><span class="row"><button class="btn sm pri" data-rest="${esc(m.id)}">Restaurar</button><button class="btn sm" data-gone="${esc(m.id)}">Apagar de vez</button></span></div>`).join('')}
      ${cloudDel.map((r) => `<div class="vrow"><span><b>${esc(r.nome || 'Projeto')}</b><br><small>na nuvem · excluído</small></span><span class="row"><button class="btn sm pri" data-restc="${esc(r.id)}">Restaurar</button></span></div>`).join('')}</div>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Fechar</button></div>`, (b, close) => {
      $$('[data-rest]', b).forEach((x) => x.onclick = async () => {
        const m = await IDB.get('meta', x.dataset.rest); if (!m) return; delete m.deletedAt; m.updatedAt = Date.now(); await Store.saveMeta(x.dataset.rest, m); close(); toast('Projeto restaurado. 🌸'); await loadHome();
      });
      $$('[data-restc]', b).forEach((x) => x.onclick = async () => {
        const r = Sync.cloudOnly.find((q) => q.id === x.dataset.restc); try { await Sync.pullProject(r); const m = await IDB.get('meta', r.id); delete m.deletedAt; m.updatedAt = Date.now(); await Store.saveMeta(r.id, m); await Sync.pushProject(r.id); close(); toast('Projeto restaurado. 🌸'); await loadHome(); } catch (e) { console.error(e); toast('Não consegui restaurar agora.'); }
      });
      $$('[data-gone]', b).forEach((x) => x.onclick = async () => {
        if (!x.dataset.cf) { x.dataset.cf = 1; x.textContent = 'Confirmar'; setTimeout(() => { if (x.isConnected) { delete x.dataset.cf; x.textContent = 'Apagar de vez'; } }, 4000); return; }
        const id = x.dataset.gone, m = await IDB.get('meta', id);
        try { await Store.delProject(id, m ? m.order || [] : []); await vers.removeAll(id); await Sync.purge(id); } catch (e) { console.error(e); }
        close(); await loadHome();
      });
    });
  }

  async function versModal() {
    if (!S.pid) return;
    await Saver.flush();
    const list = await vers.list(S.pid);
    modal(`<h2>Versões deste projeto</h2><p class="hint">O Estúdio guarda uma versão ao abrir e a cada 15 minutos de edição (as ${KEEP} mais recentes). Voltar a uma versão não apaga nada: a situação atual também é guardada.</p>
      <div class="row"><button class="btn sm pri" id="vNow">Guardar uma versão agora</button></div>
      ${list.length ? '' : '<p class="hint">Ainda não há versões.</p>'}
      <div class="vlist">${list.map((v) => `<div class="vrow"><span><b>${fmt(v.ts)}</b><br><small>${esc(v.motivo || 'Automática')} · ${v.paginas} páginas</small></span><span class="row"><button class="btn sm" data-copy="${esc(v.key)}">Abrir como cópia</button><button class="btn sm" data-back="${esc(v.key)}">Voltar a esta</button></span></div>`).join('')}</div>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Fechar</button></div>`, (b, close) => {
      $('#vNow', b).onclick = async () => { await vers.snapOpen('Guardada por você'); close(); toast('Versão guardada. 🌸'); };
      $$('[data-copy]', b).forEach((x) => x.onclick = async () => {
        const v = await IDB.get('versoes', x.dataset.copy); if (!v) return;
        const map = {}; v.meta.order.forEach((id) => map[id] = uid('pg'));
        const np = v.meta.order.filter((id) => v.pages[id]).map((id) => { const pg = clone(v.pages[id]); pg.id = map[id]; remapLinks(pg, map); return pg; });
        const nid = uid('p'), meta = Object.assign(clone(v.meta), { name: v.nome + ' (versão ' + fmt(v.ts) + ')', order: np.map((p) => p.id), createdAt: Date.now(), updatedAt: Date.now() }); delete meta.deletedAt;
        await pool(np.map((pg) => () => Store.savePage(nid, pg.id, pg)), 4); await Store.saveMeta(nid, meta); close(); toast('Cópia criada nos seus projetos. 🌸');
      });
      $$('[data-back]', b).forEach((x) => x.onclick = async () => {
        if (!x.dataset.cf) { x.dataset.cf = 1; x.textContent = 'Confirmar'; setTimeout(() => { if (x.isConnected) { delete x.dataset.cf; x.textContent = 'Voltar a esta'; } }, 4000); return; }
        const v = await IDB.get('versoes', x.dataset.back); if (!v) return;
        await vers.snapOpen('Antes de voltar a ' + fmt(v.ts));
        const keep = new Set(v.meta.order);
        for (const id of S.order) if (!keep.has(id)) await Store.delPage(S.pid, id);
        const name = S.meta.name, pid = S.pid;
        S.pages = clone(v.pages); S.order = v.meta.order.filter((id) => S.pages[id]);
        S.meta = Object.assign(clone(v.meta), { name, order: S.order.slice(), updatedAt: Date.now() });
        await pool(S.order.map((id) => () => Store.savePage(pid, id, S.pages[id])), 4); await Store.saveMeta(pid, metaDoc());
        close(); await openProject(pid, true); toast('Voltei à versão de ' + fmt(v.ts) + '. 🌸');
      });
    });
  }

  /* ---------- ligações com o editor ---------- */
  const origLP = Store.listProjects.bind(Store);
  Store.listProjects = async () => (await origLP()).filter((m) => !m.deletedAt);

  delProject = async function (pid) {
    const p = S.projects.find((x) => x.id === pid); if (!p) return;
    const m = clone(p); delete m.id; m.deletedAt = Date.now(); m.updatedAt = Date.now();
    try { await Store.saveMeta(pid, m); toast('Movido para a lixeira. 🌸'); Sync.soon(pid); } catch (e) { toast('Não consegui excluir agora.'); }
    loadHome();
  };

  const origLoadHome = loadHome;
  loadHome = async function () {
    await origLoadHome();
    const ft = $('.foot > span'); if (ft && online()) ft.textContent = 'Seus projetos ficam neste aparelho e uma cópia vai para a sua nuvem.';
    await refreshHome();
    Sync.run();
  };

  const origOpen = openProject;
  openProject = async function (pid, fresh) {
    await origOpen(pid, fresh);
    if (S.pid && !(Date.now() - (lastSnap[S.pid] || 0) < EVERY)) {
      const ks = await vers.keys(S.pid), last = ks.length ? Number(ks[ks.length - 1].split('/')[1]) : 0;
      lastSnap[S.pid] = last;
      if (Date.now() - last >= EVERY) await vers.snapOpen('Ao abrir');
    }
  };

  const origFlush = Saver.flush;
  Saver.flush = async function () {
    const r = await origFlush.apply(this, arguments);
    const pid = S.pid;
    if (pid && !this.pending()) {
      if (Date.now() - (lastSnap[pid] || 0) >= EVERY) vers.snapOpen('Automática').catch(() => {});
      Sync.soon(pid);
    }
    return r;
  };

  const origChanged = Cloud.changed.bind(Cloud);
  Cloud.changed = function () { origChanged(); const sy = $('#syncBtn'); if (sy) sy.hidden = !online(); if (online() && !S.cloudAt) Sync.run(); };

  function mount() {
    const tb = $('#trashBtn'); if (tb) tb.onclick = trashModal;
    const sy = $('#syncBtn'); if (sy) sy.onclick = async () => { toast('Sincronizando…'); await Sync.run(); toast(S.cloudMsg || 'Pronto.'); };
    const vb = $('#bVers'); if (vb) vb.onclick = versModal;
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignora */ }
  }
  return { mount, Sync, vers, fmt };
})();
Prot.mount();
