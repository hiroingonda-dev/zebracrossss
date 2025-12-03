import { MAIN_URL } from "../constants/url.js";

 export async function getCandyList(req,res){

// Example pattern: "pairAddress":"4V1Q7GcZ4hhTQ5sVVfKMtJpafoY2XyrAFyK3KU5hzkEZ"
const PAIR_REGEX = /"pairAddress":"(.*?)"/g;

 try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "Missing ?url=" });
    }

    // Fetch webpage HTML
    const response = await fetch(url);
    const html = await response.text();

    // Find all pair addresses
    let matches = [];
    let match;

    while ((match = PAIR_REGEX.exec(html)) !== null) {
      matches.push(match[1]); // Only the address inside quotes
    }

    // Return first 10 results
    const limited = matches.slice(0, 10);

    return res.json({
      count: limited.length,
      results: limited
    });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Failed to fetch or parse page" });
  }
    
}