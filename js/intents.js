// ==================== INTENT DETECTION ====================
// Scoring-based router: each keyword vote raises that intent's score.
// Explicit prefix patterns get a large bonus to override keyword ambiguity.

const KEYWORD_SCORES = {
  weather:    [/\b(weather|temperature|rain|snow|forecast|hot|cold|warm|cool|climate|humidity|wind)\b/gi],
  news:       [/\b(news|headlines?|article|report|latest|breaking|story|stories)\b/gi],
  nasa:       [/\b(nasa|space|astronaut|rocket|planet|mars|moon|stars|galaxy|asteroid|comet|orbit|satellite|telescope|apod)\b/gi],
  exchange:   [/\b(exchange|currency|dollar|euro|pound|yen|convert|rate|money|forex|usd|gbp|eur|jpy|cad|aud)\b/gi],
  dictionary: [/\b(definition|meaning|define|pronunciation|synonym|antonym|etymology)\b/gi],
  wiki:       [/\b(who|what|where|when|why|how|explain|tell me|about|history|biography|facts)\b/gi],
};

const PREFIX_BONUSES = [
  { pattern: /^weather\s+(?:in|at|for)\s+/i,           intent: 'weather',    bonus: 20 },
  { pattern: /^(?:define|meaning of|definition of|pronunciation of)\s+/i, intent: 'dictionary', bonus: 20 },
  { pattern: /^(?:latest\s+)?news\b/i,                  intent: 'news',       bonus: 20 },
  { pattern: /^(?:nasa|apod|space news|astronomy)\b/i,  intent: 'nasa',       bonus: 20 },
  { pattern: /^(?:convert|exchange rate|how much is)\s+/i, intent: 'exchange', bonus: 20 },
  { pattern: /^(?:what is|who is|who was|tell me about|explain|how does)\s+/i, intent: 'wiki', bonus: 10 },
  { pattern: /^(?:apod|picture of the day|today.?s\s+(?:nasa\s+)?picture)/i,   intent: 'nasa', bonus: 20 },
];

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

export function extractLocation(query) {
  const m = query.match(/weather\s+(?:in|at|for)?\s*(.+)/i);
  return m ? m[1].trim() : query.trim();
}

export function extractWord(query) {
  const patterns = [
    /^meaning\s+of\s+(.+)/i,
    /^definition\s+of\s+(.+)/i,
    /^define\s+(.+)/i,
    /^pronunciation\s+of\s+(.+)/i,
    /^what\s+(?:is\s+)?the\s+meaning\s+of\s+(.+)/i,
    /^what\s+(?:is\s+)?the\s+definition\s+of\s+(.+)/i,
  ];
  for (const p of patterns) {
    const m = query.match(p);
    if (m) return m[1].trim();
  }
  const clean = query.trim();
  return clean.split(/\s+/).length === 1 ? clean : null;
}

export function extractCurrency(query) {
  const m = query.match(/(?:convert|exchange|rate)\s+(?:from\s+)?(\w{3})\s+(?:to|in)\s+(\w{3})/i);
  if (m) return { from: m[1].toUpperCase(), to: m[2].toUpperCase() };
  const alt = query.match(/(\d+(?:\.\d+)?)\s*(\w{3})\s+(?:to|in)\s+(\w{3})/i);
  if (alt) return { amount: parseFloat(alt[1]), from: alt[2].toUpperCase(), to: alt[3].toUpperCase() };
  return null;
}

export function cleanWikiQuery(query) {
  return query
    .replace(/^(?:what\s+is|what\s+are|who\s+is|who\s+was|define|definition\s+of|explain|tell\s+me\s+(?:about|more)|talk\s+(?:to\s+)?me\s+(?:about)?|about|more\s+on|fact\s+about|fun\s+fact\s+about)\s+/i, '')
    .trim();
}
