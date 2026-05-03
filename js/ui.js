// ==================== UI ====================
import { formatText } from './formatters.js';

// ---- Message creation ----
export function createUserMessage(text) {
  return _createMessage(text, 'user');
}

export function createBotMessage(text, source = 'Bot', sourceType = 'api', url = null) {
  return _createMessage(text, 'bot', source, sourceType, url);
}

export function createErrorMessage(errorText, onRetry = null) {
  const msg = document.createElement('div');
  msg.className = 'message bot';

  const avatar = _getBotAvatar();
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble error-message';

  const p = document.createElement('p');
  p.textContent = errorText;
  bubble.appendChild(p);

  if (onRetry) {
    const btn = document.createElement('button');
    btn.className = 'retry-btn';
    btn.textContent = 'Retry';
    btn.setAttribute('aria-label', 'Retry this query');
    btn.addEventListener('click', onRetry);
    bubble.appendChild(btn);
  }

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  return msg;
}

function _createMessage(text, role, source = null, sourceType = null, url = null) {
  const msg = document.createElement('div');
  msg.className = `message ${role}`;

  const avatar = role === 'user' ? _getUserAvatar() : _getBotAvatar();
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  const content = document.createElement('div');
  content.className = 'message-content';

  const textDiv = document.createElement('div');
  textDiv.className = 'message-text';
  textDiv.innerHTML = formatText(text);
  content.appendChild(textDiv);

  if (role === 'bot' && source) {
    const meta = document.createElement('div');
    meta.className = 'message-meta';

    const tag = document.createElement('span');
    tag.className = `source-tag ${sourceType ?? 'api'}`;
    tag.textContent = source;
    meta.appendChild(tag);

    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'source-link';
      link.textContent = 'View Source';
      meta.appendChild(link);
    }

    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    meta.appendChild(time);

    content.appendChild(meta);
  }

  bubble.appendChild(content);
  msg.appendChild(avatar);
  msg.appendChild(bubble);
  return msg;
}

function _getUserAvatar() {
  const div = document.createElement('div');
  div.className = 'bot-avatar';
  div.setAttribute('aria-hidden', 'true');
  div.innerHTML = `<svg viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" fill="var(--user-bubble)"/>
    <circle cx="12" cy="13" r="3" fill="white"/>
    <circle cx="20" cy="13" r="3" fill="white"/>
    <path d="M10 20c0-3 2-5 6-5s6 2 6 5" stroke="white" stroke-width="2" fill="none"/>
  </svg>`;
  return div;
}

function _getBotAvatar() {
  const div = document.createElement('div');
  div.className = 'bot-avatar';
  div.setAttribute('aria-hidden', 'true');
  div.innerHTML = `<svg viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" fill="var(--accent)"/>
    <path d="M9 16l4 4 10-10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`;
  return div;
}

// ---- Chat container helpers ----
export function showTypingIndicator(show) {
  const el = document.getElementById('typing-indicator');
  if (el) el.style.display = show ? 'flex' : 'none';
}

export function addMessageToChat(el) {
  const container = document.getElementById('chat-messages');
  container.appendChild(el);
  scrollToBottom();
}

export function scrollToBottom() {
  const container = document.getElementById('chat-messages');
  container.scrollTop = container.scrollHeight;
}

export function clearChatMessages() {
  const container = document.getElementById('chat-messages');
  const welcome = container.querySelector('.welcome-message');
  container.innerHTML = '';
  if (welcome) container.appendChild(welcome);
}

// ---- Input helpers ----
export function getInputValue() {
  return document.getElementById('user-input')?.value ?? '';
}

export function setInputValue(v) {
  const el = document.getElementById('user-input');
  if (el) el.value = v;
}

export function clearInput() { setInputValue(''); }
export function focusInput() { document.getElementById('user-input')?.focus(); }

// ---- Button state helpers ----
export function setMicListening(listening) {
  const btn = document.getElementById('mic-btn');
  if (!btn) return;
  listening ? btn.classList.add('listening') : btn.classList.remove('listening');
  btn.setAttribute('aria-pressed', String(listening));
  const input = document.getElementById('user-input');
  if (input) input.placeholder = listening ? 'Listening…' : 'Type your question…';
}

export function setMuted(muted) {
  const btn = document.getElementById('speak-btn');
  if (!btn) return;
  muted ? btn.classList.add('muted') : btn.classList.remove('muted');
  btn.setAttribute('aria-pressed', String(muted));
}

export function updateSpeedLabel(rate) {
  const el = document.querySelector('#speed-btn .speed-label');
  if (el) el.textContent = rate + 'x';
}

export function setActiveSpeed(rate) {
  document.querySelectorAll('#speed-menu button').forEach(btn => {
    parseFloat(btn.dataset.speed) === rate
      ? btn.classList.add('active')
      : btn.classList.remove('active');
  });
}

export function toggleSpeedMenu() {
  document.getElementById('speed-menu')?.classList.toggle('hidden');
}

export function hideSpeedMenu() {
  document.getElementById('speed-menu')?.classList.add('hidden');
}

// ---- Restore history into chat ----
export function restoreMessageFromHistory(entry, container) {
  let el;
  if (entry.role === 'user') {
    el = createUserMessage(entry.text);
  } else {
    el = createBotMessage(entry.text, entry.source, entry.sourceType, entry.url);
  }
  container.appendChild(el);
}
