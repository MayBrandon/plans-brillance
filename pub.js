/* Plans Brillance · Pub vidéo
   Tes photos (avant/après) → Claude écrit le script (accroche, phrases, bouton) et choisit les paires
   → l'appli anime la pub dans le style Atelier Brillance (accroche, rideaux avant/après, fin avec bouton) et l'enregistre.
   Voix off et musique facultatives (fichiers du téléphone). Tout le montage se fait sur le téléphone. */

const PB={ph:[],pairs:null,txt:null,voice:null,music:null,ctx:null,run:null,busy:false,logo:null};
const PB_D={kick:'À AMIENS',hook:'Votre intérieur auto mérite mieux',l1:'Sol encrassé ? On s’en occupe',l2:'Nettoyé à la main, chez vous',l3:'Comme neuve, sans bouger',btn:'Réserver mon nettoyage'};
const PB_F={kick:'Bandeau',hook:'Accroche',l1:'Phrase 1',l2:'Phrase 2',l3:'Phrase 3',btn:'Bouton'};
const pbEo=x=>1-Math.pow(1-mtC(x),3),pbEio=x=>mtEIO(x);
function pbTxt(){let o=null;try{o=JSON.parse(lsGet('pb_pub_txt_'+flAct(),'null'))}catch(e){}o=o&&typeof o==='object'?o:{};for(const k in PB_D)if(typeof o[k]!=='string')o[k]=PB_D[k];
 if(flAct()!=='auto'&&!o._edited){o.hook='Votre intérieur mérite mieux'}return o}
function pbSave(){lsSet('pb_pub_txt_'+flAct(),JSON.stringify({...PB.txt,_edited:true}))}
/* paires avant/après : celles de Claude, sinon 1-2, 3-4, 5-6 */
function pbPairs(){
 const n=PB.ph.length;if(!n)return [];
 if(PB.pairs&&PB.pairs.length)return PB.pairs.filter(p=>p[0]<n&&p[1]<n).slice(0,3);
 const out=[];for(let i=0;i<n&&out.length<3;i+=2)out.push([i,Math.min(i+1,n-1)]);return out}
/* scènes et durées (allongées pour suivre la voix off) */
function pbPlan(){
 const P=pbPairs(),S=pbS(),sc=[{k:'hook',d:S.hook==='typo'?2.4:S.hook==='cinema'?2.4:1.8}];P.forEach((p,i)=>sc.push({k:'pair',p,i,d:S.d2||3}));sc.push({k:'cta',d:3.2});
 let tot=sc.reduce((a,s)=>a+s.d,0);
 const vd=PB.voice&&PB.voice.buf?PB.voice.buf.duration+.6:0;
 if(vd>tot){const f=vd/tot;sc.forEach(s=>s.d*=f);tot=vd}
 let t=0;for(const s of sc){s.s=t;t+=s.d}
 return {sc,tot}}

/* ---------- variantes : accroche, révélation avant/après, sous-titre, fin, look ---------- */
const PB_STY={
 classique:{l:'Classique',e:'split',d:'Rideau qui glisse, sous-titre en boîte, gros bouton',hook:'pastille',rev:'rideau',cap:'boite',cta:'bouton'},
 vertical:{l:'Rideau vertical',e:'chev-r',d:'L’après descend du haut, bande de couleur, carte de fin',hook:'pastille',rev:'vertical',cap:'bande',cta:'carte'},
 cercle:{l:'Cercle',e:'circle',d:'L’après apparaît dans un cercle qui grandit',hook:'typo',rev:'cercle',cap:'pop',cta:'bouton'},
 duo:{l:'Côte à côte',e:'clipboard',d:'Avant et après côte à côte, texte géant, fin en couleur',hook:'pastille',rev:'split',cap:'gros',cta:'plein',d2:3.4},
 fondu:{l:'Fondu cinéma',e:'film',d:'Bandes noires, fondu lent, ambiance film',hook:'cinema',rev:'fondu',cap:'boite',cta:'carte',look:'cinema',d2:3.4},
 choc:{l:'Choc',e:'star',d:'Coupe sèche avec flash et secousse, très percutant',hook:'typo',rev:'flash',cap:'gros',cta:'plein',d2:2.4},
 diagonale:{l:'Diagonale',e:'wind',d:'Balayage en biais, question en accroche',hook:'question',rev:'diag',cap:'bande',cta:'bouton'},
 zoom:{l:'Zoom carte',e:'search',d:'L’après arrive en carte qui grossit au centre',hook:'pastille',rev:'zoom',cap:'pop',cta:'carte'},
 stores:{l:'Stores',e:'menu',d:'L’après s’ouvre en lamelles, comme des stores',hook:'typo',rev:'stores',cap:'boite',cta:'bouton'},
 glisse:{l:'Glissé',e:'chev-l',d:'L’après pousse l’avant hors de l’écran',hook:'question',rev:'glisse',cap:'bande',cta:'plein'},
 nb:{l:'Gris → couleur',e:'moon',d:'L’avant en noir et blanc, l’après revient en couleur',hook:'pastille',rev:'nb',cap:'gros',cta:'carte'},
 vintage:{l:'Vintage',e:'sun',d:'Couleurs chaudes, grain, fondu doux',hook:'cinema',rev:'fondu',cap:'boite',cta:'carte',look:'vintage',d2:3.2}
};
const pbS=()=>PB_STY[lsGet('pb_pub_sty','classique')]||PB_STY.classique;
function pbDraw(c,W,H,t,plan){
 const u=W/1080,acc=FL.acc||'#35e0c9',T=PB.txt,sc=plan.sc,S=pbS(),tall=W/H<.7;
 let s=sc[sc.length-1];for(const x of sc)if(t>=x.s&&t<x.s+x.d){s=x;break}
 const lt=t-s.s,img=i=>PB.ph[i]&&PB.ph[i].img;
 c.save();c.fillStyle='#08121d';c.fillRect(0,0,W,H);
 const cover=(im,z,px=.5,py=.55,x=0,y=0,w=W,h=H)=>{if(!im)return;const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,k=Math.max(w/iw,h/ih)*z,dw=iw*k,dh=ih*k;c.drawImage(im,x+(w-dw)*px,y+(h-dh)*py,dw,dh)};
 const shade=(a,b)=>{const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,`rgba(8,18,29,${a})`);g.addColorStop(.45,'rgba(8,18,29,.1)');g.addColorStop(1,`rgba(8,18,29,${b})`);c.fillStyle=g;c.fillRect(0,0,W,H)};
 const head=()=>{const lg=PB.logo;if(!lg)return;const h=70*u,w=lg.width*h/lg.height;c.drawImage(lg,W/2-w/2,(tall?150:56)*u,w,h)};
 const cap=(txt,a,sl)=>{if(!txt||a<=0)return;c.save();c.globalAlpha=a;
  if(S.cap==='bande'){flFont(c,900,52*u);const L=mtWrap(c,txt.toUpperCase(),W-140*u,2),bh=L.length*64*u+50*u,y=H-(tall?400:170)*u-bh;
   c.fillStyle=acc;c.fillRect(-10,y+(1-a)*20*u,W*(.3+.7*mtC(a*1.3))+20,bh);c.fillStyle='#0d1b2a';c.textAlign='left';c.textBaseline='middle';L.forEach((l,i)=>c.fillText(l,60*u,y+(1-a)*20*u+25*u+64*u*(i+.5)))}
  else if(S.cap==='pop'){const k=mtBack(sl/.35);flFont(c,900,56*u);const L=mtWrap(c,txt,W-200*u,2),lh=68*u,bw=Math.max(...L.map(l=>c.measureText(l).width))+70*u,bh=L.length*lh+40*u;
   c.translate(W/2,H-(tall?430:200)*u-bh/2);c.rotate(-.03);c.scale(k,k);rrect(c,-bw/2,-bh/2,bw,bh,26*u);c.fillStyle=acc;c.fill();c.fillStyle='#0d1b2a';c.textAlign='center';c.textBaseline='middle';L.forEach((l,i)=>c.fillText(l,0,(i-(L.length-1)/2)*lh+2*u))}
  else if(S.cap==='gros'){flFont(c,900,96*u);let fs=96*u;while(fs>50*u&&mtWrap(c,txt.toUpperCase(),W-120*u,4).length>3){fs-=6*u;flFont(c,900,fs)}const L=mtWrap(c,txt.toUpperCase(),W-120*u,3);
   const sk=1+.15*(1-mtEO(sl/.3));c.translate(W/2,H*.62);c.scale(sk,sk);c.lineJoin='round';c.lineWidth=16*u;c.strokeStyle='rgba(0,0,0,.9)';c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';
   L.forEach((l,i)=>{const y=(i-(L.length-1)/2)*fs*1.05;c.strokeText(l,0,y);c.fillStyle=i===L.length-1?acc:'#fff';c.fillText(l,0,y)})}
  else{flFont(c,900,54*u);const L=mtWrap(c,txt.toUpperCase(),W-160*u,2),lh=66*u,bh=L.length*lh+44*u,y=H-(tall?420:200)*u-bh+(1-a)*30*u;
   let w=0;L.forEach(l=>w=Math.max(w,c.measureText(l).width));rrect(c,W/2-w/2-36*u,y,w+72*u,bh,24*u);c.fillStyle='rgba(13,27,42,.92)';c.fill();c.lineWidth=3*u;c.strokeStyle=mtRGBA(acc,.6);c.stroke();
   c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';L.forEach((l,i)=>c.fillText(l,W/2,y+22*u+lh*(i+.5)))}
  c.restore()};
 if(s.k==='hook'){
  const P=pbPairs()[0]||[0,0];cover(img(P[0]),1.08+.07*lt/s.d);if(S.rev==='nb')mtGray(c,W,H);shade(.75,.85);head();
  if(S.hook==='typo'){const words=T.hook.toUpperCase().split(/\s+/).filter(Boolean),per=Math.max(.18,(s.d-.5)/Math.max(1,words.length)),n=Math.min(words.length,Math.floor(lt/per)+1);
   flFont(c,900,110*u);const shown=words.slice(0,n).join(' ');let fs=110*u;while(fs>60*u&&mtWrap(c,T.hook.toUpperCase(),W-120*u,5).length>4){fs-=6*u;flFont(c,900,fs)}
   const L=mtWrap(c,shown,W-120*u,5),pk=1+.25*(1-mtEO((lt-(n-1)*per)/.18));c.save();c.textAlign='center';c.textBaseline='middle';c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=30*u;
   L.forEach((l,i)=>{const y=H*.45+(i-(L.length-1)/2)*fs*1.05;if(i===L.length-1){c.save();c.translate(W/2,y);c.scale(pk,pk);c.fillStyle=acc;c.fillText(l,0,0);c.restore()}else{c.fillStyle='#fff';c.fillText(l,W/2,y)}});c.restore()}
  else if(S.hook==='question'){const ha=pbEo((lt-.1)/.4);c.save();c.globalAlpha=ha;flFont(c,900,84*u);const L=mtWrap(c,T.hook.toUpperCase().replace(/\s*\?$/,'')+'?',W-140*u,4);
   c.fillStyle='#fff';c.textAlign='center';c.textBaseline='top';c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=30*u;L.forEach((l,i)=>c.fillText(l,W/2,H*.5+i*94*u+(1-ha)*30*u));c.restore();
   const qa=mtBack((lt-.2)/.5);if(qa>0){c.save();c.translate(W/2,H*.5-200*u+Math.sin(lt*5)*10*u);c.scale(qa,qa);c.beginPath();c.arc(0,0,110*u,0,7);c.fillStyle=acc;c.fill();flFont(c,900,150*u);c.fillStyle='#0d1b2a';c.textAlign='center';c.textBaseline='middle';c.fillText('?',0,8*u);c.restore()}}
  else if(S.hook==='cinema'){const ka=pbEo((lt-.2)/.6);c.save();c.globalAlpha=ka;flFont(c,500,34*u);c.letterSpacing=(10*u)+'px';c.fillStyle=acc;c.textAlign='center';c.textBaseline='middle';c.fillText(T.kick,W/2,H*.42);c.letterSpacing='0px';
   const ha=pbEo((lt-.6)/.7);c.globalAlpha=ha;flFont(c,800,76*u);const L=mtWrap(c,T.hook,W-160*u,3);c.fillStyle='#fff';c.textBaseline='top';L.forEach((l,i)=>c.fillText(l,W/2,H*.42+60*u+i*88*u));c.restore()}
  else{const ka=pbEo((lt-.15)/.3);if(ka>0){c.save();c.globalAlpha=ka;flFont(c,900,40*u);c.letterSpacing=(6*u)+'px';const tw=c.measureText(T.kick).width+70*u,y=H*.34;
    rrect(c,W/2-tw/2,y-38*u,tw,76*u,38*u);c.fillStyle=acc;c.fill();c.fillStyle='#0d1b2a';c.textAlign='center';c.textBaseline='middle';c.fillText(T.kick,W/2,y+2*u);c.letterSpacing='0px';c.restore()}
   const ha=pbEo((lt-.45)/.35);if(ha>0){c.save();c.globalAlpha=ha;flFont(c,900,92*u);const L=mtWrap(c,T.hook.toUpperCase(),W-120*u,3);
    c.fillStyle='#fff';c.textAlign='center';c.textBaseline='top';c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=30*u;L.forEach((l,i)=>c.fillText(l,W/2,H*.34+70*u+i*100*u+(1-ha)*40*u));c.restore()}}
 }else if(s.k==='pair'){
  const [a,b]=s.p,z=1.04+.05*lt/s.d,st=S.rev==='flash'?.9:.5,len=S.rev==='fondu'||S.rev==='zoom'?1.4:S.rev==='flash'?.01:1.1,w=pbEio((lt-st)/len);
  const A=()=>{cover(img(a),z);if(S.rev==='nb')mtGray(c,W,H)},B=()=>cover(img(b),z);
  const line=(x0,y0,x1,y1)=>{c.save();c.shadowColor=mtRGBA(acc,.8);c.shadowBlur=40*u;c.strokeStyle=acc;c.lineWidth=12*u;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.restore()};
  const R=S.rev;c.save();
  if(R==='flash'){const fl=lt-st;if(fl>=0&&fl<.25){const k=(1-fl/.25)*24*u;c.translate(Math.sin(fl*97)*k,Math.cos(fl*71)*k)}}
  if(R==='glisse'){c.save();c.translate(-w*W,0);A();c.restore();if(w>0){c.save();c.translate((1-w)*W,0);B();c.restore()}}
  else if(R==='split'){A();if(w>0){const x=W-W/2*w;c.save();c.beginPath();c.rect(x,0,W,H);c.clip();cover(img(b),z,.5,.55,W/2,0,W/2,H);c.restore();line(x,0,x,H)}}
  else{A();
   if(w>0){c.save();c.beginPath();
    if(R==='vertical')c.rect(0,0,W,H*w);
    else if(R==='cercle')c.arc(W/2,H/2,Math.hypot(W,H)/2*w,0,7);
    else if(R==='diag'){const k=w*(W+H)*1.02,Pt=[[0,0],[Math.min(k,W),0]];if(k>W)Pt.push([W,Math.min(k-W,H)]);if(k>H)Pt.push([Math.min(k-H,W),H]);Pt.push([0,Math.min(k,H)]);c.moveTo(0,0);Pt.forEach(p=>c.lineTo(p[0],p[1]));c.closePath()}
    else if(R==='stores'){const n=8,bh=H/n;for(let i=0;i<n;i++)c.rect(0,i*bh,W,bh*w)}
    else if(R==='zoom'){const k=.25+.75*w,ww=W*k,hh=H*k;rrect(c,(W-ww)/2,(H-hh)/2,ww,hh,40*u*(1-w))}
    else c.rect(0,0,W*(R==='fondu'||R==='flash'?1:w),H);
    c.clip();if(R==='fondu')c.globalAlpha=w;B();c.restore();
    if(R==='rideau'||R==='nb')line(W*w,0,W*w,H);else if(R==='vertical')line(0,H*w,W,H*w);
    else if(R==='diag'){const k=w*(W+H);line(k,0,k-H,H)}
    else if(R==='cercle'&&w<1){c.save();c.strokeStyle=acc;c.lineWidth=10*u;c.shadowColor=mtRGBA(acc,.8);c.shadowBlur=30*u;c.beginPath();c.arc(W/2,H/2,Math.hypot(W,H)/2*w,0,7);c.stroke();c.restore()}
    else if(R==='zoom'&&w<1){const k=.25+.75*w;c.save();c.strokeStyle=acc;c.lineWidth=8*u;rrect(c,(W-W*k)/2,(H-H*k)/2,W*k,H*k,40*u*(1-w));c.stroke();c.restore()}}
   if(R==='flash'){const fl=lt-st;if(fl>=0&&fl<.2){c.fillStyle=`rgba(255,255,255,${(1-fl/.2)*.9})`;c.fillRect(0,0,W,H)}}}
  c.restore();shade(.55,.7);head();
  const ty=(tall?260:150)*u;
  if(R==='split'&&w>.5){flPill(c,'AVANT',48*u,ty,40*u,'rgba(13,27,42,.9)','#fff','l','rgba(255,255,255,.45)');c.save();c.globalAlpha=mtC((w-.5)*2);flPill(c,'APRÈS',W-48*u,ty,40*u,acc,'#0d1b2a','r');c.restore()}
  else{if(w<.98)flPill(c,'AVANT',48*u,ty,40*u,'rgba(13,27,42,.9)','#fff','l','rgba(255,255,255,.45)');
   if(w>.02){c.save();c.globalAlpha=mtC(w*2);flPill(c,'APRÈS',W-48*u,ty,40*u,acc,'#0d1b2a','r');c.restore()}}
  const ca=S.cap==='gros'?mtC((lt-st-len-.1)/.2):pbEo((lt-.25)/.3);
  cap([T.l1,T.l2,T.l3][s.i]||'',ca*(s.d-lt<.2?mtC((s.d-lt)/.2):1),S.cap==='gros'?lt-st-len-.1:lt-.25);
 }else{
  const P=pbPairs(),last=P.length?P[P.length-1][1]:0,plein=S.cta==='plein',carte=S.cta==='carte',ink='#0d1b2a';
  if(plein){c.fillStyle=acc;c.fillRect(0,0,W,H);c.save();c.globalAlpha=.12;cover(img(last),1.1);c.restore()}
  else{cover(img(last),1.1);c.fillStyle='rgba(8,18,29,.82)';c.fillRect(0,0,W,H)}
  const cy=H*.4,lg=PB.logo;
  if(carte){const ca=pbEo(lt/.4),cw=W-140*u,ch=(tall?820:640)*u,y0=cy-280*u+(1-ca)*60*u;c.save();c.globalAlpha=ca;c.shadowColor='rgba(0,0,0,.5)';c.shadowBlur=60*u;rrect(c,70*u,y0,cw,ch,40*u);c.fillStyle='#f4f1e8';c.fill();c.restore();
   if(ca>0){c.save();c.globalAlpha=ca;if(lg){const h=120*u,w=lg.width*h/lg.height;rrect(c,W/2-w/2-24*u,y0+50*u,w+48*u,h+30*u,24*u);c.fillStyle=ink;c.fill();c.drawImage(lg,W/2-w/2,y0+65*u,w,h)}
    flFont(c,700,30*u);c.letterSpacing=(7*u)+'px';c.fillStyle=ink;c.textAlign='center';c.textBaseline='middle';c.fillText('ATELIER BRILLANCE '+flBrand(),W/2,y0+260*u);c.letterSpacing='0px';
    flFont(c,900,60*u);c.fillStyle=flDeep(acc);const L=mtWrap(c,T.btn.toUpperCase(),cw-100*u,2);L.forEach((l,i)=>c.fillText(l,W/2,y0+360*u+i*70*u));
    const by=y0+ch-(tall?250:190)*u;flFont(c,900,48*u);const sw=c.measureText(flSite()).width+90*u,pul=1+.03*Math.sin(Math.max(0,lt-.8)*6);
    c.save();c.translate(W/2,by+42*u);c.scale(pul,pul);rrect(c,-sw/2,-42*u,sw,84*u,42*u);c.fillStyle=acc;c.fill();c.fillStyle=ink;c.fillText(flSite(),0,2*u);c.restore();
    if(flTel()){flFont(c,800,40*u);c.fillStyle=ink;c.fillText(flTel(),W/2,by+150*u)}c.restore()}}
  else{
   if(lg){const h=150*u,w=lg.width*h/lg.height,a=pbEo(lt/.35);c.save();c.globalAlpha=a;if(plein){rrect(c,W/2-w/2-30*u,cy-290*u,w+60*u,h+60*u,30*u);c.fillStyle=ink;c.fill()}c.drawImage(lg,W/2-w/2,cy-260*u,w,h);c.restore()}
   flFont(c,700,34*u);c.letterSpacing=(8*u)+'px';c.fillStyle=plein?ink:'#f4f1e8';c.textAlign='center';c.textBaseline='middle';c.fillText('ATELIER BRILLANCE '+flBrand(),W/2,cy-60*u);c.letterSpacing='0px';
   const ba=pbEo((lt-.3)/.35),pulse=1+.035*Math.sin(Math.max(0,lt-.8)*6);
   if(ba>0){c.save();c.globalAlpha=ba;c.translate(W/2,cy+90*u);c.scale(pulse*(.85+.15*ba),pulse*(.85+.15*ba));
    flFont(c,900,50*u);const L=mtWrap(c,T.btn.toUpperCase(),W-220*u,2),bw=Math.max(...L.map(l=>c.measureText(l).width))+110*u,bh=L.length*60*u+70*u;
    c.shadowColor=plein?'rgba(0,0,0,.35)':mtRGBA(acc,.7);c.shadowBlur=60*u;rrect(c,-bw/2,-bh/2,bw,bh,bh/2);c.fillStyle=plein?ink:acc;c.fill();c.shadowColor='transparent';
    c.fillStyle=plein?acc:ink;c.textAlign='center';c.textBaseline='middle';L.forEach((l,i)=>c.fillText(l,0,-bh/2+35*u+60*u*(i+.5)));c.restore();
    const ar=pbEo((lt-.7)/.4);if(ar>0){const k=(lt*2.2)%1,y0=cy+90*u+150*u+30*u*(1-ar)+12*u*Math.sin(k*Math.PI*2);c.save();c.globalAlpha=ar;c.strokeStyle=plein?ink:'#fff';c.lineWidth=10*u;c.lineCap='round';c.lineJoin='round';
     c.beginPath();c.moveTo(W/2,y0+90*u);c.lineTo(W/2,y0);c.moveTo(W/2-34*u,y0+34*u);c.lineTo(W/2,y0);c.lineTo(W/2+34*u,y0+34*u);c.stroke();c.restore()}}
   const sa=pbEo((lt-.9)/.3);if(sa>0){c.save();c.globalAlpha=sa;flFont(c,900,46*u);c.fillStyle=plein?ink:acc;c.textAlign='center';c.textBaseline='middle';c.fillText(flSite(),W/2,H-(tall?330:120)*u);
    if(flTel()){flFont(c,800,38*u);c.fillStyle=plein?ink:'#f4f1e8';c.fillText(flTel(),W/2,H-(tall?260:62)*u)}c.restore()}}}
 /* transition entre les scènes */
 const fa=lt<.14&&s!==sc[0]?1-lt/.14:0;if(fa>0&&S.look!=='cinema'){c.fillStyle=`rgba(255,255,255,${fa*.7})`;c.fillRect(0,0,W,H)}
 if(S.look==='cinema'&&lt<.4&&s!==sc[0]){c.fillStyle=`rgba(0,0,0,${1-lt/.4})`;c.fillRect(0,0,W,H)}
 c.restore();
 if(S.look)mtLook(c,W,H,S.look,t)}

/* ---------- écran ---------- */
async function pbOpen(){
 revoke();document.body.classList.remove('has-tab');sess=null;
 if(!PB.logo)PB.logo=await loadImg('images/logo-ab.png').catch(()=>null);
 if(!FL.logo)FL.logo=PB.logo;FL.acc=lsGet('pb_fl_acc','#35e0c9');
 PB.txt=pbTxt();const fmt=lsGet('pb_pub_fmt','story'),F=MT_FMT[fmt]||MT_FMT.story,plan=pbPlan(),T=PB.txt;
 if(!PB.ph.length){const ph=await flPhotos();for(const x of ph)if(x.m.phase==='avant'){const y=ph.find(p=>p.s.id===x.s.id&&p.m.zone===x.m.zone&&p.m.phase==='apres');if(y&&PB.ph.length<6){PB.ph.push({blob:x.m.blob},{blob:y.m.blob})}}
  for(const p of PB.ph)p.img=await flLoadImg(p.blob)}
 $('#app').innerHTML=`<header><div class="row"><button id="back" class="ic-only" aria-label="Retour">${ico('back')}</button><div class="sp ht"><b>Pub vidéo</b><small>${esc(F.l)} · ${mtFmtT(plan.tot)}</small></div></div></header>
 <div class="mt">
  <div class="mtv"><canvas id="pbcv" width="${F.w}" height="${F.h}"></canvas><div class="bar"><i id="pbbar"></i></div><div class="mtst" id="pbst"></div></div>
  <div class="row mtgo"><button class="sp" id="pbpv">${ico('play')} Aperçu</button><button class="sp primary" id="pbgo">${ico('film')} Créer la vidéo</button></div>
  <div class="lbl">Style · ${Object.keys(PB_STY).length} variantes</div><div class="lst tpl" id="pbsty" style="max-height:none"></div>
  <div class="lbl">Photos (${PB.ph.length}) · par paires avant / après</div>
  <div class="ai-grid" id="pbph" style="grid-template-columns:repeat(3,minmax(0,1fr))">${PB.ph.map((p,j)=>`<button data-j="${j}" aria-label="Retirer la photo ${j+1}"><img src="${url(p.blob)}" alt=""><span style="position:absolute;left:5px;top:4px;font:800 12px var(--font-mono);color:#fff;text-shadow:0 1px 3px #000">${j+1}</span><span style="position:absolute;right:6px;top:2px;color:#fff;font-weight:800;text-shadow:0 1px 3px #000">✕</span></button>`).join('')}</div>
  <button id="pbadd" style="width:100%;margin-top:8px">${ico('import')} Ajouter des photos</button>
  <div class="hint" style="margin:6px 0 0">Mets-les dans l’ordre avant, après, avant, après… (6 max). Claude peut aussi les ranger.</div>
  <div class="aic"><div class="hd"><div class="bd">${ico('sparkles')}</div><div class="sp"><b>Script par Claude</b><small>Accroche, phrases, bouton et ordre des photos</small></div></div>
   <textarea id="pbcons" rows="2" maxlength="300" aria-label="Ta consigne pour Claude" placeholder="Ex. : commence par « À Amiens », bouton « Réserver »">${esc(lsGet('pb_pub_cons',''))}</textarea>
   <button class="primary go" id="pbai" ${PB.ph.length?'':'disabled'}>${ico('sparkles')} Écrire la pub · ≈ ${aiEur((PB.ph.length*aiTok(384,512)+1800)*AI_PRICE.in/1e6+1500*AI_PRICE.out/1e6)}</button>
   <div class="hint" id="pbaist" style="margin:0;display:none"></div></div>
  <div class="lbl">Textes</div><div id="pbtx">${Object.entries(PB_F).map(([k,l])=>`<label class="rng">${esc(l)}<input type="text" maxlength="60" data-f="${k}" value="${esc(T[k]||'')}"></label>`).join('')}</div>
  <div class="lbl">Format</div><div class="seg" id="pbfmt"></div>
  <div class="lbl">Voix off et musique (facultatif)</div>
  <div class="row"><button class="sp" id="pbvo">${ico('music')} ${PB.voice?'Voix : '+esc(PB.voice.name):'Voix off'}</button><button class="sp" id="pbmu">${ico('music')} ${PB.music?'Musique : '+esc(PB.music.name):'Musique'}</button></div>
  <div class="hint" style="margin:6px 0 0">Avec une voix off, la pub s’allonge pour durer autant que la voix.${PB.voice||PB.music?' <button id="pbclr" style="padding:4px 10px;font-size:.8rem">Retirer le son</button>':''}</div>
  <div class="lbl">Contact (fin de la pub)</div>
  <label class="rng">Site<input type="text" id="pbsite" maxlength="60" value="${esc(flSite())}"></label>
  <label class="rng">Téléphone (vide = masqué)<input type="text" id="pbtel" maxlength="20" value="${esc(flTel())}"></label>
 </div>`;
 const cv=$('#pbcv'),c=cv.getContext('2d');pbDraw(c,F.w,F.h,1.2,plan);
 $('#back').onclick=()=>{pbStop();home()};
 mtChoice('pbfmt',MT_FMT,fmt,k=>{lsSet('pb_pub_fmt',k);pbOpen()});
 const cur=lsGet('pb_pub_sty','classique'),ps=$('#pbsty');
 ps.innerHTML=Object.entries(PB_STY).map(([k,v])=>`<button data-v="${k}" class="${k===cur||(!PB_STY[cur]&&k==='classique')?'on':''}">${ico(v.e)}<span><b>${esc(v.l)}</b><small>${esc(v.d)}</small></span></button>`).join('');
 ps.onclick=e=>{const b=e.target.closest('[data-v]');if(!b||PB.run)return;lsSet('pb_pub_sty',b.dataset.v);pbOpen().then(()=>{const x=$('#pbsty');if(x)x.scrollIntoView({block:'center'})})};
 $('#pbtx').oninput=e=>{const i=e.target.closest('[data-f]');if(!i)return;PB.txt[i.dataset.f]=i.value;pbSave();pbDraw(c,F.w,F.h,i.dataset.f==='btn'?plan.tot-.5:i.dataset.f==='hook'||i.dataset.f==='kick'?1.2:plan.sc[1+(+i.dataset.f.slice(1)-1)]?plan.sc[+i.dataset.f.slice(1)].s+2:1.2,plan)};
 $('#pbsite').oninput=e=>lsSet('pb_fl_site_'+flAct(),e.target.value.trim());
 $('#pbtel').oninput=e=>lsSet('pb_fl_tel',e.target.value.trim());
 $('#pbcons').oninput=e=>lsSet('pb_pub_cons',e.target.value);
 $('#pbph').onclick=e=>{const b=e.target.closest('[data-j]');if(!b||PB.busy)return;PB.ph.splice(+b.dataset.j,1);PB.pairs=null;pbOpen()};
 $('#pbadd').onclick=()=>pbAdd();
 const aud=(k)=>{const inp=document.createElement('input');inp.type='file';inp.accept='audio/*,.mp3,.m4a,.wav,.aac';inp.onchange=async()=>{const f=inp.files&&inp.files[0];if(!f)return;
  try{const AC=window.AudioContext||window.webkitAudioContext;PB.ctx=PB.ctx||new AC();const buf=await mtDecode(PB.ctx,f);PB[k]={name:(f.name||'son').replace(/\.[^.]+$/,'').slice(0,24),buf}}catch(e){toast('Fichier audio illisible')}pbOpen()};inp.click()};
 $('#pbvo').onclick=()=>aud('voice');$('#pbmu').onclick=()=>aud('music');
 const clr=$('#pbclr');if(clr)clr.onclick=()=>{PB.voice=null;PB.music=null;pbOpen()};
 $('#pbpv').onclick=()=>pbRun(false);$('#pbgo').onclick=()=>pbRun(true);
 $('#pbai').onclick=pbAI;
 window.scrollTo(0,0)}
async function pbAdd(){
 const ph=await flPhotos(),d=$('#dlg'),sel=[];
 d.innerHTML=`<h3>Ajouter des photos</h3><button id="pbgal" style="width:100%">${ico('import')} Choisir dans la galerie</button>
 ${ph.length?`<p class="small-hint">Ou touche les photos de tes nettoyages, dans l’ordre.</p><div class="ai-grid" id="pbg" style="max-height:48vh;overflow:auto">${ph.map((x,j)=>`<button data-j="${j}"><img src="${url(x.m.blob)}" alt="" loading="lazy"><span style="position:absolute;left:4px;bottom:3px;font:700 10px var(--font-mono);color:#fff;text-shadow:0 1px 2px #000">${PH[x.m.phase]}</span></button>`).join('')}</div>`:''}
 <div class="row" style="margin-top:10px"><button class="sp" id="cl">Annuler</button><button class="sp primary" id="pbok">Ajouter</button></div>`;
 const g=$('#pbg');if(g)g.onclick=e=>{const b=e.target.closest('[data-j]');if(!b)return;const j=+b.dataset.j,i=sel.indexOf(j);if(i>=0)sel.splice(i,1);else sel.push(j);
  g.querySelectorAll('[data-j]').forEach(x=>{const k=sel.indexOf(+x.dataset.j);x.style.borderColor=k>=0?'var(--cyan)':'transparent'})};
 const add=async blobs=>{for(const b of blobs.slice(0,6-PB.ph.length))PB.ph.push({blob:b,img:await flLoadImg(b)});PB.pairs=null;d.close();pbOpen()};
 $('#pbok').onclick=()=>add(sel.map(j=>ph[j].m.blob));
 $('#pbgal').onclick=()=>{const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.multiple=true;inp.onchange=()=>{const fs=[...(inp.files||[])];if(fs.length)add(fs)};inp.click()};
 $('#cl').onclick=()=>d.close();d.showModal()}
async function pbAI(){
 if(PB.busy||!PB.ph.length)return;
 if(typeof aiPro!=='function'||!aiPro()){toast('Connecte ton espace pro (Réglages) pour utiliser Claude');return}
 const st=$('#pbaist'),b=$('#pbai');PB.busy=true;b.disabled=true;st.style.display='';st.className='hint';st.textContent='Claude regarde tes photos et écrit la pub… (20 à 40 s)';
 const images=[];for(const [j,p] of PB.ph.entries())if(p.img){const r=aiJpeg(p.img,p.img.naturalWidth||p.img.width,p.img.naturalHeight||p.img.height,512);images.push({id:'i'+(j+1),data:r.b64})}
 const j=await aiCall({mode:'pub',activite:ACT[flAct()].l,site:flSite(),format:MT_FMT[lsGet('pb_pub_fmt','story')].l,consigne:($('#pbcons')||{}).value||'',actuel:PB.txt,images});
 PB.busy=false;if(!$('#pbai'))return;b.disabled=false;
 if(j.error||!j.prop){st.className='hint warn';st.textContent=(AI_ERR[j.error]||(j.detail?'Claude a refusé la demande : '+j.detail:'Claude n’a pas pu écrire la pub.'))+(j.cost?'':' Rien n’a été débité.');return}
 const p=j.prop;for(const k of ['kick','hook','btn'])if(typeof p[k]==='string')PB.txt[k]=p[k].slice(0,60);
 (Array.isArray(p.lignes)?p.lignes:[]).slice(0,3).forEach((l,i)=>{if(typeof l==='string')PB.txt['l'+(i+1)]=l.slice(0,60)});
 const ix=v=>{const n=parseInt(String(v).replace(/\D/g,''),10)-1;return n>=0&&n<PB.ph.length?n:-1};
 const pr=(Array.isArray(p.paires)?p.paires:[]).map(x=>Array.isArray(x)?[ix(x[0]),ix(x[1])]:null).filter(x=>x&&x[0]>=0&&x[1]>=0).slice(0,3);
 PB.pairs=pr.length?pr:null;pbSave();toast('Pub écrite par Claude');pbOpen()}

function pbStop(){const R=PB.run;if(!R)return;R.end=true;cancelAnimationFrame(R.raf);for(const n of R.nodes)try{n.stop()}catch(e){}
 if(R.rec&&R.rec.state!=='inactive')try{R.rec.stop()}catch(e){}PB.run=null}
async function pbRun(rec){
 if(PB.run){pbStop();$('#pbpv').innerHTML=`${ico('play')} Aperçu`;return}
 if(!PB.ph.length){toast('Ajoute au moins 2 photos');return}
 const AC=window.AudioContext||window.webkitAudioContext;let ctx=null;try{ctx=PB.ctx&&PB.ctx.state!=='closed'?PB.ctx:(PB.ctx=new AC());ctx.resume().catch(()=>{})}catch(e){ctx=null}
 if(rec&&!(window.MediaRecorder&&HTMLCanvasElement.prototype.captureStream)){toast('Ce navigateur ne sait pas enregistrer de vidéo');return}
 const fmt=lsGet('pb_pub_fmt','story'),F=MT_FMT[fmt]||MT_FMT.story,cv=$('#pbcv'),c=cv.getContext('2d'),plan=pbPlan();
 const R={nodes:[],end:false};PB.run=R;
 const out=ctx?ctx.createGain():null;if(out)out.connect(ctx.destination);
 if(rec){try{const vs=cv.captureStream(30),tr=[...vs.getVideoTracks()];if(ctx){const d=ctx.createMediaStreamDestination();out.connect(d);tr.push(...d.stream.getAudioTracks())}
   const m=mtMime(),o={videoBitsPerSecond:8e6,audioBitsPerSecond:160000};if(m)o.mimeType=m;R.rec=new MediaRecorder(new MediaStream(tr),o);R.ch=[];R.rec.ondataavailable=e=>{if(e.data&&e.data.size)R.ch.push(e.data)};R.type=m||'video/webm'}
  catch(e){PB.run=null;toast('L’enregistrement n’a pas pu démarrer');return}}
 const now=ctx?()=>ctx.currentTime:()=>performance.now()/1000,t0=now()+.15;
 if(ctx){for(const [k,v] of [['voice',1],['music',PB.voice?.25:.9]]){const x=PB[k];if(!x||!x.buf)continue;const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=x.buf;s.loop=k==='music';
   g.gain.setValueAtTime(k==='music'?0:v,t0);if(k==='music'){g.gain.linearRampToValueAtTime(v,t0+.5);g.gain.setValueAtTime(v,t0+plan.tot-1.2);g.gain.linearRampToValueAtTime(0,t0+plan.tot)}
   s.connect(g);g.connect(out);s.start(t0+(k==='voice'?.3:0));s.stop(t0+plan.tot+.05);R.nodes.push(s)}}
 if(R.rec)R.rec.start(1000);
 $(rec?'#pbgo':'#pbpv').innerHTML=`${ico('stop')} Arrêter`;
 try{if(navigator.wakeLock)navigator.wakeLock.request('screen').then(w=>R.wl=w).catch(()=>{})}catch(e){}
 const tick=()=>{if(R.end)return;const t=Math.max(0,now()-t0);
  if(t>=plan.tot){pbDraw(c,F.w,F.h,plan.tot-.01,plan);R.end=true;
   if(R.wl)try{R.wl.release()}catch(e){}
   if(R.rec){R.rec.onstop=()=>{const blob=new Blob(R.ch,{type:R.type.split(';')[0]});PB.run=null;pbDone(blob,R.type)};setTimeout(()=>{try{R.rec.stop()}catch(e){}},250)}else PB.run=null;
   $('#pbpv').innerHTML=`${ico('play')} Aperçu`;$('#pbgo').innerHTML=`${ico('film')} Créer la vidéo`;$('#pbst').textContent=rec?'Finalisation…':'Aperçu terminé';return}
  pbDraw(c,F.w,F.h,t,plan);const b=$('#pbbar');if(b)b.style.width=Math.round(t/plan.tot*100)+'%';
  const st=$('#pbst');if(st)st.textContent=`${rec?'Enregistrement':'Aperçu'} · ${mtFmtT(t)} / ${mtFmtT(plan.tot)}`;
  R.raf=requestAnimationFrame(tick)};
 tick()}
function pbDone(blob,type){
 const ext=/mp4/.test(type)?'mp4':'webm',name=`pub_${slug(ACT[flAct()].l)}_${lsGet('pb_pub_fmt','story')}_${new Date().toISOString().slice(0,10)}.${ext}`,u=URL.createObjectURL(blob),d=$('#dlg'),file=new File([blob],name,{type:type.split(';')[0]});
 const st=$('#pbst');if(st)st.textContent='Vidéo prête';
 d.innerHTML=`<h3>Pub prête</h3><video src="${u}" controls playsinline style="width:100%;max-height:55vh;border-radius:12px"></video>
 <p class="small-hint">${fmtSize(blob.size)}${ext==='webm'?' · fichier .webm (sur iPhone avec Safari, la vidéo sort en .mp4)':''}</p>
 <div style="display:grid;gap:8px;margin-top:10px"><button class="primary" id="pbsh">${ico('upload')} Enregistrer dans Photos / partager</button><button id="pbdl">${ico('import')} Télécharger</button><button id="cl">Fermer</button></div>`;
 $('#pbsh').onclick=async()=>{try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file]});return}}catch(e){if(e.name==='AbortError')return}dl(blob,name)};
 $('#pbdl').onclick=()=>dl(blob,name);$('#cl').onclick=()=>d.close();d.onclose=()=>{d.onclose=null;URL.revokeObjectURL(u)};d.showModal()}
