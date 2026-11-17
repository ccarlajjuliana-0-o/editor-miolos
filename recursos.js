"use strict";
/* ================= recursos novos: bordas, repetir em várias páginas, régua e grade, widgets de data ================= */

const PREF_K='cnu-estudio-prefs';
const Pref={rulers:false,grid:false,snap:false,step:5};
try{Object.assign(Pref,JSON.parse(localStorage.getItem(PREF_K)||'{}'))}catch(e){}
const savePref=()=>{try{localStorage.setItem(PREF_K,JSON.stringify(Pref))}catch(e){}};

/* ---------- escolha de páginas (usada pelas bordas e por "repetir em outras páginas") ---------- */
function parseLista(txt,total){const out=new Set();for(const part of String(txt||'').split(',')){const t=part.trim();if(!t)continue;const m=/^(\d+)\s*-\s*(\d+)$/.exec(t);
    if(m){let a=+m[1],b=+m[2];if(a>b)[a,b]=[b,a];for(let i=a;i<=b;i++)if(i>=1&&i<=total)out.add(i)}else if(/^\d+$/.test(t)&&+t>=1&&+t<=total)out.add(+t)}
  return [...out].sort((a,b)=>a-b)}
function scopeHTML(px,comAtual){return `<label class="f">Em quais páginas<select id="${px}Sc">${comAtual?'<option value="cur">Só nesta página</option>':''}<option value="all">Todas as páginas</option><option value="odd">Páginas ímpares (1, 3, 5…)</option><option value="even">Páginas pares (2, 4, 6…)</option><option value="size">Todas do mesmo tamanho desta</option><option value="range">Do número… ao número…</option><option value="lista">Escolher números (ex.: 1, 3, 5-9)</option></select></label>
  <div class="fgrid" id="${px}Rg" hidden><label class="f">De<input type="number" id="${px}A" min="1" max="${S.order.length}" value="1"></label><label class="f">Até<input type="number" id="${px}B" min="1" max="${S.order.length}" value="${S.order.length}"></label></div>
  <label class="f" id="${px}Ls" hidden>Números das páginas<input type="text" id="${px}L" placeholder="1, 3, 5-9"></label>`}
function mountScope(b,px){const upd=()=>{const v=$(`#${px}Sc`,b).value;$(`#${px}Rg`,b).hidden=v!=='range';$(`#${px}Ls`,b).hidden=v!=='lista'};$(`#${px}Sc`,b).onchange=upd;upd()}
function readScope(b,px){const v=$(`#${px}Sc`,b).value,n=S.order.length,cur=curPage();let nums;
  if(v==='cur')return [cur.id];
  if(v==='all')nums=S.order.map((_,i)=>i+1);
  else if(v==='odd')nums=S.order.map((_,i)=>i+1).filter(i=>i%2===1);
  else if(v==='even')nums=S.order.map((_,i)=>i+1).filter(i=>i%2===0);
  else if(v==='size')nums=S.order.map((id,i)=>[id,i+1]).filter(([id])=>Math.abs(S.pages[id].w-cur.w)<.6&&Math.abs(S.pages[id].h-cur.h)<.6).map(x=>x[1]);
  else if(v==='range'){let a=cl(+$(`#${px}A`,b).value||1,1,n),z=cl(+$(`#${px}B`,b).value||n,1,n);if(a>z)[a,z]=[z,a];nums=[...Array(z-a+1)].map((_,i)=>a+i)}
  else nums=parseLista($(`#${px}L`,b).value,n);
  return nums.map(i=>S.order[i-1])}

/* ---------- bordas ---------- */
const BORDER_PRESETS=[['moldura','Moldura inteira'],['embaixo','Só embaixo'],['topo','Só em cima'],['topo-baixo','Em cima e embaixo'],['laterais','Só as laterais'],['externa','Só a lateral de fora'],['interna','Só a lateral da encadernação'],['meio-h','Faixa no meio (deitada)'],['meio-v','Faixa no meio (em pé)']];
const BORDER_DEF={preset:'moldura',kind:'cor',color:'#C398C8',width:2,inset:6,style:'solid',radius:3,opacity:1,src:null};
function bandRects(pg,b){const W=pg.w,H=pg.h,t=b.width,i=b.inset,n=(S.order.indexOf(pg.id)+1)||1,odd=n%2===1;
  const top={x:i,y:i,w:W-2*i,h:t,vert:false},bot={x:i,y:H-i-t,w:W-2*i,h:t,vert:false},lef={x:i,y:i,w:t,h:H-2*i,vert:true},rig={x:W-i-t,y:i,w:t,h:H-2*i,vert:true};
  switch(b.preset){case 'embaixo':return[bot];case 'topo':return[top];case 'topo-baixo':return[top,bot];case 'laterais':return[lef,rig];
    case 'externa':return[odd?rig:lef];case 'interna':return[odd?lef:rig];
    case 'meio-h':return[{x:i,y:(H-t)/2,w:W-2*i,h:t,vert:false}];case 'meio-v':return[{x:(W-t)/2,y:i,w:t,h:H-2*i,vert:true}];
    default:return[top,bot,{x:i,y:i+t,w:t,h:H-2*i-2*t,vert:true},{x:W-i-t,y:i+t,w:t,h:H-2*i-2*t,vert:true}]}}
function tileStrip(c,im,r){const T=r.vert?r.w:r.h,L=r.vert?r.h:r.w,iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;if(!iw||!ih||T<=0)return;
  const tw=T*iw/ih,cnt=Math.max(1,Math.round(L/tw)),sw=L/cnt;c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();
  if(r.vert){c.translate(r.x+T,r.y);c.rotate(Math.PI/2)}else c.translate(r.x,r.y);
  for(let k=0;k<cnt;k++)c.drawImage(im,k*sw,0,sw,T);c.restore()}
function lineBand(c,r,b){const t=b.width;c.save();c.strokeStyle=b.color;c.fillStyle=b.color;c.lineCap='butt';
  const along=(off,w)=>{c.beginPath();if(r.vert){c.moveTo(r.x+off,r.y);c.lineTo(r.x+off,r.y+r.h)}else{c.moveTo(r.x,r.y+off);c.lineTo(r.x+r.w,r.y+off)}c.lineWidth=w;c.stroke()};
  if(b.style==='dash'){c.setLineDash([t*3,t*2]);along(t/2,t)}
  else if(b.style==='dot'){c.lineCap='round';c.setLineDash([0,t*2]);along(t/2,t)}
  else if(b.style==='double'){along(t/6,t/3);along(t-t/6,t/3)}
  else c.fillRect(r.x,r.y,r.w,r.h);c.restore()}
function drawBorder(c,pg){const b=pg.border;if(!b||!b.preset)return;c.save();c.globalAlpha=b.opacity??1;
  if(b.kind==='imagem'){const im=getImg(b.src);if(im)for(const r of bandRects(pg,b))tileStrip(c,im,r)}
  else if(b.preset==='moldura'){const t=b.width,i=b.inset,x=i+t/2,y=i+t/2,w=pg.w-2*i-t,h=pg.h-2*i-t,rad=Math.max(0,b.radius||0);c.strokeStyle=b.color;c.lineCap='butt';
    const frame=(dx,lw,rd)=>{rr(c,x+dx,y+dx,w-2*dx,h-2*dx,rd);c.lineWidth=lw;c.stroke()};
    if(b.style==='dash'){c.setLineDash([t*3,t*2]);frame(0,t,rad)}else if(b.style==='dot'){c.lineCap='round';c.setLineDash([0,t*2]);frame(0,t,rad)}
    else if(b.style==='double'){frame(-t/2+t/6,t/3,rad+t/2);frame(t/2-t/6,t/3,Math.max(0,rad-t/2))}else frame(0,t,rad)}
  else for(const r of bandRects(pg,b))lineBand(c,r,b);
  c.restore()}
function borderEdit(){if(!S.bordaEdit){const p=curPage();S.bordaEdit=Object.assign({},BORDER_DEF,p&&p.border?clone(p.border):{})}return S.bordaEdit}
function applyBorder(ids,border){change(ids,()=>ids.forEach(id=>{S.pages[id].border=border?clone(border):null}));redraw();refreshThumbs();renderProps()}
const BORDER_IMGS=()=>S.lib.filter(x=>['border','sticker','widget','background'].includes(x.kind)&&x.src);

/* ---------- repetir elementos em outras páginas ---------- */
function addUnit(iso,unit,n){const d=fromIso(iso);if(!d||!n)return iso;if(unit==='mes')d.setMonth(d.getMonth()+n);else d.setDate(d.getDate()+n*(unit==='semana'?7:1));return isoOf(d)}
function repeatEls(src,ids,o){const cur=curPage(),srcIdx=S.order.indexOf(cur.id);const grps=new Set();
  change([...new Set([cur.id,...ids])],()=>{src.forEach(e=>{const live=cur.els.find(x=>x.id===e.id);if(live&&!live.grp)live.grp=uid('g');e.grp=live?live.grp:(e.grp||uid('g'));grps.add(e.grp)});
    ids.forEach(id=>{if(id===cur.id)return;const pg=S.pages[id],idx=S.order.indexOf(id),fx=pg.w/cur.w,fy=pg.h/cur.h,fm=Math.min(fx,fy);
      pg.els=pg.els.filter(x=>!grps.has(x.grp));
      const flip=o.mirror&&((idx+1)%2!==(srcIdx+1)%2);
      src.forEach(e=>{const c=clone(e);c.id=uid('e');c.grp=e.grp;c.locked=!!e.locked;
        if(fx!==1||fy!==1){c.x=r1(c.x*fx);c.y=r1(c.y*fy);c.w=r1(c.w*fm);c.h=r1(c.h*fm)}
        if(flip){c.x=r1(pg.w-c.x-c.w);c.rot=((360-(c.rot||0))%360)}
        if(c.type==='datebox'&&o.unit&&o.unit!=='nenhum')c.date=addUnit(c.date,o.unit,idx-srcIdx);
        pg.els.push(c)})})});
  redraw();refreshThumbs()}
function removeRepeats(src){const cur=curPage(),grps=new Set(src.map(e=>e.grp).filter(Boolean));if(!grps.size)return 0;let n=0;
  const ids=S.order.filter(id=>id!==cur.id&&S.pages[id].els.some(x=>grps.has(x.grp)));
  change(ids,()=>ids.forEach(id=>{const pg=S.pages[id],b=pg.els.length;pg.els=pg.els.filter(x=>!grps.has(x.grp));n+=b-pg.els.length}));redraw();refreshThumbs();return n}
function repeatModal(){const src=selEls().map(clone);if(!src.length){toast('Selecione um elemento primeiro.');return}const hasDate=src.some(e=>e.type==='datebox'),had=selEls().some(e=>e.grp);
  modal(`<h2>Repetir em outras páginas</h2><p class="hint">Copia ${src.length===1?'o elemento selecionado':'os '+src.length+' elementos selecionados'} para as páginas que você escolher. Se repetir de novo, as cópias anteriores são trocadas, e não duplicadas.</p>
    ${scopeHTML('rp',false)}
    <label class="f">Posição<select id="rpMir"><option value="0">Mesmo lugar em todas</option><option value="1">Espelhar nas páginas do outro lado (ímpar ↔ par)</option></select></label>
    ${hasDate?`<label class="f">Data a cada página<select id="rpUn"><option value="nenhum">Manter a mesma data</option><option value="dia">Avançar 1 dia por página</option><option value="semana">Avançar 1 semana por página</option><option value="mes">Avançar 1 mês por página</option></select></label>`:''}
    <p class="hint" id="rpMsg"></p>
    <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button>${had?'<button class="btn danger" id="rpDel">Remover as cópias</button>':''}<button class="btn pri" id="rpGo">Repetir</button></div>`,(b,close)=>{
    mountScope(b,'rp');
    $('#rpGo',b).onclick=()=>{const ids=readScope(b,'rp').filter(id=>id!==curPage().id);if(!ids.length){$('#rpMsg',b).textContent='Escolha pelo menos uma página (além desta).';return}
      repeatEls(src,ids,{mirror:$('#rpMir',b).value==='1',unit:hasDate?$('#rpUn',b).value:'nenhum'});close();renderProps();toast(`Repetido em ${ids.length} página${ids.length===1?'':'s'}.`)};
    if(had)$('#rpDel',b).onclick=()=>{const n=removeRepeats(selEls());close();toast(n?`${n} cópia${n===1?'':'s'} removida${n===1?'':'s'}.`:'Nenhuma cópia encontrada.')}})}

/* ---------- widgets de data ---------- */
const isoOf=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function fromIso(s){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null}
function semanaTexto(d,ws){const a=addDays(d,-((d.getDay()-ws+7)%7)),z=addDays(a,6);return a.getMonth()===z.getMonth()?`${a.getDate()} a ${z.getDate()} de ${MESES[z.getMonth()]}`:`${a.getDate()} de ${MES3[a.getMonth()]} a ${z.getDate()} de ${MES3[z.getMonth()]}`}
R.datebox=function(c,e){const pad=Math.min(e.w,e.h)*.1,d=fromIso(e.date),fmt=d?e.fmt:'branco',lab=e.showLabel!==false&&e.label;
  rr(c,0,0,e.w,e.h,e.radius||0);fillIf(c,e.fill);strokeIf(c,e.stroke,e.sw);
  let top=0;if(lab){const fs=Math.min(e.h*.2,3.3);font(c,fs,e.font,600);c.fillStyle=e.accent;setLS(c,.12*fs*F);T(c,e.label,pad,pad+fs*.5,'left','middle');setLS(c,0);top=pad+fs*1.25}
  const aw=e.w-2*pad,ah=e.h-top-pad*.7,cy=top+ah/2,fit=(t,max,fam,wt,w=aw)=>{let fs=max;font(c,fs,fam,wt);while(M(c,t)>w&&fs>1.2){fs*=.92;font(c,fs,fam,wt)}return fs};
  c.fillStyle=e.color;
  if(fmt==='dia'){const nf=Math.min(ah*.95,e.w*.34);font(c,nf,e.titleFont,400);c.fillStyle=e.accent;const nw=M(c,String(d.getDate()));T(c,String(d.getDate()),pad+nw/2,cy,'center','middle');
    const x=pad+nw+pad*.6,w=e.w-x-pad;c.fillStyle=e.color;let fs=fit(DIAS[d.getDay()],Math.min(ah*.3,4.2),e.font,600,w);T(c,DIAS[d.getDay()],x,cy-fs*.65,'left','middle');
    const t2=MESES[d.getMonth()]+' '+d.getFullYear();fs=fit(t2,Math.min(ah*.28,3.8),e.font,400,w);c.fillStyle=e.color;T(c,t2,x,cy+fs*.75,'left','middle');return}
  let t1='',t2='';
  if(fmt==='curto')t2=String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
  else if(fmt==='extenso'){t1=DIAS[d.getDay()];t2=`${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`}
  else if(fmt==='semana')t2=semanaTexto(d,+e.weekStart||0);
  else if(fmt==='mes')t2=cap(MESES[d.getMonth()])+' '+d.getFullYear();
  else t2='____ / ____ / ________';
  if(t1){const f1=fit(t1,Math.min(ah*.3,3.8),e.font,400);c.fillStyle=e.color;T(c,t1,e.w/2,cy-f1*.8,'center','middle');const f2=fit(t2,Math.min(ah*.42,6),e.titleFont,600);c.fillStyle=e.color;T(c,t2,e.w/2,cy+f2*.45,'center','middle')}
  else{const f2=fit(t2,Math.min(ah*.5,7),e.titleFont,600);c.fillStyle=e.color;T(c,t2,e.w/2,cy,'center','middle')}};
FIELDS.datebox=[['fmt','Formato','sel',[['extenso','Dia da semana e data'],['dia','Número do dia grande'],['curto','dd/mm/aaaa'],['semana','Semana (de … a …)'],['mes','Mês e ano'],['branco','Em branco (para escrever à mão)']]],['date','Data (escolha no calendário)','date'],['weekStart','Semana começa','sel',[[0,'Domingo'],[1,'Segunda']]],['label','Rótulo','text'],['showLabel','Mostrar rótulo','chk'],['font','Fonte do texto','font'],['titleFont','Fonte da data','font'],['color','Texto','color'],['accent','Rótulo e número','color'],['fill','Fundo','colorN'],['stroke','Contorno','colorN'],['sw','Espessura (mm)','num',.05],['radius','Cantos (mm)','num',.5]];
TYPE_NAME.datebox='Data';
const dateBox=(st,o)=>E('datebox',0,0,o&&o.fmt==='dia'?58:52,o&&o.fmt==='dia'?20:18,Object.assign({fmt:'extenso',date:isoOf(new Date()),weekStart:1,label:'data',showLabel:true,font:st.title,titleFont:st.title,color:st.pal.text,accent:st.pal.a,fill:'#FFFFFF',stroke:st.pal.a,sw:.35,radius:3},o));
WIDGETS.push(
 ['data-ext','Data por extenso',(p,st)=>dateBox(st,{})],
 ['data-dia','Data com dia grande',(p,st)=>dateBox(st,{fmt:'dia',titleFont:st.script,label:'',showLabel:false})],
 ['data-curta','Data curta',(p,st)=>dateBox(st,{fmt:'curto'})],
 ['data-sem','Semana',(p,st)=>dateBox(st,{fmt:'semana',label:'semana'})],
 ['data-mes','Mês e ano',(p,st)=>dateBox(st,{fmt:'mes',label:'mês',titleFont:st.script})],
 ['data-bco','Data em branco',(p,st)=>dateBox(st,{fmt:'branco',date:'',label:'data'})]);

/* ---------- régua, grade e guias ---------- */
function extraOverlay(p,k){let h='';
  if(Pref.grid){const s=Math.max(2,Pref.step*k);h+=`<div class="gridov" style="background-image:linear-gradient(to right,rgba(110,138,181,.28) 1px,transparent 1px),linear-gradient(to bottom,rgba(110,138,181,.28) 1px,transparent 1px);background-size:${s}px ${s}px"></div>`}
  const A=stagePgs(),L=A.length>1?S.pages[A[0].dataset.id]:null,R=A.length>1?S.pages[A[1].dataset.id]:null,TT='Arraste para mover; dois cliques troca entre contínua e separada; solte fora da página para apagar';
  const dr=(g,i,own,sp,pos)=>{h+=g.v!==undefined?`<div class="ug v${sp?' sp':''}" data-gi="${i}" data-go="${own}" style="left:${pos*k}px" title="${TT}"></div>`:`<div class="ug h${sp?' sp':''}" data-gi="${i}" data-go="${own}" style="top:${pos*k}px" title="${TT}"></div>`};
  (p.guides||[]).forEach((g,i)=>{const sp=!!(g.sp&&L&&p===L);if(sp&&g.v!==undefined&&g.v>p.w)return;dr(g,i,p.id,sp,g.v!==undefined?g.v:g.h)});
  if(R&&p===R)(L.guides||[]).forEach((g,i)=>{if(!g.sp)return;if(g.v===undefined)dr(g,i,L.id,true,g.h);else if(g.v>L.w)dr(g,i,L.id,true,g.v-L.w)});
  return h}
const cssv=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim()||'#888';
function stagePgs(){return [...document.querySelectorAll('#stage .pg')]}
function paintRuler(cv,dir,segs,k,len,free){const d=devicePixelRatio||1,w=dir==='h'?len:20,h=dir==='h'?20:len;cv.width=Math.max(1,Math.round(w*d));cv.height=Math.max(1,Math.round(h*d));
  const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);c.fillStyle=cssv('--surface');c.fillRect(0,0,w,h);
  c.fillStyle=cssv('--surface2');segs.forEach(g=>{const a=g.o,b=g.o+g.L*k;if(dir==='h')c.fillRect(Math.max(0,a),0,Math.min(len,b)-Math.max(0,a),20);else c.fillRect(0,Math.max(0,a),20,Math.min(len,b)-Math.max(0,a))});
  c.strokeStyle=cssv('--muted');c.fillStyle=cssv('--muted');c.lineWidth=1;c.font='10px Nunito, sans-serif';c.textBaseline='top';c.textAlign='left';
  const stepMm=k>=4?1:k>=1.6?5:10,ls=[1,2,5,10,20,50].find(n=>10*k*n>=26)||100;c.beginPath();
  segs.forEach(g=>{const i0=free?Math.floor(-g.o/k/stepMm)*stepMm:0,i1=free?Math.ceil((len-g.o)/k):Math.floor(g.L);
    for(let mm=i0;mm<=i1;mm+=stepMm){const pos=Math.round(g.o+mm*k)+.5;if(pos<0||pos>len)continue;const big=mm%10===0,mid=mm%5===0,t=big?12:mid?8:5;
      if(dir==='h'){c.moveTo(pos,20);c.lineTo(pos,20-t)}else{c.moveTo(20,pos);c.lineTo(20-t,pos)}
      if(big&&(mm/10)%ls===0){const lb=String(mm/10);if(dir==='h')c.fillText(lb,pos+2,2);else{c.save();c.translate(2,pos+2);c.rotate(-Math.PI/2);c.textAlign='right';c.fillText(lb,0,0);c.restore()}}}});
  c.stroke()}
function drawRulers(){const wrap=$('#wsw');if(!wrap||!wrap.classList.contains('rl'))return;const pgs=stagePgs();if(!pgs.length)return;
  const H=$('#rulerH'),V=$('#rulerV'),hr=H.getBoundingClientRect(),vr=V.getBoundingClientRect(),one=pgs.length===1;
  const sh=pgs.map(el=>({o:el.getBoundingClientRect().left-hr.left,L:(S.pages[el.dataset.id]||{w:0}).w})),r0=pgs[0].getBoundingClientRect(),p0=S.pages[pgs[0].dataset.id];if(!p0)return;
  paintRuler(H,'h',one?[sh[0]]:sh,S.k,hr.width,one);paintRuler(V,'v',[{o:r0.top-vr.top,L:p0.h}],S.k,vr.height,true)}
function applyRulerMode(){$('#wsw').classList.toggle('rl',!!Pref.rulers);$('#bRuler').classList.toggle('on',!!Pref.rulers);$('#bGrid').classList.toggle('on',!!Pref.grid);if(S.view==='editor')renderStage()}
$('#ws').addEventListener('scroll',()=>drawRulers(),{passive:true});
$('#bRuler').onclick=()=>{Pref.rulers=!Pref.rulers;savePref();applyRulerMode();if(S.view==='editor')renderProps()};
$('#bGrid').onclick=()=>{Pref.grid=!Pref.grid;savePref();$('#bGrid').classList.toggle('on',Pref.grid);redraw();renderProps()};
/* guias: arraste a partir da régua; arraste a guia para mover; solte fora da página para apagar */
let G=null;
const gEnv=()=>stagePgs().map(el=>({el,id:el.dataset.id,p:S.pages[el.dataset.id],r:el.getBoundingClientRect()})).filter(e=>e.p);
const pageAt=(env,x)=>env.find(e=>x>=e.r.left&&x<e.r.right)||(x<env[0].r.left?env[0]:env[env.length-1]);
function startGuide(ev,kind,ref){const env=gEnv();if(!env.length)return;ev.preventDefault();const ids=env.map(e=>e.id),b=snapOf(ids);let g,ownerId,span=false;
  if(ref){const o=S.pages[ref.ownerId];g=o&&o.guides&&o.guides[ref.idx];if(!g)return;ownerId=ref.ownerId;span=!!(g.sp&&env.length>1&&ownerId===env[0].id)}
  else{span=env.length>1&&(!!Pref.spanG!==!!ev.shiftKey);const o=span?env[0]:pageAt(env,ev.clientX);ownerId=o.id;g=kind==='v'?{v:0}:{h:0};if(span)g.sp=1;(o.p.guides=o.p.guides||[]).push(g)}
  G={kind,g,ownerId,span,env,ids,b};moveGuide(ev);window.addEventListener('pointermove',moveGuide);window.addEventListener('pointerup',endGuide,{once:true})}
function gRaw(ev){const e=G.env,t=G.span?e[0]:pageAt(e,ev.clientX);return {t,v:G.kind==='v'?(ev.clientX-(G.span?e[0].r.left:t.r.left))/S.k:(ev.clientY-e[0].r.top)/S.k}}
function moveGuide(ev){if(!G)return;const {t,v}=gRaw(ev),g=G.g;
  if(!G.span&&t.id!==G.ownerId){const o=S.pages[G.ownerId];o.guides=(o.guides||[]).filter(x=>x!==g);if(!o.guides.length)delete o.guides;(t.p.guides=t.p.guides||[]).push(g);G.ownerId=t.id}
  const q=Pref.snap&&!ev.altKey?Math.round(v/Pref.step)*Pref.step:v;if(G.kind==='v')g.v=r1(q);else g.h=r1(q);drawOverlaysOnly()}
function endGuide(ev){window.removeEventListener('pointermove',moveGuide);if(!G)return;const {kind,g,ids,b,env}=G,{v}=gRaw(ev);let out;
  if(kind==='v')out=ev.clientX<env[0].r.left||ev.clientX>env[env.length-1].r.right;else out=v<0||v>env[0].p.h;
  const o=S.pages[G.ownerId];G=null;if(out&&o){o.guides=(o.guides||[]).filter(x=>x!==g)}
  ids.forEach(id=>{const q=S.pages[id];if(q&&q.guides&&!q.guides.length)delete q.guides});pushHist(b,snapOf(ids));drawOverlaysOnly();renderProps()}
$('#rulerH').addEventListener('pointerdown',ev=>startGuide(ev,'h',null));$('#rulerV').addEventListener('pointerdown',ev=>startGuide(ev,'v',null));
$('#stage').addEventListener('pointerdown',ev=>{const g=ev.target.closest&&ev.target.closest('.ug');if(!g)return;ev.stopPropagation();const w=g.closest('.pg');if(!w)return;
  if(+w.dataset.idx!==S.cur){S.cur=+w.dataset.idx;S.sel=[];$$('#stage .pg').forEach(x=>x.classList.toggle('on',x===w));updNav();markStrip()}
  const own=g.dataset.go||w.dataset.id,ix=+g.dataset.gi,now=Date.now(),l=window._lg;
  if(l&&now-l.t<400&&l.o===own&&l.i===ix&&Math.abs(ev.clientX-l.x)+Math.abs(ev.clientY-l.y)<8){window._lg=null;ev.preventDefault();toggleGuide(own,ix);return}
  window._lg={t:now,o:own,i:ix,x:ev.clientX,y:ev.clientY};
  startGuide(ev,g.classList.contains('v')?'v':'h',{ownerId:own,idx:ix})},true);
/* dois cliques numa guia: troca entre "contínua" (atravessa as duas páginas) e "separada" (só de uma página) */
function toggleGuide(ownerId,i){const env=gEnv();
  if(env.length<2){toast('Guias contínuas existem na visualização de página dupla.');return}
  const o=S.pages[ownerId],g=o&&o.guides&&o.guides[i];if(!g)return;
  const L=env[0].p,R=env[1].p,ids=env.map(e=>e.id),b=snapOf(ids),was=!!(g.sp&&ownerId===L.id);
  o.guides.splice(i,1);
  if(!was){if(g.v!==undefined&&ownerId===R.id)g.v=r1(g.v+L.w);g.sp=1;(L.guides=L.guides||[]).push(g)}
  else{delete g.sp;if(g.v!==undefined&&g.v>L.w){g.v=r1(g.v-L.w);(R.guides=R.guides||[]).push(g)}else(L.guides=L.guides||[]).push(g)}
  ids.forEach(id=>{const q=S.pages[id];if(q&&q.guides&&!q.guides.length)delete q.guides});pushHist(b,snapOf(ids));drawOverlaysOnly();renderProps();toast(was?'Guia separada: agora só de uma página.':'Guia contínua: atravessa as duas páginas.')}
function gridControlsHTML(){if(!Pref.rulers&&!Pref.grid)return '';return `<div class="pgrp"><h3 style="font-size:12px;color:var(--muted)">RÉGUA, GRADE E GUIAS</h3>
  <label class="chk"><input type="checkbox" id="gRul"${Pref.rulers?' checked':''}> Mostrar régua (arraste dela para criar guias)</label>
  <label class="chk"><input type="checkbox" id="gGrid"${Pref.grid?' checked':''}> Mostrar grade</label>
  <label class="chk"><input type="checkbox" id="gSnap"${Pref.snap?' checked':''}> Encaixar na grade ao mover (Alt solta)</label>
  <label class="pfield"><span>Tamanho dos quadrinhos</span><select id="gStep">${[2.5,5,10,20].map(v=>`<option value="${v}"${Pref.step===v?' selected':''}>${String(v).replace('.',',')} mm</option>`).join('')}</select></label>
  <div class="pfield"><span>Guias novas na página dupla</span><div class="segf" id="gSpan"><button type="button" data-s="0" class="${Pref.spanG?'':'on'}">Separadas</button><button type="button" data-s="1" class="${Pref.spanG?'on':''}">Contínuas</button></div></div>
  <p class="hint">Contínua = uma guia só que atravessa as duas páginas. Segure Shift ao arrastar para usar o outro tipo; dois cliques numa guia troca o tipo.</p>
  ${(curPage().guides||[]).length||stagePgs().some(e=>(S.pages[e.dataset.id]||{}).guides)?`<div class="row"><button class="btn sm" id="gAllG">Copiar guias para todas as páginas</button><button class="btn sm ghost danger" id="gClr">Limpar guias</button></div>`:''}</div>`}
function mountGridControls(P){if(!$('#gRul',P))return;$('#gSpan',P).onclick=e=>{const b=e.target.closest('button');if(!b)return;Pref.spanG=b.dataset.s==='1';savePref();renderProps()};$('#gRul',P).onchange=e=>{Pref.rulers=e.target.checked;savePref();applyRulerMode();if(!Pref.rulers&&!Pref.grid)renderProps()};
  $('#gGrid',P).onchange=e=>{Pref.grid=e.target.checked;savePref();$('#bGrid').classList.toggle('on',Pref.grid);redraw();if(!Pref.rulers&&!Pref.grid)renderProps()};
  $('#gSnap',P).onchange=e=>{Pref.snap=e.target.checked;savePref()};
  $('#gStep',P).onchange=e=>{Pref.step=+e.target.value;savePref();redraw()};
  const p=curPage();if($('#gClr',P))$('#gClr',P).onclick=()=>{const ids=stagePgs().map(e=>e.dataset.id);change(ids.length?ids:[p.id],()=>{(ids.length?ids:[p.id]).forEach(id=>{if(S.pages[id])delete S.pages[id].guides})});redraw();renderProps()};
  if($('#gAllG',P))$('#gAllG',P).onclick=()=>{const gs=clone(p.guides||[]);change(S.order.slice(),()=>S.order.forEach(id=>{S.pages[id].guides=clone(gs)}));redraw();toast('Guias copiadas para todas as páginas.')}}

/* ---------- aba Bordas ---------- */
PANELS.bordas={html(){const b=borderEdit(),p=curPage(),imgs=BORDER_IMGS();
  return `<h2>Bordas</h2><p class="hint">Uma moldura ou faixa nas páginas: cor lisa ou imagem repetida. Escolha o desenho, o estilo e onde aplicar.</p>
  <h3>DESENHO</h3><div class="wgrid">${BORDER_PRESETS.map(([k,n])=>`<button class="wbtn${b.preset===k?' on':''}" data-bp="${k}" style="${b.preset===k?'border-color:var(--accent)':''}"><canvas data-bpc="${k}" style="width:54px;height:72px"></canvas>${n}</button>`).join('')}</div>
  <h3>ESTILO</h3><div class="segf"><button data-bk="cor" class="${b.kind==='cor'?'on':''}">Cor lisa</button><button data-bk="imagem" class="${b.kind==='imagem'?'on':''}">Imagem</button></div>
  ${b.kind==='cor'?`<label class="pfield"><span>Cor</span>${colorField('bcor',b.color,false)}</label><label class="pfield"><span>Traço</span><select id="bSty"><option value="solid"${b.style==='solid'?' selected':''}>Contínuo</option><option value="dash"${b.style==='dash'?' selected':''}>Tracejado</option><option value="dot"${b.style==='dot'?' selected':''}>Pontilhado</option><option value="double"${b.style==='double'?' selected':''}>Linha dupla</option></select></label>`
   :`<p class="hint">Escolha a imagem que se repete ao longo da borda (PNG com fundo transparente fica lindo).</p>${imgs.length?`<div class="litems">${imgs.map(it=>`<div class="litem${b.src===it.src?' on':''}" style="${b.src===it.src?'outline:2px solid var(--accent)':''}"><div class="im" data-bi="${it.id}" role="button" tabindex="0" title="${esc(it.name||'')}"><img src="${esc(srcUrl(it.src))}" alt="${esc(it.name||'')}" loading="lazy"></div></div>`).join('')}</div>`:'<p class="hint">Você ainda não enviou imagens.</p>'}
   <span class="btn sm upl">Enviar imagem de borda<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" data-up="border" aria-label="Enviar imagem de borda"></span>`}
  <div class="fgrid"><label class="pfield"><span>Espessura (mm)</span><input type="number" id="bW" min="0.3" max="40" step="0.5" value="${b.width}"></label><label class="pfield"><span>Distância da borda (mm)</span><input type="number" id="bI" min="0" max="60" step="0.5" value="${b.inset}"></label>
   ${b.preset==='moldura'&&b.kind==='cor'?`<label class="pfield"><span>Cantos (mm)</span><input type="number" id="bR" min="0" max="30" step="0.5" value="${b.radius||0}"></label>`:''}<label class="pfield"><span>Opacidade</span><input type="range" id="bO" min="0.1" max="1" step="0.05" value="${b.opacity??1}"></label></div>
  <div class="pgrp"><h3>APLICAR</h3>${scopeHTML('bd',true)}<div class="row"><button class="btn pri" id="bdGo">Aplicar</button><button class="btn ghost danger" id="bdRm">Remover borda</button></div><p class="hint" id="bdMsg">${p.border?'Esta página já tem uma borda.':''}</p></div>`},
 mount(P){const b=borderEdit(),p=curPage();const redo=()=>renderPanel();
  const paint=()=>{$$('[data-bpc]',P).forEach(cv=>{const W=60,H=84,k=cv.clientWidth?0:0,d=devicePixelRatio||1;cv.width=54*d;cv.height=72*d;const c=cv.getContext('2d'),s=Math.min(54*d/W,72*d/H);c.setTransform(s,0,0,s,(54*d-W*s)/2,(72*d-H*s)/2);
    const pg={id:'_pv',w:W,h:H,bg:'#fff',els:[],border:Object.assign({},b,{preset:cv.dataset.bpc,width:Math.max(b.width*.7,1.2),inset:Math.min(b.inset,8)})};c.fillStyle='#fff';c.fillRect(0,0,W,H);c.strokeStyle='#E7DCE8';c.lineWidth=.6;c.strokeRect(0,0,W,H);drawBorder(c,pg)})};
  paint();S.panelRepaint=paint;
  $$('[data-bp]',P).forEach(x=>x.onclick=()=>{b.preset=x.dataset.bp;redo()});$$('[data-bk]',P).forEach(x=>x.onclick=()=>{b.kind=x.dataset.bk;redo()});
  $$('[data-cset="bcor"]',P).forEach(x=>x.onclick=()=>{b.color=x.dataset.v;redo()});const ci=$('input[data-k="bcor"]',P);if(ci)ci.oninput=()=>{b.color=ci.value;paint()};
  if($('#bSty',P))$('#bSty',P).onchange=e=>{b.style=e.target.value;paint()};
  $$('[data-bi]',P).forEach(x=>x.onclick=()=>{const it=S.lib.find(o=>o.id===x.dataset.bi);if(it){b.src=it.src;redo()}});
  $('#bW',P).onchange=e=>{b.width=cl(+e.target.value||2,.3,40);paint()};$('#bI',P).onchange=e=>{b.inset=cl(+e.target.value||0,0,60);paint()};if($('#bR',P))$('#bR',P).onchange=e=>{b.radius=cl(+e.target.value||0,0,30)};$('#bO',P).oninput=e=>{b.opacity=+e.target.value};
  mountScope(P,'bd');mountLib(P,'border');
  $('#bdGo',P).onclick=()=>{if(b.kind==='imagem'&&!b.src){$('#bdMsg',P).textContent='Escolha uma imagem para a borda.';return}const ids=readScope(P,'bd');if(!ids.length){$('#bdMsg',P).textContent='Escolha pelo menos uma página.';return}
    applyBorder(ids,b);$('#bdMsg',P).textContent=`Borda aplicada em ${ids.length} página${ids.length===1?'':'s'}. 🌸`};
  $('#bdRm',P).onclick=()=>{const ids=readScope(P,'bd');applyBorder(ids,null);$('#bdMsg',P).textContent=`Borda removida de ${ids.length} página${ids.length===1?'':'s'}.`}}};
const _setCur=setCur;setCur=function(...a){S.bordaEdit=null;return _setCur.apply(this,a)};

/* ---------- início ---------- */
applyRulerMode();
(async function boot(){renderBrand();await Store.init();Cloud.init();try{S.lib=await Store.listLib()}catch(e){S.lib=[]}S.lib.filter(x=>x.kind==='font').forEach(loadUserFont);renderAppLinks();await loadHome()})();
