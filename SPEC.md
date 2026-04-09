# OSCAR - OpenData Voice Chat

## Project Overview

**Project Name:** OSCAR (OpenData Voice Chat)
**Type:** Frontend-only conversational search engine
**Core Functionality:** A voice-enabled chatbot that retrieves real information from RSS feeds, public APIs, and Wikipedia, then displays and optionally reads answers aloud using speech synthesis.
**Target Users:** Anyone needing quick, voice-accessible answers from public data sources

---

## UI/UX Specification

### Layout Structure

**Page Sections:**
- Header: Logo/title, theme toggle, minimal branding
- Main Area: Chat interface (messages + input)
- Footer: Minimal - source status indicator

**Responsive Breakpoints:**
- Mobile: < 640px (single column, full-width)
- Tablet: 640px - 1024px (centered container, 90% width)
- Desktop: > 1024px (max-width: 800px, centered)

### Visual Design

**Color Palette:**

*Light Mode:*
- Background: `#FAFAFA`
- Surface: `#FFFFFF`
- Primary Text: `#1A1A1A`
- Secondary Text: `#6B7280`
- Accent: `#3B82F6` (blue)
- User Bubble: `#3B82F6`
- Bot Bubble: `#F3F4F6`
- Border: `#E5E7EB`
- Error: `#EF4444`
- Success: `#10B981`

*Dark Mode:*
- Background: `#0D0D0D`
- Surface: `#1A1A1A`
- Primary Text: `#F5F5F5`
- Secondary Text: `#9CA3AF`
- Accent: `#60A5FA`
- User Bubble: `#3B82F6`
- Bot Bubble: `#262626`
- Border: `#374151`
- Error: `#F87171`
- Success: `#34D399`

**Typography:**
- Font Family: `'DM Sans', sans-serif` (headings), `'IBM Plex Sans', sans-serif` (body)
- Base Size: 16px
- Heading (h1): 28px, weight 700
- Heading (h2): 20px, weight 600
- Body: 15px, weight 400
- Small/Caption: 13px, weight 400
- Line Height: 1.6

**Spacing System:**
- Base unit: 4px
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px
- Chat message gap: 12px
- Container padding: 20px

**Visual Effects:**
- Border radius: 12px (containers), 20px (bubbles), 50% (buttons)
- Box shadow (light): `0 2px 8px rgba(0,0,0,0.06)`
- Box shadow (dark): `0 2px 8px rgba(0,0,0,0.3)`
- Transitions: 200ms ease-out
- Micro-interactions: Scale on hover (1.02), opacity changes

### Components

**1. Header**
- Logo: "OSCAR" text with wave icon (SVG)
- Theme toggle: Sun/Moon icon button
- Minimal height: 60px

**2. Chat Messages Area**
- Scrollable container
- Auto-scroll to bottom on new message
- Message bubbles with:
  - Avatar (user/bot)
  - Text content
  - Source label
  - Timestamp (optional)
- Loading state: Pulsing dots animation

**3. Input Area**
- Fixed at bottom
- Text input field (expandable)
- Send button (arrow icon)
- Microphone button (voice input)
- Voice toggle button (speaker icon)
- Clear chat button (trash icon)

**4. Buttons**
- States: Default, Hover (scale + brightness), Active (scale down), Disabled (opacity 0.5)
- Icon buttons: 44px touch target
- Send button: Primary accent color

**5. Source Tags**
- Small pill badges showing data source
- Colors: Wikipedia (gray), RSS (orange), API (green)

---

## Functionality Specification

### Core Features

**1. Query Input**
- Text input with Enter to send
- Voice input via Web Speech API
- Clear input after sending

**2. Intent Detection / Smart Routing**
Patterns to detect:
- `weather in <location>` → Weather API
- `define/explain/what is <term>` → Wikipedia
- `latest news` → RSS feeds
- `space/astronomy/nasa` → NASA API
- `convert <amount> <from> to <to>` → Exchange API
- `population of <country>` → Wikipedia
- `definition of <word>` → Dictionary API

**3. Data Sources**

*Wikipedia API:*
- Endpoint: `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`
- Fallback: `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles={title}&format=json&origin=*`

*RSS Feeds (predefined list):*
- BBC News: `https://feeds.bbci.co.uk/news/rss.xml`
- NASA: `https://www.nasa.gov/rss/dyn/breaking_news.rss`
- Science Daily: `https://www.sciencedaily.com/rss/all.xml`
- Hacker News: `https://news.ycombinator.com/rss`
- Reuters: `https://www.reutersagency.com/feed/`

*Public APIs:*
- Open-Meteo (Weather): `https://api.open-meteo.com/v1/forecast`
- NASA APOD: `https://api.nasa.gov/planetary/apod`
- Exchange Rate: `https://api.exchangerate-api.com/v4/latest/USD`
- Dictionary: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`

**4. Response Display**
- Render markdown-like formatting
- Show source badge
- Display link to source (clickable)
- Timestamp for each message

**5. Text-to-Speech Output**
- Use Web Speech API (SpeechSynthesis)
- Auto-speak option (toggle)
- Speed control: 0.5x, 1x, 1.5x, 2x
- Stop/pause controls

**6. Theme Switching**
- Toggle between light/dark
- Persist preference in localStorage
- System preference detection on first load

### User Interactions

1. Type query → Press Enter or click Send
2. Click microphone → Speak → Automatic transcription
3. Click speaker icon → Toggle auto-speech
4. Click theme toggle → Switch light/dark
5. Click clear → Clear chat history

### Edge Cases

- Empty query: Show prompt message
- Network error: Show "Unable to fetch. Try again."
- No results: Show "No results found. Try different keywords."
- API timeout: Show error, suggest retry
- Voice not supported: Hide voice button, show tooltip

---

## Acceptance Criteria

1. ✅ Page loads without errors
2. ✅ Theme toggle switches between light/dark
3. ✅ User can type and send messages
4. ✅ Bot responds with relevant data from at least 3 source types
5. ✅ Voice input works (on supported browsers)
6. ✅ Voice output works (speaks responses)
7. ✅ RSS feeds parse and display correctly
8. ✅ Wikipedia queries return summaries
9. ✅ Weather queries show current weather
10. ✅ Responsive design works on mobile/desktop
11. ✅ Error states display gracefully
12. ✅ Chat clears properly
13. ✅ No backend required - runs entirely in browser