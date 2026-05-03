import { describe, it, expect } from 'vitest';
import {
  detectIntent,
  extractLocation,
  extractWord,
  extractCurrency,
  cleanWikiQuery,
} from '../js/intents.js';

// ─── Intent detection: non-English queries ───────────────────────────────────

describe('detectIntent – Spanish', () => {
  it('tiempo en Madrid → weather', () => expect(detectIntent('tiempo en Madrid').type).toBe('weather'));
  it('clima en Barcelona → weather', () => expect(detectIntent('clima en Barcelona').type).toBe('weather'));
  it('últimas noticias → news',      () => expect(detectIntent('últimas noticias').type).toBe('news'));
  it('noticias → news',              () => expect(detectIntent('noticias').type).toBe('news'));
  it('qué es la relatividad → wiki', () => expect(detectIntent('qué es la relatividad').type).toBe('wiki'));
  it('quién es Einstein → wiki',     () => expect(detectIntent('quién es Einstein').type).toBe('wiki'));
  it('definición de efímero → dict', () => expect(detectIntent('definición de efímero').type).toBe('dictionary'));
  it('tipo de cambio USD a EUR → exchange', () => expect(detectIntent('tipo de cambio USD a EUR').type).toBe('exchange'));
  it('nasa → nasa',                  () => expect(detectIntent('nasa').type).toBe('nasa'));
  it('espacio → nasa',               () => expect(detectIntent('espacio exterior').type).toBe('nasa'));
});

describe('detectIntent – Italian', () => {
  it('meteo a Roma → weather',         () => expect(detectIntent('meteo a Roma').type).toBe('weather'));
  it('temperatura a Milano → weather', () => expect(detectIntent('temperatura a Milano').type).toBe('weather'));
  it('ultime notizie → news',          () => expect(detectIntent('ultime notizie').type).toBe('news'));
  it('notizie → news',                 () => expect(detectIntent('notizie').type).toBe('news'));
  it("cos'è la relatività → wiki",     () => expect(detectIntent("cos'è la relatività").type).toBe('wiki'));
  it('chi è Dante → wiki',             () => expect(detectIntent('chi è Dante').type).toBe('wiki'));
  it('definizione di effimero → dict', () => expect(detectIntent('definizione di effimero').type).toBe('dictionary'));
  it('cambio USD a EUR → exchange',    () => expect(detectIntent('cambio USD a EUR').type).toBe('exchange'));
  it('spazio → nasa',                  () => expect(detectIntent('spazio').type).toBe('nasa'));
});

describe('detectIntent – French', () => {
  it('météo à Paris → weather',          () => expect(detectIntent('météo à Paris').type).toBe('weather'));
  it('température à Lyon → weather',     () => expect(detectIntent('température à Lyon').type).toBe('weather'));
  it('dernières actualités → news',      () => expect(detectIntent('dernières actualités').type).toBe('news'));
  it('actualités → news',                () => expect(detectIntent('actualités').type).toBe('news'));
  it("qu'est-ce que la relativité → wiki", () => expect(detectIntent("qu'est-ce que la relativité").type).toBe('wiki'));
  it('qui est Voltaire → wiki',          () => expect(detectIntent('qui est Voltaire').type).toBe('wiki'));
  it('définition de éphémère → dict',    () => expect(detectIntent('définition de éphémère').type).toBe('dictionary'));
  it('taux de change USD à EUR → exchange', () => expect(detectIntent('taux de change USD à EUR').type).toBe('exchange'));
  it('espace → nasa',                    () => expect(detectIntent('espace').type).toBe('nasa'));
});

describe('detectIntent – German', () => {
  it('Wetter in Berlin → weather',       () => expect(detectIntent('Wetter in Berlin').type).toBe('weather'));
  it('Temperatur in München → weather',  () => expect(detectIntent('Temperatur in München').type).toBe('weather'));
  it('aktuelle Nachrichten → news',      () => expect(detectIntent('aktuelle Nachrichten').type).toBe('news'));
  it('Nachrichten → news',              () => expect(detectIntent('Nachrichten').type).toBe('news'));
  it('Was ist Relativität → wiki',       () => expect(detectIntent('Was ist Relativität').type).toBe('wiki'));
  it('Wer ist Goethe → wiki',            () => expect(detectIntent('Wer ist Goethe').type).toBe('wiki'));
  it('Bedeutung von ephemer → dict',     () => expect(detectIntent('Bedeutung von ephemer').type).toBe('dictionary'));
  it('Wechselkurs USD zu EUR → exchange', () => expect(detectIntent('Wechselkurs USD zu EUR').type).toBe('exchange'));
  it('Weltall → nasa',                   () => expect(detectIntent('Weltall').type).toBe('nasa'));
});

describe('detectIntent – Portuguese', () => {
  it('tempo em Lisboa → weather',        () => expect(detectIntent('tempo em Lisboa').type).toBe('weather'));
  it('clima no Porto → weather',         () => expect(detectIntent('clima no Porto').type).toBe('weather'));
  it('últimas notícias → news',          () => expect(detectIntent('últimas notícias').type).toBe('news'));
  it('notícias → news',                  () => expect(detectIntent('notícias').type).toBe('news'));
  it('o que é relatividade → wiki',      () => expect(detectIntent('o que é relatividade').type).toBe('wiki'));
  it('quem é Camões → wiki',             () => expect(detectIntent('quem é Camões').type).toBe('wiki'));
  it('definição de efêmero → dict',      () => expect(detectIntent('definição de efêmero').type).toBe('dictionary'));
  it('taxa de câmbio USD para EUR → exchange', () => expect(detectIntent('taxa de câmbio USD para EUR').type).toBe('exchange'));
  it('espaço → nasa',                    () => expect(detectIntent('espaço').type).toBe('nasa'));
});

// ─── extractLocation (language-aware) ────────────────────────────────────────

describe('extractLocation – multilingual', () => {
  it('ES: tiempo en Madrid',         () => expect(extractLocation('tiempo en Madrid', 'es')).toBe('Madrid'));
  it('ES: clima en Barcelona',       () => expect(extractLocation('clima en Barcelona', 'es')).toBe('Barcelona'));
  it('IT: meteo a Roma',             () => expect(extractLocation('meteo a Roma', 'it')).toBe('Roma'));
  it('IT: temperatura a Milano',     () => expect(extractLocation('temperatura a Milano', 'it')).toBe('Milano'));
  it('FR: météo à Paris',            () => expect(extractLocation('météo à Paris', 'fr')).toBe('Paris'));
  it('FR: température à Lyon',       () => expect(extractLocation('température à Lyon', 'fr')).toBe('Lyon'));
  it('DE: Wetter in Berlin',         () => expect(extractLocation('Wetter in Berlin', 'de')).toBe('Berlin'));
  it('DE: Temperatur in München',    () => expect(extractLocation('Temperatur in München', 'de')).toBe('München'));
  it('PT: tempo em Lisboa',          () => expect(extractLocation('tempo em Lisboa', 'pt')).toBe('Lisboa'));
  it('PT: clima no Porto',           () => expect(extractLocation('clima no Porto', 'pt')).toBe('Porto'));
});

// ─── extractWord (language-aware) ────────────────────────────────────────────

describe('extractWord – multilingual', () => {
  it('ES: definición de efímero',    () => expect(extractWord('definición de efímero', 'es')).toBe('efímero'));
  it('ES: qué significa serendipia', () => expect(extractWord('qué significa serendipia', 'es')).toBe('serendipia'));
  it('IT: definizione di effimero',  () => expect(extractWord('definizione di effimero', 'it')).toBe('effimero'));
  it('IT: cosa significa effimero',  () => expect(extractWord('cosa significa effimero', 'it')).toBe('effimero'));
  it('FR: définition de éphémère',   () => expect(extractWord('définition de éphémère', 'fr')).toBe('éphémère'));
  it('FR: que signifie éphémère',    () => expect(extractWord('que signifie éphémère', 'fr')).toBe('éphémère'));
  it('DE: Bedeutung von ephemer',    () => expect(extractWord('Bedeutung von ephemer', 'de')).toBe('ephemer'));
  it('DE: was bedeutet ephemer',     () => expect(extractWord('was bedeutet ephemer', 'de')).toBe('ephemer'));
  it('PT: definição de efêmero',     () => expect(extractWord('definição de efêmero', 'pt')).toBe('efêmero'));
  it('PT: o que significa efêmero',  () => expect(extractWord('o que significa efêmero', 'pt')).toBe('efêmero'));
});

// ─── cleanWikiQuery (language-aware) ─────────────────────────────────────────

describe('cleanWikiQuery – multilingual', () => {
  it('ES strips "qué es"',           () => expect(cleanWikiQuery('qué es la relatividad', 'es')).toBe('la relatividad'));
  it('ES strips "quién es"',         () => expect(cleanWikiQuery('quién es Einstein', 'es')).toBe('Einstein'));
  it('IT strips "cos\'è"',           () => expect(cleanWikiQuery("cos'è la relatività", 'it')).toBe('la relatività'));
  it('IT strips "chi è"',            () => expect(cleanWikiQuery('chi è Dante', 'it')).toBe('Dante'));
  it("FR strips \"qu'est-ce que\"",  () => expect(cleanWikiQuery("qu'est-ce que la relativité", 'fr')).toBe('la relativité'));
  it('FR strips "qui est"',          () => expect(cleanWikiQuery('qui est Voltaire', 'fr')).toBe('Voltaire'));
  it('DE strips "Was ist"',          () => expect(cleanWikiQuery('Was ist Relativität', 'de')).toBe('Relativität'));
  it('DE strips "Wer ist"',          () => expect(cleanWikiQuery('Wer ist Goethe', 'de')).toBe('Goethe'));
  it('PT strips "o que é"',          () => expect(cleanWikiQuery('o que é relatividade', 'pt')).toBe('relatividade'));
  it('PT strips "quem é"',           () => expect(cleanWikiQuery('quem é Camões', 'pt')).toBe('Camões'));
});

// ─── extractCurrency (language-agnostic) ─────────────────────────────────────

describe('extractCurrency – multilingual', () => {
  it('ES: convertir USD a EUR',      () => expect(extractCurrency('convertir USD a EUR')).toMatchObject({ from: 'USD', to: 'EUR' }));
  it('IT: convertire GBP in JPY',    () => expect(extractCurrency('convertire GBP in JPY')).toMatchObject({ from: 'GBP', to: 'JPY' }));
  it('FR: convertir USD en EUR',     () => expect(extractCurrency('convertir USD en EUR')).toMatchObject({ from: 'USD', to: 'EUR' }));
  it('DE: USD zu EUR',               () => expect(extractCurrency('100 USD zu EUR')).toMatchObject({ amount: 100, from: 'USD', to: 'EUR' }));
  it('PT: converter USD para EUR',   () => expect(extractCurrency('converter USD para EUR')).toMatchObject({ from: 'USD', to: 'EUR' }));
});
