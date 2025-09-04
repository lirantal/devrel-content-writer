import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { mockedResponse } from "../agents/writing-style-agent";
import { authorContext } from "../context/author_profile.context";

const establishWritingStyle = createStep({
  id: "establish-writing-style",
  description: "Analyzes documents to establish a writing style.",
  inputSchema: z.object({
    content_type: z
      .string()
      .describe("The type of content to analyze, e.g., 'article', 'blog'."),
    brief: z.string().optional().describe("Manual brief for content (use if no pr_url provided)."),
    pr_url: z.string().url().optional().describe("GitHub PR URL to analyze for content brief (use instead of brief)."),
    context: z.string().optional().describe("Additional context or specific requirements for the content generation."),
  }).refine(
    (data) => data.brief || data.pr_url,
    {
      message: "Either 'brief' or 'pr_url' must be provided",
    }
  ),
  outputSchema: z.object({
    writing_style: z
      .string()
      .describe("The proposed writing style based on the analysis."),
  }),
  execute: async ({ inputData, mastra }) => {
    // @TODO using a mocked response with already established writing style
    // otherwise, uncomment the below

    
    const agent = mastra.getAgent("writingStyleAgent");
    if (!agent) {
      throw new Error("Writing Style Agent not found.");
    }

    const response = await agent.stream([
      {
        role: "user",
        content: `Analyze documents of type '${inputData.content_type}' and propose a writing style.`,
      },
    ]);

    let writingStyle = "";
    for await (const chunk of response.textStream) {
      writingStyle += chunk;
    }

    // mockedResponse.trim().length;
    // const writingStyle = mockedResponse;

    return { 
      writing_style: writingStyle
    };
  },
});

const generateBriefFromPR = createStep({
  id: "generate-brief-from-pr",
  description: "Analyzes GitHub PR data to generate an article brief and outline, or uses provided brief.",
  inputSchema: z.object({
    writing_style: z.string().describe("The proposed writing style."),
  }),
  outputSchema: z.object({
    writing_style: z.string().describe("The writing style passed through."),
    brief: z.string().describe("The generated article brief and outline in Markdown format."),
  }),
  execute: async ({ inputData, mastra, getInitData }) => {
    const initData = getInitData();
    
    // If PR URL is provided, use PR analysis agent to generate brief
    if (initData.pr_url) {
      const agent = mastra.getAgent("prAnalysisAgent");
      if (!agent) {
        throw new Error("PR Analysis Agent not found.");
      }

      let prompt = `Analyze the GitHub PR at this URL and generate a comprehensive article brief and outline: ${initData.pr_url},  and the author preferences in <author_context>.`;
      
      // Add context if provided
      if (initData.context) {
        prompt += `\n\nYou are also provided with additional context in <additional_context> XML tags to better tailor the outline and brief.

<author_context>
${JSON.stringify(authorContext)}
</author_context>

<additional_context>
${initData.context}
</additional_context>
`;
      }

      const response = await agent.stream([
        {
          role: "user",
          content: prompt,
        },
      ]);

      let brief = "";
      for await (const chunk of response.textStream) {
        brief += chunk;
      }

      return { 
        writing_style: inputData.writing_style,
        brief: brief 
      };
    } else if (initData.brief) {
      // Use provided brief
      return { 
        writing_style: inputData.writing_style,
        brief: initData.brief 
      };
    } else {
      throw new Error("Either 'pr_url' or 'brief' must be provided in the workflow input.");
    }
  },
});

const generateContent = createStep({
  id: "generate-content",
  description: "Generates content based on the writing style and brief.",
  inputSchema: z.object({
    writing_style: z.string().describe("The proposed writing style."),
    brief: z.string().describe("The article brief and outline."),
  }),
  outputSchema: z
    .string()
    .describe("The generated content as text output in Markdown format."),
  execute: async ({ inputData, mastra, getInitData }) => {
    const initData = getInitData();
    
    const agent = mastra.getAgent("contentGenerationAgent");
    if (!agent) {
      throw new Error("Content Generation Agent not found.");
    }

    let prompt = `Use the writing style in <writing_style> and the brief (or draft) in <brief> to generate the article, and the author preferences in <author_context>.

<writing_style>
${inputData.writing_style}
</writing_style>

<brief>
${inputData.brief}
</brief>

<author_context>
${JSON.stringify(authorContext)}
</author_context>

`;

    // Add context if provided
    if (initData.context) {
      prompt += `

<additional_context>
${initData.context}
</additional_context>
`;
    }

    const response = await agent.stream([
      {
        role: "user",
        content: prompt,
      },
    ]);

    let content = "";
    for await (const chunk of response.textStream) {
      content += chunk;
    }

    return content;
  },
});

const contentWritingWorkflow = createWorkflow({
  id: "content-writing-workflow",
  inputSchema: z.object({
    content_type: z
      .string()
      .describe("The type of content to produce, e.g., 'article', 'blog'."),
    brief: z.string().optional().describe("Manual brief for content (use if no pr_url provided)."),
    pr_url: z.string().url().optional().describe("GitHub PR URL to analyze for content brief (use instead of brief)."),
    context: z.string().optional().describe("Additional context or specific requirements for the content generation (e.g., target audience details, specific angles to focus on, company messaging, etc.)."),
  }).refine(
    (data) => data.brief || data.pr_url,
    {
      message: "Either 'brief' or 'pr_url' must be provided",
    }
  ),
  outputSchema: z
    .string()
    .describe("The generated content as text output in Markdown format."),
})
  .then(establishWritingStyle)
  .then(generateBriefFromPR)
  .then(generateContent);

contentWritingWorkflow.commit();

export { contentWritingWorkflow };
