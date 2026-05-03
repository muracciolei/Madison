// ==================== APP ORCHESTRATOR ====================
import { detectIntent, extractLocation, extractWord, extractCurrency, cleanWikiQuery } from './intents.js';
import { fetchWikipedia, fetchWeather, fetchNASAApod, fetchExchangeRates, fetchDictionary, fetchNews } from './api.js';
import { formatWeather, formatWikipedia, formatNASAApod, formatDictionary, formatExchange, formatNews, plainText } from './formatters.js';
import {
  initSpeech, isVoiceInputSupported, isSpeechSynthesisSupported,
  startListening, stopListening, speak, stopSpeaking,
  isListening, getAutoSpeak, saveAutoSpeak, setSpeechRate, getSpeechRate,
  onListeningChange, onSpeakingChange, onSpeechResult, onSpeechPartial, onSpeechError,
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

let isProcessing = false;

// ---- Query handler ----
export async function handleQuery(query) {
  if (!query.trim() || isProcessing) return;
  isProcessing = true;

  const userMsg = createUserMessage(query);
  addMessageToChat(userMsg);
  saveMessage({ role: 'user', text: query });

  showTypingIndicator(true);

  try {
    const { text, source, sourceType, url } = await resolveQuery(query);
    const botMsg = createBotMessage(text, source, sourceType, url);
    addMessageToChat(botMsg);
    saveMessage({ role: 'bot', text, source, sourceType, url });

    if (getAutoSpeak()) speak(plainText(text));
  } catch (error) {
    console.error('Query error:', error);
    const retryFn = () => {
      const errorMsgs = document.getElementById('chat-messages').querySelectorAll('.error-message');
      errorMsgs[errorMsgs.length - 1]?.closest('.message')?.remove();
      handleQuery(query);
    };
    const errMsg = createErrorMessage(error.message || 'Something went wrong. Please try again.', retryFn);
    addMessageToChat(errMsg);
  } finally {
    showTypingIndicator(false);
    isProcessing = false;
  }
}

async function resolveQuery(query) {
  const intent = detectIntent(query);

  switch (intent.type) {
    case 'weather': {
      const location = extractLocation(query);
      const data = await fetchWeather(location);
      return { text: formatWeather(data), source: data.source, sourceType: 'api', url: data.url };
    }
    case 'news': {
      const items = await fetchNews();
      return { text: formatNews(items), source: 'News', sourceType: 'rss', url: null };
    }
    case 'nasa': {
      const data = await fetchNASAApod();
      return { text: formatNASAApod(data), source: data.source, sourceType: 'api', url: data.url };
    }
    case 'exchange': {
      const currencyInfo = extractCurrency(query);
      const data = await fetchExchangeRates();
      return { text: formatExchange(data, currencyInfo), source: data.source, sourceType: 'api', url: data.url };
    }
    case 'dictionary': {
      const word = extractWord(query);
      if (!word) {
        const wikiQuery = cleanWikiQuery(query);
        const data = await fetchWikipedia(wikiQuery);
        return { text: formatWikipedia(data), source: data.source, sourceType: 'wiki', url: data.url };
      }
      const data = await fetchDictionary(word);
      return { text: formatDictionary(data), source: data.source, sourceType: 'dict', url: data.url };
    }
    default: {
      const wikiQuery = cleanWikiQuery(query);
      const data = await fetchWikipedia(wikiQuery || query);
      return { text: formatWikipedia(data), source: data.source, sourceType: 'wiki', url: data.url };
    }
  }
}

// ---- Theme ----
function initTheme() {
  const saved = localStorage.getItem('madison-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  if (next === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('madison-theme', next);
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
  const sendBtn  = document.getElementById('send-btn');
  const input    = document.getElementById('user-input');
  const micBtn   = document.getElementById('mic-btn');
  const speakBtn = document.getElementById('speak-btn');
  const themeBtn = document.getElementById('theme-btn');
  const clearBtn = document.getElementById('clear-btn');
  const speedBtn = document.getElementById('speed-btn');
  const speedMenu = document.getElementById('speed-menu');

  const submit = () => {
    const q = getInputValue().trim();
    if (q) { clearInput(); handleQuery(q); }
  };

  sendBtn.addEventListener('click', submit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  });

  // Mic button — hide if unsupported, show capability message
  if (isVoiceInputSupported()) {
    micBtn.removeAttribute('hidden');
    micBtn.addEventListener('click', () => isListening() ? stopListening() : startListening());
    onListeningChange(listening => setMicListening(listening));
    onSpeechResult(transcript => { clearInput(); handleQuery(transcript); });
    onSpeechPartial(transcript => setInputValue(transcript));
    onSpeechError(err => {
      console.warn('Speech error:', err);
      setMicListening(false);
    });
  } else {
    micBtn.setAttribute('hidden', '');
  }

  // Speak button
  if (isSpeechSynthesisSupported()) {
    speakBtn.removeAttribute('hidden');
    speedBtn.removeAttribute('hidden');
    speakBtn.addEventListener('click', () => {
      const next = !getAutoSpeak();
      saveAutoSpeak(next);
      setMuted(!next);
    });
    // Sync initial muted state
    setMuted(!getAutoSpeak());
  } else {
    speakBtn.setAttribute('hidden', '');
    speedBtn.setAttribute('hidden', '');
  }

  themeBtn.addEventListener('click', toggleTheme);

  clearBtn.addEventListener('click', () => {
    stopSpeaking();
    clearChatMessages();
    clearHistory();
  });

  speedBtn.addEventListener('click', e => { e.stopPropagation(); toggleSpeedMenu(); });

  // Speed menu keyboard nav
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

// ---- Handle URL shortcut queries (?query=...) ----
function handleUrlQuery() {
  const params = new URLSearchParams(location.search);
  const q = params.get('query');
  if (q) setTimeout(() => handleQuery(q), 300);
}

// ---- Init ----
async function init() {
  initTheme();
  loadSpeechPrefs();

  // Restore saved speed label
  updateSpeedLabel(getSpeechRate());
  setActiveSpeed(getSpeechRate());

  await registerServiceWorker();

  if (isVoiceInputSupported() || isSpeechSynthesisSupported()) initSpeech();

  restoreHistory();
  initEventListeners();

  initSettings({
    onClearHistory: () => clearChatMessages(),
  });

  focusInput();
  handleUrlQuery();
}

document.addEventListener('DOMContentLoaded', init);
