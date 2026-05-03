// ==================== CHAT HISTORY ====================
const STORAGE_KEY = 'madison-history';
const MAX_ENTRIES = 50;

export function saveMessage(entry) {
  const history = loadRaw();
  history.push({ ...entry, timestamp: Date.now() });
  if (history.length > MAX_ENTRIES) history.splice(0, history.length - MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage quota exceeded — trim and retry
    history.splice(0, 10);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch { /* ignore */ }
  }
}

export function loadHistory() {
  return loadRaw();
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

function loadRaw() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}
