// ==================== SPEECH ====================
const _SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const _synthesis = window.speechSynthesis;

let recognition = null;
let currentUtterance = null;
let _isListening = false;
let _isSpeaking = false;
let _rate = 1;
let _autoSpeak = true;

let onListeningCb = null;
let onSpeakingCb = null;
let onResultCb = null;
let onPartialCb = null;
let onErrorCb = null;

export function isVoiceInputSupported() { return !!_SpeechRecognition; }
export function isSpeechSynthesisSupported() { return !!_synthesis; }
export function isListening() { return _isListening; }
export function isSpeaking() { return _isSpeaking; }
export function getAutoSpeak() { return _autoSpeak; }
export function setAutoSpeak(v) { _autoSpeak = v; }
export function getSpeechRate() { return _rate; }

export function setSpeechRate(rate) {
  _rate = rate;
  localStorage.setItem('madison-speech-rate', String(rate));
}

export function loadSpeechPrefs() {
  const savedRate = parseFloat(localStorage.getItem('madison-speech-rate'));
  if (!isNaN(savedRate)) _rate = savedRate;
  const savedSpeak = localStorage.getItem('madison-auto-speak');
  if (savedSpeak !== null) _autoSpeak = savedSpeak !== 'false';
}

export function saveAutoSpeak(v) {
  _autoSpeak = v;
  localStorage.setItem('madison-auto-speak', String(v));
}

export function onListeningChange(cb) { onListeningCb = cb; }
export function onSpeakingChange(cb) { onSpeakingCb = cb; }
export function onSpeechResult(cb) { onResultCb = cb; }
export function onSpeechPartial(cb) { onPartialCb = cb; }
export function onSpeechError(cb) { onErrorCb = cb; }

export function initSpeech() {
  if (!_SpeechRecognition) return;
  recognition = new _SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = localStorage.getItem('madison-speech-lang') || 'en-US';

  recognition.onstart = () => { _isListening = true; onListeningCb?.(true); };
  recognition.onend   = () => { _isListening = false; onListeningCb?.(false); };
  recognition.onresult = (event) => {
    const last = event.results[event.results.length - 1];
    if (last.isFinal) onResultCb?.(last[0].transcript);
    else onPartialCb?.(last[0].transcript);
  };
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    _isListening = false;
    onListeningCb?.(false);
    if (event.error !== 'no-speech') onErrorCb?.(event.error);
  };
}

export function startListening() {
  if (!recognition) { onErrorCb?.('Speech recognition is not supported in this browser.'); return; }
  if (_isListening) { recognition.stop(); return; }
  navigator.permissions.query({ name: 'microphone' })
    .then(status => {
      if (status.state === 'denied') {
        onErrorCb?.('Microphone access is denied. Enable it in your browser settings.');
        return;
      }
      _doStart();
    })
    .catch(() => _doStart());
}

function _doStart() {
  try {
    recognition.start();
    localStorage.setItem('madison-mic-permission', 'granted');
  } catch (err) {
    console.error('Recognition start failed:', err);
    onErrorCb?.('Could not start microphone. Please try again.');
  }
}

export function stopListening() {
  if (recognition && _isListening) recognition.stop();
}

export function speak(text, onEnd = null) {
  if (!_synthesis || !text?.trim()) return;
  _synthesis.cancel();

  const doSpeak = (voices) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = _rate;
    utterance.lang = localStorage.getItem('madison-speech-lang') || 'en-US';
    const voice = voices.find(v => v.lang.startsWith('en')) ?? voices[0];
    if (voice) utterance.voice = voice;
    utterance.onstart = () => { _isSpeaking = true; onSpeakingCb?.(true); };
    utterance.onend   = () => { _isSpeaking = false; onSpeakingCb?.(false); onEnd?.(); };
    utterance.onerror = () => { _isSpeaking = false; onSpeakingCb?.(false); };
    currentUtterance = utterance;
    _synthesis.speak(utterance);
  };

  const voices = _synthesis.getVoices();
  if (voices.length > 0) {
    doSpeak(voices);
  } else {
    _synthesis.onvoiceschanged = () => { _synthesis.onvoiceschanged = null; doSpeak(_synthesis.getVoices()); };
    setTimeout(() => { if (_synthesis.getVoices().length === 0) doSpeak([]); }, 150);
  }
}

export function stopSpeaking() {
  if (_synthesis) { _synthesis.cancel(); _isSpeaking = false; onSpeakingCb?.(false); }
}
