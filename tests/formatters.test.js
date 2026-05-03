import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  formatText,
  formatWeather,
  formatWikipedia,
  formatDictionary,
  formatExchange,
  formatNews,
  plainText,
} from '../js/formatters.js';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });
  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });
  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });
  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });
  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
  it('handles non-string (number)', () => {
    expect(escapeHtml(42)).toBe('42');
  });
});

describe('formatText', () => {
  it('converts **bold** to <strong>', () => {
    expect(formatText('**hello**')).toContain('<strong>hello</strong>');
  });
  it('converts newlines to <br>', () => {
    expect(formatText('line1\nline2')).toContain('<br>');
  });
  it('renders markdown links with http URLs', () => {
    const out = formatText('[Visit](https://example.com)');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('target="_blank"');
  });
  it('does NOT render javascript: URLs as links', () => {
    const out = formatText('[Click](javascript:alert(1))');
    expect(out).not.toContain('href="javascript:');
  });
  it('escapes raw HTML in input', () => {
    const out = formatText('<img src=x onerror=alert(1)>');
    expect(out).toContain('&lt;img');
    expect(out).not.toContain('<img');
  });
  it('renders divider marker', () => {
    expect(formatText('---divider---')).toContain('<hr');
  });
  it('auto-links bare https:// URLs', () => {
    const out = formatText('See https://example.com for info');
    expect(out).toContain('href="https://example.com"');
  });
});

describe('formatWeather', () => {
  const data = {
    location: 'London, GB',
    temperature: 15,
    condition: 'Partly cloudy',
    humidity: 72,
    wind: 20,
    high: 18,
    low: 11,
  };

  it('includes location', () => {
    expect(formatWeather(data)).toContain('London, GB');
  });
  it('includes temperature', () => {
    expect(formatWeather(data)).toContain('15°C');
  });
  it('includes condition', () => {
    expect(formatWeather(data)).toContain('Partly cloudy');
  });
  it('includes humidity', () => {
    expect(formatWeather(data)).toContain('72%');
  });
  it('includes high/low', () => {
    const s = formatWeather(data);
    expect(s).toContain('18°');
    expect(s).toContain('11°');
  });
});

describe('formatWikipedia', () => {
  it('includes title in bold', () => {
    const s = formatWikipedia({ title: 'Black hole', extract: 'A region of spacetime.' });
    expect(s).toContain('**Black hole**');
  });
  it('includes extract', () => {
    const s = formatWikipedia({ title: 'X', extract: 'Test extract.' });
    expect(s).toContain('Test extract.');
  });
  it('handles missing extract gracefully', () => {
    const s = formatWikipedia({ title: 'X', extract: null });
    expect(s).toContain('No extract available');
  });
});

describe('formatDictionary', () => {
  const data = {
    word: 'serendipity',
    phonetic: '/ˌsɛr.ənˈdɪp.ɪ.ti/',
    partOfSpeech: 'noun',
    definition: 'The occurrence of events by chance in a happy way.',
    example: 'A fortunate stroke of serendipity.',
    synonyms: ['luck', 'chance'],
  };

  it('includes word', () => {
    expect(formatDictionary(data)).toContain('serendipity');
  });
  it('includes phonetic', () => {
    expect(formatDictionary(data)).toContain('/ˌsɛr.ənˈdɪp.ɪ.ti/');
  });
  it('includes definition', () => {
    expect(formatDictionary(data)).toContain('The occurrence of events');
  });
  it('includes synonyms', () => {
    const s = formatDictionary(data);
    expect(s).toContain('luck');
    expect(s).toContain('chance');
  });
  it('handles missing optional fields', () => {
    const s = formatDictionary({ word: 'test', synonyms: [] });
    expect(s).toContain('test');
  });
});

describe('formatExchange', () => {
  const exchangeData = {
    base: 'USD',
    rates: { EUR: 0.92, GBP: 0.79, JPY: 149.5 },
    source: 'ExchangeRate-API',
    url: 'https://www.exchangerate-api.com/',
  };

  it('shows specific rate when currencyInfo provided', () => {
    const s = formatExchange(exchangeData, { from: 'USD', to: 'EUR' });
    expect(s).toContain('USD');
    expect(s).toContain('EUR');
    expect(s).toContain('0.92');
  });
  it('shows top rates when no currencyInfo', () => {
    const s = formatExchange(exchangeData, null);
    expect(s).toContain('EUR');
    expect(s).toContain('GBP');
  });
  it('handles unknown target currency', () => {
    const s = formatExchange(exchangeData, { from: 'USD', to: 'XYZ' });
    expect(s).toContain('not found');
  });
});

describe('formatNews', () => {
  const items = [
    { title: 'Headline One', description: 'Summary one.', link: 'https://example.com/1', pubDate: '2h ago', source: 'BBC', category: 'news' },
    { title: 'Headline Two', description: 'Summary two.', link: 'https://example.com/2', pubDate: '5h ago', source: 'HN', category: 'tech' },
  ];

  it('includes all titles', () => {
    const s = formatNews(items);
    expect(s).toContain('Headline One');
    expect(s).toContain('Headline Two');
  });
  it('includes source names', () => {
    const s = formatNews(items);
    expect(s).toContain('BBC');
    expect(s).toContain('HN');
  });
  it('shows query label when provided', () => {
    expect(formatNews(items, 'AI')).toContain('AI');
  });
  it('includes divider', () => {
    expect(formatNews(items)).toContain('---divider---');
  });
});

describe('plainText', () => {
  it('strips bold markers', () => {
    expect(plainText('**hello**')).toBe('hello');
  });
  it('strips markdown links', () => {
    expect(plainText('[Visit](https://x.com)')).toBe('Visit');
  });
  it('strips divider marker', () => {
    expect(plainText('before\n---divider---\nafter')).not.toContain('---divider---');
  });
  it('strips italic markers', () => {
    expect(plainText('_noun_')).toBe('noun');
  });
});
