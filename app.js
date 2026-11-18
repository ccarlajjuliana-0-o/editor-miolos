"use strict";
/* ================= utilidades ================= */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=(p='')=>p+Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);
const clone=o=>JSON.parse(JSON.stringify(o));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const r1=v=>Math.round(v*10)/10;
const tick=()=>new Promise(r=>setTimeout(r,0));
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const MM2PX=96/25.4, PT=0.3528, F=20;
const MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const MES3=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const DIAS=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const DIA3=['dom','seg','ter','qua','qui','sex','sáb'];
const DIA1=['D','S','T','Q','Q','S','S'];
const daysIn=(y,m)=>new Date(y,m+1,0).getDate();
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const dkey=d=>d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate();
const SIZES={'A4':[210,297],'A5':[148,210],'A6':[105,148],'B5':[176,250],'B6':[125,176],'Colegial':[170,230],'Carta':[215.9,279.4],'Meia-carta':[139.7,215.9],'Personal':[95,171],'Pocket':[81,120],'Quadrado 15 cm':[150,150]};
function sizeName(w,h){for(const [n,[a,b]] of Object.entries(SIZES)){if(Math.abs(a-w)<.6&&Math.abs(b-h)<.6)return n;if(Math.abs(a-h)<.6&&Math.abs(b-w)<.6)return n+' deitado'}return `${r1(w)}×${r1(h)} mm`}
window.BRAND_COLORS=['#C398C8','#92A8D1','#9168A0','#F1CDD9','#E7A6BE','#D8A776','#98B1C2','#6E8AB5','#4A4E79','#3E3550','#FBF7F4','#F7E5E7','#FFFFFF'];
const BRAND=['#C398C8','#92A8D1','#9168A0','#F1CDD9','#E7A6BE','#D8A776','#98B1C2','#6E8AB5','#4A4E79','#3E3550','#FBF7F4','#F7E5E7','#FFFFFF'];
const FONTS=[['Great Vibes','caligrafia'],['Alex Brush','caligrafia'],['Allura','caligrafia'],['Parisienne','caligrafia'],['Dancing Script','caligrafia'],['Caveat','manuscrita'],['Patrick Hand','manuscrita'],['Indie Flower','manuscrita'],['Shadows Into Light','manuscrita'],['Amatic SC','manuscrita'],['Quicksand','sem serifa'],['Nunito','sem serifa'],['Comfortaa','sem serifa'],['Josefin Sans','sem serifa'],['Montserrat','sem serifa'],['Poppins','sem serifa'],['Playfair Display','serifa'],['Lora','serifa'],['Cormorant Garamond','serifa']];
const PALS={
  lavanda:{nome:'Lavanda',a:'#C398C8',b:'#92A8D1',soft:'#F7E5E7',soft2:'#EEF1F8',ink:'#4A4E79',text:'#3E3550',line:'#DCCFE4'},
  sakura:{nome:'Sakura',a:'#E7A6BE',b:'#C398C8',soft:'#FBEAF0',soft2:'#F7E5E7',ink:'#9168A0',text:'#3E3550',line:'#EDD3DE'},
  salvia:{nome:'Sálvia',a:'#98B1C2',b:'#6E8AB5',soft:'#EEF3F6',soft2:'#E8EEF3',ink:'#4A4E79',text:'#3E3550',line:'#CFDCE4'},
  mel:{nome:'Mel',a:'#D8A776',b:'#C398C8',soft:'#FBF2E8',soft2:'#F7E5E7',ink:'#4A4E79',text:'#3E3550',line:'#EBDCCB'},
  tinta:{nome:'Tinta',a:'#4A4E79',b:'#92A8D1',soft:'#F0F1F7',soft2:'#FBF7F4',ink:'#4A4E79',text:'#3E3550',line:'#D6D9E8'}
};
const PAIRS={assinatura:{nome:'Assinatura',script:'Great Vibes',title:'Quicksand',body:'Nunito'},manuscrita:{nome:'Manuscrita',script:'Caveat',title:'Patrick Hand',body:'Nunito'},classica:{nome:'Clássica',script:'Playfair Display',title:'Lora',body:'Lora'},moderna:{nome:'Moderna',script:'Josefin Sans',title:'Montserrat',body:'Montserrat'}};

/* ================= feriados nacionais ================= */
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return new Date(y,mo-1,da)}
const HC={};
function feriados(y){if(HC[y])return HC[y];const H={},add=(m,d,n)=>H[m+'-'+d]=n;
  add(0,1,'Confraternização Universal');add(3,21,'Tiradentes');add(4,1,'Dia do Trabalho');add(8,7,'Independência do Brasil');add(9,12,'N. Sra. Aparecida');add(10,2,'Finados');add(10,15,'Proclamação da República');if(y>=2024)add(10,20,'Consciência Negra');add(11,25,'Natal');
  const e=easter(y),off=(n,nm)=>{const d=addDays(e,n);add(d.getMonth(),d.getDate(),nm)};
  off(-48,'Carnaval');off(-47,'Carnaval');off(-2,'Sexta-feira Santa');off(0,'Páscoa');off(60,'Corpus Christi');
  return HC[y]=H}

/* ================= fontes e imagens ================= */
const fontOk=new Set(),fontWait=new Set();
function ensureFont(spec){if(fontOk.has(spec))return;if(fontWait.has(spec))return;fontWait.add(spec);
  document.fonts.load(spec).then(()=>{fontOk.add(spec);scheduleRedraw(true);repaintExtras()}).catch(()=>fontOk.add(spec))}
let rpT;function repaintExtras(){clearTimeout(rpT);rpT=setTimeout(()=>{try{if(S.view==='editor'&&S.panelRepaint)S.panelRepaint();if(S.view==='home'&&S.homeRepaint)S.homeRepaint()}catch(e){}},180)}
const IMG=new Map();
function getImg(s){if(!s)return null;let r=IMG.get(s);if(!r){const im=new Image();r={im,ok:false,err:false};IMG.set(s,r);im.onload=()=>{r.ok=true;scheduleRedraw(true)};im.onerror=()=>{r.err=true};im.src=srcUrl(s)}return r.ok?r.im:null}
function loadImg(s){return new Promise(res=>{getImg(s);const r=IMG.get(s);if(r.ok)return res(r.im);if(r.err)return res(null);const done=()=>res(r.ok?r.im:null);r.im.addEventListener('load',done,{once:true});r.im.addEventListener('error',done,{once:true})})}

/* ================= desenho ================= */
function rr(c,x,y,w,h,r){r=Math.max(0,Math.min(r||0,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function font(c,mm,fam,wt=400,it=false){const k=(it?'italic ':'')+(wt||400)+' ';ensureFont(k+'16px "'+fam+'"');c.font=k+(Math.max(.1,mm)*F).toFixed(2)+'px "'+fam+'", "Nunito", sans-serif'}
function T(c,s,x,y,al='left',bl='middle'){c.save();c.scale(1/F,1/F);c.textAlign=al;c.textBaseline=bl;c.fillText(s,x*F,y*F);c.restore()}
const M=(c,s)=>c.measureText(s).width/F;
function fillIf(c,col){if(col&&col!=='none'){c.fillStyle=col;c.fill()}}
function strokeIf(c,col,sw,dash){if(col&&col!=='none'&&sw>0){c.strokeStyle=col;c.lineWidth=sw;c.setLineDash(dash||[]);c.stroke();c.setLineDash([])}}
function setLS(c,px){if('letterSpacing' in c)c.letterSpacing=px+'px'}
function wrap(c,text,maxW){const out=[];for(const para of String(text).split('\n')){const words=para.split(' ');let line='';for(const w of words){const t=line?line+' '+w:w;if(M(c,t)>maxW&&line){out.push(line);line=w}else line=t}out.push(line)}return out}
function fitText(c,s,maxW){if(M(c,s)<=maxW)return s;while(s.length>1&&M(c,s+'…')>maxW)s=s.slice(0,-1);return s+'…'}
const SHP={
  coracao:[['M',.5,.92],['C',.18,.7,0,.5,.06,.28],['C',.12,.06,.4,.02,.5,.24],['C',.6,.02,.88,.06,.94,.28],['C',1,.5,.82,.7,.5,.92]],
  brilho:[['M',.5,0],['C',.54,.4,.6,.46,1,.5],['C',.6,.54,.54,.6,.5,1],['C',.46,.6,.4,.54,0,.5],['C',.4,.46,.46,.4,.5,0]],
  gota:[['M',.5,.02],['C',.62,.25,.88,.48,.88,.68],['C',.88,.88,.7,1,.5,1],['C',.3,1,.12,.88,.12,.68],['C',.12,.48,.38,.25,.5,.02]],
  folha:[['M',.08,.92],['C',.06,.45,.4,.08,.94,.06],['C',.94,.6,.56,.94,.08,.92]],
  faixa:[['M',0,.22],['L',1,.22],['L',.9,.5],['L',1,.78],['L',0,.78],['L',.1,.5]],
  balao:[['M',.1,.06],['L',.9,.06],['Q',1,.06,1,.16],['L',1,.62],['Q',1,.72,.9,.72],['L',.42,.72],['L',.22,.95],['L',.27,.72],['L',.1,.72],['Q',0,.72,0,.62],['L',0,.16],['Q',0,.06,.1,.06]],
  etiqueta:[['M',.2,0],['L',1,0],['L',1,1],['L',.2,1],['L',0,.5]],
  seta:[['M',0,.36],['L',.6,.36],['L',.6,.12],['L',1,.5],['L',.6,.88],['L',.6,.64],['L',0,.64]],
  nuvem:[['M',.22,.86],['C',.05,.86,.01,.66,.14,.58],['C',.06,.4,.22,.25,.36,.32],['C',.42,.1,.68,.1,.72,.3],['C',.9,.24,1,.44,.92,.58],['C',1.02,.74,.92,.88,.78,.86],['L',.22,.86]]
};
const SHAPES={coracao:'Coração',brilho:'Brilho',estrela:'Estrela',flor:'Flor de cerejeira',folha:'Folha',gota:'Gota',livros:'Livros',faixa:'Faixa',etiqueta:'Etiqueta',balao:'Balão',circulo:'Círculo',hexagono:'Hexágono',nuvem:'Nuvem',seta:'Seta',carimbo:'Selo recortado'};
function shapePath(c,k,w,h){c.beginPath();
  if(k==='estrela'){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?.2:.5,x=(.5+Math.cos(a)*r)*w,y=(.54+Math.sin(a)*r)*h;i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath();return}
  if(k==='circulo'){c.ellipse(w/2,h/2,w/2,h/2,0,0,7);return}
  if(k==='hexagono'){for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3,x=(.5+Math.cos(a)*.5)*w,y=(.5+Math.sin(a)*.5)*h;i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath();return}
  if(k==='carimbo'){const n=16;for(let i=0;i<n;i++){const a0=i*2*Math.PI/n,a1=(i+.5)*2*Math.PI/n,a2=(i+1)*2*Math.PI/n,p=(a,r)=>[(.5+Math.cos(a)*r)*w,(.5+Math.sin(a)*r)*h];const [x0,y0]=p(a0,.44);if(!i)c.moveTo(x0,y0);const [cx,cy]=p(a1,.56),[x2,y2]=p(a2,.44);c.quadraticCurveTo(cx,cy,x2,y2)}c.closePath();return}
  const P=SHP[k]||SHP.coracao,fn={M:'moveTo',L:'lineTo',C:'bezierCurveTo',Q:'quadraticCurveTo'};
  for(const s of P){const a=s.slice(1).map((v,i)=>v*(i%2?h:w));c[fn[s[0]]](...a)}c.closePath()}
function drawImgFit(c,im,x,y,w,h,fit){const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;if(!iw||!ih)return;
  if(fit==='stretch'){c.drawImage(im,x,y,w,h);return}
  const s=fit==='contain'?Math.min(w/iw,h/ih):Math.max(w/iw,h/ih),dw=iw*s,dh=ih*s;
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh);c.restore()}

function calLayout(e){const tH=e.showTitle?Math.min(e.h*.14,16):0,hH=Math.min(e.h*.08,7.5),ws=e.weekStart||0;
  const first=new Date(e.year,e.month,1).getDay(),off=(first-ws+7)%7,dim=daysIn(e.year,e.month),rows=Math.ceil((off+dim)/7);
  return {tH,hH,ws,off,dim,rows,cw:e.w/7,ch:(e.h-tH-hH)/rows,top:tH+hH}}
function ycLayout(e){const cols=e.w>e.h*1.15?4:3,rows=12/cols,g=Math.min(e.w,e.h)*.045,bw=(e.w-g*(cols-1))/cols,bh=(e.h-g*(rows-1))/rows;
  return {box:m=>({x:(m%cols)*(bw+g),y:Math.floor(m/cols)*(bh+g),w:bw,h:bh})}}
function colWidths(e){const n=e.cols;let f=Array.isArray(e.cw)&&e.cw.length===n?e.cw.map(Number):Array(n).fill(1);const s=f.reduce((a,b)=>a+b,0)||1;return f.map(v=>v/s*e.w)}

const R={
  text(c,e){const fs=e.size*PT;font(c,fs,e.font,e.weight,e.italic);c.fillStyle=e.color;setLS(c,(e.ls||0)*fs*F);
    const lines=wrap(c,e.text??'',e.w+.01),lh=fs*(e.lh||1.2),tot=lines.length*lh;
    const y0=e.valign==='middle'?(e.h-tot)/2:e.valign==='bottom'?e.h-tot:0,ax=e.align==='center'?e.w/2:e.align==='right'?e.w:0;
    lines.forEach((ln,i)=>T(c,ln,ax,y0+i*lh+lh/2,e.align||'left','middle'));setLS(c,0)},
  rect(c,e){rr(c,0,0,e.w,e.h,e.radius||0);fillIf(c,e.fill);strokeIf(c,e.stroke,e.sw)},
  ellipse(c,e){c.beginPath();c.ellipse(e.w/2,e.h/2,e.w/2,e.h/2,0,0,7);fillIf(c,e.fill);strokeIf(c,e.stroke,e.sw)},
  line(c,e){c.beginPath();c.moveTo(0,e.h/2);c.lineTo(e.w,e.h/2);c.lineCap='round';const sw=e.sw||.3;strokeIf(c,e.stroke,sw,e.dash==='dash'?[sw*5,sw*3.5]:e.dash==='dot'?[.01,sw*3]:[]);c.lineCap='butt'},
  pattern(c,e){const sp=Math.max(1.5,e.sp||6),sw=e.sw||.25;c.save();c.beginPath();c.rect(0,0,e.w,e.h);c.clip();
    if(e.kind==='dots'){c.fillStyle=e.color;const r=Math.max(.18,sw*1.1),ox=((e.w%sp)/2)||sp/2,oy=((e.h%sp)/2)||sp/2;for(let y=oy;y<=e.h+.01;y+=sp)for(let x=ox;x<=e.w+.01;x+=sp){c.beginPath();c.arc(x,y,r,0,7);c.fill()}}
    else if(e.kind==='grid'){const ox=(e.w%sp)/2,oy=(e.h%sp)/2;c.beginPath();for(let y=oy;y<=e.h+.01;y+=sp){c.moveTo(0,y);c.lineTo(e.w,y)}for(let x=ox;x<=e.w+.01;x+=sp){c.moveTo(x,0);c.lineTo(x,e.h)}strokeIf(c,e.color,sw)}
    else{c.beginPath();for(let y=sp;y<e.h+.01;y+=sp){c.moveTo(0,y);c.lineTo(e.w,y)}strokeIf(c,e.color,sw)}
    c.restore()},
  calendar(c,e){const L=calLayout(e);
    if(e.showTitle){font(c,L.tH*.62,e.titleFont||'Great Vibes');c.fillStyle=e.accent;T(c,cap(MESES[e.month])+' '+e.year,e.w/2,L.tH/2,'center','middle')}
    if(e.headFill&&e.headFill!=='none'){rr(c,0,L.tH,e.w,L.hH,Math.min(1.6,L.hH/3));c.fillStyle=e.headFill;c.fill()}
    font(c,Math.min(L.hH*.46,L.cw*.2),e.font,600);c.fillStyle=e.color;
    for(let i=0;i<7;i++){const wd=(L.ws+i)%7;T(c,L.cw>15?DIA3[wd]:DIA1[wd],L.cw*i+L.cw/2,L.tH+L.hH/2,'center','middle')}
    if(e.weekendFill&&e.weekendFill!=='none'){c.fillStyle=e.weekendFill;for(let i=0;i<7;i++){const wd=(L.ws+i)%7;if(wd===0||wd===6)c.fillRect(L.cw*i,L.top,L.cw,L.ch*L.rows)}}
    c.beginPath();for(let r=0;r<=L.rows;r++){if(r===0&&e.style==='linhas')continue;c.moveTo(0,L.top+r*L.ch);c.lineTo(e.w,L.top+r*L.ch)}
    if(e.style!=='linhas')for(let i=0;i<=7;i++){c.moveTo(i*L.cw,L.top);c.lineTo(i*L.cw,L.top+L.rows*L.ch)}
    strokeIf(c,e.stroke,e.sw||.3);
    const H=e.holidays?feriados(e.year):{},fs=Math.min(L.ch*.22,L.cw*.24,4.6),pad=Math.max(.8,fs*.45);
    for(let d=1;d<=L.dim;d++){const idx=L.off+d-1,x=(idx%7)*L.cw,y=L.top+Math.floor(idx/7)*L.ch,hn=H[e.month+'-'+d];
      font(c,fs,e.font,600);c.fillStyle=hn?e.accent:e.color;T(c,String(d),x+pad,y+pad+fs*.5,'left','middle');
      if(hn&&L.cw>15&&L.ch>11){font(c,fs*.52,e.font,400);c.fillStyle=e.accent;wrap(c,hn,L.cw-pad*2).slice(0,2).forEach((t,j)=>T(c,t,x+pad,y+pad+fs*1.25+fs*.62*j,'left','middle'))}}},
  yearcal(c,e){const Y=ycLayout(e),H=e.holidays?feriados(e.year):{};
    for(let m=0;m<12;m++){const b=Y.box(m),tH=b.h*.17,hH=b.h*.11,cw=b.w/7,ch=(b.h-tH-hH)/6;
      font(c,Math.min(tH*.62,b.w*.12),e.titleFont,600);c.fillStyle=e.accent;T(c,cap(MESES[m]),b.x+b.w/2,b.y+tH/2,'center','middle');
      if(e.headFill&&e.headFill!=='none'){rr(c,b.x,b.y+tH,b.w,hH,hH/3);c.fillStyle=e.headFill;c.fill()}
      font(c,Math.min(hH*.55,cw*.5),e.font,600);c.fillStyle=e.color;
      for(let i=0;i<7;i++)T(c,DIA1[(e.weekStart+i)%7],b.x+cw*i+cw/2,b.y+tH+hH/2,'center','middle');
      const off=(new Date(e.year,m,1).getDay()-e.weekStart+7)%7,dim=daysIn(e.year,m);font(c,Math.min(ch*.52,cw*.46),e.font,400);
      for(let d=1;d<=dim;d++){const idx=off+d-1,wd=(e.weekStart+idx%7)%7;c.fillStyle=H[m+'-'+d]?e.accent:wd===0?e.accent:e.color;c.globalAlpha=(H[m+'-'+d]||wd!==0)?1:.75;T(c,String(d),b.x+(idx%7)*cw+cw/2,b.y+tH+hH+Math.floor(idx/7)*ch+ch/2,'center','middle');c.globalAlpha=1}}},
  table(c,e){const hasH=Array.isArray(e.header)&&e.header.length>0,rows=e.rows+(hasH?1:0),rh=e.h/rows,cw=colWidths(e);
    if(hasH&&e.headFill&&e.headFill!=='none'){rr(c,0,0,e.w,rh,Math.min(1.6,rh/4));c.fillStyle=e.headFill;c.fill()}
    c.beginPath();for(let r=hasH?1:0;r<=rows;r++){c.moveTo(0,r*rh);c.lineTo(e.w,r*rh)}let x=0;for(let i=0;i<=e.cols;i++){c.moveTo(x,hasH?rh:0);c.lineTo(x,e.h);x+=cw[i]||0}strokeIf(c,e.stroke,e.sw||.3);
    const fs=Math.min((e.size||8)*PT,rh*.5);c.fillStyle=e.color;
    if(hasH){font(c,fs,e.font,600);x=0;for(let i=0;i<e.cols;i++){T(c,fitText(c,String(e.header[i]??''),cw[i]-1.6),x+cw[i]/2,rh/2,'center','middle');x+=cw[i]}}
    if(Array.isArray(e.side)){font(c,fs,e.font,600);for(let r=0;r<e.rows;r++){const s=e.side[r];if(s)T(c,fitText(c,String(s),cw[0]-2),1.4,(r+(hasH?1:0))*rh+rh/2,'left','middle')}}},
  checklist(c,e){const n=Math.max(1,e.n|0),rh=e.h/n,bs=Math.min(rh*.55,4.2),sw=e.sw||.3;
    for(let i=0;i<n;i++){const y=i*rh,by=y+(rh-bs)/2;if(e.box==='circle'){c.beginPath();c.arc(bs/2,by+bs/2,bs/2,0,7)}else rr(c,0,by,bs,bs,bs*.22);strokeIf(c,e.color,sw);
      const lb=Array.isArray(e.items)?e.items[i]:'';let lx=bs+1.8;if(lb){font(c,Math.min(bs*.95,rh*.48),e.font||'Nunito',400);c.fillStyle=e.textColor||e.color;T(c,lb,bs+1.6,by+bs/2,'left','middle');lx=bs+1.6+M(c,lb)+1.2}
      if(e.lines&&lx<e.w){c.beginPath();c.moveTo(lx,by+bs);c.lineTo(e.w,by+bs);strokeIf(c,e.stroke,sw*.85)}}},
  path(c,e){const P=(e.pts||[]).map(([u,v])=>[u*e.w,v*e.h]);if(P.length<2)return;const dash=e.dash&&e.dash.length?e.dash:null;
    if(e.more&&e.more.length){c.beginPath();[{pts:e.pts,closed:e.closed},...e.more].forEach(q=>{const Q=(q.pts||[]).map(([u,v])=>[u*e.w,v*e.h]);if(Q.length<2)return;c.moveTo(Q[0][0],Q[0][1]);for(let i=1;i<Q.length;i++)c.lineTo(Q[i][0],Q[i][1]);if(q.closed)c.closePath()});
      if(e.fill&&e.fill!=='none'){c.fillStyle=e.fill;c.fill(e.rule==='evenodd'?'evenodd':'nonzero')}c.lineCap=e.cap||'round';c.lineJoin=e.join||'round';strokeIf(c,e.stroke,e.sw,dash);c.lineCap='butt';c.lineJoin='miter';return}
    tracePath(c,P,e.smooth,e.closed);c.lineJoin=e.join||'round';c.lineCap=e.cap||'round';if(e.closed){if(e.rule==='evenodd'&&e.fill&&e.fill!=='none'){c.fillStyle=e.fill;c.fill('evenodd')}else fillIf(c,e.fill)}strokeIf(c,e.stroke,e.sw,dash);c.lineJoin='miter';c.lineCap='butt'},
  habit(c,e){const rows=Math.max(1,e.rows|0),days=Math.max(1,e.days|0),lw=e.w*(e.labelW||.3),rh=e.h/(rows+1),cw=(e.w-lw)/days;
    font(c,Math.min(rh*.42,cw*.62),e.font,600);c.fillStyle=e.color;for(let d=0;d<days;d++)T(c,String(d+1),lw+cw*d+cw/2,rh/2,'center','middle');
    c.beginPath();for(let r=1;r<=rows+1;r++){c.moveTo(0,r*rh);c.lineTo(e.w,r*rh)}strokeIf(c,e.stroke,.3);
    font(c,Math.min(rh*.42,3.6),e.font,400);c.fillStyle=e.color;const L=e.labels||[];for(let r=0;r<rows;r++)if(L[r])T(c,fitText(c,L[r],lw-2),1,rh*(r+1)+rh/2,'left','middle');
    const rad=Math.min(cw,rh)*.32;for(let r=0;r<rows;r++)for(let d=0;d<days;d++){c.beginPath();c.arc(lw+cw*d+cw/2,rh*(r+1)+rh/2,rad,0,7);strokeIf(c,e.accent,.25)}},
  hours(c,e){const a=e.from|0,b=Math.max(a,e.to|0),n=b-a+1,rh=e.h/n,lw=Math.min(11,e.w*.16),fs=Math.min(rh*.42,3.4);
    c.beginPath();for(let i=0;i<=n;i++){c.moveTo(lw,i*rh);c.lineTo(e.w,i*rh)}strokeIf(c,e.stroke,.3);
    if(e.half){c.beginPath();for(let i=0;i<n;i++){c.moveTo(lw,i*rh+rh/2);c.lineTo(e.w,i*rh+rh/2)}strokeIf(c,e.stroke,.22,[.01,.9])}
    font(c,fs,e.font,600);c.fillStyle=e.color;c.lineCap='round';for(let i=0;i<n;i++){const hh=a+i;T(c,e.fmt==='24'?String(hh).padStart(2,'0')+':00':hh+'h',lw-1.2,i*rh+fs*.9,'right','middle')}c.lineCap='butt'},
  water(c,e){const n=Math.max(1,e.n|0),s=Math.min(e.h,e.w/n*.95),dw=s*.75,gap=n>1?(e.w-dw*n)/(n-1):0;
    for(let i=0;i<n;i++){c.save();c.translate(i*(dw+gap),(e.h-s)/2);shapePath(c,'gota',dw,s);fillIf(c,e.fill);strokeIf(c,e.color,e.sw||.3);c.restore()}},
  mood(c,e){const n=Math.max(1,e.n|0),d=Math.min(e.h,e.w/n*.85),gap=n>1?(e.w-d*n)/(n-1):0,sw=e.sw||.3;
    for(let i=0;i<n;i++){const x=i*(d+gap)+d/2,y=e.h/2;c.beginPath();c.arc(x,y,d/2-sw,0,7);strokeIf(c,e.color,sw);c.fillStyle=e.color;
      for(const s of [-1,1]){c.beginPath();c.arc(x+s*d*.17,y-d*.1,d*.045,0,7);c.fill()}
      const t=n>1?i/(n-1)*2-1:0;c.beginPath();c.moveTo(x-d*.2,y+d*.16);c.quadraticCurveTo(x,y+d*.16+t*d*.17,x+d*.2,y+d*.16);c.lineCap='round';strokeIf(c,e.color,sw);c.lineCap='butt'}},
  shape(c,e){const sw=e.sw||0;
    if(e.kind==='flor'){const cx=e.w/2,cy=e.h/2;for(let i=0;i<5;i++){const a=-Math.PI/2+i*2*Math.PI/5;c.beginPath();c.ellipse(cx+Math.cos(a)*e.w*.24,cy+Math.sin(a)*e.h*.24,e.w*.22,e.h*.22,0,0,7);fillIf(c,e.fill);strokeIf(c,e.stroke,sw)}
      c.beginPath();c.ellipse(cx,cy,e.w*.11,e.h*.11,0,0,7);fillIf(c,e.fill2);strokeIf(c,e.stroke,sw);return}
    if(e.kind==='livros'){rr(c,e.w*.04,e.h*.54,e.w*.92,e.h*.34,e.h*.06);fillIf(c,e.fill2);strokeIf(c,e.stroke,sw);rr(c,e.w*.84,e.h*.58,e.w*.07,e.h*.26,e.h*.03);fillIf(c,'#FBF7F4');
      rr(c,e.w*.1,e.h*.18,e.w*.8,e.h*.34,e.h*.06);fillIf(c,e.fill);strokeIf(c,e.stroke,sw);rr(c,e.w*.78,e.h*.22,e.w*.07,e.h*.26,e.h*.03);fillIf(c,'#FBF7F4');
      c.beginPath();c.moveTo(e.w*.66,e.h*.18);c.lineTo(e.w*.66,e.h*.52);strokeIf(c,e.stroke!=='none'?e.stroke:'#4A4E79',Math.max(sw,.25));return}
    shapePath(c,e.kind,e.w,e.h);fillIf(c,e.fill);strokeIf(c,e.stroke,sw);
    if(e.kind==='folha'){c.beginPath();c.moveTo(e.w*.12,e.h*.88);c.quadraticCurveTo(e.w*.5,e.h*.5,e.w*.86,e.h*.12);strokeIf(c,e.stroke!=='none'&&sw?e.stroke:'rgba(74,78,121,.35)',Math.max(sw,.25))}},
  image(c,e){const im=getImg(e.src);if(e.radius){rr(c,0,0,e.w,e.h,e.radius);c.save();c.clip()}
    if(im)drawImgFit(c,im,0,0,e.w,e.h,e.fit||'contain');else{c.fillStyle='rgba(195,152,200,.15)';c.fillRect(0,0,e.w,e.h)}
    if(e.radius)c.restore()},
  divider(c,e){const fs=Math.min(e.h*.55,(e.size||9)*PT);font(c,fs,e.font,500);setLS(c,.15*fs*F);const tw=e.text?M(c,e.text):0,mid=e.h/2,cx=e.w/2;
    c.fillStyle=e.color;if(e.text)T(c,e.text,cx,mid,'center','middle');setLS(c,0);
    const hs=Math.max(1.2,fs*.95),gap=e.text?fs*.8:0,h1=cx-tw/2-gap-hs/2,h2=cx+tw/2+gap+hs/2;
    for(const hx of e.text?[h1,h2]:[cx]){c.save();c.translate(hx-hs/2,mid-hs/2);shapePath(c,'coracao',hs,hs);c.fillStyle=e.accent;c.fill();c.restore()}
    c.beginPath();const l1=(e.text?h1:cx)-hs*1.1,l2=(e.text?h2:cx)+hs*1.1;c.moveTo(0,mid);c.lineTo(Math.max(0,l1),mid);c.moveTo(Math.min(e.w,l2),mid);c.lineTo(e.w,mid);c.lineCap='round';strokeIf(c,e.color,.3);c.lineCap='butt'},
  tabs(c,e){const L=e.labels||[],n=L.length;if(!n)return;const th=e.h/n,g=Math.min(.8,th*.06);
    for(let i=0;i<n;i++){const y=i*th+g/2,hh=th-g,r=Math.min(e.w*.45,hh/3);c.beginPath();c.moveTo(e.w,y);c.lineTo(r,y);c.arcTo(0,y,0,y+r,r);c.lineTo(0,y+hh-r);c.arcTo(0,y+hh,r,y+hh,r);c.lineTo(e.w,y+hh);c.closePath();
      const act=i===e.active;c.fillStyle=act?(e.activeFill||'#4A4E79'):(i%2?e.fill2:e.fill1);c.fill();
      c.save();c.translate(e.w/2,y+hh/2);c.rotate(Math.PI/2);font(c,Math.min(e.w*.42,hh*.26),e.font,600);c.fillStyle=act?'#FFFFFF':e.color;T(c,L[i],0,0,'center','middle');c.restore()}}
};
function tracePath(c,P,smooth,closed){c.beginPath();const n=P.length,mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  if(!smooth||n<3){c.moveTo(P[0][0],P[0][1]);for(let i=1;i<n;i++)c.lineTo(P[i][0],P[i][1]);if(closed)c.closePath();return}
  if(closed){const m=mid(P[n-1],P[0]);c.moveTo(m[0],m[1]);for(let i=0;i<n;i++){const p=P[i],q=mid(p,P[(i+1)%n]);c.quadraticCurveTo(p[0],p[1],q[0],q[1])}c.closePath()}
  else{c.moveTo(P[0][0],P[0][1]);for(let i=1;i<n-1;i++){const q=mid(P[i],P[i+1]);c.quadraticCurveTo(P[i][0],P[i][1],q[0],q[1])}c.lineTo(P[n-1][0],P[n-1][1])}}
function drawEl(c,e,o){if(o&&o.skip===e.id)return;c.save();c.globalAlpha=e.opacity??1;c.translate(e.x+e.w/2,e.y+e.h/2);if(e.rot)c.rotate(e.rot*Math.PI/180);c.translate(-e.w/2,-e.h/2);
  const fn=R[e.type];if(fn){try{fn(c,e)}catch(err){console.warn(err)}}c.restore()}
function drawPage(c,pg,k,ox=0,oy=0,o={}){const b=o.bleed||0;c.save();c.setTransform(k,0,0,k,ox,oy);
  c.beginPath();c.rect(-b,-b,pg.w+2*b,pg.h+2*b);c.clip();c.fillStyle=pg.bg||'#FFFFFF';c.fillRect(-b,-b,pg.w+2*b,pg.h+2*b);
  if(pg.bgImg&&pg.bgImg.src){const im=getImg(pg.bgImg.src);if(im){c.globalAlpha=pg.bgImg.opacity??1;drawImgFit(c,im,-b,-b,pg.w+2*b,pg.h+2*b,pg.bgImg.fit||'cover');c.globalAlpha=1}}
  drawBorder(c,pg);
  for(const e of pg.els)drawEl(c,e,o);
  if(window.Margens&&Margens.tabEl){const t=Margens.tabEl(pg);if(t)drawEl(c,t,o)}c.restore()}
function bbox(e){if(!e.rot)return{x:e.x,y:e.y,w:e.w,h:e.h};const a=e.rot*Math.PI/180,cs=Math.abs(Math.cos(a)),sn=Math.abs(Math.sin(a)),w=e.w*cs+e.h*sn,h=e.w*sn+e.h*cs;return{x:e.x+e.w/2-w/2,y:e.y+e.h/2-h/2,w,h}}
function pageLinks(pg){const out=[];for(const e of pg.els){if(e.link)out.push({...bbox(e),to:e.link});
  if(e.type==='calendar'&&e.dayLinks){const L=calLayout(e);for(const [d,to] of Object.entries(e.dayLinks)){if(!to)continue;const idx=L.off+(+d)-1;out.push({x:e.x+(idx%7)*L.cw,y:e.y+L.top+Math.floor(idx/7)*L.ch,w:L.cw,h:L.ch,to})}}
  if(e.type==='yearcal'&&e.monthLinks){const Y=ycLayout(e);for(const [m,to] of Object.entries(e.monthLinks)){if(!to)continue;const b=Y.box(+m);out.push({x:e.x+b.x,y:e.y+b.y,w:b.w,h:b.h,to})}}
  if(e.type==='tabs'&&e.links){const th=e.h/(e.labels||[]).length;e.links.forEach((to,i)=>{if(to)out.push({x:e.x,y:e.y+i*th,w:e.w,h:th,to})})}}
  return out}

/* ================= fábricas de elementos ================= */
function E(type,x,y,w,h,o){return Object.assign({id:uid('e'),type,x,y,w,h,rot:0,opacity:1},o)}
const tx=(x,y,w,h,text,o)=>E('text',x,y,w,h,Object.assign({text,font:'Nunito',size:10,weight:400,italic:false,color:'#3E3550',align:'left',valign:'top',lh:1.25,ls:0},o));
function fr(W,H,o={}){const s=Math.min(W,H)/148,m=Math.max(6,Math.min(W,H)*.075),r=o.reserveR||0;return{W,H,s,m,x0:m,y0:m,x1:W-m-r,y1:H-m,cw:W-2*m-r,ch:H-2*m}}
function hdr(f,st,title,sub,link){const s=f.s,bh=cl(13*s,9,30);const t=tx(f.x0,f.y0,f.cw*.64,bh,title,{font:st.script,size:cl(26*s,13,56),color:st.pal.a,valign:'middle',lh:1});if(link)t.link=link;
  const els=[t];if(sub)els.push(tx(f.x0+f.cw*.36,f.y0,f.cw*.64,bh,sub,{font:st.title,size:cl(8*s,6,15),weight:500,color:st.pal.ink,align:'right',valign:'middle',ls:.14}));
  els.push(E('line',f.x0,f.y0+bh,f.cw,2,{stroke:st.pal.line,sw:.35,dash:'solid'}));return{els,y:f.y0+bh+2+3*s}}
const lbl=(x,y,w,t,st,s)=>tx(x,y,w,cl(5*s,3.6,9),t,{font:st.title,size:cl(7.5*s,5.5,13),weight:600,color:st.pal.ink,ls:.08,valign:'middle'});
const lbh=s=>cl(5*s,3.6,9)+1;
const pat=(x,y,w,h,st,s,kind='lines')=>E('pattern',x,y,w,h,{kind,sp:cl(6.5*s,4.5,9),color:kind==='dots'?st.pal.ink:st.pal.line,sw:kind==='dots'?.2:.3,opacity:kind==='dots'?.6:1});
const box=(x,y,w,h,st,o={})=>E('rect',x,y,w,h,Object.assign({fill:'none',stroke:st.pal.line,sw:.35,radius:2.2},o));
const cal=(x,y,w,h,st,yv,mv,o={})=>E('calendar',x,y,w,h,Object.assign({year:yv,month:mv,weekStart:st.ws||0,font:st.title,titleFont:st.script,showTitle:false,color:st.pal.text,accent:st.pal.a,headFill:st.pal.soft,stroke:st.pal.line,sw:.35,weekendFill:'none',style:'grade',holidays:true,dayLinks:null},o));
const ycal=(x,y,w,h,st,yv,o={})=>E('yearcal',x,y,w,h,Object.assign({year:yv,weekStart:st.ws||0,font:st.title,titleFont:st.title,color:st.pal.text,accent:st.pal.a,headFill:st.pal.soft,holidays:true,monthLinks:null},o));
const chk=(x,y,w,h,n,st,o={})=>E('checklist',x,y,w,h,Object.assign({n,box:'square',lines:true,color:st.pal.ink,stroke:st.pal.line,sw:.3},o));
const tbl=(x,y,w,h,rows,header,st,o={})=>E('table',x,y,w,h,Object.assign({rows,cols:header.length,header,side:null,cw:null,font:st.title,size:7.5,color:st.pal.text,headFill:st.pal.soft,stroke:st.pal.line,sw:.3},o));
const spark=(x,y,s,col='#D8A776')=>E('shape',x,y,s,s,{kind:'brilho',fill:col,stroke:'none',sw:0});
function weekLabel(st0){const e=addDays(st0,6);return `${st0.getDate()} ${MES3[st0.getMonth()]} – ${e.getDate()} ${MES3[e.getMonth()]} ${e.getFullYear()}`}
function weekStartOf(d,ws){return addDays(d,-((d.getDay()-ws+7)%7))}

/* ================= modelos de miolo (pt-BR) ================= */
const TPL={
 capa:{nome:'Capa',cat:'Capas e divisórias',fn(W,H,st,d){const f=fr(W,H),s=f.s,els=[];
   els.push(E('rect',f.m*.6,f.m*.6,W-f.m*1.2,H-f.m*1.2,{fill:'none',stroke:st.pal.a,sw:.5,radius:4*s}));
   const fl=30*s;els.push(E('shape',W/2-fl/2,H*.17,fl,fl,{kind:'flor',fill:'#F1CDD9',fill2:'#D8A776',stroke:'#4A4E79',sw:.3}));
   els.push(spark(W/2+fl*.7,H*.17,7*s),spark(W/2-fl*.95,H*.17+fl*.55,4.5*s));
   const ty=H*.38;els.push(tx(f.x0,ty,f.cw,28*s,d.title||'Meu Planner',{font:st.script,size:cl(40*s,18,90),color:st.pal.a,align:'center',valign:'middle',lh:1}));
   els.push(tx(f.x0,ty+28*s,f.cw,14*s,String(d.y),{font:st.title,size:cl(22*s,11,48),weight:600,color:st.pal.b,align:'center',valign:'middle',ls:.3}));
   els.push(E('divider',f.x0+f.cw*.12,ty+46*s,f.cw*.76,7*s,{text:'atelier criativo',font:st.title,size:cl(8*s,5,14),color:st.pal.ink,accent:'#E7A6BE'}));
   els.push(tx(f.x0,H*.78,f.cw,6*s,'este planner pertence a',{font:st.title,size:cl(7.5*s,5,13),weight:500,color:st.pal.ink,align:'center',ls:.15,valign:'middle'}));
   els.push(E('line',W/2-f.cw*.3,H*.78+13*s,f.cw*.6,2,{stroke:st.pal.ink,sw:.3,dash:'solid'}));
   return{bg:'#FBF7F4',els}}},
 separador:{nome:'Separador do mês',cat:'Capas e divisórias',fn(W,H,st,d){const f=fr(W,H),s=f.s,els=[];
   els.push(tx(f.x0,H*.22,f.cw,34*s,cap(MESES[d.m]),{font:st.script,size:cl(50*s,22,110),color:st.pal.a,align:'center',valign:'middle',lh:1}));
   els.push(tx(f.x0,H*.22+34*s,f.cw,10*s,String(d.y),{font:st.title,size:cl(12*s,8,26),weight:600,color:st.pal.ink,align:'center',valign:'middle',ls:.4}));
   els.push(spark(W/2+f.cw*.32,H*.2,8*s),spark(W/2+f.cw*.4,H*.2+10*s,4.5*s),spark(W/2-f.cw*.38,H*.22+28*s,5*s,'#C398C8'));
   const y=H*.22+52*s;els.push(E('divider',f.x0+f.cw*.15,y,f.cw*.7,6*s,{text:'intenções do mês',font:st.title,size:cl(7.5*s,5,13),color:st.pal.ink,accent:'#E7A6BE'}));
   els.push(E('rect',f.x0,y+10*s,f.cw,f.y1-(y+10*s),{fill:'#FFFFFF',stroke:st.pal.line,sw:.35,radius:4*s}));
   els.push(pat(f.x0+5*s,y+14*s,f.cw-10*s,f.y1-(y+18*s),st,s));
   return{bg:st.pal.soft,els}}},
 anual:{nome:'Calendário anual',cat:'Calendários',fn(W,H,st,d,o={}){const f=fr(W,H,o),h=hdr(f,st,String(d.y),'calendário anual');
   const ml=d.links&&d.links.month?Object.fromEntries([...Array(12)].map((_,m)=>[m,d.links.month(d.y,m)||null])):null;
   return{els:[...h.els,ycal(f.x0,h.y+2*f.s,f.cw,f.y1-h.y-2*f.s,st,d.y,{monthLinks:ml,holidays:d.holidays!==false})]}}},
 mensal:{nome:'Mensal',cat:'Calendários',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,cap(MESES[d.m]),String(d.y)),els=[...h.els];
   let dl=null;if(d.links&&d.links.day){dl={};for(let i=1;i<=daysIn(d.y,d.m);i++){const t=d.links.day(new Date(d.y,d.m,i));if(t)dl[i]=t}}
   const land=f.cw>f.ch*1.1,ah=f.y1-h.y;
   if(land){const cw=f.cw*.72;els.push(cal(f.x0,h.y,cw,ah,st,d.y,d.m,{dayLinks:dl,holidays:d.holidays!==false}));const nx=f.x0+cw+5*s,nw=f.x1-nx;els.push(lbl(nx,h.y,nw,'notas',st,s),pat(nx,h.y+lbh(s),nw,ah-lbh(s),st,s))}
   else{const ch=ah*.7;els.push(cal(f.x0,h.y,f.cw,ch,st,d.y,d.m,{dayLinks:dl,holidays:d.holidays!==false}));const ny=h.y+ch+4*s;els.push(lbl(f.x0,ny,f.cw,'notas',st,s),pat(f.x0,ny+lbh(s),f.cw,f.y1-ny-lbh(s),st,s))}
   return{els}}},
 semanal:{nome:'Semanal em blocos',cat:'Planejamento',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,ws=st.ws||0,st0=d.start||weekStartOf(new Date(),ws);
   const h=hdr(f,st,'Semana',weekLabel(st0),d.links&&d.links.month?d.links.month(st0.getFullYear(),st0.getMonth()):null),els=[...h.els];
   const land=f.cw>f.ch*1.1,cols=land?4:2,rows=land?2:4,g=3*s,bw=(f.cw-g*(cols-1))/cols,bh=(f.y1-h.y-g*(rows-1))/rows;
   for(let i=0;i<8;i++){const x=f.x0+(i%cols)*(bw+g),y=h.y+Math.floor(i/cols)*(bh+g);const b=box(x,y,bw,bh,st);
     if(i<7){const dt=addDays(st0,i),hn=(d.holidays!==false)?feriados(dt.getFullYear())[dt.getMonth()+'-'+dt.getDate()]:null;if(d.links&&d.links.day){const t=d.links.day(dt);if(t)b.link=t}
       els.push(b,tx(x+2.5*s,y+1.5*s,bw-5*s,lbh(s),`${DIA3[dt.getDay()]} · ${String(dt.getDate()).padStart(2,'0')}`+(hn?'  ♡ '+hn:''),{font:st.title,size:cl(7.5*s,5.5,13),weight:600,color:hn?st.pal.a:st.pal.ink,valign:'middle'}))}
     else els.push(b,tx(x+2.5*s,y+1.5*s,bw-5*s,lbh(s),'notas',{font:st.title,size:cl(7.5*s,5.5,13),weight:600,color:st.pal.ink,valign:'middle'}));
     els.push(pat(x+2.5*s,y+1.5*s+lbh(s),bw-5*s,bh-3*s-lbh(s),st,s))}
   return{els}}},
 semanalLista:{nome:'Semanal em lista',cat:'Planejamento',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,ws=st.ws||0,st0=d.start||weekStartOf(new Date(),ws);
   const h=hdr(f,st,'Semana',weekLabel(st0),d.links&&d.links.month?d.links.month(st0.getFullYear(),st0.getMonth()):null),els=[...h.els];
   const bottom=(f.y1-h.y)*.2,rh=(f.y1-h.y-bottom)/7,lw=cl(20*s,14,36);
   for(let i=0;i<7;i++){const dt=addDays(st0,i),y=h.y+i*rh;const num=tx(f.x0,y+1,lw,rh*.55,String(dt.getDate()).padStart(2,'0'),{font:st.title,size:cl(15*s,9,30),weight:700,color:st.pal.a,valign:'middle'});
     if(d.links&&d.links.day){const t=d.links.day(dt);if(t)num.link=t}
     els.push(num,tx(f.x0,y+rh*.55,lw,rh*.3,DIA3[dt.getDay()],{font:st.title,size:cl(7*s,5,12),weight:600,color:st.pal.ink,ls:.12}),pat(f.x0+lw,y,f.cw-lw,rh,st,s),E('line',f.x0,y+rh,f.cw,2,{stroke:st.pal.a,sw:.35,dash:'solid',y:y+rh-1}))}
   const by=f.y1-bottom+3*s;els.push(lbl(f.x0,by,f.cw,'não esquecer',st,s),chk(f.x0,by+lbh(s),f.cw/2-2*s,bottom-3*s-lbh(s),3,st),chk(f.x0+f.cw/2+2*s,by+lbh(s),f.cw/2-2*s,bottom-3*s-lbh(s),3,st));
   return{els}}},
 diario:{nome:'Diário',cat:'Planejamento',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,dt=d.date||new Date(),hn=(d.holidays!==false)?feriados(dt.getFullYear())[dt.getMonth()+'-'+dt.getDate()]:null;
   const h=hdr(f,st,cap(DIAS[dt.getDay()]),`${dt.getDate()} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`,d.links&&d.links.month?d.links.month(dt.getFullYear(),dt.getMonth()):null),els=[...h.els];let y0=h.y;
   if(hn){els.push(tx(f.x0,y0-1.5*s,f.cw,lbh(s),'♡ '+hn,{font:st.title,size:cl(7.5*s,5.5,13),weight:600,color:st.pal.a,align:'right',valign:'middle'}));y0+=lbh(s)}
   const land=f.cw>f.ch*1.1,g=5*s;
   if(land){const c1=f.cw*.38,c2=f.cw*.3,c3=f.cw-c1-c2-2*g,ah=f.y1-y0;
     els.push(lbl(f.x0,y0,c1,'agenda',st,s),E('hours',f.x0,y0+lbh(s),c1,ah-lbh(s),{from:6,to:22,font:st.title,color:st.pal.ink,stroke:st.pal.line,fmt:'h',half:false}));
     const x2=f.x0+c1+g;els.push(lbl(x2,y0,c2,'prioridades',st,s),chk(x2,y0+lbh(s),c2,ah*.22,3,st),lbl(x2,y0+ah*.27,c2,'tarefas',st,s),chk(x2,y0+ah*.27+lbh(s),c2,ah*.5,7,st),lbl(x2,y0+ah*.83,c2,'água',st,s),E('water',x2,y0+ah*.83+lbh(s),c2,ah*.17-lbh(s),{n:8,color:st.pal.b,fill:'none',sw:.3}));
     const x3=x2+c2+g;els.push(lbl(x3,y0,c3,'notas',st,s),pat(x3,y0+lbh(s),c3,ah*.78-lbh(s),st,s),lbl(x3,y0+ah*.83,c3,'humor',st,s),E('mood',x3,y0+ah*.83+lbh(s),c3,ah*.17-lbh(s),{n:5,color:st.pal.ink,sw:.3}))}
   else{const ah=(f.y1-y0)*.74,c1=f.cw*.54,c2=f.cw-c1-g,x2=f.x0+c1+g;
     els.push(lbl(f.x0,y0,c1,'agenda',st,s),E('hours',f.x0,y0+lbh(s),c1,ah-lbh(s),{from:6,to:22,font:st.title,color:st.pal.ink,stroke:st.pal.line,fmt:'h',half:false}));
     els.push(lbl(x2,y0,c2,'prioridades',st,s),chk(x2,y0+lbh(s),c2,ah*.2,3,st),lbl(x2,y0+ah*.25,c2,'tarefas',st,s),chk(x2,y0+ah*.25+lbh(s),c2,ah*.42,6,st),
       lbl(x2,y0+ah*.73,c2,'água',st,s),E('water',x2,y0+ah*.73+lbh(s),c2,ah*.11,{n:8,color:st.pal.b,fill:'none',sw:.3}),lbl(x2,y0+ah*.88,c2,'humor',st,s),E('mood',x2,y0+ah*.88+lbh(s),c2,ah*.12-lbh(s),{n:5,color:st.pal.ink,sw:.3}));
     const ny=y0+ah+3*s;els.push(lbl(f.x0,ny,f.cw,'notas',st,s),pat(f.x0,ny+lbh(s),f.cw,f.y1-ny-lbh(s),st,s))}
   return{els}}},
 habitos:{nome:'Hábitos do mês',cat:'Planejamento',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,'Hábitos',cap(MESES[d.m])+' '+d.y);const rows=Math.max(6,Math.floor((f.y1-h.y)/(cl(7*s,5,10)))-1);
   return{els:[...h.els,E('habit',f.x0,h.y,f.cw,f.y1-h.y,{days:daysIn(d.y,d.m),rows,labels:[],labelW:.28,font:st.title,color:st.pal.text,accent:st.pal.a,stroke:st.pal.line})]}}},
 metas:{nome:'Metas',cat:'Planejamento',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,'Metas',d.m!=null?cap(MESES[d.m])+' '+d.y:'do mês'),els=[...h.els],g=4*s,bh=(f.y1-h.y-2*g)/3;
   for(let i=0;i<3;i++){const y=h.y+i*(bh+g);els.push(box(f.x0,y,f.cw,bh,st,{fill:i===0?st.pal.soft:'none'}),tx(f.x0+3*s,y+2*s,f.cw*.5,lbh(s),'meta '+(i+1),{font:st.script,size:cl(16*s,9,30),color:st.pal.a,valign:'middle',lh:1}),
     tx(f.x0+f.cw*.5,y+2*s,f.cw*.5-3*s,lbh(s),'prazo: ____ / ____',{font:st.title,size:cl(7*s,5,12),weight:500,color:st.pal.ink,align:'right',valign:'middle'}),
     E('line',f.x0+3*s,y+2*s+lbh(s)+5*s,f.cw-6*s,2,{stroke:st.pal.line,sw:.3,dash:'solid'}),lbl(f.x0+3*s,y+2*s+lbh(s)+8*s,f.cw,'passos',st,s),chk(f.x0+3*s,y+2*s+2*lbh(s)+8*s,f.cw-6*s,bh-(4*s+2*lbh(s)+8*s),4,st))}
   return{els}}},
 financas:{nome:'Finanças do mês',cat:'Vida e casa',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,'Finanças',d.m!=null?cap(MESES[d.m])+' '+d.y:'mês'),els=[...h.els],g=3*s,bw=(f.cw-2*g)/3,bh=cl(16*s,11,30);
   ['entradas','saídas','saldo'].forEach((t,i)=>{const x=f.x0+i*(bw+g);els.push(E('rect',x,h.y,bw,bh,{fill:i===2?st.pal.soft2:st.pal.soft,stroke:'none',sw:0,radius:2.5*s}),tx(x+2*s,h.y+1.5*s,bw-4*s,lbh(s),t,{font:st.title,size:cl(7*s,5,12),weight:600,color:st.pal.ink,ls:.1,valign:'middle'}),tx(x+2*s,h.y+bh*.5,bw-4*s,bh*.45,'R$',{font:st.title,size:cl(9*s,6,16),weight:700,color:st.pal.text,valign:'middle'}))});
   const rest=f.y1-h.y-bh-4*s,y1=h.y+bh+4*s,h1=rest*.36;
   els.push(lbl(f.x0,y1,f.cw,'entradas',st,s),tbl(f.x0,y1+lbh(s),f.cw,h1-lbh(s),5,['Descrição','Data','Valor (R$)'],st,{cw:[.55,.2,.25]}));
   const y2=y1+h1+3*s;els.push(lbl(f.x0,y2,f.cw,'saídas',st,s),tbl(f.x0,y2+lbh(s),f.cw,f.y1-y2-lbh(s),10,['Descrição','Data','Valor (R$)'],st,{cw:[.55,.2,.25]}));
   return{els}}},
 cardapio:{nome:'Cardápio da semana',cat:'Vida e casa',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,'Cardápio','semana de ___ a ___'),els=[...h.els],ws=st.ws||0;
   const th=(f.y1-h.y)*.6;els.push(tbl(f.x0,h.y,f.cw,th,7,['','Café da manhã','Almoço','Jantar'],st,{side:[...Array(7)].map((_,i)=>cap(DIA3[(ws+i)%7])),cw:[.16,.28,.28,.28]}));
   const ly=h.y+th+4*s,lh2=f.y1-ly-lbh(s);els.push(lbl(f.x0,ly,f.cw,'lista de compras',st,s),chk(f.x0,ly+lbh(s),f.cw/2-2*s,lh2,Math.max(3,Math.floor(lh2/7)),st),chk(f.x0+f.cw/2+2*s,ly+lbh(s),f.cw/2-2*s,lh2,Math.max(3,Math.floor(lh2/7)),st));
   return{els}}},
 leitura:{nome:'Registro de leituras',cat:'Vida e casa',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,'Leituras',String(d.y||new Date().getFullYear()));const rows=Math.max(8,Math.floor((f.y1-h.y)/cl(8*s,6,11))-1);
   return{els:[...h.els,tbl(f.x0,h.y,f.cw,f.y1-h.y,rows,['Título','Autor','Início','Fim','Nota'],st,{cw:[.36,.26,.13,.13,.12]})]}}},
 aniversarios:{nome:'Aniversários',cat:'Vida e casa',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,'Aniversários',''),els=[...h.els],land=f.cw>f.ch*1.1,cols=land?4:3,rows=12/cols,g=3*s,bw=(f.cw-g*(cols-1))/cols,bh=(f.y1-h.y-g*(rows-1))/rows;
   for(let m=0;m<12;m++){const x=f.x0+(m%cols)*(bw+g),y=h.y+Math.floor(m/cols)*(bh+g);els.push(box(x,y,bw,bh,st),tx(x+2*s,y+1.5*s,bw-4*s,lbh(s),MESES[m],{font:st.title,size:cl(7*s,5,12),weight:600,color:st.pal.a,ls:.08,valign:'middle'}),pat(x+2*s,y+1.5*s+lbh(s),bw-4*s,bh-3*s-lbh(s),st,s))}
   return{els}}},
 contatos:{nome:'Contatos',cat:'Vida e casa',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,'Contatos','');const rows=Math.max(8,Math.floor((f.y1-h.y)/cl(9*s,7,12))-1);
   return{els:[...h.els,tbl(f.x0,h.y,f.cw,f.y1-h.y,rows,['Nome','Telefone','Aniversário'],st,{cw:[.45,.32,.23]})]}}},
 indice:{nome:'Índice',cat:'Notas',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,'Índice','');const rows=Math.max(8,Math.floor((f.y1-h.y)/cl(7.5*s,6,10))-1);
   return{els:[...h.els,tbl(f.x0,h.y,f.cw,f.y1-h.y,rows,['Pág.','Conteúdo'],st,{cw:[.14,.86]})]}}},
 tarefas:{nome:'Lista de tarefas',cat:'Notas',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,'Tarefas','data: ___ / ___');
   return{els:[...h.els,chk(f.x0,h.y,f.cw,f.y1-h.y,Math.max(6,Math.floor((f.y1-h.y)/cl(7.5*s,6,10))),st)]}}},
 pautada:{nome:'Notas pautadas',cat:'Notas',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,'Notas','data: ___ / ___');return{els:[...h.els,pat(f.x0,h.y,f.cw,f.y1-h.y,st,s,'lines')]}}},
 pontilhada:{nome:'Notas pontilhadas',cat:'Notas',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,'Notas','data: ___ / ___');const p=pat(f.x0,h.y,f.cw,f.y1-h.y,st,s,'dots');p.sp=5;return{els:[...h.els,p]}}},
 quadriculada:{nome:'Notas quadriculadas',cat:'Notas',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,'Notas','data: ___ / ___');const p=pat(f.x0,h.y,f.cw,f.y1-h.y,st,s,'grid');p.sp=5;p.sw=.2;return{els:[...h.els,p]}}},
 branca:{nome:'Página em branco',cat:'Notas',fn(){return{els:[]}}}
};
const field=(x,y,w,label,st,s)=>{const rh=cl(7*s,5,11);return[tx(x,y,w,rh,label,{font:st.title,size:cl(7.5*s,5.5,13),weight:600,color:st.pal.ink,valign:'bottom'}),E('line',x,y+rh-1,w,2,{stroke:st.pal.line,sw:.3,dash:'solid'})]};
const fieldH=s=>cl(7*s,5,11)+2*s;
Object.assign(TPL,{
 orcamento:{nome:'Orçamento de encomenda',cat:'Ateliê',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,'Orçamento','nº ______'),els=[...h.els],g=4*s,half=(f.cw-g)/2;let y=h.y;
   els.push(...field(f.x0,y,f.cw,'cliente:',st,s));y+=fieldH(s);
   els.push(...field(f.x0,y,half,'contato:',st,s),...field(f.x0+half+g,y,half,'data:',st,s));y+=fieldH(s);
   els.push(...field(f.x0,y,half,'entrega prevista:',st,s),...field(f.x0+half+g,y,half,'válido até:',st,s));y+=fieldH(s)+2*s;
   const tH=(f.y1-y)*(f.cw>f.ch*1.1?.4:.44);els.push(tbl(f.x0,y,f.cw,tH,7,['Item / descrição','Qtd.','Valor unit.','Total'],st,{cw:[.5,.12,.19,.19]}));y+=tH+4*s;
   const bw=f.cw*.5,bx=f.x1-bw,lw=f.cw-bw-g,rows=[['subtotal',600],['desconto',600],['total',700],['sinal 50% no pedido',600],['restante na entrega',600]],bh=Math.min((f.y1-y)*.62,rows.length*cl(7*s,5,10));
   els.push(E('rect',bx,y,bw,bh,{fill:st.pal.soft,stroke:'none',sw:0,radius:2.5*s}));
   rows.forEach(([t,wt],i)=>{const ry=y+i*bh/rows.length;els.push(tx(bx+2.5*s,ry,bw*.58,bh/rows.length,t,{font:st.title,size:cl(7*s,5,12),weight:wt,color:st.pal.ink,valign:'middle'}),tx(bx+bw*.58,ry,bw*.42-2.5*s,bh/rows.length,'R$',{font:st.title,size:cl(7.5*s,5.5,13),weight:700,color:st.pal.text,valign:'middle'}))});
   els.push(lbl(f.x0,y,lw,'pagamento',st,s),chk(f.x0,y+lbh(s),lw,bh-lbh(s),3,st,{items:['Pix','Dinheiro','Cartão'],font:st.body,lines:false}));
   y+=bh+4*s;const foot=cl(6*s,4.5,9),oh=f.y1-y-lbh(s)-foot-1;if(oh>6*s)els.push(lbl(f.x0,y,f.cw,'observações',st,s),pat(f.x0,y+lbh(s),f.cw,oh,st,s));
   els.push(tx(f.x0,f.y1-foot,f.cw,foot,'personalizados: 10 a 20 dias úteis · pronta entrega: 3 a 7 dias úteis',{font:st.title,size:cl(6.2*s,4.5,10),weight:500,color:st.pal.ink,align:'center',valign:'middle',ls:.04}));
   return{els}}},
 pedidos:{nome:'Registro de pedidos',cat:'Ateliê',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,'Pedidos',d.m!=null?cap(MESES[d.m])+' '+d.y:'mês: ______');const rows=Math.max(8,Math.floor((f.y1-h.y)/cl(8*s,6,11))-1);
   return{els:[...h.els,tbl(f.x0,h.y,f.cw,f.y1-h.y,rows,['Nº','Data','Cliente','Produto','Valor','Sinal','Entrega','Status'],st,{cw:[.06,.09,.18,.24,.1,.09,.11,.13],size:6.5})]}}},
 fichaPedido:{nome:'Ficha de pedido personalizado',cat:'Ateliê',fn(W,H,st,d,o={}){const f=fr(W,H,o),s=f.s,h=hdr(f,st,'Pedido','nº ______'),els=[...h.els],g=4*s,half=(f.cw-g)/2;let y=h.y;
   els.push(...field(f.x0,y,half,'cliente:',st,s),...field(f.x0+half+g,y,half,'contato:',st,s));y+=fieldH(s);
   els.push(...field(f.x0,y,half,'data do pedido:',st,s),...field(f.x0+half+g,y,half,'entrega:',st,s));y+=fieldH(s)+2*s;
   const groups=[['tamanho',['A4','A5','A6','Colegial','Outro: ______']],['encadernação',['Wire-o','Disco (cogumelo)','Costura','Brochura']],['miolo',['Pautado','Pontilhado','Quadriculado','Planner datado','Em branco']],['páginas',['40','80','100','120','Outro: ______']],['capa',['Arte do catálogo','Arte do cliente','Nome personalizado']],['extras',['Bolso canguru','Elástico','Cantoneira','Marcador de página']]];
   const land=f.cw>f.ch*1.1,cols=land?3:2,rows=Math.ceil(groups.length/cols),avail=(f.y1-y)*.72,bh=(avail-g*(rows-1))/rows,bw=(f.cw-g*(cols-1))/cols;
   groups.forEach(([t,items],i)=>{const x=f.x0+(i%cols)*(bw+g),yy=y+Math.floor(i/cols)*(bh+g);els.push(box(x,yy,bw,bh,st),lbl(x+2.5*s,yy+1.2*s,bw-5*s,t,st,s),chk(x+2.5*s,yy+1.2*s+lbh(s),bw-5*s,bh-2.4*s-lbh(s),items.length,st,{items,font:st.body,lines:false}))});
   y+=avail+4*s;const rest=f.y1-y;els.push(lbl(f.x0,y,f.cw,'cores, detalhes e recados',st,s),pat(f.x0,y+lbh(s),f.cw,rest-lbh(s)-fieldH(s)-1,st,s));
   els.push(...field(f.x0,f.y1-fieldH(s)+2*s,half,'valor: R$',st,s),...field(f.x0+half+g,f.y1-fieldH(s)+2*s,half,'sinal 50%: R$',st,s));
   return{els}}}
});
const TPL_CATS=['Capas e divisórias','Calendários','Planejamento','Vida e casa','Ateliê','Notas'];

/* ================= gerador de planner datado ================= */
function genSpecs(o){const specs=[],months=[];for(let i=0;i<o.months;i++){const d=new Date(o.y,o.m+i,1);months.push({y:d.getFullYear(),m:d.getMonth()})}
  const startD=new Date(months[0].y,months[0].m,1),last=months[months.length-1],endD=new Date(last.y,last.m,daysIn(last.y,last.m));
  if(o.cover)specs.push({k:'capa',size:o.coverSize,d:{y:months[0].y,title:o.title}});
  if(o.annual)[...new Set(months.map(x=>x.y))].forEach(y=>specs.push({k:'anual',d:{y}}));
  const done=new Set();
  months.forEach((mo,mi)=>{const mk=mo.y+'-'+mo.m,dm={y:mo.y,m:mo.m};
    if(o.sep)specs.push({k:'separador',d:dm,mk});
    if(o.monthly)specs.push({k:'mensal',d:dm,mk,isMonth:true});
    if(o.habits)specs.push({k:'habitos',d:dm,mk});
    if(o.goals)specs.push({k:'metas',d:dm,mk});
    if(o.fin)specs.push({k:'financas',d:dm,mk});
    const dim=daysIn(mo.y,mo.m);
    if(o.weekly){const starts=[],d1=new Date(mo.y,mo.m,1),off=(d1.getDay()-o.ws+7)%7;if(mi===0&&off>0)starts.push(new Date(mo.y,mo.m,1-off));
      for(let d=1;d<=dim;d++){const dt=new Date(mo.y,mo.m,d);if(dt.getDay()===o.ws)starts.push(dt)}
      starts.forEach(s0=>{specs.push({k:o.weeklyStyle||'semanal',d:{start:s0},mk,wk:dkey(s0)});
        if(o.daily)for(let i=0;i<7;i++){const dt=addDays(s0,i);if(dt<startD||dt>endD||done.has(dkey(dt)))continue;done.add(dkey(dt));specs.push({k:'diario',d:{date:dt},mk,day:dkey(dt)})}})}
    else if(o.daily)for(let d=1;d<=dim;d++){const dt=new Date(mo.y,mo.m,d);done.add(dkey(dt));specs.push({k:'diario',d:{date:dt},mk,day:dkey(dt)})}
    for(let n=0;n<(o.notes|0);n++)specs.push({k:o.notesKind||'pautada',d:{},mk});
  });
  return{specs,months}}
function genPages(o,st){const {specs,months}=genSpecs(o);specs.forEach(sp=>sp.id=uid('pg'));
  const first={},mon={},day={},wk={};specs.forEach(sp=>{if(sp.mk){first[sp.mk]??=sp.id;if(sp.isMonth)mon[sp.mk]=sp.id}if(sp.day)day[sp.day]=sp.id;if(sp.wk)wk[sp.wk]=sp.id});
  const mt=mk=>mon[mk]||first[mk]||null;
  const links=o.links?{day:dt=>day[dkey(dt)]||wk[dkey(weekStartOf(dt,o.ws))]||null,month:(y,m)=>mt(y+'-'+m)}:null;
  const sty=Object.assign({},st,{ws:o.ws});
  return specs.map(sp=>{const sz=sp.size||o.size,W=sz.w,H=sz.h,useTabs=o.tabs&&sp.k!=='capa',tw=useTabs?cl(Math.min(W,H)/148*7,5,10):0;
    const out=TPL[sp.k].fn(W,H,sty,Object.assign({links,holidays:o.holidays},sp.d),{reserveR:tw?tw+1:0});
    if(useTabs){const m=fr(W,H).m;out.els.push(E('tabs',W-tw,m*.6,tw,H-m*1.2,{labels:months.map(x=>MES3[x.m]),links:months.map(x=>mt(x.y+'-'+x.m)),active:sp.mk?months.findIndex(x=>x.y+'-'+x.m===sp.mk):-1,font:sty.title,color:'#3E3550',fill1:sty.pal.a,fill2:sty.pal.b,activeFill:'#4A4E79'}))}
    let nm=TPL[sp.k].nome;if(sp.d.m!=null&&sp.k!=='capa')nm+=' · '+MES3[sp.d.m]+' '+sp.d.y;if(sp.d.start)nm+=' · '+weekLabel(sp.d.start);if(sp.d.date)nm+=' · '+sp.d.date.getDate()+' '+MES3[sp.d.date.getMonth()];if(sp.k==='anual')nm+=' '+sp.d.y;
    return{id:sp.id,w:W,h:H,bg:out.bg||'#FFFFFF',bgImg:null,name:nm,els:out.els}})}

/* ================= imposição em cadernos ================= */
function impose(list,sheets){const per=4*sheets,L=list.slice();while(L.length%per)L.push(null);const out=[];
  for(let s=0;s<L.length;s+=per){const g=L.slice(s,s+per);for(let k=0;k<sheets;k++){out.push({side:'frente',l:g[per-1-2*k],r:g[2*k]});out.push({side:'verso',l:g[2*k+1],r:g[per-2-2*k]})}}return out}

/* ================= armazenamento (no aparelho, em IndexedDB) ================= */
const IDB={db:null,
  open(){return new Promise((res,rej)=>{const rq=indexedDB.open('cnu-estudio-miolos',2);
    rq.onupgradeneeded=()=>{const d=rq.result;['meta','pages','lib','assets','versoes'].forEach(n=>{if(!d.objectStoreNames.contains(n))d.createObjectStore(n)})};
    rq.onsuccess=()=>{this.db=rq.result;res()};rq.onerror=()=>rej(rq.error)})},
  tx(st,mode,fn){return new Promise((res,rej)=>{const t=this.db.transaction(st,mode),out=fn(t);t.oncomplete=()=>res(out&&out.result!==undefined?out.result:out);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})},
  get(st,k){return this.tx(st,'readonly',t=>t.objectStore(st).get(k))},
  put(st,k,v){return this.tx(st,'readwrite',t=>{t.objectStore(st).put(v,k)})},
  del(st,k){return this.tx(st,'readwrite',t=>{t.objectStore(st).delete(k)})},
  all(st){return new Promise((res,rej)=>{const out=[],t=this.db.transaction(st,'readonly'),rq=t.objectStore(st).openCursor();rq.onsuccess=()=>{const c=rq.result;if(c){out.push([c.key,c.value]);c.continue()}else res(out)};rq.onerror=()=>rej(rq.error)})}};
const ASSET_URL=new Map();
const srcUrl=s=>/^(data:|blob:|\/|https?:)/.test(s)?s:(ASSET_URL.get(s)||'');
const Store={mode:'local',
  async init(){try{await IDB.open()}catch(e){console.error(e);toast('Não consegui abrir o armazenamento do navegador. Os projetos não serão guardados.')}
    try{for(const [id,blob] of await IDB.all('assets'))ASSET_URL.set(id,URL.createObjectURL(blob))}catch(e){console.error(e)}},
  async listProjects(){return (await IDB.all('meta')).map(([id,m])=>Object.assign(clone(m),{id}))},
  async getPage(pid,id){return (await IDB.get('pages',pid+'/'+id))||null},
  async loadPages(pid,order){const out={};await pool(order.map(id=>async()=>{const p=await this.getPage(pid,id);if(p)out[id]=p}),8);return out},
  saveMeta(pid,meta){return IDB.put('meta',pid,meta)},
  savePage(pid,id,pg){return IDB.put('pages',pid+'/'+id,pg)},
  delPage(pid,id){return IDB.del('pages',pid+'/'+id)},
  async delProject(pid,order){await IDB.del('meta',pid);await pool(order.map(id=>()=>this.delPage(pid,id)),6)},
  async listLib(){return (await IDB.all('lib')).map(([id,v])=>Object.assign(clone(v),{id}))},
  saveLib(it){const {id,...rest}=it;return IDB.put('lib',id,rest)},
  async delLib(it){await IDB.del('lib',it.id);if(it.src&&ASSET_URL.has(it.src)&&!S.lib.some(o=>o!==it&&o.src===it.src)){await IDB.del('assets',it.src);URL.revokeObjectURL(ASSET_URL.get(it.src));ASSET_URL.delete(it.src)}},
  async upload(file,type){const blob=await prepBlob(file,type),id=uid('a');await IDB.put('assets',id,blob);ASSET_URL.set(id,URL.createObjectURL(blob));return id}
};
async function pool(tasks,n){let i=0;const run=async()=>{while(i<tasks.length){const t=tasks[i++];await t()}};await Promise.all(Array(Math.min(n,tasks.length)).fill(0).map(run))}
/** Imagens grandes são reduzidas (máx. 1800 px) para o projeto não ficar pesado; fontes e outros arquivos vão como estão. */
function prepBlob(file,type){return new Promise((res,rej)=>{if(!type.startsWith('image/'))return res(file);
  const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{URL.revokeObjectURL(url);const mx=1800,s=Math.min(1,mx/Math.max(im.width,im.height));if(s>=1)return res(file);
    const c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);c.toBlob(b=>b?res(b):rej(new Error('imagem')),type==='image/png'?'image/png':'image/jpeg',.9)};
  im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('imagem'))};im.src=url})}

const Saver={dirty:new Set(),del:new Set(),meta:false,t:null,busy:false,
  page(id){this.dirty.add(id);this.del.delete(id);this.kick()},rm(id){this.dirty.delete(id);this.del.add(id);this.kick()},m(){this.meta=true;this.kick()},
  pending(){return this.dirty.size||this.del.size||this.meta},
  kick(){setSave('Salvando…');clearTimeout(this.t);this.t=setTimeout(()=>this.flush(),700)},
  async flush(){if(this.busy){await new Promise(r=>setTimeout(r,200));return this.flush()}if(!S.pid||!this.pending()){return}this.busy=true;const pid=S.pid;
    const ids=[...this.dirty],dels=[...this.del];this.dirty.clear();this.del.clear();this.meta=false;
    try{const tasks=[...ids.filter(id=>S.pages[id]).map(id=>()=>Store.savePage(pid,id,S.pages[id])),...dels.map(id=>()=>Store.delPage(pid,id))];
      if(tasks.length>20)setSave(`Salvando ${tasks.length} páginas…`);await pool(tasks,4);await Store.saveMeta(pid,metaDoc());setSave('Salvo neste aparelho')}
    catch(e){console.error(e);ids.forEach(id=>this.dirty.add(id));this.meta=true;setSave('Falha ao salvar — tentando de novo');setTimeout(()=>this.kick(),4000)}
    finally{this.busy=false}}};
function metaDoc(){const m=Object.assign({},S.meta,{kind:'project',order:S.order.slice(),count:S.order.length,updatedAt:Date.now()});const sz={};S.order.forEach(id=>{const p=S.pages[id];if(p){const n=sizeName(p.w,p.h);sz[n]=(sz[n]||0)+1}});m.sizes=sz;delete m.id;return m}

/* ================= estado ================= */
const S={view:'home',projects:[],pid:null,meta:null,pages:{},order:[],cur:0,sel:[],zoom:0,k:1,hist:[],fut:[],tab:'modelos',lib:[],editing:null,clip:null,guides:true,tplRef:null,genOpt:null,stripKey:''};
const curId=()=>S.order[S.cur],curPage=()=>S.pages[curId()];
const styleOf=()=>{const st=S.meta&&S.meta.style||{};const pr=PAIRS[st.pair]||PAIRS.assinatura;return{pal:PALS[st.pal]||PALS.lavanda,script:pr.script,title:pr.title,body:pr.body,ws:S.meta?S.meta.weekStart||0:0}};
const blankPage=(w,h)=>({id:uid('pg'),w,h,bg:'#FFFFFF',bgImg:null,name:'Página em branco',els:[]});

/* histórico */
function snapOf(ids){return{order:S.order.slice(),pages:Object.fromEntries([...new Set(ids)].map(id=>[id,S.pages[id]?JSON.stringify(S.pages[id]):null]))}}
function pushHist(b,a){const ch=Object.keys(a.pages).filter(id=>a.pages[id]!==b.pages[id]);const oc=b.order.join()!==a.order.join();if(!ch.length&&!oc)return;
  S.hist.push({b,a});if(S.hist.length>80)S.hist.shift();S.fut=[];ch.forEach(id=>a.pages[id]===null?Saver.rm(id):Saver.page(id));if(oc)Saver.m();updUndo()}
function change(ids,fn){const old=S.order.slice(),pre={};ids.forEach(id=>pre[id]=S.pages[id]?JSON.stringify(S.pages[id]):null);fn();
  const ns=new Set(S.order),os=new Set(old),post={};
  S.order.forEach(id=>{if(!os.has(id)){pre[id]=null}});old.forEach(id=>{if(!ns.has(id)){if(!(id in pre))pre[id]=S.pages[id]?JSON.stringify(S.pages[id]):null;delete S.pages[id]}});
  Object.keys(pre).forEach(id=>post[id]=S.pages[id]?JSON.stringify(S.pages[id]):null);
  pushHist({order:old,pages:pre},{order:S.order.slice(),pages:post});S.cur=cl(S.cur,0,S.order.length-1)}
function applySnap(s){S.order=s.order.slice();for(const [id,j] of Object.entries(s.pages)){if(j===null){delete S.pages[id];Saver.rm(id)}else{S.pages[id]=JSON.parse(j);Saver.page(id)}}Saver.m();
  S.cur=cl(S.cur,0,S.order.length-1);const pg=curPage();S.sel=S.sel.filter(id=>pg&&pg.els.some(e=>e.id===id));refreshAll()}
function undo(){const h=S.hist.pop();if(!h)return;applySnap(h.b);S.fut.push(h);updUndo()}
function redo(){const h=S.fut.pop();if(!h)return;applySnap(h.a);S.hist.push(h);updUndo()}
function updUndo(){$('#bUndo').disabled=!S.hist.length;$('#bRedo').disabled=!S.fut.length}

/* ================= interface: utilidades ================= */
let toastT;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2600)}
function setSave(t){const e=$('#saveSt');if(e)e.textContent=t}
function modal(html,onMount,wide){const m=$('#modal'),b=$('.mbox',m);b.classList.toggle('wide',!!wide);b.innerHTML=html;m.hidden=false;const close=()=>{m.hidden=true;b.innerHTML=''};m.onclick=e=>{if(e.target===m&&!m.dataset.lock)close()};$$('[data-close]',b).forEach(x=>x.onclick=close);if(onMount)onMount(b,close);const f=b.querySelector('input,select,button');if(f)f.focus();return close}
const ICON={
  modelos:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  datado:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h2M14 14h2M8 17h2"/>',
  widgets:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/>',
  adesivos:'<path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"/>',
  texto:'<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  biblioteca:'<path d="M4 20V8l4-4h12v16z"/><path d="M12 9v7M9 13l3 3 3-3"/>',
  paginas:'<rect x="5" y="3" width="11" height="15" rx="1.5"/><path d="M9 21h10V7"/>',
  app:'<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/><path d="M9.5 9.5l2 2 3.5-4"/>',
  bordas:'<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1" stroke-dasharray="2 2"/>',
  pen:'<path d="M4 20c3-1 4-6 8-6s4 4 8 2"/><path d="M14 4l6 6-8 1z"/>',poly:'<path d="M5 18L8 5l11 4-3 10z"/><circle cx="5" cy="18" r="1.5"/><circle cx="8" cy="5" r="1.5"/><circle cx="19" cy="9" r="1.5"/><circle cx="16" cy="19" r="1.5"/>',curve:'<path d="M4 18C6 6 18 6 20 18"/><circle cx="4" cy="18" r="1.5"/><circle cx="20" cy="18" r="1.5"/><circle cx="12" cy="9" r="1.5"/>',
  dup:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  del:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  front:'<rect x="8" y="8" width="12" height="12" rx="1.5" fill="currentColor" fill-opacity=".25"/><path d="M4 16V4h12"/>',
  back:'<rect x="4" y="4" width="12" height="12" rx="1.5" fill="currentColor" fill-opacity=".25"/><path d="M20 8v12H8"/>',
  up:'<path d="M12 19V5M6 11l6-6 6 6"/>',down:'<path d="M12 5v14M6 13l6 6 6-6"/>',
  al:'<path d="M4 3v18M8 7h12M8 17h7"/>',ac:'<path d="M12 3v18M6 7h12M8 17h8"/>',ar:'<path d="M20 3v18M4 7h12M9 17h7"/>',
  at:'<path d="M3 4h18M7 8v12M17 8v7"/>',am:'<path d="M3 12h18M7 6v12M17 8v8"/>',ab:'<path d="M3 20h18M7 4v12M17 9v7"/>'};
const ico=(k,cls='ico')=>`<svg class="${cls}" viewBox="0 0 24 24">${ICON[k]||''}</svg>`;

/* ================= marca ================= */
const MARK=`<svg class="mark" viewBox="0 0 64 48" aria-hidden="true"><rect x="5" y="27" width="50" height="13" rx="3" fill="#92A8D1" stroke="#4A4E79" stroke-width="1.2"/><rect x="47" y="29.5" width="5" height="8" rx="1" fill="#FBF7F4"/><g transform="rotate(-5 32 20)"><rect x="9" y="14" width="44" height="13" rx="3" fill="#C398C8" stroke="#4A4E79" stroke-width="1.2"/><rect x="45" y="16.5" width="5" height="8" rx="1" fill="#FBF7F4"/><path d="M38 14v13" stroke="#4A4E79" stroke-width="1.2"/></g><g transform="translate(50 9)"><circle cx="0" cy="-4" r="3.2" fill="#F1CDD9" stroke="#E7A6BE" stroke-width=".8"/><circle cx="3.8" cy="-1.2" r="3.2" fill="#F1CDD9" stroke="#E7A6BE" stroke-width=".8"/><circle cx="2.4" cy="3.3" r="3.2" fill="#F1CDD9" stroke="#E7A6BE" stroke-width=".8"/><circle cx="-2.4" cy="3.3" r="3.2" fill="#F1CDD9" stroke="#E7A6BE" stroke-width=".8"/><circle cx="-3.8" cy="-1.2" r="3.2" fill="#F1CDD9" stroke="#E7A6BE" stroke-width=".8"/><circle r="1.6" fill="#D8A776"/></g><path d="M8 6c.3 2.6.7 3 3.3 3.3C8.7 9.6 8.3 10 8 12.6 7.7 10 7.3 9.6 4.7 9.3 7.3 9 7.7 8.6 8 6z" fill="#D8A776"/></svg>`;
function renderBrand(){const lg=S.lib.find(x=>x.kind==='logo');$('#brand').innerHTML=lg?`<img class="logo" src="${esc(srcUrl(lg.src))}" alt="Logo do ateliê">`:`${MARK}<div class="word"><span class="script"><span class="l">Craft</span> <span class="a">Notes</span> <span class="l">Unique</span></span><span class="tag">atelier criativo</span></div>`;$('#logoReset').hidden=!lg}

/* ================= HOME ================= */
async function loadHome(){S.view='home';$('#home').hidden=false;$('#editor').hidden=true;renderBrand();
  const hs=$('#hstatus');hs.className='status ok';hs.querySelector('span').textContent='Projetos guardados neste aparelho'+(Cloud.user?' · conectada à nuvem':(Cloud.sb?'':' · nuvem desligada'));
  $('#plist').innerHTML='<p class="hint">Carregando projetos…</p>';
  try{S.projects=(await Store.listProjects()).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))}catch(e){S.projects=[];toast('Não consegui ler seus projetos agora.')}
  renderHome()}
function renderHome(){const L=$('#plist');
  if(!S.projects.length){L.innerHTML=`<div class="empty"><div class="tag">— ♡ comece por aqui ♡ —</div><h2>Nenhum projeto ainda</h2><p>Crie um miolo do zero ou gere um planner de exemplo: capa em A6, miolo em A5, calendários de janeiro a março com links nas abas laterais.</p><div class="row"><button class="btn pri" id="hNew">Novo projeto</button><button class="btn" id="hSample">Criar planner de exemplo</button></div></div>`;
    $('#hNew').onclick=newProjectModal;$('#hSample').onclick=createSample;return}
  L.innerHTML=`<div class="grid"><div class="card new"><div class="th" id="hNew" role="button" tabindex="0"><span class="plus">+</span>Novo projeto</div><div class="bd"><span class="mt">ou</span><button class="btn sm" id="hSample">Criar planner de exemplo</button></div></div>${S.projects.map(p=>{const sz=p.sizes?Object.keys(p.sizes).join(' + '):'';
    return `<div class="card" data-pid="${p.id}"><div class="th" data-open="${p.id}" role="button" tabindex="0" aria-label="Abrir ${esc(p.name)}"><canvas width="10" height="10"></canvas></div><div class="bd"><div class="nm">${esc(p.name)}</div><div class="mt">${p.count||0} página${p.count===1?'':'s'}${sz?' · '+esc(sz):''}</div><div class="mt">editado em ${new Date(p.updatedAt||p.createdAt||Date.now()).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}</div><div class="ac"><button class="btn sm" data-open="${p.id}">Abrir</button><button class="btn sm ghost" data-dup="${p.id}">Duplicar</button><button class="btn sm ghost danger" data-del="${p.id}">Excluir</button></div></div></div>`}).join('')}</div>`;
  $('#hNew').onclick=newProjectModal;$('#hNew').onkeydown=e=>{if(e.key==='Enter')newProjectModal()};$('#hSample').onclick=createSample;
  $$('[data-open]',L).forEach(b=>{b.onclick=()=>openProject(b.dataset.open);b.onkeydown=e=>{if(e.key==='Enter')openProject(b.dataset.open)}});
  $$('[data-dup]',L).forEach(b=>b.onclick=()=>dupProject(b.dataset.dup));
  $$('[data-del]',L).forEach(b=>b.onclick=()=>{if(b.dataset.cf){delProject(b.dataset.del)}else{b.dataset.cf=1;b.textContent='Confirmar exclusão';setTimeout(()=>{if(b.isConnected){delete b.dataset.cf;b.textContent='Excluir'}},4000)}});
  const th={};S.homeRepaint=()=>Object.entries(th).forEach(([pid,pg])=>{const cv=$(`.card[data-pid="${pid}"] canvas`);if(cv)drawThumb(cv,pg,190,150)});
  S.projects.forEach(async p=>{if(!p.order||!p.order[0])return;try{const pg=await Store.getPage(p.id,p.order[0]);if(!pg)return;th[p.id]=pg;const cv=$(`.card[data-pid="${p.id}"] canvas`);if(!cv)return;drawThumb(cv,pg,190,150)}catch(e){}})}
function drawThumb(cv,pg,mw,mh){const k=Math.min(mw/pg.w,mh/pg.h),d=window.devicePixelRatio||1;cv.width=Math.round(pg.w*k*d);cv.height=Math.round(pg.h*k*d);cv.style.width=pg.w*k+'px';cv.style.height=pg.h*k+'px';const c=cv.getContext('2d');drawPage(c,pg,k*d)}
function sizeOptions(sel){return Object.keys(SIZES).map(n=>`<option value="${n}"${n===sel?' selected':''}>${n} · ${SIZES[n][0]}×${SIZES[n][1]} mm</option>`).join('')+`<option value="custom"${sel==='custom'?' selected':''}>Personalizado…</option>`}
function newProjectModal(){modal(`<h2>Novo projeto</h2><label class="f">Nome<input type="text" id="npName" value="Planner ${new Date().getFullYear()+1}"></label>
  <div class="fgrid"><label class="f">Tamanho do miolo<select id="npSize">${sizeOptions('A5')}</select></label><label class="f">Orientação<select id="npOr"><option value="p">Retrato</option><option value="l">Paisagem</option></select></label>
  <label class="f" id="npCw" hidden>Largura (mm)<input type="number" id="npW" value="148" min="20" max="600"></label><label class="f" id="npCh" hidden>Altura (mm)<input type="number" id="npH" value="210" min="20" max="600"></label></div>
  <p class="hint">Você pode mudar o tamanho de cada página depois, inclusive deixar a capa em A6 e o miolo em A5 no mesmo projeto.</p>
  <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="npGo">Criar projeto</button></div>`,(b,close)=>{
    $('#npSize',b).onchange=()=>{const c=$('#npSize',b).value==='custom';$('#npCw',b).hidden=!c;$('#npCh',b).hidden=!c};
    $('#npGo',b).onclick=async()=>{let [w,h]=$('#npSize',b).value==='custom'?[+$('#npW',b).value||148,+$('#npH',b).value||210]:SIZES[$('#npSize',b).value];if($('#npOr',b).value==='l')[w,h]=[Math.max(w,h),Math.min(w,h)];
      const nome=$('#npName',b).value.trim()||'Projeto sem nome';
      close();const pg=blankPage(w,h);await createProject(nome,{w,h},[pg])}})}
async function createProject(name,size,pages,coverAlone){const pid=uid('p'),meta={kind:'project',name,size,view:'single',coverAlone:!!coverAlone,weekStart:0,style:{pal:'lavanda',pair:'assinatura'},createdAt:Date.now(),updatedAt:Date.now(),order:pages.map(p=>p.id)};
  S.pid=pid;S.meta=meta;S.order=meta.order.slice();S.pages=Object.fromEntries(pages.map(p=>[p.id,p]));
  setSave('Salvando…');await pool(pages.map(p=>()=>Store.savePage(pid,p.id,p)),4);await Store.saveMeta(pid,metaDoc());await openProject(pid,true)}
async function createSample(){const y=new Date().getMonth()>=8?new Date().getFullYear()+1:new Date().getFullYear();const st={pal:PALS.lavanda,...PAIRS.assinatura};toast('Montando o planner de exemplo…');
  const pages=genPages({y,m:0,months:3,size:{w:148,h:210},cover:true,coverSize:{w:105,h:148},title:'Meu Planner',annual:true,sep:true,monthly:true,weekly:true,weeklyStyle:'semanal',daily:false,habits:true,goals:false,fin:false,notes:1,notesKind:'pontilhada',tabs:true,links:true,holidays:true,ws:0},st);
  await createProject(`Planner ${y} · exemplo`,{w:148,h:210},pages,true)}
function remapLinks(pg,map){for(const e of pg.els){if(e.link)e.link=map[e.link]||null;if(e.dayLinks)for(const k in e.dayLinks)e.dayLinks[k]=map[e.dayLinks[k]]||null;if(e.monthLinks)for(const k in e.monthLinks)e.monthLinks[k]=map[e.monthLinks[k]]||null;if(e.links)e.links=e.links.map(x=>map[x]||null)}}
async function dupProject(pid){const p=S.projects.find(x=>x.id===pid);if(!p)return;toast('Duplicando…');const pages=await Store.loadPages(pid,p.order||[]);const map={};(p.order||[]).forEach(id=>map[id]=uid('pg'));
  const np=(p.order||[]).filter(id=>pages[id]).map(id=>{const pg=clone(pages[id]);pg.id=map[id];remapLinks(pg,map);return pg});const nid=uid('p');
  const meta=Object.assign(clone(p),{name:p.name+' (cópia)',order:np.map(x=>x.id),createdAt:Date.now(),updatedAt:Date.now()});delete meta.id;
  await pool(np.map(pg=>()=>Store.savePage(nid,pg.id,pg)),4);await Store.saveMeta(nid,meta);loadHome()}
async function delProject(pid){const p=S.projects.find(x=>x.id===pid);try{await Store.delProject(pid,p?p.order||[]:[])}catch(e){toast('Não consegui excluir agora.')}loadHome()}

/* ================= EDITOR: abrir ================= */
async function openProject(pid,fresh){if(!fresh){const p=S.projects.find(x=>x.id===pid);if(!p)return;S.pid=pid;S.meta=clone(p);delete S.meta.id;S.order=(p.order||[]).slice();$('#plist').innerHTML='<p class="hint">Abrindo projeto…</p>';
    try{S.pages=await Store.loadPages(pid,S.order)}catch(e){toast('Não consegui abrir o projeto.');return loadHome()}
    S.order=S.order.filter(id=>S.pages[id]);if(!S.order.length){const pg=blankPage(S.meta.size?.w||148,S.meta.size?.h||210);S.pages[pg.id]=pg;S.order=[pg.id];Saver.page(pg.id);Saver.m()}}
  Object.values(S.pages).forEach(p=>{p.els=p.els||[]});
  S.cur=0;S.sel=[];S.hist=[];S.fut=[];S.zoom=0;S.stripKey='';S.view='editor';
  $('#home').hidden=true;$('#editor').hidden=false;$('#pName').value=S.meta.name;setSave('Salvo neste aparelho');updUndo();renderRail();renderPanel();refreshAll();}
function refreshAll(){renderStrip();renderStage();renderProps();updNav();if(S.tab==='paginas')renderPanel()}
function updNav(){const sp=curSpread();$('#pgInfo').textContent=(sp.length>1?`${sp[0]+1}–${sp[sp.length-1]+1}`:S.cur+1)+'/'+S.order.length;$$('#viewSeg button').forEach(b=>b.classList.toggle('on',b.dataset.v===(S.meta.view||'single')));$('#bZfit').textContent=Math.round(S.k/MM2PX*100)+'%'}
function spreads(){const n=S.order.length,out=[];if(S.meta.view!=='spread'){for(let i=0;i<n;i++)out.push([i]);return out}let i=0;if(S.meta.coverAlone!==false&&n){out.push([0]);i=1}for(;i<n;i+=2)out.push(i+1<n?[i,i+1]:[i]);return out}
function curSpread(){const sp=spreads();return sp.find(s=>s.includes(S.cur))||sp[0]||[0]}
function go(delta){const sp=spreads(),i=Math.max(0,sp.findIndex(s=>s.includes(S.cur))),n=sp[cl(i+delta,0,sp.length-1)];if(!n)return;setCur(n[0])}
function setCur(i,keepSel){if(i===S.cur&&keepSel)return;S.cur=cl(i,0,S.order.length-1);if(!keepSel)S.sel=[];renderStage();renderProps();updNav();markStrip();if(S.tab==='paginas')renderPanel()}

/* ================= EDITOR: palco ================= */
function renderStage(){const st=$('#stage'),ws=$('#ws'),sp=curSpread(),pgs=sp.map(i=>S.pages[S.order[i]]).filter(Boolean);if(!pgs.length){st.innerHTML='';return}
  const aw=Math.max(100,ws.clientWidth-72),ah=Math.max(100,ws.clientHeight-80),tw=pgs.reduce((a,p)=>a+p.w,0),mh=Math.max(...pgs.map(p=>p.h));
  const fit=Math.min(aw/tw,ah/mh);S.k=S.zoom?S.zoom*MM2PX:fit;
  st.className=sp.length>1?'spread':'';st.innerHTML='';
  sp.forEach(idx=>{const id=S.order[idx],p=S.pages[id];if(!p)return;const w=document.createElement('div');w.className='pg'+(idx===S.cur?' on':'');w.dataset.id=id;w.dataset.idx=idx;w.style.width=p.w*S.k+'px';w.style.height=p.h*S.k+'px';
    w.innerHTML=`<span class="lbl">${idx+1}${p.name&&p.name.trim()?' · '+esc(p.name.trim()):''} · ${esc(sizeName(p.w,p.h))}</span><canvas></canvas><div class="ov"><div class="selc"></div></div>`;st.append(w)});
  $('#bZfit').textContent=Math.round(S.k/MM2PX*100)+'%';redraw();drawRulers()}
let rafT=0,rafThumb=false;
function scheduleRedraw(thumbs){if(thumbs)rafThumb=true;if(rafT)return;rafT=requestAnimationFrame(()=>{rafT=0;if(S.view!=='editor'){if(rafThumb&&S.view==='home'){rafThumb=false}return}redraw();if(rafThumb){rafThumb=false;refreshThumbs()}})}
function redraw(){const d=window.devicePixelRatio||1;$$('#stage .pg').forEach(w=>{const p=S.pages[w.dataset.id];if(!p)return;const cv=w.querySelector('canvas'),W=Math.round(p.w*S.k*d),H=Math.round(p.h*S.k*d);
    if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;cv.style.width=p.w*S.k+'px';cv.style.height=p.h*S.k+'px'}const c=cv.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,W,H);drawPage(c,p,S.k*d,0,0,{skip:S.editing});drawOverlay(w,p)})}
function drawOverlay(w,p){const sc=w.querySelector('.selc'),k=S.k;let h=extraOverlay(p,k);
  if(S.guides&&window.Margens&&p.mg&&S.meta.mgOn){const g=Margens.geom(p,p.mg);h+=`<div class="guide" style="left:${g.x0*k}px;top:${g.top*k}px;width:${(g.x1-g.x0)*k}px;height:${(g.bot-g.top)*k}px"></div>`}
  else if(S.guides){const m=Math.max(6,Math.min(p.w,p.h)*.075);h+=`<div class="guide" style="left:${m*k}px;top:${m*k}px;width:${(p.w-2*m)*k}px;height:${(p.h-2*m)*k}px"></div>`}
  const isCur=w.dataset.idx==S.cur;
  if(S.ptEdit&&!S.sel.includes(S.ptEdit))S.ptEdit=null;
  if(isCur){const sel=p.els.filter(e=>S.sel.includes(e.id));sel.forEach(e=>{const single=sel.length===1&&!e.locked&&S.editing!==e.id&&S.ptEdit!==e.id;
    const mnp=Math.min(e.w,e.h)*k,hs=Math.round(cl(mnp*.3,6,11)),bw=mnp<40?1:1.5,wide=e.w*k>=hs*4,tall=e.h*k>=hs*4;
    h+=`<div class="sb${e.locked?' lk':''}" style="--hs:${hs}px;border-width:${bw}px;left:${e.x*k}px;top:${e.y*k}px;width:${e.w*k}px;height:${Math.max(e.h*k,2)}px;transform:rotate(${e.rot||0}deg)">${single?['nw','n','ne','e','se','s','sw','w'].filter(hd=>(hd==='n'||hd==='s')?wide:(hd==='e'||hd==='w')?tall:true).map(hd=>{const [l,t]={nw:[0,0],n:[50,0],ne:[100,0],e:[100,50],se:[100,100],s:[50,100],sw:[0,100],w:[0,50]}[hd];return `<i class="hd" data-h="${hd}" style="left:calc(${l}% - ${hs/2}px);top:calc(${t}% - ${hs/2}px);cursor:${hd}-resize"></i>`}).join('')+`<i class="hd rot" data-h="rot" style="cursor:grab;top:${-Math.round(hs+12)}px"></i>`:''}</div>`});
    if(sel.length>1){const B=bb(sel);h+=`<div class="sb gb" style="left:${B.x*k}px;top:${B.y*k}px;width:${B.w*k}px;height:${B.h*k}px">${[['nw',0,0],['ne',100,0],['se',100,100],['sw',0,100]].map(([hd,l,t])=>`<i class="hd" data-h="${hd}" style="left:calc(${l}% - 6px);top:calc(${t}% - 6px);cursor:${hd}-resize"></i>`).join('')}${sel.some(e=>e.g)?'<span class="gtag">grupo</span>':''}</div>`}
    if(D&&D.mode==='marq'&&D.moved&&D.p===p){const r=D.r;h+=`<div class="marq" style="left:${r.x*k}px;top:${r.y*k}px;width:${r.w*k}px;height:${r.h*k}px"></div>`}
    if(D&&D.guides)D.guides.forEach(g=>{h+=g.v?`<div class="snapl" style="left:${g.v*k}px;top:0;width:1px;height:100%"></div>`:`<div class="snapl" style="top:${g.h*k}px;left:0;height:1px;width:100%"></div>`})}
  if(isCur&&S.ptEdit){const e=p.els.find(x=>x.id===S.ptEdit);if(e&&e.pts)e.pts.forEach(([u,v],i)=>{const q=ptToPage(e,u,v);h+=`<i class="vh" data-v="${i}" style="left:${q.x*k}px;top:${q.y*k}px" title="Arraste para mover · dois cliques remove"></i>`})}
  const t=S.tool;if(t&&t.pid===p.id&&t.pts.length){const pts=t.pts.map(q=>(q[0]*k).toFixed(1)+','+(q[1]*k).toFixed(1));if(t.kind!=='free'&&t.hover)pts.push((t.hover.x*k).toFixed(1)+','+(t.hover.y*k).toFixed(1));
    h+=`<svg style="position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none"><polyline points="${pts.join(' ')}" fill="none" stroke="#E7A6BE" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${t.kind!=='free'?t.pts.map((q,i)=>`<circle cx="${q[0]*k}" cy="${q[1]*k}" r="${i===0&&t.pts.length>=3?7:4}" fill="#fff" stroke="#9168A0" stroke-width="1.5"/>`).join(''):''}</svg>`}
  sc.innerHTML=h}
function ptToPage(e,u,v){const a=(e.rot||0)*Math.PI/180,lx=u*e.w-e.w/2,ly=v*e.h-e.h/2;return{x:e.x+e.w/2+lx*Math.cos(a)-ly*Math.sin(a),y:e.y+e.h/2+lx*Math.sin(a)+ly*Math.cos(a)}}
function pageToPt(e,x,y){const a=-(e.rot||0)*Math.PI/180,dx=x-(e.x+e.w/2),dy=y-(e.y+e.h/2),lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);return[(lx+e.w/2)/e.w,(ly+e.h/2)/e.h]}
const r4=v=>Math.round(v*10000)/10000;
function renorm(e){const L=e.pts.map(([u,v])=>[u*e.w,v*e.h]),xs=L.map(q=>q[0]),ys=L.map(q=>q[1]),mnx=Math.min(...xs),mxx=Math.max(...xs),mny=Math.min(...ys),mxy=Math.max(...ys),nw=Math.max(mxx-mnx,.5),nh=Math.max(mxy-mny,.5);
  const ox=(mnx+mxx)/2-e.w/2,oy=(mny+mxy)/2-e.h/2,a=(e.rot||0)*Math.PI/180,cx=e.x+e.w/2+ox*Math.cos(a)-oy*Math.sin(a),cy=e.y+e.h/2+ox*Math.sin(a)+oy*Math.cos(a);
  e.pts=L.map(([x,y])=>[r4((x-mnx)/nw),r4((y-mny)/nh)]);e.w=nw;e.h=nh;e.x=cx-nw/2;e.y=cy-nh/2}
function segD(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy;if(!L)return Math.hypot(p[0]-a[0],p[1]-a[1]);const t=cl(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L,0,1);return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
function rdp(P,eps){if(P.length<3)return P;const a=P[0],b=P[P.length-1];let mi=0,md=0;for(let i=1;i<P.length-1;i++){const d=segD(P[i],a,b);if(d>md){md=d;mi=i}}if(md>eps){const l=rdp(P.slice(0,mi+1),eps),r=rdp(P.slice(mi),eps);return l.slice(0,-1).concat(r)}return[a,b]}
function pathEl(pts,closed,smooth,st){const xs=pts.map(q=>q[0]),ys=pts.map(q=>q[1]),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(Math.max(...xs)-x,.5),h=Math.max(Math.max(...ys)-y,.5);
  return E('path',x,y,w,h,{pts:pts.map(q=>[r4((q[0]-x)/w),r4((q[1]-y)/h)]),closed,smooth,fill:closed?st.pal.soft:'none',stroke:st.pal.ink,sw:.4})}
const TOOLTXT={free:'Desenhe arrastando na página. Feche perto do início para virar forma.',poly:'Clique para cada ponto. Clique no primeiro ponto para fechar ou dê dois cliques para terminar aberto.',curve:'Clique para cada ponto da curva. Clique no primeiro ponto para fechar ou dê dois cliques para terminar.'};
function startTool(kind){S.tool={kind,pts:[],pid:null,hover:null};S.sel=[];S.ptEdit=null;closeMob();renderToolHint();redraw();renderProps()}
function stopTool(){S.tool=null;renderToolHint();redraw()}
function renderToolHint(){const hb=$('#toolHint');$('#ws').classList.toggle('tooling',!!S.tool);if(!S.tool){hb.hidden=true;return}hb.hidden=false;
  hb.innerHTML=`<span>${TOOLTXT[S.tool.kind]}</span>${S.tool.kind!=='free'?'<button class="btn sm" id="thDone">Terminar</button>':''}<button class="btn sm pri" id="thExit">Concluir</button>`;
  const d=$('#thDone');if(d)d.onclick=()=>finishTool(false);$('#thExit').onclick=()=>{if(S.tool&&S.tool.pts.length>1&&S.tool.kind!=='free')finishTool(false);stopTool()}}
function finishTool(closed){const t=S.tool;if(!t)return;let pts=t.pts.filter((q,i,a)=>i===0||Math.hypot(q[0]-a[i-1][0],q[1]-a[i-1][1])>.4);t.pts=[];t.hover=null;
  if(t.kind==='free'){pts=rdp(pts,.3);if(closed===undefined)closed=pts.length>3&&Math.hypot(pts[0][0]-pts[pts.length-1][0],pts[0][1]-pts[pts.length-1][1])<4;if(closed&&pts.length>3)pts.pop()}
  const p=S.pages[t.pid];if(pts.length>=2&&p){const e=pathEl(pts,!!closed&&pts.length>=3,t.kind!=='poly',styleOf());change([p.id],()=>p.els.push(e));S.sel=[e.id];thumbRefresh(p.id)}
  if(t.kind!=='free')S.tool=null;renderToolHint();redraw();renderProps()}

/* interação */
let D=null;
function toMM(ev,w){const r=w.getBoundingClientRect();return{x:(ev.clientX-r.left)/S.k,y:(ev.clientY-r.top)/S.k}}
/* ---- grupos: elementos com o mesmo e.g se comportam como um só ---- */
function gx(p,ids){const gs=new Set(p.els.filter(e=>ids.includes(e.id)&&e.g).map(e=>e.g));return gs.size?[...new Set([...ids,...p.els.filter(e=>gs.has(e.g)).map(e=>e.id)])]:ids}
const ALN={al:'Alinhar à esquerda',ac:'Centralizar na horizontal',ar:'Alinhar à direita',at:'Alinhar no topo',am:'Centralizar na vertical',ab:'Alinhar embaixo'};
function groupSel(){const p=curPage(),els=selEls();if(els.length<2){toast('Selecione 2 ou mais elementos para agrupar.');return}
  const g=uid('g');change([p.id],()=>els.forEach(e=>{e.g=g}));redraw();renderProps();toast('Agrupado: agora eles se movem e mudam de tamanho juntos. 🌸')}
function ungroupSel(){const p=curPage(),els=selEls().filter(e=>e.g);if(!els.length)return;change([p.id],()=>els.forEach(e=>{delete e.g}));redraw();renderProps();toast('Grupo desfeito.')}
function regroup(cp){const m={};cp.forEach(e=>{if(e.g)e.g=m[e.g]||(m[e.g]=uid('g'))});return cp}
function scaleEl(e,s){e.size!==undefined&&(e.size=r1((e.size||9)*s));if(e.sp)e.sp=r1(e.sp*s);if(e.sw)e.sw=Math.round(e.sw*s*100)/100}
function hit(p,pt){for(let i=p.els.length-1;i>=0;i--){const e=p.els[i],cx=e.x+e.w/2,cy=e.y+e.h/2,a=-(e.rot||0)*Math.PI/180,dx=pt.x-cx,dy=pt.y-cy,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a),hw=Math.max(e.w/2,1.5),hh=Math.max(e.h/2,1.5);
  if(Math.abs(lx)<=hw&&Math.abs(ly)<=hh)return e}return null}
$('#stage').addEventListener('pointerdown',ev=>{const w=ev.target.closest('.pg');if(!w||ev.button>0)return;if(ev.target.classList.contains('tedit'))return;
  const idx=+w.dataset.idx;if(idx!==S.cur){S.cur=idx;S.sel=[];$$('#stage .pg').forEach(x=>x.classList.toggle('on',x===w));updNav();markStrip();if(S.tab==='paginas')renderPanel()}
  const p=S.pages[w.dataset.id],pt=toMM(ev,w),hd=ev.target.dataset.h;
  if(S.tool){ev.preventDefault();const t=S.tool;if(t.pid&&t.pid!==p.id&&t.pts.length)return;t.pid=p.id;
    if(t.kind==='free'){t.pts=[[pt.x,pt.y]];t.drawing=true;w.setPointerCapture(ev.pointerId)}
    else{if(t.pts.length>=3&&Math.hypot(pt.x-t.pts[0][0],pt.y-t.pts[0][1])*S.k<10){finishTool(true);return}t.pts.push([pt.x,pt.y])}
    drawOverlaysOnly();return}
  if(ev.target.dataset.v!==undefined&&S.ptEdit){const e=p.els.find(x=>x.id===S.ptEdit);if(e){D={mode:'vtx',w,p,e,i:+ev.target.dataset.v,pt,b:snapOf([p.id]),moved:false};w.setPointerCapture(ev.pointerId);return}}
  if(hd&&S.sel.length>1&&hd!=='rot'){const ms=p.els.filter(x=>S.sel.includes(x.id)&&!x.locked);if(ms.length){const B=bb(ms);D={mode:'gres',h:hd,w,p,pt,ms,B,o:Object.fromEntries(ms.map(x=>[x.id,{x:x.x,y:x.y,w:x.w,h:x.h,size:x.size,sp:x.sp,sw:x.sw}])),b:snapOf([p.id]),moved:false}}}
  else if(hd&&S.sel.length===1){const e=p.els.find(x=>x.id===S.sel[0]);D={mode:hd==='rot'?'rot':'res',h:hd,w,p,pt,e,o:{x:e.x,y:e.y,w:e.w,h:e.h,rot:e.rot||0},b:snapOf([p.id]),moved:false}}
  else{const e=hit(p,pt);if(e){if(ev.shiftKey){const ids=gx(p,[e.id]);S.sel=S.sel.includes(e.id)?S.sel.filter(x=>!ids.includes(x)):[...new Set([...S.sel,...ids])]}else if(!S.sel.includes(e.id))S.sel=gx(p,[e.id]);
      const ms=p.els.filter(x=>S.sel.includes(x.id)&&!x.locked);D={mode:'move',w,p,pt,ms,o:Object.fromEntries(ms.map(x=>[x.id,{x:x.x,y:x.y}])),b:snapOf([p.id]),moved:false}}
    else{const keep=ev.shiftKey?S.sel.slice():[];S.sel=keep;D={mode:'marq',w,p,pt,keep,r:{x:pt.x,y:pt.y,w:0,h:0},moved:false}}}
  w.setPointerCapture(ev.pointerId);redraw();renderProps()});
$('#stage').addEventListener('pointermove',ev=>{if(S.tool){const w=ev.target.closest('.pg');const t=S.tool;if(!w||(t.pid&&w.dataset.id!==t.pid))return;const pt=toMM(ev,w);
    if(t.kind==='free'){if(t.drawing){const l=t.pts[t.pts.length-1];if(Math.hypot(pt.x-l[0],pt.y-l[1])>.35){t.pts.push([pt.x,pt.y]);drawOverlaysOnly()}}}else if(t.pts.length){t.hover=pt;drawOverlaysOnly()}return}
  if(!D)return;const pt=toMM(ev,D.w),dx=pt.x-D.pt.x,dy=pt.y-D.pt.y;if(!D.moved&&Math.hypot(dx,dy)*S.k<3)return;D.moved=true;
  if(D.mode==='vtx'){D.e.pts[D.i]=pageToPt(D.e,pt.x,pt.y);scheduleRedraw();return}
  if(D.mode==='move'){let ddx=dx,ddy=dy;D.guides=[];if(!ev.altKey&&D.ms.length){const bx=bb(D.ms.map(e=>({x:D.o[e.id].x+dx,y:D.o[e.id].y+dy,w:e.w,h:e.h})));const th=6/S.k;
      const xs=[0,D.p.w/2,D.p.w],ys=[0,D.p.h/2,D.p.h];const m=Math.max(6,Math.min(D.p.w,D.p.h)*.075);if(!(window.Margens&&D.p.mg&&S.meta.mgOn)){xs.push(m,D.p.w-m);ys.push(m,D.p.h-m)}if(window.Margens){const L=Margens.snapLines(D.p);xs.push(...L.xs);ys.push(...L.ys)}(D.p.guides||[]).forEach(g=>{if(g.v!==undefined)xs.push(g.v);else ys.push(g.h)});
      D.p.els.forEach(o=>{if(S.sel.includes(o.id))return;xs.push(o.x,o.x+o.w/2,o.x+o.w);ys.push(o.y,o.y+o.h/2,o.y+o.h)});
      let best=null;for(const c of [bx.x,bx.x+bx.w/2,bx.x+bx.w])for(const t of xs){const df=t-c;if(Math.abs(df)<th&&(!best||Math.abs(df)<Math.abs(best.d)))best={d:df,t}}if(best){ddx+=best.d;D.guides.push({v:best.t})}
      best=null;for(const c of [bx.y,bx.y+bx.h/2,bx.y+bx.h])for(const t of ys){const df=t-c;if(Math.abs(df)<th&&(!best||Math.abs(df)<Math.abs(best.d)))best={d:df,t}}if(best){ddy+=best.d;D.guides.push({h:best.t})}}
    if(Pref.snap&&!ev.altKey&&D.ms.length){const b0=bb(D.ms.map(e=>({x:D.o[e.id].x+ddx,y:D.o[e.id].y+ddy,w:e.w,h:e.h})));
      if(!D.guides.some(g=>g.v!==undefined))ddx+=Math.round(b0.x/Pref.step)*Pref.step-b0.x;if(!D.guides.some(g=>g.h!==undefined))ddy+=Math.round(b0.y/Pref.step)*Pref.step-b0.y}
    D.ms.forEach(e=>{e.x=r1(D.o[e.id].x+ddx);e.y=r1(D.o[e.id].y+ddy)})}
  else if(D.mode==='marq'){const x=Math.min(pt.x,D.pt.x),y=Math.min(pt.y,D.pt.y);D.r={x,y,w:Math.abs(dx),h:Math.abs(dy)};
    const ids=D.p.els.filter(e=>e.x<D.r.x+D.r.w&&e.x+e.w>D.r.x&&e.y<D.r.y+D.r.h&&e.y+e.h>D.r.y).map(e=>e.id);S.sel=[...new Set([...D.keep,...gx(D.p,ids)])];scheduleRedraw();return}
  else if(D.mode==='gres'){const B=D.B,L=D.h.includes('w'),T=D.h.includes('n'),ax=L?B.x+B.w:B.x,ay=T?B.y+B.h:B.y;
    let sc=Math.max(Math.abs(pt.x-ax)/B.w,Math.abs(pt.y-ay)/B.h);sc=Math.max(.05,sc);
    D.ms.forEach(e=>{const o=D.o[e.id];e.x=r1(ax+(o.x-ax)*sc);e.y=r1(ay+(o.y-ay)*sc);e.w=Math.max(.5,r1(o.w*sc));e.h=Math.max(.3,r1(o.h*sc));
      if(o.size!==undefined)e.size=r1((o.size||9)*sc);if(o.sp)e.sp=r1(o.sp*sc);if(o.sw)e.sw=Math.round(o.sw*sc*100)/100})}
  else if(D.mode==='res'){const e=D.e,o=D.o,a=o.rot*Math.PI/180,lx=dx*Math.cos(-a)-dy*Math.sin(-a),ly=dx*Math.sin(-a)+dy*Math.cos(-a);
    const dir={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0],ne:[1,-1],nw:[-1,-1],se:[1,1],sw:[-1,1]}[D.h];let nw=Math.max(1,o.w+dir[0]*lx),nh=Math.max(.5,o.h+dir[1]*ly);
    const keep=(dir[0]&&dir[1])&&((e.type==='image'||e.type==='shape')!==ev.shiftKey);if(keep){const s=Math.max(nw/o.w,nh/o.h);nw=o.w*s;nh=o.h*s}
    if(!dir[0])nw=o.w;if(!dir[1])nh=o.h;const sx=(nw-o.w)/2*dir[0],sy=(nh-o.h)/2*dir[1],cx=o.x+o.w/2+sx*Math.cos(a)-sy*Math.sin(a),cy=o.y+o.h/2+sx*Math.sin(a)+sy*Math.cos(a);
    e.w=r1(nw);e.h=r1(nh);e.x=r1(cx-nw/2);e.y=r1(cy-nh/2)}
  else if(D.mode==='rot'){const e=D.e,cx=e.x+e.w/2,cy=e.y+e.h/2;let an=Math.atan2(pt.y-cy,pt.x-cx)*180/Math.PI+90;an=((an%360)+360)%360;if(ev.shiftKey)an=Math.round(an/15)*15;else{const n=Math.round(an/90)*90;if(Math.abs(an-n)<3)an=n}e.rot=Math.round(an%360)}
  scheduleRedraw();updGeom()});
const bb=a=>{const x=Math.min(...a.map(e=>e.x)),y=Math.min(...a.map(e=>e.y));return{x,y,w:Math.max(...a.map(e=>e.x+e.w))-x,h:Math.max(...a.map(e=>e.y+e.h))-y}};
function endDrag(){if(S.tool&&S.tool.kind==='free'&&S.tool.drawing){S.tool.drawing=false;finishTool(undefined);return}
  if(!D)return;const d=D;D=null;if(d.mode==='vtx'&&d.moved)renorm(d.e);if(d.moved&&d.mode!=='marq'){pushHist(d.b,snapOf([d.p.id]));thumbRefresh(d.p.id)}redraw();renderProps()}
$('#stage').addEventListener('pointerup',endDrag);$('#stage').addEventListener('pointercancel',endDrag);
$('#stage').addEventListener('dblclick',ev=>{const w=ev.target.closest('.pg');if(!w)return;
  if(S.tool){if(S.tool.kind!=='free'){S.tool.pts=S.tool.pts.filter((q,i,a)=>i===0||Math.hypot(q[0]-a[i-1][0],q[1]-a[i-1][1])>1);finishTool(false)}return}
  if(S.ptEdit){const p=S.pages[w.dataset.id],e=p.els.find(x=>x.id===S.ptEdit);if(!e)return;const b=snapOf([p.id]);
    if(ev.target.dataset.v!==undefined){const i=+ev.target.dataset.v;if(e.pts.length<=(e.closed?3:2)){toast('A forma precisa de pelo menos '+(e.closed?3:2)+' pontos.');return}e.pts.splice(i,1)}
    else{const pt=toMM(ev,w),q=pageToPt(e,pt.x,pt.y),L=e.pts.map(([u,v])=>[u*e.w,v*e.h]),ql=[q[0]*e.w,q[1]*e.h];let bi=0,bd=1e9;const n=e.closed?L.length:L.length-1;for(let i=0;i<n;i++){const d=segD(ql,L[i],L[(i+1)%L.length]);if(d<bd){bd=d;bi=i}}if(bd>6)return;e.pts.splice(bi+1,0,q)}
    renorm(e);pushHist(b,snapOf([p.id]));redraw();renderProps();thumbRefresh(p.id);return}const p=S.pages[w.dataset.id],e=hit(p,toMM(ev,w));if(e&&e.type==='text'&&!e.locked)startEdit(w,p,e)});
$('#ws').addEventListener('pointerdown',ev=>{if(ev.target===$('#ws')||ev.target===$('#stage')){if(S.sel.length){S.sel=[];redraw();renderProps()}}});
$('#ws').addEventListener('wheel',ev=>{if(!(ev.ctrlKey||ev.metaKey))return;ev.preventDefault();setZoom((S.k/MM2PX)*(ev.deltaY<0?1.1:1/1.1))},{passive:false});
function setZoom(z){S.zoom=cl(z,.15,6);renderStage();updNav()}
function startEdit(w,p,e){S.editing=e.id;const ta=document.createElement('textarea');ta.className='tedit';const k=S.k;
  Object.assign(ta.style,{left:e.x*k+'px',top:e.y*k+'px',width:e.w*k+'px',height:Math.max(e.h*k,e.size*PT*k*1.4)+'px',transform:`rotate(${e.rot||0}deg)`,fontFamily:`"${e.font}", Nunito, sans-serif`,fontSize:e.size*PT*k+'px',fontWeight:e.weight,fontStyle:e.italic?'italic':'normal',color:e.color,textAlign:e.align,lineHeight:e.lh,letterSpacing:(e.ls||0)+'em'});
  ta.value=e.text;const b=snapOf([p.id]);w.querySelector('.ov').append(ta);ta.focus();ta.select();
  ta.oninput=()=>{e.text=ta.value};ta.onkeydown=ev=>{ev.stopPropagation();if(ev.key==='Escape')ta.blur()};ta.onpointerdown=ev=>ev.stopPropagation();
  ta.onblur=()=>{S.editing=null;ta.remove();pushHist(b,snapOf([p.id]));redraw();renderProps();thumbRefresh(p.id)};redraw()}

/* ================= tira de páginas ================= */
let io;
function renderStrip(){const key=S.order.join(',');const st=$('#strip');if(key!==S.stripKey){S.stripKey=key;if(io)io.disconnect();
  st.innerHTML=S.order.map((id,i)=>`<button class="tb" data-i="${i}" data-id="${id}" title="${esc((S.pages[id]||{}).name||'')}"><canvas width="1" height="1"></canvas><span>${i+1}</span></button>`).join('')+'<button class="addp" id="stripAdd" title="Adicionar página" aria-label="Adicionar página">+</button>';
  io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){const b=en.target;if(!b.dataset.d){b.dataset.d=1;drawStripThumb(b)}}}),{root:st,rootMargin:'200px'});
  $$('.tb',st).forEach(b=>{io.observe(b);b.onclick=()=>setCur(+b.dataset.i)});$('#stripAdd').onclick=()=>addPage()}
  markStrip()}
function drawStripThumb(b){const p=S.pages[b.dataset.id];if(!p)return;const cv=b.querySelector('canvas'),h=64,k=h/p.h,d=window.devicePixelRatio||1;cv.width=Math.round(p.w*k*d);cv.height=Math.round(h*d);cv.style.width=p.w*k+'px';cv.style.height=h+'px';drawPage(cv.getContext('2d'),p,k*d)}
function markStrip(){const sp=curSpread();$$('#strip .tb').forEach(b=>{const i=+b.dataset.i;b.classList.toggle('on',i===S.cur);b.classList.toggle('vis',sp.includes(i))});const on=$('#strip .tb.on');if(on)on.scrollIntoView({block:'nearest',inline:'nearest'})}
function thumbRefresh(id){const b=$(`#strip .tb[data-id="${id}"]`);if(b&&b.dataset.d)drawStripThumb(b)}
function refreshThumbs(){$$('#strip .tb').forEach(b=>{if(b.dataset.d)drawStripThumb(b)})}

/* ================= operações de página ================= */
function addPage(w,h,after=S.cur){const ref=curPage()||{w:148,h:210};const pg=blankPage(w||ref.w,h||ref.h);change([],()=>{S.pages[pg.id]=pg;S.order.splice(after+1,0,pg.id)});S.cur=after+1;S.sel=[];refreshAll();return pg}
function dupPage(i){const src=S.pages[S.order[i]];const pg=clone(src);pg.id=uid('pg');pg.els.forEach(e=>e.id=uid('e'));change([],()=>{S.pages[pg.id]=pg;S.order.splice(i+1,0,pg.id)});S.cur=i+1;refreshAll()}
function delPage(i){if(S.order.length<=1){toast('O projeto precisa de pelo menos uma página.');return}change([],()=>{S.order.splice(i,1)});S.sel=[];refreshAll()}
function movePage(i,d){const j=i+d;if(j<0||j>=S.order.length)return;change([],()=>{const [x]=S.order.splice(i,1);S.order.splice(j,0,x)});if(S.cur===i)S.cur=j;refreshAll()}
function resizePage(ids,w,h,scale){change(ids,()=>{ids.forEach(id=>{const p=S.pages[id];if(scale){const fx=w/p.w,fy=h/p.h,fm=Math.min(fx,fy);p.els.forEach(e=>{e.x=r1(e.x*fx);e.y=r1(e.y*fy);e.w=r1(e.w*fx);e.h=r1(e.h*fy);if(e.type==='text'||e.type==='table'||e.type==='divider')e.size=r1((e.size||9)*fm);if(e.sp)e.sp=r1(e.sp*fm)});if(p.mg){['top','bottom','hdr','ftr'].forEach(k=>p.mg[k]=r1((p.mg[k]||0)*fy));['inner','outer','gutter'].forEach(k=>p.mg[k]=r1((p.mg[k]||0)*fx))}}p.w=w;p.h=h})});refreshAll()}

/* ================= elementos ================= */
function addEl(e,keepPos){const p=curPage();if(!keepPos){e.x=r1((p.w-e.w)/2);e.y=r1((p.h-e.h)/2)}change([p.id],()=>p.els.push(e));S.sel=[e.id];redraw();renderProps();thumbRefresh(p.id);closeMob()}
function selEls(){const p=curPage();return p?p.els.filter(e=>S.sel.includes(e.id)):[]}
function delSel(){const p=curPage();if(!S.sel.length)return;change([p.id],()=>{p.els=p.els.filter(e=>!S.sel.includes(e.id)||e.locked)});S.sel=[];redraw();renderProps();thumbRefresh(p.id)}
function dupSel(){const p=curPage(),cp=selEls().map(e=>Object.assign(clone(e),{id:uid('e'),x:e.x+4,y:e.y+4,locked:false}));regroup(cp);if(!cp.length)return;change([p.id],()=>p.els.push(...cp));S.sel=cp.map(e=>e.id);redraw();renderProps();thumbRefresh(p.id)}
function orderSel(mode){const p=curPage(),ids=S.sel;if(!ids.length)return;change([p.id],()=>{const s=p.els.filter(e=>ids.includes(e.id)),r=p.els.filter(e=>!ids.includes(e.id));
  if(mode==='front')p.els=[...r,...s];else if(mode==='back')p.els=[...s,...r];else{const i=p.els.findIndex(e=>e.id===ids[0]),j=cl(i+(mode==='up'?1:-1),0,p.els.length-1);const [x]=p.els.splice(i,1);p.els.splice(j,0,x)}});redraw();thumbRefresh(p.id)}
function alignSel(a){const p=curPage(),els=selEls();if(!els.length)return;const one=els.every(e=>e.g&&e.g===els[0].g),ref=els.length>1&&!one?bb(els):{x:0,y:0,w:p.w,h:p.h};
  const B=bb(els),mv=a==='al'?ref.x-B.x:a==='ac'?ref.x+ref.w/2-(B.x+B.w/2):a==='ar'?ref.x+ref.w-(B.x+B.w):0,mw=a==='at'?ref.y-B.y:a==='am'?ref.y+ref.h/2-(B.y+B.h/2):a==='ab'?ref.y+ref.h-(B.y+B.h):0;
  if(one&&els.length>1){change([p.id],()=>els.forEach(e=>{if(!e.locked){e.x=r1(e.x+mv);e.y=r1(e.y+mw)}}));redraw();renderProps();thumbRefresh(p.id);return}
  change([p.id],()=>els.forEach(e=>{if(e.locked)return;if(a==='al')e.x=r1(ref.x);if(a==='ac')e.x=r1(ref.x+ref.w/2-e.w/2);if(a==='ar')e.x=r1(ref.x+ref.w-e.w);if(a==='at')e.y=r1(ref.y);if(a==='am')e.y=r1(ref.y+ref.h/2-e.h/2);if(a==='ab')e.y=r1(ref.y+ref.h-e.h)}));redraw();renderProps();thumbRefresh(p.id)}

/* ================= trilho e painéis ================= */
const TABS=[['paginas','Páginas'],['modelos','Modelos'],['datado','Datado'],['widgets','Widgets'],['adesivos','Adesivos'],['bordas','Bordas'],['texto','Texto'],['biblioteca','Uploads'],['app','App']];
function renderRail(){$('#rail').innerHTML=TABS.map(([k,n])=>`<button data-tab="${k}" class="${S.tab===k?'on':''}" aria-label="${n}">${ico(k)}${n}</button>`).join('');
  $$('#rail button').forEach(b=>b.onclick=()=>{const ed=$('#editor');if(S.tab===b.dataset.tab&&(innerWidth<=980||ed.classList.contains('compact'))){ed.classList.toggle('showpanel')}else{S.tab=b.dataset.tab;ed.classList.add('showpanel');renderRail();renderPanel()}})}
function closeMob(){if(innerWidth<=980||$('#editor').classList.contains('compact')){$('#editor').classList.remove('showpanel')}}
function renderPanel(){const P=$('#panel');const fn=PANELS[S.tab];S.panelRepaint=null;P.innerHTML=fn?fn.html():'';if(fn&&fn.mount)fn.mount(P)}
const fontList=()=>[...FONTS.map(f=>f[0]),...S.lib.filter(x=>x.kind==='font').map(x=>x.family)];
function tplRef(){if(!S.tplRef){const n=new Date();S.tplRef={y:n.getFullYear(),m:n.getMonth()}}return S.tplRef}
function tplData(){const r=tplRef(),ws=styleOf().ws,d=new Date(r.y,r.m,1);const now=new Date();const day=(now.getFullYear()===r.y&&now.getMonth()===r.m)?now:d;return{y:r.y,m:r.m,date:day,start:weekStartOf(day,ws),holidays:true}}
function previewCanvas(cv,out,W,H,bw,bh){const k=Math.min(bw/W,bh/H),d=window.devicePixelRatio||1;cv.width=Math.round(W*k*d);cv.height=Math.round(H*k*d);cv.style.width=W*k+'px';cv.style.height=H*k+'px';drawPage(cv.getContext('2d'),{w:W,h:H,bg:out.bg||'#FFFFFF',els:out.els},k*d)}
function applyTpl(out,name,mode){const p=curPage();if(mode==='replace'){change([p.id],()=>{p.els=out.els;p.bg=out.bg||'#FFFFFF';p.name=name});S.sel=[];redraw();renderProps();thumbRefresh(p.id)}
  else{const pg=blankPage(p.w,p.h);pg.els=out.els;pg.bg=out.bg||'#FFFFFF';pg.name=name;change([],()=>{S.pages[pg.id]=pg;S.order.splice(S.cur+1,0,pg.id)});S.cur++;S.sel=[];refreshAll()}closeMob()}
function styleControls(){const st=S.meta.style||{};return `<div class="pfield"><span>Paleta</span><div class="chips">${Object.entries(PALS).map(([k,p])=>`<button class="chip${(st.pal||'lavanda')===k?' on':''}" data-pal="${k}"><i style="background:linear-gradient(135deg,${p.a} 50%,${p.b} 50%)"></i>${p.nome}</button>`).join('')}</div></div>
  <label class="f">Fontes dos modelos<select id="pairSel">${Object.entries(PAIRS).map(([k,p])=>`<option value="${k}"${(st.pair||'assinatura')===k?' selected':''}>${p.nome} · ${p.script} + ${p.title}</option>`).join('')}</select></label>`}
function mountStyle(P,after){$$('[data-pal]',P).forEach(b=>b.onclick=()=>{S.meta.style=Object.assign({},S.meta.style,{pal:b.dataset.pal});Saver.m();after()});const ps=$('#pairSel',P);if(ps)ps.onchange=()=>{S.meta.style=Object.assign({},S.meta.style,{pair:ps.value});Saver.m();after()}}
const PANELS={
 modelos:{html(){const r=tplRef(),user=S.lib.filter(x=>x.kind==='template');return `<h2>Modelos de miolo</h2>${styleControls()}
   <div class="fgrid"><label class="f">Mês de referência<select id="tRefM">${MESES.map((m,i)=>`<option value="${i}"${i===r.m?' selected':''}>${cap(m)}</option>`).join('')}</select></label><label class="f">Ano<input type="number" id="tRefY" value="${r.y}" min="1900" max="2200"></label></div>
   <p class="hint">Os modelos se ajustam ao tamanho da página atual (${esc(sizeName(curPage().w,curPage().h))}).</p>
   ${user.length?`<h3>MEUS MODELOS</h3><div class="tgrid">${user.map(t=>`<div class="tcard"><div class="pv"><canvas data-ut="${t.id}"></canvas></div><div class="tn">${esc(t.name)}</div><div class="ta"><button data-uadd="${t.id}">+ página</button><button data-urep="${t.id}">substituir</button></div></div>`).join('')}</div>`:''}
   ${TPL_CATS.map(c=>`<h3>${c.toUpperCase()}</h3><div class="tgrid">${Object.entries(TPL).filter(([,t])=>t.cat===c).map(([k,t])=>`<div class="tcard"><div class="pv"><canvas data-tp="${k}"></canvas></div><div class="tn">${t.nome}</div><div class="ta"><button data-add="${k}">+ página</button><button data-rep="${k}">substituir</button></div></div>`).join('')}</div>`).join('')}`},
  mount(P){const p=curPage(),st=styleOf(),d=tplData();
   const paint=()=>{$$('[data-tp]',P).forEach(cv=>{const out=TPL[cv.dataset.tp].fn(p.w,p.h,st,d);previewCanvas(cv,out,p.w,p.h,120,104)});
   $$('[data-ut]',P).forEach(cv=>{const t=S.lib.find(x=>x.id===cv.dataset.ut);if(t){const o=userTplOut(t,p);previewCanvas(cv,o,p.w,p.h,120,104)}})};paint();S.panelRepaint=paint;
   const mk=k=>{const out=TPL[k].fn(p.w,p.h,st,tplData());const dd=tplData();let nm=TPL[k].nome;if(['mensal','habitos','separador','metas','financas'].includes(k))nm+=' · '+MES3[dd.m]+' '+dd.y;return[out,nm]};
   $$('[data-add]',P).forEach(b=>b.onclick=()=>{const [o,n]=mk(b.dataset.add);applyTpl(o,n,'add')});$$('[data-rep]',P).forEach(b=>b.onclick=()=>{const [o,n]=mk(b.dataset.rep);applyTpl(o,n,'replace')});
   $$('[data-uadd]',P).forEach(b=>b.onclick=()=>{const t=S.lib.find(x=>x.id===b.dataset.uadd);applyTpl(userTplOut(t,curPage()),t.name,'add')});$$('[data-urep]',P).forEach(b=>b.onclick=()=>{const t=S.lib.find(x=>x.id===b.dataset.urep);applyTpl(userTplOut(t,curPage()),t.name,'replace')});
   $('#tRefM',P).onchange=e=>{tplRef().m=+e.target.value;renderPanel()};$('#tRefY',P).onchange=e=>{tplRef().y=+e.target.value||new Date().getFullYear();renderPanel()};
   mountStyle(P,renderPanel)}},
 datado:{html(){const o=genOpt();return `<h2>Planner datado</h2><p class="hint">Gera todas as páginas com datas, feriados nacionais e links entre calendário, semanas e dias, prontos para imprimir ou usar no GoodNotes.</p>
   <div class="fgrid"><label class="f">Começa em<select data-g="m">${MESES.map((m,i)=>`<option value="${i}"${i===o.m?' selected':''}>${cap(m)}</option>`).join('')}</select></label><label class="f">Ano<input type="number" data-g="y" value="${o.y}" min="1900" max="2200"></label>
   <label class="f">Quantos meses<input type="number" data-g="months" value="${o.months}" min="1" max="24"></label><label class="f">Semana começa<select data-g="ws"><option value="0"${o.ws===0?' selected':''}>Domingo</option><option value="1"${o.ws===1?' selected':''}>Segunda</option></select></label>
   <label class="f full">Tamanho do miolo<select data-g="sizeName">${sizeOptions(o.sizeName)}</select></label>
   <label class="f full">Título da capa<input type="text" data-g="title" value="${esc(o.title)}"></label></div>
   <div class="pgrp"><h3>PÁGINAS</h3>
   <label class="chk"><input type="checkbox" data-g="cover"${o.cover?' checked':''}> Capa</label>
   ${o.cover?`<label class="f">Tamanho da capa<select data-g="coverName">${sizeOptions(o.coverName).replace('<option value="custom"','<option disabled value="x"')}</select></label>`:''}
   <label class="chk"><input type="checkbox" data-g="annual"${o.annual?' checked':''}> Calendário anual</label>
   <label class="chk"><input type="checkbox" data-g="sep"${o.sep?' checked':''}> Separador de cada mês</label>
   <label class="chk"><input type="checkbox" data-g="monthly"${o.monthly?' checked':''}> Mensal</label>
   <label class="chk"><input type="checkbox" data-g="weekly"${o.weekly?' checked':''}> Semanal</label>
   ${o.weekly?`<label class="f">Estilo do semanal<select data-g="weeklyStyle"><option value="semanal"${o.weeklyStyle==='semanal'?' selected':''}>Blocos</option><option value="semanalLista"${o.weeklyStyle==='semanalLista'?' selected':''}>Lista</option></select></label>`:''}
   <label class="chk"><input type="checkbox" data-g="daily"${o.daily?' checked':''}> Diário (uma página por dia)</label>
   <label class="chk"><input type="checkbox" data-g="habits"${o.habits?' checked':''}> Hábitos do mês</label>
   <label class="chk"><input type="checkbox" data-g="goals"${o.goals?' checked':''}> Metas do mês</label>
   <label class="chk"><input type="checkbox" data-g="fin"${o.fin?' checked':''}> Finanças do mês</label>
   <div class="fgrid"><label class="f">Notas por mês<input type="number" data-g="notes" value="${o.notes}" min="0" max="8"></label><label class="f">Tipo de nota<select data-g="notesKind"><option value="pautada"${o.notesKind==='pautada'?' selected':''}>Pautada</option><option value="pontilhada"${o.notesKind==='pontilhada'?' selected':''}>Pontilhada</option><option value="quadriculada"${o.notesKind==='quadriculada'?' selected':''}>Quadriculada</option></select></label></div></div>
   <div class="pgrp"><h3>NAVEGAÇÃO</h3>
   <label class="chk"><input type="checkbox" data-g="tabs"${o.tabs?' checked':''}> Abas laterais com os meses</label>
   <label class="chk"><input type="checkbox" data-g="links"${o.links?' checked':''}> Links entre páginas (para PDF digital)</label>
   <label class="chk"><input type="checkbox" data-g="holidays"${o.holidays?' checked':''}> Marcar feriados nacionais</label></div>
   <div class="pgrp">${styleControls()}</div>
   <div class="pgrp"><label class="chk"><input type="radio" name="gplace" value="end"${o.place!=='replace'?' checked':''}> Adicionar depois das páginas atuais</label><label class="chk"><input type="radio" name="gplace" value="replace"${o.place==='replace'?' checked':''}> Substituir todas as páginas</label></div>
   <div class="sum" id="gSum"></div><button class="btn pri" id="gGo">Gerar planner</button>`},
  mount(P){const o=genOpt();const sum=()=>{const n=genSpecs(genArgs()).specs.length;$('#gSum',P).innerHTML=`Vai criar <b>${n}</b> página${n===1?'':'s'}${n>200?'. Com tantas páginas, a exportação em PDF pode demorar alguns minutos.':'.'}`};
   $$('[data-g]',P).forEach(i=>i.onchange=()=>{const k=i.dataset.g;o[k]=i.type==='checkbox'?i.checked:i.type==='number'?(+i.value||0):(k==='ws'||k==='m')?+i.value:i.value;
     if(k==='ws'){S.meta.weekStart=o.ws;Saver.m()}if(['cover','weekly'].includes(k))renderPanel();else sum()});
   $$('[name=gplace]',P).forEach(r=>r.onchange=()=>o.place=r.value);mountStyle(P,renderPanel);sum();
   $('#gGo',P).onclick=()=>{const a=genArgs();const pages=genPages(a,styleOf());if(!pages.length){toast('Escolha pelo menos um tipo de página.');return}
     change([...S.order],()=>{pages.forEach(p=>S.pages[p.id]=p);if(o.place==='replace'){S.order=pages.map(p=>p.id)}else S.order.push(...pages.map(p=>p.id))});
     S.cur=o.place==='replace'?0:S.order.length-pages.length;S.sel=[];refreshAll();toast(`${pages.length} páginas criadas. Use Desfazer se quiser voltar.`);closeMob()}}},
 widgets:{html(){const uw=S.lib.filter(x=>x.kind==='widget');return `<h2>Widgets</h2><p class="hint">Clique para colocar no centro da página. Arraste, redimensione e troque as cores no painel à direita.</p>
   <h3>FORMAS LIVRES</h3><div class="wgrid"><button class="wbtn" data-tool="free">${ico('pen','ico" style="width:40px;height:40px')}À mão livre</button><button class="wbtn" data-tool="poly">${ico('poly','ico" style="width:40px;height:40px')}Polígono</button><button class="wbtn" data-tool="curve">${ico('curve','ico" style="width:40px;height:40px')}Curva por pontos</button></div>
   <p class="hint">Depois de desenhar, use “Editar pontos” no painel à direita para ajustar o contorno.</p>
   <h3>PRONTOS</h3><div class="wgrid">${WIDGETS.map(([k,n])=>`<button class="wbtn" data-w="${k}"><canvas data-wp="${k}"></canvas>${n}</button>`).join('')}</div>
   <div class="libsec"><div class="lhd"><h3>MEUS WIDGETS</h3><span class="btn sm upl">Enviar PNG/JPEG<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" multiple data-up="widget" aria-label="Enviar widgets"></span></div>
   ${uw.length?`<div class="litems">${uw.map(libItem).join('')}</div>`:'<p class="hint">Molduras, blocos de anotação ou qualquer arte sua que vira um widget reutilizável.</p>'}</div>`},
  mount(P){const p=curPage(),st=styleOf();const paint=()=>$$('[data-wp]',P).forEach(cv=>{const w=WIDGETS.find(x=>x[0]===cv.dataset.wp);const e=w[2](p,st);e.x=0;e.y=0;elPreview(cv,e,64,44)});paint();S.panelRepaint=paint;
   $$('[data-w]',P).forEach(b=>b.onclick=()=>{const w=WIDGETS.find(x=>x[0]===b.dataset.w);const e=w[2](curPage(),styleOf());addEl(e,w[3])});$$('[data-tool]',P).forEach(b=>b.onclick=()=>startTool(b.dataset.tool));mountLib(P,'widget')}},
 adesivos:{html(){const us=S.lib.filter(x=>x.kind==='sticker');return `<h2>Adesivos</h2>
   <div class="sum" style="display:flex;flex-direction:column;gap:8px;align-items:flex-start"><b style="font-family:var(--f-title)">Adesivo a partir de uma foto ou arte</b><span class="hint">Tire o fundo, coloque a borda branca de recorte e salve na sua biblioteca.</span><button class="btn sm pri" id="smOpen">Criar adesivo</button></div>
   <h3>DA MARCA</h3><div class="wgrid">${STICKERS.map((s,i)=>`<button class="wbtn" data-st="${i}"><canvas data-sp="${i}"></canvas>${SHAPES[s[0]]}</button>`).join('')}</div>
   <div class="libsec"><div class="lhd"><h3>MEUS ADESIVOS</h3><span class="btn sm upl">Enviar PNG/JPEG<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" multiple data-up="sticker" aria-label="Enviar adesivos"></span></div>
   ${us.length?`<div class="litems">${us.map(libItem).join('')}</div>`:'<p class="hint">PNG com fundo transparente fica perfeito como adesivo.</p>'}</div>`},
  mount(P){$('#smOpen',P).onclick=()=>stickerMaker();$$('[data-sp]',P).forEach(cv=>{const e=stickerEl(+cv.dataset.sp);e.x=0;e.y=0;elPreview(cv,e,64,44)});$$('[data-st]',P).forEach(b=>b.onclick=()=>addEl(stickerEl(+b.dataset.st)));mountLib(P,'sticker')}},
 texto:{html(){return `<h2>Texto</h2><div class="plist">${TEXTP.map((t,i)=>`<button class="tcard" data-tx="${i}" style="text-align:left;cursor:pointer"><span style="font-family:'${t[1].font}';font-size:${Math.min(30,t[1].size*1.6)}px;font-weight:${t[1].weight||400};letter-spacing:${t[1].ls||0}em;color:var(--text);line-height:1.2">${esc(t[1].text)}</span><span class="hint">${t[0]}</span></button>`).join('')}</div>
   <p class="hint">Dê dois cliques num texto da página para editar direto nela.</p>`},
  mount(P){$$('[data-tx]',P).forEach(b=>b.onclick=()=>{const t=TEXTP[+b.dataset.tx][1],st=styleOf();const f=t.font==='@script'?st.script:t.font==='@title'?st.title:t.font==='@body'?st.body:t.font;
    addEl(tx(0,0,t.w,t.h,t.text,Object.assign({},t,{font:f,color:t.color==='@a'?st.pal.a:t.color==='@ink'?st.pal.ink:'#3E3550'})))})}},
 biblioteca:{html(){const g=k=>S.lib.filter(x=>x.kind===k);return `<h2>Uploads</h2><p class="hint">Tudo o que você envia fica na sua biblioteca e serve para qualquer projeto.</p>
   <div class="libsec"><div class="lhd"><h3>FONTES</h3><span class="btn sm upl">Enviar TTF/OTF<input type="file" accept=".ttf,.otf,font/ttf,font/otf" multiple data-up="font" aria-label="Enviar fontes"></span></div>
   ${g('font').length?g('font').map(f=>`<div class="fontrow"><span class="pvw" style="font-family:'${esc(f.family)}'">${esc(f.family)} · Aa Bb 123</span><button class="btn sm ghost danger" data-ld="${f.id}">Excluir</button></div>`).join(''):'<p class="hint">As fontes enviadas aparecem na lista de fontes de todos os textos.</p>'}</div>
   <div class="libsec"><div class="lhd"><h3>FUNDOS E TEMAS DE MIOLO</h3><span class="btn sm upl">Enviar PNG/JPEG<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" multiple data-up="background" aria-label="Enviar fundos"></span></div>
   ${g('background').length?`<p class="hint">Clique para aplicar como fundo da página atual.</p><div class="litems">${g('background').map(libItem).join('')}</div>`:'<p class="hint">Envie a arte de fundo de um miolo (papel, moldura, tema do mês) e aplique em uma ou várias páginas.</p>'}</div>
   <div class="libsec"><div class="lhd"><h3>ADESIVOS</h3><span class="btn sm upl">Enviar<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" multiple data-up="sticker" aria-label="Enviar adesivos"></span></div>${g('sticker').length?`<div class="litems">${g('sticker').map(libItem).join('')}</div>`:''}</div>
   <div class="libsec"><div class="lhd"><h3>WIDGETS</h3><span class="btn sm upl">Enviar<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" multiple data-up="widget" aria-label="Enviar widgets"></span></div>${g('widget').length?`<div class="litems">${g('widget').map(libItem).join('')}</div>`:''}</div>
   <div class="libsec"><div class="lhd"><h3>MEUS MODELOS</h3><button class="btn sm" id="saveTpl">Salvar página atual</button></div>${g('template').length?g('template').map(t=>`<div class="fontrow"><span class="pvw" style="font-size:14px">${esc(t.name)} · ${esc(sizeName(t.w,t.h))}</span><button class="btn sm ghost danger" data-ld="${t.id}">Excluir</button></div>`).join(''):'<p class="hint">Salve uma página montada por você e use de novo em qualquer projeto, em qualquer tamanho.</p>'}</div>`},
  mount(P){mountLib(P,null);$('#saveTpl',P).onclick=saveTplModal}},
 paginas:{html(){const p=curPage();return `<h2>Páginas</h2>
   <label class="chk"><input type="checkbox" id="coverAlone"${S.meta.coverAlone!==false?' checked':''}> Na visualização dupla, a primeira página fica sozinha (capa)</label>
   <div class="fgrid"><label class="f">Nova página<select id="npS">${Object.keys(SIZES).map(n=>`<option${sizeName(p.w,p.h)===n?' selected':''}>${n}</option>`).join('')}<option value="cur" selected>Igual à atual</option></select></label><span style="display:flex;align-items:flex-end"><button class="btn sm pri" id="npAdd">Adicionar</button></span></div>
   <div class="plist">${S.order.map((id,i)=>{const pg=S.pages[id];return `<div class="prow${i===S.cur?' on':''}"><span class="n">${i+1}</span><span class="t" data-go="${i}" title="${esc(pg.name)}">${esc(pg.name||'Página')}</span><span class="z">${esc(sizeName(pg.w,pg.h).replace(' deitado',' ↔'))}</span>
     <button class="ib" data-mv="${i}" data-d="-1" title="Subir" aria-label="Subir">${ico('up')}</button><button class="ib" data-mv="${i}" data-d="1" title="Descer" aria-label="Descer">${ico('down')}</button><button class="ib" data-dp="${i}" title="Duplicar" aria-label="Duplicar">${ico('dup')}</button><button class="ib" data-rm="${i}" title="Excluir" aria-label="Excluir">${ico('del')}</button></div>`}).join('')}</div>`},
  mount(P){$('#coverAlone',P).onchange=e=>{S.meta.coverAlone=e.target.checked;Saver.m();renderStage();updNav();markStrip()};
   $('#npAdd',P).onclick=()=>{const v=$('#npS',P).value;if(v==='cur')addPage();else addPage(...SIZES[v])};
   $$('[data-go]',P).forEach(b=>b.onclick=()=>setCur(+b.dataset.go));$$('[data-mv]',P).forEach(b=>b.onclick=()=>movePage(+b.dataset.mv,+b.dataset.d));
   $$('[data-dp]',P).forEach(b=>b.onclick=()=>dupPage(+b.dataset.dp));$$('[data-rm]',P).forEach(b=>b.onclick=()=>{if(b.dataset.cf)delPage(+b.dataset.rm);else{b.dataset.cf=1;b.style.color='var(--danger)';b.title='Clique de novo para excluir';toast('Clique de novo para excluir a página.')}});
   const on=$('.prow.on',P);if(on)on.scrollIntoView({block:'nearest'})}}
};
function genOpt(){if(!S.genOpt){const n=new Date(),p=curPage();S.genOpt={y:n.getMonth()>=8?n.getFullYear()+1:n.getFullYear(),m:n.getMonth()>=8?0:n.getMonth(),months:12,ws:S.meta.weekStart||0,sizeName:sizeName(p.w,p.h).replace(' deitado','')in SIZES?sizeName(p.w,p.h).replace(' deitado',''):'A5',coverName:'A5',title:'Meu Planner',cover:true,annual:true,sep:false,monthly:true,weekly:true,weeklyStyle:'semanal',daily:false,habits:true,goals:false,fin:false,notes:1,notesKind:'pontilhada',tabs:true,links:true,holidays:true,place:'end'}}return S.genOpt}
function genArgs(){const o=genOpt(),p=curPage(),land=p.w>p.h;const sz=n=>{const s=SIZES[n]||[p.w,p.h];return land?{w:Math.max(...s),h:Math.min(...s)}:{w:s[0],h:s[1]}};
  return Object.assign({},o,{size:o.sizeName==='custom'?{w:p.w,h:p.h}:sz(o.sizeName),coverSize:sz(o.coverName)})}
const STICKERS=[['coracao','#F1CDD9','#E7A6BE'],['coracao','#E7A6BE','none'],['brilho','#D8A776','none'],['brilho','#C398C8','none'],['estrela','#D8A776','none'],['flor','#F1CDD9','#D8A776'],['folha','#98B1C2','#6E8AB5'],['gota','#92A8D1','none'],['livros','#C398C8','#92A8D1'],['faixa','#C398C8','none'],['etiqueta','#F7E5E7','#C398C8'],['balao','#FBF7F4','#9168A0'],['circulo','#F1CDD9','none'],['hexagono','#EEF1F8','#92A8D1'],['nuvem','#FFFFFF','#92A8D1'],['seta','#C398C8','none'],['carimbo','#F7E5E7','#C398C8']];
function stickerEl(i){const [k,f1,f2]=STICKERS[i];const twoFill=k==='flor'||k==='livros';const w=k==='faixa'?34:k==='etiqueta'?30:k==='balao'?30:k==='livros'?30:k==='nuvem'?30:k==='seta'?28:18,h=k==='faixa'?14:k==='etiqueta'?14:k==='balao'?24:k==='livros'?22:k==='nuvem'?20:k==='seta'?14:18;
  return E('shape',0,0,w,h,{kind:k,fill:f1,fill2:twoFill?f2:'none',stroke:twoFill?(k==='flor'?'#E7A6BE':'#4A4E79'):(f2||'none'),sw:f2&&f2!=='none'?.35:0})}
const WIDGETS=[
 ['texto','Caixa de texto',(p,st)=>tx(0,0,60,12,'Escreva aqui',{font:st.body,size:11,color:st.pal.text})],
 ['retangulo','Retângulo',(p,st)=>E('rect',0,0,50,30,{fill:st.pal.soft,stroke:st.pal.a,sw:.4,radius:3})],
 ['circulo','Círculo',(p,st)=>E('ellipse',0,0,30,30,{fill:st.pal.soft,stroke:st.pal.a,sw:.4})],
 ['linha','Linha',(p,st)=>E('line',0,0,60,2,{stroke:st.pal.ink,sw:.35,dash:'solid'})],
 ['pautas','Pautas',(p,st)=>E('pattern',0,0,p.w*.7,48,{kind:'lines',sp:7,color:st.pal.line,sw:.3})],
 ['pontos','Pontilhado',(p,st)=>E('pattern',0,0,p.w*.7,48,{kind:'dots',sp:5,color:st.pal.ink,sw:.2,opacity:.6})],
 ['quadric','Quadriculado',(p,st)=>E('pattern',0,0,p.w*.7,48,{kind:'grid',sp:5,color:st.pal.line,sw:.2})],
 ['tarefas','Lista de tarefas',(p,st)=>chk(0,0,60,48,6,st)],
 ['minical','Mini calendário',(p,st)=>{const r=tplRef();return cal(0,0,56,50,st,r.y,r.m,{showTitle:true,headFill:'none',style:'linhas'})}],
 ['calmes','Calendário do mês',(p,st)=>{const r=tplRef();return cal(0,0,p.w*.84,p.h*.5,st,r.y,r.m)}],
 ['anual','Calendário anual',(p,st)=>ycal(0,0,p.w*.84,p.h*.7,st,tplRef().y)],
 ['tabela','Tabela',(p,st)=>tbl(0,0,p.w*.75,48,5,['Coluna 1','Coluna 2','Coluna 3'],st)],
 ['habitos','Hábitos',(p,st)=>E('habit',0,0,p.w*.84,60,{days:31,rows:7,labels:['Beber água','Ler','Caminhar'],labelW:.28,font:st.title,color:st.pal.text,accent:st.pal.a,stroke:st.pal.line})],
 ['horas','Agenda por horas',(p,st)=>E('hours',0,0,60,p.h*.6,{from:7,to:20,font:st.title,color:st.pal.ink,stroke:st.pal.line,fmt:'h',half:true})],
 ['agua','Copos de água',(p,st)=>E('water',0,0,60,10,{n:8,color:st.pal.b,fill:'none',sw:.3})],
 ['humor','Humor do dia',(p,st)=>E('mood',0,0,50,10,{n:5,color:st.pal.ink,sw:.3})],
 ['divisor','Divisor ♡',(p,st)=>E('divider',0,0,p.w*.7,7,{text:'atelier criativo',font:st.title,size:8,color:st.pal.ink,accent:'#E7A6BE'})],
 ['abas','Abas laterais',(p,st)=>{const tw=cl(Math.min(p.w,p.h)/148*7,5,10),m=fr(p.w,p.h).m;return E('tabs',p.w-tw,m*.6,tw,p.h-m*1.2,{labels:MES3.slice(),links:[],active:-1,font:st.title,color:'#3E3550',fill1:st.pal.a,fill2:st.pal.b,activeFill:'#4A4E79'})},true]
];
const TEXTP=[['Título caligráfico',{text:'Meu planner',font:'@script',size:30,color:'@a',w:90,h:16,valign:'middle',lh:1}],['Título',{text:'Título da seção',font:'@title',size:16,weight:700,color:'#3E3550',w:90,h:10}],
  ['Rótulo espaçado',{text:'atelier criativo',font:'@title',size:8.5,weight:500,ls:.16,color:'@ink',w:60,h:6}],['Texto corrido',{text:'Escreva aqui o seu texto. Ele quebra linha sozinho dentro da caixa.',font:'@body',size:10,w:80,h:20,lh:1.45}],
  ['Citação',{text:'Cada página nasce pensada pra sua história.',font:'@body',size:11,italic:true,align:'center',color:'@ink',w:90,h:14,valign:'middle'}],['Número grande',{text:'03',font:'@title',size:36,weight:700,color:'@a',w:30,h:16,valign:'middle'}]];
function elPreview(cv,e,bw,bh){const k=Math.min(bw/e.w,bh/Math.max(e.h,3)),d=window.devicePixelRatio||1;cv.width=bw*d;cv.height=bh*d;const c=cv.getContext('2d');const ee=Object.assign({},e,{x:(bw/k-e.w)/2,y:(bh/k-e.h)/2,rot:0});c.setTransform(k*d,0,0,k*d,0,0);drawEl(c,ee)}
function libItem(it){return `<div class="litem"><div class="im" data-li="${it.id}" role="button" tabindex="0" title="${esc(it.name||'')}"><img src="${esc(srcUrl(it.src))}" alt="${esc(it.name||'')}" loading="lazy"></div><button class="x" data-ld="${it.id}">excluir</button></div>`}
function mountLib(P,kind){$$('[data-up]',P).forEach(inp=>inp.onchange=()=>uploadFiles([...inp.files],inp.dataset.up));
  $$('[data-li]',P).forEach(b=>{const act=()=>useLib(S.lib.find(x=>x.id===b.dataset.li));b.onclick=act;b.onkeydown=e=>{if(e.key==='Enter')act()}});
  $$('[data-ld]',P).forEach(b=>b.onclick=async()=>{if(!b.dataset.cf){b.dataset.cf=1;b.classList.add('cf');b.textContent='confirmar';return}const it=S.lib.find(x=>x.id===b.dataset.ld);if(!it)return;try{await Store.delLib(it)}catch(e){}S.lib=S.lib.filter(x=>x!==it);renderPanel();renderBrand()})}
function useLib(it){if(!it)return;const p=curPage();
  if(it.kind==='background'){bgModal(it);return}
  const im=getImg(it.src);const ar=im?im.naturalHeight/im.naturalWidth:(it.ar||1);const w=it.kind==='widget'?p.w*.6:30;addEl(E('image',0,0,w,r1(w*ar),{src:it.src,fit:'contain',radius:0}))}
function bgModal(it){const p=curPage();const same=S.order.filter(id=>{const q=S.pages[id];return Math.abs(q.w-p.w)<.6&&Math.abs(q.h-p.h)<.6});
  modal(`<h2>Aplicar fundo</h2><p class="hint">“${esc(it.name)}” como fundo de miolo.</p><label class="f">Encaixe<select id="bgFit"><option value="cover">Preencher a página (corta as sobras)</option><option value="contain">Mostrar a imagem inteira</option><option value="stretch">Esticar para o tamanho exato</option></select></label>
   <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn" id="bgAll">Todas as páginas ${esc(sizeName(p.w,p.h))} (${same.length})</button><button class="btn pri" id="bgOne">Só esta página</button></div>`,(b,close)=>{
   const ap=ids=>{const fit=$('#bgFit',b).value;change(ids,()=>ids.forEach(id=>S.pages[id].bgImg={src:it.src,fit,opacity:1}));close();redraw();refreshThumbs();renderProps()};
   $('#bgOne',b).onclick=()=>ap([p.id]);$('#bgAll',b).onclick=()=>ap(same)})}
async function uploadFiles(files,kind){if(!files.length)return;for(const f of files){const ext=(f.name.split('.').pop()||'').toLowerCase();
  let type=kind==='font'?(ext==='otf'?'font/otf':'font/ttf'):(ext==='png'?'image/png':'image/jpeg');
  if(kind==='font'&&!['ttf','otf'].includes(ext)){toast(`${f.name}: envie fontes em .ttf ou .otf.`);continue}
  if(kind!=='font'&&!['png','jpg','jpeg'].includes(ext)){toast(`${f.name}: envie imagens em PNG ou JPEG.`);continue}
  toast('Enviando '+f.name+'…');
  try{const src=await Store.upload(f,type);const it={id:uid('l'),kind,name:f.name.replace(/\.[^.]+$/,''),src,createdAt:Date.now()};
    if(kind==='font'){it.family=it.name.replace(/[^\p{L}\p{N} _-]/gu,'').trim()||'Fonte '+(S.lib.length+1);if(fontList().includes(it.family))it.family+=' (sua)';await loadUserFont(it)}
    else{const im=await loadImg(src);if(im)it.ar=r1(im.naturalHeight/im.naturalWidth*1000)/1000}
    await Store.saveLib(it);S.lib.push(it);toast(f.name+' adicionado à biblioteca.')}
  catch(e){console.error(e);toast(e&&e.code==='too_large'?f.name+' é grande demais. Reduza o arquivo e tente de novo.':'Não consegui enviar '+f.name+'.')}}
  if(kind==='logo'){renderBrand();return}if(S.view==='editor'){renderPanel();renderProps()}}
async function loadUserFont(it){try{const r=await fetch(srcUrl(it.src));const buf=await r.arrayBuffer();const ff=new FontFace(it.family,buf);await ff.load();document.fonts.add(ff)}
  catch(e){try{const ff=new FontFace(it.family,`url(${srcUrl(it.src)})`);await ff.load();document.fonts.add(ff)}catch(_){toast('Não consegui carregar a fonte '+it.family+'.')}}fontOk.clear();fontWait.clear();scheduleRedraw(true)}
function userTplOut(t,p){const fx=p.w/t.w,fy=p.h/t.h,fm=Math.min(fx,fy);const els=clone(t.els).map(e=>{e.id=uid('e');e.x*=fx;e.y*=fy;e.w*=fx;e.h*=fy;if(e.size)e.size=r1(e.size*fm);if(e.sp)e.sp*=fm;e.link=null;if(e.dayLinks)e.dayLinks=null;if(e.monthLinks)e.monthLinks=null;if(e.links)e.links=[];return e});return{bg:t.bg,bgImg:t.bgImg,els}}
function saveTplModal(){const p=curPage();modal(`<h2>Salvar como modelo padrão</h2><label class="f">Nome do modelo<input type="text" id="mtN" value="${esc(p.name||'Meu modelo')}"></label>
  ${showcaseFields({categoria:'Agenda / planner',tamanhos:[sizeName(p.w,p.h).replace(' deitado','')],mostruario:true},'mt')}
  <p class="hint">Os links entre páginas não vão junto; o resto se ajusta a qualquer tamanho.</p><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="mtGo">Salvar</button></div>`,(b,close)=>{
  $('#mtGo',b).onclick=async()=>{const it=Object.assign({id:uid('l'),kind:'template',name:$('#mtN',b).value.trim()||'Meu modelo',w:p.w,h:p.h,bg:p.bg,bgImg:p.bgImg,els:clone(p.els),createdAt:Date.now()},readShowcase(b,'mt'));
    try{await Store.saveLib(it);S.lib.push(it);toast('Modelo salvo.');close();renderPanel()}catch(e){toast('Não consegui salvar este modelo. Talvez a página tenha conteúdo demais.')}}})}

/* ================= app do ateliê e mostruário ================= */
const CATS=['Agenda / planner','Caderno','Bloco de notas','Papelaria','Adesivos','Outros'];
const SHOW_SIZES=['A4','A5','A6','Colegial','B5','B6','Meia-carta','Personal','Pocket'];
const cfg=()=>S.lib.find(x=>x.kind==='config')||{id:'config',kind:'config',appUrl:''};
function safeUrl(u){try{const x=new URL(u);return /^https?:$/.test(x.protocol)?x.href:''}catch(e){return ''}}
function renderAppLinks(){const u=safeUrl(cfg().appUrl||(window.CNU&&window.CNU.appAtelie)||'');['#appLinkTop','#appLinkHome'].forEach(id=>{const a=$(id);if(!a)return;a.hidden=!u;if(u)a.href=u})}
function showcaseFields(it,px){const tam=it.tamanhos||[];return `<label class="chk"><input type="checkbox" id="${px}Show"${it.mostruario?' checked':''}> Mostrar no mostruário do app (o cliente vê e escolhe)</label>
  <div class="fgrid"><label class="f">Categoria<select id="${px}Cat">${CATS.map(c=>`<option${c===it.categoria?' selected':''}>${c}</option>`).join('')}</select></label><label class="f">Ordem no mostruário<input type="number" id="${px}Ord" value="${it.ordem??0}" min="0" max="999"></label></div>
  <label class="f">Descrição para o cliente<textarea id="${px}Desc" rows="2" placeholder="Ex.: semana em blocos com espaço para notas, ótima para quem planeja por dia">${esc(it.descricao||'')}</textarea></label>
  ${it.kind==='sticker'?'':`<div class="pfield"><span>Tamanhos em que você faz este modelo</span><div class="szchips">${SHOW_SIZES.map(n=>`<label><input type="checkbox" data-${px}sz="${n}"${tam.includes(n)?' checked':''}> ${n}</label>`).join('')}</div></div>`}`}
function readShowcase(b,px){const o={mostruario:$(`#${px}Show`,b).checked,categoria:$(`#${px}Cat`,b).value,descricao:$(`#${px}Desc`,b).value.trim(),ordem:+$(`#${px}Ord`,b).value||0};const sz=$$(`[data-${px}sz]`,b);if(sz.length)o.tamanhos=sz.filter(x=>x.checked).map(x=>x.dataset[px+'sz']);return o}
function showcaseModal(it){modal(`<h2>${esc(it.name)}</h2><label class="f">Nome que o cliente vê<input type="text" id="scN" value="${esc(it.name)}"></label>${showcaseFields(it,'sc')}
  <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="scGo">Salvar</button></div>`,(b,close)=>{
  $('#scGo',b).onclick=async()=>{const upd=Object.assign({},it,readShowcase(b,'sc'),{name:$('#scN',b).value.trim()||it.name});try{await Store.saveLib(upd);Object.assign(it,upd);close();renderPanel()}catch(e){toast('Não consegui salvar agora.')}}})}
async function thumbFor(it,maxPx){const c=document.createElement('canvas');
  if(it.kind==='template'){const pg={w:it.w,h:it.h,bg:it.bg,bgImg:it.bgImg,els:it.els};await prep([pg]);const k=maxPx/Math.max(pg.w,pg.h);c.width=Math.round(pg.w*k);c.height=Math.round(pg.h*k);drawPage(c.getContext('2d'),pg,k);return c}
  const im=await loadImg(it.src);if(!im)return null;const s=Math.min(1,maxPx/Math.max(im.naturalWidth,im.naturalHeight));c.width=Math.max(1,Math.round(im.naturalWidth*s));c.height=Math.max(1,Math.round(im.naturalHeight*s));c.getContext('2d').drawImage(im,0,0,c.width,c.height);return c}
async function buildPackage(prog){const items=S.lib.filter(x=>x.mostruario&&(x.kind==='template'||x.kind==='sticker')).sort((a,b)=>(a.ordem||0)-(b.ordem||0));
  const out={formato:'craft-notes-unique/mostruario',versao:1,geradoEm:new Date().toISOString(),modelos:[],adesivos:[]};let i=0;
  for(const it of items){prog&&prog(++i/items.length);const c=await thumbFor(it,it.kind==='template'?760:520);if(!c)continue;
    const base={id:it.id,nome:it.name,categoria:it.categoria||(it.kind==='sticker'?'Adesivos':'Outros'),descricao:it.descricao||'',ordem:it.ordem||0,atualizadoEm:new Date(it.updatedAt||it.createdAt||Date.now()).toISOString()};
    if(it.kind==='template')out.modelos.push(Object.assign(base,{tamanhos:it.tamanhos&&it.tamanhos.length?it.tamanhos:[sizeName(it.w,it.h)],tamanhoBase:{nome:sizeName(it.w,it.h),largura_mm:r1(it.w),altura_mm:r1(it.h)},preview:c.toDataURL('image/jpeg',.85)}));
    else out.adesivos.push(Object.assign(base,{preview:c.toDataURL('image/png')}));await tick()}
  return out}
/* ---- nuvem (Supabase): o mesmo login do app do ateliê ---- */
const Cloud={sb:null,user:null,
  why(){const c=window.CNU||{};if(!c.url||!c.key)return 'as chaves da nuvem não chegaram a este site (config.js vazio). Confira as variáveis do repositório e rode o publicador de novo.';if(!window.supabase)return 'a biblioteca do Supabase não carregou (internet bloqueando o jsDelivr?). Atualize a página.';return 'não consegui ligar à nuvem.'},
  init(){const c=window.CNU||{};if(!c.url||!c.key||!window.supabase){this.changed();return}
    try{this.sb=window.supabase.createClient(c.url,c.key);
      this.sb.auth.getSession().then(({data})=>{this.user=data.session?data.session.user:null;this.changed()});
      this.sb.auth.onAuthStateChange((_e,ses)=>{this.user=ses?ses.user:null;this.changed()})}catch(e){console.error(e)}
    this.changed()},
  changed(){const b=$('#cloudBtn');if(b){b.hidden=false;b.textContent=this.user?'Sair da nuvem':'Entrar na nuvem'}
    if(S.view==='home'&&$('#hstatus'))renderHome();if(S.view==='editor'&&S.tab==='app')renderPanel()},
  async login(){if(!this.sb)return;await this.sb.auth.signInWithOAuth({provider:'github',options:{redirectTo:location.origin+location.pathname}})},
  async logout(){if(this.sb)await this.sb.auth.signOut()}};
$('#cloudBtn').onclick=()=>{if(!Cloud.sb){alert('Nuvem desligada: '+Cloud.why());return}Cloud.user?Cloud.logout():Cloud.login()};

const blobOf=(cv,type,q)=>new Promise(r=>cv.toBlob(r,type,q));
/** Envia direto ao Mostruário do app (mesma tabela e pasta que o app usa para mostrar os modelos às clientes). */
async function sendShowcase(prog){if(!Cloud.sb||!Cloud.user)throw new Error('Entre na nuvem primeiro (botão “Entrar na nuvem”).');
  const items=S.lib.filter(x=>x.kind==='template'||x.kind==='sticker'),sb=Cloud.sb;let n=0,hid=0,i=0;
  for(const it of items){prog&&prog(++i/items.length);const tipo=it.kind==='template'?'modelo':'adesivo';
    if(!it.mostruario){if(it.enviado){const {error}=await sb.from('mostruario_itens').update({visivel:false}).eq('id',it.id);if(error)throw error;const upd=Object.assign({},it,{enviado:false});await Store.saveLib(upd);Object.assign(it,upd);hid++}continue}
    const c=await thumbFor(it,tipo==='modelo'?760:520);if(!c)continue;const png=tipo==='adesivo',blob=await blobOf(c,png?'image/png':'image/jpeg',.85),caminho=`${tipo}/${it.id}.${png?'png':'jpg'}`;
    const up=await sb.storage.from('mostruario').upload(caminho,blob,{upsert:true,contentType:blob.type});if(up.error)throw up.error;
    const {error}=await sb.from('mostruario_itens').upsert({id:it.id,tipo,nome:it.name,categoria:it.categoria||(tipo==='adesivo'?'Adesivos':'Outros'),descricao:it.descricao||'',
      tamanhos:tipo==='modelo'?(it.tamanhos&&it.tamanhos.length?it.tamanhos:[sizeName(it.w,it.h)]):[],tamanho_base:tipo==='modelo'?{nome:sizeName(it.w,it.h),largura_mm:r1(it.w),altura_mm:r1(it.h)}:null,
      ordem:it.ordem||0,preview_path:caminho,visivel:true,atualizado_em:new Date().toISOString()});if(error)throw error;
    const upd=Object.assign({},it,{enviado:true});await Store.saveLib(upd);Object.assign(it,upd);n++;await tick()}
  return {n,hid}}
PANELS.app={html(){const c=cfg(),u=safeUrl(c.appUrl||''),T=S.lib.filter(x=>x.kind==='template'),A=S.lib.filter(x=>x.kind==='sticker'),nT=T.filter(x=>x.mostruario).length,nA=A.filter(x=>x.mostruario).length;
  const row=it=>`<div class="mrow"><div class="mt">${it.kind==='template'?`<canvas data-mth="${it.id}"></canvas>`:`<img src="${esc(srcUrl(it.src))}" alt="">`}</div><div class="mi"><b>${esc(it.name)}</b><span>${esc(it.categoria||'sem categoria')}${it.tamanhos&&it.tamanhos.length?' · '+esc(it.tamanhos.join(', ')):''}</span></div><label class="chk" title="Mostrar no mostruário"><input type="checkbox" data-msh="${it.id}"${it.mostruario?' checked':''} aria-label="Mostrar no mostruário"></label><button class="btn sm ghost" data-med="${it.id}">Editar</button></div>`;
  return `<h2>App do ateliê</h2>
  <label class="f">Link do app<input type="text" id="appUrl" inputmode="url" placeholder="https://seu-usuario.github.io/atelie" value="${esc(c.appUrl||'')}"></label>
  <div class="row"><button class="btn sm pri" id="appSave">Salvar link</button>${u?`<a class="btn sm" href="${esc(u)}" target="_blank" rel="noopener">Abrir app ↗</a>`:''}</div>
  <div class="pgrp"><h3>MOSTRUÁRIO PARA CLIENTES</h3><p class="hint">Os modelos e adesivos marcados entram no formulário do app, onde o cliente vê a prévia e escolhe. Ao criar ou mudar um modelo, envie de novo para atualizar.</p>
   <button class="btn sm" id="appNewTpl">Salvar página atual como modelo padrão</button>
   ${T.length?`<h3>MODELOS DE PÁGINA</h3><div class="plist">${T.map(row).join('')}</div>`:'<p class="hint">Você ainda não tem modelos padrão. Monte uma página e salve com o botão acima.</p>'}
   ${A.length?`<h3>ADESIVOS</h3><div class="plist">${A.map(row).join('')}</div>`:''}
   <div class="sum">No mostruário: <b>${nT}</b> modelo${nT===1?'':'s'} e <b>${nA}</b> adesivo${nA===1?'':'s'}.</div>
   ${Cloud.sb?(Cloud.user?`<div class="row"><button class="btn pri" id="pkgSend">Enviar ao mostruário agora</button></div><p class="hint">Cria ou atualiza no app do ateliê os itens marcados e esconde os desmarcados. As clientes veem na hora.</p>`:`<div class="row"><button class="btn pri" id="pkgLogin">Entrar na nuvem</button></div><p class="hint">Entre com o mesmo GitHub do app do ateliê para enviar os modelos direto ao mostruário.</p>`):`<p class="hint">A nuvem está desligada: ${Cloud.why()} Enquanto isso, baixe o pacote e importe no app do ateliê.</p>`}
   <div class="row"><button class="btn" id="pkgDl"${nT+nA?'':' disabled'}>Baixar pacote (.json)</button></div>
   <p class="hint" id="pkgMsg"></p></div>`},
 mount(P){$('#appSave',P).onclick=async()=>{const v=$('#appUrl',P).value.trim(),u=v?safeUrl(/^https?:/i.test(v)?v:'https://'+v):'';if(v&&!u){toast('Esse link não parece um endereço válido.');return}
   const c=Object.assign({},cfg(),{appUrl:u});try{await Store.saveLib(c);S.lib=S.lib.filter(x=>x.kind!=='config');S.lib.push(c);renderAppLinks();renderPanel();toast(u?'Link do app salvo.':'Link removido.')}catch(e){toast('Não consegui salvar o link.')}};
  $('#appNewTpl',P).onclick=saveTplModal;
  $$('[data-mth]',P).forEach(async cv=>{const it=S.lib.find(x=>x.id===cv.dataset.mth);if(!it)return;const c=await thumbFor(it,120);if(c){cv.width=c.width;cv.height=c.height;cv.getContext('2d').drawImage(c,0,0)}});
  $$('[data-msh]',P).forEach(i=>i.onchange=async()=>{const it=S.lib.find(x=>x.id===i.dataset.msh);if(!it)return;const upd=Object.assign({},it,{mostruario:i.checked,updatedAt:Date.now()});try{await Store.saveLib(upd);Object.assign(it,upd);renderPanel()}catch(e){i.checked=!i.checked;toast('Não consegui salvar agora.')}});
  $$('[data-med]',P).forEach(b=>b.onclick=()=>{const it=S.lib.find(x=>x.id===b.dataset.med);if(it)showcaseModal(it)});
  const msg=t=>$('#pkgMsg',P).textContent=t;
  $('#pkgSend',P)&&($('#pkgSend',P).onclick=async()=>{msg('Enviando…');try{const r=await sendShowcase(f=>msg(`Enviando… ${Math.round(f*100)}%`));msg(`Pronto: ${r.n} enviado${r.n===1?'':'s'}${r.hid?` e ${r.hid} escondido${r.hid===1?'':'s'}`:''}. 🌸`);renderPanel()}catch(e){console.error(e);msg(e&&e.message?e.message:'Não consegui enviar agora.')}});
  $('#pkgLogin',P)&&($('#pkgLogin',P).onclick=()=>Cloud.login());
  $('#pkgDl',P).onclick=async()=>{msg('Gerando prévias…');try{const pk=await buildPackage(f=>msg(`Gerando prévias… ${Math.round(f*100)}%`));await saveFile('mostruario-craft-notes-unique.json',JSON.stringify(pk));msg(`Pacote salvo com ${pk.modelos.length} modelos e ${pk.adesivos.length} adesivos.`)}catch(e){msg(e.message||'Não consegui gerar o pacote.')}}}};
/* ================= criador de adesivos (tirar fundo) ================= */
function stickerMaker(initSrc){const imgs=S.lib.filter(x=>['sticker','widget','background'].includes(x.kind));
  modal(`<h2>Criar adesivo</h2>
  <div class="row"><span class="btn sm upl">Escolher foto ou arte<input type="file" id="smFile" accept=".png,.jpg,.jpeg,image/png,image/jpeg" aria-label="Escolher imagem"></span>${imgs.length?'<span class="hint">ou use uma imagem da sua biblioteca:</span>':''}</div>
  ${imgs.length?`<div class="litems" style="grid-template-columns:repeat(auto-fill,minmax(64px,1fr))">${imgs.slice(0,18).map(it=>`<div class="litem"><div class="im" data-smi="${it.id}" role="button" tabindex="0"><img src="${esc(srcUrl(it.src))}" alt="${esc(it.name||'')}"></div></div>`).join('')}</div>`:''}
  <div class="smgrid" id="smMain" hidden><div class="smwrap" id="smWrap"><canvas id="smCv"></canvas></div>
   <div style="display:flex;flex-direction:column;gap:10px;min-width:0">
    <div class="segf" id="smMode"><button data-m="wand" class="on">Varinha</button><button data-m="color">Mesma cor</button><button data-m="erase">Borracha</button><button data-m="restore">Restaurar</button></div>
    <p class="hint" id="smTip">Clique no fundo para apagar a área parecida em volta.</p>
    <label class="f">Tolerância de cor<input type="range" id="smTol" min="4" max="150" value="40"></label>
    <label class="f">Tamanho do pincel<input type="range" id="smBr" min="2" max="90" value="20"></label>
    <label class="f">Suavizar borda<input type="range" id="smFe" min="0" max="4" value="1"></label>
    <label class="f">Borda de recorte<input type="range" id="smOut" min="0" max="40" value="14"></label>
    <div class="row"><label class="chk">Cor da borda <input type="color" id="smOutC" value="#ffffff"></label><label class="chk"><input type="checkbox" id="smCut"> Linha de corte</label><input type="color" id="smCutC" value="#C398C8" aria-label="Cor da linha de corte"></div>
    <div class="row"><button class="btn sm" id="smAuto">Tirar fundo automático</button><button class="btn sm ghost" id="smUndo">Desfazer</button><button class="btn sm ghost" id="smReset">Recomeçar</button><button class="btn sm ghost" id="smDark">Fundo escuro</button></div>
    <label class="f">Nome do adesivo<input type="text" id="smName" value="Adesivo"></label>
    <label class="chk"><input type="checkbox" id="smShow"> Mostrar no mostruário do app</label>
    <label class="chk"><input type="checkbox" id="smAdd" checked> Colocar na página atual</label>
   </div></div>
  <p class="hint">Funciona melhor com fundo liso ou bem diferente do objeto. Para fotos com fundo cheio de detalhes, combine a varinha com a borracha.</p>
  <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="smSave" disabled>Salvar adesivo</button></div>`,(b,close)=>{
  const cv=$('#smCv',b),ctx=cv.getContext('2d');let W=0,H=0,orig=null,mask=null,hist=[],mode='wand',pad=0,drawing=false,last=null,rT=0;
  const val=id=>+$(id,b).value;
  const load=im=>{if(!im){toast('Não consegui abrir esta imagem.');return}const s=Math.min(1,1200/Math.max(im.naturalWidth,im.naturalHeight));W=Math.max(1,Math.round(im.naturalWidth*s));H=Math.max(1,Math.round(im.naturalHeight*s));
    const t=document.createElement('canvas');t.width=W;t.height=H;const tc=t.getContext('2d');tc.drawImage(im,0,0,W,H);try{orig=tc.getImageData(0,0,W,H)}catch(e){toast('Não consegui ler esta imagem.');return}
    mask=new Uint8ClampedArray(W*H);for(let i=0;i<W*H;i++)mask[i]=orig.data[i*4+3];hist=[];$('#smMain',b).hidden=false;$('#smSave',b).disabled=false;render(false)};
  const push=()=>{hist.push(mask.slice());if(hist.length>20)hist.shift()};
  const sim=(j,r0,g0,b0,t2)=>{const d=orig.data;if(d[j+3]<12)return true;const dr=d[j]-r0,dg=d[j+1]-g0,db=d[j+2]-b0;return dr*dr+dg*dg+db*db<=t2};
  const flood=(seeds,ref,tol)=>{const t2=tol*tol*3,seen=new Uint8Array(W*H),st=new Int32Array(W*H);let sp=0;
    for(const s0 of seeds){if(!seen[s0]){seen[s0]=1;if(ref?sim(s0*4,ref[0],ref[1],ref[2],t2):true)st[sp++]=s0}}
    const [r0,g0,b0]=ref||[orig.data[seeds[0]*4],orig.data[seeds[0]*4+1],orig.data[seeds[0]*4+2]];
    while(sp){const q=st[--sp];mask[q]=0;const x=q%W;const nb=[x>0?q-1:-1,x<W-1?q+1:-1,q>=W?q-W:-1,q<W*(H-1)?q+W:-1];for(const n of nb){if(n<0||seen[n])continue;seen[n]=1;if(sim(n*4,r0,g0,b0,t2))st[sp++]=n}}};
  const auto=()=>{const d=orig.data,bd=[];const step=Math.max(1,Math.round(Math.max(W,H)/200));for(let x=0;x<W;x+=step){bd.push(x,(H-1)*W+x)}for(let y=0;y<H;y+=step){bd.push(y*W,y*W+W-1)}
    let r=0,g=0,bb=0,n=0;bd.forEach(q=>{if(d[q*4+3]>12){r+=d[q*4];g+=d[q*4+1];bb+=d[q*4+2];n++}});if(!n){toast('Esta imagem já não tem fundo.');return}push();flood(bd,[r/n,g/n,bb/n],val('#smTol'));render(false)};
  const globalColor=(x,y)=>{const j=(y*W+x)*4,d=orig.data,t2=val('#smTol')**2*3;push();for(let q=0;q<W*H;q++)if(sim(q*4,d[j],d[j+1],d[j+2],t2))mask[q]=0;render(false)};
  const brush=(x,y)=>{const r=val('#smBr'),r2=r*r;for(let yy=Math.max(0,Math.floor(y-r));yy<=Math.min(H-1,Math.ceil(y+r));yy++)for(let xx=Math.max(0,Math.floor(x-r));xx<=Math.min(W-1,Math.ceil(x+r));xx++){if((xx-x)**2+(yy-y)**2<=r2){const q=yy*W+xx;mask[q]=mode==='erase'?0:orig.data[q*4+3]}}};
  const blurA=(a,rad)=>{const t=new Float32Array(W*H),o=new Uint8ClampedArray(W*H),n=2*rad+1;
    for(let y=0;y<H;y++){let s=0;for(let x=-rad;x<=rad;x++)s+=a[y*W+cl(x,0,W-1)];for(let x=0;x<W;x++){t[y*W+x]=s/n;s+=a[y*W+cl(x+rad+1,0,W-1)]-a[y*W+cl(x-rad,0,W-1)]}}
    for(let x=0;x<W;x++){let s=0;for(let y=-rad;y<=rad;y++)s+=t[cl(y,0,H-1)*W+x];for(let y=0;y<H;y++){o[y*W+x]=Math.min(a[y*W+x],s/n);s+=t[cl(y+rad+1,0,H-1)*W+x]-t[cl(y-rad,0,H-1)*W+x]}}return o};
  const compose=quick=>{const fe=quick?0:val('#smFe'),a=fe?blurA(mask,fe):mask,img=new ImageData(W,H),d=img.data,o=orig.data;for(let q=0;q<W*H;q++){d[q*4]=o[q*4];d[q*4+1]=o[q*4+1];d[q*4+2]=o[q*4+2];d[q*4+3]=Math.min(o[q*4+3],a[q])}
    const base=document.createElement('canvas');base.width=W;base.height=H;base.getContext('2d').putImageData(img,0,0);
    const out=quick?0:val('#smOut'),cut=!quick&&$('#smCut',b).checked,cw=cut?Math.max(2,Math.round(Math.max(W,H)/400)):0;pad=out+cw+2;
    const c2=document.createElement('canvas');c2.width=W+2*pad;c2.height=H+2*pad;const g=c2.getContext('2d');
    const ring=(r,color)=>{if(r<=0)return;const sil=document.createElement('canvas');sil.width=W;sil.height=H;const sg=sil.getContext('2d');sg.drawImage(base,0,0);sg.globalCompositeOperation='source-in';sg.fillStyle=color;sg.fillRect(0,0,W,H);
      const steps=Math.min(72,Math.max(20,Math.round(r*2.2)));for(const f of [1,.66,.33])for(let i=0;i<steps;i++){const an=i/steps*Math.PI*2;g.drawImage(sil,pad+Math.cos(an)*r*f,pad+Math.sin(an)*r*f)}};
    if(cut)ring(out+cw,$('#smCutC',b).value);ring(out,$('#smOutC',b).value);g.drawImage(base,pad,pad);return c2};
  const render=quick=>{const c2=compose(quick);cv.width=c2.width;cv.height=c2.height;ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(c2,0,0)};
  const later=()=>{clearTimeout(rT);rT=setTimeout(()=>render(false),140)};
  const toImg=ev=>{const r=cv.getBoundingClientRect();return[Math.round((ev.clientX-r.left)/r.width*cv.width-pad),Math.round((ev.clientY-r.top)/r.height*cv.height-pad)]};
  cv.onpointerdown=ev=>{if(!orig)return;const [x,y]=toImg(ev);if(mode==='wand'||mode==='color'){if(x<0||y<0||x>=W||y>=H)return;if(mode==='wand'){push();flood([y*W+x],null,val('#smTol'));render(false)}else globalColor(x,y);return}
    push();drawing=true;last=[x,y];cv.setPointerCapture(ev.pointerId);brush(x,y);render(true)};
  cv.onpointermove=ev=>{if(!drawing)return;const [x,y]=toImg(ev),r=Math.max(1,val('#smBr')/2),dist=Math.hypot(x-last[0],y-last[1]),n=Math.ceil(dist/r);for(let i=1;i<=n;i++)brush(last[0]+(x-last[0])*i/n,last[1]+(y-last[1])*i/n);last=[x,y];render(true)};
  cv.onpointerup=cv.onpointercancel=()=>{if(drawing){drawing=false;render(false)}};
  const tips={wand:'Clique no fundo para apagar a área parecida em volta.',color:'Clique numa cor para apagá-la na imagem inteira (bom para miolos de letras).',erase:'Pinte por cima do que quer apagar.',restore:'Pinte para trazer de volta partes apagadas sem querer.'};
  $$('#smMode button',b).forEach(x=>x.onclick=()=>{mode=x.dataset.m;$$('#smMode button',b).forEach(y=>y.classList.toggle('on',y===x));$('#smTip',b).textContent=tips[mode]});
  ['#smFe','#smOut','#smOutC','#smCut','#smCutC'].forEach(id=>$(id,b).addEventListener('input',later));$('#smCut',b).onchange=later;
  $('#smAuto',b).onclick=()=>orig&&auto();$('#smUndo',b).onclick=()=>{if(hist.length){mask=hist.pop();render(false)}};
  $('#smReset',b).onclick=()=>{if(!orig)return;push();for(let i=0;i<W*H;i++)mask[i]=orig.data[i*4+3];render(false)};
  $('#smDark',b).onclick=()=>$('#smWrap',b).classList.toggle('dark');
  $('#smFile',b).onchange=e=>{const f=e.target.files[0];if(!f)return;$('#smName',b).value=f.name.replace(/\.[^.]+$/,'');const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>load(im);im.onerror=()=>load(null);im.src=fr.result};fr.readAsDataURL(f)};
  $$('[data-smi]',b).forEach(x=>x.onclick=async()=>{const it=S.lib.find(y=>y.id===x.dataset.smi);if(!it)return;$('#smName',b).value=it.name||'Adesivo';load(await loadImg(it.src))});
  if(initSrc)loadImg(initSrc).then(load);
  $('#smSave',b).onclick=async()=>{if(!orig)return;const btn=$('#smSave',b);btn.disabled=true;btn.textContent='Salvando…';
    try{const c2=compose(false),g=c2.getContext('2d'),dd=g.getImageData(0,0,c2.width,c2.height).data;let x0=c2.width,y0=c2.height,x1=-1,y1=-1;
      for(let y=0;y<c2.height;y++)for(let x=0;x<c2.width;x++)if(dd[(y*c2.width+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
      if(x1<0){toast('A imagem ficou vazia. Desfaça a última ação.');btn.disabled=false;btn.textContent='Salvar adesivo';return}
      const oc=document.createElement('canvas');oc.width=x1-x0+1;oc.height=y1-y0+1;oc.getContext('2d').drawImage(c2,-x0,-y0);const blob=await new Promise(r=>oc.toBlob(r,'image/png'));
      const src=await Store.upload(blob,'image/png');const it={id:uid('l'),kind:'sticker',name:$('#smName',b).value.trim()||'Adesivo',src,ar:r1(oc.height/oc.width*1000)/1000,mostruario:$('#smShow',b).checked,categoria:'Adesivos',createdAt:Date.now()};
      const addNow=$('#smAdd',b).checked;await Store.saveLib(it);S.lib.push(it);close();toast('Adesivo salvo na sua biblioteca.');
      if(addNow&&S.view==='editor'){const w=40;addEl(E('image',0,0,w,r1(w*it.ar),{src,fit:'contain',radius:0}))}if(S.view==='editor')renderPanel()}
    catch(e){console.error(e);toast(e&&e.code==='too_large'?'O adesivo ficou grande demais. Use uma imagem menor.':'Não consegui salvar o adesivo.');btn.disabled=false;btn.textContent='Salvar adesivo'}}},true)}

/* ================= propriedades ================= */
const ALIGN=[['left','Esq.'],['center','Centro'],['right','Dir.']],VAL=[['top','Topo'],['middle','Meio'],['bottom','Base']];
const FIELDS={
 text:[['text','Texto','ta'],['font','Fonte','font'],['size','Tamanho (pt)','num',.5],['weight','Peso','sel',[[300,'Leve'],[400,'Normal'],[500,'Médio'],[600,'Semi-negrito'],[700,'Negrito']]],['italic','Itálico','chk'],['color','Cor','color'],['align','Alinhamento','seg',ALIGN],['valign','Vertical','seg',VAL],['lh','Entrelinha','num',.05],['ls','Espaçamento (em)','num',.01]],
 rect:[['fill','Preenchimento','colorN'],['stroke','Contorno','colorN'],['sw','Espessura (mm)','num',.05],['radius','Cantos (mm)','num',.5]],
 ellipse:[['fill','Preenchimento','colorN'],['stroke','Contorno','colorN'],['sw','Espessura (mm)','num',.05]],
 line:[['stroke','Cor','color'],['sw','Espessura (mm)','num',.05],['dash','Estilo','sel',[['solid','Contínua'],['dash','Tracejada'],['dot','Pontilhada']]]],
 pattern:[['kind','Tipo','sel',[['lines','Pautas'],['dots','Pontos'],['grid','Quadriculado']]],['sp','Espaçamento (mm)','num',.5],['color','Cor','color'],['sw','Espessura (mm)','num',.05]],
 calendar:[['month','Mês','sel',MESES.map((m,i)=>[i,cap(m)])],['year','Ano','num',1],['weekStart','Semana começa','sel',[[0,'Domingo'],[1,'Segunda']]],['style','Estilo','sel',[['grade','Grade'],['linhas','Só linhas']]],['showTitle','Mostrar nome do mês','chk'],['holidays','Feriados nacionais','chk'],['font','Fonte','font'],['titleFont','Fonte do título','font'],['color','Texto','color'],['accent','Destaque','color'],['headFill','Faixa dos dias','colorN'],['weekendFill','Fim de semana','colorN'],['stroke','Linhas','colorN'],['sw','Espessura (mm)','num',.05]],
 yearcal:[['year','Ano','num',1],['weekStart','Semana começa','sel',[[0,'Domingo'],[1,'Segunda']]],['holidays','Feriados nacionais','chk'],['font','Fonte','font'],['titleFont','Fonte dos meses','font'],['color','Texto','color'],['accent','Destaque','color'],['headFill','Faixa dos dias','colorN']],
 table:[['rows','Linhas','num',1],['cols','Colunas','num',1],['header','Cabeçalho (separe por vírgula)','list'],['side','Primeira coluna (separe por vírgula)','list'],['font','Fonte','font'],['size','Tamanho (pt)','num',.5],['color','Texto','color'],['headFill','Cabeçalho','colorN'],['stroke','Linhas','colorN'],['sw','Espessura (mm)','num',.05]],
 checklist:[['n','Itens','num',1],['items','Texto dos itens (um por linha)','lines'],['box','Marcador','sel',[['square','Quadrado'],['circle','Círculo']]],['lines','Linha para escrever','chk'],['color','Marcador','color'],['stroke','Linhas','colorN'],['sw','Espessura (mm)','num',.05]],
 habit:[['labels','Hábitos (um por linha)','lines'],['days','Dias','num',1],['rows','Linhas','num',1],['labelW','Largura dos nomes (0–0,6)','num',.02],['font','Fonte','font'],['color','Texto','color'],['accent','Círculos','color'],['stroke','Linhas','colorN']],
 hours:[['from','Começa (hora)','num',1],['to','Termina (hora)','num',1],['fmt','Formato','sel',[['h','6h'],['24','06:00']]],['half','Meia hora pontilhada','chk'],['font','Fonte','font'],['color','Texto','color'],['stroke','Linhas','colorN']],
 water:[['n','Quantidade','num',1],['color','Contorno','color'],['fill','Preenchimento','colorN'],['sw','Espessura (mm)','num',.05]],
 mood:[['n','Quantidade','num',1],['color','Cor','color'],['sw','Espessura (mm)','num',.05]],
 shape:[['kind','Forma','sel',Object.entries(SHAPES)],['fill','Cor','colorN'],['fill2','Segunda cor','colorN'],['stroke','Contorno','colorN'],['sw','Espessura (mm)','num',.05]],
 image:[['fit','Encaixe','sel',[['contain','Inteira'],['cover','Preencher'],['stretch','Esticar']]],['radius','Cantos (mm)','num',.5]],
 divider:[['text','Texto','text'],['font','Fonte','font'],['size','Tamanho (pt)','num',.5],['color','Cor','color'],['accent','Corações','color']],
 path:[['smooth','Curvas suaves','chk'],['closed','Forma fechada','chk'],['fill','Preenchimento','colorN'],['stroke','Contorno','colorN'],['sw','Espessura (mm)','num',.05]],
 tabs:[['labels','Abas (uma por linha)','lines'],['active','Aba em destaque (nº, 0 = nenhuma)','numa',1],['font','Fonte','font'],['color','Texto','color'],['fill1','Cor 1','color'],['fill2','Cor 2','color'],['activeFill','Cor do destaque','color']]
};
const TYPE_NAME={text:'Texto',rect:'Retângulo',ellipse:'Círculo',line:'Linha',pattern:'Pautas e grades',calendar:'Calendário do mês',yearcal:'Calendário anual',table:'Tabela',checklist:'Lista de tarefas',habit:'Hábitos',hours:'Agenda por horas',water:'Copos de água',mood:'Humor',shape:'Forma',image:'Imagem',divider:'Divisor',tabs:'Abas laterais',path:'Forma livre'};
function colorField(k,v,none){const hex=/^#[0-9a-f]{6}$/i.test(v||'')?v:'#ffffff';return `<div class="cfield">${none?`<button class="sw none" data-cset="${k}" data-v="none" title="Sem cor" aria-label="Sem cor"></button>`:''}<input type="color" data-k="${k}" data-t="color" value="${hex}" aria-label="Escolher cor">${BRAND.map(c=>`<button class="sw" data-cset="${k}" data-v="${c}" style="background:${c}" title="${c}" aria-label="${c}"></button>`).join('')}</div>`}
function fieldHTML(f,obj){const [k,l,t,x]=f,v=obj[k];let inner='';
  if(t==='ta')inner=`<textarea data-k="${k}" data-t="text" rows="3">${esc(v)}</textarea>`;
  else if(t==='text')inner=`<input type="text" data-k="${k}" data-t="text" value="${esc(v)}">`;
  else if(t==='num'||t==='numa')inner=`<input type="number" data-k="${k}" data-t="${t}" step="${x}" value="${t==='numa'?(v??-1)+1:(v??0)}">`;
  else if(t==='date')inner=`<input type="date" data-k="${k}" data-t="text" value="${esc(v)}">`;
  else if(t==='chk')return `<label class="chk"><input type="checkbox" data-k="${k}" data-t="chk"${v?' checked':''}> ${l}</label>`;
  else if(t==='sel')inner=`<select data-k="${k}" data-t="sel">${x.map(([a,b])=>`<option value="${a}"${String(a)===String(v)?' selected':''}>${b}</option>`).join('')}</select>`;
  else if(t==='font'){const L=fontList();if(v&&!L.includes(v))L.push(v);inner=`<select data-k="${k}" data-t="sel">${L.map(n=>`<option${n===v?' selected':''} style="font-family:'${esc(n)}'">${esc(n)}</option>`).join('')}</select>`}
  else if(t==='color'||t==='colorN')inner=colorField(k,v,t==='colorN');
  else if(t==='seg')inner=`<div class="segf">${x.map(([a,b])=>`<button data-seg="${k}" data-v="${a}" class="${v===a?'on':''}">${b}</button>`).join('')}</div>`;
  else if(t==='list')inner=`<input type="text" data-k="${k}" data-t="list" value="${esc(Array.isArray(v)?v.join(', '):'')}">`;
  else if(t==='lines')inner=`<textarea data-k="${k}" data-t="lines" rows="4">${esc(Array.isArray(v)?v.join('\n'):'')}</textarea>`;
  return `<label class="pfield"><span>${l}</span>${inner}</label>`}
function pageOptions(sel){return `<option value="">Sem link</option>`+S.order.map((id,i)=>`<option value="${id}"${id===sel?' selected':''}>${i+1} · ${esc((S.pages[id].name||'Página').slice(0,40))}</option>`).join('')}
function renderProps(){const P=$('#props');if(!P||!S.meta)return;if(P.contains(document.activeElement)&&document.activeElement.matches('input[type=text],input[type=number],textarea'))return updGeom();
  const p=curPage();if(!p){P.innerHTML='';return}const els=selEls();
  if(els.length===1){const e=els[0];P.innerHTML=`<h2>${TYPE_NAME[e.type]||'Elemento'}</h2>
    <div class="pact"><button class="ib" data-a="dup" title="Duplicar (Ctrl+D)" aria-label="Duplicar">${ico('dup')}</button><button class="ib" data-a="del" title="Excluir (Delete)" aria-label="Excluir">${ico('del')}</button><button class="ib" data-a="lock" title="${e.locked?'Destravar':'Travar'}" aria-label="Travar">${ico(e.locked?'unlock':'lock')}</button><button class="ib" data-a="front" title="Trazer para a frente" aria-label="Trazer para a frente">${ico('front')}</button><button class="ib" data-a="back" title="Enviar para trás" aria-label="Enviar para trás">${ico('back')}</button>
    ${['al','ac','ar','at','am','ab'].map(a=>`<button class="ib" data-al="${a}" title="${ALN[a]} (na página)" aria-label="${ALN[a]}">${ico(a)}</button>`).join('')}</div>
    <div class="fgrid">${[['x','X (mm)'],['y','Y (mm)'],['w','Largura (mm)'],['h','Altura (mm)'],['rot','Rotação (°)']].map(([k,l])=>`<label class="pfield"><span>${l}</span><input type="number" data-k="${k}" data-t="num" step="0.5" value="${r1(e[k]||0)}"></label>`).join('')}<label class="pfield"><span>Opacidade</span><input type="range" min="0.05" max="1" step="0.05" data-k="opacity" data-t="num" value="${e.opacity??1}"></label></div>
    ${e.type==='path'?`<button class="btn sm${S.ptEdit===e.id?' pri':''}" data-a="pts">${S.ptEdit===e.id?'Concluir edição de pontos':'Editar pontos'}</button>${S.ptEdit===e.id?'<p class="hint">Arraste os pontos rosa. Dois cliques num ponto removem; dois cliques sobre o contorno criam um ponto novo.</p>':''}`:''}
    <button class="btn sm" data-a="rep">Repetir em outras páginas…</button>
    ${e.type==='image'?`<button class="btn sm" data-a="mksticker">Tirar fundo e virar adesivo</button>`:''}
    <div class="pgrp">${(FIELDS[e.type]||[]).map(f=>fieldHTML(f,e)).join('')}</div>
    <div class="pgrp"><label class="pfield"><span>Link para página (PDF digital)</span><select data-k="link" data-t="sel">${pageOptions(e.link)}</select></label></div>`}
  else if(els.length>1){P.innerHTML=`<h2>${els.length} elementos</h2><div class="pact"><button class="ib" data-a="dup" title="Duplicar" aria-label="Duplicar">${ico('dup')}</button><button class="ib" data-a="del" title="Excluir" aria-label="Excluir">${ico('del')}</button><button class="ib" data-a="front" title="Frente" aria-label="Frente">${ico('front')}</button><button class="ib" data-a="back" title="Trás" aria-label="Trás">${ico('back')}</button></div><div class="row"><button class="btn sm pri" data-a="group" title="Agrupar (Ctrl+G)">Agrupar</button><button class="btn sm" data-a="ungroup" title="Desagrupar (Ctrl+Shift+G)"${els.some(e=>e.g)?'':' disabled'}>Desagrupar</button></div><button class="btn sm" data-a="rep">Repetir em outras páginas…</button><h3 style="font-size:12px;color:var(--muted)">ALINHAR ENTRE SI</h3><div class="pact">${['al','ac','ar','at','am','ab'].map(a=>`<button class="ib" data-al="${a}" title="${ALN[a]} (entre si)" aria-label="${ALN[a]}">${ico(a)}</button>`).join('')}</div><p class="hint">Shift + clique adiciona ou tira da seleção; arraste no vazio para selecionar vários; Ctrl+A seleciona tudo. Arraste um canto da caixa para mudar o tamanho de todos juntos, na mesma proporção.</p>`}
  else{const sn=sizeName(p.w,p.h).replace(' deitado','');P.innerHTML=`<h2>Página ${S.cur+1}</h2>
    <label class="pfield"><span>Nome</span><input type="text" data-pk="name" value="${esc(p.name||'')}"></label>
    <div class="pgrp"><h3 style="font-size:12px;color:var(--muted)">TAMANHO</h3><label class="pfield"><span>Formato</span><select id="psz">${Object.keys(SIZES).map(n=>`<option${n===sn?' selected':''}>${n}</option>`).join('')}<option value="custom"${SIZES[sn]?'':' selected'}>Personalizado</option></select></label>
     <div class="fgrid"><label class="pfield"><span>Largura (mm)</span><input type="number" id="pw" step="0.5" value="${r1(p.w)}"></label><label class="pfield"><span>Altura (mm)</span><input type="number" id="ph" step="0.5" value="${r1(p.h)}"></label></div>
     <div class="row"><button class="btn sm" id="pRot">Girar ↔</button><label class="chk"><input type="checkbox" id="pScale" checked> Ajustar o conteúdo</label></div>
     <div class="row"><button class="btn sm pri" id="pApply">Aplicar nesta página</button><button class="btn sm" id="pAll">Em todas</button></div></div>
    <div class="pgrp"><label class="pfield"><span>Cor de fundo</span>${colorField('bg',p.bg,false).replace(/data-cset="bg"/g,'data-pcset="bg"').replace('data-k="bg"','data-pk="bg"')}</label>
     ${p.bgImg?`<div class="row"><span class="hint">Fundo com imagem</span><select id="pbfit"><option value="cover"${p.bgImg.fit==='cover'?' selected':''}>Preencher</option><option value="contain"${p.bgImg.fit==='contain'?' selected':''}>Inteira</option><option value="stretch"${p.bgImg.fit==='stretch'?' selected':''}>Esticar</option></select><button class="btn sm ghost danger" id="pbRm">Remover</button></div><label class="pfield"><span>Opacidade do fundo</span><input type="range" id="pbop" min="0.05" max="1" step="0.05" value="${p.bgImg.opacity??1}"></label>`:'<p class="hint">Para usar uma imagem como fundo, envie em Uploads → Fundos e temas.</p>'}</div>
    ${gridControlsHTML()}
    <div class="pgrp"><label class="chk"><input type="checkbox" id="pGuides"${S.guides?' checked':''}> Mostrar margem de segurança</label><button class="btn sm" id="pSaveTpl">Salvar página como meu modelo</button></div>
    <p class="hint">Atalhos: Delete exclui, Ctrl+D duplica, setas movem 1 mm (Shift: 5 mm), Ctrl+Z desfaz, Ctrl + roda do mouse dá zoom.</p>`;
    $('#psz').onchange=()=>{const v=$('#psz').value;if(SIZES[v]){const land=+$('#pw').value>+$('#ph').value;const [a,b]=SIZES[v];$('#pw').value=land?Math.max(a,b):a;$('#ph').value=land?Math.min(a,b):b}};
    $('#pRot').onclick=()=>{const a=$('#pw').value;$('#pw').value=$('#ph').value;$('#ph').value=a};
    const dims=()=>[cl(+$('#pw').value||p.w,20,1000),cl(+$('#ph').value||p.h,20,1000)];
    $('#pApply').onclick=()=>resizePage([p.id],...dims(),$('#pScale').checked);$('#pAll').onclick=()=>resizePage(S.order.slice(),...dims(),$('#pScale').checked);
    mountGridControls(P);$('#pGuides').onchange=e=>{S.guides=e.target.checked;redraw()};$('#pSaveTpl').onclick=saveTplModal;
    if(p.bgImg){$('#pbRm').onclick=()=>{change([p.id],()=>p.bgImg=null);redraw();renderProps();thumbRefresh(p.id)};$('#pbfit').onchange=e=>{change([p.id],()=>p.bgImg.fit=e.target.value);redraw();thumbRefresh(p.id)};
      let b0=null;$('#pbop').oninput=e=>{b0??=snapOf([p.id]);p.bgImg.opacity=+e.target.value;redraw()};$('#pbop').onchange=()=>{if(b0)pushHist(b0,snapOf([p.id]));b0=null;thumbRefresh(p.id)}}}}
function updGeom(){const e=selEls()[0];if(!e||selEls().length!==1)return;['x','y','w','h','rot'].forEach(k=>{const i=$(`#props input[data-k="${k}"]`);if(i&&document.activeElement!==i)i.value=r1(e[k]||0)})}
let propB=null;
function parseVal(t,el){if(t==='num')return parseFloat(el.value)||0;if(t==='numa')return(parseInt(el.value)||0)-1;if(t==='chk')return el.checked;if(t==='list'){const a=el.value.split(',').map(s=>s.trim());return a.length===1&&!a[0]?[]:a}if(t==='lines')return el.value.split('\n');if(t==='sel')return /^-?\d+(\.\d+)?$/.test(el.value)?+el.value:el.value;return el.value}
function setElProp(e,k,v){if(k==='link')v=v||null;if(k==='opacity')v=cl(v,.05,1);if(['w','h'].includes(k))v=Math.max(.5,v);if(k==='rows'||k==='cols'||k==='n'||k==='days')v=cl(Math.round(v),1,k==='days'?62:80);if(k==='labelW')v=cl(v,.05,.6);if(k==='from'||k==='to')v=cl(Math.round(v),0,23);
  e[k]=v;if(e.type==='table'&&k==='cols'){e.cw=null;if(Array.isArray(e.header)){const h=e.header.slice(0,v);while(h.length<v)h.push('');e.header=h}}}
$('#props').addEventListener('input',ev=>{const el=ev.target,p=curPage();if(!p)return;
  if(el.dataset.k){const e=selEls()[0];if(!e)return;propB??=snapOf([p.id]);setElProp(e,el.dataset.k,parseVal(el.dataset.t,el));scheduleRedraw();if(D===null)drawOverlaysOnly()}
  else if(el.dataset.pk){propB??=snapOf([p.id]);p[el.dataset.pk]=el.value;scheduleRedraw()}});
$('#props').addEventListener('change',ev=>{const el=ev.target,p=curPage();if(!p||!(el.dataset.k||el.dataset.pk))return;if(el.dataset.k){const e=selEls()[0];if(e){propB??=snapOf([p.id]);setElProp(e,el.dataset.k,parseVal(el.dataset.t,el))}}else{propB??=snapOf([p.id]);p[el.dataset.pk]=el.value}
  if(propB)pushHist(propB,snapOf([p.id]));propB=null;scheduleRedraw();thumbRefresh(p.id);if(el.dataset.pk==='name'&&S.tab==='paginas')renderPanel();if(el.tagName==='SELECT'||el.type==='checkbox')renderProps()});
$('#props').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const p=curPage();
  if(b.dataset.a){const a=b.dataset.a;if(a==='dup')dupSel();if(a==='del')delSel();if(a==='group')groupSel();if(a==='ungroup')ungroupSel();if(a==='front'||a==='back')orderSel(a);if(a==='lock'){change([p.id],()=>selEls().forEach(e=>e.locked=!e.locked));redraw();renderProps()}
    if(a==='rep'){repeatModal();return}
    if(a==='pts'){const e=selEls()[0];S.ptEdit=S.ptEdit===e.id?null:e.id;redraw();renderProps()}
    if(a==='mksticker'){const e=selEls()[0];if(e&&e.src)stickerMaker(e.src)}return}
  if(b.dataset.al){alignSel(b.dataset.al);return}
  if(b.dataset.cset){const e=selEls()[0];if(!e)return;change([p.id],()=>e[b.dataset.cset]=b.dataset.v);redraw();renderProps();thumbRefresh(p.id);return}
  if(b.dataset.pcset){change([p.id],()=>p.bg=b.dataset.v);redraw();renderProps();thumbRefresh(p.id);return}
  if(b.dataset.seg){const e=selEls()[0];if(!e)return;change([p.id],()=>e[b.dataset.seg]=b.dataset.v);redraw();renderProps();thumbRefresh(p.id)}});
function drawOverlaysOnly(){$$('#stage .pg').forEach(w=>{const p=S.pages[w.dataset.id];if(p)drawOverlay(w,p)})}

/* ================= exportação ================= */
function scanLinks(){const out=[];S.order.forEach((id,pi)=>{const p=S.pages[id];if(!p)return;for(const e of p.els){
  if(e.link)out.push({pi,id,e,k:null,to:e.link});
  if(e.dayLinks)for(const [d,to] of Object.entries(e.dayLinks))if(to)out.push({pi,id,e,k:['dayLinks',d],to});
  if(e.monthLinks)for(const [d,to] of Object.entries(e.monthLinks))if(to)out.push({pi,id,e,k:['monthLinks',d],to});
  if(e.links)e.links.forEach((to,i)=>{if(to)out.push({pi,id,e,k:['links',i],to})})}});return out}
function fixLinks(list){const pgs=new Set();for(const l of list){if(l.k)l.e[l.k[0]][l.k[1]]=null;else l.e.link=null;pgs.add(l.id)}pgs.forEach(id=>Saver.page(id));refreshAll()}
function exportModal(){const p=curPage();const sizes={};S.order.forEach(id=>{const q=S.pages[id],n=sizeName(q.w,q.h);sizes[n]=(sizes[n]||0)+1});const main=Object.entries(sizes).sort((a,b)=>b[1]-a[1])[0][0];
  modal(`<h2>Exportar</h2>
   <label class="f">O que gerar<select id="xMode"><option value="pdf">PDF com as páginas no tamanho final</option><option value="impo">PDF imposto em cadernos (frente e verso, para dobrar e costurar)</option><option value="png">Imagem PNG da página atual</option></select></label>
   <label class="f" id="xVecL">Tipo de PDF<select id="xVec"><option value="1" selected>Vetorial · letras e formas nítidas em qualquer zoom</option><option value="0">Imagem · como antes (mais lento e pesado)</option></select></label>
   <div id="xPdf" class="fgrid"><label class="f">Páginas<select id="xRange"><option value="all">Todas (${S.order.length})</option><option value="cur">Só a atual (${S.cur+1})</option><option value="custom">Intervalo…</option></select></label><label class="f">Resolução<select id="xDpi"><option value="150">150 dpi · arquivo leve</option><option value="200" selected>200 dpi · equilíbrio</option><option value="300">300 dpi · gráfica</option></select></label>
    <label class="f" id="xFromL" hidden>De<input type="number" id="xFrom" value="1" min="1" max="${S.order.length}"></label><label class="f" id="xToL" hidden>Até<input type="number" id="xTo" value="${S.order.length}" min="1" max="${S.order.length}"></label></div>
   <div id="xOpt1" style="display:flex;flex-direction:column;gap:8px"><label class="chk"><input type="checkbox" id="xLinks" checked> Links clicáveis entre páginas (GoodNotes, Notability, Xodo)</label><label class="chk"><input type="checkbox" id="xBleed"> Sangria de 3 mm</label><label class="chk"><input type="checkbox" id="xMarks"> Marcas de corte</label></div>
   <div id="xOpt2" hidden class="fgrid"><label class="f">Folhas por caderno<select id="xSheets">${[1,2,3,4,5,6,8].map(n=>`<option value="${n}"${n===4?' selected':''}>${n} folha${n>1?'s':''} · ${n*4} páginas</option>`).join('')}</select></label><p class="hint full">Usa as páginas ${esc(main)} (${sizes[main]}). Cada folha tem o dobro da largura da página. Imprima frente e verso virando pela borda curta. Páginas em branco completam o último caderno.</p></div>
   <div id="xWarn" class="sum" hidden style="display:flex;flex-direction:column;gap:6px;align-items:flex-start"></div>
   <div class="prog" id="xProg" hidden><i></i></div><p class="hint" id="xMsg"></p>
   <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Fechar</button><button class="btn pri" id="xGo">Gerar arquivo</button></div>`,(b,close)=>{
   const upd=()=>{const m=$('#xMode',b).value;$('#xPdf',b).hidden=m==='png';$('#xVecL',b).hidden=m==='png';const vec=m!=='png'&&$('#xVec',b).value==='1';$('#xDpi',b).closest('label').hidden=vec;$('#xOpt1',b).hidden=m!=='pdf';$('#xOpt2',b).hidden=m!=='impo';const c=$('#xRange',b).value==='custom'&&m!=='png';$('#xFromL',b).hidden=!c;$('#xToL',b).hidden=!c};
   $('#xMode',b).onchange=upd;$('#xRange',b).onchange=upd;$('#xVec',b).onchange=upd;upd();
   const warn=()=>{const W=$('#xWarn',b),m=$('#xMode',b).value,ids=new Set(S.order);let sel=S.order;
     if(m!=='png'){const r=$('#xRange',b).value;if(r==='cur')sel=[S.order[S.cur]];else if(r==='custom'){const x=cl(Math.min(+$('#xFrom',b).value||1,+$('#xTo',b).value||1),1,S.order.length),y=cl(Math.max(+$('#xFrom',b).value||1,+$('#xTo',b).value||1),1,S.order.length);sel=S.order.slice(x-1,y)}}
     const inSel=new Set(sel),L=scanLinks().filter(l=>inSel.has(S.order[l.pi])),broken=L.filter(l=>!ids.has(l.to)),out=m==='pdf'&&$('#xLinks',b).checked?L.filter(l=>ids.has(l.to)&&!inSel.has(l.to)):[];
     if(!broken.length&&!out.length){W.hidden=true;W.innerHTML='';W._h='';return}
     const ex=a=>[...new Set(a.map(l=>l.pi+1))].slice(0,8).join(', ');
     const html=(broken.length?`<b>${broken.length} link${broken.length>1?'s':''} sem destino</b><span class="hint">Levam a páginas que já não existem (nas páginas ${ex(broken)}). Ficariam sem efeito no PDF.</span><button class="btn sm" id="xFix">Remover links quebrados</button>`:'')+(out.length?`<b>${out.length} link${out.length>1?'s':''} para fora do intervalo</b><span class="hint">Apontam para páginas que não vão neste PDF (páginas ${ex(out)}). Escolha “Todas” para mantê-los funcionando.</span>`:'');
     W.hidden=false;if(W._h===html)return;W._h=html;W.innerHTML=html;
     const fx=$('#xFix',b);if(fx)fx.onclick=()=>{fixLinks(broken);warn();toast(`${broken.length} link(s) removido(s).`)}};
   ['#xRange','#xFrom','#xTo','#xMode','#xLinks'].forEach(q=>$(q,b).addEventListener('change',warn));$('#xFrom',b).addEventListener('input',warn);$('#xTo',b).addEventListener('input',warn);warn();
   $('#xGo',b).onclick=async()=>{const btn=$('#xGo',b);btn.disabled=true;$('#modal').dataset.lock=1;
     try{await runExport({mode:$('#xMode',b).value,range:$('#xRange',b).value,from:+$('#xFrom',b).value,to:+$('#xTo',b).value,dpi:+$('#xDpi',b).value,vec:$('#xVec',b).value==='1'&&$('#xMode',b).value!=='png',links:$('#xLinks',b).checked,bleed:$('#xBleed',b).checked,marks:$('#xMarks',b).checked,sheets:+$('#xSheets',b).value,main},
       (f,msg)=>{$('#xProg',b).hidden=false;$('#xProg i',b).style.width=Math.round(f*100)+'%';$('#xMsg',b).textContent=msg})}
     catch(e){console.error(e);$('#xMsg',b).textContent=e&&e.message?e.message:'Algo deu errado ao gerar o arquivo.'}
     finally{btn.disabled=false;delete $('#modal').dataset.lock}}})}
async function prep(pages){const srcs=new Set(),fonts=new Set();pages.forEach(p=>{if(!p)return;if(window.Margens&&Margens.tabEl){const t=Margens.tabEl(p);if(t&&t.font)[400,600].forEach(w=>fonts.add(`${w} 16px "${t.font}"`))}if(p.bgImg&&p.bgImg.src)srcs.add(p.bgImg.src);p.els.forEach(e=>{if(e.type==='image'&&e.src)srcs.add(e.src);[e.font,e.titleFont].forEach(f=>f&&fonts.add(`${e.italic?'italic ':''}${e.weight||400} 16px "${f}"`));if(e.font)[400,500,600,700].forEach(w=>fonts.add(`${w} 16px "${e.font}"`))})});
  await Promise.all([...srcs].map(loadImg));await Promise.all([...fonts].map(f=>document.fonts.load(f).catch(()=>{})));await document.fonts.ready}
function drawMarks(c,pw,ph,k,pad,b){c.save();c.setTransform(k,0,0,k,0,0);c.strokeStyle='#000000';c.lineWidth=.25;const L=pad-b-1,x0=pad,y0=pad,x1=pad+pw,y1=pad+ph;c.beginPath();
  for(const [x,y,sx,sy] of [[x0,y0,-1,-1],[x1,y0,1,-1],[x0,y1,-1,1],[x1,y1,1,1]]){c.moveTo(x+sx*(b+1),y);c.lineTo(x+sx*(b+1+L),y);c.moveTo(x,y+sy*(b+1));c.lineTo(x,y+sy*(b+1+L))}c.stroke();c.restore()}
const fileBase=()=>(S.meta.name||'miolo').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-').toLowerCase()||'miolo';
async function saveFile(name,blob){if(!(blob instanceof Blob))blob=new Blob([blob],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);return 'ok'}
async function runExport(o,prog){const all=S.order.map(id=>S.pages[id]);let idx=o.mode==='png'||o.range==='cur'?[S.cur]:o.range==='custom'?(()=>{const a=cl(Math.min(o.from,o.to),1,all.length),b=cl(Math.max(o.from,o.to),1,all.length);return[...Array(b-a+1)].map((_,i)=>a-1+i)})():all.map((_,i)=>i);
  const pages=idx.map(i=>all[i]),pxmm=o.dpi/25.4;prog(0,'Preparando imagens e fontes…');await prep(pages);
  const cnv=document.createElement('canvas'),c=cnv.getContext('2d');
  if(o.mode==='png'){const p=pages[0];cnv.width=Math.round(p.w*pxmm);cnv.height=Math.round(p.h*pxmm);drawPage(c,p,pxmm);const blob=await new Promise(r=>cnv.toBlob(r,'image/png'));prog(1,'Pronto.');const r=await saveFile(`${fileBase()}-pagina-${S.cur+1}.png`,blob);prog(1,r==='ok'?'Imagem salva.':'Download cancelado.');return}
  if(o.vec&&window.Vetor)return runVector(o,pages,prog);
  if(!window.jspdf)throw new Error('O gerador de PDF não carregou. Recarregue a página e tente de novo.');
  const {jsPDF}=window.jspdf;let doc=null;const addSheet=(W,H)=>{const or=W>H?'l':'p';if(!doc)doc=new jsPDF({unit:'mm',format:[W,H],orientation:or,compress:true});else doc.addPage([W,H],or)};
  if(o.mode==='pdf'){const b=o.bleed?3:0,pad=b+(o.marks?6:0),pos=new Map();pages.forEach((p,i)=>pos.set(p.id,i+1));
    for(let i=0;i<pages.length;i++){const p=pages[i],W=p.w+2*pad,H=p.h+2*pad;addSheet(W,H);cnv.width=Math.round(W*pxmm);cnv.height=Math.round(H*pxmm);c.setTransform(1,0,0,1,0,0);c.fillStyle='#FFFFFF';c.fillRect(0,0,cnv.width,cnv.height);
      drawPage(c,p,pxmm,pad*pxmm,pad*pxmm,{bleed:b});if(o.marks)drawMarks(c,p.w,p.h,pxmm,pad,b);doc.addImage(cnv.toDataURL('image/jpeg',.92),'JPEG',0,0,W,H,undefined,'FAST');
      if(o.links)for(const L of pageLinks(p)){const t=pos.get(L.to);if(t&&t!==i+1)doc.link(L.x+pad,L.y+pad,L.w,L.h,{pageNumber:t})}
      prog((i+1)/pages.length,`Página ${i+1} de ${pages.length}…`);if(i%2===1)await tick()}}
  else{const list=pages.filter(p=>sizeName(p.w,p.h)===o.main);if(!list.length)throw new Error('Nenhuma página no tamanho '+o.main+' neste intervalo.');const pw=list[0].w,ph=list[0].h,sheets=impose(list,o.sheets);
    for(let i=0;i<sheets.length;i++){const s=sheets[i];addSheet(pw*2,ph);cnv.width=Math.round(pw*2*pxmm);cnv.height=Math.round(ph*pxmm);c.setTransform(1,0,0,1,0,0);c.fillStyle='#FFFFFF';c.fillRect(0,0,cnv.width,cnv.height);
      if(s.l)drawPage(c,s.l,pxmm,0,0);if(s.r)drawPage(c,s.r,pxmm,pw*pxmm,0);c.setTransform(pxmm,0,0,pxmm,0,0);c.strokeStyle='rgba(74,78,121,.35)';c.lineWidth=.2;c.beginPath();c.moveTo(pw,0);c.lineTo(pw,3);c.moveTo(pw,ph-3);c.lineTo(pw,ph);c.stroke();
      doc.addImage(cnv.toDataURL('image/jpeg',.92),'JPEG',0,0,pw*2,ph,undefined,'FAST');prog((i+1)/sheets.length,`Folha ${Math.ceil((i+1)/2)} (${s.side}) de ${sheets.length/2}…`);if(i%2===1)await tick()}
    const ex=pages.length-list.length;if(ex)toast(`${ex} página(s) de outro tamanho ficaram de fora da imposição.`)}
  prog(1,'Montando o arquivo…');await tick();const blob=doc.output('blob');const r=await saveFile(`${fileBase()}${o.mode==='impo'?'-cadernos':''}.pdf`,blob);prog(1,r==='ok'?`PDF salvo (${(blob.size/1048576).toFixed(1)} MB).`:'Download cancelado.')}

async function runVector(o,pages,prog){
  const V=window.Vetor,jobs=[];
  if(o.mode==='pdf'){const b=o.bleed?3:0,pad=b+(o.marks?6:0);
    pages.forEach((p,i)=>jobs.push({w:p.w+2*pad,h:p.h+2*pad,p,pad,draw:c=>{drawPage(c,p,1,pad,pad,{bleed:b});if(o.marks)drawMarks(c,p.w,p.h,1,pad,b)}}))}
  else{const list=pages.filter(p=>sizeName(p.w,p.h)===o.main);if(!list.length)throw new Error('Nenhuma página no tamanho '+o.main+' neste intervalo.');const pw=list[0].w,ph=list[0].h;
    impose(list,o.sheets).forEach(s=>jobs.push({w:pw*2,h:ph,draw:c=>{if(s.l)drawPage(c,s.l,1,0,0);if(s.r)drawPage(c,s.r,1,pw,0);c.setTransform(1,0,0,1,0,0);c.strokeStyle='rgba(74,78,121,.35)';c.lineWidth=.2;c.beginPath();c.moveTo(pw,0);c.lineTo(pw,3);c.moveTo(pw,ph-3);c.lineTo(pw,ph);c.stroke()}}));
    const ex=pages.length-list.length;if(ex)toast(`${ex} página(s) de outro tamanho ficaram de fora da imposição.`)}
  prog(.02,'Conferindo as fontes usadas…');
  const dry=new V.Doc({dry:true});jobs.forEach(j=>j.draw(dry.page(j.w,j.h)));
  const userFonts=S.lib.filter(x=>x.kind==='font'&&x.family).map(x=>({family:x.family,load:async()=>(await fetch(srcUrl(x.src))).arrayBuffer()}));
  const missing=await V.loadFonts(dry.reqs,userFonts,f=>prog(.02+f*.2,'Baixando fontes para embutir no PDF…'));
  const doc=new V.Doc({title:S.meta.name||'Miolo'});V.useLoaded(doc,dry.reqs);
  const pos=new Map();if(o.mode==='pdf')pages.forEach((p,i)=>pos.set(p.id,i));
  for(let i=0;i<jobs.length;i++){const j=jobs[i];j.draw(doc.page(j.w,j.h));
    if(o.mode==='pdf'&&o.links)for(const L of pageLinks(j.p)){const t=pos.get(L.to);if(t!=null&&t!==i)doc.link(i,L.x+j.pad,L.y+j.pad,L.w,L.h,t)}
    prog(.22+.7*(i+1)/jobs.length,`Página ${i+1} de ${jobs.length}…`);if(i%4===3)await tick()}
  prog(.95,'Montando o arquivo…');await tick();const blob=await doc.finish();
  const r=await saveFile(`${fileBase()}${o.mode==='impo'?'-cadernos':''}.pdf`,blob);
  let msg=r==='ok'?`PDF vetorial salvo (${(blob.size/1048576).toFixed(1)} MB).`:'Download cancelado.';
  if(doc.failedText)msg+=` ${doc.failedText} texto(s) viraram imagem porque a fonte${missing.size?' ('+[...missing].slice(0,3).join(', ')+')':''} não pôde ser embutida.`;
  prog(1,msg)}

/* ================= barra superior e teclado ================= */
$('#bBack').onclick=async()=>{await Saver.flush();S.view='home';S.pid=null;loadHome()};
$('#pName').onchange=e=>{S.meta.name=e.target.value.trim()||'Projeto sem nome';Saver.m()};
$('#bUndo').onclick=undo;$('#bRedo').onclick=redo;$('#bPrev').onclick=()=>go(-1);$('#bNext').onclick=()=>go(1);
$$('#viewSeg button').forEach(b=>b.onclick=()=>{S.meta.view=b.dataset.v;Saver.m();renderStage();updNav();markStrip()});
$('#bZfit').onclick=()=>{S.zoom=0;renderStage();updNav()};$('#bZi').onclick=()=>setZoom(S.k/MM2PX*1.2);$('#bZo').onclick=()=>setZoom(S.k/MM2PX/1.2);
$('#bExport').onclick=exportModal;$('#bMobProps').onclick=()=>$('#editor').classList.toggle('showprops');
$('#logoUp').onchange=async e=>{const f=e.target.files[0];if(!f)return;const old=S.lib.filter(x=>x.kind==='logo');await uploadFiles([f],'logo');for(const o of old){try{await Store.delLib(o)}catch(_){}S.lib=S.lib.filter(x=>x!==o)}renderBrand();e.target.value=''};
$('#logoReset').onclick=async()=>{for(const o of S.lib.filter(x=>x.kind==='logo')){try{await Store.delLib(o)}catch(_){}}S.lib=S.lib.filter(x=>x.kind!=='logo');renderBrand()};
document.addEventListener('keydown',ev=>{if(S.view!=='editor'||!$('#modal').hidden)return;const t=ev.target;if(t.matches('input,textarea,select'))return;const mod=ev.ctrlKey||ev.metaKey,p=curPage();
  if(mod&&ev.key.toLowerCase()==='z'){ev.preventDefault();ev.shiftKey?redo():undo();return}if(mod&&ev.key.toLowerCase()==='y'){ev.preventDefault();redo();return}
  if(mod&&ev.key.toLowerCase()==='g'){ev.preventDefault();ev.shiftKey?ungroupSel():groupSel();return}
  if(mod&&ev.key.toLowerCase()==='a'&&p){ev.preventDefault();S.sel=p.els.filter(e=>!e.locked).map(e=>e.id);redraw();renderProps();return}
  if(mod&&ev.key.toLowerCase()==='d'){ev.preventDefault();dupSel();return}if(mod&&ev.key.toLowerCase()==='c'){S.clip=clone(selEls());return}
  if(mod&&ev.key.toLowerCase()==='v'&&S.clip&&S.clip.length){ev.preventDefault();const cp=regroup(S.clip.map(e=>Object.assign(clone(e),{id:uid('e'),x:e.x+3,y:e.y+3})));change([p.id],()=>p.els.push(...cp));S.sel=cp.map(e=>e.id);redraw();renderProps();thumbRefresh(p.id);return}
  if(ev.key==='Delete'||ev.key==='Backspace'){if(S.sel.length){ev.preventDefault();delSel()}return}
  if(ev.key==='Escape'){if(S.tool){if(S.tool.pts.length){S.tool.pts=[];S.tool.hover=null;drawOverlaysOnly()}else stopTool();return}if(S.ptEdit){S.ptEdit=null;redraw();renderProps();return}S.sel=[];redraw();renderProps();return}
  if(ev.key==='Enter'&&S.tool&&S.tool.kind!=='free'){ev.preventDefault();finishTool(false);return}
  if(ev.key==='PageDown'){ev.preventDefault();go(1);return}if(ev.key==='PageUp'){ev.preventDefault();go(-1);return}
  if(ev.key.startsWith('Arrow')&&S.sel.length){ev.preventDefault();const s=ev.shiftKey?5:1,dx=ev.key==='ArrowLeft'?-s:ev.key==='ArrowRight'?s:0,dy=ev.key==='ArrowUp'?-s:ev.key==='ArrowDown'?s:0;change([p.id],()=>selEls().forEach(e=>{if(!e.locked){e.x=r1(e.x+dx);e.y=r1(e.y+dy)}}));redraw();updGeom();thumbRefresh(p.id)}
  else if(ev.key==='ArrowRight'&&!S.sel.length)go(1);else if(ev.key==='ArrowLeft'&&!S.sel.length)go(-1)});
let rzT;window.addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(()=>{if(S.view==='editor')renderStage()},120)});
window.addEventListener('beforeunload',()=>{if(Saver.pending())Saver.flush()});


/* ---- backup de tudo (projetos, páginas, biblioteca e imagens) ---- */
const blobToData=b=>new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b)});
async function backupAll(){toast('Preparando o backup…');const d={formato:'craft-notes-unique/estudio-backup',versao:1,geradoEm:new Date().toISOString(),meta:await IDB.all('meta'),pages:await IDB.all('pages'),lib:await IDB.all('lib'),assets:[]};
  for(const [id,b] of await IDB.all('assets'))d.assets.push([id,await blobToData(b)]);
  await saveFile('estudio-de-miolos-backup.json',new Blob([JSON.stringify(d)],{type:'application/json'}));toast('Backup baixado.')}
async function restoreAll(file){let d;try{d=JSON.parse(await file.text())}catch(e){throw new Error('Esse arquivo não é um backup válido.')}
  if(!d||d.formato!=='craft-notes-unique/estudio-backup')throw new Error('Esse arquivo não é um backup do Estúdio de Miolos.');
  for(const [id,url] of d.assets||[]){const b=await (await fetch(url)).blob();await IDB.put('assets',id,b);if(ASSET_URL.has(id))URL.revokeObjectURL(ASSET_URL.get(id));ASSET_URL.set(id,URL.createObjectURL(b))}
  for(const [k,v] of d.meta||[])await IDB.put('meta',k,v);for(const [k,v] of d.pages||[])await IDB.put('pages',k,v);for(const [k,v] of d.lib||[])await IDB.put('lib',k,v)}
$('#bkBtn').onclick=()=>backupAll().catch(e=>toast(e.message||'Não consegui gerar o backup.'));
$('#bkUp').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{await restoreAll(f);toast('Backup restaurado. 🌸');S.lib=await Store.listLib();S.lib.filter(x=>x.kind==='font').forEach(loadUserFont);renderBrand();renderAppLinks();await loadHome()}catch(x){toast(x.message||'Não consegui restaurar.')}};

/* ================= início ================= */
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
