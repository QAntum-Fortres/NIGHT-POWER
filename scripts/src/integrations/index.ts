/**
 * Third-Party Integrations Module
 * @module integrations
 */

export {
  JiraIntegration,
  SlackIntegration,
  TestRailIntegration,
  GitHubIntegration,
  AzureDevOpsIntegration,
  IntegrationManager,
  createJiraIntegration,
  createSlackIntegration,
  createTestRailIntegration,
  createGitHubIntegration,
  createAzureDevOpsIntegration,
  createIntegrationManager
} from './ThirdPartyIntegrations';

export type {
  IntegrationConfig,
  TestResult,
  BugReport
} from './ThirdPartyIntegrations';
