/* Plans Brillance · découpage d'un rush (lunettes Meta)
   Le long rush est importé une seule fois (gardé sur le téléphone). Pour chaque zone, on marque le moment à garder :
   ça crée un « passage » (début/fin dans le même fichier, rien n'est dupliqué). Les passages entrent dans le montage
   comme des vidéos de la zone, dans l'ordre du rush. */

const RS={ph:'avant',cur:null,stopAt:null};
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
  out.push({id:c.id,sid:sess.id,zone:c.zone,phase:c.phase,type:'video',blob:rsPlayable(r.blob,r.ext),ext:r.ext,ts:r.ts+c.a*1000,a:c.a,b:c.b,src:r.id,cut:true});
  if(typeof MT_DUR!=='undefined')MT_DUR.set(c.id,Math.max(.3,c.b-c.a))}
 return out}

async function rsImport(){
 const inp=document.createElement('input');inp.type='file';inp.accept='video/*,.mov,.mp4,.m4v';
 inp.onchange=async()=>{const f=inp.files&&inp.files[0];if(!f)return;
  const ext=((f.name.split('.').pop()||'').toLowerCase().replace(/[^a-z0-9]/g,''))||'mov';
  const m={id:crypto.randomUUID(),sid:sess.id,zone:'_rush',phase:'avant',type:'video',blob:f,ext,ts:Date.now(),name:(f.name||'Rush').slice(0,60)};
  $('#app').insertAdjacentHTML('beforeend',`<div class="hint" id="rsimpst" style="text-align:center">Import du rush (${Math.round(f.size/1048576)} Mo)… garde l’appli ouverte.</div>`);
  try{await putMedia(m)}catch(e){const st=$('#rsimpst');if(st){st.className='hint warn';st.textContent='Impossible d’enregistrer ce rush : place insuffisante sur le téléphone ? ('+(e&&e.name||'erreur')+')'}return}
  media.push(m);RS.cur=m.id;rsOpen()};
 inp.click()}

function rsOpen(){
 if(!sess)return;
 revoke();document.body.classList.remove('has-tab');
 const rs=rsList();
 if(!rs.some(r=>r.id===RS.cur))RS.cur=rs.length?rs[rs.length-1].id:null;
 const R=rs.find(r=>r.id===RS.cur),len=+lsGet('pb_rs_len','3')||3;
 const cuts=rsCuts(),mine=cuts.filter(c=>c.rush===RS.cur);
 let h=`<header><div class="row"><button id="back" class="ic-only" aria-label="Retour">${ico('back')}</button><div class="sp ht"><b>Découper un rush</b><small>${esc(sess.name)}</small></div></div></header><div class="rs">`;
 if(!R){
  h+=`<div class="hint" style="margin:16px 0">Importe la vidéo des lunettes en entier. Ensuite, pour chaque zone, tu touches le moment à garder : l’appli fait le découpage, sans copier la vidéo.</div>
  <button class="primary" id="rsimp" style="width:100%;padding:16px">${ico('import')} Importer le rush</button></div>`;
  $('#app').innerHTML=h;$('#back').onclick=hub;$('#rsimp').onclick=rsImport;window.scrollTo(0,0);return}
 h+=`${rs.length>1?`<div class="chips" id="rsl" style="margin-top:12px">${rs.map((r,j)=>`<button data-r="${esc(r.id)}" class="${r.id===RS.cur?'on':''}">${ico('video')}Rush ${j+1}</button>`).join('')}</div>`:''}
 <video id="rsv" src="${url(rsPlayable(R.blob,R.ext))}" controls playsinline preload="auto"></video>
 <div class="hint" id="rsld" style="margin:8px 0 0;text-align:center">Chargement de la vidéo… (${Math.round((R.blob.size||0)/1048576)} Mo)</div>
 <div class="rs-t"><b id="rst">0:00.0</b><div class="row"><button data-s="-1">−1 s</button><button data-s="-0.2">−0,2</button><button data-s="0.2">+0,2</button><button data-s="1">+1 s</button></div></div>
 <div class="hint" style="margin:8px 0 0">Mets la vidéo au bon moment, puis touche « Marquer ici » sur la zone. Le passage dure ${len} s à partir de ce moment.</div>
 <div class="lbl">Durée de chaque passage</div><div class="seg" id="rslen"></div>
 <div class="lbl">Phase</div><div class="seg" id="rsph"></div>
 <div class="lbl">Zones</div><div id="rsz"></div>
 <div class="ai-act" style="display:flex;flex-direction:column;gap:8px;margin-top:16px">
  <button class="primary" id="rset" style="padding:15px 8px" ${cuts.some(c=>c.phase==='avant')?'':'disabled'}>${ico('film')} Monter en « État des lieux »</button>
  <button id="rsmt" style="padding:15px 8px">Aller au montage</button>
  <div class="row"><button class="sp" id="rsimp">${ico('import')} Autre rush</button><button class="sp" id="rsdel">${ico('trash')} Supprimer ce rush</button></div></div></div>`;
 $('#app').innerHTML=h;
 const v=$('#rsv'),tl=$('#rst');
 const upd=()=>{tl.textContent=rsFmt(v.currentTime)+' / '+rsFmt(isFinite(v.duration)?v.duration:0);
  if(RS.stopAt!==null&&v.currentTime>=RS.stopAt){v.pause();RS.stopAt=null}};
 v.ontimeupdate=upd;v.onseeked=upd;
 const ld=$('#rsld');
 v.onloadedmetadata=()=>{upd();if(ld)ld.style.display='none'};
 v.onerror=()=>{if(!ld)return;const c=v.error?v.error.code:0;ld.style.display='';ld.className='hint warn';
  ld.innerHTML=`La vidéo ne se lit pas (code ${c}${R.blob&&R.blob.type?' · '+esc(R.blob.type):''}). <button id="rsre" style="padding:6px 10px;margin-left:6px">Réessayer</button>`;
  const b=$('#rsre');if(b)b.onclick=()=>{ld.className='hint';ld.textContent='Chargement de la vidéo…';v.src=url(rsPlayable(R.blob,R.ext));v.load()}};
 setTimeout(()=>{if(ld&&ld.style.display!=='none'&&!v.error&&v.readyState<1){ld.textContent='Toujours en chargement… Si rien ne bouge, touche ▶ sur la vidéo.'}},8000);
 v.onpause=()=>{RS.stopAt=null};
 document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{v.pause();v.currentTime=Math.max(0,Math.min((v.duration||0)-.05,v.currentTime+parseFloat(b.dataset.s)))});
 mtChoice('rslen',RS_LEN,String(len),k=>{lsSet('pb_rs_len',k);rsOpen()});
 mtChoice('rsph',{avant:{l:'Avant'},pendant:{l:'Pendant'},apres:{l:'Après'}},RS.ph,k=>{RS.ph=k;rsZones()});
 const rl=$('#rsl');if(rl)rl.onclick=e=>{const b=e.target.closest('[data-r]');if(b){RS.cur=b.dataset.r;rsOpen()}};
 $('#back').onclick=()=>{v.pause();hub()};
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
