import { describe, it, expect } from 'vitest';
import { detectIntent, extractLocation, extractWord, extractCurrency, cleanWikiQuery } from '../js/intents.js';

describe('detectIntent', () => {
  // Weather
  it('detects weather with prefix "weather in"', () => {
    expect(detectIntent('weather in London').type).toBe('weather');
  });
  it('detects weather with prefix "weather at"', () => {
    expect(detectIntent('weather at Tokyo').type).toBe('weather');
  });
  it('detects weather from keyword alone', () => {
    expect(detectIntent("what's the temperature today").type).toBe('weather');
  });

  // News
  it('detects news from prefix "news"', () => {
    expect(detectIntent('news').type).toBe('news');
  });
  it('detects news from "latest news"', () => {
    expect(detectIntent('latest news').type).toBe('news');
  });
  it('detects news from "headlines"', () => {
    expect(detectIntent('show me the headlines').type).toBe('news');
  });

  // NASA
  it('detects nasa from prefix "nasa"', () => {
    expect(detectIntent('nasa').type).toBe('nasa');
  });
  it('detects nasa from "apod"', () => {
    expect(detectIntent('apod').type).toBe('nasa');
  });
  it('detects nasa from "space news"', () => {
    expect(detectIntent('space news').type).toBe('nasa');
  });
  it('detects nasa from "picture of the day"', () => {
    expect(detectIntent("today's picture of the day").type).toBe('nasa');
  });

  // Exchange
  it('detects exchange from "convert USD to EUR"', () => {
    expect(detectIntent('convert USD to EUR').type).toBe('exchange');
  });
  it('detects exchange from "exchange rate"', () => {
    expect(detectIntent('exchange rate').type).toBe('exchange');
  });
  it('detects exchange from currency keyword', () => {
    expect(detectIntent('how much is the dollar today').type).toBe('exchange');
  });

  // Dictionary
  it('detects dictionary from "define"', () => {
    expect(detectIntent('define ephemeral').type).toBe('dictionary');
  });
  it('detects dictionary from "meaning of"', () => {
    expect(detectIntent('meaning of serendipity').type).toBe('dictionary');
  });
  it('detects dictionary from "pronunciation of"', () => {
    expect(detectIntent('pronunciation of quinoa').type).toBe('dictionary');
  });

  // Wiki
  it('detects wiki from "what is"', () => {
    expect(detectIntent('what is quantum computing').type).toBe('wiki');
  });
  it('detects wiki from "who is"', () => {
    expect(detectIntent('who is Marie Curie').type).toBe('wiki');
  });
  it('detects wiki for unknown queries', () => {
    expect(detectIntent('black holes').type).toBe('wiki');
  });

  // Ambiguity resolution — explicit prefix should win
  it('news prefix beats weather keyword in title', () => {
    expect(detectIntent('news about the weather').type).toBe('news');
  });
  it('weather prefix beats news keyword in title', () => {
    expect(detectIntent('weather in the news today').type).toBe('weather');
  });
});

describe('extractLocation', () => {
  it('extracts city after "weather in"', () => {
    expect(extractLocation('weather in Paris')).toBe('Paris');
  });
  it('extracts city after "weather at"', () => {
    expect(extractLocation('weather at New York')).toBe('New York');
  });
  it('extracts city after "weather for"', () => {
    expect(extractLocation('weather for Berlin')).toBe('Berlin');
  });
  it('falls back to full query when no weather pattern', () => {
    expect(extractLocation('London').toLowerCase()).toContain('london');
  });
});

describe('extractWord', () => {
  it('extracts word from "define X"', () => {
    expect(extractWord('define serendipity')).toBe('serendipity');
  });
  it('extracts word from "meaning of X"', () => {
    expect(extractWord('meaning of ephemeral')).toBe('ephemeral');
  });
  it('extracts word from "definition of X"', () => {
    expect(extractWord('definition of altruism')).toBe('altruism');
  });
  it('returns null for multi-word non-dictionary queries', () => {
    expect(extractWord('what is the capital of France')).toBeNull();
  });
  it('returns single word as-is', () => {
    expect(extractWord('ubiquitous')).toBe('ubiquitous');
  });
});

describe('extractCurrency', () => {
  it('extracts from/to from "convert USD to EUR"', () => {
    expect(extractCurrency('convert USD to EUR')).toMatchObject({ from: 'USD', to: 'EUR' });
  });
  it('extracts from "exchange GBP to JPY"', () => {
    expect(extractCurrency('exchange GBP to JPY')).toMatchObject({ from: 'GBP', to: 'JPY' });
  });
  it('extracts amount from "100 USD to EUR"', () => {
    const r = extractCurrency('100 USD to EUR');
    expect(r).toMatchObject({ amount: 100, from: 'USD', to: 'EUR' });
  });
  it('returns null for non-currency queries', () => {
    expect(extractCurrency('weather in London')).toBeNull();
  });
});

describe('cleanWikiQuery', () => {
  it('strips "what is" prefix', () => {
    expect(cleanWikiQuery('what is quantum computing')).toBe('quantum computing');
  });
  it('strips "who is" prefix', () => {
    expect(cleanWikiQuery('who is Albert Einstein')).toBe('Albert Einstein');
  });
  it('strips "tell me about" prefix', () => {
    expect(cleanWikiQuery('tell me about black holes')).toBe('black holes');
  });
  it('preserves queries with no known prefix', () => {
    expect(cleanWikiQuery('black holes')).toBe('black holes');
  });
});
