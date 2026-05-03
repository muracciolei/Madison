// ==================== FORMATTERS ====================

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Safe HTML formatter: escapes first, then applies controlled markdown-like transforms.
export function formatText(text) {
  let s = escapeHtml(text);
  // Divider
  s = s.replace(/---divider---/g, '<hr style="border:none;border-top:1px solid var(--border);margin:12px 0">');
  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Markdown links — only allow http/https URLs
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // Bare URLs
  s = s.replace(/(https?:\/\/[^\s<>"&]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  // Newlines
  s = s.replace(/\n/g, '<br>');
  return s;
}

export function formatWeather(data) {
  const { location, temperature, condition, humidity, wind, high, low } = data;
  return (
    `**${location}**\n\n` +
    `Temperature: **${temperature}°C** (High ${high}° / Low ${low}°)\n\n` +
    `Condition: ${condition}\n\n` +
    `Humidity: ${humidity}%  •  Wind: ${wind} km/h`
  );
}

export function formatWikipedia(data) {
  let s = '';
  if (data.title) s += `**${data.title}**\n\n`;
  s += data.extract ?? 'No extract available.';
  return s;
}

export function formatNASAApod(data) {
  return (
    `**${data.title}** (${data.date})\n\n` +
    `${data.explanation}\n\n` +
    `[View Image](${data.imageUrl})`
  );
}

export function formatDictionary(data) {
  let s = `**${data.word}**`;
  if (data.phonetic) s += `  ${data.phonetic}`;
  s += '\n\n';
  if (data.partOfSpeech) s += `_${data.partOfSpeech}_\n\n`;
  if (data.definition) s += `Definition: ${data.definition}\n\n`;
  if (data.example) s += `Example: "${data.example}"\n\n`;
  if (data.synonyms?.length) s += `Synonyms: ${data.synonyms.join(', ')}`;
  return s.trim();
}

export function formatExchange(exchangeData, currencyInfo) {
  if (currencyInfo) {
    const { from = 'USD', to, amount = 1 } = currencyInfo;
    const baseRate = exchangeData.rates[from] ? exchangeData.rates[to] / exchangeData.rates[from] : exchangeData.rates[to];
    if (!baseRate) return `Exchange rate for ${to} not found.`;
    const converted = (amount * baseRate).toFixed(4);
    return (
      `**${amount} ${from} = ${converted} ${to}**\n\n` +
      `Rate: 1 ${from} = ${baseRate.toFixed(6)} ${to}\n\n` +
      `Source: ${exchangeData.source}`
    );
  }
  const popular = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
  const lines = popular
    .filter(code => exchangeData.rates[code])
    .map(code => `1 USD = ${exchangeData.rates[code]} ${code}`)
    .join('\n');
  return `**Exchange rates (base USD)**\n\n${lines}\n\nSource: ${exchangeData.source}`;
}

export function formatNews(items, query = null) {
  let s = query ? `**News matching "${query}"**\n\n` : '**Latest News**\n\n';
  s += '---divider---\n\n';
  items.forEach((item, i) => {
    s += `${i + 1}. **${item.title}**\n`;
    if (item.description) s += `   ${item.description.substring(0, 150)}...\n`;
    if (item.link) s += `   [Read more](${item.link})\n`;
    s += `   _${item.source} · ${item.pubDate}_\n\n`;
  });
  return s.trim();
}

export function plainText(formattedText) {
  return formattedText
    .replace(/\*\*/g, '')
    .replace(/---divider---/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .trim();
}
