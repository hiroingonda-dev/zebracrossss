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
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
        "--no-zygote"
      ],
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // ❌ Not supported: await page.waitForTimeout(5000)
    // ✅ Use this instead:
    await new Promise(resolve => setTimeout(resolve, 5000));

    const html = await page.content();

    await browser.close();

    const PAIR_REGEX = /"pairAddress":"(.*?)"/g;

    const matches = [];
    let m;

    while ((m = PAIR_REGEX.exec(html)) !== null) {
      matches.push(m[1]);
    }

    res.json({
      count: matches.length,
      results: matches.slice(0, 10),
    });
  } catch (err) {
    console.error("Puppeteer Error:", err);
    res.status(500).json({ error: "Failed to fetch or parse page" });
  }
}
