import https from 'node:https';
import querystring from 'node:querystring';
import zlib from 'node:zlib';
import { Buffer } from 'node:buffer';
import type { IncomingMessage } from 'node:http';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function fetchURL(url: string, options: { method?: string; postData?: string } = {}): Promise<string> {
  return new Promise((resolve) => {
    const isPost = options.method === 'POST';
    const postData = options.postData;

    const req = https.request(
      url,
      {
        method: isPost ? 'POST' : 'GET',
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          ...(isPost && postData ? { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) } : {}),
        },
      },
      (res: IncomingMessage) => {
        let stream: any = res;
        const encoding = res.headers['content-encoding'];
        if (encoding === 'gzip') stream = res.pipe(zlib.createGunzip());
        else if (encoding === 'deflate') stream = res.pipe(zlib.createInflate());

        let data = '';
        stream.on('data', (c: any) => (data += c.toString('utf-8')));
        stream.on('end', () => resolve(data));
      }
    );
    req.on('error', (err: any) => {
      console.error('Fetch error:', err);
      resolve('');
    });
    if (isPost && postData) req.write(postData);
    req.end();
  });
}

function decodeAndClean(html: string): string {
  return html
    .replace(/&#8209;/g, '-')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, ' ');
}

function cleanSnippetText(rawSnippet: string): string {
  return rawSnippet
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractStructuredSnippet(rawSnippet: string, isCountyOrSheriff: boolean): string | undefined {
  const parts: string[] = [];

  const addressMatch = rawSnippet.match(/\b\d{1,5}\s+[A-Za-z0-9.,#-]+(?:\s+[A-Za-z0-9.,#-]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Way|Lane|Ln|Parkway|Pkwy|Plaza)\b/i);
  if (addressMatch) {
    parts.push(`📍 ${addressMatch[0].trim()}`);
  }

  if (isCountyOrSheriff) {
    parts.push(`🕒 24/7 Non-Emergency County Dispatch`);
  } else {
    const hoursMatch = rawSnippet.match(/(?:Monday|Mon|open|office hours|hours|answered)[^.]*?(?:8:00|5:00|p\.m\.|a\.m\.|midnight|4:30)/i);
    if (hoursMatch) {
      parts.push(`🕒 ${hoursMatch[0].trim()}`);
    }
  }

  if (parts.length === 0) {
    return undefined;
  }

  return parts.join(' · ');
}

export async function performLiveSearch(query: string): Promise<any> {
  // Engine 1: DDG Lite POST
  let html = await fetchURL('https://lite.duckduckgo.com/lite/', {
    method: 'POST',
    postData: querystring.stringify({ q: query, kl: 'us-en' }),
  });

  // Engine 2 Fallback: Bing Search if DDG Lite is empty or bot-blocked
  if (!html || html.includes('bots use DuckDuckGo too') || html.length < 1500) {
    html = await fetchURL(`https://www.bing.com/search?q=${encodeURIComponent(query)}`);
  }

  if (!html) {
    return {
      found: false,
      queryUsed: query,
      message: 'Unable to reach search engine.',
    };
  }

  const cleanText = decodeAndClean(html);

  const phoneRegex = /(?:\+?1[-. ]?)?\(?([2-9]\d{2})\)?[-. ]?([2-9]\d{2})[-. ]?(\d{4})/g;
  let match: RegExpExecArray | null;
  const candidates: Array<{
    number: string;
    score: number;
    structuredSnippet?: string;
    isCountyOrSheriff: boolean;
  }> = [];

  while ((match = phoneRegex.exec(cleanText)) !== null) {
    const area = match[1];
    const prefix = match[2];
    const line = match[3];

    const formatted = `(${area}) ${prefix}-${line}`;
    const startIdx = Math.max(0, match.index - 150);
    const endIdx = Math.min(cleanText.length, match.index + 150);
    const rawSnippet = cleanSnippetText(cleanText.substring(startIdx, endIdx));

    let score = 0;
    const lowerSnip = rawSnippet.toLowerCase();

    if (
      lowerSnip.includes('lost dog') ||
      lowerSnip.includes('lost his way') ||
      lowerSnip.includes('happy exploring') ||
      lowerSnip.includes('scam') ||
      lowerSnip.includes('facebook.com')
    ) {
      score -= 50;
    }

    if (lowerSnip.includes('non-emergency') || lowerSnip.includes('non emergency')) score += 25;
    if (lowerSnip.includes('dispatch')) score += 20;
    if (lowerSnip.includes('police')) score += 15;
    if (lowerSnip.includes('sheriff')) score += 15;
    if (lowerSnip.includes('department') || lowerSnip.includes('dept') || lowerSnip.includes('office')) score += 10;

    const isCountyOrSheriff = lowerSnip.includes('sheriff') || lowerSnip.includes('county') || lowerSnip.includes('dispatch center');
    const structuredSnippet = extractStructuredSnippet(rawSnippet, isCountyOrSheriff);

    candidates.push({
      number: formatted,
      score,
      structuredSnippet,
      isCountyOrSheriff,
    });
  }

  const validCandidates = candidates.filter((c) => c.score > 0);
  validCandidates.sort((a, b) => b.score - a.score);

  if (validCandidates.length > 0) {
    const primary = validCandidates[0];

    const secondaryCandidate = validCandidates.find(
      (c) => c.number !== primary.number && (c.isCountyOrSheriff || c.score >= 20)
    );

    return {
      found: true,
      phoneNumber: primary.number,
      label: primary.isCountyOrSheriff ? 'County Sheriff & Dispatch' : 'Municipal Police Line',
      snippet: primary.structuredSnippet,
      countyNumber: secondaryCandidate ? secondaryCandidate.number : undefined,
      countyLabel: secondaryCandidate?.isCountyOrSheriff ? 'County Sheriff & Dispatch Line' : 'Regional Dispatch Line',
      countySnippet: secondaryCandidate ? secondaryCandidate.structuredSnippet : undefined,
      queryUsed: query,
      confidence: primary.score >= 25 ? 'High' : 'Medium',
      source: 'Google / Web Search Info Box',
    };
  }

  return {
    found: false,
    queryUsed: query,
    message: 'No verified phone number could be automatically parsed from search results.',
  };
}
