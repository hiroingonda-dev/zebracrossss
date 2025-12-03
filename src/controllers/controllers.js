import puppeteer from "puppeteer-core";
import chromium from "chromium";

export async function getCandyList(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing ?url=" });

    const browser = await puppeteer.launch({
      executablePath: chromium.path,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
        "--no-zygote"
      ]
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // get ALL <script> contents
    const scripts = await page.$$eval("script", els => els.map(e => e.innerText));

    await browser.close();

    let foundPairs = [];

    for (const script of scripts) {
      if (!script) continue;

      // Must contain pairAddress to be DexScreener data
      if (script.includes("pairAddress")) {
        try {
          // Extract JSON safely
          const jsonStart = script.indexOf("{");
          const jsonEnd = script.lastIndexOf("}");
          const jsonString = script.slice(jsonStart, jsonEnd + 1);

          const data = JSON.parse(jsonString);

          // Search recursively for pairs
          const pairs = extractPairs(data);
          if (pairs.length > 0) {
            foundPairs = pairs;
            break;
          }
        } catch (e) {}
      }
    }

    if (foundPairs.length === 0) {
      return res.json({ error: "DexScreener JSON not found", pairs: [] });
    }

    res.json({
      count: foundPairs.length,
      results: foundPairs
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Scraping failed" });
  }
}

// recursively search for array of objects containing pairAddress
function extractPairs(obj) {
  let pairs = [];

  if (Array.isArray(obj)) {
    for (const item of obj) {
      pairs = pairs.concat(extractPairs(item));
    }
    return pairs;
  }

  if (obj && typeof obj === "object") {
    // a valid pair object
    if (obj.pairAddress) return [obj];

    for (const key of Object.keys(obj)) {
      pairs = pairs.concat(extractPairs(obj[key]));
    }
  }

  return pairs;
}
