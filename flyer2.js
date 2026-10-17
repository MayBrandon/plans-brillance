/* Plans Brillance · Flyers, variantes supplémentaires
   Chaque modèle ici accepte 3 fonds (sombre, clair, couleur) en plus des couleurs d'accent.
   S'appuie sur flyer.js (FL, FL_TPL, flCover, flFit, flWrapC…). */

const FL_TH={sombre:{l:'Sombre'},clair:{l:'Clair'},couleur:{l:'Couleur'}};
function flP(){
 const a=FL.acc,th=FL_TH[FL.th]?FL.th:'sombre';
 if(th==='clair')return {th,bg1:'#fbf8f0',bg2:'#ece6d6',glow:mtRGBA(a,.22),tx:FL_INK,sub:'#3b4d5e',card:'#ffffff',cardLine:'rgba(13,27,42,.12)',hb:a,ht:FL_INK,acc:flDeep(a),cb:a,ct:FL_INK,tel:FL_INK,frame:'#ffffff',shadow:'rgba(13,27,42,.28)'};
 if(th==='couleur')return {th,bg1:a,bg2:flDeep(a),glow:'rgba(255,255,255,.25)',tx:FL_INK,sub:'rgba(13,27,42,.82)',card:'rgba(255,255,255,.28)',cardLine:'rgba(13,27,42,.25)',hb:FL_INK,ht:a,acc:FL_INK,cb:FL_INK,ct:a,tel:FL_INK,frame:'#ffffff',shadow:'rgba(0,0,0,.35)'};
 return {th,bg1:'#163049',bg2:'#08121d',glow:mtRGBA(a,.18),tx:FL_FOAM,sub:'#dbe5ee',card:'rgba(19,38,59,.92)',cardLine:mtRGBA(a,.35),hb:a,ht:FL_INK,acc:a,cb:a,ct:FL_INK,tel:FL_FOAM,frame:FL_FOAM,shadow:'rgba(0,0,0,.55)'}}
function f2Bg(c,P){
 const g=c.createRadialGradient(540,0,0,540,0,1400);g.addColorStop(0,P.bg1);g.addColorStop(1,P.bg2);c.fillStyle=g;c.fillRect(0,0,FL_W,FL_H);
 const h=c.createRadialGradient(FL_W,FL_H,0,FL_W,FL_H,900);h.addColorStop(0,P.glow);h.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=h;c.fillRect(0,0,FL_W,FL_H)}
function f2Head(c,y,P,shadow){
 const lg=FL.logo,lh=58,lw=lg?lg.width*lh/lg.height:0,brand='ATELIER BRILLANCE ',b2=flBrand();
 c.letterSpacing='5px';flFont(c,700,25);const w1=c.measureText(brand).width;flFont(c,900,25);const w2=c.measureText(b2).width;
 let x=FL_W/2-(lw+(lg?16:0)+w1+w2)/2;
 c.save();if(shadow){c.shadowColor='rgba(0,0,0,.7)';c.shadowBlur=14}
 if(lg){if(P.th!=='sombre'&&!shadow){rrect(c,x-8,y-6,lw+16,lh+12,12);c.fillStyle=FL_INK;c.fill()}c.drawImage(lg,x,y,lw,lh);x+=lw+16}
 c.textAlign='left';c.textBaseline='middle';flFont(c,700,25);c.fillStyle=shadow?FL_FOAM:P.tx;c.fillText(brand,x,y+lh/2);
 flFont(c,900,25);c.fillStyle=shadow?FL.acc:P.acc;c.fillText(b2,x+w1,y+lh/2);c.restore();c.letterSpacing='0px'}
function f2Hi(c,txt,cx,y,s,P,maxW=FL_W-150){
 s=flFit(c,txt,900,s,maxW);const tw=c.measureText(txt).width,h=s*1.12,pad=s*.36;
 rrect(c,cx-tw/2-pad,y,tw+pad*2,h,18);c.fillStyle=P.hb;c.fill();
 c.fillStyle=P.ht;c.textAlign='center';c.textBaseline='middle';c.fillText(txt,cx,y+h/2+s*.04);return h}
function f2Line(c,t1,t2,cx,y,s,P,maxW=960,col){ /* titre sur une ligne, 2e partie en couleur */
 flFont(c,900,s);const t=t1+(t2?' ':''),k=Math.min(1,maxW/(c.measureText(t).width+c.measureText(t2||'').width||1));s=Math.max(28,Math.floor(s*k));
 flFont(c,900,s);const W1=c.measureText(t).width,W2=c.measureText(t2||'').width,x0=cx-(W1+W2)/2;
 c.textAlign='left';c.textBaseline='top';c.fillStyle=col||P.tx;c.fillText(t,x0,y);c.fillStyle=P.acc;c.fillText(t2||'',x0+W1,y);return s*1.12}
function f2Cta(c,y,P){
 const site=flSite(),tel=flTel();flFont(c,900,34);const sw=c.measureText(site).width+68;flFont(c,800,32);const tw=tel?c.measureText(tel).width:0;
 let x=FL_W/2-(sw+(tel?22+tw:0))/2;
 c.save();if(P.th==='sombre'){c.shadowColor=mtRGBA(FL.acc,.4);c.shadowBlur=50}rrect(c,x,y,sw,78,39);c.fillStyle=P.cb;c.fill();c.restore();
 flFont(c,900,34);c.fillStyle=P.ct;c.textAlign='center';c.textBaseline='middle';c.fillText(site,x+sw/2,y+40);
 if(tel){flFont(c,800,32);c.fillStyle=P.tel;c.textAlign='left';c.fillText(tel,x+sw+22,y+40)}}
function f2Photo(c,img,x,y,w,h,r,P,o={}){
 c.save();if(o.rot){c.translate(x+w/2,y+h/2);c.rotate(o.rot*Math.PI/180);x=-w/2;y=-h/2}
 c.shadowColor=P.shadow;c.shadowBlur=o.blur??50;c.shadowOffsetY=o.dy??20;
 const fr=o.frame??0;rrect(c,x,y,w,h,r);c.fillStyle=fr?P.frame:'#16283a';c.fill();c.shadowColor='transparent';
 c.save();rrect(c,x+fr,y+fr,w-fr*2,h-fr*2-(o.bottom||0),Math.max(4,r-fr));c.clip();flCover(c,img,x+fr,y+fr,w-fr*2,h-fr*2-(o.bottom||0),o.px??.5,o.py??.55);c.restore();
 if(o.tag)flTag(c,o.tag,x+fr+18,y+h-fr-(o.bottom||0)-74,o.tag==='APRÈS');
 if(o.cap){flFont(c,800,o.capS||36);c.fillStyle=FL_INK;c.textAlign='center';c.textBaseline='middle';c.fillText(o.cap,x+w/2,y+h-(o.bottom||0)/2-fr/2)}
 c.restore()}
function f2Chips(c,ps,y,P,s=28){
 ps=ps.filter(Boolean);if(!ps.length)return 0;flFont(c,800,s);const ws=ps.map(p=>c.measureText(p).width+60),tot=ws.reduce((a,b)=>a+b,0)+14*(ps.length-1);let x=540-tot/2;
 ps.forEach((p,i)=>{rrect(c,x,y,ws[i],s*2.1,s*1.05);c.fillStyle=P.card;c.fill();c.lineWidth=2.5;c.strokeStyle=P.cardLine;c.stroke();c.fillStyle=P.tx;c.textAlign='center';c.textBaseline='middle';c.fillText(p,x+ws[i]/2,y+s*1.05+1);x+=ws[i]+14});return s*2.1}
function f2Checks(c,ps,y,P){
 ps=ps.filter(Boolean);if(!ps.length)return 0;const cw=968/ps.length;
 ps.forEach((p,i)=>{flFit(c,p,700,27,cw-56);const w=c.measureText(p).width+42,x=56+cw*i+cw/2-w/2;flCheck(c,x,y,P.acc);c.fillStyle=P.tx;c.textAlign='left';c.textBaseline='middle';c.fillText(p,x+42,y+16)});return 34}
function f2Circle(c,img,cx,cy,r,P,ring,tag){
 c.save();c.shadowColor=P.shadow;c.shadowBlur=50;c.shadowOffsetY=18;c.beginPath();c.arc(cx,cy,r+ring,0,7);c.fillStyle=P.frame;c.fill();c.restore();
 c.save();c.beginPath();c.arc(cx,cy,r,0,7);c.clip();flCover(c,img,cx-r,cy-r,r*2,r*2,.5,.55);c.restore();
 if(tag){c.save();flFont(c,900,28);const w=c.measureText(tag).width+50;rrect(c,cx-w/2,cy+r-24,w,52,26);c.fillStyle=tag==='APRÈS'?FL.acc:'rgba(13,27,42,.95)';c.fill();
  c.fillStyle=tag==='APRÈS'?FL_INK:'#fff';c.textAlign='center';c.textBaseline='middle';c.fillText(tag,cx,cy+r+3);c.restore()}}

/* ---------- les modèles ---------- */
const F2={
 polaroid:{l:'Polaroïds',d:{kick:'',t1:'AVANT',t2:'APRÈS',sub:'Nettoyage à la main, chez vous · Amiens & alentours',p1:'Fait à la main',p2:'À domicile',p3:'Devis rapide'},
  x(c,T,A,B,P){f2Bg(c,P);f2Head(c,52,P);let y=150;y+=f2Line(c,T.t1,T.t2,540,y,96,P)+4;y+=flWrapC(c,T.sub,540,y,940,32,500,P.sub,1.3,2)+20;
   const w=440,h=560,top=Math.min(y+10,FL_H-128-60-h-30);
   f2Photo(c,A,70,top+20,w,h,10,P,{frame:22,bottom:80,rot:-6,cap:'Avant'});f2Photo(c,B,570,top,w,h,10,P,{frame:22,bottom:80,rot:5,cap:'Après ✓'});
   f2Checks(c,[T.p1,T.p2,T.p3],FL_H-128-66,P);f2Cta(c,FL_H-128,P)}},
 loupe:{l:'La loupe',d:{kick:'',t1:'REGARDEZ',t2:'LA DIFFÉRENCE',sub:'Nettoyage à domicile · Amiens & alentours',p1:'',p2:'',p3:''},f:{kick:null,p1:null,p2:null,p3:null},
  x(c,T,A,B,P){c.fillStyle='#08121d';c.fillRect(0,0,FL_W,FL_H);flCover(c,B||A,0,0,FL_W,1010,.5,.55);
   let g=c.createLinearGradient(0,0,0,240);g.addColorStop(0,'rgba(8,18,29,.85)');g.addColorStop(1,'rgba(8,18,29,0)');c.fillStyle=g;c.fillRect(0,0,FL_W,240);
   flTag(c,'APRÈS',44,930,true);f2Circle(c,A,800,420,200,P,14,'AVANT');
   c.save();c.strokeStyle=P.frame;c.lineWidth=26;c.lineCap='round';c.beginPath();c.moveTo(800+150,420+150);c.lineTo(800+215,420+215);c.stroke();c.restore();
   f2Head(c,46,P,true);c.fillStyle=P.bg2;c.fillRect(0,1010,FL_W,FL_H-1010);
   if(P.th!=='sombre'){c.fillStyle=P.bg1;c.fillRect(0,1010,FL_W,FL_H-1010)}
   let y=1024;y+=f2Line(c,T.t1,T.t2,540,y,64,P);flWrapC(c,T.sub,540,y,960,28,500,P.sub,1.3,1);f2Cta(c,FL_H-122,P)}},
 cercles:{l:'Cercles',d:{kick:'',t1:'DU SALE',t2:'AU PROPRE',sub:'On vient chez vous · Amiens & alentours',p1:'Fait à la main',p2:'Produits adaptés',p3:'Sur rendez-vous'},
  x(c,T,A,B,P){f2Bg(c,P);f2Head(c,52,P);f2Circle(c,A,330,440,200,P,12,'AVANT');f2Circle(c,B,700,560,250,P,14,'APRÈS');
   c.save();c.strokeStyle=P.acc;c.lineWidth=8;c.setLineDash([2,18]);c.lineCap='round';c.beginPath();c.moveTo(330,230);c.quadraticCurveTo(620,150,760,290);c.stroke();c.restore();
   let y=860;y+=f2Line(c,T.t1,T.t2,540,y,84,P);y+=flWrapC(c,T.sub,540,y,940,30,500,P.sub,1.3,2)+16;f2Chips(c,[T.p1,T.p2,T.p3],y,P,26);f2Cta(c,FL_H-128,P)}},
 colonne:{l:'Colonne',d:{kick:'À DOMICILE',t1:'VOTRE VOITURE',t2:'COMME NEUVE',sub:'Intérieur nettoyé à la main, chez vous ou au travail.',p1:'Aspiration complète',p2:'Sièges et tapis',p3:'Plastiques et vitres'},
  x(c,T,A,B,P){f2Bg(c,P);flCover(c,B||A,540,0,540,FL_H,.5,.55);
   const g=c.createLinearGradient(440,0,640,0);g.addColorStop(0,P.bg2);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(440,0,200,FL_H);
   c.fillStyle=P.bg2;c.fillRect(0,0,450,FL_H);if(P.th!=='sombre'){c.fillStyle=P.bg1;c.fillRect(0,0,450,FL_H)}
   c.save();c.shadowColor=P.shadow;c.shadowBlur=30;f2Photo(c,A,600,FL_H-128-60-330,250,330,18,P,{frame:8,tag:'AVANT',blur:40});c.restore();
   flTag(c,'APRÈS',FL_W-200,60,true);
   let x=56,y=70;const lg=FL.logo;if(lg){const lh=50,lw=lg.width*lh/lg.height;if(P.th!=='sombre'){rrect(c,x-8,y-6,lw+16,lh+12,12);c.fillStyle=FL_INK;c.fill()}c.drawImage(lg,x,y,lw,lh)}
   y=170;if(T.kick){flFont(c,800,24);c.letterSpacing='4px';c.fillStyle=P.acc;c.textAlign='left';c.textBaseline='top';c.fillText(T.kick,x,y);c.letterSpacing='0px';y+=50}
   flFont(c,900,74);c.fillStyle=P.tx;c.textAlign='left';c.textBaseline='top';const L1=mtWrap(c,T.t1,370,3);L1.forEach(l=>{c.fillText(l,x,y);y+=80});
   flFont(c,900,74);c.fillStyle=P.acc;mtWrap(c,T.t2||'',370,3).forEach(l=>{c.fillText(l,x,y);y+=80});y+=20;
   flFont(c,500,30);c.fillStyle=P.sub;mtWrap(c,T.sub,370,4).forEach(l=>{c.fillText(l,x,y);y+=40});y+=30;
   [T.p1,T.p2,T.p3].filter(Boolean).forEach(p=>{flCheck(c,x,y,P.acc);flFont(c,700,27);c.fillStyle=P.tx;c.textBaseline='middle';mtWrap(c,p,320,2).forEach((l,i)=>c.fillText(l,x+44,y+16+i*32));c.textBaseline='top';y+=78});
   flFont(c,900,30);c.fillStyle=P.tx;c.textAlign='left';c.textBaseline='top';c.fillText(flSite(),x,FL_H-150);if(flTel()){flFont(c,800,30);c.fillStyle=P.acc;c.fillText(flTel(),x,FL_H-104)}}},
 magazine:{l:'Magazine',d:{kick:'AVANT / APRÈS',t1:'L’INTÉRIEUR',t2:'RETROUVÉ',sub:'Nettoyage à la main, à domicile · Amiens & alentours',p1:'',p2:'',p3:''},f:{p1:null,p2:null,p3:null},
  x(c,T,A,B,P){c.fillStyle='#08121d';c.fillRect(0,0,FL_W,FL_H);flCover(c,B||A,0,0,FL_W,FL_H,.5,.5);
   let g=c.createLinearGradient(0,0,0,300);g.addColorStop(0,'rgba(8,18,29,.85)');g.addColorStop(1,'rgba(8,18,29,0)');c.fillStyle=g;c.fillRect(0,0,FL_W,300);
   g=c.createLinearGradient(0,620,0,FL_H);g.addColorStop(0,'rgba(8,18,29,0)');g.addColorStop(.45,'rgba(8,18,29,.85)');g.addColorStop(1,'rgba(8,18,29,.98)');c.fillStyle=g;c.fillRect(0,620,FL_W,FL_H-620);
   f2Head(c,46,P,true);if(A)f2Photo(c,A,FL_W-300,150,250,320,20,{...P,frame:'#fff'},{frame:8,tag:'AVANT',blur:40});
   let y=FL_H-128-60-300;
   if(T.kick){flFont(c,800,26);c.letterSpacing='5px';c.fillStyle=FL.acc;c.textAlign='left';c.textBaseline='top';c.fillText(T.kick,60,y);c.letterSpacing='0px';y+=52}
   const s1=flFit(c,T.t1,900,120,960);c.fillStyle='#fff';c.textAlign='left';c.textBaseline='top';c.fillText(T.t1,56,y);y+=s1*1.02;
   const s2=flFit(c,T.t2||'',900,120,960);c.fillStyle=FL.acc;c.fillText(T.t2||'',56,y);y+=s2*1.1;
   flFont(c,500,30);c.fillStyle='#dbe5ee';mtWrap(c,T.sub,940,2).forEach(l=>{c.fillText(l,58,y);y+=40});
   f2Cta(c,FL_H-128,{...flP(),th:'sombre',cb:FL.acc,ct:FL_INK,tel:FL_FOAM})}},
 grille:{l:'Grille',d:{kick:'',t1:'NETTOYAGE',t2:'À DOMICILE',sub:'Amiens & alentours',p1:'Fait à la main',p2:'Produits adaptés',p3:'Prix annoncé à l’avance'},
  x(c,T,A,B,P){f2Bg(c,P);f2Head(c,40,P);const g=18,x0=40,y0=120,w=(FL_W-x0*2-g)/2,h=(FL_H-128-40-y0-g)/2;
   f2Photo(c,A,x0,y0,w,h,26,P,{tag:'AVANT',blur:30,dy:10});
   rrect(c,x0+w+g,y0,w,h,26);c.fillStyle=P.th==='couleur'?FL_INK:FL.acc;c.fill();
   let y=y0+60;c.fillStyle=P.th==='couleur'?FL.acc:FL_INK;flFont(c,900,flFit(c,T.t1,900,72,w-60));c.textAlign='center';c.textBaseline='top';
   mtWrap(c,T.t1,w-60,2).forEach(l=>{c.fillText(l,x0+w+g+w/2,y);y+=78});c.fillStyle=P.th==='couleur'?'#fff':'#fff';flFont(c,900,flFit(c,T.t2||'',900,64,w-60));
   mtWrap(c,T.t2||'',w-60,2).forEach(l=>{c.fillText(l,x0+w+g+w/2,y);y+=70});y+=10;
   c.fillStyle=P.th==='couleur'?'rgba(255,255,255,.85)':'rgba(13,27,42,.8)';flFont(c,600,28);mtWrap(c,T.sub,w-60,3).forEach(l=>{c.fillText(l,x0+w+g+w/2,y);y+=36});
   rrect(c,x0,y0+h+g,w,h,26);c.fillStyle=P.card;c.fill();c.lineWidth=2;c.strokeStyle=P.cardLine;c.stroke();
   y=y0+h+g+60;[T.p1,T.p2,T.p3].filter(Boolean).forEach(p=>{flCheck(c,x0+40,y,P.acc);flFont(c,700,28);c.fillStyle=P.tx;c.textAlign='left';c.textBaseline='middle';mtWrap(c,p,w-120,2).forEach((l,i)=>c.fillText(l,x0+90,y+16+i*34));y+=h/3.6});
   f2Photo(c,B,x0+w+g,y0+h+g,w,h,26,P,{tag:'APRÈS',blur:30,dy:10});f2Cta(c,FL_H-128,P)}},
 ticket:{l:'Bon de réduction',d:{kick:'-10 %',t1:'BON DE',t2:'RÉDUCTION',sub:'Écris ici les conditions de ton offre',p1:'Sur présentation de ce flyer',p2:'',p3:''},
  f:{kick:'Gros texte du bon (ex. -10 %)',t1:'Titre',t2:'Mot en couleur',sub:'Conditions',p1:'Petite ligne',p2:null,p3:null},
  x(c,T,A,B,P){f2Bg(c,P);f2Head(c,52,P);f2Photo(c,B||A,70,140,940,380,30,P,{tag:B?'APRÈS':''});
   const y0=560,h=FL_H-128-40-y0;c.save();c.shadowColor=P.shadow;c.shadowBlur=40;c.shadowOffsetY=16;rrect(c,70,y0,940,h,30);c.fillStyle=P.th==='sombre'?FL_FOAM:'#fff';c.fill();c.restore();
   c.save();c.fillStyle=P.bg2;for(const sx of [70,1010]){c.beginPath();c.arc(sx,y0+h*.36,34,0,7);c.fill()}c.restore();
   c.save();c.strokeStyle='rgba(13,27,42,.35)';c.lineWidth=4;c.setLineDash([16,14]);c.beginPath();c.moveTo(120,y0+h*.36);c.lineTo(960,y0+h*.36);c.stroke();c.restore();
   flFont(c,500,40);c.fillStyle='rgba(13,27,42,.5)';c.textAlign='left';c.textBaseline='middle';c.fillText('✂',96,y0+h*.36-26);
   let y=y0+30;y+=f2Line(c,T.t1,T.t2,540,y,64,{...P,tx:FL_INK,acc:flDeep(FL.acc)},860);flWrapC(c,T.sub,540,y,820,28,500,'#3b4d5e',1.3,2);
   const ky=y0+h*.36+24,ks=flFit(c,T.kick||'',900,170,820);c.fillStyle=flDeep(FL.acc);c.textAlign='center';c.textBaseline='top';c.fillText(T.kick||'',540,ky);
   if(T.p1){flFont(c,600,26);c.fillStyle='#3b4d5e';c.fillText(T.p1,540,ky+ks*1.02)}
   f2Cta(c,FL_H-128,P)}},
 typo:{l:'Gros titre',d:{kick:'',t1:'SALE ?',t2:'PLUS POUR LONGTEMPS.',sub:'Nettoyage à la main, à domicile · Amiens & alentours',p1:'',p2:'',p3:''},f:{kick:null,p1:null,p2:null,p3:null},
  x(c,T,A,B,P){f2Bg(c,P);f2Head(c,52,P);let y=160;
   const s1=flFit(c,T.t1,900,250,960);c.fillStyle=P.tx;c.textAlign='center';c.textBaseline='top';c.fillText(T.t1,540,y);y+=s1*1.0;
   flFont(c,900,92);const L=mtWrap(c,T.t2||'',960,3);let s2=92;while(s2>40&&L.length>2){s2-=4;flFont(c,900,s2)}c.fillStyle=P.acc;mtWrap(c,T.t2||'',960,2).forEach(l=>{c.fillText(l,540,y);y+=s2*1.05});y+=24;
   const h=Math.max(260,FL_H-128-40-80-y),w=(940-20)/2;f2Photo(c,A,70,y,w,h,26,P,{tag:'AVANT',blur:30});f2Photo(c,B,70+w+20,y,w,h,26,P,{tag:'APRÈS',blur:30});
   flWrapC(c,T.sub,540,y+h+22,940,28,500,P.sub,1.3,1);f2Cta(c,FL_H-128,P)}},
 cadre:{l:'Cadre',d:{kick:'',t1:'NETTOYAGE',t2:'À DOMICILE',sub:'Amiens & alentours · sur rendez-vous',p1:'',p2:'',p3:''},f:{kick:null,p1:null,p2:null,p3:null},
  x(c,T,A,B,P){c.fillStyle=P.th==='couleur'?FL_INK:FL.acc;c.fillRect(0,0,FL_W,FL_H);const m=40;
   c.save();rrect(c,m,m,FL_W-m*2,FL_H-m*2,30);c.clip();flCover(c,B||A,m,m,FL_W-m*2,FL_H-m*2,.5,.5);
   let g=c.createLinearGradient(0,m,0,320);g.addColorStop(0,'rgba(8,18,29,.85)');g.addColorStop(1,'rgba(8,18,29,0)');c.fillStyle=g;c.fillRect(0,0,FL_W,320);
   g=c.createLinearGradient(0,760,0,FL_H);g.addColorStop(0,'rgba(8,18,29,0)');g.addColorStop(1,'rgba(8,18,29,.96)');c.fillStyle=g;c.fillRect(0,760,FL_W,FL_H-760);c.restore();
   f2Head(c,80,P,true);if(A)f2Circle(c,A,FL_W-200,330,120,P,10,'AVANT');if(B)flTag(c,'APRÈS',80,560,true);
   let y=FL_H-128-60-200;const s1=flFit(c,T.t1,900,110,940);c.fillStyle='#fff';c.textAlign='center';c.textBaseline='top';c.fillText(T.t1,540,y);y+=s1*1.04;
   if(T.t2)y+=f2Hi(c,T.t2,540,y,84,{...P,hb:FL.acc,ht:FL_INK},900)+12;flWrapC(c,T.sub,540,y,900,28,600,'#fff',1.3,1);
   f2Cta(c,FL_H-140,{...P,th:'sombre',cb:FL.acc,ct:FL_INK,tel:'#fff'})}},
 dispo:{l:'Disponibilités',d:{kick:'DISPO',t1:'CRÉNEAUX',t2:'CETTE SEMAINE',sub:'Réservez vite, on vient chez vous',p1:'Mardi',p2:'Jeudi',p3:'Samedi'},
  f:{kick:'Pastille',t1:'Titre',t2:'Mot en couleur',sub:'Phrase',p1:'Jour / créneau 1',p2:'Jour / créneau 2',p3:'Jour / créneau 3'},
  x(c,T,A,B,P){f2Bg(c,P);f2Head(c,52,P);f2Photo(c,B||A,70,140,940,420,30,P,{tag:B?'APRÈS':''});
   if(T.kick){c.save();c.translate(900,180);c.rotate(10*Math.PI/180);const ks=flFit(c,T.kick,900,40,200);const w=c.measureText(T.kick).width+60;rrect(c,-w/2,-36,w,72,36);c.fillStyle=P.th==='couleur'?FL_INK:FL.acc;c.fill();
    c.fillStyle=P.th==='couleur'?FL.acc:FL_INK;c.textAlign='center';c.textBaseline='middle';c.fillText(T.kick,0,ks*.04);c.restore()}
   let y=600;const s1=flFit(c,T.t1,900,96,960);c.fillStyle=P.tx;c.textAlign='center';c.textBaseline='top';c.fillText(T.t1,540,y);y+=s1*1.06;
   if(T.t2)y+=f2Hi(c,T.t2,540,y,70,P)+18;y+=flWrapC(c,T.sub,540,y,940,30,500,P.sub,1.3,1)+22;
   const ps=[T.p1,T.p2,T.p3].filter(Boolean),cw=(940-20*(ps.length-1))/Math.max(1,ps.length),ch=Math.min(170,FL_H-128-40-y);
   ps.forEach((p,i)=>{const x=70+i*(cw+20);rrect(c,x,y,cw,ch,24);c.fillStyle=P.card;c.fill();c.lineWidth=2.5;c.strokeStyle=P.cardLine;c.stroke();
    c.fillStyle=P.acc;c.fillRect(x+cw/2-30,y+26,60,8);const s=flFit(c,p,900,44,cw-30);c.fillStyle=P.tx;c.textAlign='center';c.textBaseline='middle';c.fillText(p,x+cw/2,y+ch/2+14)});
   f2Cta(c,FL_H-128,P)}},
 equipe:{l:'Fait main',d:{kick:'NETTOYAGE PRO',t1:'FAIT',t2:'À LA MAIN',sub:'Chaque recoin nettoyé à la main, avec du matériel pro, chez vous.',p1:'Matériel pro',p2:'Produits adaptés',p3:'Sur rendez-vous'},
  x(c,T,A,B,P){f2Bg(c,P);f2Head(c,52,P);
   if(T.kick){flFont(c,800,28);c.letterSpacing='4px';const w=c.measureText(T.kick).width+68;rrect(c,540-w/2,140,w,60,30);c.fillStyle=P.hb;c.fill();c.fillStyle=P.ht;c.textAlign='center';c.textBaseline='middle';c.fillText(T.kick,540,171);c.letterSpacing='0px'}
   let y=232;y+=f2Line(c,T.t1,T.t2,540,y,104,P)+4;y+=flWrapC(c,T.sub,540,y,900,32,500,P.sub,1.3,2)+26;
   const ps=[T.p1,T.p2,T.p3].filter(Boolean),ph=FL_H-128-50-y-(ps.length?120:0),w=(940-20)/2;
   f2Photo(c,A,70,y,w,ph,26,P,{tag:'AVANT',blur:30});f2Photo(c,B,70+w+20,y,w,ph,26,P,{tag:'APRÈS',blur:30});y+=ph+24;
   if(ps.length){const cw=(940-20*(ps.length-1))/ps.length;ps.forEach((p,i)=>{const x=70+i*(cw+20);rrect(c,x,y,cw,80,20);c.fillStyle=P.card;c.fill();c.lineWidth=2;c.strokeStyle=P.cardLine;c.stroke();
    flCheck(c,x+22,y+24,P.acc);flFit(c,p,800,25,cw-84);c.fillStyle=P.tx;c.textAlign='left';c.textBaseline='middle';c.fillText(p,x+64,y+41)})}
   f2Cta(c,FL_H-128,P)}},
 bulle:{l:'Bulle',d:{kick:'',t1:'« ELLE EST COMME NEUVE ! »',t2:'',sub:'Ce que vous direz après notre passage',p1:'Nettoyage auto à domicile',p2:'',p3:''},
  f:{kick:null,t1:'Texte de la bulle',t2:null,sub:'Phrase',p1:'Ligne du bas',p2:null,p3:null},
  x(c,T,A,B,P){f2Bg(c,P);f2Head(c,52,P);f2Photo(c,B||A,70,590,940,FL_H-128-50-590-90,30,P,{tag:B?'APRÈS':''});
   const bx=90,by=150,bw=900,bh=300;c.save();c.shadowColor=P.shadow;c.shadowBlur=40;c.shadowOffsetY=14;rrect(c,bx,by,bw,bh,46);c.fillStyle=P.th==='couleur'?FL_INK:FL.acc;c.fill();
   c.beginPath();c.moveTo(bx+170,by+bh-2);c.lineTo(bx+130,by+bh+70);c.lineTo(bx+270,by+bh-2);c.closePath();c.fill();c.restore();
   flFont(c,900,74);let s=74;while(s>36&&mtWrap(c,T.t1,bw-90,4).length>3){s-=4;flFont(c,900,s)}const L=mtWrap(c,T.t1,bw-90,3);
   c.fillStyle=P.th==='couleur'?FL.acc:FL_INK;c.textAlign='center';c.textBaseline='middle';L.forEach((l,i)=>c.fillText(l,540,by+bh/2+(i-(L.length-1)/2)*s*1.08));
   flWrapC(c,T.sub,600,by+bh+40,700,30,600,P.sub,1.3,1);
   if(T.p1){flFont(c,800,30);c.fillStyle=P.tx;c.textAlign='center';c.textBaseline='top';c.fillText(T.p1,540,FL_H-128-74)}
   f2Cta(c,FL_H-128,P)}},
};
for(const [k,v] of Object.entries(F2))FL_TPL[k]={l:v.l,d:v.d,f:v.f,x:v.x,th:true};
