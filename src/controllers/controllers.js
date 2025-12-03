import puppeteer from "puppeteer";

export async function getCandyList(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing ?url=" });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // Go to the page
    await page.goto(url, { waitUntil: "networkidle2" });

    // Wait extra time for JS to populate pair data
    await page.waitForTimeout(5000); // 5 seconds, adjust if needed

    // Get page content
    const html = await page.content();
    await browser.close();

    // Regex to extract "pairAddress"
    const PAIR_REGEX = /"pairAddress":"(.*?)"/g;
    let matches = [], match;
    while ((match = PAIR_REGEX.exec(html)) !== null) {
      matches.push(match[1]);
    }

    // Return first 10
    res.json({ count: matches.length, results: matches.slice(0, 10) });
  } catch (err) {
    console.error("Puppeteer Error:", err);
    res.status(500).json({ error: "Failed to fetch or parse page" });
  }
}
