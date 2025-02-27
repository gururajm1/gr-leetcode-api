import puppeteer from "puppeteer";
import readline from "readline";
import Bottleneck from "bottleneck";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const limiter = new Bottleneck({
  minTime: 5000, 
  maxConcurrent: 1, 
});

const fetchData = limiter.wrap(async (searchTerm: string) => {
  console.log("Launching browser...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

  console.log(`Searching for: ${searchTerm}...`);

  try {
    await page.goto(
      `https://www.glassdoor.co.in/autocomplete/employers?term=${searchTerm}`,
      { waitUntil: "networkidle2" }
    );

    const content = await page.content();
    if (content.includes("Access Denied") || content.includes("protect Glassdoor")) {
      console.log("❌ Access Denied (403 Forbidden). Glassdoor may be blocking your request.");
      console.log("Try using a VPN or a different approach.");
      await browser.close();
      return [];
    }

    const response = await page.evaluate(() => {
      return JSON.parse(document.querySelector("pre")?.innerText || "[]");
    });

    await browser.close();
    return response;
  } catch (error) {
    console.error("❌ Error fetching data:", error);
    await browser.close();
    return [];
  }
});

const main = async () => {
  const searchTerm = await new Promise<string>((resolve) => {
    rl.question("Enter search term: ", resolve);
  });

  const companies = await fetchData(searchTerm);

  if (companies.length === 0) {
    console.log("❌ No companies found or access denied.");
  } else {
    console.log("\n✅ Found Companies:");
    companies.forEach((company: any, index: number) => {
      console.log(`${index + 1}. ${company.label} (ID: ${company.id})`);
    });
  }
  rl.close();
};

main();