// ==================== SETTINGS PANEL ====================
import { getNasaApiKey, setNasaApiKey } from './config.js';
import { getSpeechRate, setSpeechRate, getAutoSpeak, saveAutoSpeak, isSpeechSynthesisSupported } from './speech.js';
import { clearHistory } from './history.js';
import { setActiveSpeed, updateSpeedLabel } from './ui.js';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

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

  // Escape key closes, Tab key is trapped inside panel
  document.addEventListener('keydown', e => {
    if (panel?.classList.contains('hidden')) return;
    if (e.key === 'Escape') { closeSettings(); return; }
    if (e.key === 'Tab') trapFocus(e, panel);
  });

  // NASA key
  const nasaInput = document.getElementById('nasa-key-input');
  const nasaSave  = document.getElementById('nasa-key-save');
  const currentKey = getNasaApiKey();
  if (nasaInput) nasaInput.value = currentKey === 'DEMO_KEY' ? '' : currentKey;
  nasaSave?.addEventListener('click', () => {
    const key = nasaInput?.value.trim();
    setNasaApiKey(key || 'DEMO_KEY');
    showSettingsNotice(key ? 'NASA API key saved.' : 'Reset to DEMO_KEY.');
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
        speakBtn.classList.toggle('muted', !autoSpeakToggle.checked);
        speakBtn.setAttribute('aria-pressed', String(!autoSpeakToggle.checked));
      }
    });
    if (!isSpeechSynthesisSupported()) autoSpeakToggle.disabled = true;
  }

  // Clear history
  document.getElementById('settings-clear-history')?.addEventListener('click', () => {
    clearHistory();
    _onClearHistory?.();
    showSettingsNotice('Chat history cleared.');
  });
}

export function openSettings() {
  const panel = document.getElementById('settings-panel');
  const overlay = document.getElementById('settings-overlay');
  panel?.classList.remove('hidden');
  overlay?.classList.remove('hidden');
  overlay?.removeAttribute('aria-hidden');
  // Focus first focusable element inside panel
  const first = panel?.querySelectorAll(FOCUSABLE)[0];
  first?.focus();
}

export function closeSettings() {
  document.getElementById('settings-panel')?.classList.add('hidden');
  document.getElementById('settings-overlay')?.classList.add('hidden');
  document.getElementById('settings-overlay')?.setAttribute('aria-hidden', 'true');
  document.getElementById('settings-btn')?.focus();
}

function trapFocus(e, panel) {
  const focusable = Array.from(panel.querySelectorAll(FOCUSABLE));
  if (!focusable.length) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
  }
}

function showSettingsNotice(msg) {
  const el = document.getElementById('settings-notice');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 2500);
}
