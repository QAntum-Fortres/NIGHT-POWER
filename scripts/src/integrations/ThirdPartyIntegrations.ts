/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: THIRD-PARTY INTEGRATIONS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Jira, Slack, TestRail, GitHub, Azure DevOps integrations
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface IntegrationConfig {
  apiUrl: string;
  apiToken: string;
  projectId?: string;
  options?: Record<string, any>;
}

export interface TestResult {
  testId: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'blocked';
  duration: number;
  error?: string;
  screenshots?: string[];
  metadata?: Record<string, any>;
}

export interface BugReport {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  severity: 'blocker' | 'critical' | 'major' | 'minor' | 'trivial';
  steps: string[];
  expectedResult: string;
  actualResult: string;
  attachments?: string[];
  labels?: string[];
  assignee?: string;
  environment?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// JIRA INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

export class JiraIntegration extends EventEmitter {
  private config: JiraConfig;
  private headers: Record<string, string>;

  constructor(config: JiraConfig) {
    super();
    this.config = config;
    this.headers = {
      'Authorization': `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Create bug from test failure
   */
  async createBug(report: BugReport): Promise<JiraIssue> {
    const issueData = {
      fields: {
        project: { key: this.config.projectKey },
        summary: report.title,
        description: this.formatDescription(report),
        issuetype: { name: 'Bug' },
        priority: { name: this.mapPriority(report.priority) },
        labels: report.labels || ['automated-test', 'mind-engine'],
        ...(report.assignee && { assignee: { name: report.assignee } })
      }
    };

    const response = await this.request('POST', '/rest/api/3/issue', issueData);
    
    // Upload attachments
    if (report.attachments?.length) {
      for (const attachment of report.attachments) {
        await this.uploadAttachment(response.key, attachment);
      }
    }

    this.emit('bugCreated', { key: response.key, ...report });
    return response;
  }

  /**
   * Update issue status
   */
  async updateStatus(issueKey: string, status: string): Promise<void> {
    const transitions = await this.getTransitions(issueKey);
    const transition = transitions.find((t: any) => 
      t.name.toLowerCase() === status.toLowerCase()
    );

    if (!transition) {
      throw new Error(`Transition to "${status}" not available`);
    }

    await this.request('POST', `/rest/api/3/issue/${issueKey}/transitions`, {
      transition: { id: transition.id }
    });

    this.emit('statusUpdated', { issueKey, status });
  }

  /**
   * Add comment to issue
   */
  async addComment(issueKey: string, comment: string): Promise<void> {
    await this.request('POST', `/rest/api/3/issue/${issueKey}/comment`, {
      body: {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: comment }]
        }]
      }
    });
  }

  /**
   * Link test result to issue
   */
  async linkTestResult(issueKey: string, result: TestResult): Promise<void> {
    const statusEmoji = result.status === 'passed' ? '✅' : '❌';
    const comment = `${statusEmoji} Test Result: ${result.name}
    
Status: ${result.status.toUpperCase()}
Duration: ${result.duration}ms
${result.error ? `Error: ${result.error}` : ''}`;

    await this.addComment(issueKey, comment);
  }

  /**
   * Search issues
   */
  async searchIssues(jql: string): Promise<JiraIssue[]> {
    const response = await this.request('POST', '/rest/api/3/search', {
      jql,
      maxResults: 100
    });
    return response.issues;
  }

  /**
   * Get issue details
   */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    return this.request('GET', `/rest/api/3/issue/${issueKey}`);
  }

  private async getTransitions(issueKey: string): Promise<any[]> {
    const response = await this.request('GET', `/rest/api/3/issue/${issueKey}/transitions`);
    return response.transitions;
  }

  private async uploadAttachment(issueKey: string, filePath: string): Promise<void> {
    // Would implement file upload
    this.emit('attachmentUploaded', { issueKey, filePath });
  }

  private formatDescription(report: BugReport): any {
    return {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Description' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: report.description }]
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Steps to Reproduce' }]
        },
        {
          type: 'orderedList',
          content: report.steps.map(step => ({
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: step }] }]
          }))
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Expected Result' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: report.expectedResult }]
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Actual Result' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: report.actualResult }]
        },
        ...(report.environment ? [{
          type: 'paragraph',
          content: [{ type: 'text', text: `Environment: ${report.environment}` }]
        }] : [])
      ]
    };
  }

  private mapPriority(priority: string): string {
    const map: Record<string, string> = {
      'critical': 'Highest',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low'
    };
    return map[priority] || 'Medium';
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}${path}`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
    }

    return method === 'DELETE' ? null : response.json();
  }
}

interface JiraConfig {
  apiUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLACK INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

export class SlackIntegration extends EventEmitter {
  private webhookUrl: string;
  private channel: string;
  private botToken?: string;

  constructor(config: SlackConfig) {
    super();
    this.webhookUrl = config.webhookUrl;
    this.channel = config.channel;
    this.botToken = config.botToken;
  }

  /**
   * Send test summary
   */
  async sendTestSummary(summary: TestSummary): Promise<void> {
    const color = summary.failed > 0 ? '#dc3545' : '#28a745';
    const emoji = summary.failed > 0 ? '❌' : '✅';

    const message = {
      channel: this.channel,
      attachments: [{
        color,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${emoji} Test Results: ${summary.suiteName}`
            }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Total Tests:*\n${summary.total}` },
              { type: 'mrkdwn', text: `*Duration:*\n${this.formatDuration(summary.duration)}` },
              { type: 'mrkdwn', text: `*Passed:*\n${summary.passed} ✅` },
              { type: 'mrkdwn', text: `*Failed:*\n${summary.failed} ❌` },
              { type: 'mrkdwn', text: `*Skipped:*\n${summary.skipped} ⏭️` },
              { type: 'mrkdwn', text: `*Pass Rate:*\n${summary.passRate.toFixed(1)}%` }
            ]
          },
          ...(summary.failedTests.length > 0 ? [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Failed Tests:*\n${summary.failedTests.slice(0, 5).map(t => `• ${t}`).join('\n')}`
            }
          }] : []),
          {
            type: 'context',
            elements: [{
              type: 'mrkdwn',
              text: `Run at: ${new Date().toISOString()} | Branch: ${summary.branch || 'unknown'}`
            }]
          }
        ]
      }]
    };

    await this.sendWebhook(message);
    this.emit('summarySent', summary);
  }

  /**
   * Send alert
   */
  async sendAlert(alert: AlertMessage): Promise<void> {
    const colorMap: Record<string, string> = {
      'error': '#dc3545',
      'warning': '#ffc107',
      'success': '#28a745',
      'info': '#17a2b8'
    };

    const message = {
      channel: this.channel,
      attachments: [{
        color: colorMap[alert.type] || '#6c757d',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${alert.title}*\n${alert.message}`
            }
          },
          ...(alert.fields ? [{
            type: 'section',
            fields: alert.fields.map(f => ({
              type: 'mrkdwn',
              text: `*${f.name}:*\n${f.value}`
            }))
          }] : []),
          ...(alert.actions ? [{
            type: 'actions',
            elements: alert.actions.map(a => ({
              type: 'button',
              text: { type: 'plain_text', text: a.text },
              url: a.url,
              style: a.style
            }))
          }] : [])
        ]
      }]
    };

    await this.sendWebhook(message);
    this.emit('alertSent', alert);
  }

  /**
   * Send failure notification
   */
  async sendFailureNotification(failure: FailureNotification): Promise<void> {
    const message = {
      channel: this.channel,
      attachments: [{
        color: '#dc3545',
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '🚨 Test Failure Alert' }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Test:* ${failure.testName}\n*Error:* ${failure.error}`
            }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*File:*\n${failure.file}` },
              { type: 'mrkdwn', text: `*Line:*\n${failure.line || 'N/A'}` }
            ]
          },
          ...(failure.stackTrace ? [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Stack Trace:*\n\`\`\`${failure.stackTrace.slice(0, 500)}\`\`\``
            }
          }] : [])
        ]
      }]
    };

    await this.sendWebhook(message);
    this.emit('failureSent', failure);
  }

  /**
   * Upload file (requires bot token)
   */
  async uploadFile(filePath: string, title: string): Promise<void> {
    if (!this.botToken) {
      throw new Error('Bot token required for file uploads');
    }

    // Would implement file upload via Slack API
    this.emit('fileUploaded', { filePath, title });
  }

  private async sendWebhook(message: any): Promise<void> {
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error(`Slack webhook error: ${response.status}`);
    }
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

interface SlackConfig {
  webhookUrl: string;
  channel: string;
  botToken?: string;
}

interface TestSummary {
  suiteName: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  passRate: number;
  failedTests: string[];
  branch?: string;
}

interface AlertMessage {
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  fields?: Array<{ name: string; value: string }>;
  actions?: Array<{ text: string; url: string; style?: 'primary' | 'danger' }>;
}

interface FailureNotification {
  testName: string;
  error: string;
  file: string;
  line?: number;
  stackTrace?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTRAIL INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

export class TestRailIntegration extends EventEmitter {
  private config: TestRailConfig;
  private headers: Record<string, string>;

  constructor(config: TestRailConfig) {
    super();
    this.config = config;
    this.headers = {
      'Authorization': `Basic ${Buffer.from(`${config.username}:${config.apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Create test run
   */
  async createRun(name: string, caseIds?: number[]): Promise<TestRailRun> {
    const data: any = {
      name,
      suite_id: this.config.suiteId,
      include_all: !caseIds,
      case_ids: caseIds
    };

    const response = await this.request('POST', `add_run/${this.config.projectId}`, data);
    this.emit('runCreated', response);
    return response;
  }

  /**
   * Add test result
   */
  async addResult(runId: number, caseId: number, result: TestResult): Promise<void> {
    const statusMap: Record<string, number> = {
      'passed': 1,
      'blocked': 2,
      'failed': 5,
      'skipped': 6
    };

    const data = {
      status_id: statusMap[result.status] || 5,
      comment: result.error || `Test ${result.status}`,
      elapsed: `${Math.ceil(result.duration / 1000)}s`
    };

    await this.request('POST', `add_result_for_case/${runId}/${caseId}`, data);
    this.emit('resultAdded', { runId, caseId, status: result.status });
  }

  /**
   * Add multiple results
   */
  async addResults(runId: number, results: Array<{ caseId: number; result: TestResult }>): Promise<void> {
    const statusMap: Record<string, number> = {
      'passed': 1,
      'blocked': 2,
      'failed': 5,
      'skipped': 6
    };

    const data = {
      results: results.map(r => ({
        case_id: r.caseId,
        status_id: statusMap[r.result.status] || 5,
        comment: r.result.error || `Test ${r.result.status}`,
        elapsed: `${Math.ceil(r.result.duration / 1000)}s`
      }))
    };

    await this.request('POST', `add_results_for_cases/${runId}`, data);
    this.emit('resultsAdded', { runId, count: results.length });
  }

  /**
   * Close test run
   */
  async closeRun(runId: number): Promise<void> {
    await this.request('POST', `close_run/${runId}`);
    this.emit('runClosed', { runId });
  }

  /**
   * Get test cases
   */
  async getCases(suiteId?: number): Promise<TestRailCase[]> {
    const suite = suiteId || this.config.suiteId;
    const response = await this.request('GET', `get_cases/${this.config.projectId}&suite_id=${suite}`);
    return response.cases || response;
  }

  /**
   * Get run results
   */
  async getResults(runId: number): Promise<TestRailResult[]> {
    const response = await this.request('GET', `get_results_for_run/${runId}`);
    return response.results || response;
  }

  /**
   * Sync test results from run
   */
  async syncResults(runId: number, results: TestResult[], caseMapping: Map<string, number>): Promise<SyncResult> {
    let synced = 0;
    let failed = 0;

    for (const result of results) {
      const caseId = caseMapping.get(result.testId) || caseMapping.get(result.name);
      
      if (caseId) {
        try {
          await this.addResult(runId, caseId, result);
          synced++;
        } catch {
          failed++;
        }
      } else {
        failed++;
      }
    }

    return { synced, failed, total: results.length };
  }

  private async request(method: string, endpoint: string, body?: any): Promise<any> {
    const url = `${this.config.apiUrl}/index.php?/api/v2/${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`TestRail API error: ${response.status}`);
    }

    return response.json();
  }
}

interface TestRailConfig {
  apiUrl: string;
  username: string;
  apiKey: string;
  projectId: number;
  suiteId: number;
}

interface TestRailRun {
  id: number;
  name: string;
  url: string;
}

interface TestRailCase {
  id: number;
  title: string;
  section_id: number;
}

interface TestRailResult {
  id: number;
  test_id: number;
  status_id: number;
  comment: string;
}

interface SyncResult {
  synced: number;
  failed: number;
  total: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GITHUB INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

export class GitHubIntegration extends EventEmitter {
  private config: GitHubConfig;
  private headers: Record<string, string>;

  constructor(config: GitHubConfig) {
    super();
    this.config = config;
    this.headers = {
      'Authorization': `token ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Create issue from test failure
   */
  async createIssue(title: string, body: string, labels?: string[]): Promise<GitHubIssue> {
    const response = await this.request('POST', `/repos/${this.config.owner}/${this.config.repo}/issues`, {
      title,
      body,
      labels: labels || ['automated-test', 'bug']
    });

    this.emit('issueCreated', response);
    return response;
  }

  /**
   * Create check run
   */
  async createCheckRun(name: string, headSha: string, conclusion: string, summary: string): Promise<void> {
    await this.request('POST', `/repos/${this.config.owner}/${this.config.repo}/check-runs`, {
      name,
      head_sha: headSha,
      status: 'completed',
      conclusion,
      output: {
        title: name,
        summary
      }
    });

    this.emit('checkRunCreated', { name, conclusion });
  }

  /**
   * Update commit status
   */
  async updateStatus(sha: string, state: 'pending' | 'success' | 'failure' | 'error', description: string, context: string = 'mind-engine'): Promise<void> {
    await this.request('POST', `/repos/${this.config.owner}/${this.config.repo}/statuses/${sha}`, {
      state,
      description,
      context,
      target_url: this.config.targetUrl
    });

    this.emit('statusUpdated', { sha, state });
  }

  /**
   * Add comment to PR
   */
  async addPRComment(prNumber: number, comment: string): Promise<void> {
    await this.request('POST', `/repos/${this.config.owner}/${this.config.repo}/issues/${prNumber}/comments`, {
      body: comment
    });

    this.emit('commentAdded', { prNumber });
  }

  /**
   * Create release
   */
  async createRelease(tagName: string, name: string, body: string, draft: boolean = false): Promise<void> {
    await this.request('POST', `/repos/${this.config.owner}/${this.config.repo}/releases`, {
      tag_name: tagName,
      name,
      body,
      draft
    });

    this.emit('releaseCreated', { tagName });
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const response = await fetch(`https://api.github.com${path}`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
  }
}

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  targetUrl?: string;
}

interface GitHubIssue {
  id: number;
  number: number;
  html_url: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AZURE DEVOPS INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

export class AzureDevOpsIntegration extends EventEmitter {
  private config: AzureDevOpsConfig;
  private headers: Record<string, string>;

  constructor(config: AzureDevOpsConfig) {
    super();
    this.config = config;
    this.headers = {
      'Authorization': `Basic ${Buffer.from(`:${config.pat}`).toString('base64')}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Create work item
   */
  async createWorkItem(type: string, title: string, description: string): Promise<any> {
    const patchDocument = [
      { op: 'add', path: '/fields/System.Title', value: title },
      { op: 'add', path: '/fields/System.Description', value: description }
    ];

    const response = await this.request(
      'POST',
      `/${this.config.project}/_apis/wit/workitems/$${type}?api-version=7.0`,
      patchDocument,
      'application/json-patch+json'
    );

    this.emit('workItemCreated', response);
    return response;
  }

  /**
   * Create test run
   */
  async createTestRun(name: string, planId: number): Promise<any> {
    const response = await this.request('POST', `/${this.config.project}/_apis/test/runs?api-version=7.0`, {
      name,
      plan: { id: planId },
      automated: true
    });

    this.emit('testRunCreated', response);
    return response;
  }

  /**
   * Add test results
   */
  async addTestResults(runId: number, results: TestResult[]): Promise<void> {
    const outcomeMap: Record<string, string> = {
      'passed': 'Passed',
      'failed': 'Failed',
      'skipped': 'NotExecuted'
    };

    const data = results.map(r => ({
      testCaseTitle: r.name,
      outcome: outcomeMap[r.status] || 'Failed',
      durationInMs: r.duration,
      errorMessage: r.error
    }));

    await this.request('POST', `/${this.config.project}/_apis/test/runs/${runId}/results?api-version=7.0`, data);
    this.emit('resultsAdded', { runId, count: results.length });
  }

  /**
   * Update build status
   */
  async updateBuildStatus(buildId: number, status: string): Promise<void> {
    await this.request('PATCH', `/${this.config.project}/_apis/build/builds/${buildId}?api-version=7.0`, {
      status
    });
  }

  private async request(method: string, path: string, body?: any, contentType?: string): Promise<any> {
    const response = await fetch(`${this.config.orgUrl}${path}`, {
      method,
      headers: {
        ...this.headers,
        ...(contentType && { 'Content-Type': contentType })
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`Azure DevOps API error: ${response.status}`);
    }

    return response.json();
  }
}

interface AzureDevOpsConfig {
  orgUrl: string;
  project: string;
  pat: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class IntegrationManager extends EventEmitter {
  private integrations: Map<string, any> = new Map();

  /**
   * Register integration
   */
  register(name: string, integration: any): void {
    this.integrations.set(name, integration);
    this.emit('registered', { name });
  }

  /**
   * Get integration
   */
  get<T>(name: string): T | undefined {
    return this.integrations.get(name);
  }

  /**
   * Broadcast test results to all integrations
   */
  async broadcastResults(results: TestResult[]): Promise<BroadcastResult> {
    const outcomes: Record<string, boolean> = {};

    for (const [name, integration] of this.integrations) {
      try {
        if (typeof integration.onTestResults === 'function') {
          await integration.onTestResults(results);
          outcomes[name] = true;
        }
      } catch (error) {
        outcomes[name] = false;
        this.emit('broadcastError', { integration: name, error });
      }
    }

    return { outcomes };
  }

  /**
   * Report failure to all integrations
   */
  async reportFailure(failure: BugReport): Promise<void> {
    for (const [name, integration] of this.integrations) {
      try {
        if (name === 'jira' && integration instanceof JiraIntegration) {
          await integration.createBug(failure);
        }
        if (name === 'slack' && integration instanceof SlackIntegration) {
          await integration.sendAlert({
            type: 'error',
            title: failure.title,
            message: failure.description
          });
        }
        if (name === 'github' && integration instanceof GitHubIntegration) {
          await integration.createIssue(failure.title, failure.description);
        }
      } catch (error) {
        this.emit('reportError', { integration: name, error });
      }
    }
  }
}

interface BroadcastResult {
  outcomes: Record<string, boolean>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export function createJiraIntegration(config: JiraConfig): JiraIntegration {
  return new JiraIntegration(config);
}

export function createSlackIntegration(config: SlackConfig): SlackIntegration {
  return new SlackIntegration(config);
}

export function createTestRailIntegration(config: TestRailConfig): TestRailIntegration {
  return new TestRailIntegration(config);
}

export function createGitHubIntegration(config: GitHubConfig): GitHubIntegration {
  return new GitHubIntegration(config);
}

export function createAzureDevOpsIntegration(config: AzureDevOpsConfig): AzureDevOpsIntegration {
  return new AzureDevOpsIntegration(config);
}

export function createIntegrationManager(): IntegrationManager {
  return new IntegrationManager();
}

export default {
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
};
