import 'dotenv/config';
import { createApp } from './app.js';
import { assertProductionAuthConfig } from './auth.js';
import { agentRunService } from './agentRunService.js';
import { runDuePublishingJobs } from './schedulingService.js';

assertProductionAuthConfig();
const port = Number(process.env.API_PORT ?? 4000);
const app = createApp();
const recoverAgentRuns = () => { void agentRunService.recoverStaleAll().catch((error: unknown) => console.error('Agent run recovery failed.', error)); };
recoverAgentRuns();
const recoveryInterval = setInterval(recoverAgentRuns, 60_000);
recoveryInterval.unref();
const runPublishingJobs = () => { void runDuePublishingJobs().catch((error: unknown) => console.error('Publishing job runner failed.', error)); };
runPublishingJobs();
const publishingInterval = setInterval(runPublishingJobs, 30_000);
publishingInterval.unref();
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
