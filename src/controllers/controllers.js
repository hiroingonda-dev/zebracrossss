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

    // Get raw HTML
    const html = await page.content();
    await browser.close();

    // Extract the SSR JSON (window.__SERVER_DATA)
    const ssrMatch = html.match(/window\.__SERVER_DATA\s*=\s*(\{.*?\});/s);

    if (!ssrMatch) {
      return res.json({ error: "SSR data not found", pairs: [] });
    }

    const ssrJson = JSON.parse(ssrMatch[1]);

    // Path to data
    const pairs =
      ssrJson.route?.data?.dexScreenerData?.pairs || [];

    // Extract pairAddress
    const results = pairs.map(p => p.pairAddress);

    res.json({
      count: results.length,
      results: results.slice(0, 20)
    });

  } catch (err) {
    console.error("SSR Error:", err);
    res.status(500).json({ error: "Failed to parse SSR data" });
  }
}
