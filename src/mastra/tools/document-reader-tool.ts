import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

export const documentReaderTool = createTool({
  id: "document-reader-tool",
  description:
    "Reads markdown documents from the file system based on content_type.",
  inputSchema: z.object({
    content_type: z
      .string()
      .describe("The type of content to read, e.g., 'blog', 'article', etc."),
  }),
  outputSchema: z
    .string()
    .describe(
      "Representative content to be used as guidelines, each example is formatted as its own XML tags containing the contents of the files."
    ),
  execute: async ({ context }) => {
    const { content_type } = context;

    // Detect if running inside `.mastra/output` and adjust path
    let baseDir = process.cwd();
    if (baseDir.includes(path.join(".mastra", "output"))) {
      baseDir = path.resolve(baseDir, "..", "..");
    }

    const dirPath = path.join(baseDir, "data", content_type);
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".md"));
    const xmlContent = files
      .map((f, index) => {
        const content = fs.readFileSync(path.join(dirPath, f), "utf-8");
        return `
<example_content_${index + 1}>
${content}
</example_content_${index + 1}>`;
      })
      .join("\n\n");

    return xmlContent;
  },
});
