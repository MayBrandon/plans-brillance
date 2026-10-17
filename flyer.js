/* Plans Brillance · Flyers (1080×1350, Facebook / Instagram)
   4 modèles dans la direction artistique Atelier Brillance, photos avant/après d'un nettoyage (ou de la galerie),
   textes modifiables ; Claude peut écrire les textes (texte seul, aucune photo envoyée). Tout est dessiné sur le téléphone. */

const FL_W=1080,FL_H=1350,FL_INK='#0d1b2a',FL_FOAM='#f4f1e8';
const FL_TPL={
 main:{l:'Avant / Après',d:{kick:'AMIENS & ALENTOURS',t1:'NETTOYAGE AUTO',t2:'À DOMICILE',sub:'On vient chez vous ou sur votre lieu de travail',p1:'Fait à la main',p2:'Produits adaptés',p3:'Prix affiché à l’avance'}},
 question:{l:'La question',d:{kick:'',t1:'Votre voiture a besoin d’un',t2:'coup de propre ?',sub:'Nettoyage intérieur à la main, à domicile, à Amiens et alentours',p1:'Express',p2:'Confort',p3:'Premium'}},
 chez:{l:'On vient chez vous',d:{kick:'',t1:'ON VIENT',t2:'CHEZ VOUS',sub:'À la maison ou au travail · Amiens & alentours',p1:'Réservez en ligne',p2:'On vous rappelle',p3:'On nettoie sur place'}},
 resultat:{l:'Le résultat',d:{kick:'',t1:'LE RÉSULTAT',t2:'PARLE',sub:'Nettoyage intérieur à la main, chez vous · Amiens & alentours',p1:'',p2:'',p3:''}},
 promo:{l:'Offre',d:{kick:'PROMO',t1:'L’OFFRE',t2:'DU MOIS',sub:'Écris ici ton offre (ex. réduction, pack, cadeau)',p1:'Sur rendez-vous',p2:'Places limitées',p3:''},
  f:{kick:'Pastille (ex. -10 %)',t1:'Titre',t2:'Mot en couleur',sub:'Détail de l’offre',p1:'Point 1',p2:'Point 2',p3:'Point 3'}},
 avis:{l:'Avis client',d:{kick:'',t1:'NETTOYAGE',t2:'À DOMICILE',sub:'Colle ici l’avis d’un vrai client (Google, Facebook…)',p1:'Prénom du client',p2:'5',p3:''},
  f:{kick:null,t1:'Titre du bas',t2:'Mot en couleur',sub:'Texte de l’avis (copié tel quel)',p1:'Prénom du client',p2:'Note (1 à 5, vide = sans étoiles)',p3:null}},
 formules:{l:'Nos formules',d:{kick:'',t1:'NOS',t2:'FORMULES',sub:'À domicile · Amiens & alentours',p1:'Express — l’essentiel, rapide',p2:'Confort — intérieur complet',p3:'Premium — le grand nettoyage'},
  f:{kick:null,t1:'Titre',t2:'Mot en couleur',sub:'Phrase',p1:'Formule 1 (Nom — détail)',p2:'Formule 2 (Nom — détail)',p3:'Formule 3 (Nom — détail)'}},
 clair:{l:'Clair',d:{kick:'',t1:'PROPRE',t2:'COMME NEUF',sub:'Nettoyage à la main, chez vous · Amiens & alentours',p1:'Fait à la main',p2:'À domicile',p3:'Devis rapide'}},
 diagonale:{l:'Diagonale',d:{kick:'',t1:'AVANT',t2:'APRÈS',sub:'Nettoyage à domicile · Amiens & alentours',p1:'',p2:'',p3:''},
  f:{kick:null,t1:'Titre',t2:'Mot en couleur',sub:'Phrase',p1:null,p2:null,p3:null}}
};
const FL_FIELDS={kick:'Bandeau',t1:'Titre',t2:'Mot en couleur',sub:'Phrase',p1:'Point 1',p2:'Point 2',p3:'Point 3'};
const FL={tpl:'main',txt:null,av:null,ap:null,avI:null,apI:null,logo:null,acc:'#35e0c9',busy:false};

const flAct=()=>typeof curAct!=='undefined'?curAct:'auto';
const flSite=()=>lsGet('pb_fl_site_'+flAct(),flAct()==='auto'?'atelier-brillance-auto.fr':'atelier-brillance-services.fr');
const flTel=()=>lsGet('pb_fl_tel','07 69 66 36 93');
const flBrand=()=>flAct()==='auto'?'AUTO':'SERVICES';
function flTxt(){const k='pb_fl_txt_'+flAct()+'_'+FL.tpl;let o=null;try{o=JSON.parse(lsGet(k,'null'))}catch(e){}
 const d=FL_TPL[FL.tpl].d;if(!o||typeof o!=='object')o={};for(const f in d)if(typeof o[f]!=='string')o[f]=d[f];
 if(flAct()!=='auto'&&!o._edited){if(FL.tpl==='main')o.t1='NETTOYAGE';if(FL.tpl==='question')o.t1='Votre intérieur a besoin d’un'}
 return o}
function flSave(){lsSet('pb_fl_txt_'+flAct()+'_'+FL.tpl,JSON.stringify({...FL.txt,_edited:true}))}

/* ---------- dessin ---------- */
function flCover(c,img,x,y,w,h,px=.5,py=.6){
 c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
 if(img){const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,s=Math.max(w/iw,h/ih),dw=iw*s,dh=ih*s;
  c.drawImage(img,x+(w-dw)*px,y+(h-dh)*py,dw,dh)}
 else{c.fillStyle='#16283a';c.fillRect(x,y,w,h);c.fillStyle='#6f8295';c.font=`700 30px ${MT_FONT}`;c.textAlign='center';c.textBaseline='middle';c.fillText('Choisis une photo',x+w/2,y+h/2)}
 c.restore()}
function flFont(c,w,s){c.font=`${w} ${s}px ${MT_FONT}`}
function flFit(c,txt,w,s,max){flFont(c,w,s);while(s>20&&c.measureText(txt).width>max){s-=2;flFont(c,w,s)}return s}
function flPill(c,txt,x,y,s,bg,fg,al='l',border){
 flFont(c,900,s);const tw=c.measureText(txt).width,ph=s*.9,w=tw+ph*1.8,h=s+ph*.9;
 const X=al==='c'?x-w/2:al==='r'?x-w:x;rrect(c,X,y,w,h,h/2);c.fillStyle=bg;c.fill();
 if(border){c.lineWidth=3;c.strokeStyle=border;c.stroke()}
 c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(txt,X+w/2,y+h/2+1);return {w,h}}
function flHi(c,txt,cx,y,s,acc){ /* mot surligné */
 s=flFit(c,txt,900,s,FL_W-150);const tw=c.measureText(txt).width,h=s*1.12,pad=s*.36;
 rrect(c,cx-tw/2-pad,y,tw+pad*2,h,18);c.fillStyle=acc;c.fill();
 c.fillStyle=FL_INK;c.textAlign='center';c.textBaseline='middle';c.fillText(txt,cx,y+h/2+s*.04);return h}
function flHead(c,y,shadow,dark){
 const lg=FL.logo,lh=58,lw=lg?lg.width*lh/lg.height:0,brand='ATELIER BRILLANCE ',b2=flBrand();
 flFont(c,700,25);c.letterSpacing='5px';const w1=c.measureText(brand).width;flFont(c,900,25);const w2=c.measureText(b2).width;
 const tot=lw+(lg?16:0)+w1+w2;let x=FL_W/2-tot/2;
 if(lg){c.drawImage(lg,x,y,lw,lh);x+=lw+16}
 c.save();if(shadow){c.shadowColor='rgba(0,0,0,.7)';c.shadowBlur=14}
 c.textAlign='left';c.textBaseline='middle';flFont(c,700,25);c.fillStyle=dark?FL_INK:FL_FOAM;c.fillText(brand,x,y+lh/2);
 flFont(c,900,25);c.fillStyle=dark?flDeep(FL.acc):FL.acc;c.fillText(b2,x+w1,y+lh/2);c.restore();c.letterSpacing='0px'}
function flDeep(hex){const n=parseInt(hex.slice(1),16),k=.62;return `rgb(${Math.round((n>>16&255)*k)},${Math.round((n>>8&255)*k)},${Math.round((n&255)*k)})`}
function flStar(c,cx,cy,r,col){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;c.lineTo(cx+rr*Math.cos(a),cy+rr*Math.sin(a))}c.closePath();c.fillStyle=col;c.fill()}
function flCheck(c,x,y,acc){c.save();c.strokeStyle=acc;c.lineWidth=4.5;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(x,y+15);c.lineTo(x+11,y+26);c.lineTo(x+30,y+5);c.stroke();c.restore()}
function flCta(c,y,dark){
 const site=flSite(),tel=flTel();flFont(c,900,34);const sw=c.measureText(site).width+68;flFont(c,800,32);const tw=tel?c.measureText(tel).width:0;
 const tot=sw+(tel?22+tw:0);let x=FL_W/2-tot/2;
 c.save();c.shadowColor=mtRGBA(FL.acc,.4);c.shadowBlur=50;rrect(c,x,y,sw,78,39);c.fillStyle=FL.acc;c.fill();c.restore();
 flFont(c,900,34);c.fillStyle=FL_INK;c.textAlign='center';c.textBaseline='middle';c.fillText(site,x+sw/2,y+40);
 if(tel){flFont(c,800,32);c.fillStyle=dark?FL_INK:FL_FOAM;c.textAlign='left';c.fillText(tel,x+sw+22,y+40)}}
function flWrapC(c,txt,cx,y,w,s,wt,col,lh=1.3,max=2){flFont(c,wt,s);c.fillStyle=col;c.textAlign='center';c.textBaseline='top';
 const L=mtWrap(c,txt,w,max);L.forEach((l,i)=>c.fillText(l,cx,y+i*s*lh));return L.length*s*lh}
function flTag(c,txt,x,y,after){return flPill(c,txt,x,y,28,after?FL.acc:'rgba(13,27,42,.92)',after?FL_INK:'#fff','l',after?null:'rgba(255,255,255,.45)')}

function flDraw(cv,k=1){
 const c=cv.getContext('2d'),T=FL.txt,acc=FL.acc,A=FL.avI,B=FL.apI;
 c.setTransform(k,0,0,k,0,0);c.clearRect(0,0,FL_W,FL_H);c.letterSpacing='0px';
 const X=FL_TPL[FL.tpl]&&FL_TPL[FL.tpl].x;if(X){X(c,T,A,B,flP());return}
 if(FL.tpl==='main'){
  const g=c.createRadialGradient(540,0,0,540,0,1300);g.addColorStop(0,'#163049');g.addColorStop(.48,'#0d1b2a');g.addColorStop(1,'#08121d');c.fillStyle=g;c.fillRect(0,0,FL_W,FL_H);
  flHead(c,52);let y=140;
  if(T.kick){flFont(c,800,28);c.letterSpacing='4px';const w=c.measureText(T.kick).width+68;rrect(c,540-w/2,y,w,58,29);c.fillStyle=FL_INK;c.fill();c.lineWidth=2.5;c.strokeStyle=acc;c.stroke();c.fillStyle=acc;c.textAlign='center';c.textBaseline='middle';c.fillText(T.kick,540,y+30);c.letterSpacing='0px';y+=78}
  const s1=flFit(c,T.t1,900,92,970);c.fillStyle=FL_FOAM;c.textAlign='center';c.textBaseline='top';c.fillText(T.t1,540,y);y+=s1*1.08;
  if(T.t2)y+=flHi(c,T.t2,540,y,76,acc)+14;
  y+=flWrapC(c,T.sub,540,y,940,32,400,'#dbe5ee',1.3,2)+18;
  const ph=Math.max(380,Math.min(600,FL_H-128-y-110)),pw=466,top=y;
  for(const [img,x,rot,after] of [[A,56,-2,false],[B,558,2,true]]){
   c.save();c.translate(x+pw/2,top+ph/2);c.rotate(rot*Math.PI/180);c.shadowColor='rgba(0,0,0,.55)';c.shadowBlur=60;c.shadowOffsetY=24;
   rrect(c,-pw/2,-ph/2,pw,ph,28);c.fillStyle=FL_FOAM;c.fill();c.shadowColor='transparent';
   c.save();rrect(c,-pw/2+5,-ph/2+5,pw-10,ph-10,24);c.clip();flCover(c,img,-pw/2,-ph/2,pw,ph);c.restore();
   flTag(c,after?'APRÈS':'AVANT',-pw/2+22,ph/2-80,after);c.restore()}
  c.save();c.shadowColor=mtRGBA(acc,.6);c.shadowBlur=50;c.beginPath();c.arc(540,top+ph/2,40,0,7);c.fillStyle=acc;c.fill();c.restore();
  c.lineWidth=5;c.strokeStyle=FL_INK;c.beginPath();c.arc(540,top+ph/2,40,0,7);c.stroke();
  c.strokeStyle=FL_INK;c.lineWidth=6;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(522,top+ph/2);c.lineTo(556,top+ph/2);c.moveTo(544,top+ph/2-13);c.lineTo(557,top+ph/2);c.lineTo(544,top+ph/2+13);c.stroke();
  y=top+ph+34;const ps=[T.p1,T.p2,T.p3].filter(Boolean);
  if(ps.length){const cw=968/ps.length;ps.forEach((p,i)=>{const s=flFit(c,p,700,26,cw-56),w=c.measureText(p).width+42,x=56+cw*i+cw/2-w/2;flCheck(c,x,y,acc);c.fillStyle=FL_FOAM;c.textAlign='left';c.textBaseline='middle';c.fillText(p,x+42,y+16)})}
  flCta(c,FL_H-128);
 }else if(FL.tpl==='question'){
  c.fillStyle='#08121d';c.fillRect(0,0,FL_W,FL_H);
  flCover(c,A,0,0,FL_W,410,.58,.6);flCover(c,B,0,410,FL_W,410,.58,.72);
  let g=c.createLinearGradient(0,0,0,230);g.addColorStop(0,'rgba(8,18,29,.82)');g.addColorStop(1,'rgba(8,18,29,0)');c.fillStyle=g;c.fillRect(0,0,FL_W,230);
  flTag(c,'AVANT',40,330,false);flTag(c,'APRÈS',40,740,true);
  c.save();c.shadowColor=mtRGBA(acc,.6);c.shadowBlur=50;c.fillStyle=acc;c.fillRect(0,403,FL_W,14);c.restore();
  flHead(c,44,true);
  g=c.createRadialGradient(540,820,0,540,820,700);g.addColorStop(0,'#163049');g.addColorStop(.6,'#0d1b2a');g.addColorStop(1,'#08121d');c.fillStyle=g;c.fillRect(0,820,FL_W,530);
  let y=858;const s1=flFit(c,T.t1,900,62,960);c.fillStyle=FL_FOAM;c.textAlign='center';c.textBaseline='top';c.fillText(T.t1,540,y);y+=s1*1.12;
  if(T.t2)y+=flHi(c,T.t2,540,y,62,acc)+16;
  y+=flWrapC(c,T.sub,540,y,940,30,400,'#dbe5ee',1.3,2)+12;
  const ps=[T.p1,T.p2,T.p3].filter(Boolean);
  if(ps.length){flFont(c,800,28);const ws=ps.map(p=>c.measureText(p).width+60),tot=ws.reduce((a,b)=>a+b,0)+14*(ps.length-1);let x=540-tot/2;
   ps.forEach((p,i)=>{rrect(c,x,y,ws[i],60,30);c.lineWidth=2.5;c.strokeStyle=mtRGBA(acc,.55);c.stroke();c.fillStyle=FL_FOAM;c.textAlign='center';c.textBaseline='middle';c.fillText(p,x+ws[i]/2,y+31);x+=ws[i]+14})}
  flCta(c,FL_H-128);
 }else if(FL.tpl==='chez'){
  c.fillStyle='#08121d';c.fillRect(0,0,FL_W,FL_H);flCover(c,B||A,0,0,FL_W,860,.5,.58);
  const g=c.createLinearGradient(0,0,0,860);g.addColorStop(0,'rgba(8,18,29,.9)');g.addColorStop(.38,'rgba(8,18,29,.35)');g.addColorStop(.6,'rgba(8,18,29,.25)');g.addColorStop(1,FL_INK);c.fillStyle=g;c.fillRect(0,0,FL_W,860);
  c.fillStyle=FL_INK;c.fillRect(0,859,FL_W,FL_H-859);
  flHead(c,52,true);let y=150;
  c.save();c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=40;const s1=flFit(c,T.t1,900,108,960);c.fillStyle=FL_FOAM;c.textAlign='center';c.textBaseline='top';c.fillText(T.t1,540,y);c.restore();y+=s1*1.04;
  if(T.t2)y+=flHi(c,T.t2,540,y,96,acc)+18;
  c.save();c.shadowColor='rgba(0,0,0,.8)';c.shadowBlur=16;flWrapC(c,T.sub,540,y,940,32,600,FL_FOAM,1.3,2);c.restore();
  const ps=[T.p1,T.p2,T.p3].filter(Boolean),cw=(952-18*(ps.length-1))/Math.max(1,ps.length),cy=FL_H-128-60-250;
  ps.forEach((p,i)=>{const x=64+i*(cw+18);rrect(c,x,cy,cw,250,26);c.fillStyle='rgba(19,38,59,.92)';c.fill();c.lineWidth=2.5;c.strokeStyle=mtRGBA(acc,.35);c.stroke();
   c.beginPath();c.arc(x+cw/2,cy+62,32,0,7);c.fillStyle=acc;c.fill();flFont(c,900,34);c.fillStyle=FL_INK;c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),x+cw/2,cy+64);
   flWrapC(c,p,x+cw/2,cy+120,cw-30,flFit(c,p,800,28,(cw-30)*1.9),800,FL_FOAM,1.2,2)});
  flCta(c,FL_H-128);
 }else if(FL.tpl==='promo'){
  const g=c.createRadialGradient(540,300,0,540,300,1200);g.addColorStop(0,'#163049');g.addColorStop(.5,'#0d1b2a');g.addColorStop(1,'#08121d');c.fillStyle=g;c.fillRect(0,0,FL_W,FL_H);
  flHead(c,48);
  /* pastille */
  const r=132,bx=540,by=270;c.save();c.translate(bx,by);c.rotate(-8*Math.PI/180);c.shadowColor=mtRGBA(acc,.55);c.shadowBlur=60;
  c.beginPath();for(let i=0;i<32;i++){const a=i*Math.PI/16,rr=i%2?r*.9:r;c.lineTo(rr*Math.cos(a),rr*Math.sin(a))}c.closePath();c.fillStyle=acc;c.fill();c.shadowColor='transparent';
  const ks=flFit(c,T.kick||'OFFRE',900,92,r*1.6);c.fillStyle=FL_INK;c.textAlign='center';c.textBaseline='middle';c.fillText(T.kick||'OFFRE',0,ks*.04);c.restore();
  let y=430;const s1=flFit(c,T.t1,900,96,960);c.fillStyle=FL_FOAM;c.textAlign='center';c.textBaseline='top';c.fillText(T.t1,540,y);y+=s1*1.06;
  if(T.t2)y+=flHi(c,T.t2,540,y,80,acc)+16;
  y+=flWrapC(c,T.sub,540,y,920,34,600,'#dbe5ee',1.3,2)+22;
  const ps=[T.p1,T.p2,T.p3].filter(Boolean),pH=ps.length?70:0,ph=Math.max(260,FL_H-128-36-pH-y);
  c.save();c.shadowColor='rgba(0,0,0,.55)';c.shadowBlur=50;c.shadowOffsetY=20;rrect(c,70,y,940,ph,30);c.fillStyle=FL_FOAM;c.fill();c.restore();
  c.save();rrect(c,76,y+6,928,ph-12,26);c.clip();flCover(c,B||A,76,y+6,928,ph-12,.5,.55);c.restore();
  if(B)flTag(c,'APRÈS',100,y+ph-82,true);
  y+=ph+22;
  if(ps.length){flFont(c,800,28);const ws=ps.map(p=>c.measureText(p).width+60),tot=ws.reduce((a,b)=>a+b,0)+14*(ps.length-1);let x=540-tot/2;
   ps.forEach((p,i)=>{rrect(c,x,y,ws[i],56,28);c.lineWidth=2.5;c.strokeStyle=mtRGBA(acc,.6);c.stroke();c.fillStyle=FL_FOAM;c.textAlign='center';c.textBaseline='middle';c.fillText(p,x+ws[i]/2,y+29);x+=ws[i]+14})}
  flCta(c,FL_H-128);
 }else if(FL.tpl==='avis'){
  c.fillStyle='#08121d';c.fillRect(0,0,FL_W,FL_H);flCover(c,B||A,0,0,FL_W,FL_H,.5,.55);
  c.fillStyle='rgba(8,18,29,.72)';c.fillRect(0,0,FL_W,FL_H);
  const g=c.createLinearGradient(0,FL_H-420,0,FL_H);g.addColorStop(0,'rgba(13,27,42,0)');g.addColorStop(1,FL_INK);c.fillStyle=g;c.fillRect(0,FL_H-420,FL_W,420);
  flHead(c,52,true);
  const yb=FL_H-128-118;
  let qs=54;flFont(c,700,qs);while(qs>34&&mtWrap(c,T.sub,900,9).length>6){qs-=2;flFont(c,700,qs)}
  const nl=Math.min(6,mtWrap(c,T.sub,900,6).length),n=Math.max(0,Math.min(5,Math.round(parseFloat(String(T.p2).replace(',','.'))||0)));
  const hq=170,blk=hq+nl*qs*1.28+30+(n?80:0)+(T.p1?44:0);let y=Math.max(130,130+(yb-60-130-blk)/2);
  c.save();c.font=`900 260px Georgia,"Times New Roman",serif`;c.fillStyle=acc;c.textAlign='center';c.textBaseline='top';c.fillText('“',540,y-20);c.restore();y+=hq;
  c.save();c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=20;
  y+=flWrapC(c,T.sub,540,y,900,qs,700,FL_FOAM,1.28,6)+30;c.restore();
  if(n){for(let i=0;i<5;i++)flStar(c,540+(i-2)*66,y+26,26,i<n?'#f2c14e':'rgba(255,255,255,.2)');y+=80}
  if(T.p1){flFont(c,800,34);c.fillStyle=FL_FOAM;c.textAlign='center';c.textBaseline='top';c.fillText('— '+T.p1,540,y)}
  flFont(c,900,54);const t=T.t1+' ',w1=c.measureText(t).width,w2=c.measureText(T.t2||'').width;let s=54;while(s>28&&(w1+w2)*s/54>960)s-=2;
  flFont(c,900,s);const W1=c.measureText(t).width,W2=c.measureText(T.t2||'').width,x0=540-(W1+W2)/2;c.textAlign='left';c.textBaseline='top';c.fillStyle=FL_FOAM;c.fillText(t,x0,yb);c.fillStyle=acc;c.fillText(T.t2||'',x0+W1,yb);
  flCta(c,FL_H-128);
 }else if(FL.tpl==='formules'){
  const g=c.createRadialGradient(540,0,0,540,0,1300);g.addColorStop(0,'#163049');g.addColorStop(.5,'#0d1b2a');g.addColorStop(1,'#08121d');c.fillStyle=g;c.fillRect(0,0,FL_W,FL_H);
  c.save();rrect(c,56,130,968,330,30);c.clip();flCover(c,B||A,56,130,968,330,.5,.55);const g2=c.createLinearGradient(0,130,0,460);g2.addColorStop(0,'rgba(8,18,29,.1)');g2.addColorStop(1,'rgba(8,18,29,.55)');c.fillStyle=g2;c.fillRect(56,130,968,330);c.restore();
  flHead(c,44);
  let y=490;flFont(c,900,84);const t=T.t1+' ',w1=c.measureText(t).width,w2=c.measureText(T.t2||'').width;let s=84;while(s>36&&(w1+w2)*s/84>960)s-=2;
  flFont(c,900,s);const W1=c.measureText(t).width,W2=c.measureText(T.t2||'').width,x0=540-(W1+W2)/2;c.textAlign='left';c.textBaseline='top';c.fillStyle=FL_FOAM;c.fillText(t,x0,y);c.fillStyle=acc;c.fillText(T.t2||'',x0+W1,y);y+=s*1.12;
  y+=flWrapC(c,T.sub,540,y,940,30,400,'#dbe5ee',1.3,1)+22;
  const ps=[T.p1,T.p2,T.p3].filter(Boolean),gap=16,ch=Math.min(150,(FL_H-128-36-y-gap*(ps.length-1))/Math.max(1,ps.length));
  ps.forEach((p,i)=>{const cy=y+i*(ch+gap),m=p.split(/\s+[—–-]\s+|\s*:\s+/),nm=m[0],dt=m.slice(1).join(' — ');
   rrect(c,56,cy,968,ch,24);c.fillStyle=i===1?mtRGBA(acc,.16):'rgba(19,38,59,.9)';c.fill();c.lineWidth=i===1?3:2;c.strokeStyle=i===1?acc:mtRGBA(acc,.3);c.stroke();
   c.beginPath();c.arc(56+70,cy+ch/2,34,0,7);c.fillStyle=acc;c.fill();flFont(c,900,36);c.fillStyle=FL_INK;c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),56+70,cy+ch/2+2);
   const ns=flFit(c,nm,900,46,760);c.fillStyle=FL_FOAM;c.textAlign='left';c.textBaseline='middle';c.fillText(nm,56+132,cy+ch/2-(dt?ns*.45:0));
   if(dt){flFit(c,dt,500,28,760);c.fillStyle='#b9c7d3';c.fillText(dt,56+132,cy+ch/2+30)}});
  flCta(c,FL_H-128);
 }else if(FL.tpl==='clair'){
  c.fillStyle=FL_FOAM;c.fillRect(0,0,FL_W,FL_H);
  const g=c.createRadialGradient(FL_W,0,0,FL_W,0,900);g.addColorStop(0,mtRGBA(acc,.28));g.addColorStop(1,mtRGBA(acc,0));c.fillStyle=g;c.fillRect(0,0,FL_W,FL_H);
  flHead(c,52,false,true);
  let y=150;const s1=flFit(c,T.t1,900,104,960);c.fillStyle=FL_INK;c.textAlign='center';c.textBaseline='top';c.fillText(T.t1,540,y);y+=s1*1.05;
  if(T.t2)y+=flHi(c,T.t2,540,y,84,acc)+16;
  y+=flWrapC(c,T.sub,540,y,940,32,500,'#3b4d5e',1.3,2)+24;
  const ps=[T.p1,T.p2,T.p3].filter(Boolean),pH=ps.length?66:0,ph=Math.max(300,FL_H-128-40-pH-y);
  c.save();c.shadowColor='rgba(13,27,42,.35)';c.shadowBlur=50;c.shadowOffsetY=22;rrect(c,70,y,940,ph,34);c.fillStyle='#fff';c.fill();c.restore();
  c.save();rrect(c,70,y,940,ph,34);c.clip();
  if(A&&B){flCover(c,A,70,y,470,ph,.5,.55);flCover(c,B,540,y,470,ph,.5,.55);c.fillStyle='#fff';c.fillRect(536,y,8,ph)}else flCover(c,B||A,70,y,940,ph,.5,.55);c.restore();
  if(A&&B){flTag(c,'AVANT',94,y+ph-76,false);flTag(c,'APRÈS',564,y+ph-76,true)}
  y+=ph+26;
  if(ps.length){const cw=968/ps.length;ps.forEach((p,i)=>{flFit(c,p,700,27,cw-56);const w=c.measureText(p).width+42,x=56+cw*i+cw/2-w/2;flCheck(c,x,y,flDeep(acc));c.fillStyle=FL_INK;c.textAlign='left';c.textBaseline='middle';c.fillText(p,x+42,y+16)})}
  flCta(c,FL_H-128,true);
 }else if(FL.tpl==='diagonale'){
  const H=1000;c.fillStyle='#08121d';c.fillRect(0,0,FL_W,FL_H);flCover(c,A,0,0,FL_W,H,.5,.55);
  c.save();c.beginPath();c.moveTo(FL_W*.62,0);c.lineTo(FL_W,0);c.lineTo(FL_W,H);c.lineTo(FL_W*.38,H);c.closePath();c.clip();flCover(c,B,0,0,FL_W,H,.5,.55);c.restore();
  c.save();c.shadowColor=mtRGBA(acc,.7);c.shadowBlur=40;c.strokeStyle=acc;c.lineWidth=12;c.beginPath();c.moveTo(FL_W*.62,-10);c.lineTo(FL_W*.38,H+10);c.stroke();c.restore();
  let g=c.createLinearGradient(0,0,0,230);g.addColorStop(0,'rgba(8,18,29,.85)');g.addColorStop(1,'rgba(8,18,29,0)');c.fillStyle=g;c.fillRect(0,0,FL_W,230);
  g=c.createLinearGradient(0,H-200,0,H);g.addColorStop(0,'rgba(13,27,42,0)');g.addColorStop(1,FL_INK);c.fillStyle=g;c.fillRect(0,H-200,FL_W,200);
  c.fillStyle=FL_INK;c.fillRect(0,H,FL_W,FL_H-H);
  flHead(c,46,true);flPill(c,'AVANT',40,170,30,'rgba(13,27,42,.92)','#fff','l','rgba(255,255,255,.45)');flPill(c,'APRÈS',FL_W-40,H-150,30,acc,FL_INK,'r');
  let y=H-10;flFont(c,900,80);const t=T.t1+' ',w1=c.measureText(t).width,w2=c.measureText(T.t2||'').width;let s=80;while(s>32&&(w1+w2)*s/80>980)s-=2;
  flFont(c,900,s);const W1=c.measureText(t).width,W2=c.measureText(T.t2||'').width,x0=540-(W1+W2)/2;c.textAlign='left';c.textBaseline='top';c.fillStyle=FL_FOAM;c.fillText(t,x0,y);c.fillStyle=acc;c.fillText(T.t2||'',x0+W1,y);y+=s*1.12;
  flWrapC(c,T.sub,540,y,960,30,400,'#dbe5ee',1.3,1);
  flCta(c,FL_H-128);
 }else{
  c.fillStyle=FL_INK;c.fillRect(0,0,FL_W,FL_H);flCover(c,A,0,0,540,980,.45,.6);flCover(c,B,540,0,540,980,.45,.6);
  c.save();c.shadowColor=mtRGBA(acc,.6);c.shadowBlur=50;c.fillStyle=acc;c.fillRect(533,0,14,980);c.restore();
  let g=c.createLinearGradient(0,0,0,260);g.addColorStop(0,'rgba(8,18,29,.88)');g.addColorStop(1,'rgba(8,18,29,0)');c.fillStyle=g;c.fillRect(0,0,FL_W,260);
  g=c.createLinearGradient(0,760,0,980);g.addColorStop(0,'rgba(13,27,42,0)');g.addColorStop(1,FL_INK);c.fillStyle=g;c.fillRect(0,760,FL_W,220);
  flHead(c,46,true);flPill(c,'AVANT',36,792,30,'rgba(13,27,42,.92)','#fff','l','rgba(255,255,255,.45)');flPill(c,'APRÈS',576,792,30,acc,FL_INK,'l');
  let y=986;flFont(c,900,70);const sp=' ',w1=c.measureText(T.t1+sp).width,w2=c.measureText(T.t2||'').width;let s=70;
  while(s>30&&(w1+w2)*s/70>980)s-=2;flFont(c,900,s);const W1=c.measureText(T.t1+sp).width,W2=c.measureText(T.t2||'').width,x0=540-(W1+W2)/2;
  c.textAlign='left';c.textBaseline='top';c.fillStyle=FL_FOAM;c.fillText(T.t1+sp,x0,y);c.fillStyle=acc;c.fillText(T.t2||'',x0+W1,y);y+=s*1.15;
  flWrapC(c,T.sub,540,y,960,30,400,'#dbe5ee',1.3,2);
  flCta(c,FL_H-128)}}

/* ---------- écran ---------- */
async function flLoadImg(blob){if(!blob)return null;try{return await createImageBitmap(blob)}catch(e){const u=URL.createObjectURL(blob);try{return await loadImg(u)}catch(e2){return null}}}
async function flPhotos(){ /* toutes les photos des nettoyages de l'activité */
 const out=[];for(const s of (await getSessions()).filter(s=>tplOf(s).act===flAct()).sort((a,b)=>b.ts-a.ts)){
  for(const m of await getMedia(s.id))if(m.type==='photo'&&m.phase!=='pendant')out.push({m,s})}
 return out}
async function flOpen(){
 revoke();document.body.classList.remove('has-tab');sess=null;
 if(!FL.logo)FL.logo=await loadImg('images/logo-ab.png').catch(()=>null);
 FL.acc=lsGet('pb_fl_acc','#35e0c9');FL.th=lsGet('pb_fl_th','sombre');
 FL.tpl=lsGet('pb_fl_tpl','main');if(!FL_TPL[FL.tpl])FL.tpl='main';FL.txt=flTxt();
 const ph=await flPhotos();
 if(!FL.av&&!FL.ap){ /* paire avant/après de la même zone, du nettoyage le plus récent */
  for(const x of ph)if(x.m.phase==='avant'){const y=ph.find(p=>p.s.id===x.s.id&&p.m.zone===x.m.zone&&p.m.phase==='apres');if(y){FL.av=x.m;FL.ap=y.m;break}}
  if(!FL.av){FL.av=(ph.find(p=>p.m.phase==='avant')||{}).m||null;FL.ap=(ph.find(p=>p.m.phase==='apres')||{}).m||null}}
 [FL.avI,FL.apI]=await Promise.all([flLoadImg(FL.av&&FL.av.blob),flLoadImg(FL.ap&&FL.ap.blob)]);
 const T=FL.txt;
 $('#app').innerHTML=`<header><div class="row"><button id="back" class="ic-only" aria-label="Retour">${ico('back')}</button><div class="sp ht"><b>Flyer</b><small>${esc(ACT[flAct()].l)} · 1080 × 1350</small></div></div></header>
 <div class="mt">
  <div class="mtv"><canvas id="flcv" width="${FL_W}" height="${FL_H}" style="max-height:56vh"></canvas></div>
  <div class="row mtgo"><button class="sp primary" id="flsave">${ico('upload')} Enregistrer / partager</button></div>
  <div class="lbl">Modèle · ${Object.keys(FL_TPL).length} variantes</div><div class="fltpls" id="fltpl"></div>
  <div class="lbl">Photos</div>
  <div class="row" style="gap:10px"><button class="sp" id="flav">${ico('camera')} Photo AVANT</button><button class="sp" id="flap">${ico('camera')} Photo APRÈS</button></div>
  <div class="hint" style="margin:6px 0 0">Touche un bouton, puis choisis une photo de tes nettoyages ou de ta galerie.</div>
  <div class="aic"><div class="hd"><div class="bd">${ico('sparkles')}</div><div class="sp"><b>Textes par Claude</b><small>Facultatif · aucune photo n’est envoyée</small></div></div>
   <textarea id="flcons" rows="2" maxlength="300" aria-label="Ta consigne pour Claude" placeholder="Ex. : promo -20 % en novembre, ton chaleureux">${esc(lsGet('pb_fl_cons',''))}</textarea>
   <button class="primary go" id="flai">${ico('sparkles')} Écrire les textes · ≈ ${aiEur(typeof AI_PRICE!=='undefined'?(1500*AI_PRICE.in+1200*AI_PRICE.out)/1e6:.03)}</button>
   <div class="hint" id="flaist" style="margin:0;display:none"></div></div>
  <div class="lbl">Textes</div><div id="fltx">${Object.entries(FL_FIELDS).map(([k,l])=>{const F=FL_TPL[FL.tpl].f||{},L=k in F?F[k]:l;return L===null?'':`<label class="rng">${esc(L)}${k==='sub'?`<textarea rows="${FL.tpl==='avis'?4:2}" maxlength="${FL.tpl==='avis'?300:120}" data-f="${k}">${esc(T[k]||'')}</textarea>`:`<input type="text" maxlength="60" data-f="${k}" value="${esc(T[k]||'')}">`}</label>`}).join('')}</div>
  <div class="lbl">Contact</div>
  <label class="rng">Site<input type="text" id="flsite" maxlength="60" value="${esc(flSite())}"></label>
  <label class="rng">Téléphone (vide = masqué)<input type="text" id="fltel" maxlength="20" value="${esc(flTel())}"></label>
  <div class="lbl">Couleur</div><div class="seg" id="flacc" style="flex-wrap:wrap"></div>
  <div id="flthw" style="display:none"><div class="lbl">Fond</div><div class="seg" id="flth"></div></div>
 </div>`;
 const cv=$('#flcv'),draw=()=>flDraw(cv);draw();
 $('#back').onclick=()=>home();
 flThumbs();
 const ACCS={'#35e0c9':{l:'Turquoise'},'#2bc4ff':{l:'Bleu'},'#f2c14e':{l:'Or'},'#ff7a6b':{l:'Corail'},'#a78bfa':{l:'Violet'},'#7ee081':{l:'Vert'}};
 mtChoice('flacc',ACCS,FL.acc,k=>{FL.acc=k;lsSet('pb_fl_acc',k);draw();flThumbs()});
 const thw=$('#flthw');if(thw){if(FL_TPL[FL.tpl].th){thw.style.display='';mtChoice('flth',FL_TH,FL.th,k=>{FL.th=k;lsSet('pb_fl_th',k);draw();flThumbs()})}else thw.style.display='none'}
 $('#fltx').oninput=e=>{const i=e.target.closest('[data-f]');if(!i)return;FL.txt[i.dataset.f]=i.value;flSave();draw()};
 $('#flsite').oninput=e=>{lsSet('pb_fl_site_'+flAct(),e.target.value.trim());draw()};
 $('#fltel').oninput=e=>{lsSet('pb_fl_tel',e.target.value.trim());draw()};
 $('#flcons').oninput=e=>lsSet('pb_fl_cons',e.target.value);
 $('#flav').onclick=()=>flPick('av',ph);$('#flap').onclick=()=>flPick('ap',ph);
 $('#flsave').onclick=()=>cv.toBlob(async b=>{if(!b)return;const name=`flyer-${slug(FL_TPL[FL.tpl].l)}-${new Date().toISOString().slice(0,10)}.jpg`,file=new File([b],name,{type:'image/jpeg'});
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file]});return}}catch(e){if(e&&e.name==='AbortError')return}
  dl(b,name)},'image/jpeg',.92);
 $('#flai').onclick=flAI;
 window.scrollTo(0,0)}
function flPick(which,ph){
 const d=$('#dlg');
 d.innerHTML=`<h3>Photo ${which==='av'?'AVANT':'APRÈS'}</h3>
 <button id="flgal" style="width:100%">${ico('import')} Choisir dans la galerie</button>
 ${ph.length?`<div class="ai-grid" id="flg" style="max-height:52vh;overflow:auto">${ph.map((x,j)=>`<button data-j="${j}" aria-label="${esc(PH[x.m.phase]+' · '+x.s.name)}"><img src="${url(x.m.blob)}" alt="" loading="lazy"></button>`).join('')}</div>`:'<p class="small-hint">Aucune photo dans tes nettoyages pour l’instant.</p>'}
 <button id="cl" style="width:100%;margin-top:10px">Fermer</button>`;
 const set=async blob=>{FL[which]={blob};FL[which+'I']=await flLoadImg(blob);d.close();flDraw($('#flcv'))};
 const g=$('#flg');if(g)g.onclick=e=>{const b=e.target.closest('[data-j]');if(b)set(ph[+b.dataset.j].m.blob)};
 $('#flgal').onclick=()=>{const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=()=>{const f=inp.files&&inp.files[0];if(f)set(f)};inp.click()};
 $('#cl').onclick=()=>d.close();d.showModal()}
async function flAI(){
 if(FL.busy)return;
 if(typeof aiPro!=='function'||!aiPro()){toast('Connecte ton espace pro (Réglages) pour utiliser Claude');return}
 const st=$('#flaist'),b=$('#flai');FL.busy=true;b.disabled=true;st.style.display='';st.className='hint';st.textContent='Claude écrit les textes…';
 const j=await aiCall({mode:'flyer',modele:FL_TPL[FL.tpl].l,activite:ACT[flAct()].l,site:flSite(),consigne:($('#flcons')||{}).value||'',actuel:FL.txt});
 FL.busy=false;if(!$('#flai'))return;b.disabled=false;
 if(j.error||!j.prop){st.className='hint warn';st.textContent=(AI_ERR[j.error]||(j.detail?'Claude a refusé la demande : '+j.detail:'Claude n’a pas pu écrire les textes.'))+(j.cost?'':' Rien n’a été débité.');return}
 const F=FL_TPL[FL.tpl].f||{},keep=FL.tpl==='avis'?['sub','p1','p2']:[]; /* un avis client n'est jamais écrit par Claude */
 for(const k in FL_FIELDS)if(typeof j.prop[k]==='string'&&F[k]!==null&&!keep.includes(k))FL.txt[k]=j.prop[k].slice(0,60);
 flSave();toast('Textes écrits par Claude');flOpen()}

/* miniatures des modèles (dessinées avec tes photos et tes textes) */
function flThumbs(){
 const el=$('#fltpl');if(!el)return;const cur=FL.tpl,txt=FL.txt;
 el.innerHTML=Object.entries(FL_TPL).map(([k,v])=>`<button data-v="${k}" class="${k===cur?'on':''}"><canvas width="${FL_W/5}" height="${FL_H/5}"></canvas><span>${esc(v.l)}</span></button>`).join('');
 el.querySelectorAll('[data-v]').forEach(b=>{FL.tpl=b.dataset.v;FL.txt=flTxt();try{flDraw(b.querySelector('canvas'),.2)}catch(e){}});
 FL.tpl=cur;FL.txt=txt;
 el.onclick=e=>{const b=e.target.closest('[data-v]');if(!b||b.dataset.v===FL.tpl)return;FL.tpl=b.dataset.v;lsSet('pb_fl_tpl',FL.tpl);flOpen()}}
