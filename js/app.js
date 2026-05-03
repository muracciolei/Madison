// ==================== APP ORCHESTRATOR ====================
import { detectIntent, extractLocation, extractWord, extractCurrency, cleanWikiQuery } from './intents.js';
import { fetchWikipedia, fetchWeather, fetchNASAApod, fetchExchangeRates, fetchDictionary, fetchNews } from './api.js';
import { formatWeather, formatWikipedia, formatNASAApod, formatDictionary, formatExchange, formatNews, plainText } from './formatters.js';
import {
  initSpeech, isVoiceInputSupported, isSpeechSynthesisSupported,
  startListening, stopListening, speak, stopSpeaking,
  isListening, getAutoSpeak, saveAutoSpeak, setSpeechRate, getSpeechRate,
  onListeningChange, onSpeechResult, onSpeechPartial, onSpeechError,
  loadSpeechPrefs,
} from './speech.js';
import {
  createUserMessage, createBotMessage, createErrorMessage,
  showTypingIndicator, addMessageToChat, clearChatMessages,
  getInputValue, setInputValue, clearInput, focusInput,
  setMicListening, setMuted, updateSpeedLabel, setActiveSpeed,
  toggleSpeedMenu, hideSpeedMenu, restoreMessageFromHistory,
} from './ui.js';
import { saveMessage, loadHistory, clearHistory } from './history.js';
import { initSettings } from './settings.js';
import { getCurrentLang, getWikiLang, getDictLang, applyTranslations, t } from './i18n.js';

let isProcessing = false;

// ---- Query handler ----
export async function handleQuery(query) {
  if (!query.trim() || isProcessing) return;
  isProcessing = true;

  const userMsg = createUserMessage(query);
  addMessageToChat(userMsg);
  saveMessage({ role: 'user', text: query });

  showTypingIndicator(true);

  let errMsgEl = null;

  try {
    const result = await resolveQuery(query);
    const botMsg = createBotMessage(result.text, result.source, result.sourceType, result.url, result.imageUrl);
    addMessageToChat(botMsg);
    saveMessage({ role: 'bot', text: result.text, source: result.source, sourceType: result.sourceType, url: result.url });

    if (getAutoSpeak()) speak(plainText(result.text));
  } catch (error) {
    console.error('Query error:', error);
    // Capture reference at creation time — avoids stale querySelectorAll bug
    errMsgEl = createErrorMessage(error.message || 'Something went wrong. Please try again.', () => {
      errMsgEl?.closest('.message')?.remove();
      handleQuery(query);
    });
    addMessageToChat(errMsgEl);
  } finally {
    showTypingIndicator(false);
    isProcessing = false;
  }
}

// ---- Intent → data → formatted text ----
async function resolveQuery(query) {
  const intent = detectIntent(query);
  const lang = getCurrentLang();
  const wikiLang = getWikiLang();
  const dictLang = getDictLang();

  switch (intent.type) {
    case 'weather': {
      const location = extractLocation(query, lang);
      const data = await fetchWeather(location, lang);
      return { text: formatWeather(data), source: data.source, sourceType: 'api', url: data.url };
    }
    case 'news': {
      const topic = extractNewsTopic(query, lang);
      const items = await fetchNews(topic);
      return { text: formatNews(items, topic), source: 'News', sourceType: 'rss', url: null };
    }
    case 'nasa': {
      const data = await fetchNASAApod();
      return {
        text: formatNASAApod(data),
        source: data.source,
        sourceType: 'api',
        url: data.url,
        imageUrl: data.mediaType !== 'video' ? data.imageUrl : null,
      };
    }
    case 'exchange': {
      const currencyInfo = extractCurrency(query);
      const data = await fetchExchangeRates();
      return { text: formatExchange(data, currencyInfo), source: data.source, sourceType: 'api', url: data.url };
    }
    case 'dictionary': {
      const word = extractWord(query, lang);
      if (!word) {
        const data = await fetchWikipedia(cleanWikiQuery(query, lang), wikiLang);
        return { text: formatWikipedia(data), source: data.source, sourceType: 'wiki', url: data.url };
      }
      const data = await fetchDictionary(word, dictLang);
      return { text: formatDictionary(data), source: data.source, sourceType: 'dict', url: data.url };
    }
    default: {
      const data = await fetchWikipedia(cleanWikiQuery(query, lang) || query, wikiLang);
      return { text: formatWikipedia(data), source: data.source, sourceType: 'wiki', url: data.url };
    }
  }
}

const NEWS_TOPIC_PATTERNS = {
  en: [/news\s+(?:about|on|regarding|related\s+to)\s+(.+)/i, /(?:latest|breaking|recent)\s+(.+?)\s+news/i, /(?:headlines?)\s+(?:about|on)\s+(.+)/i],
  es: [/noticias\s+(?:sobre|de|acerca\s+de)\s+(.+)/i, /(?:últimas|recientes)\s+noticias\s+(?:sobre|de)\s+(.+)/i],
  it: [/notizie\s+(?:su|di|riguardo\s+a)\s+(.+)/i, /ultime\s+notizie\s+(?:su|di)\s+(.+)/i],
  fr: [/(?:actualités|nouvelles)\s+(?:sur|à\s+propos\s+de|concernant)\s+(.+)/i, /dernières\s+(?:actualités|nouvelles)\s+(?:sur|de)\s+(.+)/i],
  de: [/nachrichten\s+(?:über|zu|bezüglich)\s+(.+)/i, /aktuelle\s+nachrichten\s+(?:über|zu)\s+(.+)/i],
  pt: [/notícias\s+(?:sobre|de|acerca\s+de)\s+(.+)/i, /últimas\s+notícias\s+(?:sobre|de)\s+(.+)/i],
};

function extractNewsTopic(query, lang = 'en') {
  const patterns = [...(NEWS_TOPIC_PATTERNS[lang] ?? []), ...NEWS_TOPIC_PATTERNS.en];
  for (const p of patterns) {
    const m = query.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

// ---- Theme ----
function initTheme() {
  const saved = localStorage.getItem('madison-theme');
  const mq = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(dark) {
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }

  applyTheme(saved === 'dark' || (!saved && mq.matches));

  // Real-time sync when OS theme changes (only if user hasn't set a preference)
  mq.addEventListener('change', e => {
    if (!localStorage.getItem('madison-theme')) applyTheme(e.matches);
  });
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  if (next === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  localStorage.setItem('madison-theme', next);
}

// ---- PWA Install Prompt ----
function initInstallPrompt() {
  let deferred = null;
  const btn = document.getElementById('install-btn');
  if (!btn) return;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    btn.removeAttribute('hidden');
  });

  btn.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') btn.setAttribute('hidden', '');
    deferred = null;
  });

  window.addEventListener('appinstalled', () => {
    btn.setAttribute('hidden', '');
    deferred = null;
  });
}

// ---- Service Worker ----
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          if (confirm('A new version of Madison is available. Reload to update?')) {
            window.location.reload();
          }
        }
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
  } catch (err) {
    console.error('Service Worker registration failed:', err);
  }
}

// ---- Chat history restore ----
function restoreHistory() {
  const history = loadHistory();
  if (!history.length) return;
  const container = document.getElementById('chat-messages');
  history.forEach(entry => restoreMessageFromHistory(entry, container));
}

// ---- Event listeners ----
function initEventListeners() {
  const sendBtn   = document.getElementById('send-btn');
  const input     = document.getElementById('user-input');
  const micBtn    = document.getElementById('mic-btn');
  const speakBtn  = document.getElementById('speak-btn');
  const themeBtn  = document.getElementById('theme-btn');
  const clearBtn  = document.getElementById('clear-btn');
  const speedBtn  = document.getElementById('speed-btn');
  const speedMenu = document.getElementById('speed-menu');

  const submit = () => {
    const q = getInputValue().trim();
    if (q) { clearInput(); handleQuery(q); }
  };

  sendBtn.addEventListener('click', submit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  });

  if (isVoiceInputSupported()) {
    micBtn.removeAttribute('hidden');
    micBtn.addEventListener('click', () => isListening() ? stopListening() : startListening());
    onListeningChange(listening => {
      setMicListening(listening);
      const input = document.getElementById('user-input');
      if (input) input.placeholder = listening ? t('listening_placeholder') : t('input_placeholder');
    });
    onSpeechResult(transcript => { clearInput(); handleQuery(transcript); });
    onSpeechPartial(transcript => setInputValue(transcript));
    onSpeechError(err => { console.warn('Speech error:', err); setMicListening(false); });
  }

  if (isSpeechSynthesisSupported()) {
    speakBtn.removeAttribute('hidden');
    speedBtn.removeAttribute('hidden');
    speakBtn.addEventListener('click', () => {
      const next = !getAutoSpeak();
      saveAutoSpeak(next);
      setMuted(!next);
    });
    setMuted(!getAutoSpeak());
  }

  themeBtn.addEventListener('click', toggleTheme);

  clearBtn.addEventListener('click', () => {
    stopSpeaking();
    clearChatMessages();
    clearHistory();
  });

  speedBtn.addEventListener('click', e => { e.stopPropagation(); toggleSpeedMenu(); });

  speedMenu.querySelectorAll('button').forEach((btn, i, all) => {
    btn.addEventListener('click', () => {
      const rate = parseFloat(btn.dataset.speed);
      setSpeechRate(rate);
      setActiveSpeed(rate);
      updateSpeedLabel(rate);
      hideSpeedMenu();
      speedBtn.focus();
    });
    btn.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); all[Math.min(i + 1, all.length - 1)].focus(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); all[Math.max(i - 1, 0)].focus(); }
      if (e.key === 'Escape')    { hideSpeedMenu(); speedBtn.focus(); }
    });
  });

  document.addEventListener('click', e => {
    if (!speedBtn.contains(e.target) && !speedMenu.contains(e.target)) hideSpeedMenu();
  });

  window.addEventListener('beforeunload', stopSpeaking);
}

// ---- URL shortcut queries (?query=weather) ----
function handleUrlQuery() {
  const q = new URLSearchParams(location.search).get('query');
  if (q) setTimeout(() => handleQuery(q), 300);
}

// ---- Init ----
async function init() {
  initTheme();
  loadSpeechPrefs();
  applyTranslations();
  updateSpeedLabel(getSpeechRate());
  setActiveSpeed(getSpeechRate());

  await registerServiceWorker();
  initInstallPrompt();

  if (isVoiceInputSupported() || isSpeechSynthesisSupported()) initSpeech();

  restoreHistory();
  initEventListeners();
  initSettings({ onClearHistory: () => clearChatMessages() });

  focusInput();
  handleUrlQuery();
}

document.addEventListener('DOMContentLoaded', init);
