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

// Score and classify phone numbers into Police vs. County Sheriff lines
function extractAndClassifyPhones(matches, text) {
  const scored = [];
  
  for (const match of matches) {
    const fullMatch = match[0];
    const index = text.indexOf(fullMatch);
    if (index === -1) continue;

    // Extract surrounding window of 80 characters
    const start = Math.max(0, index - 80);
    const end = Math.min(text.length, index + fullMatch.length + 80);
    const windowText = text.slice(start, end).toLowerCase();

    let policeScore = 0;
    let countyScore = 0;

    // Evaluate police score
    if (windowText.includes("police dept") || windowText.includes("police department") || windowText.includes("city police")) policeScore += 40;
    if (windowText.includes("non-emergency") || windowText.includes("non emergency")) policeScore += 20;

    // Evaluate county/sheriff score
    if (windowText.includes("sheriff") || windowText.includes("county dispatch") || windowText.includes("county sheriff")) countyScore += 40;
    if (windowText.includes("dispatch")) countyScore += 20;

    // General score
    let baseScore = 0;
    if (windowText.includes("non-emergency") || windowText.includes("non emergency")) baseScore += 20;
    if (windowText.includes("fax")) baseScore -= 40;
    if (windowText.includes("tty") || windowText.includes("tdd")) baseScore -= 30;

    scored.push({
      phone: fullMatch,
      policeScore: policeScore + baseScore,
      countyScore: countyScore + baseScore,
      totalScore: Math.max(policeScore, countyScore) + baseScore
    });
  }

  // Find best police line
  const policeCandidates = scored.filter(s => s.policeScore > s.countyScore || s.policeScore > 10).sort((a, b) => b.policeScore - a.policeScore);
  const bestPolice = policeCandidates[0] ? policeCandidates[0].phone : null;

  // Find best county/sheriff line (must be different from police line)
  const countyCandidates = scored.filter(s => s.phone !== bestPolice && (s.countyScore > s.policeScore || s.countyScore > 10)).sort((a, b) => b.countyScore - a.countyScore);
  const bestCounty = countyCandidates[0] ? countyCandidates[0].phone : null;

  let finalPolice = bestPolice;
  let finalCounty = bestCounty;

  if (!finalPolice && scored.length > 0) {
    const bestOverall = scored.sort((a, b) => b.totalScore - a.totalScore)[0];
    if (bestOverall.countyScore > bestOverall.policeScore) {
      finalCounty = bestOverall.phone;
    } else {
      finalPolice = bestOverall.phone;
    }
  }

  return {
    policePhone: finalPolice,
    countyPhone: finalCounty
  };
}

async function scrapeCity(page, city, state) {
  const query = `${city}, ${state} police non emergency phone number`;
  console.log(`🔍 Searching: "${query}"...`);

  const searchUrl = `https://search.yahoo.com/search?q=${encodeURIComponent(query)}`;
  await page.goto(searchUrl);

  // Wait for Yahoo results to render
  await page.waitForTimeout(3000);

  // Extract all text content from the body of the search page
  const textContent = await page.textContent('body') || '';

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

  const result = extractAndClassifyPhones(matches, textContent);
  if (result.policePhone) {
    console.log(`   ✅ Police: ${result.policePhone}${result.countyPhone ? ` | County: ${result.countyPhone}` : ''}`);
  } else if (result.countyPhone) {
    console.log(`   ✅ County: ${result.countyPhone}`);
  } else {
    console.log(`   ⚠️ Low confidence result for ${city}, ${state}`);
  }
  return result;
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
      if (result && (result.policePhone || result.countyPhone)) {
        directory[key] = {
          city: toTitleCase(item.city),
          state: item.state.toUpperCase(),
          county: toTitleCase(item.county),
          policePhone: result.policePhone || undefined,
          policeLabel: result.policePhone ? `${toTitleCase(item.city)} Police Department` : undefined,
          policeSnippet: result.policePhone ? `🕒 Verified Non-Emergency Line` : undefined,
          countyPhone: result.countyPhone || undefined,
          countyLabel: result.countyPhone ? `${toTitleCase(item.county)} Sheriff & Dispatch` : undefined,
          countySnippet: result.countyPhone ? `🕒 24/7 County Dispatch Line` : undefined,
        };
        // Clean undefined properties so they don't bloat the JSON
        Object.keys(directory[key]).forEach(k => directory[key][k] === undefined && delete directory[key][k]);
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
