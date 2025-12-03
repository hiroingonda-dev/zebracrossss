import puppeteer from "puppeteer-core";
import chromium from "chromium";

export async function getCandyList(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Missing ?url=" });
    }

    const browser = await puppeteer.launch({
      executablePath: chromium.path,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-dev-tools",
        "--no-zygote",
        "--no-first-run",
        "--single-process"
      ]
    });

    const page = await browser.newPage();

    // Set mobile headers (DexScreener behaves better)
    await page.setUserAgent(
      "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36"
    );

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // Wait for React to load first rows
    await page.waitForSelector("a[href*='pair']", { timeout: 20000 });

    // Auto-scroll to load ALL lazy-loaded rows
    await autoScroll(page);

    // Extract DOM data from links containing /pair/
    const pairs = await page.$$eval("a[href*='/pair/']", els =>
      els
        .map(e => e.getAttribute("href"))
        .filter(x => x && x.includes("/pair/"))
        .map(x => x.split("/").pop())
    );

    await browser.close();

    return res.json({
      count: pairs.length,
      results: Array.from(new Set(pairs)) // dedupe
    });

  } catch (err) {
    console.error("SCRAPER ERROR:", err);
    return res.status(500).json({ error: "Scraping failed" });
  }
}

// Smooth auto-scrolling to load lazy content
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let total = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        total += distance;

        if (total >= scrollHeight * 1.2) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}
