// ==================== CONFIG ====================
export const CONFIG = {
  WIKIPEDIA_API: 'https://en.wikipedia.org/api/rest_v1/page/summary',
  WIKIPEDIA_FALLBACK: 'https://en.wikipedia.org/w/api.php',
  WEATHER_API: 'https://api.open-meteo.com/v1/forecast',
  GEOCODING_API: 'https://geocoding-api.open-meteo.com/v1/search',
  NASA_APOD: 'https://api.nasa.gov/planetary/apod',
  EXCHANGE_API: 'https://api.exchangerate-api.com/v4/latest/USD',
  DICTIONARY_API: 'https://api.dictionaryapi.dev/api/v2/entries/en',
  CORS_PROXY: 'https://api.allorigins.win/raw?url=',
  HN_API: 'https://hacker-news.firebaseio.com/v2',
};

export const RSS_FEEDS = [
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'news' },
  { name: 'NASA', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', category: 'science' },
  { name: 'Science Daily', url: 'https://www.sciencedaily.com/rss/all.xml', category: 'science' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'tech' },
];

export function getNasaApiKey() {
  return localStorage.getItem('madison-nasa-key') || 'DEMO_KEY';
}

export function setNasaApiKey(key) {
  localStorage.setItem('madison-nasa-key', key.trim());
}
