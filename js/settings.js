// ==================== SETTINGS PANEL ====================
import { getNasaApiKey, setNasaApiKey } from './config.js';
import { getSpeechRate, setSpeechRate, getAutoSpeak, saveAutoSpeak, isSpeechSynthesisSupported } from './speech.js';
import { clearHistory } from './history.js';
import { setActiveSpeed, updateSpeedLabel } from './ui.js';

let _onClearHistory = null;

export function initSettings({ onClearHistory } = {}) {
  _onClearHistory = onClearHistory;

  const panel   = document.getElementById('settings-panel');
  const overlay = document.getElementById('settings-overlay');
  const openBtn = document.getElementById('settings-btn');
  const closeBtn = document.getElementById('settings-close-btn');

  openBtn?.addEventListener('click', openSettings);
  closeBtn?.addEventListener('click', closeSettings);
  overlay?.addEventListener('click', closeSettings);

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel?.classList.contains('hidden')) closeSettings();
  });

  // NASA key
  const nasaInput = document.getElementById('nasa-key-input');
  const nasaSave  = document.getElementById('nasa-key-save');
  if (nasaInput) nasaInput.value = getNasaApiKey() === 'DEMO_KEY' ? '' : getNasaApiKey();
  nasaSave?.addEventListener('click', () => {
    const key = nasaInput?.value.trim();
    if (key) {
      setNasaApiKey(key);
      showSettingsNotice('NASA API key saved.');
    } else {
      setNasaApiKey('DEMO_KEY');
      showSettingsNotice('Reset to DEMO_KEY.');
    }
  });

  // Speech rate
  const rateSelect = document.getElementById('settings-rate-select');
  if (rateSelect) {
    rateSelect.value = String(getSpeechRate());
    rateSelect.addEventListener('change', () => {
      const rate = parseFloat(rateSelect.value);
      setSpeechRate(rate);
      setActiveSpeed(rate);
      updateSpeedLabel(rate);
    });
    if (!isSpeechSynthesisSupported()) {
      rateSelect.disabled = true;
      rateSelect.closest('.settings-row')?.classList.add('disabled');
    }
  }

  // Auto-speak toggle
  const autoSpeakToggle = document.getElementById('settings-auto-speak');
  if (autoSpeakToggle) {
    autoSpeakToggle.checked = getAutoSpeak();
    autoSpeakToggle.addEventListener('change', () => {
      saveAutoSpeak(autoSpeakToggle.checked);
      const speakBtn = document.getElementById('speak-btn');
      if (speakBtn) {
        autoSpeakToggle.checked ? speakBtn.classList.remove('muted') : speakBtn.classList.add('muted');
        speakBtn.setAttribute('aria-pressed', String(!autoSpeakToggle.checked));
      }
    });
    if (!isSpeechSynthesisSupported()) {
      autoSpeakToggle.disabled = true;
    }
  }

  // Clear history
  const clearBtn = document.getElementById('settings-clear-history');
  clearBtn?.addEventListener('click', () => {
    clearHistory();
    _onClearHistory?.();
    showSettingsNotice('Chat history cleared.');
  });
}

export function openSettings() {
  document.getElementById('settings-panel')?.classList.remove('hidden');
  document.getElementById('settings-overlay')?.classList.remove('hidden');
  document.getElementById('settings-panel')?.focus();
}

export function closeSettings() {
  document.getElementById('settings-panel')?.classList.add('hidden');
  document.getElementById('settings-overlay')?.classList.add('hidden');
  document.getElementById('settings-btn')?.focus();
}

function showSettingsNotice(msg) {
  const el = document.getElementById('settings-notice');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 2500);
}
