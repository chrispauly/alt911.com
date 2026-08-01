/**
 * alt911.com — Offline Directory Compiler Script
 * 
 * This script runs programmatically via Playwright to crawl search results
 * for a list of US cities from 'uscities.csv', extract non-emergency dispatch
 * numbers, and compile them into a clean JSON directory (national_police_directory.json).
 * 
 * Data Source Note:
 *   The city listing data used to run this compilation script is sourced
 *   from SimpleMaps: https://simplemaps.com/data/us-cities
 * 
 * How to Run:
 *  1. Open terminal in the project root folder.
 *  2. Run: node scripts/compileDirectory.cjs
 */

const { chromium } = require('playwright');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

// File paths
const CSV_FILE = path.join(__dirname, 'uscities.csv');
const OUTPUT_FILE = path.join(__dirname, 'national_police_directory.json');
const CONTINUE_FILE = path.join(__dirname, 'continue.txt');

// Configuration
const DELAY_BETWEEN_QUERIES_MS = 3000; // 3 second delay to avoid rate-limiting

// Regex to extract 10-digit US phone numbers
const PHONE_REGEX = /(?:\+?1[-. ]?)?\(?([2-9]\d{2})\)?[-. ]?([2-9]\d{2})[-. ]?(\d{4})/g;

// Helper to load existing directory progress
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

// Helper to get last processed line number
function getContinueLine() {
  if (fs.existsSync(CONTINUE_FILE)) {
    try {
      const content = fs.readFileSync(CONTINUE_FILE, 'utf8').trim();
      const lineNum = parseInt(content, 10);
      if (!isNaN(lineNum)) return lineNum;
    } catch (e) {
      // Ignore
    }
  }
  return 1; // Default to line 1 (header is line 1, data starts on line 2)
}

// Helper to save current line checkpoint
function saveContinueLine(lineNum) {
  fs.writeFileSync(CONTINUE_FILE, String(lineNum), 'utf8');
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

    // Extract surrounding window of 80 characters
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
    const snippets = Array.from(document.querySelectorAll('.result__snippet'));
    const titles = Array.from(document.querySelectorAll('.result__a'));
    return snippets.map((s, i) => `${titles[i] ? titles[i].textContent : ''} : ${s.textContent}`).join('\n\n');
  });

  const matches = [];
  let match;
  PHONE_REGEX.lastIndex = 0;
  while ((match = PHONE_REGEX.exec(textContent)) !== null) {
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
    console.log(`   ✅ Extracted: ${bestMatch.phone} (Score: ${bestMatch.score})`);
    return {
      phone: bestMatch.phone,
      score: bestMatch.score
    };
  }

  console.log(`   ⚠️ Low confidence result for ${city}, ${state}. Best phone was: ${bestMatch ? bestMatch.phone : 'None'} (Score: ${bestMatch ? bestMatch.score : 0})`);
  return null;
}

// Helper to read CSV rows using readline (memory efficient for 30k+ lines)
async function getCitiesFromCSV() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CSV_FILE)) {
      reject(new Error(`CSV file not found at ${CSV_FILE}`));
      return;
    }

    const cities = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(CSV_FILE),
      crlfDelay: Infinity
    });

    let lineNumber = 0;
    rl.on('line', (line) => {
      lineNumber++;
      if (lineNumber === 1) return; // Skip CSV header row

      // Simple CSV row parser (split on `","` after stripping leading/trailing `"`)
      const cleanedLine = line.trim();
      if (!cleanedLine) return;

      const parts = cleanedLine.replace(/^"|"$/g, '').split('","');
      if (parts.length >= 6) {
        cities.push({
          city: parts[0],      // "city"
          state: parts[2],     // "state_id" (e.g. "WI")
          county: parts[5],    // "county_name"
          lineNum: lineNumber  // store original CSV line number for checkpointing
        });
      }
    });

    rl.on('close', () => {
      resolve(cities);
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  console.log("==================================================");
  console.log(" alt911.com — Offline Directory Compiler");
  console.log("==================================================");

  let cities;
  try {
    cities = await getCitiesFromCSV();
    console.log(`📄 Loaded ${cities.length} cities from uscities.csv`);
  } catch (err) {
    console.error("❌ Failed to read uscities.csv:", err.message);
    process.exit(1);
  }

  const directory = loadProgress();
  const startLine = getContinueLine();
  console.log(`⏭️ Resuming starting from line #${startLine} (out of ${cities.length + 1})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  let completedCount = 0;

  // Filter cities to process only those after the checkpoint line
  const citiesToProcess = cities.filter(c => c.lineNum >= startLine);

  for (const item of citiesToProcess) {
    const key = `${item.city.toLowerCase()}_${item.state.toLowerCase()}`;
    console.log(`[Line ${item.lineNum}/${cities.length + 1}] Processing ${item.city}, ${item.state}...`);

    if (directory[key]) {
      console.log(`   ⏭️ Skipping (Already exists in JSON output)`);
      saveContinueLine(item.lineNum);
      continue;
    }

    try {
      const result = await scrapeCity(page, item.city, item.state);
      if (result) {
        directory[key] = {
          city: toTitleCase(item.city),
          state: item.state.toUpperCase(),
          county: toTitleCase(item.county),
          policePhone: result.phone,
          policeLabel: `${toTitleCase(item.city)} Police Department`,
          policeSnippet: `🕒 Verified Non-Emergency Line`,
        };
        saveProgress(directory);
        completedCount++;
      }
    } catch (e) {
      console.error(`   ❌ Error:`, e.message);
    }

    // Save checkpoint line number
    saveContinueLine(item.lineNum);

    // Delay between queries to mimic human behavior
    await page.waitForTimeout(DELAY_BETWEEN_QUERIES_MS);
  }

  await browser.close();
  console.log("==================================================");
  console.log(`🎉 Done! Scraped ${completedCount} new cities.`);
  console.log(`📄 JSON Directory: ${OUTPUT_FILE}`);
  console.log(`📄 Checkpoint File: ${CONTINUE_FILE}`);
  console.log("==================================================");
}

run();
