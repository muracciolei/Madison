// ==================== INTENT DETECTION ====================
// Scoring-based router. All 6 language keywords are loaded into the same
// scorer — whichever intent gets the highest score wins.
// Explicit prefix patterns receive a large bonus to resolve ambiguity.

const KEYWORD_SCORES = {
  weather: [
    // EN
    /\b(weather|temperature|rain|snow|forecast|hot|cold|warm|cool|climate|humidity|wind)\b/gi,
    // ES
    /\b(tiempo|temperatura|lluvia|nieve|pronóstico|clima|frío|calor|viento|humedad)\b/gi,
    // IT
    /\b(meteo|temperatura|pioggia|neve|previsioni|caldo|freddo|vento|umidità)\b/gi,
    // FR
    /\b(météo|température|pluie|neige|prévisions|chaud|froid|vent|humidité)\b/gi,
    // DE
    /\b(wetter|temperatur|regen|schnee|vorhersage|kalt|warm|wind|feuchtigkeit)\b/gi,
    // PT
    /\b(tempo|temperatura|chuva|neve|previsão|frio|calor|vento|umidade|clima)\b/gi,
  ],

  news: [
    // EN
    /\b(news|headlines?|article|report|latest|breaking|story|stories)\b/gi,
    // ES
    /\b(noticias|titulares?|artículo|informe|último|últimas|reportaje)\b/gi,
    // IT
    /\b(notizie|titoli|articolo|rapporto|ultime|aggiornamenti)\b/gi,
    // FR
    /\b(actualités|nouvelles|titre|article|rapport|dernières)\b/gi,
    // DE
    /\b(nachrichten|schlagzeilen?|artikel|bericht|aktuell|neueste)\b/gi,
    // PT
    /\b(notícias|manchetes?|artigo|relatório|últimas|recentes)\b/gi,
  ],

  nasa: [
    // EN
    /\b(nasa|space|astronaut|rocket|planet|mars|moon|stars?|galaxy|asteroid|comet|orbit|satellite|telescope|apod|astronomy)\b/gi,
    // ES + IT + FR + DE + PT (shared cognates)
    /\b(espacio|astronauta|cohete|planeta|luna|galaxia|asteroide|telescopio)\b/gi,
    /\b(spazio|astronauta|razzo|pianeta|luna|galassia|asteroide|telescopio)\b/gi,
    /\b(espace|astronaute|fusée|planète|lune|galaxie|astéroïde|télescope)\b/gi,
    /\b(weltall|astronaut|rakete|planet|mond|galaxie|asteroid|teleskop)\b/gi,
    /\b(espaço|astronauta|foguete|planeta|lua|galáxia|asteroide|telescópio)\b/gi,
  ],

  exchange: [
    // EN
    /\b(exchange|currency|dollar|euro|pound|yen|convert|rate|money|forex)\b/gi,
    // ES
    /\b(cambio|divisa|dólar|euro|libra|yen|convertir|tipo|moneda|dinero)\b/gi,
    // IT
    /\b(cambio|valuta|dollaro|euro|sterlina|yen|convertire|tasso|denaro)\b/gi,
    // FR
    /\b(change|devise|dollar|euro|livre|yen|convertir|taux|argent)\b/gi,
    // DE
    /\b(wechsel|währung|dollar|euro|pfund|yen|konvertieren|kurs|geld)\b/gi,
    // PT
    /\b(câmbio|moeda|dólar|euro|libra|iene|converter|taxa|dinheiro)\b/gi,
  ],

  dictionary: [
    // EN
    /\b(definition|meaning|define|pronunciation|synonym|antonym|etymology)\b/gi,
    // ES
    /\b(definición|significado|definir|pronunciación|sinónimo|antónimo)\b/gi,
    // IT
    /\b(definizione|significato|definire|pronuncia|sinonimo|antonimo)\b/gi,
    // FR
    /\b(définition|signification|définir|prononciation|synonyme|antonyme)\b/gi,
    // DE
    /\b(definition|bedeutung|definieren|aussprache|synonym|antonym)\b/gi,
    // PT
    /\b(definição|significado|definir|pronúncia|sinônimo|antônimo)\b/gi,
  ],

  wiki: [
    // EN
    /\b(who|what|where|when|why|how|explain|tell|about|history|biography|facts?)\b/gi,
    // ES
    /\b(quién|qué|dónde|cuándo|por\s+qué|cómo|explicar|sobre|historia|biografía)\b/gi,
    // IT
    /\b(chi|cosa|dove|quando|perché|come|spiegare|su|storia|biografia)\b/gi,
    // FR
    /\b(qui|quoi|où|quand|pourquoi|comment|expliquer|sur|histoire|biographie)\b/gi,
    // DE
    /\b(wer|was|wo|wann|warum|wie|erklären|über|geschichte|biografie)\b/gi,
    // PT
    /\b(quem|o\s+que|onde|quando|por\s+que|como|explicar|sobre|história|biografia)\b/gi,
  ],
};

// Explicit prefix patterns — large bonus overrides keyword ambiguity.
// Language-grouped so each group adds +20 to the target intent.
const PREFIX_BONUSES = [
  // Weather
  { pattern: /^(weather|forecast)\s+(?:in|at|for)\s+/i,           intent: 'weather',    bonus: 20 },
  { pattern: /^(tiempo|clima|temperatura|meteo|lluvia)\s+(?:en|a|para|in|à|pour|in|für|em)?\s+/i, intent: 'weather', bonus: 20 },
  { pattern: /^(meteo|tempo|previsioni)\s+(?:a|in|per)?\s+/i,     intent: 'weather',    bonus: 20 },
  { pattern: /^(météo|temps|température)\s+(?:à|en|pour)?\s+/i,   intent: 'weather',    bonus: 20 },
  { pattern: /^(wetter|temperatur|vorhersage)\s+(?:in|für|bei)?\s+/i, intent: 'weather', bonus: 20 },
  { pattern: /^(tempo|clima|temperatura|chuva)\s+(?:em|para|no?|na)?\s+/i, intent: 'weather', bonus: 20 },

  // News
  { pattern: /^(?:latest\s+)?news\b/i,                             intent: 'news',       bonus: 20 },
  { pattern: /^(?:últimas?\s+)?noticias\b/i,                       intent: 'news',       bonus: 20 },
  { pattern: /^(?:ultime\s+)?notizie\b/i,                          intent: 'news',       bonus: 20 },
  { pattern: /^(?:dernières?\s+)?(?:actualités|nouvelles)\b/i,     intent: 'news',       bonus: 20 },
  { pattern: /^(?:aktuelle\s+)?nachrichten\b/i,                    intent: 'news',       bonus: 20 },
  { pattern: /^(?:últimas?\s+)?notícias\b/i,                       intent: 'news',       bonus: 20 },

  // NASA / APOD
  { pattern: /^(?:nasa|apod|space\s+news|astronomy|picture\s+of\s+the\s+day|today.?s\s+(?:nasa\s+)?picture)\b/i, intent: 'nasa', bonus: 20 },
  { pattern: /^(?:noticias?\s+(?:de\s+)?nasa|imagen\s+del\s+día)\b/i, intent: 'nasa',   bonus: 20 },

  // Exchange
  { pattern: /^(?:convert|exchange\s+rate|how\s+much\s+is)\s+/i,  intent: 'exchange',   bonus: 20 },
  { pattern: /^(?:convertir|tipo\s+de\s+cambio|cuánto\s+vale)\s+/i, intent: 'exchange', bonus: 20 },
  { pattern: /^(?:convertire|tasso\s+di\s+cambio|quanto\s+vale)\s+/i, intent: 'exchange', bonus: 20 },
  { pattern: /^(?:convertir|taux\s+de\s+change|combien\s+vaut)\s+/i, intent: 'exchange', bonus: 20 },
  { pattern: /^(?:konvertieren|wechselkurs|wie\s+viel\s+ist)\s+/i, intent: 'exchange',  bonus: 20 },
  { pattern: /^(?:converter|taxa\s+de\s+câmbio|quanto\s+vale)\s+/i, intent: 'exchange', bonus: 20 },

  // Dictionary
  { pattern: /^(?:define|meaning\s+of|definition\s+of|pronunciation\s+of)\s+/i, intent: 'dictionary', bonus: 20 },
  { pattern: /^(?:definir|significado\s+de|definición\s+de|qué\s+significa)\s+/i, intent: 'dictionary', bonus: 20 },
  { pattern: /^(?:definire|significato\s+di|definizione\s+di|cosa\s+significa)\s+/i, intent: 'dictionary', bonus: 20 },
  { pattern: /^(?:définir|signification\s+de|définition\s+de|que\s+signifie)\s+/i, intent: 'dictionary', bonus: 20 },
  { pattern: /^(?:definieren|bedeutung\s+von|definition\s+von|was\s+bedeutet)\s+/i, intent: 'dictionary', bonus: 20 },
  { pattern: /^(?:definir|significado\s+de|definição\s+de|o\s+que\s+significa)\s+/i, intent: 'dictionary', bonus: 20 },

  // Wiki
  { pattern: /^(?:what\s+is|what\s+are|who\s+is|who\s+was|tell\s+me\s+about|explain|how\s+does)\s+/i, intent: 'wiki', bonus: 10 },
  { pattern: /^(?:qué\s+es|quién\s+es|quién\s+fue|cuéntame\s+sobre|explicar|háblame\s+de)\s+/i, intent: 'wiki', bonus: 10 },
  { pattern: /^(?:cos[\'']?è|che\s+cos[\'']?è|chi\s+è|chi\s+era|dimmi\s+di|parlami\s+di)\s+/i, intent: 'wiki', bonus: 10 },
  { pattern: /^(?:qu[\'']?est.ce\s+que|qui\s+est|qui\s+était|parle.moi\s+de|explique)\s+/i, intent: 'wiki', bonus: 10 },
  { pattern: /^(?:was\s+ist|wer\s+ist|wer\s+war|erkläre|erzähl\s+mir\s+von|über)\s+/i, intent: 'wiki', bonus: 10 },
  { pattern: /^(?:o\s+que\s+é|quem\s+é|quem\s+foi|fala.me\s+sobre|explica|sobre)\s+/i, intent: 'wiki', bonus: 10 },
];

// ---- Public: intent scorer ----
export function detectIntent(query) {
  const q = query.trim();
  const scores = { weather: 0, news: 0, nasa: 0, exchange: 0, dictionary: 0, wiki: 0 };

  for (const [intent, patterns] of Object.entries(KEYWORD_SCORES)) {
    for (const re of patterns) {
      const matches = q.match(re);
      if (matches) scores[intent] += matches.length;
    }
  }

  for (const { pattern, intent, bonus } of PREFIX_BONUSES) {
    if (pattern.test(q)) scores[intent] += bonus;
  }

  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return { type: top[1] > 0 ? top[0] : 'wiki', original: q };
}

// ---- Location extraction (language-aware) ----
const LOCATION_PATTERNS = {
  en: /weather\s+(?:in|at|for)?\s*(.+)/i,
  es: /(?:tiempo|clima|temperatura|meteo|pronóstico)\s+(?:en|a|para|de)?\s*(.+)/i,
  it: /(?:meteo|tempo|temperatura|previsioni)\s+(?:a|in|per|di)?\s*(.+)/i,
  fr: /(?:météo|temps|température|prévisions)\s+(?:à|en|pour|de)?\s*(.+)/i,
  de: /(?:wetter|temperatur|vorhersage)\s+(?:in|bei|für|von)?\s*(.+)/i,
  pt: /(?:tempo|clima|temperatura|previsão|chuva)\s+(?:em|para|no?|na|de)?\s*(.+)/i,
};

export function extractLocation(query, lang = 'en') {
  const p = LOCATION_PATTERNS[lang] ?? LOCATION_PATTERNS.en;
  const m = query.match(p) ?? query.match(LOCATION_PATTERNS.en);
  return m ? m[1].trim() : query.trim();
}

// ---- Word extraction (language-aware) ----
const WORD_PATTERNS = {
  en: [/^(?:meaning|definition)\s+of\s+(.+)/i, /^define\s+(.+)/i, /^pronunciation\s+of\s+(.+)/i, /^what\s+(?:is\s+)?the\s+(?:meaning|definition)\s+of\s+(.+)/i],
  es: [/^(?:significado|definición)\s+de\s+(.+)/i, /^definir\s+(.+)/i, /^(?:qué\s+significa|qué\s+quiere\s+decir)\s+(.+)/i],
  it: [/^(?:significato|definizione)\s+di\s+(.+)/i, /^definire\s+(.+)/i, /^(?:cosa\s+significa|cosa\s+vuol\s+dire)\s+(.+)/i],
  fr: [/^(?:signification|définition)\s+de\s+(.+)/i, /^définir\s+(.+)/i, /^(?:que\s+signifie|qu[\'']est.ce\s+que\s+signifie)\s+(.+)/i],
  de: [/^(?:bedeutung|definition)\s+von\s+(.+)/i, /^definieren\s+(.+)/i, /^(?:was\s+bedeutet|was\s+heißt)\s+(.+)/i],
  pt: [/^(?:significado|definição)\s+de\s+(.+)/i, /^definir\s+(.+)/i, /^(?:o\s+que\s+significa|o\s+que\s+quer\s+dizer)\s+(.+)/i],
};

export function extractWord(query, lang = 'en') {
  const patterns = [...(WORD_PATTERNS[lang] ?? []), ...WORD_PATTERNS.en];
  for (const p of patterns) {
    const m = query.match(p);
    if (m) return m[1].trim();
  }
  const clean = query.trim();
  return clean.split(/\s+/).length === 1 ? clean : null;
}

// ---- Wiki query cleaner (language-aware) ----
const WIKI_STRIP = {
  en: /^(?:what\s+is|what\s+are|who\s+is|who\s+was|define|definition\s+of|explain|tell\s+me\s+(?:about|more)|talk\s+(?:to\s+me\s+)?about|about|more\s+on|fact[s]?\s+about|fun\s+fact[s]?\s+about)\s+/i,
  es: /^(?:qué\s+es|qué\s+son|quién\s+es|quién\s+fue|definir|explicar|háblame\s+de|cuéntame\s+(?:sobre|de)|sobre)\s+/i,
  it: /^(?:cos[\'']?è|che\s+cos[\'']?è|chi\s+è|chi\s+era|definire|spiegare|dimmi\s+(?:di|su)|parlami\s+di)\s+/i,
  fr: /^(?:qu[\'']?est.ce\s+que|qu[\'']?est.ce\s+qu[\'']?est|qui\s+est|qui\s+était|définir|expliquer|parle.moi\s+de|dis.moi\s+(?:sur|à\s+propos\s+de))\s+/i,
  de: /^(?:was\s+ist|wer\s+ist|wer\s+war|definiere|erkläre|erzähl\s+mir\s+(?:von|über)|was\s+sind)\s+/i,
  pt: /^(?:o\s+que\s+é|o\s+que\s+são|quem\s+é|quem\s+foi|definir|explicar|fala.me\s+sobre|conta.me\s+(?:sobre|de)|sobre)\s+/i,
};

export function cleanWikiQuery(query, lang = 'en') {
  const p = WIKI_STRIP[lang];
  const cleaned = p ? query.replace(p, '') : query;
  // Also try English strip as fallback
  return (cleaned !== query ? cleaned : query.replace(WIKI_STRIP.en, '')).trim();
}

// ---- Currency extraction (language-agnostic — currency codes are universal) ----
export function extractCurrency(query) {
  const m = query.match(/(?:convert(?:er|ir|ire)?|exchange|rate|cambio|cambiar|change|taux|wechsel(?:kurs)?|câmbio)\s+(?:from|de|von|da)?\s*(\w{3})\s+(?:to|in|en|a|à|zu|em|para)\s+(\w{3})/i);
  if (m) return { from: m[1].toUpperCase(), to: m[2].toUpperCase() };
  const alt = query.match(/(\d+(?:\.\d+)?)\s*(\w{3})\s+(?:to|in|en|a|à|zu|em|para)\s+(\w{3})/i);
  if (alt) return { amount: parseFloat(alt[1]), from: alt[2].toUpperCase(), to: alt[3].toUpperCase() };
  return null;
}
