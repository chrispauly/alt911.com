import https from 'node:https';
import querystring from 'node:querystring';
import zlib from 'node:zlib';
import { Buffer } from 'node:buffer';
import type { IncomingMessage } from 'node:http';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
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
          'Accept-Encoding': 'gzip, deflate, br',
          ...(isPost && postData ? { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) } : {}),
        },
      },
      (res: IncomingMessage) => {
        let stream: any = res;
        const encoding = res.headers['content-encoding'];
        if (encoding === 'gzip') stream = res.pipe(zlib.createGunzip());
        else if (encoding === 'deflate') stream = res.pipe(zlib.createInflate());
        else if (encoding === 'br') stream = res.pipe(zlib.createBrotliDecompress());

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
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/&#40;/g, '(')
    .replace(/&#41;/g, ')')
    .replace(/&#45;/g, '-')
    .replace(/&#8208;/g, '-')
    .replace(/&#8209;/g, '-')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/&minus;/g, '-')
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

interface PhoneCandidate {
  number: string;
  score: number;
  rawSnippet: string;
  structuredSnippet?: string;
  isCountyOrSheriff: boolean;
}

function parseCandidatesFromHTML(html: string, query: string): PhoneCandidate[] {
  const cleanText = decodeAndClean(html);
  const phoneRegex = /(?:\+?1[-. ]?)?\(?([2-9]\d{2})\)?[-. ]?([2-9]\d{2})[-. ]?(\d{4})/g;
  let match: RegExpExecArray | null;
  const candidates: PhoneCandidate[] = [];

  const queryWords = query.toLowerCase().split(/[\s,]+/).filter(w => w.length > 2 && w !== 'police' && w !== 'phone' && w !== 'number' && w !== 'non' && w !== 'emergency');

  while ((match = phoneRegex.exec(cleanText)) !== null) {
    const area = match[1];
    const prefix = match[2];
    const line = match[3];

    // Exclude toll-free area codes (800, 888, 877, 866, 855, 844, 833)
    if (['800', '888', '877', '866', '855', '844', '833'].includes(area)) continue;

    const formatted = `(${area}) ${prefix}-${line}`;
    const startIdx = Math.max(0, match.index - 350);
    const endIdx = Math.min(cleanText.length, match.index + 350);
    const rawSnippet = cleanSnippetText(cleanText.substring(startIdx, endIdx));

    let score = 10; // Baseline score for appearing in search results
    const lowerSnip = rawSnippet.toLowerCase();

    // Heavy penalty for social media / spam / lost pet posts
    if (
      lowerSnip.includes('lost dog') ||
      lowerSnip.includes('lost cat') ||
      lowerSnip.includes('scam') ||
      lowerSnip.includes('facebook.com/posts')
    ) {
      score -= 50;
    }

    if (lowerSnip.includes('non-emergency') || lowerSnip.includes('non emergency')) score += 30;
    if (lowerSnip.includes('dispatch')) score += 25;
    if (lowerSnip.includes('police')) score += 20;
    if (lowerSnip.includes('sheriff')) score += 20;
    if (lowerSnip.includes('department') || lowerSnip.includes('dept') || lowerSnip.includes('office') || lowerSnip.includes('station')) score += 15;
    if (lowerSnip.includes('business office') || lowerSnip.includes('administrative') || lowerSnip.includes('contact us')) score += 10;

    for (const word of queryWords) {
      if (lowerSnip.includes(word)) {
        score += 15;
      }
    }

    const isCountyOrSheriff = lowerSnip.includes('sheriff') || lowerSnip.includes('county') || lowerSnip.includes('dispatch center');
    const structuredSnippet = extractStructuredSnippet(rawSnippet, isCountyOrSheriff);

    candidates.push({
      number: formatted,
      score,
      rawSnippet,
      structuredSnippet,
      isCountyOrSheriff,
    });
  }

  return candidates;
}

export async function performLiveSearch(query: string): Promise<any> {
  const queryVariants = [
    query,
    query.replace(/police non emergency phone number/i, 'police department phone number'),
  ];

  for (const q of queryVariants) {
    let candidates: PhoneCandidate[] = [];

    // Engine 1: DDG HTML POST
    let html = await fetchURL('https://html.duckduckgo.com/html/', {
      method: 'POST',
      postData: querystring.stringify({ q: q, kl: 'us-en' }),
    });
    candidates = parseCandidatesFromHTML(html, q);

    // Engine 2: DDG Lite POST fallback
    if (candidates.length === 0) {
      html = await fetchURL('https://lite.duckduckgo.com/lite/', {
        method: 'POST',
        postData: querystring.stringify({ q: q, kl: 'us-en' }),
      });
      candidates = parseCandidatesFromHTML(html, q);
    }

    // Engine 3: Bing GET fallback
    if (candidates.length === 0) {
      html = await fetchURL(`https://www.bing.com/search?q=${encodeURIComponent(q)}`);
      candidates = parseCandidatesFromHTML(html, q);
    }

    // Engine 4: Google GET fallback
    if (candidates.length === 0) {
      html = await fetchURL(`https://www.google.com/search?q=${encodeURIComponent(q)}&gbv=1`);
      candidates = parseCandidatesFromHTML(html, q);
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
        queryUsed: q,
        confidence: primary.score >= 25 ? 'High' : 'Medium',
        source: 'Google / Web Search Info Box',
      };
    }
  }

  return {
    found: false,
    queryUsed: query,
    message: 'No verified phone number could be automatically parsed from search results.',
  };
}
