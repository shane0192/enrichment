import express from "express";
import bodyParser from "body-parser";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post("/lookup", async (req, res) => {
  const { first_name, last_name, domain } = req.body;
  const fullName = `${first_name} ${last_name}`;
  const query = `${fullName} site:linkedin.com/in ${domain}`;

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium'
    });
    const page = await browser.newPage();

    // Step 1: Google search to find LinkedIn profile
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
      waitUntil: "networkidle2"
    });

    const firstLink = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll("a"));
      const linkedin = anchors.find(a => a.href.includes("linkedin.com/in"));
      return linkedin ? linkedin.href : null;
    });

    if (!firstLink) {
      await browser.close();
      return res.status(404).json({ error: "No LinkedIn profile found." });
    }

    // Step 2: Visit LinkedIn profile and scrape data
    await page.goto(firstLink, { waitUntil: "networkidle2" });

    const getText = async (selector) => {
      try {
        return await page.$eval(selector, el => el.innerText.trim());
      } catch {
        return null;
      }
    };

    const enrichment = {
      full_name: await getText(".text-heading-xlarge"),
      headline: await getText(".text-body-medium.break-words"),
      location: await getText(".text-body-small.inline.t-black--light.break-words"),
      bio_summary: await getText(".pv-about-section > p"),
      linkedin_url: firstLink
    };

    await browser.close();
    res.json(enrichment);
  } catch (err) {
    console.error("Scraping error:", err);
    res.status(500).json({ error: "Enrichment failed." });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});