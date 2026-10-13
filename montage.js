/* ============================================================
   Montage vidéo automatique — Plans Brillance
   Tout est calculé sur l'appareil : photos, vidéos et musiques ne
   quittent jamais le téléphone. Les plans sont dessinés dans un
   <canvas> enregistré en temps réel (MediaRecorder) ; la musique et
   le son d'origine passent par Web Audio.
   Ce fichier s'appuie sur les fonctions de index.html (sess, media,
   zonesFor, putSession, ico, esc, toast…).
   ============================================================ */

const MT_FONT='Inter,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
const MT_MONO='"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
const MT_FMT={story:{l:'Story 9:16',w:1080,h:1920},post:{l:'Post 4:5',w:1080,h:1350},carre:{l:'Carré 1:1',w:1080,h:1080}};
/* pd = durée d'une photo, vd = durée max d'une vidéo, tr = transition, td = durée de transition,
   zoom = zoom lent sur les photos, mus / orig = volumes par défaut, rate = vitesse des vidéos */
const MT_STY={
 doux:{l:'Doux',e:'drop',d:'Fondus lents, léger zoom, ambiance calme',pd:3.2,vd:4,tr:'fade',td:.8,zoom:.08,mus:.9,orig:0,rate:1,txt:'soft'},
 dur:{l:'Dur',e:'star',d:'Coupes rapides, flashs et secousses',pd:1,vd:1.6,tr:'flash',td:.18,zoom:.12,mus:1,orig:0,rate:1,txt:'big'},
 brut:{l:'Brut',e:'video',d:'Sans effet, son d’origine, comme sur le terrain',pd:2,vd:6,tr:'cut',td:0,zoom:0,mus:.25,orig:1,rate:1,txt:'tag'},
 edit:{l:'Édit',e:'sparkles',d:'Glissés, textes animés, vidéos accélérées',pd:1.6,vd:2.2,tr:'slide',td:.35,zoom:.05,mus:1,orig:0,rate:1.5,txt:'pop'},
 ba:{l:'Avant/Après',e:'split',d:'Un rideau révèle l’après sur chaque plan',pd:2,vd:2,tr:'fade',td:.3,zoom:.03,mus:.9,orig:0,rate:1,txt:'soft',pair:true},
};
const MT_PACE={lent:{l:'Lent',k:1.3},normal:{l:'Normal',k:1},rapide:{l:'Rapide',k:.75}};
const MT_LEN={auto:{l:'Tout',s:0},15:{l:'15 s',s:15},30:{l:'30 s',s:30},60:{l:'60 s',s:60}};
const MT_FIT={cover:{l:'Plein écran'},contain:{l:'Image entière'}};
const MT_Q={hd:{l:'Haute (1080p)'},std:{l:'Légère (720p)'}};
const MT={run:null,tok:0,busy:false,musics:[],logo:null,ctx:null,mus:null,open:0};
const MT_DUR=new Map(); /* durées des vidéos (s) */
const MT_AB=new Map();  /* son d'origine décodé des vidéos */

/* ---------- Petites aides ---------- */
const mtC=x=>x<0?0:x>1?1:x;
const mtEO=x=>1-Math.pow(1-mtC(x),3);
const mtEIO=x=>{x=mtC(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
const mtBack=x=>{x=mtC(x);const a=1.70158;return 1+(a+1)*Math.pow(x-1,3)+a*Math.pow(x-1,2)};
const mtSleep=ms=>new Promise(r=>setTimeout(r,ms));
function mtRGBA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`}
function mtFmtT(s){s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function mtWrap(c,txt,maxW,max){
 const w=String(txt).split(/\s+/).filter(Boolean),out=[];let l='';
 for(const x of w){const t=l?l+' '+x:x;if(!l||c.measureText(t).width<=maxW)l=t;else{out.push(l);l=x}}
 if(l)out.push(l);
 if(out.length<=max)return out;
 const k=out.slice(0,max);let last=out.slice(max-1).join(' ');
 while(last.length>1&&c.measureText(last+'…').width>maxW)last=last.slice(0,-1);
 k[max-1]=last.trim()+'…';return k}
function mtPill(c,txt,x,y,fs,bg,fg,al){
 c.font=`700 ${fs}px ${MT_FONT}`;
 const w=c.measureText(txt).width+fs*1.2,h=fs*1.75,X=al==='r'?x-w:x;
 rrect(c,X,y,w,h,h/2);c.fillStyle=bg;c.fill();
 c.fillStyle=fg;c.textBaseline='middle';c.textAlign='left';c.fillText(txt,X+fs*.6,y+h/2+fs*.04);return w}

/* ---------- Bibliothèque de musiques (stockée sur l'appareil) ---------- */
const mtHasMus=()=>db&&db.objectStoreNames.contains('music');
const mtMusicAll=()=>mtHasMus()?p(tx('music').getAll()):Promise.resolve([]);
function mtMusicPut(m){return new Promise((res,rej)=>{
 if(!mtHasMus()){rej(new Error('store'));return}
 const t=db.transaction('music','readwrite');t.objectStore('music').put(m);
 t.oncomplete=()=>res();t.onabort=t.onerror=()=>rej(t.error||new Error('abort'))})}
const mtMusicDel=id=>p(tx('music','readwrite').delete(id));
async function mtDecode(ctx,blob){
 try{const ab=await blob.arrayBuffer();
  return await new Promise((res,rej)=>{const r=ctx.decodeAudioData(ab,res,rej);if(r&&r.then)r.then(res,rej)})}
 catch(e){return null}}
async function mtMusicBuf(ctx,id){
 if(MT.mus&&MT.mus.id===id)return MT.mus.buf;
 const m=MT.musics.find(x=>x.id===id);if(!m)return null;
 const buf=await mtDecode(ctx,m.blob);
 if(!buf){toast('Musique illisible : essaie un fichier MP3 ou M4A');return null}
 MT.mus={id,buf};return buf}

/* ---------- Réglages du montage (gardés avec le nettoyage) ---------- */
function mtCfg(){
 const d={sty:lsGet('pb_mt_sty','doux'),fmt:lsGet('pb_mt_fmt','story'),pace:'normal',len:'auto',fit:lsGet('pb_mt_fit','cover'),q:lsGet('pb_mt_q','hd'),
  mus:lsGet('pb_mt_mus',''),mst:0,vm:null,vo:null,subs:true,tags:true,io:true,title:'',off:{},txt:{}};
 const c=sess.mt||(sess.mt={});
 for(const k in d)if(c[k]===undefined||c[k]===null&&k!=='vm'&&k!=='vo')c[k]=d[k];
 if(!MT_STY[c.sty])c.sty='doux';if(!MT_FMT[c.fmt])c.fmt='story';if(!MT_PACE[c.pace])c.pace='normal';
 if(!MT_LEN[c.len])c.len='auto';if(!MT_FIT[c.fit])c.fit='cover';if(!MT_Q[c.q])c.q='hd';
 if(typeof c.off!=='object')c.off={};if(typeof c.txt!=='object')c.txt={};
 return c}
let mtSaveT;
function mtSave(){clearTimeout(mtSaveT);const s=sess;mtSaveT=setTimeout(()=>{if(s)putSession(s).catch(()=>{})},300)}
const mtDefTitle=()=>ACT[tplOf(sess).act].h.replace(/<[^>]*>/g,'');

/* les médias du nettoyage, dans l'ordre de Plans Brillance : avant, pendant, après — plan par plan */
function mtItems(){
 const out=[];
 for(const ph of PHASES)for(const z of zonesFor(ph))
  media.filter(m=>m.zone===z.id&&m.phase===ph).sort((a,b)=>a.ts-b.ts).forEach(m=>out.push({m,z,ph}));
 return out}

function mtVidDur(m){return new Promise(res=>{
 const v=document.createElement('video');v.preload='metadata';v.muted=true;v.playsInline=true;
 const u=URL.createObjectURL(m.blob);let done=false;
 const end=d=>{if(done)return;done=true;clearTimeout(to);v.removeAttribute('src');v.load();URL.revokeObjectURL(u);res(d)};
 const to=setTimeout(()=>end(0),10000);
 v.onloadedmetadata=()=>end(isFinite(v.duration)&&v.duration>0?v.duration:5);
 v.onerror=()=>end(0);v.src=u})}

/* ---------- Construction de la timeline ---------- */
async function mtBuild(cfg,onProg,quick){
 const S=MT_STY[cfg.sty],k=MT_PACE[cfg.pace].k;
 const its=mtItems().filter(i=>!cfg.off[i.m.id]);
 const vids=its.filter(i=>i.m.type==='video'&&!MT_DUR.has(i.m.id));
 if(!quick){let n=0;for(const i of vids){if(onProg)onProg(`Analyse des vidéos ${++n}/${vids.length}`);MT_DUR.set(i.m.id,await mtVidDur(i.m))}}
 const clip=i=>{
  if(i.m.type==='video'){
   const vd=MT_DUR.has(i.m.id)?MT_DUR.get(i.m.id):S.vd*k*S.rate;if(!vd)return null;
   return {k:'m',it:i,v:true,rate:S.rate,dur:Math.min(S.vd*k,vd/S.rate)}}
  return {k:'m',it:i,v:false,dur:S.pd*k}};
 const segs=[];
 if(S.pair){
  const zs=[],seen=new Set();
  for(const i of its)if(!seen.has(i.z.id)){seen.add(i.z.id);zs.push(i.z)}
  for(const z of zs){
   const zi=its.filter(i=>i.z.id===z.id);
   const pa=zi.find(i=>i.ph==='avant'&&i.m.type==='photo'),pb=zi.find(i=>i.ph==='apres'&&i.m.type==='photo');
   if(pa&&pb){
    const before=zi.filter(i=>(i.ph==='avant'&&i.m.type==='video')||i.ph==='pendant');
    for(const i of before){const s=clip(i);if(s)segs.push(s)}
    const h1=(before.length?.5:1.2)*k,w=1*k,h2=1.6*k,dur=h1+w+h2;
    segs.push({k:'pair',a:pa,b:pb,z,dur,f1:h1/dur,f2:(h1+w)/dur});
    for(const i of zi.filter(i=>i.ph==='apres'&&i.m.type==='video')){const s=clip(i);if(s)segs.push(s)}
   }else for(const i of zi){const s=clip(i);if(s)segs.push(s)}}
 }else for(const i of its){const s=clip(i);if(s)segs.push(s)}
 /* durée max : on resserre chaque plan proportionnellement */
 const io=cfg.io?{a:S.tr==='cut'?1.2:1.8,b:2.4}:{a:0,b:0};
 const body=segs.reduce((a,s)=>a+s.dur,0),tgt=MT_LEN[cfg.len].s;
 if(tgt&&body>0&&body+io.a+io.b>tgt){
  const f=Math.max(.05,(tgt-io.a-io.b)/body);
  for(const s of segs){const mn=s.k==='pair'?1.6:.5;s.dur=Math.max(Math.min(mn,s.dur),s.dur*f)}}
 if(io.a)segs.unshift({k:'intro',dur:io.a});
 if(io.b)segs.push({k:'outro',dur:io.b});
 let t=0;for(const s of segs){s.s=t;t+=s.dur}
 return {segs,total:t,n:its.length}}

/* ---------- Sources (chargées au fur et à mesure pour ménager la mémoire du téléphone) ---------- */
function mtBox(){let b=document.getElementById('mtbox');
 if(!b){b=document.createElement('div');b.id='mtbox';b.style.cssText='position:fixed;left:0;top:0;width:2px;height:2px;overflow:hidden;opacity:.01;pointer-events:none;z-index:-1';document.body.appendChild(b)}
 return b}
const mtSegMedia=s=>!s?[]:s.k==='pair'?[s.a.m,s.b.m]:s.k==='m'?[s.it.m]:[];
function mtSrc(R,m){
 if(R.src.has(m.id))return R.src.get(m.id).p;
 const o={m,el:null,ok:false,u:URL.createObjectURL(m.blob)};
 o.p=new Promise(res=>{
  if(m.type==='photo'){
   const im=new Image();im.decoding='async';o.el=im;
   im.onload=()=>{(im.decode?im.decode():Promise.resolve()).catch(()=>{}).then(()=>{o.ok=true;res()})};
   im.onerror=()=>res();im.src=o.u}
  else{
   const v=document.createElement('video');v.muted=true;v.defaultMuted=true;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('muted','');
   v.preload='auto';v.style.cssText='width:2px;height:2px';o.el=v;R.box.appendChild(v);
   let done=false;const fin=()=>{if(done)return;done=true;clearTimeout(to);o.ok=true;res()};
   const to=setTimeout(fin,12000);
   v.onloadedmetadata=()=>{v.onseeked=()=>{v.onseeked=null;fin()};try{v.currentTime=.05}catch(e){fin()}};
   v.onerror=()=>{clearTimeout(to);res()};
   v.src=o.u;v.load()}});
 R.src.set(m.id,o);return o.p}
const mtLoad=(R,i)=>Promise.all(mtSegMedia(R.segs[i]).map(m=>mtSrc(R,m)));
function mtDrop(R,keep){
 for(const [id,o] of R.src)if(!keep.has(id)){
  if(o.el){if(o.el.tagName==='VIDEO'){o.el.pause();o.el.removeAttribute('src');o.el.load();o.el.remove()}else o.el.removeAttribute('src')}
  URL.revokeObjectURL(o.u);R.src.delete(id)}}

/* ---------- Dessin ---------- */
function mtCover(c,el,sw,sh,W,H,z,px,py){
 const s=Math.max(W/sw,H/sh)*z,dw=sw*s,dh=sh*s;
 c.drawImage(el,(W-dw)/2+px*(dw-W)/2,(H-dh)/2+py*(dh-H)/2,dw,dh)}
function mtMedia(R,o,z,px,py){
 const {c,W,H}=R,blk=()=>{c.fillStyle='#000';c.fillRect(0,0,W,H)};
 if(!o||!o.el)return blk();
 const el=o.el,v=el.tagName==='VIDEO';
 if(v?el.readyState<2:!o.ok)return blk();
 const sw=v?el.videoWidth:el.naturalWidth,sh=v?el.videoHeight:el.naturalHeight;if(!sw||!sh)return blk();
 if(R.fit==='contain'){
  blk();const ga=c.globalAlpha;c.globalAlpha=ga*.35;mtCover(c,el,sw,sh,W,H,1.2,0,0);c.globalAlpha=ga;
  const s=Math.min(W/sw,H/sh)*z,dw=sw*s,dh=sh*s;c.drawImage(el,(W-dw)/2,(H-dh)/2,dw,dh)}
 else mtCover(c,el,sw,sh,W,H,z,px,py)}
function mtBadge(R,ph){return ph==='avant'?['rgba(11,15,20,.82)','#eef3f6']:ph==='pendant'?['#ffb84a','#1a1206']:[R.acc,R.on]}
function mtSubs(R,txt,lt,dur,sty){
 const {c,u,W,H}=R;if(!txt)return;
 c.save();
 if(sty==='big'){
  const k=1+.25*(1-mtEO(lt/.25));
  c.font=`900 ${84*u}px ${MT_FONT}`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
  const lines=mtWrap(c,txt.toUpperCase(),W*.86,2);
  c.translate(W/2,H*.7);c.scale(k,k);c.lineWidth=14*u;c.strokeStyle='rgba(0,0,0,.85)';c.fillStyle='#fff';
  lines.forEach((l,j)=>{const y=(j-(lines.length-1)/2)*96*u;c.strokeText(l,0,y);c.fillText(l,0,y)})}
 else if(sty==='pop'){
  const k=mtBack(lt/.35);if(k<=0){c.restore();return}
  c.font=`800 ${58*u}px ${MT_FONT}`;
  const lines=mtWrap(c,txt,W*.8,2),lh=72*u;
  const bw=Math.max(...lines.map(l=>c.measureText(l).width))+56*u,bh=lines.length*lh+34*u;
  c.translate(W/2,H-R.mb-bh/2);c.rotate(-.025);c.scale(k,k);
  rrect(c,-bw/2,-bh/2,bw,bh,26*u);c.fillStyle=R.acc;c.fill();
  c.fillStyle=R.on;c.textAlign='center';c.textBaseline='middle';
  lines.forEach((l,j)=>c.fillText(l,0,(j-(lines.length-1)/2)*lh+2*u))}
 else{
  const a=mtEO(lt/.6)*(dur-lt<.35?mtC((dur-lt)/.35):1);if(a<=0){c.restore();return}
  c.globalAlpha*=a;
  c.font=`600 ${50*u}px ${MT_FONT}`;
  const lines=mtWrap(c,txt,W*.8,2),lh=64*u;
  const bw=Math.max(...lines.map(l=>c.measureText(l).width))+60*u,bh=lines.length*lh+36*u;
  const y=H-R.mb-bh+(1-a)*20*u;
  rrect(c,(W-bw)/2,y,bw,bh,24*u);c.fillStyle='rgba(11,15,20,.72)';c.fill();
  c.fillStyle='#eef3f6';c.textAlign='center';c.textBaseline='middle';
  lines.forEach((l,j)=>c.fillText(l,W/2,y+18*u+lh/2+j*lh))}
 c.restore()}
function mtTexts(R,ph,txt,lt,dur){
 const {c,u,S,cfg}=R,ga=c.globalAlpha;
 if(S.txt==='tag'){
  const parts=[cfg.tags?PH[ph]:'',cfg.subs?txt:''].filter(Boolean);
  if(parts.length)mtPill(c,parts.join(' · '),48*u,R.mt,36*u,'rgba(11,15,20,.78)','#eef3f6');
  return}
 if(cfg.tags){
  const a=S.txt==='pop'?mtBack(lt/.3):S.txt==='soft'?mtEO(lt/.5):1;
  c.globalAlpha=ga*mtC(a);const [bg,fg]=mtBadge(R,ph);mtPill(c,PH[ph],48*u,R.mt,40*u,bg,fg);c.globalAlpha=ga}
 if(cfg.subs)mtSubs(R,txt,lt,dur,S.txt)}
function mtBg(R){
 const {c,W,H}=R;c.fillStyle='#0b0f14';c.fillRect(0,0,W,H);
 let g=c.createRadialGradient(0,0,0,0,0,W*1.1);g.addColorStop(0,mtRGBA(R.acc,.32));g.addColorStop(1,mtRGBA(R.acc,0));c.fillStyle=g;c.fillRect(0,0,W,H);
 g=c.createRadialGradient(W,H,0,W,H,W*1.1);g.addColorStop(0,'rgba(255,184,74,.2)');g.addColorStop(1,'rgba(255,184,74,0)');c.fillStyle=g;c.fillRect(0,0,W,H)}
function mtLogo(R,cx,cy,sc){
 const {c,u}=R,cw=216*u*sc,ch=156*u*sc;
 rrect(c,cx-cw/2,cy-ch/2,cw,ch,34*u*sc);c.fillStyle='#0d1b2a';c.fill();c.lineWidth=6*u*sc;c.strokeStyle=R.acc;c.stroke();
 const lg=MT.logo;if(lg&&lg.naturalWidth){const lw=150*u*sc,lh=lw*(lg.naturalHeight/lg.naturalWidth);c.drawImage(lg,cx-lw/2,cy-lh/2,lw,lh)}}
function mtIntro(R,lt){
 const {c,u,W,H}=R,ga=c.globalAlpha;mtBg(R);
 const a=mtEO(lt/.6),b=mtEO((lt-.25)/.6),cy=H/2-130*u,dy=(1-b)*40*u;
 c.globalAlpha=ga*a;mtLogo(R,W/2,cy,.75+.25*mtBack(lt/.6));
 c.globalAlpha=ga*b;c.textAlign='center';c.textBaseline='alphabetic';
 c.font=`500 ${30*u}px ${MT_MONO}`;c.fillStyle=R.acc;c.fillText('ATELIER BRILLANCE',W/2,cy+150*u+dy);
 c.font=`800 ${86*u}px ${MT_FONT}`;c.fillStyle='#eef3f6';
 const lines=mtWrap(c,R.title,W*.84,2);lines.forEach((l,j)=>c.fillText(l,W/2,cy+255*u+j*96*u+dy));
 if(R.sub){c.font=`500 ${40*u}px ${MT_FONT}`;c.fillStyle='#9aa7b2';c.fillText(R.sub,W/2,cy+255*u+lines.length*96*u+dy)}
 c.globalAlpha=ga}
function mtOutro(R,lt){
 const {c,u,W,H}=R,ga=c.globalAlpha;mtBg(R);
 const a=mtEO(lt/.6),b=mtEO((lt-.3)/.6),cy=H/2-130*u;
 c.globalAlpha=ga*a;mtLogo(R,W/2,cy,1);
 c.globalAlpha=ga*b;c.textAlign='center';c.textBaseline='alphabetic';
 c.font=`800 ${76*u}px ${MT_FONT}`;c.fillStyle='#eef3f6';c.fillText(R.o1,W/2,cy+190*u);
 const bw=260*u*mtEIO((lt-.4)/.8);c.fillStyle=R.acc;c.fillRect(W/2-bw/2,cy+222*u,bw,6*u);
 if(R.o2){c.font=`500 ${42*u}px ${MT_FONT}`;c.fillStyle='#9aa7b2';mtWrap(c,R.o2,W*.84,2).forEach((l,j)=>c.fillText(l,W/2,cy+300*u+j*54*u))}
 c.globalAlpha=ga}
function mtPair(R,s,lt){
 const {c,u,W,H,S,cfg}=R,A=R.src.get(s.a.m.id),B=R.src.get(s.b.m.id);
 const t1=s.f1*s.dur,t2=s.f2*s.dur,pa=mtEIO((lt-t1)/(t2-t1)),z=1+S.zoom*(lt/s.dur);
 mtMedia(R,A,z,0,0);
 if(pa>0){c.save();c.beginPath();c.rect(0,0,W*pa,H);c.clip();mtMedia(R,B,z,0,0);c.restore()}
 if(pa>0&&pa<1){
  const x=W*pa;c.fillStyle=R.acc;c.fillRect(x-4*u,0,8*u,H);
  c.beginPath();c.arc(x,H/2,36*u,0,Math.PI*2);c.fill();
  c.fillStyle=R.on;c.font=`800 ${34*u}px ${MT_FONT}`;c.textAlign='center';c.textBaseline='middle';c.fillText('‹ ›',x,H/2)}
 const ga=c.globalAlpha;
 if(cfg.tags){
  c.globalAlpha=ga*(1-pa);mtPill(c,'AVANT',48*u,R.mt,40*u,'rgba(11,15,20,.82)','#eef3f6');
  c.globalAlpha=ga*pa;mtPill(c,'APRÈS',W-48*u,R.mt,40*u,R.acc,R.on,'r');c.globalAlpha=ga}
 if(cfg.subs)mtSubs(R,cfg.txt[s.a.m.id]||s.z.l,lt,s.dur,'soft')}
function mtSeg(R,s,lt,i){
 const {c,u,S}=R;c.save();
 if(s.k==='intro')mtIntro(R,lt);
 else if(s.k==='outro')mtOutro(R,lt);
 else if(s.k==='pair')mtPair(R,s,lt);
 else{
  let z=1,px=0,py=0;
  if(!s.v){
   if(S.tr==='flash')z=1+S.zoom*(1-mtEO(lt/.35));
   else{const q=s.dur?lt/s.dur:0;z=1+S.zoom*q;px=(i%2?1:-1)*(q-.5)*.5;py=(i%3-1)*(q-.5)*.3}}
  else if(S.tr==='flash')z=1+.06*(1-mtEO(lt/.3));
  if(S.tr==='flash'&&lt<.22){const a=(1-lt/.22)*22*u;c.translate(Math.sin(lt*97)*a,Math.cos(lt*71)*a)}
  mtMedia(R,R.src.get(s.it.m.id),z,px,py);
  mtTexts(R,s.it.ph,R.cfg.txt[s.it.m.id]||s.it.z.l,lt,s.dur)}
 c.restore()}
function mtIdx(R,t){
 let i=Math.max(0,R.cur);const L=R.segs;
 while(i<L.length-1&&t>=L[i].s+L[i].dur)i++;
 while(i>0&&t<L[i].s)i--;
 return i}
function mtFrame(R,t){
 const {c,W,H,segs,S}=R,i=mtIdx(R,t),s=segs[i],lt=t-s.s;
 c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.fillStyle='#000';c.fillRect(0,0,W,H);
 const prev=segs[i-1],edge=s.k==='intro'||s.k==='outro'||(prev&&prev.k==='intro');
 const tr=edge?(S.tr==='cut'?'cut':'fade'):S.tr,td=edge?.45:S.td;
 if(prev&&(tr==='fade'||tr==='slide')&&lt<td){
  const q=lt/td;
  if(tr==='fade'){mtSeg(R,prev,prev.dur,i-1);c.globalAlpha=q;mtSeg(R,s,lt,i);c.globalAlpha=1}
  else{const e=mtEIO(q),hz=i%2;
   c.save();c.translate(hz?-e*W:0,hz?0:-e*H);mtSeg(R,prev,prev.dur,i-1);c.restore();
   c.save();c.translate(hz?(1-e)*W:0,hz?0:(1-e)*H);mtSeg(R,s,lt,i);c.restore()}}
 else{
  mtSeg(R,s,lt,i);
  if(tr==='flash'&&prev&&lt<td){c.globalAlpha=(1-lt/td)*.85;c.fillStyle='#fff';c.fillRect(0,0,W,H);c.globalAlpha=1}}
 c.restore()}
function mtMakeR(cfg,B){
 const cv=$('#mtcv'),F=MT_FMT[cfg.fmt],q=cfg.q==='std'?2/3:1;
 const W=Math.round(F.w*q/2)*2,H=Math.round(F.h*q/2)*2;
 if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
 const u=W/1080,story=cfg.fmt==='story',air=tplOf(sess).act==='airbnb';
 return {cv,c:cv.getContext('2d'),W,H,u,S:MT_STY[cfg.sty],cfg,fit:cfg.fit,
  acc:air?'#FF5A5F':'#35e0c9',on:air?'#ffffff':'#06110f',
  title:cfg.title||mtDefTitle(),sub:tplOf(sess).l,
  o1:lsGet('pb_mt_o1','Atelier Brillance')||'Atelier Brillance',o2:lsGet('pb_mt_o2','Amiens et alentours'),
  mt:(story?260:56)*u,mb:(story?380:80)*u,segs:B.segs,total:B.total,src:new Map(),box:mtBox(),cur:-1,nodes:[]}}
/* image fixe affichée avant de lancer l'aperçu */
function mtPoster(){
 if(MT.run||!sess||!$('#mtcv'))return;
 const cfg=mtCfg(),R=mtMakeR(cfg,{segs:[],total:0});
 R.c.save();
 if(cfg.io)mtIntro(R,2);
 else{mtBg(R);R.c.fillStyle='#9aa7b2';R.c.font=`600 ${54*R.u}px ${MT_FONT}`;R.c.textAlign='center';R.c.textBaseline='middle';R.c.fillText('Touche Aperçu',R.W/2,R.H/2)}
 R.c.restore()}

/* ---------- Lecture / enregistrement ---------- */
function mtStatus(t){const e=$('#mtst');if(e)e.textContent=t||''}
function mtUI(state){
 MT.busy=!!state;
 const pv=$('#mtpv'),go=$('#mtgo');if(!pv||!go)return;
 pv.innerHTML=state==='preview'?`${ico('stop')} Arrêter`:`${ico('play')} Aperçu`;
 go.innerHTML=state==='rec'?`${ico('stop')} Annuler`:`${ico('film')} Créer la vidéo`;
 pv.disabled=state==='rec';go.disabled=state==='preview';
 document.querySelectorAll('.mt .seg,.mt .lst,.mt .chips,#mtits,.mt input,#mtimp').forEach(e=>e.classList.toggle('mtlock',!!state));
 if(!state){const b=$('#mtbar');if(b)b.style.width='0%'}}
function mtMime(){
 const L=['video/mp4;codecs="avc1.640028,mp4a.40.2"','video/mp4;codecs=avc1,mp4a.40.2','video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
 for(const m of L)try{if(MediaRecorder.isTypeSupported(m))return m}catch(e){}
 return ''}
function mtStopAudio(R){for(const n of R.nodes)try{n.stop()}catch(e){}R.nodes=[];if(R.out)try{R.out.disconnect()}catch(e){}}
function mtCleanup(R){
 if(MT.run===R)MT.run=null;
 mtStopAudio(R);mtDrop(R,new Set());
 if(R.vs)R.vs.getTracks().forEach(t=>t.stop());
 if(R.wl)R.wl.release().catch(()=>{});
 mtUI(null)}
function mtStop(){
 MT.tok++;
 const R=MT.run;
 if(R){R.stop=R.ended=true;cancelAnimationFrame(R.raf);if(R.rec){R.rec.onstop=null;try{R.rec.stop()}catch(e){}}mtCleanup(R);mtStatus('Arrêté')}
 else if(MT.busy){mtUI(null);mtStatus('')}}
function mtEnd(R){
 if(R.ended)return;R.ended=true;cancelAnimationFrame(R.raf);
 for(const o of R.src.values())if(o.el&&o.el.pause)o.el.pause();
 mtStopAudio(R);
 if(R.rec){
  mtStatus('Finalisation de la vidéo…');
  R.rec.onstop=()=>{const type=(R.rec.mimeType||R.mime||'video/mp4').split(';')[0];const blob=new Blob(R.chunks,{type});mtCleanup(R);
   if(blob.size)mtDone(R,blob,type);else{mtStatus('');infoDlg('Vidéo vide','<p>Le navigateur n’a rien enregistré. Réessaie en gardant l’app au premier plan, ou passe en qualité Légère.</p>')}};
  setTimeout(()=>{try{R.rec.stop()}catch(e){mtCleanup(R)}},300)}
 else{mtCleanup(R);mtStatus('Aperçu terminé')}}
function mtEnter(R,i){
 const old=R.segs[R.cur];R.cur=i;
 if(old&&old.k==='m'&&old.v){const o=R.src.get(old.it.m.id);if(o&&o.el)o.el.pause()}
 const s=R.segs[i];
 if(s.k==='m'&&s.v){
  const m=s.it.m;
  mtSrc(R,m).then(()=>{if(R.ended||R.cur!==i)return;const o=R.src.get(m.id);if(!o||!o.el)return;
   try{o.el.playbackRate=s.rate}catch(e){}const pr=o.el.play();if(pr&&pr.catch)pr.catch(()=>{})})}
 /* on garde le plan précédent (transition) et on prépare les 3 suivants */
 const keep=new Set();for(let j=i-1;j<=i+3;j++)mtSegMedia(R.segs[j]).forEach(m=>keep.add(m.id));
 mtDrop(R,keep);for(let j=i+1;j<=i+3;j++)mtLoad(R,j)}
function mtTick(){
 const R=MT.run;if(!R||R.ended)return;
 const t=R.now()-R.t0;
 if(t>=R.total){mtFrame(R,R.total-.001);mtEnd(R);return}
 const tt=Math.max(0,t),i=mtIdx(R,tt);
 if(i!==R.cur)mtEnter(R,i);
 mtFrame(R,tt);
 const b=$('#mtbar');if(b)b.style.width=Math.round(tt/R.total*100)+'%';
 mtStatus(`${R.rec?'Enregistrement':'Aperçu'} · ${mtFmtT(tt)} / ${mtFmtT(R.total)}`);
 R.raf=requestAnimationFrame(mtTick)}
async function mtRun(rec){
 if(MT.busy){mtStop();return}
 const cfg=mtCfg(),S=MT_STY[cfg.sty];
 /* le son doit être activé pendant le toucher (obligatoire sur iPhone) */
 let ctx=null;
 try{const AC=window.AudioContext||window.webkitAudioContext;if(AC){ctx=MT.ctx&&MT.ctx.state!=='closed'?MT.ctx:(MT.ctx=new AC());ctx.resume().catch(()=>{})}}catch(e){ctx=null}
 if(rec&&!(window.MediaRecorder&&HTMLCanvasElement.prototype.captureStream)){
  infoDlg('Création impossible ici','<p>Ce navigateur ne sait pas enregistrer de vidéo. Mets à jour ton iPhone (iOS 15 ou plus) ou utilise Safari / Chrome à jour.</p>');return}
 const tok=++MT.tok;mtUI(rec?'rec':'preview');
 const alive=()=>tok===MT.tok&&$('#mtcv');
 let B;
 try{B=await mtBuild(cfg,mtStatus)}catch(e){mtUI(null);mtStatus('Erreur de préparation');return}
 if(!alive())return;
 if(!B.segs.some(s=>s.k==='m'||s.k==='pair')){mtUI(null);mtStatus('Aucun plan sélectionné');return}
 const vm=cfg.vm??S.mus,vo=cfg.vo??S.orig;
 if(ctx){await Promise.race([ctx.resume().catch(()=>{}),mtSleep(1200)]);if(ctx.state!=='running')ctx=null}
 let mus=null;
 if(ctx&&cfg.mus&&vm>0){mtStatus('Chargement de la musique…');mus=await mtMusicBuf(ctx,cfg.mus);if(!alive())return}
 if(ctx&&vo>0){
  const vs=B.segs.filter(s=>s.k==='m'&&s.v);let n=0;
  for(const s of vs){mtStatus(`Son des vidéos ${++n}/${vs.length}`);if(!MT_AB.has(s.it.m.id))MT_AB.set(s.it.m.id,await mtDecode(ctx,s.it.m.blob));if(!alive())return}}
 const R=mtMakeR(cfg,B);
 mtStatus('Chargement des premiers plans…');
 await Promise.all([0,1,2,3].map(i=>mtLoad(R,i)));
 if(!alive()){mtDrop(R,new Set());return}
 if(ctx){R.out=ctx.createGain();R.out.connect(ctx.destination)}
 if(rec){
  try{
   R.mime=mtMime();R.vs=R.cv.captureStream(30);
   const tracks=[...R.vs.getVideoTracks()];
   if(ctx){const d=ctx.createMediaStreamDestination();R.out.connect(d);tracks.push(...d.stream.getAudioTracks())}
   const opt={videoBitsPerSecond:R.W>=1000?8e6:5e6,audioBitsPerSecond:160000};if(R.mime)opt.mimeType=R.mime;
   R.rec=new MediaRecorder(new MediaStream(tracks),opt);R.chunks=[];
   R.rec.ondataavailable=e=>{if(e.data&&e.data.size)R.chunks.push(e.data)}}
  catch(e){mtCleanup(R);infoDlg('Création impossible','<p>L’enregistrement vidéo n’a pas pu démarrer sur cet appareil. Essaie la qualité Légère.</p>');return}}
 R.now=ctx?()=>ctx.currentTime:()=>performance.now()/1000;
 R.t0=R.now()+.15;
 if(ctx&&mus){
  const T0=R.t0,T1=R.t0+R.total,src=ctx.createBufferSource(),g=ctx.createGain();
  src.buffer=mus;const off=Math.min(cfg.mst||0,Math.max(0,mus.duration-1));src.loop=mus.duration-off<R.total;if(src.loop){src.loopStart=off;src.loopEnd=mus.duration}
  g.gain.setValueAtTime(0,T0);g.gain.linearRampToValueAtTime(vm,T0+.6);
  g.gain.setValueAtTime(vm,Math.max(T0+.6,T1-1.6));g.gain.linearRampToValueAtTime(0,T1);
  src.connect(g);g.connect(R.out);src.start(T0,off);src.stop(T1+.05);R.nodes.push(src)}
 if(ctx&&vo>0)for(const s of B.segs){
  if(s.k!=='m'||!s.v)continue;const b=MT_AB.get(s.it.m.id);if(!b)continue;
  const src=ctx.createBufferSource(),g=ctx.createGain(),T=R.t0+s.s,len=Math.min(b.duration-.05,s.dur*s.rate);if(len<=0)continue;
  src.buffer=b;src.playbackRate.value=s.rate;
  g.gain.setValueAtTime(0,T);g.gain.linearRampToValueAtTime(vo,T+.04);g.gain.setValueAtTime(vo,Math.max(T+.04,T+s.dur-.06));g.gain.linearRampToValueAtTime(0,T+s.dur);
  src.connect(g);g.connect(R.out);src.start(T,.05,len);R.nodes.push(src)}
 MT.run=R;
 try{if(navigator.wakeLock)navigator.wakeLock.request('screen').then(w=>{R.wl=w}).catch(()=>{})}catch(e){}
 mtFrame(R,0);
 if(R.rec)R.rec.start(1000);
 mtTick()}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&MT.run&&MT.run.rec){mtStop();MT.cut=true}
 else if(document.hidden&&MT.run)mtStop();
 else if(!document.hidden&&MT.cut){MT.cut=false;infoDlg('Création interrompue','<p>L’app est passée en arrière-plan pendant l’enregistrement. Relance « Créer la vidéo » en gardant l’écran allumé et l’app ouverte jusqu’à la fin.</p>')}});

/* ---------- Résultat : aperçu, partage, téléchargement ---------- */
function mtDone(R,blob,type){
 mtStatus('Vidéo prête');
 const ext=/mp4/.test(type)?'mp4':'webm',cfg=R.cfg,F=MT_FMT[cfg.fmt];
 const name=`montage_${slug(ACT[tplOf(sess).act].l)}_${cfg.sty}_${cfg.fmt}_${new Date().toISOString().slice(0,10)}.${ext}`;
 const u=URL.createObjectURL(blob),d=$('#dlg');
 d.innerHTML=`<h3>Vidéo prête</h3><video src="${u}" controls playsinline></video>
 <p class="small-hint">${esc(MT_STY[cfg.sty].l)} · ${esc(F.l)} · ${mtFmtT(R.total)} · ${fmtSize(blob.size)}</p>
 ${ext==='webm'?'<p class="small-hint">Ce navigateur crée un fichier .webm, moins bien accepté par Instagram et Facebook. Sur iPhone avec Safari, la vidéo sort en .mp4.</p>':''}
 <div style="display:grid;gap:8px;margin-top:10px">
 <button class="primary" id="mtsh">${ico('upload')} Enregistrer dans Photos / partager</button>
 <button id="mtdl">${ico('import')} Télécharger</button>
 <button id="cl">Fermer</button></div>`;
 const file=new File([blob],name,{type});
 $('#mtsh').onclick=async()=>{
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file]});return}}
  catch(e){if(e.name==='AbortError')return}
  dl(blob,name)};
 $('#mtdl').onclick=()=>dl(blob,name);
 $('#cl').onclick=()=>d.close();
 d.onclose=()=>{d.onclose=null;URL.revokeObjectURL(u)};
 d.showModal()}

/* ---------- Écran Montage ---------- */
async function mtEst(){
 const e=$('#mtest');if(!e||!sess)return;
 const cfg=mtCfg(),B=await mtBuild(cfg,null,true);
 if(!$('#mtest'))return;
 e.innerHTML=B.n?`Durée ≈ <b>${mtFmtT(B.total)}</b> · ${B.n} média(s) · ${esc(MT_FMT[cfg.fmt].l)}. La création prend le même temps : garde l’écran allumé et l’app ouverte.`:'Aucun plan sélectionné.'}
function mtChoice(id,opts,cur,pick){
 const el=$('#'+id);
 el.innerHTML=Object.entries(opts).map(([k,o])=>`<button data-v="${k}" class="${String(k)===String(cur)?'on':''}">${esc(o.l)}</button>`).join('');
 el.onclick=e=>{const b=e.target.closest('[data-v]');if(!b||MT.busy)return;el.querySelectorAll('[data-v]').forEach(x=>x.classList.toggle('on',x===b));pick(b.dataset.v)}}
function mtStyUI(){
 const cfg=mtCfg(),el=$('#mtsty');
 el.innerHTML=Object.entries(MT_STY).map(([k,s])=>`<button data-v="${k}" class="${k===cfg.sty?'on':''}">${ico(s.e)}<span><b>${esc(s.l)}</b><small>${esc(s.d)}</small></span></button>`).join('');
 el.onclick=e=>{const b=e.target.closest('[data-v]');if(!b||MT.busy)return;
  cfg.sty=b.dataset.v;cfg.vm=null;cfg.vo=null;lsSet('pb_mt_sty',cfg.sty);mtSave();
  el.querySelectorAll('[data-v]').forEach(x=>x.classList.toggle('on',x===b));
  const n=$('#mtban');if(n)n.style.display=cfg.sty==='ba'?'':'none';
  mtMusUI();mtEst()}}
function mtMusUI(){
 const el=$('#mtmus');if(!el)return;
 const cfg=mtCfg(),S=MT_STY[cfg.sty],vm=cfg.vm??S.mus,vo=cfg.vo??S.orig;
 el.innerHTML=`<div class="chips" id="mtml"><button data-m="" class="${cfg.mus?'':'on'}">Aucune</button>${MT.musics.map(m=>`<button data-m="${esc(m.id)}" class="${m.id===cfg.mus?'on':''}">${ico('music')}${esc(m.name)}</button>`).join('')}</div>
 <div class="row"><button class="sp" id="mtimp">${ico('import')} Importer une musique</button>${cfg.mus?`<button class="ic-only" id="mtmdel" aria-label="Supprimer cette musique">${ico('trash')}</button>`:''}</div>
 ${cfg.mus?`<label class="rng">Volume de la musique <b id="mtvmv">${Math.round(vm*100)} %</b><input type="range" id="mtvm" min="0" max="100" step="5" value="${Math.round(vm*100)}"></label>
 <label class="rng">Démarrer la musique à <b id="mtmsv">${cfg.mst||0} s</b><input type="range" id="mtms" min="0" max="180" step="5" value="${cfg.mst||0}"></label>`:''}
 <label class="rng">Son d’origine des vidéos <b id="mtvov">${Math.round(vo*100)} %</b><input type="range" id="mtvo" min="0" max="100" step="5" value="${Math.round(vo*100)}"></label>
 <p class="small-hint">Musiques gardées sur ce téléphone, pour tous tes montages. Prends des musiques libres de droits (ou ajoute la musique directement dans Instagram) pour éviter que la vidéo soit coupée.</p>`;
 $('#mtml').onclick=e=>{const b=e.target.closest('[data-m]');if(!b||MT.busy)return;cfg.mus=b.dataset.m;lsSet('pb_mt_mus',cfg.mus);mtSave();mtMusUI()};
 $('#mtimp').onclick=()=>{if(MT.busy)return;
  const inp=document.createElement('input');inp.type='file';inp.accept='audio/*,.mp3,.m4a,.aac,.wav';
  inp.onchange=async()=>{const f=inp.files&&inp.files[0];if(!f)return;
   const m={id:crypto.randomUUID(),name:(f.name||'Musique').replace(/\.[^.]+$/,'').slice(0,60),blob:f,ts:Date.now()};
   try{await mtMusicPut(m)}catch(e){toast('Impossible d’enregistrer cette musique (place ?)');return}
   MT.musics.push(m);cfg.mus=m.id;lsSet('pb_mt_mus',m.id);mtSave();mtMusUI();toast('Musique ajoutée')};
  inp.click()};
 const del=$('#mtmdel');if(del)del.onclick=async()=>{if(MT.busy)return;
  const id=cfg.mus,m=MT.musics.find(x=>x.id===id);
  if(!await askConfirm(`Supprimer la musique « ${m?m.name:''} » de ce téléphone ?`))return;
  try{await mtMusicDel(id)}catch(e){}
  MT.musics=MT.musics.filter(x=>x.id!==id);if(MT.mus&&MT.mus.id===id)MT.mus=null;cfg.mus='';lsSet('pb_mt_mus','');mtSave();mtMusUI()};
 const rng=(id,lab,set)=>{const r=$('#'+id);if(r)r.oninput=()=>{set(+r.value);$('#'+lab).textContent=r.value+(id==='mtms'?' s':' %');mtSave()}};
 rng('mtvm','mtvmv',v=>cfg.vm=v/100);rng('mtvo','mtvov',v=>cfg.vo=v/100);rng('mtms','mtmsv',v=>cfg.mst=v)}
function mtTxtUI(){
 const el=$('#mttxt'),cfg=mtCfg();
 const T={subs:'Sous-titres',tags:'Étiquettes AVANT / APRÈS',io:'Intro et fin'};
 el.innerHTML=`<div class="chips" id="mttg">${Object.entries(T).map(([k,l])=>`<button data-k="${k}" class="${cfg[k]?'on':''}">${ico(cfg[k]?'check-circle':'circle')}${esc(l)}</button>`).join('')}</div>
 ${cfg.io?`<label class="rng">Titre de l’intro<input type="text" id="mtti" maxlength="50" placeholder="${esc(mtDefTitle())}" value="${esc(cfg.title||'')}"></label>
 <label class="rng">Fin · ligne 1<input type="text" id="mto1" maxlength="40" placeholder="Atelier Brillance" value="${esc(lsGet('pb_mt_o1','Atelier Brillance'))}"></label>
 <label class="rng">Fin · ligne 2 (zone, site, téléphone…)<input type="text" id="mto2" maxlength="70" placeholder="Amiens et alentours" value="${esc(lsGet('pb_mt_o2','Amiens et alentours'))}"></label>`:''}`;
 $('#mttg').onclick=e=>{const b=e.target.closest('[data-k]');if(!b||MT.busy)return;cfg[b.dataset.k]=!cfg[b.dataset.k];mtSave();mtTxtUI();mtPoster();mtEst()};
 let pt;const poster=()=>{clearTimeout(pt);pt=setTimeout(mtPoster,250)};
 const ti=$('#mtti');if(ti)ti.oninput=()=>{cfg.title=ti.value.trim();mtSave();poster()};
 const o1=$('#mto1');if(o1)o1.oninput=()=>lsSet('pb_mt_o1',o1.value.trim());
 const o2=$('#mto2');if(o2)o2.oninput=()=>lsSet('pb_mt_o2',o2.value.trim())}
function mtItsUI(){
 const cfg=mtCfg(),its=mtItems(),el=$('#mtits');
 el.innerHTML=its.map(i=>{const off=!!cfg.off[i.m.id];
  return `<div class="mti ${off?'off':''}" data-id="${esc(i.m.id)}"><div class="mtt">${i.m.type==='photo'?`<img src="${url(i.m.blob)}" alt="" loading="lazy">`:`<video src="${url(i.m.blob)}#t=0.1" preload="metadata" muted playsinline></video><span class="pl">${ico('video')}</span>`}</div>
  <div class="sp mtx"><small class="ph-${i.ph}">${PH[i.ph]} · ${esc(i.z.l)}</small><input type="text" maxlength="60" placeholder="${esc(i.z.l)}" value="${esc(cfg.txt[i.m.id]||'')}" aria-label="Sous-titre"></div>
  <button class="ic-only" data-tog aria-label="${off?'Remettre':'Retirer'} ce plan">${ico(off?'circle':'check-circle')}</button></div>`}).join('')||'<div class="hint">Aucune photo ni vidéo pour ce nettoyage.</div>';
 el.onclick=e=>{const b=e.target.closest('[data-tog]');if(!b||MT.busy)return;
  const row=b.closest('[data-id]'),id=row.dataset.id;
  if(cfg.off[id])delete cfg.off[id];else cfg.off[id]=true;
  row.classList.toggle('off',!!cfg.off[id]);b.innerHTML=ico(cfg.off[id]?'circle':'check-circle');mtSave();mtEst()};
 el.oninput=e=>{const inp=e.target.closest('input');if(!inp)return;
  const id=inp.closest('[data-id]').dataset.id,v=inp.value.trim();if(v)cfg.txt[id]=v;else delete cfg.txt[id];mtSave()}}
async function mtOpen(){
 if(!sess)return;
 revoke();document.body.classList.remove('has-tab');
 const open=++MT.open,cfg=mtCfg();
 try{MT.musics=await mtMusicAll()}catch(e){MT.musics=[]}
 if(cfg.mus&&!MT.musics.some(m=>m.id===cfg.mus))cfg.mus='';
 if(!MT.logo)loadImg('images/logo-ab.png').then(i=>{MT.logo=i;mtPoster()}).catch(()=>{});
 const n=mtItems().length;
 $('#app').innerHTML=`<header><div class="row"><button id="back" class="ic-only" aria-label="Retour">${ico('back')}</button><div class="sp ht"><b>Montage vidéo</b><small>${esc(sess.name)}</small></div></div></header>
 <div class="mt">
  <div class="mtv"><canvas id="mtcv" width="1080" height="1920"></canvas><div class="bar"><i id="mtbar"></i></div><div class="mtst" id="mtst"></div></div>
  <div class="row mtgo"><button class="sp" id="mtpv">${ico('play')} Aperçu</button><button class="sp primary" id="mtgo">${ico('film')} Créer la vidéo</button></div>
  <div class="hint" id="mtest"></div>
  <div class="lbl">Style de montage</div><div class="lst tpl" id="mtsty"></div>
  <div class="hint" id="mtban" style="${cfg.sty==='ba'?'':'display:none'}">Avant/Après : une photo avant et une photo après du même plan sont réunies par un rideau ; les vidéos s’intercalent juste avant.</div>
  <div class="lbl">Format</div><div class="seg" id="mtfmt"></div>
  <div class="lbl">Rythme</div><div class="seg" id="mtpace"></div>
  <div class="lbl">Durée max</div><div class="seg" id="mtlen"></div>
  <div class="lbl">Cadrage</div><div class="seg" id="mtfit"></div>
  <div class="lbl">Qualité</div><div class="seg" id="mtq"></div>
  <div class="lbl">Musique et son</div><div id="mtmus"></div>
  <div class="lbl">Textes</div><div id="mttxt"></div>
  <div class="lbl">Plans dans l’ordre (${n})</div>
  <div class="hint">Touche le rond pour retirer un plan. Écris un texte pour remplacer le sous-titre (sinon : le nom du plan).</div>
  <div id="mtits"></div>
 </div>`;
 $('#back').onclick=()=>{mtStop();MT_AB.clear();MT.open++;hub()};
 $('#mtpv').onclick=()=>mtRun(false);
 $('#mtgo').onclick=()=>mtRun(true);
 mtStyUI();
 mtChoice('mtfmt',MT_FMT,cfg.fmt,v=>{cfg.fmt=v;lsSet('pb_mt_fmt',v);mtSave();mtPoster();mtEst()});
 mtChoice('mtpace',MT_PACE,cfg.pace,v=>{cfg.pace=v;mtSave();mtEst()});
 mtChoice('mtlen',MT_LEN,cfg.len,v=>{cfg.len=v;mtSave();mtEst()});
 mtChoice('mtfit',MT_FIT,cfg.fit,v=>{cfg.fit=v;lsSet('pb_mt_fit',v);mtSave()});
 mtChoice('mtq',MT_Q,cfg.q,v=>{cfg.q=v;lsSet('pb_mt_q',v);mtSave();mtPoster()});
 mtMusUI();mtTxtUI();mtItsUI();mtPoster();mtEst();
 window.scrollTo(0,0);
 /* durées réelles des vidéos, en arrière-plan, pour une estimation juste */
 for(const i of mtItems())if(i.m.type==='video'&&!MT_DUR.has(i.m.id)){
  MT_DUR.set(i.m.id,await mtVidDur(i.m));if(open!==MT.open)return}
 if(open===MT.open)mtEst()}
