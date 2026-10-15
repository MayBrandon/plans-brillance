/* ============================================================
   Vlog TikTok / Insta — Plans Brillance
   Montage simple et prévisible : les séquences du dérush, dans
   l'ordre réel du tournage (date d'enregistrement de chaque vidéo,
   puis minutage), que tu peux réordonner ou retirer. Coupes franches,
   son d'origine + musique en fond, « Atelier Brillance Auto » en haut.
   Pas d'intro, pas de fin, pas d'étiquettes, pas de nom de zone.
   Tout est calculé sur le téléphone, rien n'est envoyé.
   ============================================================ */

const VL_FMT={story:{l:'Story 9:16',w:1080,h:1920},post:{l:'Post 4:5',w:1080,h:1350},carre:{l:'Carré 1:1',w:1080,h:1080}};
const VL_FIT={cover:{l:'Plein écran'},contain:{l:'Image entière'}};
const VL_PHOTO=2.5; /* durée d'une photo (s) */
const VL={run:null,tok:0,thumbs:new Map(),urls:new Map(),open:0};

/* ---------- Date d'enregistrement d'une vidéo (boîte « mvhd » du MP4/MOV) ----------
   L'iPhone donne au fichier importé la date de l'import, pas celle du tournage :
   on lit donc la date inscrite dans la vidéo elle-même. */
async function vlReadDate(blob){
 try{
  const rd=async(a,n)=>new DataView(await blob.slice(a,a+n).arrayBuffer());
  let pos=0;
  for(let k=0;k<64&&pos+8<=blob.size;k++){
   const h=await rd(pos,16);let size=h.getUint32(0),hl=8;
   const type=String.fromCharCode(h.getUint8(4),h.getUint8(5),h.getUint8(6),h.getUint8(7));
   if(size===1){size=h.getUint32(8)*4294967296+h.getUint32(12);hl=16}else if(size===0)size=blob.size-pos;
   if(size<8)return 0;
   if(type==='moov'){
    const len=Math.min(size-hl,8*1048576),m=new Uint8Array(await blob.slice(pos+hl,pos+hl+len).arrayBuffer());
    for(let i=0;i+20<m.length;i++)if(m[i]===0x6d&&m[i+1]===0x76&&m[i+2]===0x68&&m[i+3]===0x64){ /* « mvhd » */
     const d=new DataView(m.buffer,i+4),v=d.getUint8(0);
     const secs=v===1?d.getUint32(4)*4294967296+d.getUint32(8):d.getUint32(4);
     const ms=(secs-2082844800)*1000;
     return ms>Date.UTC(2015,0,1)&&ms<Date.now()+864e5?ms:0}
    return 0}
   pos+=size}
 }catch(e){}
 return 0}
async function vlDates(){
 for(const m of media)if(m.type==='video'&&m.cdate===undefined){
  m.cdate=await vlReadDate(m.blob);try{await putMedia(m)}catch(e){}}}

/* ---------- Les séquences ---------- */
/* clé de tri : date de tournage de la source (sinon ordre d'import), puis minutage dans la vidéo */
function vlSrcKey(m){return m.cdate||m.fts||m.ts||0}
function vlAll(){
 const out=[],cuts=Array.isArray(sess.cuts)?sess.cuts:[];
 for(const c of cuts){
  const r=media.find(m=>m.id===c.rush);if(!r)continue;
  if(r.type==='photo'||c.photo)out.push({id:c.id,m:r,photo:true,a:0,b:VL_PHOTO,k1:vlSrcKey(r),k2:0});
  else if(c.b>c.a)out.push({id:c.id,m:r,photo:false,a:c.a,b:c.b,k1:vlSrcKey(r),k2:c.a})}
 /* pas de dérush : on prend les vidéos des lunettes en entier */
 if(!out.length){
  for(const r of media.filter(m=>m.zone==='_rush'&&m.type==='video'))out.push({id:'w_'+r.id,m:r,photo:false,a:0,b:0,whole:true,k1:vlSrcKey(r),k2:0});
  for(const r of media.filter(m=>m.zone==='_raw'&&m.type==='photo'))out.push({id:'w_'+r.id,m:r,photo:true,a:0,b:VL_PHOTO,k1:vlSrcKey(r),k2:0})}
 /* photos et vidéos prises plan par plan dans Plans Brillance */
 for(const m of media.filter(m=>!m.zone.startsWith('_')))
  out.push({id:'m_'+m.id,m,photo:m.type==='photo',a:0,b:m.type==='photo'?VL_PHOTO:0,whole:m.type!=='photo',k1:m.cdate||m.ts||0,k2:0});
 return out}
function vlChrono(list){return list.slice().sort((x,y)=>(x.k1-y.k1)||(x.k2-y.k2))}
function vlCfg(){
 const c=sess.vlog||(sess.vlog={});
 const d={fmt:lsGet('pb_vl_fmt','story'),fit:lsGet('pb_vl_fit','cover'),vo:.8,vm:.3,mus:lsGet('pb_mt_mus',''),mark:true,
  wm:tplOf(sess).act==='auto'?'Atelier Brillance Auto':'Atelier Brillance',order:null,off:{}};
 for(const k in d)if(c[k]===undefined)c[k]=d[k];
 if(!VL_FMT[c.fmt])c.fmt='story';if(!VL_FIT[c.fit])c.fit='cover';if(typeof c.off!=='object'||!c.off)c.off={};
 return c}
/* séquences dans l'ordre choisi (par défaut : chronologique), les nouvelles à leur place chronologique */
function vlList(){
 const cfg=vlCfg(),all=vlChrono(vlAll());
 if(!Array.isArray(cfg.order))return all;
 const by=new Map(all.map(x=>[x.id,x])),out=cfg.order.map(id=>by.get(id)).filter(Boolean);
 for(const x of all)if(!cfg.order.includes(x.id)){
  const j=out.findIndex(y=>y.k1>x.k1||(y.k1===x.k1&&y.k2>x.k2));if(j<0)out.push(x);else out.splice(j,0,x)}
 return out}
let vlSaveT;
function vlSave(){clearTimeout(vlSaveT);const s=sess;vlSaveT=setTimeout(()=>{if(s)putSession(s).catch(()=>{})},300)}
function vlURL(m){if(!VL.urls.has(m.id))VL.urls.set(m.id,URL.createObjectURL(m.type==='video'&&typeof rsPlayable==='function'?rsPlayable(m.blob,m.ext):m.blob));return VL.urls.get(m.id)}
function vlFreeURLs(){for(const u of VL.urls.values())URL.revokeObjectURL(u);VL.urls.clear()}
function vlT(s){s=Math.max(0,s);const m=Math.floor(s/60),r=s-m*60;return m+':'+(r<10?'0':'')+r.toFixed(1)}
function vlLen(x){return x.photo?VL_PHOTO:x.b-x.a}

/* ---------- Durées des vidéos entières ---------- */
function vlDur(m){return new Promise(res=>{const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='metadata';
 let done=false;const end=d=>{if(done)return;done=true;clearTimeout(to);v.removeAttribute('src');v.load();res(d)};
 const to=setTimeout(()=>end(0),12000);v.onloadedmetadata=()=>end(isFinite(v.duration)?v.duration:0);v.onerror=()=>end(0);v.src=vlURL(m)})}
async function vlFillWhole(list){for(const x of list)if(x.whole&&!x.b){if(!x.m.dur)x.m.dur=await vlDur(x.m);x.b=x.m.dur||0}}

/* ---------- Miniatures (une vidéo à la fois, pour ménager le téléphone) ---------- */
async function vlThumbs(list,open){
 const bySrc=new Map();
 for(const x of list)if(!VL.thumbs.has(x.id)){if(!bySrc.has(x.m.id))bySrc.set(x.m.id,[]);bySrc.get(x.m.id).push(x)}
 for(const [,xs] of bySrc){
  if(open!==VL.open)return;
  const m=xs[0].m;
  if(m.type==='photo'){try{const im=await loadImg(vlURL(m));const c=document.createElement('canvas'),k=96/Math.max(im.naturalWidth,im.naturalHeight);c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);const u=c.toDataURL('image/jpeg',.7);xs.forEach(x=>{VL.thumbs.set(x.id,u);vlPutThumb(x.id)})}catch(e){}continue}
  if(typeof rsGrab!=='function')continue;
  const f=await rsGrab(m.type==='video'&&typeof rsPlayable==='function'?rsPlayable(m.blob,m.ext):m.blob,xs.map(x=>x.a+Math.min(.5,vlLen(x)/2||.5)),null);
  xs.forEach((x,j)=>{const fr=f.find(y=>Math.abs(y.t-(x.a+Math.min(.5,vlLen(x)/2||.5)))<.01)||f[j];if(fr){VL.thumbs.set(x.id,fr.url);vlPutThumb(x.id)}})}}
function vlPutThumb(id){const e=document.querySelector(`.vlr[data-id="${CSS.escape(id)}"] .vlth`);if(e&&VL.thumbs.has(id))e.innerHTML=`<img src="${VL.thumbs.get(id)}" alt="">`}

/* ---------- Dessin ---------- */
function vlDraw(R,el){
 const {c,W,H}=R;c.fillStyle='#000';c.fillRect(0,0,W,H);
 if(el){
  const v=el.tagName==='VIDEO',sw=v?el.videoWidth:el.naturalWidth,sh=v?el.videoHeight:el.naturalHeight;
  if(sw&&sh&&(!v||el.readyState>=2)){
   if(R.fit==='contain'){
    const s0=Math.max(W/sw,H/sh)*1.15;c.save();c.globalAlpha=.3;c.drawImage(el,(W-sw*s0)/2,(H-sh*s0)/2,sw*s0,sh*s0);c.restore();
    const s=Math.min(W/sw,H/sh);c.drawImage(el,(W-sw*s)/2,(H-sh*s)/2,sw*s,sh*s)}
   else{const s=Math.max(W/sw,H/sh);c.drawImage(el,(W-sw*s)/2,(H-sh*s)/2,sw*s,sh*s)}}}
 if(R.cfg.mark&&R.cfg.wm)vlMark(R)}
function vlMark(R){
 const {c,W}=R,u=W/1080,txt=R.cfg.wm,fs=34*u,y=(R.cfg.fmt==='story'?150:44)*u;
 c.save();c.font=`700 ${fs}px Inter,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif`;c.textBaseline='middle';
 const lg=MT&&MT.logo,lw=lg&&lg.naturalWidth?44*u:0,lh=lw?lw*(lg.naturalHeight/lg.naturalWidth):0,gap=lw?12*u:0;
 const w=c.measureText(txt).width+lw+gap+40*u,h=fs*1.7,x=(W-w)/2;
 rrect(c,x,y,w,h,h/2);c.fillStyle='rgba(11,15,20,.5)';c.fill();
 if(lw)c.drawImage(lg,x+20*u,y+(h-lh)/2,lw,lh);
 c.fillStyle='rgba(255,255,255,.95)';c.shadowColor='rgba(0,0,0,.5)';c.shadowBlur=6*u;c.textAlign='left';
 c.fillText(txt,x+20*u+lw+gap,y+h/2+u);c.restore()}
function vlPoster(){
 if(VL.run||!sess)return;const cv=$('#vlcv');if(!cv)return;
 const cfg=vlCfg(),F=VL_FMT[cfg.fmt],W=F.w/2,H=F.h/2;cv.width=W;cv.height=H;
 const R={c:cv.getContext('2d'),W,H,cfg,fit:cfg.fit};vlDraw(R,null);
 const u=W/1080;R.c.fillStyle='#9aa7b2';R.c.font=`600 ${54*u}px Inter,system-ui,sans-serif`;R.c.textAlign='center';R.c.textBaseline='middle';R.c.fillText('Touche Aperçu',W/2,H/2)}

/* ---------- Lecture / enregistrement ---------- */
function vlStatus(t){const e=$('#vlst');if(e)e.textContent=t||''}
function vlUI(state){
 const pv=$('#vlpv'),go=$('#vlgo');if(!pv||!go)return;
 pv.innerHTML=state==='preview'?`${ico('stop')} Arrêter`:`${ico('play')} Aperçu`;
 go.innerHTML=state==='rec'?`${ico('stop')} Annuler`:`${ico('film')} Créer la vidéo`;
 pv.disabled=state==='rec';go.disabled=state==='preview';
 document.querySelectorAll('.vl .seg,.vl .chips,#vlrows,.vl input,.vl .vlbar button').forEach(e=>e.classList.toggle('mtlock',!!state));
 if(!state){const b=$('#vlbar');if(b)b.style.width='0%'}}
function vlStop(msg){
 VL.tok++;const R=VL.run;
 if(R){R.ended=true;cancelAnimationFrame(R.raf);if(R.rec){R.rec.onstop=null;try{R.rec.stop()}catch(e){}}vlCleanup(R)}
 vlUI(null);vlStatus(msg||'')}
function vlCleanup(R){
 if(VL.run===R)VL.run=null;
 for(const e of R.pool){try{e.pause()}catch(x){}}
 if(R.music)try{R.music.stop()}catch(e){}
 if(R.vs)R.vs.getTracks().forEach(t=>t.stop());
 if(R.wl)R.wl.release().catch(()=>{});
 vlUI(null)}
/* charge la séquence i sur son lecteur et se place au début du passage */
function vlPrep(R,i){
 const x=R.list[i];if(!x)return Promise.resolve();
 if(R.ready[i])return R.ready[i];
 R.ready[i]=new Promise(res=>{
  if(x.photo){const im=new Image();im.onload=()=>{R.img[i]=im;res()};im.onerror=()=>res();im.src=vlURL(x.m);return}
  const el=R.pool[i%R.pool.length],u=vlURL(x.m);
  let done=false;const fin=()=>{if(done)return;done=true;clearTimeout(to);res()};
  const to=setTimeout(fin,8000);
  const seek=()=>{el.onseeked=()=>{el.onseeked=null;fin()};try{el.currentTime=x.a}catch(e){fin()}};
  if(el.dataset.src===u&&el.readyState>=1)seek();
  else{el.dataset.src=u;el.onloadedmetadata=()=>{el.onloadedmetadata=null;seek()};el.src=u;el.load()}});
 return R.ready[i]}
async function vlStart(R,i){
 R.i=i;const x=R.list[i];
 if(!x){vlEnd(R);return}
 await vlPrep(R,i);if(R.ended)return;
 R.cur=x.photo?R.img[i]:R.pool[i%R.pool.length];R.t0=performance.now();
 R.pool.forEach((e,j)=>{if(R.gains[j])R.gains[j].gain.value=(j===i%R.pool.length&&!x.photo)?R.cfg.vo:0});
 if(!x.photo){const p=R.cur.play();if(p&&p.catch)p.catch(()=>{})}
 /* on prépare les deux suivantes pendant que celle-ci joue */
 setTimeout(()=>{if(!R.ended){vlPrep(R,i+1);vlPrep(R,i+2)}},50)}
function vlNext(R){
 const x=R.list[R.i];R.done+=vlLen(x);
 if(!x.photo&&R.cur)R.cur.pause();
 R.cur=null; /* l'image reste figée sur la dernière vue le temps de lancer la suivante */
 delete R.ready[R.i];delete R.img[R.i];
 vlStart(R,R.i+1)}
function vlTick(){
 const R=VL.run;if(!R||R.ended)return;
 const x=R.list[R.i];
 if(x&&R.cur){
  const el=R.cur,wall=(performance.now()-R.t0)/1000,len=vlLen(x);
  const pos=x.photo?wall:Math.max(0,el.currentTime-x.a);
  vlDraw(R,el);
  const t=R.done+Math.min(pos,len),b=$('#vlbar');if(b)b.style.width=Math.round(t/R.total*100)+'%';
  vlStatus(`${R.rec?'Enregistrement':'Aperçu'} · séquence ${R.i+1}/${R.list.length} · ${vlT(t)} / ${vlT(R.total)}`);
  const over=x.photo?wall>=len:(el.currentTime>=x.b-.02||el.ended||wall>len+2);
  if(over)vlNext(R)}
 R.raf=requestAnimationFrame(vlTick)}
function vlEnd(R){
 if(R.ended)return;R.ended=true;cancelAnimationFrame(R.raf);
 R.pool.forEach(e=>{try{e.pause()}catch(x){}});
 if(R.mg&&R.ctx){const t=R.ctx.currentTime;R.mg.gain.cancelScheduledValues(t);R.mg.gain.setValueAtTime(R.mg.gain.value,t);R.mg.gain.linearRampToValueAtTime(0,t+.5)}
 if(!R.rec){setTimeout(()=>vlCleanup(R),550);vlStatus('Aperçu terminé');return}
 vlStatus('Finalisation de la vidéo…');
 setTimeout(()=>{
  R.rec.onstop=()=>{const type=(R.rec.mimeType||R.mime||'video/mp4').split(';')[0],blob=new Blob(R.chunks,{type});vlCleanup(R);
   if(blob.size)vlDone(R,blob,type);else{vlStatus('');infoDlg('Vidéo vide','<p>Le navigateur n’a rien enregistré. Réessaie en gardant l’app ouverte et l’écran allumé.</p>')}};
  try{R.rec.stop()}catch(e){vlCleanup(R)}},600)}
async function vlRun(rec){
 if(VL.run){vlStop('Arrêté');return}
 const cfg=vlCfg(),list=vlList().filter(x=>!cfg.off[x.id]);
 if(!list.length){vlStatus('Aucune séquence cochée');return}
 if(rec&&!(window.MediaRecorder&&HTMLCanvasElement.prototype.captureStream)){
  infoDlg('Création impossible ici','<p>Ce navigateur ne sait pas enregistrer de vidéo. Mets à jour ton iPhone ou utilise Safari / Chrome à jour.</p>');return}
 /* tout ce qui touche au son doit se faire pendant le toucher (obligatoire sur iPhone) */
 let ctx=null;
 try{const AC=window.AudioContext||window.webkitAudioContext;if(AC){ctx=MT.ctx&&MT.ctx.state!=='closed'?MT.ctx:(MT.ctx=new AC());ctx.resume().catch(()=>{})}}catch(e){ctx=null}
 if(!VL.pool){VL.pool=[0,1,2].map(()=>{const v=document.createElement('video');v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';
  v.style.cssText='position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none;z-index:-1';document.body.appendChild(v);return v});VL.gains=[]}
 const first=list.find(x=>!x.photo);
 /* on « débloque » les 3 lecteurs pendant le toucher (iPhone), et on attend la fin avant de lancer le montage */
 const bless=VL.blessed?[]:VL.pool.map(v=>{v.muted=false;if(first&&!v.src){v.dataset.src=vlURL(first.m);v.src=v.dataset.src}
  try{const p=v.play();if(p&&p.then)return p.then(()=>v.pause(),()=>v.pause());v.pause()}catch(e){}return Promise.resolve()});
 VL.blessed=true;
 if(ctx&&!VL.gains.length){try{VL.pool.forEach((v,j)=>{const s=ctx.createMediaElementSource(v),g=ctx.createGain();g.gain.value=0;s.connect(g);VL.gains[j]=g})}catch(e){VL.gains=[]}}
 const tok=++VL.tok;vlUI(rec?'rec':'preview');
 if(bless.length)await Promise.race([Promise.all(bless),new Promise(r=>setTimeout(r,2000))]);
 vlStatus('Préparation des séquences…');
 await vlFillWhole(list);if(tok!==VL.tok||!$('#vlcv'))return;
 const L=list.filter(x=>vlLen(x)>.2);if(!L.length){vlUI(null);vlStatus('Séquences illisibles');return}
 let mus=null;
 if(ctx&&cfg.mus&&cfg.vm>0){vlStatus('Chargement de la musique…');try{if(!MT.musics||!MT.musics.length)MT.musics=await mtMusicAll();mus=await mtMusicBuf(ctx,cfg.mus)}catch(e){mus=null}if(tok!==VL.tok)return}
 const cv=$('#vlcv'),F=VL_FMT[cfg.fmt];cv.width=F.w;cv.height=F.h;
 const R={cv,c:cv.getContext('2d'),W:F.w,H:F.h,cfg,fit:cfg.fit,list:L,total:L.reduce((a,x)=>a+vlLen(x),0),pool:VL.pool,gains:VL.gains,ready:{},img:{},done:0,i:0,ctx,ended:false};
 if(ctx){R.out=ctx.createGain();R.out.connect(ctx.destination);R.gains.forEach(g=>{try{g.disconnect()}catch(e){}g.connect(R.out)})}
 if(ctx&&mus){const s=ctx.createBufferSource(),g=ctx.createGain(),t=ctx.currentTime;s.buffer=mus;s.loop=true;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(cfg.vm,t+.6);s.connect(g);g.connect(R.out);s.start(t);R.music=s;R.mg=g}
 if(rec){
  try{R.mime=mtMime();R.vs=cv.captureStream(30);const tr=[...R.vs.getVideoTracks()];
   if(ctx){const d=ctx.createMediaStreamDestination();R.out.connect(d);tr.push(...d.stream.getAudioTracks())}
   const opt={videoBitsPerSecond:8e6,audioBitsPerSecond:160000};if(R.mime)opt.mimeType=R.mime;
   R.rec=new MediaRecorder(new MediaStream(tr),opt);R.chunks=[];R.rec.ondataavailable=e=>{if(e.data&&e.data.size)R.chunks.push(e.data)}}
  catch(e){vlCleanup(R);infoDlg('Création impossible','<p>L’enregistrement vidéo n’a pas pu démarrer sur cet appareil.</p>');return}}
 VL.run=R;
 try{if(navigator.wakeLock)navigator.wakeLock.request('screen').then(w=>{R.wl=w}).catch(()=>{})}catch(e){}
 vlStatus('Chargement de la première séquence…');
 await vlPrep(R,0);if(R.ended)return;
 vlDraw(R,R.list[0].photo?R.img[0]:R.pool[0]);
 if(R.rec)R.rec.start(1000);
 await vlStart(R,0);
 R.raf=requestAnimationFrame(vlTick)}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&VL.run){const rec=!!VL.run.rec;vlStop('Arrêté');if(rec)VL.cut=true}
 else if(!document.hidden&&VL.cut){VL.cut=false;infoDlg('Création interrompue','<p>L’app est passée en arrière-plan. Relance « Créer la vidéo » en gardant l’écran allumé et l’app ouverte jusqu’à la fin.</p>')}});
function vlDone(R,blob,type){
 vlStatus('Vidéo prête');
 const ext=/mp4/.test(type)?'mp4':'webm',name=`vlog_${slug(sess.name)||'nettoyage'}_${R.cfg.fmt}_${new Date().toISOString().slice(0,10)}.${ext}`;
 const u=URL.createObjectURL(blob),d=$('#dlg');
 d.innerHTML=`<h3>Vidéo prête</h3><video src="${u}" controls playsinline></video>
 <p class="small-hint">${esc(VL_FMT[R.cfg.fmt].l)} · ${R.list.length} séquences · ${vlT(R.total)} · ${fmtSize(blob.size)}</p>
 <div style="display:grid;gap:8px;margin-top:10px"><button class="primary" id="vlsh">${ico('upload')} Enregistrer dans Photos / partager</button><button id="vldl">${ico('import')} Télécharger</button><button id="cl">Fermer</button></div>`;
 const file=new File([blob],name,{type});
 $('#vlsh').onclick=async()=>{try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file]});return}}catch(e){if(e.name==='AbortError')return}dl(blob,name)};
 $('#vldl').onclick=()=>dl(blob,name);$('#cl').onclick=()=>d.close();
 d.onclose=()=>{d.onclose=null;URL.revokeObjectURL(u)};d.showModal()}

/* ---------- Écran ---------- */
function vlRows(){
 const cfg=vlCfg(),list=vlList(),el=$('#vlrows');if(!el)return;
 const srcN=new Map();let n=0;for(const x of vlChrono(vlAll()))if(!srcN.has(x.m.id))srcN.set(x.m.id,++n);
 const on=list.filter(x=>!cfg.off[x.id]),tot=on.reduce((a,x)=>a+(vlLen(x)||0),0);
 $('#vlsum').textContent=`${on.length}/${list.length} séquences${tot?' · '+vlT(tot):''}${list.some(x=>x.whole&&!x.b)?' + vidéos entières':''}`;
 el.innerHTML=list.map((x,j)=>{const off=!!cfg.off[x.id],when=x.m.cdate?new Date(x.m.cdate).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'';
  const what=x.photo?'Photo':x.whole?'Vidéo entière':`${vlT(x.a)} → ${vlT(x.b)} · ${(x.b-x.a).toFixed(1).replace('.',',')} s`;
  return `<div class="vlr ${off?'off':''}" data-id="${esc(x.id)}"><span class="vln">${j+1}</span><div class="vlth">${VL.thumbs.has(x.id)?`<img src="${VL.thumbs.get(x.id)}" alt="">`:''}</div>
  <div class="sp vlx"><b>${x.m.zone==='_rush'||x.m.zone==='_raw'?(x.photo?'Photo ':'Vidéo ')+srcN.get(x.m.id):esc((typeof PH!=='undefined'&&PH[x.m.phase])||'')}${when?` <small>· ${when}</small>`:''}</b><small>${what}</small></div>
  <button class="ic-only" data-up ${j?'':'disabled'} aria-label="Monter">${ico('chev-l','vlup')}</button><button class="ic-only" data-dn ${j<list.length-1?'':'disabled'} aria-label="Descendre">${ico('chev-r','vldn')}</button>
  <button class="ic-only" data-tog aria-label="${off?'Remettre':'Retirer'}">${ico(off?'circle':'check-circle')}</button></div>`}).join('')||'<div class="hint">Aucune séquence : découpe d’abord ton rush (bouton « Trouver les passages »), ou importe des vidéos.</div>';
 el.onclick=e=>{if(VL.run)return;const row=e.target.closest('[data-id]');if(!row)return;const id=row.dataset.id;
  if(e.target.closest('[data-tog]')){if(cfg.off[id])delete cfg.off[id];else cfg.off[id]=true;vlSave();vlRows();return}
  const up=e.target.closest('[data-up]'),dn=e.target.closest('[data-dn]');if(!up&&!dn)return;
  const ids=vlList().map(x=>x.id),j=ids.indexOf(id),k=up?j-1:j+1;if(j<0||k<0||k>=ids.length)return;
  [ids[j],ids[k]]=[ids[k],ids[j]];cfg.order=ids;vlSave();vlRows()}}
function vlMusUI(){
 const cfg=vlCfg(),el=$('#vlmus');if(!el)return;
 el.innerHTML=`<label class="rng">Son d’origine des vidéos <b id="vlvov">${Math.round(cfg.vo*100)} %</b><input type="range" id="vlvo" min="0" max="100" step="5" value="${Math.round(cfg.vo*100)}"></label>
 <div class="lbl" style="margin-top:14px">Musique en fond</div>
 <div class="chips" id="vlml"><button data-m="" class="${cfg.mus?'':'on'}">Aucune</button>${(MT.musics||[]).map(m=>`<button data-m="${esc(m.id)}" class="${m.id===cfg.mus?'on':''}">${ico('music')}${esc(m.name)}</button>`).join('')}</div>
 <button id="vlimp" style="width:100%">${ico('import')} Importer une musique</button>
 ${cfg.mus?`<label class="rng">Volume de la musique <b id="vlvmv">${Math.round(cfg.vm*100)} %</b><input type="range" id="vlvm" min="0" max="100" step="5" value="${Math.round(cfg.vm*100)}"></label>`:''}`;
 $('#vlml').onclick=e=>{const b=e.target.closest('[data-m]');if(!b||VL.run)return;cfg.mus=b.dataset.m;lsSet('pb_mt_mus',cfg.mus);vlSave();vlMusUI()};
 $('#vlimp').onclick=()=>{if(VL.run)return;const inp=document.createElement('input');inp.type='file';inp.accept='audio/*,.mp3,.m4a,.aac,.wav';
  inp.onchange=async()=>{const f=inp.files&&inp.files[0];if(!f)return;const m={id:crypto.randomUUID(),name:(f.name||'Musique').replace(/\.[^.]+$/,'').slice(0,60),blob:f,ts:Date.now()};
   try{await mtMusicPut(m)}catch(e){toast('Impossible d’enregistrer cette musique');return}
   MT.musics=[...(MT.musics||[]),m];cfg.mus=m.id;lsSet('pb_mt_mus',m.id);vlSave();vlMusUI()};inp.click()};
 const r=(id,lab,k)=>{const x=$('#'+id);if(x)x.oninput=()=>{cfg[k]=x.value/100;$('#'+lab).textContent=x.value+' %';vlSave()}};
 r('vlvo','vlvov','vo');r('vlvm','vlvmv','vm')}
async function vlOpen(){
 if(!sess)return;
 if(typeof mtStop==='function')mtStop();
 revoke();document.body.classList.remove('has-tab');
 const open=++VL.open,cfg=vlCfg();
 try{MT.musics=await mtMusicAll()}catch(e){MT.musics=[]}
 if(cfg.mus&&!MT.musics.some(m=>m.id===cfg.mus))cfg.mus='';
 if(!MT.logo)loadImg('images/logo-ab.png').then(i=>{MT.logo=i;vlPoster()}).catch(()=>{});
 $('#app').innerHTML=`<header><div class="row"><button id="back" class="ic-only" aria-label="Retour">${ico('back')}</button><div class="sp ht"><b>Vlog TikTok / Insta</b><small>${esc(sess.name)}</small></div></div></header>
 <div class="mt vl">
  <div class="mtv"><canvas id="vlcv" width="540" height="960"></canvas><div class="bar"><i id="vlbar"></i></div><div class="mtst" id="vlst"></div></div>
  <div class="row mtgo"><button class="sp" id="vlpv">${ico('play')} Aperçu</button><button class="sp primary" id="vlgo">${ico('film')} Créer la vidéo</button></div>
  <div class="hint">Les séquences passent dans l’ordre ci-dessous, sans intro ni texte : seulement « ${esc(cfg.wm)} » en haut. Garde l’écran allumé et l’app ouverte pendant la création (elle dure autant que la vidéo).</div>
  <div class="lbl">Séquences dans l’ordre du tournage · <span id="vlsum"></span></div>
  <div class="row vlbar"><button class="sp" id="vlchr">${ico('clipboard')} Remettre l’ordre du tournage</button><button class="sp" id="vlall">${ico('check-circle')} Tout cocher</button></div>
  <div id="vlrows"></div>
  <div class="lbl">Format</div><div class="seg" id="vlfmt"></div>
  <div class="lbl">Cadrage</div><div class="seg" id="vlfit"></div>
  <div class="lbl">Son</div><div id="vlmus"></div>
  <div class="lbl">Marque à l’écran</div>
  <div class="row"><input type="text" id="vlwm" maxlength="40" value="${esc(cfg.wm)}" style="flex:1"><button id="vlmk" class="ic-only" aria-label="Afficher ou masquer">${ico(cfg.mark?'check-circle':'circle')}</button></div>
 </div>`;
 $('#back').onclick=()=>{vlStop();VL.open++;VL.thumbs.clear();vlFreeURLs();hub()};
 $('#vlpv').onclick=()=>vlRun(false);$('#vlgo').onclick=()=>vlRun(true);
 $('#vlchr').onclick=()=>{if(VL.run)return;cfg.order=null;vlSave();vlRows();toast('Ordre du tournage remis')};
 $('#vlall').onclick=()=>{if(VL.run)return;cfg.off={};vlSave();vlRows()};
 const seg=(id,O,k,key)=>{const el=$('#'+id);el.innerHTML=Object.entries(O).map(([v,o])=>`<button data-v="${v}" class="${v===cfg[k]?'on':''}">${esc(o.l)}</button>`).join('');
  el.onclick=e=>{const b=e.target.closest('[data-v]');if(!b||VL.run)return;cfg[k]=b.dataset.v;lsSet(key,cfg[k]);vlSave();el.querySelectorAll('[data-v]').forEach(x=>x.classList.toggle('on',x===b));vlPoster()}};
 seg('vlfmt',VL_FMT,'fmt','pb_vl_fmt');seg('vlfit',VL_FIT,'fit','pb_vl_fit');
 $('#vlwm').oninput=e=>{cfg.wm=e.target.value.trim();vlSave();vlPoster()};
 $('#vlmk').onclick=()=>{cfg.mark=!cfg.mark;$('#vlmk').innerHTML=ico(cfg.mark?'check-circle':'circle');vlSave();vlPoster()};
 vlMusUI();vlPoster();
 $('#vlrows').innerHTML='<div class="hint">Lecture des dates de tournage…</div>';
 await vlDates();if(open!==VL.open)return;
 vlRows();window.scrollTo(0,0);
 vlThumbs(vlList(),open)}
