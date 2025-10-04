
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';

// content writing example
import { contentWritingWorkflow } from './workflows/content-writing-workflow.js';
import { writingStyleAgent } from './agents/writing-style-agent.js';
import { contentGenerationAgent } from './agents/content-generation-agent.js';
import { prAnalysisAgent } from './agents/pr-analysis-agent.js';

// newsletter links summarizer components
import { newsletterLinksSummarizerWorkflow } from './workflows/newsletter-links-summarizer.js';
import { newsletterSummarizerAgent } from './agents/newsletter-summarizer-agent.js';
import { websiteContentFetcherTool } from './tools/website-content-fetcher-tool.js';

export const mastra = new Mastra({
  workflows: { 
    contentWritingWorkflow,
    newsletterLinksSummarizerWorkflow
  },
  agents: { 
    writingStyleAgent, 
    contentGenerationAgent, 
    prAnalysisAgent,
    newsletterSummarizerAgent
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
