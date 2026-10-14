/* Plans Brillance · Claude prépare le montage
   - Réservé aux comptes autorisés (variable CLAUDE_EMAILS) connectés à un espace pro.
   - La clé ANTHROPIC_API_KEY reste sur Netlify, jamais dans l'appli.
   - Ne reçoit que des images réduites validées à l'écran ; aucune vidéo, rien n'est stocké. */

const PRO = {
  auto: { url: 'https://gaxgdiljpafogsaahyax.supabase.co', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheGdkaWxqcGFmb2dzYWFoeWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMzQwNTUsImV4cCI6MjEwMjcxMDA1NX0.TEc0ikwvkUWT43kCnkBC8pu-czKo7n9ii-o8dNmxFnw' },
  groupe: { url: 'https://ucaobkkblsrgzohugqiu.supabase.co', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjYW9ia2tibHNyZ3pvaHVncWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3Nzc5NTEsImV4cCI6MjEwNjM1Mzk1MX0.F4JgB60X399X56bcAtMIBNpo_FZplRTX7b6V-vrWo7A' }
};
/* prix en $ par million de jetons (entrée / sortie) */
const PRICE = { 'claude-sonnet-5-5': [2, 10], 'claude-opus-5-5': [4, 20], 'claude-haiku-4-5-20251001': [1, 5] };
const MAX_IMG = 48, MAX_IMG_B64 = 450000, MAX_MEDIA = 200;

const env = k => (globalThis.Netlify ? Netlify.env.get(k) : process.env[k]) || '';
const out = (o, status = 200) => Response.json(o, { status, headers: { 'cache-control': 'no-store' } });
const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').slice(0, n);

const TOOL = {
  name: 'proposer_montage',
  description: 'Renvoie la proposition de montage vidéo.',
  input_schema: {
    type: 'object',
    properties: {
      titre: { type: 'string', description: 'Titre court de la vidéo (max 40 caractères).' },
      accroche: {
        type: 'object', description: 'Le plan qui ouvre la vidéo, le plus parlant.',
        properties: { id: { type: 'string' }, texte: { type: 'string', description: 'Texte à l’écran, max 40 caractères.' }, duree: { type: 'number', description: 'Durée en secondes (1.5 à 3).' } },
        required: ['id', 'texte']
      },
      plans: {
        type: 'array', description: 'Les plans gardés, dans l’ordre, après l’accroche (sans la répéter).',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            vu: { type: 'string', description: 'Ce que montre le plan, en quelques mots (sert pour les corrections).' },
            texte: { type: 'string', description: 'Sous-titre à l’écran, max 40 caractères, en français.' },
            duree: { type: 'number', description: 'Durée en secondes (0.8 à 6).' }
          },
          required: ['id', 'vu', 'texte', 'duree']
        }
      },
      ecartes: {
        type: 'array', description: 'Plans écartés (flous, en double, sans intérêt, ou montrant une plaque / un visage / des papiers).',
        items: { type: 'object', properties: { id: { type: 'string' }, raison: { type: 'string' } }, required: ['id', 'raison'] }
      },
      conseil: { type: 'string', description: 'Une phrase de conseil pour la publication (facultatif).' }
    },
    required: ['titre', 'accroche', 'plans', 'ecartes']
  }
};

const SYSTEM = `Tu es le monteur vidéo d'Atelier Brillance (nettoyage à domicile, Amiens et alentours).
Tu prépares des vidéos courtes pour Instagram, Facebook et TikTok à partir des plans d'un nettoyage.
Règles :
- Choisis l'accroche la plus forte (saleté visible, gros contraste) : elle ouvre la vidéo.
- Ordonne les plans pour raconter : avant → pendant → après, zone par zone, sauf si la consigne ou le style demande autre chose.
- Écarte les plans flous, en double ou sans intérêt, et TOUJOURS ceux où on voit une plaque d'immatriculation lisible, un visage ou des papiers.
- Textes à l'écran : courts (max 40 caractères), en français, percutants, sans emoji, sans promesse chiffrée inventée.
- Respecte la durée cible si elle est donnée (somme des durées ≈ cible).
- Utilise uniquement les identifiants de médias fournis (m1, m2…).
- La consigne de l'utilisateur passe avant tes habitudes, tant qu'elle respecte ces règles.
Réponds uniquement en appelant l'outil proposer_montage (obligatoire), sans texte autour.`;

function mediaLine(m) {
  const t = m.type === 'video' ? `vidéo ${Number(m.dur || 0).toFixed(1)} s` : 'photo';
  return `${clean(m.id, 8)} — ${clean(m.ph, 12).toUpperCase()} · ${clean(m.zone, 40)} · ${t}${m.vu ? ' · vu : ' + clean(m.vu, 120) : ''}`;
}

export default async (req) => {
  if (req.method !== 'POST') return out({ error: 'method' }, 405);
  let b;
  try { b = await req.json() } catch { return out({ error: 'bad' }, 400) }

  /* 1. qui demande ? (compte d'un espace pro, et dans la liste autorisée) */
  const P = PRO[b.pro];
  if (!P || typeof b.token !== 'string' || b.token.length > 4000) return out({ error: 'auth' }, 401);
  let email = '';
  try {
    const r = await fetch(P.url + '/auth/v1/user', { headers: { apikey: P.key, Authorization: 'Bearer ' + b.token } });
    if (r.ok) email = String((await r.json()).email || '').toLowerCase();
  } catch {}
  const allowed = env('CLAUDE_EMAILS').toLowerCase().split(/[\s,;]+/).filter(Boolean);
  if (!email) return out({ error: 'auth' }, 401);
  if (!allowed.includes(email)) return out({ error: 'forbidden' }, 403);

  /* 2. la clé est-elle branchée ? */
  const key = env('ANTHROPIC_API_KEY');
  if (!key) return out({ error: 'nokey' }, 503);
  if (b.mode === 'ping') return out({ ok: true });
  if (b.mode === 'decoupe') return decoupe(b, key);
  if (b.mode === 'flyer') return flyer(b, key);

  /* 3. contenu */
  const medias = Array.isArray(b.medias) ? b.medias.slice(0, MAX_MEDIA) : [];
  if (!medias.length) return out({ error: 'bad' }, 400);
  const ctx = [
    `Nettoyage : ${clean(b.titre, 80)} (${clean(b.prestation, 60)})`,
    `Style de montage choisi : ${clean(b.style, 40)} · format ${clean(b.format, 20)}${b.cible ? ` · durée cible ${Number(b.cible) | 0} s` : ''}`,
    b.consigne ? `Consigne de l'utilisateur : « ${clean(b.consigne, 600)} »` : 'Pas de consigne particulière.'
  ].join('\n');

  const content = [];
  if (b.mode === 'corrige') {
    const prev = JSON.stringify(b.proposition || {}).slice(0, 12000);
    content.push({ type: 'text', text: `${ctx}\n\nMédias disponibles :\n${medias.map(mediaLine).join('\n')}\n\nTa proposition actuelle (JSON) :\n${prev}\n\nCorrection demandée : « ${clean(b.correction, 600)} »\nApplique la correction et renvoie la proposition complète mise à jour. Garde le reste tel quel.` });
  } else {
    const imgs = Array.isArray(b.images) ? b.images.slice(0, MAX_IMG) : [];
    if (!imgs.length) return out({ error: 'bad' }, 400);
    content.push({ type: 'text', text: `${ctx}\n\nVoici les plans du nettoyage. Pour les vidéos, plusieurs images extraites du même média.` });
    const byId = new Map(medias.map(m => [m.id, m]));
    const seen = new Map();
    for (const im of imgs) {
      const m = byId.get(im.m);
      if (!m || typeof im.data !== 'string' || im.data.length > MAX_IMG_B64 || !/^[A-Za-z0-9+/=]+$/.test(im.data)) continue;
      const n = (seen.get(im.m) || 0) + 1; seen.set(im.m, n);
      content.push({ type: 'text', text: mediaLine(m) + (m.type === 'video' ? ` · image ${n}` : '') });
      content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: im.data } });
    }
    if (!seen.size) return out({ error: 'bad' }, 400);
    const sans = medias.filter(m => !seen.has(m.id));
    if (sans.length) content.push({ type: 'text', text: `Médias sans image envoyée (à écarter) : ${sans.map(m => clean(m.id, 8)).join(', ')}` });
    content.push({ type: 'text', text: 'Propose le montage.' });
  }

  return ask(key, SYSTEM, TOOL, content);
};

/* appel à Claude (outil forcé) + coût réel */
async function ask(key, system, tool, content) {
  const model = env('CLAUDE_MODEL') || 'claude-opus-5-5';
  let r, j;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model, max_tokens: 12000, system,
        output_config: { effort: env('CLAUDE_EFFORT') || 'medium' },
        tools: [tool], tool_choice: { type: 'auto' },
        messages: [{ role: 'user', content }]
      })
    });
    j = await r.json().catch(() => ({}));
  } catch (e) { console.log('network error', String(e).slice(0, 200)); return out({ error: 'network' }, 502) }
  if (!r.ok) {
    const msg = String(j?.error?.message || '');
    if (/credit|balance|billing/i.test(msg)) return out({ error: 'credits' }, 402);
    if (r.status === 429 || r.status === 529) return out({ error: 'busy' }, 503);
    if (r.status === 401) return out({ error: 'badkey' }, 503);
    console.log('anthropic error', r.status, j?.error?.type, msg.slice(0, 300));
    return out({ error: 'api', status: r.status, detail: msg.slice(0, 200) }, 502);
  }
  /* ce modèle n'accepte pas d'outil forcé : on prend l'outil s'il l'a utilisé, sinon le JSON de sa réponse */
  let tu = (j.content || []).find(c => c.type === 'tool_use' && c.name === tool.name);
  if (!tu) {
    const txt = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
    const a = txt.indexOf('{'), z = txt.lastIndexOf('}');
    if (a >= 0 && z > a) { try { tu = { input: JSON.parse(txt.slice(a, z + 1)) } } catch {} }
  }
  const u = j.usage || {};
  const pr = PRICE[model] || PRICE['claude-opus-5-5'];
  const cost = ((u.input_tokens || 0) * pr[0] + (u.output_tokens || 0) * pr[1]) / 1e6;
  if (!tu) return out({ error: 'empty', cost }, 502);
  return out({ prop: tu.input, cost, usage: { in: u.input_tokens || 0, out: u.output_tokens || 0 }, model });
}

/* ---------- découpage automatique d'un rush ---------- */
const TOOL_CUT = {
  name: 'decouper_rush',
  description: 'Renvoie les passages à garder dans le rush, un par zone.',
  input_schema: {
    type: 'object',
    properties: {
      titre: { type: 'string', description: 'Titre court de la vidéo (max 40 caractères).' },
      style: { type: 'string', description: 'Identifiant du style de montage le plus adapté (seulement si une liste de styles est fournie).' },
      passages: {
        type: 'array', description: 'Un passage par zone vue dans le rush (au plus un par zone), dans l’ordre du montage : l’accroche en premier.',
        items: {
          type: 'object',
          properties: {
            source: { type: 'string', description: 'Identifiant de la source (v1, v2… pour une vidéo, p1, p2… pour une photo).' },
            zone: { type: 'string', description: 'Identifiant de zone fourni.' },
            debut: { type: 'number', description: 'Début en secondes dans la vidéo source (0 pour une photo).' },
            fin: { type: 'number', description: 'Fin en secondes (2 à 4 s après le début ; pour une photo : durée d’affichage, 1.5 à 3).' },
            texte: { type: 'string', description: 'Texte court à l’écran (max 28 caractères), en général le nom de la zone.' },
            vu: { type: 'string', description: 'Ce qu’on voit, en quelques mots.' }
          },
          required: ['source', 'zone', 'debut', 'fin', 'texte', 'vu']
        }
      }
    },
    required: ['titre', 'passages']
  }
};
const SYSTEM_CUT = `Tu es le monteur vidéo d'Atelier Brillance (nettoyage à domicile, Amiens et alentours).
Tu reçois des images extraites d'une ou plusieurs sources : vidéos filmées avec des lunettes (vue à la première personne) ou au téléphone, et parfois des photos. Chaque image indique sa source (v1, v2… ou p1, p2…) et, pour une vidéo, son minutage. Les sources sont numérotées dans l'ordre chronologique de prise de vue (les lunettes coupent à 5 minutes, donc une même séance peut tenir sur plusieurs vidéos, en alternance avec le téléphone). Tu reçois aussi la liste des zones du véhicule ou du logement.
But par défaut : une vidéo courte « état des lieux » qui montre l'état AVANT nettoyage, zone par zone, comme un teaser (sauf si le message précise un autre but).
Règles :
- Pour chaque zone réellement visible, choisis LE meilleur passage : saleté bien visible, image nette et stable, cadrage lisible. 2 à 4 secondes.
- Au plus un passage par zone (une zone = un identifiant). N'invente pas une zone que tu ne vois pas. 3 à 7 passages sauf indication contraire.
- Dans une même vidéo, les passages ne doivent pas se chevaucher. Si plusieurs sources montrent la même zone, garde la meilleure (nette, bien cadrée). Une photo peut servir de plan (surtout pour un avant/après net).
- Évite tout moment où l'on voit une plaque d'immatriculation lisible, un visage ou des papiers.
- Le premier passage est l'accroche : le plus frappant (plus sale, plus surprenant, ou le résultat le plus bluffant). Les suivants dans l'ordre logique (avant → pendant → après), sinon dans l'ordre du rush.
- Textes : courts, en français, sans emoji.
- Utilise uniquement les identifiants de zones fournis.
Réponds uniquement en appelant l'outil decouper_rush (obligatoire), sans texte autour.`;

async function decoupe(b, key) {
  const zones = (Array.isArray(b.zones) ? b.zones : []).slice(0, 150).map(z => ({ id: clean(z.id, 60), l: clean(z.l, 80) }));
  const styles = (Array.isArray(b.styles) ? b.styles : []).slice(0, 12).map(x => `${clean(x.id, 20)} — ${clean(x.l, 30)} : ${clean(x.d, 120)}`);
  const auto = b.phase === 'auto';
  const frames = (Array.isArray(b.images) ? b.images : []).slice(0, MAX_IMG);
  const duree = Math.max(1, Math.min(3600, Number(b.duree) || 0));
  if (!zones.length || !frames.length) return out({ error: 'bad' }, 400);
  const content = [{ type: 'text', text: [
    `Nettoyage : ${clean(b.titre, 80)} (${clean(b.prestation, 60)})`,
    auto ? `Vidéo brute du nettoyage (durée ${duree.toFixed(1)} s) : elle peut contenir l'avant, le pendant (action) et l'après. Déduis la phase de chaque passage d'après les images (sale = avant, en cours = pendant, propre = après).\nBut : une vidéo courte qui donne envie : accroche forte, l'état avant, l'action, puis le résultat. 4 à 10 passages. Si tu ne vois que l'avant, fais un état des lieux (3 à 7 passages).`
         : `Phase : ${clean(b.phase, 12).toUpperCase()} · durée du rush : ${duree.toFixed(1)} s`,
    styles.length ? `Styles de montage possibles (choisis le plus adapté dans « style ») :\n${styles.join('\n')}` : '',
    `Zones possibles (id — nom) :\n${zones.map(z => `${z.id} — ${z.l}`).join('\n')}`,
    b.consigne ? `Consigne de l'utilisateur : « ${clean(b.consigne, 600)} »` : ''
  ].filter(Boolean).join('\n\n') }];
  const sources = (Array.isArray(b.sources) ? b.sources : []).slice(0, 40);
  if (sources.length) content.push({ type: 'text', text: `Sources (ordre chronologique) :\n${sources.map(x => `${clean(x.id, 6)} — ${x.type === 'photo' ? 'photo' : `vidéo de ${Number(x.duree || 0).toFixed(1)} s`}`).join('\n')}` });
  let n = 0;
  for (const f of frames) {
    if (typeof f.data !== 'string' || f.data.length > MAX_IMG_B64 || !/^[A-Za-z0-9+/=]+$/.test(f.data)) continue;
    const sid = clean(f.src || 'v1', 6), st = sources.find(x => x.id === sid);
    content.push({ type: 'text', text: st && st.type === 'photo' ? `${sid} (photo)` : `${sid} · t = ${Number(f.t || 0).toFixed(1)} s` });
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: f.data } });
    n++;
  }
  if (!n) return out({ error: 'bad' }, 400);
  content.push({ type: 'text', text: 'Choisis les passages.' });
  return ask(key, SYSTEM_CUT, TOOL_CUT, content);
}

/* ---------- textes d'un flyer (texte seul, aucune image) ---------- */
const TOOL_FLY = {
  name: 'ecrire_flyer',
  description: 'Renvoie les textes du flyer.',
  input_schema: {
    type: 'object',
    properties: {
      kick: { type: 'string', description: 'Bandeau court en majuscules (max 24 caractères), peut être vide.' },
      t1: { type: 'string', description: 'Titre principal (max 28 caractères).' },
      t2: { type: 'string', description: 'Mot ou fin de titre mis en couleur (max 18 caractères).' },
      sub: { type: 'string', description: 'Phrase d’accroche (max 70 caractères).' },
      p1: { type: 'string', description: 'Point fort 1 (max 22 caractères).' },
      p2: { type: 'string', description: 'Point fort 2 (max 22 caractères).' },
      p3: { type: 'string', description: 'Point fort 3 (max 22 caractères).' }
    },
    required: ['kick', 't1', 't2', 'sub', 'p1', 'p2', 'p3']
  }
};
const SYSTEM_FLY = `Tu écris les textes d'un flyer Facebook/Instagram pour Atelier Brillance (nettoyage à domicile à Amiens et alentours, fait à la main).
Règles : français simple et direct, percutant, sans emoji, sans promesse chiffrée ou prix inventés (seulement ceux donnés dans la consigne), pas de superlatif mensonger. Respecte les longueurs maximales. Garde l'esprit du modèle et des textes actuels, améliore-les selon la consigne.
Réponds uniquement en appelant l'outil ecrire_flyer (obligatoire), sans texte autour.`;
async function flyer(b, key) {
  const actuel = b.actuel && typeof b.actuel === 'object' ? b.actuel : {};
  const cur = ['kick', 't1', 't2', 'sub', 'p1', 'p2', 'p3'].map(k => `${k} : « ${clean(actuel[k], 80)} »`).join('\n');
  const text = [
    `Activité : ${clean(b.activite, 40)} · site : ${clean(b.site, 60)}`,
    `Modèle de flyer : ${clean(b.modele, 40)}`,
    `Textes actuels :\n${cur}`,
    b.consigne ? `Consigne : « ${clean(b.consigne, 300)} »` : 'Pas de consigne : propose une version plus accrocheuse.'
  ].join('\n\n');
  return ask(key, SYSTEM_FLY, TOOL_FLY, [{ type: 'text', text }]);
}
