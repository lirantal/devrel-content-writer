import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { mockedResponse } from "../agents/writing-style-agent";

const establishWritingStyle = createStep({
  id: "establish-writing-style",
  description: "Analyzes documents to establish a writing style.",
  inputSchema: z.object({
    content_type: z
      .string()
      .describe("The type of content to analyze, e.g., 'article', 'blog'."),
    brief: z.string().describe("The initial draft or brief for the content."),
  }),
  outputSchema: z.object({
    writing_style: z
      .string()
      .describe("The proposed writing style based on the analysis."),
  }),
  execute: async ({ inputData, mastra }) => {
    // @TODO using a mocked response with already established writing style
    // otherwise, uncomment the below

    /*
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
    */

    mockedResponse.trim().length;
    const writingStyle = mockedResponse;

    return { writing_style: writingStyle };
  },
});

const generateContent = createStep({
  id: "generate-content",
  description: "Generates content based on the writing style and brief.",
  inputSchema: z.object({
    writing_style: z.string().describe("The proposed writing style."),
  }),
  outputSchema: z
    .string()
    .describe("The generated content as text output in Markdown format."),
  execute: async ({ inputData, mastra, getInitData }) => {
    const initData = getInitData();
    const brief = initData.brief;

    const agent = mastra.getAgent("contentGenerationAgent");
    if (!agent) {
      throw new Error("Content Generation Agent not found.");
    }

    const response = await agent.stream([
      {
        role: "user",
        content: `Use the writing style in <writing_style> and the brief (or draft) in <brief> to generate the article. 
        
<writing_style>
        ${inputData.writing_style}
</writing_style>

<brief>
${brief}
</brief>
        `,
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
    brief: z.string().describe("The initial draft or brief for the content."),
  }),
  outputSchema: z
    .string()
    .describe("The generated content as text output in Markdown format."),
})
  .then(establishWritingStyle)
  .then(generateContent);

contentWritingWorkflow.commit();

export { contentWritingWorkflow };
