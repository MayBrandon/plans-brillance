/* Plans Brillance · découpage d'un rush (lunettes Meta)
   Le long rush est importé une seule fois (gardé sur le téléphone). Pour chaque zone, on marque le moment à garder :
   ça crée un « passage » (début/fin dans le même fichier, rien n'est dupliqué). Les passages entrent dans le montage
   comme des vidéos de la zone, dans l'ordre du rush. */

const RS={ph:'avant',cur:null,stopAt:null,try:0,auto:null};
const RS_LEN={2:{l:'2 s'},3:{l:'3 s'},4:{l:'4 s'},5:{l:'5 s'}};

(function(){const st=document.createElement('style');st.textContent=`
.rs{padding:0 16px 40px}
.rs video{display:block;width:100%;max-height:46vh;background:#000;border-radius:14px;border:1px solid var(--line);margin-top:14px}
.rs-t{display:flex;flex-direction:column;align-items:stretch;gap:8px;margin-top:10px}
.rs-t b{font-family:var(--font-mono);font-size:1.05rem;letter-spacing:.02em;text-align:center}
.rs-t .row button{flex:1;padding:10px 4px;font-size:.85rem}
.rs-c span{margin-right:4px}
.rs-z{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:10px;margin-bottom:8px}
.rs-z.has{border-color:color-mix(in srgb,var(--cyan) 55%,transparent)}
.rs-z .hd{display:flex;align-items:center;gap:10px}
.rs-z .hd span{flex:1;min-width:0;font-weight:700}
.rs-z .hd small{display:block;font-weight:400;color:var(--muted);font-size:.74rem}
.rs-z .hd button{flex:none;padding:10px 12px;font-size:.85rem;font-weight:800}
.rs-c{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.rs-c div{display:flex;align-items:center;gap:2px;border:1px solid var(--line);border-radius:99px;padding:2px 2px 2px 10px;font-family:var(--font-mono);font-size:.74rem;background:var(--ink)}
.rs-c button{padding:5px 8px;border-radius:99px;font-size:.78rem;border:none;background:transparent}
.rs-c button::before{display:none}
`;document.head.appendChild(st)})();

const rsFmt=s=>{s=Math.max(0,s);const m=Math.floor(s/60),r=s-m*60;return m+':'+(r<10?'0':'')+r.toFixed(1)};
/* iPhone : une vidéo sans type MIME ne se lit pas depuis un blob → on lui en donne un */
function rsPlayable(b,ext){if(!b||b.type)return b;const t=/mp4|m4v/i.test(ext||'')?'video/mp4':'video/quicktime';try{return new Blob([b],{type:t})}catch(e){return b}}
function rsList(){return media.filter(m=>m.zone==='_rush').sort((a,b)=>a.ts-b.ts)}
function rsCuts(){if(!Array.isArray(sess.cuts))sess.cuts=[];return sess.cuts}
/* passages d'une zone, sous forme de vidéos « virtuelles » pour le montage */
function rsItems(z,ph){
 if(!sess||!Array.isArray(sess.cuts))return [];
 const out=[];
 for(const c of sess.cuts)if(c.zone===z&&c.phase===ph){
  const r=media.find(m=>m.id===c.rush);if(!r)continue;
  if(r.type==='photo'){out.push({id:c.id,sid:sess.id,zone:c.zone,phase:c.phase,type:'photo',blob:r.blob,ext:r.ext,ts:r.fts||r.ts,src:r.id,cut:true});continue}
  out.push({id:c.id,sid:sess.id,zone:c.zone,phase:c.phase,type:'video',blob:rsPlayable(r.blob,r.ext),ext:r.ext,ts:(r.fts||r.ts)+c.a*1000,a:c.a,b:c.b,src:r.id,cut:true});
  if(typeof MT_DUR!=='undefined')MT_DUR.set(c.id,Math.max(.3,c.b-c.a))}
 return out}

async function rsImport(){
 rsPickFiles(async fs=>{
  $('#app').insertAdjacentHTML('beforeend',`<div class="hint" id="rsimpst" style="text-align:center">Import…</div>`);
  try{await rsAddFiles(fs,(k,n,f)=>{const st=$('#rsimpst');if(st)st.textContent=`Import ${k}/${n} (${Math.round(f.size/1048576)} Mo)… garde l’appli ouverte.`})}
  catch(e){const st=$('#rsimpst');if(st){st.className='hint warn';st.textContent='Impossible d’enregistrer un fichier : place insuffisante sur le téléphone ? ('+(e&&e.name||'erreur')+')'}return}
  rsOpen()})}

function rsOpen(){
 if(!sess)return;
 revoke();document.body.classList.remove('has-tab');
 const rs=rsList();
 if(!rs.some(r=>r.id===RS.cur))RS.cur=rs.length?rs[rs.length-1].id:null;
 const R=rs.find(r=>r.id===RS.cur),len=+lsGet('pb_rs_len','3')||3;
 const cuts=rsCuts(),mine=cuts.filter(c=>c.rush===RS.cur);
 let h=`<header><div class="row"><button id="back" class="ic-only" aria-label="Retour">${ico('back')}</button><div class="sp ht"><b>Découper un rush</b><small>${esc(sess.name)}</small></div></div></header><div class="rs">`;
 if(!R){
  h+=`<div class="hint" style="margin:16px 0">Importe tes vidéos en entier (lunettes, téléphone) et tes photos si tu veux. Claude trouve les meilleurs passages, ou tu les marques toi-même : l’appli découpe sans copier les vidéos.</div>
  <button class="primary" id="rsimp" style="width:100%;padding:16px">${ico('import')} Importer vidéos / photos</button></div>`;
  $('#app').innerHTML=h;$('#back').onclick=hub;$('#rsimp').onclick=rsImport;window.scrollTo(0,0);return}
 h+=`${rs.length>1?`<div class="chips" id="rsl" style="margin-top:12px">${rs.map((r,j)=>`<button data-r="${esc(r.id)}" class="${r.id===RS.cur?'on':''}">${ico('video')}Vidéo ${j+1}</button>`).join('')}</div>`:''}
 <video id="rsv" src="${url(rsPlayable(R.blob,R.ext))}" controls playsinline preload="auto"></video>
 <div class="hint" id="rsld" style="margin:8px 0 0;text-align:center">Chargement de la vidéo… (${Math.round((R.blob.size||0)/1048576)} Mo)</div>
 <div class="rs-t"><b id="rst">0:00.0</b><div class="row"><button data-s="-1">−1 s</button><button data-s="-0.2">−0,2</button><button data-s="0.2">+0,2</button><button data-s="1">+1 s</button></div></div>
 <div class="lbl">Phase</div><div class="seg" id="rsph"></div>
 <div class="aic"><div class="hd"><div class="bd">${ico('sparkles')}</div><div class="sp"><b>Découpage automatique</b><small>Claude choisit les passages et prépare le montage</small></div></div>
  <p>Claude regarde des images de toutes tes vidéos${rs.length>1?` (${rs.length})`:''}${media.some(m=>m.zone==='_raw')?' et photos':''}, garde les passages utilisables (toutes les séquences ou la meilleure par zone, selon ton choix), choisit l’accroche et prépare le montage. Tu valides les images avant l’envoi, les vidéos ne partent pas.</p>
  <textarea id="rscons" rows="2" maxlength="400" aria-label="Ta consigne pour Claude" placeholder="Consigne (facultatif) : ex. commence par le coffre">${esc(lsGet('pb_rs_cons_'+sess.id,''))}</textarea>
  <button id="rstout" class="rstg" style="width:100%;margin:8px 0;text-align:left"></button>
  <button class="primary go" id="rsauto">${ico('sparkles')} Trouver les passages</button></div>
 <div class="lbl">Ajuster à la main (facultatif)</div>
 <div class="hint" style="margin:0">Mets la vidéo au bon moment, puis touche « Marquer ici » sur la zone. Le passage dure ${len} s à partir de ce moment.</div>
 <div class="lbl">Durée de chaque passage</div><div class="seg" id="rslen"></div>
 <div class="lbl">Zones</div><div id="rsz"></div>
 <div class="ai-act" style="display:flex;flex-direction:column;gap:8px;margin-top:16px">
  <button class="primary" id="rset" style="padding:15px 8px" ${cuts.some(c=>c.phase==='avant')?'':'disabled'}>${ico('film')} Monter en « État des lieux »</button>
  <button class="primary" id="rstk" style="padding:15px 8px">${ico('video')} Vlog TikTok / Insta</button>
  <button id="rsmt" style="padding:15px 8px">Aller au montage</button>
  <div class="row"><button class="sp" id="rsimp">${ico('import')} Ajouter vidéos / photos</button><button class="sp" id="rsdel">${ico('trash')} Supprimer ce rush</button></div></div></div>`;
 $('#app').innerHTML=h;
 const v=$('#rsv'),tl=$('#rst');
 const upd=()=>{tl.textContent=rsFmt(v.currentTime)+' / '+rsFmt(isFinite(v.duration)?v.duration:0);
  if(RS.stopAt!==null&&v.currentTime>=RS.stopAt){v.pause();RS.stopAt=null}};
 v.ontimeupdate=upd;v.onseeked=upd;
 const ld=$('#rsld');
 v.onloadedmetadata=()=>{upd();if(ld)ld.style.display='none'};
 v.onerror=()=>{if(!ld)return;const c=v.error?v.error.code:0;ld.style.display='';ld.className='hint warn';
  ld.innerHTML=`La vidéo ne se lit pas (code ${c}${R.blob&&R.blob.type?' · '+esc(R.blob.type):''}). <button id="rsre" style="padding:6px 10px;margin-left:6px">Réessayer</button>`;
  const b=$('#rsre');if(b)b.onclick=()=>{ld.className='hint';ld.textContent='Chargement de la vidéo… (essai '+(++RS.try+1)+')';
   const vs=[R.blob,new Blob([R.blob],{type:'video/mp4'}),new Blob([R.blob],{type:'video/quicktime'})];v.src=url(vs[RS.try%vs.length]);v.load()}};
 /* 1er échec : on réessaie tout seul avec un autre type de vidéo */
 v.addEventListener('error',()=>{if(RS.auto===R.id)return;RS.auto=R.id;const b=$('#rsre');if(b)b.click()});
 setTimeout(()=>{if(ld&&ld.style.display!=='none'&&!v.error&&v.readyState<1){ld.textContent='Toujours en chargement… Si rien ne bouge, touche ▶ sur la vidéo.'}},8000);
 v.onpause=()=>{RS.stopAt=null};
 document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{v.pause();v.currentTime=Math.max(0,Math.min((v.duration||0)-.05,v.currentTime+parseFloat(b.dataset.s)))});
 mtChoice('rslen',RS_LEN,String(len),k=>{lsSet('pb_rs_len',k);rsOpen()});
 mtChoice('rsph',{avant:{l:'Avant'},pendant:{l:'Pendant'},apres:{l:'Après'}},RS.ph,k=>{RS.ph=k;rsZones()});
 const rl=$('#rsl');if(rl)rl.onclick=e=>{const b=e.target.closest('[data-r]');if(b){RS.cur=b.dataset.r;rsOpen()}};
 $('#back').onclick=()=>{v.pause();hub()};
 const rc=$('#rscons');rc.oninput=()=>lsSet('pb_rs_cons_'+sess.id,rc.value);
 const tg=$('#rstout'),tgd=()=>{const on=lsGet('pb_rs_tout','1')==='1';tg.innerHTML=`${ico(on?'check-circle':'circle')} Garder toutes les séquences utilisables${on?'':' · sinon : la meilleure par zone'}`;tg.classList.toggle('on',on)};
 tgd();tg.onclick=()=>{lsSet('pb_rs_tout',lsGet('pb_rs_tout','1')==='1'?'0':'1');tgd()};
 $('#rstk').onclick=()=>{v.pause();vlOpen()};
 $('#rsauto').onclick=()=>{v.pause();if(typeof aiPro!=='function'||!aiPro()){toast('Connecte ton espace pro pour utiliser Claude');return}rsAuto(R,rc.value.trim())};
 $('#rsimp').onclick=()=>{v.pause();rsImport()};
 $('#rsdel').onclick=async()=>{v.pause();
  if(!await askConfirm(`Supprimer ce rush et ses ${mine.length} passage(s) ? La vidéo d’origine reste dans ta galerie.`))return;
  await delMedia(R.id);media=media.filter(m=>m.id!==R.id);sess.cuts=cuts.filter(c=>c.rush!==R.id);await putSession(sess);RS.cur=null;rsOpen()};
 $('#rsmt').onclick=()=>{v.pause();if(typeof mtOpen==='function')mtOpen()};
 $('#rset').onclick=()=>{v.pause();const cfg=mtCfg();cfg.sty='etat';cfg.vm=null;cfg.vo=null;lsSet('pb_mt_sty','etat');mtSave();mtOpen()};
 rsZones();window.scrollTo(0,0)}

function rsZones(){
 const el=$('#rsz'),v=$('#rsv');if(!el||!v)return;
 const cuts=rsCuts(),len=+lsGet('pb_rs_len','3')||3;
 el.innerHTML=zonesFor(RS.ph).map(z=>{
  const cs=cuts.filter(c=>c.zone===z.id&&c.phase===RS.ph).sort((a,b)=>a.a-b.a);
  return `<div class="rs-z ${cs.length?'has':''}" data-z="${esc(z.id)}"><div class="hd"><span>${esc(z.l)}<small>${cs.length?cs.length+' passage(s)':'aucun passage'}</small></span><button class="primary" data-mk>Marquer ici</button></div>
  ${cs.length?`<div class="rs-c">${cs.map(c=>`<div data-c="${esc(c.id)}"><span data-go>${c.rush===RS.cur?'':'R· '}${rsFmt(c.a)} → ${rsFmt(c.b)}</span><button data-pl aria-label="Lire ce passage">▶</button><button data-sh="-0.5" aria-label="Raccourcir">−</button><button data-sh="0.5" aria-label="Allonger">+</button><button data-rm aria-label="Supprimer ce passage">✕</button></div>`).join('')}</div>`:''}</div>`}).join('');
 el.onclick=async e=>{
  const zr=e.target.closest('[data-z]');if(!zr)return;const z=zr.dataset.z;
  if(e.target.closest('[data-mk]')){
   if(!isFinite(v.duration)||!v.duration){toast('Attends que la vidéo soit chargée');return}
   v.pause();const a=Math.max(0,Math.min(v.currentTime,v.duration-.3)),b=Math.min(v.duration,a+len);
   cuts.push({id:'cut_'+crypto.randomUUID(),rush:RS.cur,zone:z,phase:RS.ph,a:+a.toFixed(2),b:+b.toFixed(2),ts:Date.now()});
   await putSession(sess);toast('Passage ajouté : '+rsFmt(a)+' → '+rsFmt(b));rsZones();rsOpenBtn();return}
  const cr=e.target.closest('[data-c]');if(!cr)return;const c=cuts.find(x=>x.id===cr.dataset.c);if(!c)return;
  if(c.rush!==RS.cur){RS.cur=c.rush;rsOpen();return}
  if(e.target.closest('[data-pl]')){v.currentTime=c.a;RS.stopAt=c.b;const p=v.play();if(p&&p.catch)p.catch(()=>{});return}
  if(e.target.closest('[data-go]')){v.pause();v.currentTime=c.a;return}
  const sh=e.target.closest('[data-sh]');
  if(sh){c.b=+Math.max(c.a+.5,Math.min(v.duration||c.b+1,c.b+parseFloat(sh.dataset.sh))).toFixed(2);if(typeof MT_DUR!=='undefined')MT_DUR.delete(c.id);await putSession(sess);rsZones();return}
  if(e.target.closest('[data-rm]')){sess.cuts=cuts.filter(x=>x.id!==c.id);await putSession(sess);rsZones();rsOpenBtn()}}}
function rsOpenBtn(){const b=$('#rset');if(b)b.disabled=!rsCuts().some(c=>c.phase==='avant')}

/* ---------- découpage automatique avec Claude ---------- */
function rsDur(blob){return new Promise(res=>{const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='metadata';
 const u=URL.createObjectURL(blob);const end=d=>{clearTimeout(to);v.removeAttribute('src');v.load();URL.revokeObjectURL(u);res(d)};
 const to=setTimeout(()=>end(0),15000);v.onloadedmetadata=()=>end(isFinite(v.duration)?v.duration:0);v.onerror=()=>end(0);v.src=u})}
function rsGrab(blob,times,onp){return new Promise(res=>{
 /* iPhone : ne jamais attendre « loadeddata » (Safari ne charge pas l'image tant qu'on ne lit pas) ;
    on part des métadonnées, on force le décodage d'une image, et chaque étape a un délai max */
 const v=document.createElement('video');v.muted=true;v.defaultMuted=true;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('muted','');v.preload='auto';
 v.style.cssText='position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none';document.body.appendChild(v);
 const u=URL.createObjectURL(blob),out=[];let done=false,started=false;
 const end=()=>{if(done)return;done=true;clearTimeout(to);v.pause();v.removeAttribute('src');v.load();v.remove();URL.revokeObjectURL(u);res(out)};
 const to=setTimeout(()=>{if(!started)end()},20000); /* vidéo illisible : on passe à la suivante */
 const wait=(ev,ms)=>new Promise(ok=>{let t;const f=()=>{clearTimeout(t);v.removeEventListener(ev,f);ok(true)};t=setTimeout(()=>{v.removeEventListener(ev,f);ok(false)},ms);v.addEventListener(ev,f)});
 const frame=async()=>{if(v.readyState>=2)return;try{const p=v.play();if(p&&p.then)await Promise.race([p,new Promise(r=>setTimeout(r,1500))])}catch(e){}v.pause();if(v.readyState<2)await wait('canplay',2500)};
 v.onerror=end;
 v.onloadedmetadata=async()=>{if(started)return;started=true;clearTimeout(to);
  await frame();let k=0;
  for(const t of times){if(done)return;
   const tt=Math.min(Math.max(0,t),Math.max(0,(v.duration||t)-.1));
   const sk=wait('seeked',6000);try{v.currentTime=tt}catch(e){}await sk;
   if(v.readyState<2)await frame();
   try{if(v.videoWidth&&v.readyState>=2)out.push({t,...aiJpeg(v,v.videoWidth,v.videoHeight,512),off:false})}catch(e){}
   if(onp)onp(++k,times.length)}
  end()};
 v.src=u;v.load()})}
/* toutes les sources du nettoyage : vidéos (lunettes, téléphone) et photos ajoutées, dans l'ordre de prise de vue */
function rsSources(){
 const vs=media.filter(m=>m.zone==='_rush'),ps=media.filter(m=>m.zone==='_raw'&&m.type==='photo');
 const all=[...vs,...ps].sort((a,b)=>(a.fts||a.ts)-(b.fts||b.ts));let nv=0,np=0;
 return all.map(m=>({m,id:m.type==='photo'?'p'+(++np):'v'+(++nv),photo:m.type==='photo'}))}
/* ajoute des vidéos et/ou photos au nettoyage en cours */
async function rsAddFiles(files,onp){
 let k=0;
 for(const f of files){
  const isV=(f.type||'').startsWith('video')||/\.(mov|mp4|m4v)$/i.test(f.name||'');
  let ext=((f.name||'').split('.').pop()||'').toLowerCase().replace(/[^a-z0-9]/g,'')||(isV?'mov':'jpg'),blob=f;
  if(onp)onp(++k,files.length,f);
  if(!isV){try{const c=await compressPhoto(f);blob=c.blob;if(c.ext)ext=c.ext}catch(e){}}
  const m={id:crypto.randomUUID(),sid:sess.id,zone:isV?'_rush':'_raw',phase:'avant',type:isV?'video':'photo',blob,ext,ts:Date.now()+k,fts:f.lastModified||Date.now(),name:(f.name||'').slice(0,60)};
  await putMedia(m);media.push(m);if(isV)RS.cur=m.id}
 return k}
function rsPickFiles(cb){const inp=document.createElement('input');inp.type='file';inp.multiple=true;inp.accept='video/*,image/*,.mov,.mp4,.m4v';
 inp.onchange=()=>{const fs=[...(inp.files||[])];if(fs.length)cb(fs)};inp.click()}
async function rsAddAndRun(fs,cons,ph){
 $('#app').innerHTML=aiHead('Ajout des fichiers',sess.name)+`<div class="ai-scr"><div class="ai-wait"><div class="sp1"></div><div id="aipg">Import…</div></div></div>`;
 $('#aib').onclick=()=>hub();
 try{await rsAddFiles(fs,(k,n,f)=>{const e=$('#aipg');if(e)e.textContent=`Import ${k}/${n} (${Math.round(f.size/1048576)} Mo)… garde l’appli ouverte.`})}
 catch(e){const e2=$('#aipg');if(e2)e2.textContent='Impossible d’enregistrer un fichier (place insuffisante ?).';return}
 rsAuto(null,cons,ph)}

async function rsAuto(R,cons,phase){
 const run=++MT.open,ph=phase||RS.ph,src=rsSources();
 $('#app').innerHTML=aiHead('Découpage automatique',sess.name)+`<div class="ai-scr"><div class="ai-wait"><div class="sp1"></div><div id="aipg">Lecture des vidéos…</div></div></div>`;
 $('#aib').onclick=()=>{MT.open++;if(ph==='auto')hub();else rsOpen()};
 const pg=t=>{const e=$('#aipg');if(e)e.textContent=t};
 if(!src.length){pg('Aucune vidéo ni photo à analyser.');return}
 {let q=0;const nv=src.filter(s=>!s.photo).length;for(const s of src)if(!s.photo){pg(`Lecture des vidéos ${++q}/${nv}…`);s.dur=await rsDur(rsPlayable(s.m.blob,s.m.ext));if(run!==MT.open)return}}
 /* 64 images au total : 1 par photo (16 max), le reste réparti entre les vidéos selon leur durée */
 const phs=src.filter(s=>s.photo).slice(0,16),vids=src.filter(s=>!s.photo&&s.dur>0);
 if(!vids.length&&!phs.length){pg('Impossible de lire ces vidéos sur ce téléphone.');return}
 const B=64-phs.length,tot=vids.reduce((a,s)=>a+s.dur,0);
 for(const s of vids)s.n=Math.max(3,Math.min(Math.round(s.dur/1.2)+1,Math.round(B*s.dur/(tot||1))));
 let sum=vids.reduce((a,s)=>a+s.n,0);while(sum>B){const b=vids.reduce((a,s)=>s.n>a.n?s:a);if(b.n<=2)break;b.n--;sum--}
 const fr=[];let k=0;const all=vids.reduce((a,s)=>a+s.n,0)+phs.length;
 for(const s of src){
  if(run!==MT.open)return;
  if(s.photo){if(!phs.includes(s))continue;pg(`Préparation des images ${++k}/${all}…`);
   try{const im=await flLoadImg(s.m.blob);if(im){const r=aiJpeg(im,im.naturalWidth||im.width,im.naturalHeight||im.height,512);fr.push({src:s.id,t:0,...r,off:false,photo:true})}}catch(e){}continue}
  if(!s.n)continue;
  const times=[];for(let i=0;i<s.n;i++)times.push(+(((i+.5)*s.dur/s.n)).toFixed(2));
  const f=await rsGrab(rsPlayable(s.m.blob,s.m.ext),times,()=>pg(`Préparation des images ${++k}/${all}… (vidéo ${s.id.toUpperCase()}) Garde l’appli ouverte et l’écran allumé.`));
  if(f.length<s.n)k+=s.n-f.length;
  f.forEach(x=>x.src=s.id);fr.push(...f)}
 if(run!==MT.open)return;
 if(!fr.length){pg('Impossible d’extraire des images de ces fichiers.');return}
 rsValid(src,fr,cons,ph)}

function rsValid(src,fr,cons,ph){
 const est=()=>{const k=fr.filter(x=>!x.off);return (k.reduce((a,x)=>a+aiTok(x.w,x.h),0)+2000)*AI_PRICE.in/1e6+2500*AI_PRICE.out/1e6};
 const nv=src.filter(s=>!s.photo).length,np=src.filter(s=>s.photo).length,multi=src.length>1;
 const lab=x=>x.photo?(multi?x.src.toUpperCase()+' · ':'')+'photo':(multi?x.src.toUpperCase()+' · ':'')+rsFmt(x.t);
 $('#app').innerHTML=aiHead('Découpage automatique',sess.name)+`<div class="ai-scr">
  <h2>Ces images vont être envoyées</h2>
  <div class="hint" style="margin:0"><b id="ain"></b> tirées de ${nv} vidéo${nv>1?'s':''}${np?` et ${np} photo${np>1?'s':''}`:''}${ph==='auto'?'':', phase '+esc(PH[ph])}. Les vidéos restent sur ton téléphone.${cons?`<br>Ta consigne : « ${esc(cons)} »`:''}</div>
  <button id="rsadd" style="width:100%;margin-top:12px">${ico('import')} Ajouter d’autres vidéos ou photos</button>
  <div class="ai-grid" id="aigr">${fr.map((x,j)=>`<button data-j="${j}" aria-label="${esc(lab(x))}"><img src="${x.url}" alt=""><span style="position:absolute;left:4px;bottom:3px;font:600 10px var(--font-mono);color:#fff;text-shadow:0 1px 2px #000">${esc(lab(x))}</span></button>`).join('')}</div>
  <div class="ai-box"><div><span>Modèle</span><b>Opus 5.5 · le plus précis</b></div><div><span>Coût estimé</span><b id="aic1" style="color:var(--cyan)"></b></div><div><span>Dépensé ce mois</span><b>${aiSpent().usd.toFixed(2).replace('.',',')} $</b></div></div>
  <div class="ai-warn">Vérifie qu’on ne voit pas de plaque, de visage ou de papiers. Touche une image pour la retirer de l’envoi.</div>
  <div class="ai-act"><button class="primary" id="aiok"></button><button id="aino">Annuler</button></div></div>`;
 const draw=()=>{const k=fr.filter(x=>!x.off).length;$('#ain').textContent=`${k} image${k>1?'s':''}`;$('#aic1').textContent='≈ '+aiEur(est());
  const b=$('#aiok');b.disabled=!k;b.innerHTML=`${ico('sparkles')} Valider l’envoi · ≈ ${aiEur(est())}`};
 draw();
 $('#rsadd').onclick=()=>{if(!AI.busy)rsPickFiles(fs=>rsAddAndRun(fs,cons,ph))};
 $('#aigr').onclick=e=>{const b=e.target.closest('[data-j]');if(!b||AI.busy)return;const x=fr[+b.dataset.j];x.off=!x.off;b.classList.toggle('off',x.off);draw()};
 const back=()=>{if(AI.busy)return;if(ph==='auto')hub();else rsOpen()};$('#aib').onclick=back;$('#aino').onclick=back;
 $('#aiok').onclick=async()=>{
  if(AI.busy)return;const sel=fr.filter(x=>!x.off);if(!sel.length)return;
  AI.busy=true;const w=$('.ai-act');w.innerHTML=`<div class="ai-wait" style="padding:10px 0"><div class="sp1"></div>Claude regarde tes vidéos… (environ 30 à 60 s)</div>`;
  const zs=rsZoneList(ph),sent=new Set(sel.map(x=>x.src));
  const sources=src.filter(s=>sent.has(s.id)).map((s,i)=>({id:s.id,type:s.photo?'photo':'video',duree:s.photo?0:+s.dur.toFixed(1),ordre:i+1}));
  const tout=lsGet('pb_rs_tout','1')==='1';
  const j=await aiCall({mode:'decoupe',tout,titre:sess.name,prestation:tplOf(sess).l,phase:ph==='auto'?'auto':PH[ph],duree:+Math.max(0,...src.map(s=>s.dur||0)).toFixed(1),consigne:cons,
   sources,styles:ph==='auto'?Object.entries(MT_STY).filter(([k])=>k!=='ba').map(([k,v])=>({id:k,l:v.l,d:v.d})):[],
   zones:zs.map(z=>({id:z.id,l:z.l})),images:sel.map(x=>({src:x.src,t:x.t,data:x.b64}))});
  AI.busy=false;if(!$('.ai-act'))return;
  const ps=j.prop&&rsPassages(j.prop,zs,src.filter(s=>sent.has(s.id)),tout);
  if(j.error||!ps||!ps.length){
   w.innerHTML=`<div class="hint warn" style="margin:0">${esc(AI_ERR[j.error]||(j.error?'Claude a refusé la demande'+(j.detail?' : '+j.detail:'')+(j.status?' ('+j.status+')':''):'Claude n’a trouvé aucun passage utilisable.'))}${j.cost?'':' Rien n’a été débité.'}</div><button class="primary" id="aiok2">Réessayer</button><button id="aino2">Retour</button>`;
   $('#aiok2').onclick=()=>rsValid(src,fr,cons,ph);$('#aino2').onclick=back;return}
  /* on remplace les passages automatiques précédents */
  sess.cuts=rsCuts().filter(c=>!c.auto);
  const ids={},info={},L=[];
  ps.forEach((p,k)=>{const [pp,zz]=p.zone.split('|'),S=p.s;
   const c={id:'cut_'+crypto.randomUUID(),rush:S.m.id,zone:zz,phase:pp,ts:Date.now(),auto:true};
   if(S.photo)c.photo=true;else{c.a=p.debut;c.b=p.fin}
   sess.cuts.push(c);
   const id='m'+(k+1),d=S.photo?Math.min(3,Math.max(1.2,p.fin-p.debut||2)):+(p.fin-p.debut).toFixed(1);
   ids[id]=c.id;info[id]={id,ph:pp,zone:zs.find(z=>z.id===p.zone).l,type:S.photo?'photo':'video',dur:d};
   L.push({id,vu:p.vu,texte:p.texte,duree:d})});
  const cfg=mtCfg();
  cfg.ai={prop:{titre:String(j.prop.titre||'').slice(0,50),accroche:L[0],plans:L.slice(1),ecartes:[],conseil:''},ids,info,on:true,cost:j.cost||0,ts:Date.now(),sent:[]};
  const onlyAv=ps.every(p=>p.zone.startsWith('avant|'));
  let sty=onlyAv?'etat':(MT_STY[j.prop.style]&&!['ba','etat'].includes(j.prop.style)?j.prop.style:'edit');
  if(ph==='avant')sty='etat';
  aiApply(cfg);cfg.sty=sty;cfg.vm=null;cfg.vo=null;lsSet('pb_mt_sty',sty);
  await putSession(sess);
  AI.status='ok';mtOpen();toast(`Claude a gardé ${ps.length} passages · touche « Créer la vidéo »`)}}
/* zones proposées à Claude : « phase|zone » ; en mode auto, toutes les phases */
function rsZoneList(ph){
 const out=[];
 for(const p of ph==='auto'?PHASES:[ph])for(const z of zonesFor(p))out.push({id:p+'|'+z.id,l:(ph==='auto'?PH[p]+' · ':'')+z.l});
 return out}
/* passages renvoyés par Claude → vérifiés (source et zone connues, une par zone, dans la vidéo, sans chevauchement) */
function rsPassages(p,zs,srcs,tout){
 const ok=new Set(zs.map(z=>z.id)),seen=new Set(),out=[],one=srcs.length===1?srcs[0]:null,mx=tout?10:6;
 for(const x of Array.isArray(p.passages)?p.passages:[]){
  if(out.length>=60)break;
  if(!x||!ok.has(x.zone)||(!tout&&seen.has(x.zone)))continue;
  const S=srcs.find(s=>s.id===String(x.source||'').toLowerCase())||one;if(!S)continue;
  let a=0,b=2.2;
  if(!S.photo){const dur=S.dur||0;a=Math.max(0,Math.min(dur-.5,+x.debut||0));b=Math.min(dur,+x.fin||a+3);
   if(b-a<1)b=Math.min(dur,a+2.5);if(b-a>mx)b=a+mx;if(b-a<.5)continue;
   if(out.some(o=>o.s===S&&a<o.fin&&b>o.debut))continue}
  else if(!tout&&out.some(o=>o.s===S))continue;
  else{const d=+x.fin-(+x.debut||0);if(d>=1&&d<=4)b=d}
  seen.add(x.zone);out.push({s:S,zone:x.zone,debut:+a.toFixed(2),fin:+b.toFixed(2),texte:String(x.texte||'').slice(0,40),vu:String(x.vu||'').slice(0,140)})}
 return out}

/* ---------- depuis l'accueil : vidéos brutes (+ photos) → l'IA trie et monte ---------- */
function rawStart(){
 if(typeof aiPro!=='function'||!aiPro()){toast('Connecte ton espace pro (Réglages) pour utiliser Claude');return}
 rsPickFiles(async fs=>{
  let type=lsGet('pb_type_'+curAct,'');if(!TPL[type]||TPL[type].act!==curAct)type=(Object.entries(TPL).find(([k,t])=>t.act===curAct)||['auto-complet'])[0];
  const d=new Date(),s={id:crypto.randomUUID(),name:'Vidéo brute · '+d.toLocaleDateString('fr-FR')+' '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),ts:Date.now(),type,avantDone:false,pendantDone:false,apresDone:false,raw:true};
  try{await putSession(s)}catch(e){toast('Impossible de créer le nettoyage');return}
  sess=s;media=[];curAct=tplOf(s).act;
  rsAddAndRun(fs,'','auto')})}
