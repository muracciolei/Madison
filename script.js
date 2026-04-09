// ==================== ROUTER ====================
// IMPORTANT: More specific routes must come before general ones
const ROUTES = [
  { pattern: /^(?:meaning|definition|pronunciation)\s+of\s+(.+)/i, type: 'dictionary' },
  { pattern: /^(?:what\s+(?:is|are|was|were)|define|definition\s+of|explain\s+|who\s+is|who\s+was)/i, type: 'wiki' },
  { pattern: /^weather\s+(?:in|at|for)?\s*(.+)/i, type: 'weather' },
  { pattern: /^(?:latest\s+)?news/i, type: 'rss' },
  { pattern: /^(?:space|nasa|astronomy|rocket|mars|moon|star|galaxy)/i, type: 'nasa' },
  { pattern: /^(?:convert|exchange|rate)\s+(?:.+)?\s*(?:to|in)\s+(\w{3})/i, type: 'exchange' },
  { pattern: /^population\s+(?:of|in)?\s+(.+)/i, type: 'wiki' },
  { pattern: /^(?:capital\s+(?:of|city)|capital)\s+(?:of)?\s+(.+)/i, type: 'wiki' },
  { pattern: /^(?:president|prime\s+minister|king|queen)\s+(?:of)?\s+(.+)/i, type: 'wiki' },
  { pattern: /^(?:how\s+far|how\s+long|distance)\s+(?:from|to|between)\s+(.+?)\s+(?:to|from)\s+(.+)/i, type: 'wiki' },
  { pattern: /^(?:apod|picture\s+of\s+the\s+day|today'?s?\s+(?:nasa\s+)?picture)/i, type: 'nasa-apod' },
  { pattern: /^(?:fact\s+about|fun\s+fact|interesting)\s+(?:about|on)?\s+(.+)/i, type: 'wiki' },
  { pattern: /^(?:tell\s+me\s+(?:about|more)|talk\s+(?:to\s+)?me\s+(?:about)?)\s+(.+)/i, type: 'wiki' },
  { pattern: /^(?:about|more)\s+(?:on|about)?\s+(.+)/i, type: 'wiki' }
];

const FALLBACK_ROUTES = [
  { pattern: /\b(weather|temperature|rain|snow|hot|cold|warm|cool)\b/i, type: 'weather' },
  { pattern: /\b(news|article|headline|report)\b/i, type: 'rss' },
  { pattern: /\b(nasa|space|astronaut|rocket|planet|mars|moon|stars)\b/i, type: 'nasa' },
  { pattern: /\b(money|currency|dollar|euro|pound|yen|convert|exchange)\b/i, type: 'exchange' },
  { pattern: /\b(who|what|where|when|why|how|tell|explain)\b/i, type: 'wiki' }
];

function detectIntent(query) {
  query = query.trim();
  for (const route of ROUTES) {
    const match = query.match(route.pattern);
    if (match) return { type: route.type, match, original: query };
  }
  for (const route of FALLBACK_ROUTES) {
    if (route.pattern.test(query)) return { type: route.type, match: [query], original: query };
  }
  return { type: 'wiki', match: [query], original: query };
}

function extractLocation(query) {
  const weatherMatch = query.match(/weather\s+(?:in|at|for)?\s*(.+)/i);
  if (weatherMatch) return weatherMatch[1].trim();
  return null;
}

function extractWord(query) {
  // More specific patterns first - only match explicit dictionary patterns
  const patterns = [
    /^meaning\s+of\s+(.+)/i,
    /^definition\s+of\s+(.+)/i,
    /^define\s+(.+)/i,
    /^pronunciation\s+of\s+(.+)/i,
    /^what\s+(?:is\s+)?the\s+meaning\s+of\s+(.+)/i,
    /^what\s+(?:is\s+)?the\s+definition\s+of\s+(.+)/i
  ];
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) return match[1].trim();
  }
  // Only return the query if it's a short, single word for dictionary
  // Otherwise return null to let it fall back to wiki
  const cleanQuery = query.replace(/^(?:meaning|definition|define|pronunciation)\s*/i, '').trim();
  return cleanQuery.length > 0 && cleanQuery.length < 30 ? cleanQuery : null;
}

function extractCurrency(query) {
  const match = query.match(/(?:convert|exchange|rate)\s+(?:from\s+)?(\w{3})\s+(?:to|in)\s+(\w{3})/i);
  if (match) return { from: match[1].toUpperCase(), to: match[2].toUpperCase() };
  const altMatch = query.match(/(\d+(?:\.\d+)?)\s*(\w{3})\s+(?:to|in)\s+(\w{3})/i);
  if (altMatch) return { amount: parseFloat(altMatch[1]), from: altMatch[2].toUpperCase(), to: altMatch[3].toUpperCase() };
  return null;
}

// ==================== API ====================
const WIKIPEDIA_API = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const WIKIPEDIA_FALLBACK = 'https://en.wikipedia.org/w/api.php';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const NASA_API_KEY = 'DEMO_KEY';
const NASA_APOD = 'https://api.nasa.gov/planetary/apod';
const EXCHANGE_API = 'https://api.exchangerate-api.com/v4/latest/USD';
const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';

async function fetchWikipedia(query) {
  try {
    const title = query.replace(/^(what\s+is|define|definition\s+of|explain|who\s+is|tell\s+me\s+(?:about|more)|talk\s+(?:to\s+)?me\s+(?:about)?|about|more)\s*/i, '').trim();
    if (!title || title.length < 2) throw new Error('Please provide a valid search term');
    const encoded = encodeURIComponent(title);
    let url = `${WIKIPEDIA_API}/${encoded}`;
    let response = await fetch(url);
    if (!response.ok) {
      url = `${WIKIPEDIA_FALLBACK}?action=query&prop=extracts&exintro&explaintext&titles=${encoded}&format=json&origin=*`;
      response = await fetch(url);
      if (!response.ok) throw new Error('Wikipedia request failed');
      const data = await response.json();
      const pages = data.query?.pages;
      if (!pages) throw new Error('No Wikipedia results');
      const page = Object.values(pages)[0];
      if (page.missing) throw new Error('Page not found');
      return { title: page.title, extract: page.extract, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`, source: 'Wikipedia' };
    }
    const data = await response.json();
    return { title: data.title, extract: data.extract, url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encoded}`, source: 'Wikipedia' };
  } catch (error) {
    console.error('Wikipedia error:', error);
    throw error;
  }
}

async function fetchWeather(location) {
  try {
    const geoResponse = await fetch(`${GEOCODING_API}?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
    if (!geoResponse.ok) throw new Error('Geocoding failed');
    const geoData = await geoResponse.json();
    if (!geoData.results || geoData.results.length === 0) throw new Error('Location not found');
    const { latitude, longitude, name, country } = geoData.results[0];
    const weatherResponse = await fetch(`${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
    if (!weatherResponse.ok) throw new Error('Weather fetch failed');
    const weatherData = await weatherResponse.json();
    const current = weatherData.current;
    const today = weatherData.daily;
    const weatherCode = current.weather_code;
    const condition = getWeatherCondition(weatherCode);
    return { location: `${name}, ${country}`, temperature: Math.round(current.temperature_2m), condition, humidity: current.relative_humidity_2m || current.relative_humidity_2m || 0, wind: Math.round(current.wind_speed_10m), high: Math.round(today.temperature_2m_max[0]), low: Math.round(today.temperature_2m_min[0]), source: 'Open-Meteo', url: 'https://open-meteo.com/' };
  } catch (error) {
    console.error('Weather error:', error);
    throw error;
  }
}

function getWeatherCondition(code) {
  const conditions = { 0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle', 61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Slight rain showers', 81: 'Rain showers', 82: 'Violent rain showers', 95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail' };
  return conditions[code] || 'Unknown';
}

async function fetchNASAApod() {
  try {
    const response = await fetch(`${NASA_APOD}?api_key=${NASA_API_KEY}`);
    if (!response.ok) throw new Error('NASA APOD failed');
    const data = await response.json();
    return { title: data.title, explanation: data.explanation, imageUrl: data.url, hdUrl: data.hdurl || data.url, date: data.date, source: 'NASA APOD', url: 'https://apod.nasa.gov/apod/astropix.html' };
  } catch (error) {
    console.error('NASA APOD error:', error);
    throw error;
  }
}

async function fetchExchangeRates(baseCurrency = 'USD') {
  try {
    const response = await fetch(`${EXCHANGE_API}`);
    if (!response.ok) throw new Error('Exchange rate fetch failed');
    const data = await response.json();
    return { base: data.base, rates: data.rates, source: 'ExchangeRate-API', url: 'https://www.exchangerate-api.com/' };
  } catch (error) {
    console.error('Exchange rate error:', error);
    throw error;
  }
}

async function fetchDictionary(word) {
  try {
    const response = await fetch(`${DICTIONARY_API}/${encodeURIComponent(word)}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error('Word not found');
      throw new Error('Dictionary request failed');
    }
    const data = await response.json();
    if (!data || !data[0]) throw new Error('No dictionary results');
    const entry = data[0];
    const definition = entry.meanings?.[0]?.definitions?.[0];
    return { word: entry.word, phonetic: entry.phonetic || entry.phonetics?.[0]?.text, partOfSpeech: entry.meanings?.[0]?.partOfSpeech, definition: definition?.definition, example: definition?.example, source: 'Dictionary API', url: 'https://dictionaryapi.dev/' };
  } catch (error) {
    console.error('Dictionary error:', error);
    throw error;
  }
}

function formatWeatherResponse(data) {
  const { location, temperature, condition, humidity, wind, high, low } = data;
  return `Current weather in ${location}:\n\nTemperature: ${temperature}C (${high} / ${low})\n\nCondition: ${condition}\n\nHumidity: ${humidity}%\n\nWind: ${wind} km/h`;
}

function formatWikipediaResponse(data) {
  let response = '';
  if (data.title) response += `${data.title}\n\n`;
  response += data.extract;
  return response;
}

function formatNASAApodResponse(data) {
  let response = `${data.title} (${data.date})\n\n`;
  response += data.explanation;
  response += `\n\nView Image: ${data.imageUrl}`;
  return response;
}

function formatDictionaryResponse(data) {
  let response = `${data.word}`;
  if (data.phonetic) response += ` ${data.phonetic}`;
  response += '\n\n';
  if (data.partOfSpeech) response += `${data.partOfSpeech}\n\n`;
  if (data.definition) response += `Definition: ${data.definition}\n\n`;
  if (data.example) response += `Example: "${data.example}"`;
  return response;
}

// ==================== RSS ====================
const RSS_FEEDS = [
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'news' },
  { name: 'NASA Breaking News', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', category: 'science' },
  { name: 'Science Daily', url: 'https://www.sciencedaily.com/rss/all.xml', category: 'science' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com/rss', category: 'tech' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'tech' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'tech' },
  { name: 'ArXiv', url: 'http://export.arxiv.org/api/query?search_query=cat:cs.*&max_results=10', category: 'science' }
];

const CORS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

async function fetchRSSFeeds(query = null) {
  const results = [];
  for (const feed of RSS_FEEDS) {
    try {
      const proxyUrl = CORS_PROXY + encodeURIComponent(feed.url);
      const response = await fetch(proxyUrl);
      if (!response.ok) continue;
      const data = await response.json();
      if (data.status !== 'ok' || !data.items) continue;
      const items = data.items.slice(0, 5);
      for (const item of items) {
        const title = item.title || 'Untitled';
        const description = item.description || '';
        const link = item.link || '';
        const pubDate = item.pubDate || item.isoDate || '';
        const cleanDescription = description.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200);
        let matches = true;
        if (query) {
          const searchTerms = query.toLowerCase().split(/\s+/);
          const searchText = `${title} ${cleanDescription}`.toLowerCase();
          matches = searchTerms.some(term => searchText.includes(term));
        }
        if (matches || !query) {
          results.push({ title, description: cleanDescription, link, pubDate: formatDate(pubDate), source: feed.name, category: feed.category });
        }
      }
    } catch (err) { console.error(`Failed to fetch ${feed.name}:`, err); }
  }
  if (results.length === 0) throw new Error('Unable to fetch news feeds. Please try again later.');
  results.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  return results.slice(0, 10);
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

function formatRSSResponse(items, query = null) {
  let response = query ? `News matching "${query}"\n\n` : 'Latest News\n\n';
  response += '---divider---\n\n';
  items.forEach((item, index) => {
    response += `${index + 1}. ${item.title}\n`;
    response += `   ${item.description.substring(0, 150)}...\n`;
    if (item.link) response += `   Read more: ${item.link}\n`;
    response += `   Source: ${item.source} - ${item.pubDate}\n\n`;
  });
  return response;
}

// ==================== SPEECH ====================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesis = window.speechSynthesis;

let recognition = null;
let synthesis = window.speechSynthesis;
let currentUtterance = null;
let isSpeaking = false;
let isListening = false;
let autoSpeak = true;
let speechRate = 1;
let onListeningCallback = null;
let onSpeakingCallback = null;
let onResultCallback = null;
let onPartialCallback = null;
let onErrorCallback = null;

function initSpeech() {
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => { isListening = true; if (onListeningCallback) onListeningCallback(true); };
    recognition.onend = () => { isListening = false; if (onListeningCallback) onListeningCallback(false); };
    recognition.onresult = (event) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      if (lastResult.isFinal) { if (onResultCallback) onResultCallback(lastResult[0].transcript); }
      else { if (onPartialCallback) onPartialCallback(lastResult[0].transcript); }
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      isListening = false;
      if (onListeningCallback) onListeningCallback(false);
      if (event.error !== 'no-speech' && onErrorCallback) onErrorCallback(event.error);
    };
  }
}

function isSpeechSupported() { return !!(SpeechRecognition || SpeechSynthesis); }
function isVoiceInputSupported() { return !!SpeechRecognition; }

function startListening() {
  if (!recognition) { if (onErrorCallback) onErrorCallback('Speech recognition not supported'); return false; }
  if (isListening) { recognition.stop(); return false; }
  
  // Check if we have stored permission
  const savedPermission = localStorage.getItem('madison-mic-permission');
  
  // Check permission using Permissions API
  navigator.permissions.query({ name: 'microphone' })
    .then((status) => {
      if (status.state === 'denied') {
        if (onErrorCallback) onErrorCallback('Microphone permission denied. Please enable in browser settings.');
        return;
      }
      startRecognition();
    })
    .catch(() => {
      // Permissions API not supported, try starting directly
      startRecognition();
    });
  
  function startRecognition() {
    try { 
      recognition.start(); 
      localStorage.setItem('madison-mic-permission', 'granted');
    } catch (err) { 
      console.error('Failed to start recognition:', err); 
      if (onErrorCallback) onErrorCallback('Could not start microphone');
    }
  }
}

function stopListening() { if (recognition && isListening) recognition.stop(); }

function speak(text, onEnd = null) {
  if (!synthesis) { console.warn('Speech synthesis not supported'); return; }
  if (!text || !text.trim()) return;
  synthesis.cancel();
  
  // Get voices - handle the async loading case
  let voices = synthesis.getVoices();
  
  // If no voices loaded yet, set up a listener and try again
  if (voices.length === 0) {
    const speakNow = () => {
      voices = synthesis.getVoices();
      doSpeak(voices, text, onEnd);
      synthesis.onvoiceschanged = null;
    };
    synthesis.onvoiceschanged = speakNow;
    // Try once more after a timeout
    setTimeout(() => {
      if (synthesis.getVoices().length === 0) {
        doSpeak([], text, onEnd);
      }
    }, 100);
    return;
  }
  
  doSpeak(voices, text, onEnd);
}

function doSpeak(voices, text, onEnd) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = speechRate;
  utterance.lang = 'en-US';
  const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
  if (englishVoice) utterance.voice = englishVoice;
  utterance.onstart = () => { isSpeaking = true; if (onSpeakingCallback) onSpeakingCallback(true); };
  utterance.onend = () => { isSpeaking = false; if (onSpeakingCallback) onSpeakingCallback(false); if (onEnd) onEnd(); };
  utterance.onerror = (event) => { console.error('Speech synthesis error:', event.error); isSpeaking = false; if (onSpeakingCallback) onSpeakingCallback(false); };
  currentUtterance = utterance;
  synthesis.speak(utterance);
}

function stopSpeaking() { if (synthesis) { synthesis.cancel(); isSpeaking = false; if (onSpeakingCallback) onSpeakingCallback(false); } }
function setAutoSpeak(enabled) { autoSpeak = enabled; }
function getAutoSpeak() { return autoSpeak; }
function setSpeechRate(rate) { speechRate = rate; }
function getSpeechRate() { return speechRate; }
function getIsSpeaking() { return isSpeaking; }
function getIsListening() { return isListening; }
function onListeningChange(callback) { onListeningCallback = callback; }
function onSpeakingChange(callback) { onSpeakingCallback = callback; }
function onSpeechResult(callback) { onResultCallback = callback; }
function onSpeechPartial(callback) { onPartialCallback = callback; }
function onSpeechError(callback) { onErrorCallback = callback; }

// ==================== UI ====================
function createUserMessage(text) { return createMessage(text, 'user'); }

function createBotMessage(text, source = 'Bot', sourceType = 'api', url = null) {
  return createMessage(text, 'bot', source, sourceType, url);
}

function createMessage(text, role, source = null, sourceType = null, url = null) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  const avatarSvg = role === 'user' ? getUserAvatar() : getBotAvatar();
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  const textDiv = document.createElement('div');
  textDiv.className = 'message-text';
  textDiv.innerHTML = formatText(text);
  contentDiv.appendChild(textDiv);
  if (role === 'bot' && source) {
    const metaDiv = document.createElement('div');
    metaDiv.className = 'message-meta';
    const sourceTag = document.createElement('span');
    sourceTag.className = `source-tag ${sourceType || 'api'}`;
    sourceTag.textContent = source;
    metaDiv.appendChild(sourceTag);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'View Source';
      link.style.fontSize = '12px';
      link.style.marginLeft = '8px';
      metaDiv.appendChild(link);
    }
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = formatTime(new Date());
    metaDiv.appendChild(timeSpan);
    contentDiv.appendChild(metaDiv);
  }
  bubble.appendChild(contentDiv);
  messageDiv.appendChild(avatarSvg);
  messageDiv.appendChild(bubble);
  return messageDiv;
}

function getUserAvatar() {
  const div = document.createElement('div');
  div.className = 'bot-avatar';
  div.innerHTML = `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill="var(--user-bubble)"/><circle cx="12" cy="13" r="3" fill="white"/><circle cx="20" cy="13" r="3" fill="white"/><path d="M10 20c0-3 2-5 6-5s6 2 6 5" stroke="white" stroke-width="2" fill="none"/></svg>`;
  return div;
}

function getBotAvatar() {
  const div = document.createElement('div');
  div.className = 'bot-avatar';
  div.innerHTML = `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill="var(--accent)"/><path d="M9 16l4 4 10-10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
  return div;
}

function formatText(text) {
  text = text.replace(/---divider---/g, '<hr style="border: none; border-top: 1px solid var(--border); margin: 12px 0;">');
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  text = text.replace(/^\d+\.\s+(.+)$/gm, '- $1');
  text = text.replace(/\n/g, '<br>');
  return text;
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function showTypingIndicator(show) {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.style.display = show ? 'flex' : 'none';
}

function clearChat() {
  const messagesContainer = document.getElementById('chat-messages');
  const welcomeDiv = messagesContainer.querySelector('.welcome-message');
  messagesContainer.innerHTML = '';
  if (welcomeDiv) messagesContainer.appendChild(welcomeDiv);
}

function scrollToBottom() {
  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addMessageToChat(messageElement) {
  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.appendChild(messageElement);
  scrollToBottom();
}

function updateMicButton(listening) {
  const micBtn = document.getElementById('mic-btn');
  if (micBtn) listening ? micBtn.classList.add('listening') : micBtn.classList.remove('listening');
}

function updateSpeakButton(muted) {
  const speakBtn = document.getElementById('speak-btn');
  if (speakBtn) muted ? speakBtn.classList.add('muted') : speakBtn.classList.remove('muted');
}

function updateSpeedLabel(rate) {
  const speedLabel = document.querySelector('#speed-btn .speed-label');
  if (speedLabel) speedLabel.textContent = rate + 'x';
}

function toggleSpeedMenu() {
  const menu = document.getElementById('speed-menu');
  if (menu) menu.classList.toggle('hidden');
}

function hideSpeedMenu() {
  const menu = document.getElementById('speed-menu');
  if (menu) menu.classList.add('hidden');
}

function setActiveSpeed(rate) {
  const buttons = document.querySelectorAll('#speed-menu button');
  buttons.forEach(btn => { parseFloat(btn.dataset.speed) === rate ? btn.classList.add('active') : btn.classList.remove('active'); });
}

function setInputValue(value) {
  const input = document.getElementById('user-input');
  if (input) input.value = value;
}

function getInputValue() {
  const input = document.getElementById('user-input');
  return input ? input.value : '';
}

function focusInput() {
  const input = document.getElementById('user-input');
  if (input) input.focus();
}

function createErrorMessage(errorText) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message bot';
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble error-message';
  bubble.textContent = errorText;
  const avatar = getBotAvatar();
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(bubble);
  return messageDiv;
}

// ==================== MAIN APP ====================
let isProcessing = false;

async function handleQuery(query) {
  if (!query.trim() || isProcessing) return;
  isProcessing = true;
  const userMsg = createUserMessage(query);
  addMessageToChat(userMsg);
  showTypingIndicator(true);
  try {
    const intent = detectIntent(query);
    let response = null;
    let source = 'Bot';
    let sourceType = 'api';
    let url = null;
    switch (intent.type) {
      case 'weather':
        const location = extractLocation(query) || intent.match[1];
        const weatherData = await fetchWeather(location);
        response = formatWeatherResponse(weatherData);
        source = weatherData.source;
        sourceType = 'api';
        url = weatherData.url;
        break;
      case 'wiki':
        const wikiQuery = query.replace(/^(what\s+is|define|definition\s+of|explain|who\s+is|who\s+was|tell\s+me\s+(?:about|more)|talk\s+(?:to\s+)?me\s+(?:about)?|about|more)\s*/i, '').trim();
        const wikiData = await fetchWikipedia(wikiQuery);
        response = formatWikipediaResponse(wikiData);
        source = wikiData.source;
        sourceType = 'wiki';
        url = wikiData.url;
        break;
      case 'rss':
        const newsItems = await fetchRSSFeeds(null);
        response = formatRSSResponse(newsItems);
        source = 'RSS Feeds';
        sourceType = 'rss';
        break;
      case 'nasa':
      case 'nasa-apod':
        const nasaData = await fetchNASAApod();
        response = formatNASAApodResponse(nasaData);
        source = nasaData.source;
        sourceType = 'api';
        url = nasaData.url;
        break;
      case 'exchange':
        const currencyInfo = extractCurrency(query);
        const exchangeData = await fetchExchangeRates();
        if (currencyInfo) {
          const from = currencyInfo.from || 'USD';
          const to = currencyInfo.to;
          const rate = exchangeData.rates[to];
          response = `Current exchange rate:\n\n1 ${from} = ${rate} ${to}\n\nSource: ${exchangeData.source}`;
          source = exchangeData.source;
          sourceType = 'api';
        } else {
          const topRates = Object.entries(exchangeData.rates).filter(([code]) => ['EUR', 'GBP', 'JPY', 'CAD', 'AUD'].includes(code)).slice(0, 5);
          response = 'Current exchange rates (base USD):\n\n';
          topRates.forEach(([code, rate]) => { response += `- 1 USD = ${rate} ${code}\n`; });
          response += `\nSource: ${exchangeData.source}`;
          source = exchangeData.source;
          sourceType = 'api';
        }
        url = exchangeData.url;
        break;
      case 'dictionary':
        const word = extractWord(query);
        if (!word) {
          // Fallback to Wikipedia if no valid word extracted
          const wikiData = await fetchWikipedia(query);
          response = formatWikipediaResponse(wikiData);
          source = wikiData.source;
          sourceType = 'wiki';
          url = wikiData.url;
        } else {
          const dictData = await fetchDictionary(word);
          response = formatDictionaryResponse(dictData);
          source = dictData.source;
          sourceType = 'dict';
          url = dictData.url;
        }
        break;
      default:
        const defaultData = await fetchWikipedia(query);
        response = formatWikipediaResponse(defaultData);
        source = defaultData.source;
        sourceType = 'wiki';
        url = defaultData.url;
    }
    const botMsg = createBotMessage(response, source, sourceType, url);
    addMessageToChat(botMsg);
    if (autoSpeak) {
      const plainText = response.replace(/\*\*/g, '').replace(/---divider---/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      speak(plainText);
    }
  } catch (error) {
    console.error('Query handling error:', error);
    const errorMsg = createErrorMessage(error.message || 'Sorry, I encountered an error. Please try again.');
    addMessageToChat(errorMsg);
  } finally {
    showTypingIndicator(false);
    isProcessing = false;
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('madison-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  console.log('initTheme - saved:', savedTheme, 'prefersDark:', prefersDark);
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  console.log('toggleTheme - current:', currentTheme, 'new:', newTheme);
  if (newTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('madison-theme', newTheme);
}

function initEventListeners() {
  const sendBtn = document.getElementById('send-btn');
  const input = document.getElementById('user-input');
  const micBtn = document.getElementById('mic-btn');
  const speakBtn = document.getElementById('speak-btn');
  const themeBtn = document.getElementById('theme-btn');
  const clearBtn = document.getElementById('clear-btn');
  const speedBtn = document.getElementById('speed-btn');
  const speedMenu = document.getElementById('speed-menu');

  sendBtn.addEventListener('click', () => {
    const query = input.value.trim();
    if (query) { handleQuery(query); input.value = ''; }
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const query = input.value.trim();
      if (query) { handleQuery(query); input.value = ''; }
    }
  });

  if (isVoiceInputSupported()) {
    micBtn.addEventListener('click', () => { getIsListening() ? stopListening() : startListening(); });
    onListeningChange((listening) => {
      updateMicButton(listening);
      input.placeholder = listening ? 'Listening...' : 'Type your question...';
    });
    onSpeechResult((transcript) => { input.value = transcript; handleQuery(transcript); input.value = ''; });
    onSpeechPartial((transcript) => { input.value = transcript; });
  } else {
    micBtn.style.display = 'none';
  }

  speakBtn.addEventListener('click', () => { autoSpeak = !autoSpeak; updateSpeakButton(!autoSpeak); });
  themeBtn.addEventListener('click', toggleTheme);
  clearBtn.addEventListener('click', () => { stopSpeaking(); clearChat(); });
  speedBtn.addEventListener('click', (e) => { e.stopPropagation(); speedMenu.classList.toggle('hidden'); });

  speedMenu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      speechRate = parseFloat(btn.dataset.speed);
      setSpeechRate(speechRate);
      setActiveSpeed(speechRate);
      updateSpeedLabel(speechRate);
      speedMenu.classList.add('hidden');
    });
  });

  document.addEventListener('click', (e) => {
    if (!speedBtn.contains(e.target) && !speedMenu.contains(e.target)) speedMenu.classList.add('hidden');
  });

  window.addEventListener('beforeunload', () => { stopSpeaking(); });
}

// ==================== PWA REGISTRATION ====================
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('PWA: Service Worker registered:', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('PWA: New version available');
            if (confirm('A new version is available. Reload to update?')) {
              window.location.reload();
            }
          }
        });
      });
      
      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('PWA: Controller changed, reloading...');
        window.location.reload();
      });
      
      return registration;
    } catch (error) {
      console.error('PWA: Service Worker registration failed:', error);
      return null;
    }
  }
  console.log('PWA: Service Worker not supported');
  return null;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

function setupPwaInstallPrompt() {
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('PWA: Install prompt ready');
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('PWA: Installed successfully');
    deferredPrompt = null;
  });
}

// ==================== INITIALIZATION ====================
async function init() {
  initTheme();
  await registerServiceWorker();
  setupPwaInstallPrompt();
  if (isSpeechSupported()) { initSpeech(); } else {
    document.getElementById('speak-btn').style.display = 'none';
    document.getElementById('speed-btn').style.display = 'none';
  }
  initEventListeners();
  focusInput();
}

document.addEventListener('DOMContentLoaded', init);