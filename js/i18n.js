// ==================== INTERNATIONALISATION ====================

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Español',
  it: 'Italiano',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
};

// BCP 47 locale codes used for speech recognition & synthesis
export const SPEECH_LOCALES = {
  en: 'en-US',
  es: 'es-ES',
  it: 'it-IT',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-BR',
};

// ISO 639-1 codes used for Wikipedia subdomain & Geocoding API
export const WIKI_LANG_CODES = {
  en: 'en',
  es: 'es',
  it: 'it',
  fr: 'fr',
  de: 'de',
  pt: 'pt',
};

// Dictionary API language codes
export const DICT_LANG_CODES = {
  en: 'en',
  es: 'es',
  it: 'it',
  fr: 'fr',
  de: 'de',
  pt: 'pt-BR',
};

const TRANSLATIONS = {
  en: {
    welcome_title: 'Ask Madison',
    welcome_subtitle: 'Your voice-powered search assistant. Ask me about:',
    feature_weather: 'Weather in any city',
    feature_wiki: 'Wikipedia topics',
    feature_news: 'Latest news',
    feature_nasa: 'NASA space updates',
    feature_exchange: 'Currency exchange rates',
    feature_dictionary: 'Word definitions',
    hint: 'Try: "weather in London" or "what is artificial intelligence"',
    input_placeholder: 'Type your question…',
    listening_placeholder: 'Listening…',
    mic_label: 'Start voice input',
    speak_label: 'Toggle auto-speak',
    send_label: 'Send message',
    clear_label: 'Clear chat',
    theme_label: 'Toggle dark/light theme',
    speed_label: 'Set voice speed',
    settings_label: 'Open settings',
    install_label: 'Install Madison app',
    settings_title: 'Settings',
    settings_close: 'Close settings',
    settings_language: 'Language',
    settings_nasa_title: 'NASA API Key',
    settings_nasa_desc: 'The default DEMO_KEY is rate-limited. Get your free key at',
    settings_nasa_placeholder: 'Paste your API key…',
    settings_nasa_save: 'Save',
    settings_nasa_saved: 'NASA API key saved.',
    settings_nasa_reset: 'Reset to DEMO_KEY.',
    settings_speech_title: 'Speech',
    settings_speed: 'Speed',
    settings_auto_speak: 'Auto-speak responses',
    settings_data_title: 'Data',
    settings_clear_history: 'Clear Chat History',
    settings_history_cleared: 'Chat history cleared.',
  },

  es: {
    welcome_title: '¡Pregunta a Madison!',
    welcome_subtitle: 'Tu asistente de búsqueda por voz. Pregúntame sobre:',
    feature_weather: 'El tiempo en cualquier ciudad',
    feature_wiki: 'Temas de Wikipedia',
    feature_news: 'Últimas noticias',
    feature_nasa: 'Novedades espaciales de la NASA',
    feature_exchange: 'Tipos de cambio de divisas',
    feature_dictionary: 'Definiciones de palabras',
    hint: 'Prueba: "tiempo en Madrid" o "qué es la inteligencia artificial"',
    input_placeholder: 'Escribe tu pregunta…',
    listening_placeholder: 'Escuchando…',
    mic_label: 'Iniciar entrada de voz',
    speak_label: 'Activar/desactivar lectura automática',
    send_label: 'Enviar mensaje',
    clear_label: 'Borrar chat',
    theme_label: 'Cambiar tema claro/oscuro',
    speed_label: 'Velocidad de voz',
    settings_label: 'Abrir configuración',
    install_label: 'Instalar Madison',
    settings_title: 'Configuración',
    settings_close: 'Cerrar configuración',
    settings_language: 'Idioma',
    settings_nasa_title: 'Clave API de NASA',
    settings_nasa_desc: 'La clave DEMO_KEY tiene límite de uso. Obtén tu clave gratuita en',
    settings_nasa_placeholder: 'Pega tu clave API…',
    settings_nasa_save: 'Guardar',
    settings_nasa_saved: 'Clave API de NASA guardada.',
    settings_nasa_reset: 'Restablecido a DEMO_KEY.',
    settings_speech_title: 'Voz',
    settings_speed: 'Velocidad',
    settings_auto_speak: 'Leer respuestas automáticamente',
    settings_data_title: 'Datos',
    settings_clear_history: 'Borrar historial',
    settings_history_cleared: 'Historial eliminado.',
  },

  it: {
    welcome_title: 'Chiedi a Madison!',
    welcome_subtitle: 'Il tuo assistente di ricerca vocale. Chiedimi di:',
    feature_weather: 'Meteo in qualsiasi città',
    feature_wiki: 'Argomenti di Wikipedia',
    feature_news: 'Ultime notizie',
    feature_nasa: 'Aggiornamenti spaziali della NASA',
    feature_exchange: 'Tassi di cambio valuta',
    feature_dictionary: 'Definizioni di parole',
    hint: 'Prova: "meteo a Roma" o "che cos\'è l\'intelligenza artificiale"',
    input_placeholder: 'Scrivi la tua domanda…',
    listening_placeholder: 'In ascolto…',
    mic_label: 'Avvia input vocale',
    speak_label: 'Attiva/disattiva lettura automatica',
    send_label: 'Invia messaggio',
    clear_label: 'Cancella chat',
    theme_label: 'Tema chiaro/scuro',
    speed_label: 'Velocità voce',
    settings_label: 'Apri impostazioni',
    install_label: 'Installa Madison',
    settings_title: 'Impostazioni',
    settings_close: 'Chiudi impostazioni',
    settings_language: 'Lingua',
    settings_nasa_title: 'Chiave API NASA',
    settings_nasa_desc: 'La chiave DEMO_KEY ha limiti di utilizzo. Ottieni la tua chiave gratuita su',
    settings_nasa_placeholder: 'Incolla la tua chiave API…',
    settings_nasa_save: 'Salva',
    settings_nasa_saved: 'Chiave API NASA salvata.',
    settings_nasa_reset: 'Ripristinato a DEMO_KEY.',
    settings_speech_title: 'Voce',
    settings_speed: 'Velocità',
    settings_auto_speak: 'Leggi automaticamente le risposte',
    settings_data_title: 'Dati',
    settings_clear_history: 'Cancella cronologia',
    settings_history_cleared: 'Cronologia eliminata.',
  },

  fr: {
    welcome_title: 'Demandez à Madison !',
    welcome_subtitle: 'Votre assistant de recherche vocale. Posez-moi des questions sur :',
    feature_weather: 'Météo dans n\'importe quelle ville',
    feature_wiki: 'Sujets Wikipédia',
    feature_news: 'Dernières actualités',
    feature_nasa: 'Actualités spatiales NASA',
    feature_exchange: 'Taux de change',
    feature_dictionary: 'Définitions de mots',
    hint: 'Essayez : "météo à Paris" ou "qu\'est-ce que l\'intelligence artificielle"',
    input_placeholder: 'Tapez votre question…',
    listening_placeholder: 'En écoute…',
    mic_label: 'Démarrer la saisie vocale',
    speak_label: 'Activer/désactiver la lecture automatique',
    send_label: 'Envoyer le message',
    clear_label: 'Effacer la conversation',
    theme_label: 'Basculer thème clair/sombre',
    speed_label: 'Vitesse de la voix',
    settings_label: 'Ouvrir les paramètres',
    install_label: 'Installer Madison',
    settings_title: 'Paramètres',
    settings_close: 'Fermer les paramètres',
    settings_language: 'Langue',
    settings_nasa_title: 'Clé API NASA',
    settings_nasa_desc: 'La clé DEMO_KEY est limitée. Obtenez votre clé gratuite sur',
    settings_nasa_placeholder: 'Collez votre clé API…',
    settings_nasa_save: 'Enregistrer',
    settings_nasa_saved: 'Clé API NASA enregistrée.',
    settings_nasa_reset: 'Réinitialisé à DEMO_KEY.',
    settings_speech_title: 'Voix',
    settings_speed: 'Vitesse',
    settings_auto_speak: 'Lire automatiquement les réponses',
    settings_data_title: 'Données',
    settings_clear_history: 'Effacer l\'historique',
    settings_history_cleared: 'Historique effacé.',
  },

  de: {
    welcome_title: 'Frag Madison!',
    welcome_subtitle: 'Dein sprachgesteuerter Suchassistent. Frag mich nach:',
    feature_weather: 'Wetter in jeder Stadt',
    feature_wiki: 'Wikipedia-Themen',
    feature_news: 'Aktuelle Nachrichten',
    feature_nasa: 'NASA-Weltraumneuigkeiten',
    feature_exchange: 'Währungswechselkurse',
    feature_dictionary: 'Wortdefinitionen',
    hint: 'Versuch: "Wetter in Berlin" oder "Was ist künstliche Intelligenz"',
    input_placeholder: 'Schreibe deine Frage…',
    listening_placeholder: 'Höre zu…',
    mic_label: 'Spracheingabe starten',
    speak_label: 'Automatisches Vorlesen ein/aus',
    send_label: 'Nachricht senden',
    clear_label: 'Chat löschen',
    theme_label: 'Hell/Dunkel-Modus umschalten',
    speed_label: 'Sprechgeschwindigkeit',
    settings_label: 'Einstellungen öffnen',
    install_label: 'Madison installieren',
    settings_title: 'Einstellungen',
    settings_close: 'Einstellungen schließen',
    settings_language: 'Sprache',
    settings_nasa_title: 'NASA API-Schlüssel',
    settings_nasa_desc: 'Der DEMO_KEY ist ratenbegrenzt. Hol dir deinen kostenlosen Schlüssel auf',
    settings_nasa_placeholder: 'API-Schlüssel einfügen…',
    settings_nasa_save: 'Speichern',
    settings_nasa_saved: 'NASA API-Schlüssel gespeichert.',
    settings_nasa_reset: 'Auf DEMO_KEY zurückgesetzt.',
    settings_speech_title: 'Sprache',
    settings_speed: 'Geschwindigkeit',
    settings_auto_speak: 'Antworten automatisch vorlesen',
    settings_data_title: 'Daten',
    settings_clear_history: 'Chatverlauf löschen',
    settings_history_cleared: 'Chatverlauf gelöscht.',
  },

  pt: {
    welcome_title: 'Pergunte à Madison!',
    welcome_subtitle: 'Seu assistente de busca por voz. Pergunte-me sobre:',
    feature_weather: 'Tempo em qualquer cidade',
    feature_wiki: 'Tópicos da Wikipedia',
    feature_news: 'Últimas notícias',
    feature_nasa: 'Atualizações espaciais da NASA',
    feature_exchange: 'Taxas de câmbio',
    feature_dictionary: 'Definições de palavras',
    hint: 'Tente: "tempo em Lisboa" ou "o que é inteligência artificial"',
    input_placeholder: 'Digite sua pergunta…',
    listening_placeholder: 'Ouvindo…',
    mic_label: 'Iniciar entrada de voz',
    speak_label: 'Ativar/desativar leitura automática',
    send_label: 'Enviar mensagem',
    clear_label: 'Limpar chat',
    theme_label: 'Alternar tema claro/escuro',
    speed_label: 'Velocidade de voz',
    settings_label: 'Abrir configurações',
    install_label: 'Instalar Madison',
    settings_title: 'Configurações',
    settings_close: 'Fechar configurações',
    settings_language: 'Idioma',
    settings_nasa_title: 'Chave API da NASA',
    settings_nasa_desc: 'A chave DEMO_KEY tem limite de uso. Obtenha sua chave gratuita em',
    settings_nasa_placeholder: 'Cole sua chave API…',
    settings_nasa_save: 'Salvar',
    settings_nasa_saved: 'Chave API da NASA salva.',
    settings_nasa_reset: 'Redefinido para DEMO_KEY.',
    settings_speech_title: 'Voz',
    settings_speed: 'Velocidade',
    settings_auto_speak: 'Ler respostas automaticamente',
    settings_data_title: 'Dados',
    settings_clear_history: 'Limpar histórico',
    settings_history_cleared: 'Histórico apagado.',
  },
};

// ---- Public API ----

export function getCurrentLang() {
  try {
    const saved = localStorage.getItem('madison-lang');
    if (saved && SUPPORTED_LANGUAGES[saved]) return saved;
    // Auto-detect from browser
    const browser = navigator.language?.slice(0, 2).toLowerCase();
    return SUPPORTED_LANGUAGES[browser] ? browser : 'en';
  } catch {
    return 'en';
  }
}

export function setLang(lang) {
  if (!SUPPORTED_LANGUAGES[lang]) return;
  try { localStorage.setItem('madison-lang', lang); } catch { /* ignore */ }
}

export function t(key) {
  const lang = getCurrentLang();
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en?.[key] ?? key;
}

export function getLocale() {
  return SPEECH_LOCALES[getCurrentLang()] ?? 'en-US';
}

export function getWikiLang() {
  return WIKI_LANG_CODES[getCurrentLang()] ?? 'en';
}

export function getDictLang() {
  return DICT_LANG_CODES[getCurrentLang()] ?? 'en';
}

// Walk the DOM and replace text / attributes using data-i18n-* attributes
export function applyTranslations() {
  const lang = getCurrentLang();
  document.documentElement.lang = SPEECH_LOCALES[lang]?.replace('_', '-') ?? 'en';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    // Only used for static safe strings (no user content)
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-label]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nLabel));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
}
