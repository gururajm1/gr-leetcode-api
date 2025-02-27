import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { RateLimiter } from "limiter";

puppeteer.use(StealthPlugin());

const limiter = new RateLimiter({ tokensPerInterval: 1, interval: 1000 });

async function fetchCompanyArticles(companyName: string) {
    try {
        await limiter.removeTokens(1);

        const browser = await puppeteer.launch({
            headless: true, 
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );

        const GFG_TAG_URL = `https://www.geeksforgeeks.org/tag/${companyName}/`;
        console.log(`Navigating to GeeksforGeeks tag page for ${companyName}...`);
        await page.goto(GFG_TAG_URL, { waitUntil: "networkidle2" }); 

        await new Promise((resolve) => setTimeout(resolve, 3000));

        const articles = await page.evaluate(() => {
            const articlesData: { heading: string; link: string }[] = []; 
            const articleContainers = document.querySelectorAll<HTMLDivElement>(".article_container1");

            articleContainers.forEach((container) => {
                const headingElement = container.querySelector<HTMLAnchorElement>(".article_heading");
                const contentElement = container.querySelector<HTMLAnchorElement>(".article_content a");

                if (headingElement && contentElement) {
                    const heading = headingElement.textContent?.trim(); 
                    const link = contentElement.href; 
                    if (heading && link) {
                        articlesData.push({ heading, link });
                    }
                }
            });

            return articlesData;
        });

        console.log(`✅ Articles for ${companyName} Fetched`);
        if (articles.length > 0) {
            articles.forEach((article, index) => {
                console.log(`Article ${index + 1}:`);
                console.log(`Heading: ${article.heading}`);
                console.log(`Link: ${article.link}`);
                console.log("-----------------------------");
            });
        } else {
            console.log("No articles found for this company.");
        }

        await browser.close();
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

async function main() {
    const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    readline.question("Enter the company name: ", async (companyName: string) => {
        await fetchCompanyArticles(companyName.toLowerCase()); 
        readline.close();
    });
}

main();