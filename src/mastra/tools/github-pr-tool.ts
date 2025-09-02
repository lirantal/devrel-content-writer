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
    linked_issues: z.array(z.number()).describe("Issue numbers referenced in the PR body"),
    reviewers: z.object({
      requested: z.array(z.string()).describe("Usernames of requested reviewers"),
      assignees: z.array(z.string()).describe("Usernames of assigned reviewers")
    }).describe("Reviewer information"),
    commits: z.array(z.object({
      message: z.string().describe("Commit message"),
      author: z.string().describe("Commit author username"),
      sha: z.string().describe("Commit SHA")
    })).describe("List of commits in the PR"),
    repo_metadata: z.object({
      name: z.string().describe("Repository name"),
      description: z.string().nullable().describe("Repository description"),
      topics: z.array(z.string()).describe("Repository topics/tags"),
      language: z.string().nullable().describe("Primary programming language"),
      stars: z.number().describe("Number of stars"),
      forks: z.number().describe("Number of forks")
    }).describe("Repository metadata")
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
      
      // Fetch commits data
      const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/commits`;
      const commitsResponse = await fetch(commitsUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DevRel-Content-Writer/1.0'
        }
      });
      
      let commits = [];
      if (commitsResponse.ok) {
        const commitsData = await commitsResponse.json();
        commits = commitsData.map((commit: any) => ({
          message: commit.commit.message || "",
          author: commit.author?.login || commit.commit.author?.name || "unknown",
          sha: commit.sha || ""
        }));
      }
      
      // Parse linked issues from PR body
      const linkedIssues: number[] = [];
      if (prData.body) {
        const issueMatches = prData.body.match(/#(\d+)/g);
        if (issueMatches) {
          linkedIssues.push(...issueMatches.map((match: string) => parseInt(match.substring(1), 10)));
        }
        
        // Also look for "closes #123", "fixes #123", "resolves #123" patterns
        const closeMatches = prData.body.match(/(?:closes?|fixes?|resolves?)\s+#(\d+)/gi);
        if (closeMatches) {
          closeMatches.forEach((match: string) => {
            const issueNum = parseInt(match.match(/#(\d+)/)?.[1] || "0", 10);
            if (issueNum && !linkedIssues.includes(issueNum)) {
              linkedIssues.push(issueNum);
            }
          });
        }
      }
      
      // Extract reviewers
      const reviewers = {
        requested: (prData.requested_reviewers || []).map((reviewer: any) => reviewer.login || ""),
        assignees: (prData.assignees || []).map((assignee: any) => assignee.login || "")
      };
      
      // Extract repository metadata
      const repoMetadata = {
        name: prData.base?.repo?.name || "",
        description: prData.base?.repo?.description || null,
        topics: prData.base?.repo?.topics || [],
        language: prData.base?.repo?.language || null,
        stars: prData.base?.repo?.stargazers_count || 0,
        forks: prData.base?.repo?.forks_count || 0
      };
      
      return {
        title: prData.title || "",
        body: prData.body || "",
        diff: diff,
        pr_number,
        repository,
        linked_issues: linkedIssues,
        reviewers,
        commits,
        repo_metadata: repoMetadata
      };
    } catch (error) {
      throw new Error(`Error fetching PR data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
