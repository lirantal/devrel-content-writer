import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const githubPrTool = createTool({
  id: "github-pr-tool",
  description: "Retrieves GitHub PR data including title, description, and diff from a PR URL.",
  inputSchema: z.object({
    pr_url: z
      .string()
      .url()
      .describe("The GitHub PR URL (e.g., https://github.com/owner/repo/pull/123)"),
  }),
  outputSchema: z.object({
    title: z.string().describe("The PR title"),
    body: z.string().describe("The PR description/body"),
    diff: z.string().describe("The PR diff showing code changes"),
    pr_number: z.number().describe("The PR number"),
    repository: z.string().describe("The repository name in format owner/repo"),
  }),
  execute: async ({ context }) => {
    const { pr_url } = context;
    
    // Parse the PR URL to extract owner, repo, and PR number
    const urlMatch = pr_url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (!urlMatch) {
      throw new Error("Invalid GitHub PR URL format. Expected: https://github.com/owner/repo/pull/123");
    }
    
    const [, owner, repo, prNumber] = urlMatch;
    const repository = `${owner}/${repo}`;
    const pr_number = parseInt(prNumber, 10);
    
    try {
      // Fetch PR data from GitHub API
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
      const prResponse = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DevRel-Content-Writer/1.0'
        }
      });
      
      if (!prResponse.ok) {
        throw new Error(`Failed to fetch PR data: ${prResponse.status} ${prResponse.statusText}`);
      }
      
      const prData = await prResponse.json();
      
      // Fetch PR diff
      const diffUrl = `${pr_url}.diff`;
      const diffResponse = await fetch(diffUrl, {
        headers: {
          'User-Agent': 'DevRel-Content-Writer/1.0'
        }
      });
      
      if (!diffResponse.ok) {
        throw new Error(`Failed to fetch PR diff: ${diffResponse.status} ${diffResponse.statusText}`);
      }
      
      const diff = await diffResponse.text();
      
      return {
        title: prData.title || "",
        body: prData.body || "",
        diff: diff,
        pr_number,
        repository,
      };
    } catch (error) {
      throw new Error(`Error fetching PR data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
