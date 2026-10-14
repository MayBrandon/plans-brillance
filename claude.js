/* Plans Brillance · Claude prépare le montage
   Écran Montage : carte « Préparer le montage avec Claude » (+ consigne)
   → écran de validation des images envoyées (aucune vidéo ne part, seulement des images réduites)
   → proposition modifiable gratuitement (ordre, textes, durées), correction avec Claude, puis montage en local.
   La carte n'apparaît que si un espace pro est connecté ; la fonction Netlify vérifie en plus le compte. */

const AI_FN='/.netlify/functions/claude';
const AI_PRICE={in:4,out:20};            /* Opus 5.5, $ par million de jetons */
const AI_MAX=48, AI_SIDE=768, AI_PAYLOAD=4.6e6;
const AI={status:null,imgs:[],medias:[],ids:{},busy:false,th:new Map()};

(function(){const st=document.createElement('style');st.textContent=`
.aic{position:relative;border-radius:18px;padding:16px;margin-top:14px;background:linear-gradient(160deg,color-mix(in srgb,var(--cyan) 16%,var(--panel)) 0%,var(--panel) 70%);border:1px solid color-mix(in srgb,var(--cyan) 45%,transparent);display:flex;flex-direction:column;gap:10px}
.aic .hd{display:flex;align-items:center;gap:10px}
.aic .bd{width:40px;height:40px;border-radius:12px;background:var(--cyan);color:var(--on-accent);display:flex;align-items:center;justify-content:center;flex:none}
.aic .bd svg.i{margin:0;width:22px;height:22px}
.aic .hd b{display:block;font-size:1rem}.aic .hd small{display:block;color:var(--muted);font-size:.78rem}
.aic p{margin:0;font-size:.84rem;color:var(--muted);line-height:1.45}
.aic textarea,.aip textarea{box-sizing:border-box;width:100%;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--ink);color:var(--foam);font:inherit;font-size:16px;line-height:1.4;resize:none}
.aic .go{padding:15px 8px;width:100%}
.ai-m{display:flex;justify-content:space-between;gap:8px;font-family:var(--font-mono);font-size:.68rem;letter-spacing:.04em;color:var(--muted);text-transform:uppercase}
.ai-tag{display:inline-block;font-family:var(--font-mono);font-size:.62rem;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:99px;border:1px solid var(--line);color:var(--muted)}
.ai-tag.on{border-color:var(--cyan);color:var(--cyan)}.ai-tag.warn{border-color:var(--amber);color:var(--amber)}
.ai-scr{padding:0 16px 40px}
.ai-scr h2{font-family:inherit;text-transform:none;letter-spacing:0;color:var(--foam);font-weight:800;font-size:1.35rem;margin:14px 0 6px;line-height:1.2}
.ai-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:12px}
.ai-grid button{padding:0;border-radius:10px;aspect-ratio:3/4;overflow:hidden;border:2px solid transparent;background:#000}
.ai-grid button::before{display:none}
.ai-grid img{width:100%;height:100%;object-fit:cover;display:block}
.ai-grid button.off{opacity:.3;border-color:var(--red)}
.ai-grid button.off::after{content:"✕";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.6rem;font-weight:800}
.ai-box{margin-top:14px;padding:14px;border-radius:16px;background:var(--panel);border:1px solid var(--line);display:flex;flex-direction:column;gap:10px}
.ai-box>div{display:flex;justify-content:space-between;gap:10px;font-size:.9rem}.ai-box>div span:first-child{color:var(--muted)}
.ai-warn{margin-top:12px;padding:12px 14px;border-radius:14px;background:color-mix(in srgb,var(--amber) 10%,transparent);border:1px solid color-mix(in srgb,var(--amber) 40%,transparent);color:var(--amber);font-size:.8rem;line-height:1.45}
.ai-act{display:flex;flex-direction:column;gap:8px;margin-top:16px}.ai-act button{padding:15px 8px}
.ai-wait{text-align:center;padding:40px 0;color:var(--muted)}
.ai-wait .sp1{width:38px;height:38px;border-radius:50%;border:3px solid var(--line);border-top-color:var(--cyan);margin:0 auto 14px;animation:aisp 1s linear infinite}
@keyframes aisp{to{transform:rotate(360deg)}}
.ai-row{display:flex;gap:10px;align-items:center;padding:8px;border-radius:14px;background:var(--panel);border:1px solid var(--line);margin-bottom:8px}
.ai-row.hook{background:color-mix(in srgb,var(--cyan) 12%,var(--panel));border-color:color-mix(in srgb,var(--cyan) 55%,transparent)}
.ai-row .n{width:22px;text-align:center;font-weight:800;color:var(--cyan);flex:none}
.ai-row .th{width:48px;height:62px;border-radius:9px;object-fit:cover;background:#000;flex:none;display:block}
.ai-row .tx{flex:1;min-width:0}
.ai-row .tx small{display:block;font-family:var(--font-mono);font-size:.62rem;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ai-row .tx small.k{color:var(--cyan)}
.ai-row input[type=text]{margin:4px 0 0;padding:8px 10px;font-size:16px}
.ai-row .ctl{display:flex;flex-direction:column;gap:4px;flex:none;align-items:center}
.ai-row .ctl button{padding:4px 8px;border-radius:9px;font-size:.85rem;line-height:1.1;min-width:34px}
.ai-row .ctl input{width:52px;padding:5px 4px;border-radius:8px;border:1px solid var(--line);background:var(--ink);color:var(--foam);font:inherit;font-size:16px;text-align:center}
.ai-out{display:flex;gap:8px;align-items:center;padding:8px 10px;border-radius:12px;border:1px dashed var(--line);color:var(--muted);font-size:.82rem;margin-bottom:6px}
.ai-out span{flex:1;min-width:0}.ai-out button{padding:6px 10px;font-size:.78rem;flex:none}
.ai-cor{display:flex;gap:8px}.ai-cor input[type=text]{margin:0;font-size:16px}.ai-cor button{flex:none;white-space:nowrap;padding:0 14px;color:var(--cyan);border-color:var(--cyan);font-weight:800}
`;document.head.appendChild(st)})();

/* ---------- petits outils ---------- */
const aiEur=v=>(Math.max(.01,Math.ceil(v*100)/100)).toFixed(2).replace('.',',')+' $';
const aiTok=(w,h)=>Math.ceil(w/28)*Math.ceil(h/28);
function aiSpent(){try{const o=JSON.parse(lsGet('pb_ai_spent','null'));const m=new Date().toISOString().slice(0,7);return o&&o.m===m?o:{m,usd:0}}catch(e){return {m:new Date().toISOString().slice(0,7),usd:0}}}
function aiAddSpent(v){if(!(v>0))return;const o=aiSpent();o.usd+=v;lsSet('pb_ai_spent',JSON.stringify(o))}
function aiPro(){const pref=tplOf(sess).act==='auto'?'auto':'groupe';return proAuth(pref)?pref:Object.keys(PRO).find(k=>proAuth(k))||null}
const AI_ERR={
 auth:'Reconnecte ton espace pro (Réglages), puis réessaie.',
 forbidden:'Ce compte n’est pas autorisé à utiliser Claude.',
 nokey:'Claude n’est pas encore branché : il manque la clé sur Netlify.',
 badkey:'La clé Claude enregistrée sur Netlify n’est pas valide.',
 credits:'Crédits Claude épuisés : recharge sur console.anthropic.com.',
 busy:'Claude est très demandé en ce moment, réessaie dans une minute.',
 nofn:'La fonction Claude n’est pas encore en ligne.',
 network:'Impossible de joindre Claude (connexion ?).',
 big:'Trop d’images d’un coup : retire quelques images et réessaie.'
};
async function aiCall(body){
 const k=aiPro();if(!k)return {error:'auth'};
 const t=await proToken(k);if(!t)return {error:'auth'};
 let r;
 try{r=await fetch(AI_FN,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,pro:k,token:t})})}
 catch(e){return {error:'network'}}
 if(r.status===404)return {error:'nofn'};
 if(r.status===413)return {error:'big'};
 const j=await r.json().catch(()=>null);
 if(!j)return {error:'network'};
 if(j.cost)aiAddSpent(j.cost);
 return j}

/* ---------- les plans à analyser ---------- */
function aiItems(){
 const cfg=mtCfg(),S=MT_STY[cfg.sty];
 return mtItems().filter(i=>!cfg.off[i.m.id]&&(!S.only||i.ph===S.only))}
function aiPlan(){ /* combien d'images par vidéo pour rester sous AI_MAX */
 const its=aiItems(),nv=its.filter(i=>i.m.type==='video').length,np=its.length-nv;
 let f=3;while(f>1&&np+nv*f>AI_MAX)f--;
 const n=Math.min(AI_MAX,np+nv*f);
 return {its,f,n}}
function aiEstimate(n){ /* images ~576×768 */
 const inp=n*aiTok(576,768)+2200,out=3000;
 return (inp*AI_PRICE.in+out*AI_PRICE.out)/1e6}
function aiCorrEstimate(){return (3500*AI_PRICE.in+1800*AI_PRICE.out)/1e6}

/* une image réduite (jpeg) depuis une photo ou une image d'une vidéo */
function aiJpeg(src,w,h,side){
 const k=Math.min(1,side/Math.max(w,h)),W=Math.max(1,Math.round(w*k)),H=Math.max(1,Math.round(h*k));
 const c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').drawImage(src,0,0,W,H);
 const d=c.toDataURL('image/jpeg',.72);return {url:d,b64:d.slice(d.indexOf(',')+1),w:W,h:H}}
async function aiPhoto(m,side){
 let src,w,h;
 try{src=await createImageBitmap(m.blob);w=src.width;h=src.height}
 catch(e){const u=URL.createObjectURL(m.blob);try{src=await loadImg(u);w=src.naturalWidth;h=src.naturalHeight}finally{setTimeout(()=>URL.revokeObjectURL(u),2000)}}
 const r=aiJpeg(src,w,h,side);if(src.close)src.close();return [r]}
function aiVideo(m,f,side){return new Promise(res=>{
 const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';
 const u=URL.createObjectURL(m.blob),out=[];let done=false;
 const end=()=>{if(done)return;done=true;clearTimeout(to);v.removeAttribute('src');v.load();URL.revokeObjectURL(u);res(out)};
 const to=setTimeout(end,20000);
 const seek=t=>new Promise(ok=>{const tt=setTimeout(ok,4000);v.onseeked=()=>{clearTimeout(tt);ok()};v.currentTime=t});
 v.onerror=end;
 v.onloadeddata=async()=>{
  const full=isFinite(v.duration)&&v.duration>0?v.duration:1,a0=Math.min(m.a||0,full),d=Math.max(.1,(m.b?Math.min(m.b,full):full)-a0);
  const at=f===1?[.5]:f===2?[.25,.75]:[.15,.5,.85];
  for(const p of at){await seek(a0+d*p);if(done)return;
   try{if(v.videoWidth)out.push(aiJpeg(v,v.videoWidth,v.videoHeight,side))}catch(e){}}
  end()};
 v.src=u})}

/* ---------- carte sur l'écran Montage ---------- */
async function aiCard(){
 const el=$('#mtai');if(!el||!sess)return;
 if(!aiPro()){el.innerHTML='';return}
 const cfg=mtCfg(),A=cfg.ai,P=aiPlan(),sp=aiSpent();
 const st=AI.status;
 const tag=st==='nokey'||st==='nofn'?'<span class="ai-tag warn">Pas encore branché</span>':st==='forbidden'?'<span class="ai-tag warn">Compte non autorisé</span>':st==='ok'?'<span class="ai-tag on">Prêt</span>':'';
 if(A&&A.prop){
  el.innerHTML=`<div class="aic"><div class="hd"><div class="bd">${ico('sparkles')}</div><div class="sp"><b>Montage proposé par Claude</b><small>${esc(A.prop.titre||'')} · ${A.on?'utilisé pour la vidéo':'pas utilisé'}</small></div></div>
  <div class="row"><button class="sp" id="aiv">${ico('edit')} Modifier</button><button class="sp" id="aion">${A.on?'Désactiver':'Utiliser'}</button></div>
  <button id="ainew" style="width:100%">${ico('sparkles')} Nouvelle analyse</button>
  <div class="ai-m"><span>Ce mois : ${sp.usd.toFixed(2).replace('.',',')} $</span><span>${tag}</span></div></div>`;
  $('#aiv').onclick=()=>{if(!MT.busy)aiProp()};
  $('#aion').onclick=()=>{if(MT.busy)return;A.on=!A.on;if(A.on)aiApply(cfg);mtSave();aiCard();mtEst();mtPoster()};
  $('#ainew').onclick=()=>{if(MT.busy)return;cfg.ai=null;mtSave();aiCard();mtEst()};
 }else{
  el.innerHTML=`<div class="aic"><div class="hd"><div class="bd">${ico('sparkles')}</div><div class="sp"><b>Préparer le montage avec Claude</b><small>Plans, ordre, accroche et textes</small></div></div>
  <p>Claude regarde des images de tes plans et te propose un montage. Rien ne part sans ta validation, et aucune vidéo n’est envoyée.</p>
  <div class="lbl" style="margin:2px 0 0">Ta consigne (facultatif)</div>
  <textarea id="aicons" rows="2" maxlength="600" aria-label="Ta consigne pour Claude" placeholder="Ex. : vidéo de 15 s, insiste sur le coffre, ton un peu drôle">${esc(lsGet('pb_ai_cons_'+sess.id,''))}</textarea>
  <button class="primary go" id="aigo" ${P.n?'':'disabled'}>${ico('sparkles')} Analyser avec Claude</button>
  <div class="ai-m"><span>${P.n} image${P.n>1?'s':''} · ≈ ${aiEur(aiEstimate(P.n))}</span><span>Ce mois : ${sp.usd.toFixed(2).replace('.',',')} $</span></div>
  ${tag?`<div>${tag}</div>`:''}</div>`;
  const ta=$('#aicons');ta.oninput=()=>lsSet('pb_ai_cons_'+sess.id,ta.value);
  $('#aigo').onclick=()=>{if(!MT.busy&&P.n)aiPrepare()};
 }
 if(st===null){AI.status='…';const j=await aiCall({mode:'ping'});AI.status=j.ok?'ok':j.error||'network';if($('#mtai'))aiCard()}}

/* ---------- écran 2 : validation de l'envoi ---------- */
function aiHead(t,s){return `<header><div class="row"><button id="aib" class="ic-only" aria-label="Retour">${ico('back')}</button><div class="sp ht"><b>${esc(t)}</b><small>${esc(s)}</small></div></div></header>`}
async function aiPrepare(){
 const P=aiPlan(),cons=($('#aicons')||{}).value||'';
 mtStop();revoke();
 const run=++MT.open;
 $('#app').innerHTML=aiHead('Analyse avec Claude',sess.name)+`<div class="ai-scr"><div class="ai-wait"><div class="sp1"></div><div id="aipg">Préparation des images…</div></div></div>`;
 $('#aib').onclick=()=>{MT.open++;mtOpen()};
 const imgs=[],medias=[],ids={};let k=0;
 for(const i of P.its){
  if(run!==MT.open)return;
  const id='m'+(++k);ids[id]=i.m.id;
  medias.push({id,ph:i.ph,zone:i.z.l,type:i.m.type,dur:i.m.type==='video'?+(MT_DUR.get(i.m.id)||0).toFixed(1):0});
  if(imgs.length>=AI_MAX)continue;
  const pg=$('#aipg');if(pg)pg.textContent=`Préparation des images ${k}/${P.its.length}…`;
  let fr=[];try{fr=i.m.type==='video'?await aiVideo(i.m,P.f,AI_SIDE):await aiPhoto(i.m,AI_SIDE)}catch(e){fr=[]}
  if(fr[0])AI.th.set(i.m.id,fr[Math.floor(fr.length/2)].url);
  for(const f of fr)if(imgs.length<AI_MAX)imgs.push({m:id,mid:i.m.id,...f,off:false,z:i.z.l,ph:i.ph})}
 if(run!==MT.open)return;
 AI.imgs=imgs;AI.medias=medias;AI.ids=ids;AI.cons=cons.trim();
 aiValid()}
function aiValid(){
 const on=()=>AI.imgs.filter(x=>!x.off);
 const nv=new Set(AI.imgs.filter(x=>x.ph&&x.m).map(x=>x.m)).size;
 const draw=()=>{
  const n=on().length,c=aiEstimate(n),sp=aiSpent();
  $('#ain').textContent=`${n} image${n>1?'s':''}`;
  $('#aic1').textContent='≈ '+aiEur(c);
  $('#aisp').textContent=sp.usd.toFixed(2).replace('.',',')+' $';
  const b=$('#aiok');b.disabled=!n||AI.busy;b.innerHTML=`${ico('sparkles')} Valider l’envoi · ≈ ${aiEur(c)}`};
 $('#app').innerHTML=aiHead('Analyse avec Claude',sess.name)+`<div class="ai-scr">
  <h2>Ces images vont être envoyées</h2>
  <div class="hint" style="margin:0"><b id="ain"></b> tirées de ${nv} plan${nv>1?'s':''}. Les vidéos restent sur ton téléphone : seules quelques images réduites partent.${AI.cons?`<br>Ta consigne : « ${esc(AI.cons)} »`:''}</div>
  <div class="ai-grid" id="aigr">${AI.imgs.map((x,j)=>`<button data-j="${j}" class="${x.off?'off':''}" aria-label="${esc(PH[x.ph]+' · '+x.z)}"><img src="${x.url}" alt=""></button>`).join('')}</div>
  <div class="ai-box"><div><span>Modèle</span><b>Opus 5.5 · le plus précis</b></div><div><span>Coût estimé</span><b id="aic1" style="color:var(--cyan)"></b></div><div><span>Dépensé ce mois</span><b id="aisp"></b></div></div>
  <div class="ai-warn">Vérifie qu’on ne voit pas de plaque, de visage ou de papiers. Touche une image pour la retirer de l’envoi.</div>
  <div class="hint" id="aier" style="margin:12px 0 0;display:none"></div>
  <div class="ai-act"><button class="primary" id="aiok"></button><button id="aino">Annuler</button></div></div>`;
 draw();
 $('#aigr').onclick=e=>{const b=e.target.closest('[data-j]');if(!b||AI.busy)return;const x=AI.imgs[+b.dataset.j];x.off=!x.off;b.classList.toggle('off',x.off);draw()};
 const back=()=>{if(AI.busy)return;AI.imgs=[];mtOpen()};
 $('#aib').onclick=back;$('#aino').onclick=back;
 $('#aiok').onclick=aiSend}
async function aiSend(){
 if(AI.busy)return;
 const sel=AI.imgs.filter(x=>!x.off);if(!sel.length)return;
 let size=sel.reduce((a,x)=>a+x.b64.length,0);
 if(size>AI_PAYLOAD){const e=$('#aier');e.className='hint warn';e.style.display='';e.textContent=AI_ERR.big;return}
 const cfg=mtCfg();
 AI.busy=true;
 const w=$('.ai-act');w.innerHTML=`<div class="ai-wait" style="padding:10px 0"><div class="sp1"></div>Claude regarde tes plans… (environ 20 à 40 s)</div>`;
 const j=await aiCall({mode:'analyse',titre:sess.name,prestation:tplOf(sess).l,style:MT_STY[cfg.sty].l,format:MT_FMT[cfg.fmt].l,cible:MT_LEN[cfg.len].s||0,
  consigne:AI.cons,medias:AI.medias,images:sel.map(x=>({m:x.m,data:x.b64}))});
 AI.busy=false;
 if(!$('.ai-act'))return;
 if(j.error||!j.prop){
  if(j.error==='nokey'||j.error==='nofn'||j.error==='forbidden')AI.status=j.error;
  w.innerHTML=`<div class="hint warn" style="margin:0">${esc(AI_ERR[j.error]||(j.error?'Claude a refusé la demande'+(j.detail?' : '+j.detail:'')+(j.status?' ('+j.status+')':''):'Claude n’a pas pu préparer le montage.'))}${j.cost?'':' Rien n’a été débité.'}</div><button class="primary" id="aiok">Réessayer</button><button id="aino">Retour au montage</button>`;
  $('#aiok').onclick=aiSend;$('#aino').onclick=()=>{AI.imgs=[];mtOpen()};return}
 const used=new Set(sel.map(x=>x.m));
 cfg.ai={prop:aiFix(j.prop,AI.ids),ids:AI.ids,info:Object.fromEntries(AI.medias.map(m=>[m.id,m])),on:true,cost:j.cost||0,ts:Date.now(),sent:[...used]};
 aiApply(cfg);mtSave();AI.imgs=[];AI.status='ok';
 aiProp()}

/* garde uniquement des identifiants connus, sans doublon */
function aiFix(p,ids){
 p=p&&typeof p==='object'?p:{};const seen=new Set(),ok=id=>ids[id]&&!seen.has(id)&&seen.add(id);
 const hook=p.accroche&&ok(p.accroche.id)?{id:p.accroche.id,texte:String(p.accroche.texte||'').slice(0,60),duree:+p.accroche.duree||2}:null;
 let plans=(Array.isArray(p.plans)?p.plans:[]).filter(x=>x&&ok(x.id)).map(x=>({id:x.id,vu:String(x.vu||'').slice(0,140),texte:String(x.texte||'').slice(0,60),duree:Math.min(8,Math.max(.6,+x.duree||2))}));
 const ec=(Array.isArray(p.ecartes)?p.ecartes:[]).filter(x=>x&&ok(x.id)).map(x=>({id:x.id,raison:String(x.raison||'').slice(0,100)}));
 for(const id of Object.keys(ids))if(!seen.has(id))ec.push({id,raison:'non retenu'});
 const out={titre:String(p.titre||'').slice(0,50),accroche:hook,plans,ecartes:ec,conseil:String(p.conseil||'').slice(0,200)};
 if(!out.accroche&&out.plans.length){const f=out.plans.shift();out.accroche={id:f.id,texte:f.texte,duree:f.duree,vu:f.vu}}
 return out}
/* liste ordonnée : l'accroche puis les plans */
function aiList(A){const P=A.prop;return [P.accroche,...P.plans].filter(Boolean)}
function aiApply(cfg){
 const A=cfg.ai;if(!A||!A.prop)return;
 A.tx={};A.order=[];A.dur={};
 for(const x of aiList(A)){const mid=A.ids[x.id];if(!mid)continue;A.order.push(mid);A.dur[mid]=+x.duree||2;if(x.texte)A.tx[mid]=x.texte}
 A.title=A.prop.titre||''}

/* ---------- écran 3 : la proposition (modifiable gratuitement) ---------- */
function aiThumb(mid){
 if(AI.th.has(mid))return `<img class="th" src="${AI.th.get(mid)}" alt="">`;
 const it=mtItems().find(x=>x.m.id===mid),m=it&&it.m;if(!m)return '<div class="th"></div>';
 return m.type==='photo'?`<img class="th" src="${url(m.blob)}" alt="">`:`<video class="th" src="${url(m.blob)}#t=${((m.a||0)+.5).toFixed(2)}" preload="metadata" muted playsinline></video>`}
function aiProp(){
 const cfg=mtCfg(),A=cfg.ai;if(!A||!A.prop){mtOpen();return}
 mtStop();revoke();MT.open++;
 const L=aiList(A),P=A.prop,tot=L.reduce((a,x)=>a+(+x.duree||0),0);
 const lab=id=>{const i=A.info[id];return i?`${PH[i.ph]||''} · ${i.zone}${i.type==='video'?' · vidéo':''}`:id};
 $('#app').innerHTML=aiHead('Proposition de Claude',sess.name)+`<div class="ai-scr">
  <h2>${esc(P.titre||'Montage')} · ${Math.round(tot)} s</h2>
  <div class="hint" style="margin:0">Tu peux tout modifier ici gratuitement : ordre, textes, durées.${P.conseil?`<br>${esc(P.conseil)}`:''}</div>
  <div class="lbl">Titre de l’intro</div><input type="text" id="aiti" maxlength="50" value="${esc(P.titre||'')}">
  <div class="lbl">Ordre et textes</div>
  <div id="ail">${L.map((x,j)=>`<div class="ai-row ${j?'':'hook'}" data-j="${j}">
   <span class="n">${j?j:'★'}</span>${aiThumb(A.ids[x.id])}
   <div class="tx"><small class="${j?'':'k'}">${j?'':'Accroche · '}${esc(lab(x.id))}</small><input type="text" maxlength="60" data-t value="${esc(x.texte||'')}" aria-label="Texte à l’écran"></div>
   <div class="ctl"><button data-up aria-label="Monter" ${j?'':'disabled'}>↑</button><input type="number" data-d min="0.5" max="8" step="0.1" value="${(+x.duree||2).toFixed(1)}" aria-label="Durée en secondes"><button data-x aria-label="Retirer">✕</button></div></div>`).join('')}</div>
  ${P.ecartes.length?`<div class="lbl">Plans écartés (${P.ecartes.length})</div>${P.ecartes.map((x,j)=>`<div class="ai-out" data-e="${j}">${aiThumb(A.ids[x.id]).replace('class="th"','class="th" style="width:36px;height:46px;border-radius:7px;object-fit:cover"')}<span>${esc(lab(x.id))}<br><small>${esc(x.raison||'')}</small></span><button data-back>Remettre</button></div>`).join('')}`:''}
  <div class="lbl">Corriger avec Claude</div>
  <div class="ai-cor"><input type="text" id="aicor" maxlength="300" placeholder="Ex. : mets le coffre en premier"><button id="aicb">≈ ${aiEur(aiCorrEstimate())}</button></div>
  <div class="hint" style="margin:6px 0 0">Les images ne sont pas renvoyées : Claude reprend sa proposition.</div>
  <div class="hint" id="aier" style="margin:8px 0 0;display:none"></div>
  <div class="ai-act"><button class="primary" id="aiuse">${ico('film')} Utiliser ce montage · gratuit</button></div>
  <div class="ai-m" style="justify-content:center;margin-top:8px"><span>Coût de ce nettoyage : ${(A.cost||0).toFixed(2).replace('.',',')} $</span></div></div>`;
 const save=()=>{aiApply(cfg);mtSave()};
 $('#aib').onclick=()=>{save();mtOpen()};
 $('#aiti').oninput=e=>{P.titre=e.target.value.trim();save()};
 const setList=nl=>{P.accroche=nl[0]||null;P.plans=nl.slice(1);save();aiProp()};
 const ail=$('#ail');
 ail.oninput=e=>{const r=e.target.closest('[data-j]');if(!r)return;const x=L[+r.dataset.j];
  if(e.target.matches('[data-t]'))x.texte=e.target.value.trim();
  else if(e.target.matches('[data-d]')){const v=parseFloat(String(e.target.value).replace(',','.'));if(v>0)x.duree=Math.min(8,Math.max(.5,v))}
  save()};
 ail.onclick=e=>{const r=e.target.closest('[data-j]');if(!r)return;const j=+r.dataset.j,nl=L.slice();
  if(e.target.closest('[data-up]')&&j>0){[nl[j-1],nl[j]]=[nl[j],nl[j-1]];setList(nl)}
  else if(e.target.closest('[data-x]')){const [x]=nl.splice(j,1);P.ecartes.unshift({id:x.id,raison:'retiré par toi'});setList(nl)}};
 document.querySelectorAll('[data-e] [data-back]').forEach(b=>b.onclick=()=>{const j=+b.closest('[data-e]').dataset.e,[x]=P.ecartes.splice(j,1);
  const i=A.info[x.id];L.push({id:x.id,vu:'',texte:'',duree:i&&i.type==='video'?Math.min(3,i.dur||2.4):1.8});setList(L)});
 $('#aiuse').onclick=()=>{A.on=true;save();mtOpen();toast('Montage de Claude appliqué')};
 $('#aicb').onclick=async()=>{
  const q=$('#aicor').value.trim(),er=$('#aier');if(!q||AI.busy)return;
  AI.busy=true;const b=$('#aicb');b.disabled=true;b.textContent='…';er.style.display='';er.className='hint';er.textContent='Claude corrige…';
  const medias=Object.values(A.info).map(m=>{const v=aiList(A).find(x=>x.id===m.id);return {...m,vu:v&&v.vu||''}});
  const j=await aiCall({mode:'corrige',titre:sess.name,prestation:tplOf(sess).l,style:MT_STY[cfg.sty].l,format:MT_FMT[cfg.fmt].l,cible:MT_LEN[cfg.len].s||0,
   medias,proposition:P,correction:q});
  AI.busy=false;if(!$('#aicb'))return;
  if(j.error||!j.prop){b.disabled=false;b.textContent='≈ '+aiEur(aiCorrEstimate());er.className='hint warn';er.textContent=(AI_ERR[j.error]||'La correction n’a pas marché.')+(j.cost?'':' Rien n’a été débité.');return}
  const sent=new Set(A.sent||[]),np=aiFix(j.prop,A.ids);
  /* Claude ne peut pas ajouter un plan qu'il n'a jamais vu sans le savoir : on le signale simplement par la raison */
  for(const x of np.ecartes)if(!sent.has(x.id)&&x.raison==='non retenu')x.raison='image non envoyée';
  A.prop=np;A.cost=(A.cost||0)+(j.cost||0);save();aiProp();toast('Proposition corrigée')}}
