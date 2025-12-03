import { MAIN_URL } from "../constants/url.js";
import puppeteer from "puppeteer";

export async function getCandyList(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing ?url=" });

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const html = await page.content();
    await browser.close();

    const PAIR_REGEX = /"pairAddress":"(.*?)"/g;
    let matches = [], match;
    while ((match = PAIR_REGEX.exec(html)) !== null) matches.push(match[1]);

    res.json({ count: matches.length, results: matches.slice(0, 10) });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch or parse page" });
  }
}

    
}
