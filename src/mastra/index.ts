
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';

// weather example
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';

// content writing example
import { contentWritingWorkflow } from './workflows/content-writing-workflow.js';
import { writingStyleAgent } from './agents/writing-style-agent.js';
import { contentGenerationAgent } from './agents/content-generation-agent.js';

export const mastra = new Mastra({
  workflows: { weatherWorkflow, contentWritingWorkflow },
  agents: { weatherAgent, writingStyleAgent, contentGenerationAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
