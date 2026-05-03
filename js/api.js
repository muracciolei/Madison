// ==================== API ====================
import { CONFIG, RSS_FEEDS, getNasaApiKey } from './config.js';

// ---- Wikipedia ----
export async function fetchWikipedia(query) {
  const title = query.trim();
  if (!title || title.length < 2) throw new Error('Please provide a valid search term.');

  const encoded = encodeURIComponent(title);

  let response = await fetch(`${CONFIG.WIKIPEDIA_API}/${encoded}`);
  if (response.ok) {
    const data = await response.json();
    if (data.type === 'disambiguation') {
      throw new Error(`"${title}" is ambiguous. Try being more specific.`);
    }
    return {
      title: data.title,
      extract: data.extract,
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encoded}`,
      source: 'Wikipedia',
    };
  }

  // Fallback to search API
  const fallback = `${CONFIG.WIKIPEDIA_FALLBACK}?action=query&prop=extracts&exintro&explaintext&titles=${encoded}&format=json&origin=*`;
  response = await fetch(fallback);
  if (!response.ok) throw new Error('Wikipedia request failed. Please try again.');
  const data = await response.json();
  const pages = data.query?.pages;
  if (!pages) throw new Error('No Wikipedia results found.');
  const page = Object.values(pages)[0];
  if (page.missing) throw new Error(`No Wikipedia article found for "${title}".`);
  return {
    title: page.title,
    extract: page.extract,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    source: 'Wikipedia',
  };
}

// ---- Weather ----
export async function fetchWeather(location) {
  const geoRes = await fetch(
    `${CONFIG.GEOCODING_API}?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
  );
  if (!geoRes.ok) throw new Error('Geocoding service unavailable. Please try again.');
  const geoData = await geoRes.json();
  if (!geoData.results?.length) throw new Error(`Location "${location}" not found. Try a different city name.`);

  const { latitude, longitude, name, country } = geoData.results[0];
  const weatherRes = await fetch(
    `${CONFIG.WEATHER_API}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m` +
    `&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
  );
  if (!weatherRes.ok) throw new Error('Weather service unavailable. Please try again.');
  const wd = await weatherRes.json();

  const current = wd.current;
  const daily = wd.daily;
  return {
    location: `${name}, ${country}`,
    temperature: Math.round(current.temperature_2m),
    condition: getWeatherCondition(current.weather_code),
    humidity: current.relative_humidity_2m ?? 0,
    wind: Math.round(current.wind_speed_10m),
    high: Math.round(daily.temperature_2m_max[0]),
    low: Math.round(daily.temperature_2m_min[0]),
    source: 'Open-Meteo',
    url: 'https://open-meteo.com/',
  };
}

function getWeatherCondition(code) {
  const map = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Rime fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow',
    80: 'Rain showers', 81: 'Rain showers', 82: 'Violent rain showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
  };
  return map[code] ?? 'Unknown';
}

// ---- NASA APOD ----
export async function fetchNASAApod() {
  const key = getNasaApiKey();
  const response = await fetch(`${CONFIG.NASA_APOD}?api_key=${key}`);
  if (response.status === 429) {
    throw new Error('NASA API rate limit reached. Add your own free API key in Settings.');
  }
  if (!response.ok) throw new Error('NASA APOD service unavailable. Please try again.');
  const data = await response.json();
  return {
    title: data.title,
    explanation: data.explanation,
    imageUrl: data.url,
    hdUrl: data.hdurl || data.url,
    date: data.date,
    mediaType: data.media_type ?? 'image',
    source: 'NASA APOD',
    url: 'https://apod.nasa.gov/apod/astropix.html',
  };
}

// ---- Exchange Rates ----
export async function fetchExchangeRates() {
  const response = await fetch(CONFIG.EXCHANGE_API);
  if (!response.ok) throw new Error('Exchange rate service unavailable. Please try again.');
  const data = await response.json();
  return {
    base: data.base,
    rates: data.rates,
    source: 'ExchangeRate-API',
    url: 'https://www.exchangerate-api.com/',
  };
}

// ---- Dictionary ----
export async function fetchDictionary(word) {
  const response = await fetch(`${CONFIG.DICTIONARY_API}/${encodeURIComponent(word)}`);
  if (response.status === 404) throw new Error(`"${word}" not found in the dictionary.`);
  if (!response.ok) throw new Error('Dictionary service unavailable. Please try again.');
  const data = await response.json();
  if (!data?.[0]) throw new Error('No dictionary results found.');
  const entry = data[0];
  const meaning = entry.meanings?.[0];
  const def = meaning?.definitions?.[0];
  return {
    word: entry.word,
    phonetic: entry.phonetic || entry.phonetics?.[0]?.text,
    partOfSpeech: meaning?.partOfSpeech,
    definition: def?.definition,
    example: def?.example,
    synonyms: meaning?.synonyms?.slice(0, 5) ?? [],
    source: 'Dictionary API',
    url: 'https://dictionaryapi.dev/',
  };
}

// ---- News: Hacker News (native JSON) ----
async function fetchHackerNews() {
  const ids = await fetch(`${CONFIG.HN_API}/topstories.json`).then(r => r.json());
  const top = ids.slice(0, 15);
  const items = await Promise.all(
    top.map(id => fetch(`${CONFIG.HN_API}/item/${id}.json`).then(r => r.json()).catch(() => null))
  );
  return items.filter(Boolean).filter(i => i.title).slice(0, 8).map(item => ({
    title: item.title,
    description: item.text ? stripTags(item.text).substring(0, 200) : 'Discussion on Hacker News.',
    link: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
    pubDate: formatDate(new Date(item.time * 1000).toISOString()),
    source: 'Hacker News',
    category: 'tech',
  }));
}

// ---- News: RSS via allorigins CORS proxy + DOMParser ----
async function fetchRSSFeed(feed) {
  const url = `${CONFIG.CORS_PROXY}${encodeURIComponent(feed.url)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${feed.name}`);
  const text = await response.text();
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error(`Invalid feed from ${feed.name}`);

  const nodes = Array.from(doc.querySelectorAll('item, entry')).slice(0, 5);
  return nodes.map(node => {
    const title = node.querySelector('title')?.textContent?.trim() ?? 'Untitled';
    const rawDesc = node.querySelector('description, summary, content\\:encoded, content')?.textContent ?? '';
    const description = stripTags(rawDesc).replace(/\s+/g, ' ').trim().substring(0, 200);
    const linkEl = node.querySelector('link');
    const link = linkEl?.getAttribute('href') || linkEl?.textContent?.trim() || '';
    const pubRaw = node.querySelector('pubDate, published, updated, dc\\:date')?.textContent ?? '';
    return {
      title,
      description,
      link,
      pubDate: formatDate(pubRaw),
      source: feed.name,
      category: feed.category,
    };
  });
}

export async function fetchNews(topic = null) {
  const results = [];

  // HackerNews — no CORS needed
  try {
    const hn = await fetchHackerNews();
    results.push(...hn);
  } catch (err) {
    console.warn('HackerNews fetch failed:', err.message);
  }

  // RSS feeds in parallel — failures are ignored individually
  const rssResults = await Promise.allSettled(RSS_FEEDS.map(f => fetchRSSFeed(f)));
  for (const r of rssResults) {
    if (r.status === 'fulfilled') results.push(...r.value);
    else console.warn('RSS feed failed:', r.reason?.message);
  }

  if (results.length === 0) {
    throw new Error('All news sources are currently unavailable. Please try again later.');
  }

  results.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  if (topic) {
    const terms = topic.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const filtered = results.filter(item => {
      const hay = `${item.title} ${item.description}`.toLowerCase();
      return terms.some(t => hay.includes(t));
    });
    // Fall back to all results if topic yields nothing
    return (filtered.length > 0 ? filtered : results).slice(0, 12);
  }

  return results.slice(0, 12);
}

// ---- Helpers ----
function stripTags(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, ' ');
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    const now = new Date();
    const hours = Math.floor((now - date) / 36e5);
    const days = Math.floor(hours / 24);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}
