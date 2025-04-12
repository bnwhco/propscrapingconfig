import { defineFunction } from '@aws-amplify/backend';
// No direct dependency on data resource needed here unless Lambda needed to READ config

export const scrapingFunction = defineFunction({
  // Specify the handler location (relative to this file)
  entry: './handler.ts',
  // Runtime and architecture
  runtime: 18, // Use Node.js 18.x or later (check compatibility with playwright-aws-lambda)
  architecture: 'arm64', // ARM64 is generally more cost-effective
  // Specify memory and timeout - Playwright needs significant resources
  memoryMB: 1024, // Minimum 1GB recommended for Playwright
  timeoutSeconds: 90, // Allow ample time for scraping (API Gateway default is 30s, max is 900s)
  // Add necessary environment variables if required
  // environment: {
  //   LOG_LEVEL: 'DEBUG',
  // },
  // Ensure necessary dependencies are listed in ./package.json
});