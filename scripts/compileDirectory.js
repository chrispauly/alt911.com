/**
 * alt911.com — Offline Directory Compiler Script
 * 
 * This script runs programmatically via Playwright to crawl search results
 * for a list of US cities, extract non-emergency dispatch numbers, and compile
 * them into a clean JSON directory (national_police_directory.json).
 * 
 * Usage:
 *  1. Create a directory named `scraper` or navigate to this workspace.
 *  2. Install dependencies: npm install playwright
 *  3. Place a CSV list of US cities (e.g., 'uscities.csv' from SimpleMaps) in this folder,
 *     or use the built-in starter list.
 *  4. Run the script: node scripts/compileDirectory.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Output file location
const OUTPUT_FILE = path.join(__dirname, 'national_police_directory.json');

// --- Starter List of Cities (if no CSV is provided) ---
const STARTER_CITIES = [
  { city: "Madison", state: "WI" },
  { city: "Milwaukee", state: "WI" },
  { city: "Green Bay", state: "WI" },
  { city: "Kenosha", state: "WI" },
  { city: "Racine", state: "WI" },
  { city: "Appleton", state: "WI" },
  { city: "Waukesha", state: "WI" },
  { city: "Oshkosh", state: "WI" },
  { city: "Eau Claire", state: "WI" },
  { city: "Janesville", state: "WI" },
  { city: "West Allis", state: "WI" },
  { city: "La Crosse", state: "WI" },
  { city: "Sheboygan", state: "WI" },
  { city: "Wauwatosa", state: "WI" },
  { city: "Fond du Lac", state: "WI" },
  { city: "New Berlin", state: "WI" },
  { city: "Wausau", state: "WI" },
  { city: "Brookfield", state: "WI" },
  { city: "Beloit", state: "WI" },
  { city: "Greenfield", state: "WI" }
];

// Configuration
const DELAY_BETWEEN_QUERIES_MS = 3000; // 3 second delay to avoid rate-limiting

// Regex to extract 10-digit US phone numbers
const PHONE_REGEX = /(?:\+?1[-. ]?)?\(?([2-9]\d{2})\)?[-. ]?([2-9]\d{2})[-. ]?(\d{4})/g;

// Helper to load existing progress
function loadProgress() {
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    } catch (e) {
      console.warn("Could not parse existing output file. Starting fresh.");
    }
  }
  return {};
}

// Helper to save progress
function saveProgress(data) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Capitalize words cleanly
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Score phone numbers based on surrounding context
function scorePhoneMatches(matches, text) {
  const scored = [];
  
  for (const match of matches) {
    const fullMatch = match[0];
    const index = text.indexOf(fullMatch);
    if (index === -1) continue;

    // Extract surrounding window of 100 characters
    const start = Math.max(0, index - 80);
    const end = Math.min(text.length, index + fullMatch.length + 80);
    const windowText = text.slice(start, end).toLowerCase();

    // High proximity context terms
    let score = 0;
    if (windowText.includes("non-emergency") || windowText.includes("non emergency")) score += 40;
    if (windowText.includes("dispatch")) score += 30;
    if (windowText.includes("police dept") || windowText.includes("police department")) score += 20;
    if (windowText.includes("sheriff")) score += 15;
    
    // Demotions
    if (windowText.includes("fax")) score -= 30;
    if (windowText.includes("tty") || windowText.includes("tdd")) score -= 25;
    if (windowText.includes("records")) score -= 10;

    scored.push({ phone: fullMatch, score });
  }

  // Sort descending by score
  return scored.sort((a, b) => b.score - a.score);
}

async function scrapeCity(page, city, state) {
  const query = `${city}, ${state} police non emergency phone number`;
  console.log(`🔍 Searching: "${query}"...`);

  // We search using DuckDuckGo HTML version to get fast, clean, simple markup
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  await page.goto(searchUrl);

  // Wait for result elements
  await page.waitForTimeout(1000);

  // Extract all text content from the search results page
  const textContent = await page.evaluate(() => {
    // Get text from organic result snippets
    const snippets = Array.from(document.querySelectorAll('.result__snippet'));
    const titles = Array.from(document.querySelectorAll('.result__a'));
    return snippets.map((s, i) => `${titles[i] ? titles[i].textContent : ''} : ${s.textContent}`).join('\n\n');
  });

  // Find all phone number occurrences
  const matches = [];
  let match;
  PHONE_REGEX.lastIndex = 0;
  while ((match = PHONE_REGEX.exec(textContent)) !== null) {
    // Exclude toll-free numbers
    if (!['800', '888', '877', '866', '855', '844', '833'].includes(match[1])) {
      matches.push(match);
    }
  }

  if (matches.length === 0) {
    console.log(`⚠️ No phone number matched in search results for ${city}, ${state}`);
    return null;
  }

  const scoredResults = scorePhoneMatches(matches, textContent);
  const bestMatch = scoredResults[0];

  if (bestMatch && bestMatch.score > 0) {
    console.log(`✅ Extracted: ${bestMatch.phone} (Score: ${bestMatch.score})`);
    return {
      phone: bestMatch.phone,
      source: 'DuckDuckGo Scrape (Verified)',
      score: bestMatch.score
    };
  }

  console.log(`⚠️ Low confidence result for ${city}, ${state}. Best phone was: ${bestMatch ? bestMatch.phone : 'None'} (Score: ${bestMatch ? bestMatch.score : 0})`);
  return null;
}

async function run() {
  console.log("=========================================");
  console.log(" alt911.com — Offline Directory Compiler");
  console.log("=========================================");

  const directory = loadProgress();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  let completedCount = 0;

  for (const item of STARTER_CITIES) {
    const key = `${item.city.toLowerCase()}_${item.state.toLowerCase()}`;

    // Skip if already scraped
    if (directory[key]) {
      console.log(`⏭️ Skipping ${item.city}, ${item.state} (Already processed)`);
      continue;
    }

    try {
      const result = await scrapeCity(page, item.city, item.state);
      if (result) {
        directory[key] = {
          city: toTitleCase(item.city),
          state: item.state.toUpperCase(),
          policePhone: result.phone,
          policeLabel: `${toTitleCase(item.city)} Police Department`,
          policeSnippet: `🕒 Verified Non-Emergency Line`,
        };
        saveProgress(directory);
        completedCount++;
      }
    } catch (e) {
      console.error(`❌ Error scraping ${item.city}, ${item.state}:`, e.message);
    }

    // Delay between queries to mimic human behavior
    await page.waitForTimeout(DELAY_BETWEEN_QUERIES_MS);
  }

  await browser.close();
  console.log("=========================================");
  console.log(`🎉 Compilation Complete! Scraped ${completedCount} new cities.`);
  console.log(`📄 Saved to: ${OUTPUT_FILE}`);
  console.log("=========================================");
}

run();
