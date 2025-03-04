import puppeteer, { Page } from "puppeteer";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const LOGIN_URL = "https://www.linkedin.com/login";
const EMAIL = process.env.LINKEDIN_EMAIL || "";
const PASSWORD = process.env.LINKEDIN_PASSWORD || "";
const SEARCH_QUERY = process.env.SEARCH_QUERY || "Google";

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: false,
            slowMo: 100,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
            ],
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        console.log("🔍 Opening LinkedIn Login Page...");
        await page.goto(LOGIN_URL, { waitUntil: "load", timeout: 120000 });

        // Wait for email input field
        await page.waitForSelector("#username", { timeout: 60000 });

        console.log("🔐 Logging in...");
        await page.type("#username", EMAIL, { delay: 100 });
        await page.type("#password", PASSWORD, { delay: 100 });

        await Promise.all([
            page.click("button[type='submit']"),
            page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 }),
        ]);

        console.log("✅ Logged in successfully!");

        // Check for additional verification
        if (await page.$("input[name='pin']")) {
            console.log("⚠️ LinkedIn requires additional verification. Enter the PIN manually and press Enter in the terminal...");
            await new Promise((resolve) => process.stdin.once("data", resolve));
        }

        // Wait for the search bar
        console.log("🔍 Waiting for the search bar...");
        await page.waitForSelector("input.search-global-typeahead__input", { timeout: 60000 });

        // Type the search query
        console.log("🔍 Typing search query:", SEARCH_QUERY);
        await page.type("input.search-global-typeahead__input", SEARCH_QUERY, { delay: 100 });

        // Press Enter to submit the search
        console.log("🔍 Pressing Enter...");
        await page.keyboard.press("Enter");

        // Wait for search results to load
        console.log("🔍 Waiting for search results...");
        await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 });

        // Scroll to load more posts
        console.log("📜 Scrolling to load more posts...");
        await autoScroll(page);

        // Extract posts
        console.log("📝 Extracting posts...");
        const posts = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("span[dir='ltr']"))
                .map((el) => el.textContent?.trim())
                .filter((text) => text && text.length > 20);
        });

        console.log(`✅ Extracted ${posts.length} posts.`);

        // Save posts to a file
        fs.writeFileSync("linkedin_posts.txt", posts.join("\n\n"));
        console.log("📄 Saved posts to `linkedin_posts.txt`");

        await browser.close();
        console.log("🚀 Done!");

    } catch (error) {
        console.error("❌ Error:", error);
    }
})();

async function autoScroll(page: Page) {
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 500;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 500);
        });
    });
}