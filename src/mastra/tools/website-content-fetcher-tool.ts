import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { chromium } from "playwright";

export const websiteContentFetcherTool = createTool({
  id: "website-content-fetcher-tool",
  description: "Fetches and extracts content from websites using Playwright MCP server. Handles various types of web content including articles, GitHub pages, and social media posts.",
  inputSchema: z.object({
    url: z.string().url().describe("The URL of the website to fetch content from"),
  }),
  outputSchema: z.object({
    title: z.string().describe("The title of the webpage"),
    content: z.string().describe("The main text content extracted from the webpage"),
    url: z.string().describe("The original URL that was fetched"),
    error: z.string().optional().describe("Error message if the fetch failed"),
  }),
  execute: async ({ context }) => {
    const { url } = context;

    const userAgentStrings = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.2227.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.3497.92 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    ];

    try {
      // Launch Chromium browser instance
      const browser = await chromium.launch({
        headless: true
      });

      // Create a new browser context with a randomly selected user agent string
      const context = await browser.newContext({
        userAgent: userAgentStrings[Math.floor(Math.random() * userAgentStrings.length)],
      });

      // Create a new page in the browser context and navigate to target URL
      const page = await context.newPage();
      
      // Set a reasonable timeout
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Get page title
      const title = await page.title();

      // Extract main content from the page
      let extractedContent = "";
      
      try {
        // Try to find main content areas using selectors
        const contentSelectors = [
          'article',
          '[role="main"]',
          'main',
          '.content',
          '.post-content',
          '.article-content',
          '.entry-content',
          '.post-body',
          '.article-body'
        ];
        
        for (const selector of contentSelectors) {
          const element = await page.$(selector);
          if (element) {
            const content = await element.textContent();
            if (content && content.trim().length > 100) {
              extractedContent = content.replace(/\s+/g, ' ').trim();
              break;
            }
          }
        }
        
        // Fallback to body if no specific content area found
        if (!extractedContent || extractedContent.trim().length < 100) {
          extractedContent = await page.textContent('body') || '';
          extractedContent = extractedContent.replace(/\s+/g, ' ').trim();
        }
        
      } catch (e) {
        // Final fallback - get all text
        extractedContent = await page.textContent('body') || '';
      }

      // Close the browser when done
      await browser.close();

      return {
        title: title || "Untitled",
        content: extractedContent,
        url: url,
        error: extractedContent ? undefined : "Failed to extract content from the page"
      };

    } catch (error) {
      return {
        title: "",
        content: "",
        url: url,
        error: `Error fetching content: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  },
});