import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { RuntimeContext } from "@mastra/core/di";
import { newsletterSummarizerAgent } from "../agents/newsletter-summarizer-agent";
import { websiteContentFetcherTool } from "../tools/website-content-fetcher-tool";

const processAndSummarizeLink = createStep({
  id: "process-and-summarize-link",
  description: "Fetches content from a URL and summarizes it using the Node.js security expert agent",
  inputSchema: z.object({
    link: z.string().url().describe("The URL to fetch and summarize"),
  }),
  outputSchema: z.string().describe("Markdown formatted summary of the content"),
  execute: async ({ inputData, mastra, runtimeContext }) => {
    const { link: url } = inputData;

    try {
      // Step 1: Fetch content from the URL
      const fetchResult = await websiteContentFetcherTool.execute({
        context: { url: url },
        runtimeContext: runtimeContext || new RuntimeContext()
      });

      // Step 2: Handle fetch errors
      if (fetchResult.error || !fetchResult.content || fetchResult.content.trim().length === 0) {
        return `[${fetchResult.title || "Error"}](${url}) - Failed to fetch or extract content from this URL: ${fetchResult.error || "No content found"}`;
      }

      // Step 3: Summarize using the agent
      const agent = mastra.getAgent("newsletterSummarizerAgent");
      if (!agent) {
        return `[${fetchResult.title}](${url}) - Agent error: Newsletter summarizer agent not found`;
      }

      const prompt = `Please analyze and summarize the following website content according to your expertise as a Node.js security expert.

Website URL: ${url}
Website Title: ${fetchResult.title}

Content:
${fetchResult.content}
`;

      const response = await agent.stream([
        {
          role: "user",
          content: prompt,
        },
      ]);

      let summary = "";
      for await (const chunk of response.textStream) {
        summary += chunk;
      }

      // Clean up the summary and ensure it follows the correct format
      summary = summary.trim();
      summary = `**[${fetchResult.title}](${url})** - ${summary}`;

      return summary;

    } catch (error) {
      return `[Error](${url}) - Failed to process this URL: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

const extractLinksArray = createStep({
  id: "extract-links-array",
  description: "Extracts the array of links from the input object",
  inputSchema: z.object({
    links: z.array(z.object({
      link: z.string().url().describe("The URL to fetch and summarize"),
    })).describe("Array of links to process for the newsletter")
  }),
  outputSchema: z.array(z.object({
    link: z.string().url().describe("The URL to fetch and summarize"),
  })).describe("Array of link objects"),
  execute: async ({ inputData }) => {
    return inputData.links;
  },
});

const categorizeSummaries = createStep({
  id: "categorize-summaries",
  description: "Categorizes summaries into relevant groups with H2 headings using dedicated categorizer agent",
  inputSchema: z.array(z.string()).describe("Array of markdown formatted summaries"),
  outputSchema: z.string().describe("Categorized markdown content with H2 headings"),
  execute: async ({ inputData, mastra }) => {
    const summaries = inputData;
    
    if (summaries.length === 0) {
      return "No summaries to categorize.";
    }

    // Get the dedicated categorizer agent
    const agent = mastra.getAgent("newsletterCategorizerAgent");
    if (!agent) {
      // Fallback: just group everything under one heading
      const formattedSummaries = summaries.map(summary => `- ${summary}`).join('\n\n');
      return `## Node.js Security Updates\n\n${formattedSummaries}`;
    }

    const prompt = `Please categorize the following newsletter summaries into relevant groups with H2 markdown headings:

${summaries.map((summary, index) => `${index + 1}. ${summary}`).join('\n\n')}`;

    const response = await agent.stream([
      {
        role: "user",
        content: prompt,
      },
    ]);

    let categorizedContent = "";
    for await (const chunk of response.textStream) {
      categorizedContent += chunk;
    }

    return categorizedContent.trim();
  },
});

const collectAndFormatSummaries = createStep({
  id: "collect-and-format-summaries",
  description: "Final formatting step for the newsletter content",
  inputSchema: z.string().describe("Categorized markdown content"),
  outputSchema: z.string().describe("Final markdown formatted newsletter content"),
  execute: async ({ inputData }) => {
    return inputData;
  },
});

const newsletterLinksSummarizerWorkflow = createWorkflow({
  id: "newsletter-links-summarizer-workflow",
  description: "Takes a list of links as input, fetches content from each URL using Playwright, summarizes each using a Node.js security expert agent, categorizes them under relevant headings, and returns formatted markdown summaries",
  inputSchema: z.object({
    links: z.array(z.object({
      link: z.string().url().describe("The URL to fetch and summarize"),
    })).describe("Array of links to process for the newsletter")
  }),
  outputSchema: z.string().describe("Complete markdown formatted newsletter content with categorized summaries"),
})
  .then(extractLinksArray)
  .foreach(processAndSummarizeLink)
  .then(categorizeSummaries)
  .then(collectAndFormatSummaries);

newsletterLinksSummarizerWorkflow.commit();

export { newsletterLinksSummarizerWorkflow };