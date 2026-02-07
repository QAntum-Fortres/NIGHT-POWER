/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: CI/CD INTEGRATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * CI provider integrations, config generators, pipeline helpers
 * GitHub Actions, GitLab CI, Jenkins, Azure DevOps support
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0-QANTUM-PRIME
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

import { logger } from '../api/unified/utils/logger';
// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export type CIProvider = 'github' | 'gitlab' | 'jenkins' | 'azure' | 'circleci' | 'bitbucket';

export interface CIConfig {
  provider: CIProvider;
  projectName: string;
  nodeVersion: string;
  browsers: Array<'chromium' | 'firefox' | 'webkit'>;
  parallel: number;
  retries: number;
  testCommand: string;
  artifactPaths: string[];
  environment?: Record<string, string>;
  secrets?: string[];
  triggers?: {
    push?: boolean;
    pullRequest?: boolean;
    schedule?: string; // Cron expression
    manual?: boolean;
  };
  cache?: {
    enabled: boolean;
    paths: string[];
  };
  notifications?: {
    slack?: string;
    email?: string[];
  };
}

export interface PipelineStep {
  name: string;
  command: string;
  condition?: string;
  timeout?: number;
  continueOnError?: boolean;
  env?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CI DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

export class CIDetector {
  /**
   * Detect current CI environment
   */
  static detect(): {
    isCI: boolean;
    provider?: CIProvider;
    buildId?: string;
    branch?: string;
    commit?: string;
    prNumber?: string;
    actor?: string;
  } {
    const env = process.env;

    // GitHub Actions
    if (env.GITHUB_ACTIONS === 'true') {
      return {
        isCI: true,
        provider: 'github',
        buildId: env.GITHUB_RUN_ID,
        branch: env.GITHUB_REF_NAME,
        commit: env.GITHUB_SHA,
        prNumber: env.GITHUB_EVENT_NAME === 'pull_request' ? this.extractPRNumber(env.GITHUB_REF) : undefined,
        actor: env.GITHUB_ACTOR
      };
    }

    // GitLab CI
    if (env.GITLAB_CI === 'true') {
      return {
        isCI: true,
        provider: 'gitlab',
        buildId: env.CI_PIPELINE_ID,
        branch: env.CI_COMMIT_REF_NAME,
        commit: env.CI_COMMIT_SHA,
        prNumber: env.CI_MERGE_REQUEST_IID,
        actor: env.GITLAB_USER_NAME
      };
    }

    // Jenkins
    if (env.JENKINS_URL) {
      return {
        isCI: true,
        provider: 'jenkins',
        buildId: env.BUILD_ID,
        branch: env.GIT_BRANCH,
        commit: env.GIT_COMMIT,
        actor: env.BUILD_USER
      };
    }

    // Azure DevOps
    if (env.TF_BUILD === 'True') {
      return {
        isCI: true,
        provider: 'azure',
        buildId: env.BUILD_BUILDID,
        branch: env.BUILD_SOURCEBRANCHNAME,
        commit: env.BUILD_SOURCEVERSION,
        prNumber: env.SYSTEM_PULLREQUEST_PULLREQUESTID,
        actor: env.BUILD_REQUESTEDFOR
      };
    }

    // CircleCI
    if (env.CIRCLECI === 'true') {
      return {
        isCI: true,
        provider: 'circleci',
        buildId: env.CIRCLE_BUILD_NUM,
        branch: env.CIRCLE_BRANCH,
        commit: env.CIRCLE_SHA1,
        prNumber: env.CIRCLE_PR_NUMBER,
        actor: env.CIRCLE_USERNAME
      };
    }

    // Bitbucket Pipelines
    if (env.BITBUCKET_BUILD_NUMBER) {
      return {
        isCI: true,
        provider: 'bitbucket',
        buildId: env.BITBUCKET_BUILD_NUMBER,
        branch: env.BITBUCKET_BRANCH,
        commit: env.BITBUCKET_COMMIT,
        prNumber: env.BITBUCKET_PR_ID
      };
    }

    // Generic CI detection
    if (env.CI === 'true' || env.CONTINUOUS_INTEGRATION === 'true') {
      return { isCI: true };
    }

    return { isCI: false };
  }

  private static extractPRNumber(ref?: string): string | undefined {
    if (!ref) return undefined;
    const match = ref.match(/refs\/pull\/(\d+)/);
    return match ? match[1] : undefined;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

export class GitHubActionsGenerator {
  static generate(config: CIConfig): string {
    const yaml = `# Mind Engine - GitHub Actions CI/CD
name: ${config.projectName} Tests

on:
${config.triggers?.push !== false ? `  push:
    branches: [ main, master, develop ]
` : ''}${config.triggers?.pullRequest !== false ? `  pull_request:
    branches: [ main, master ]
` : ''}${config.triggers?.schedule ? `  schedule:
    - cron: '${config.triggers.schedule}'
` : ''}${config.triggers?.manual ? `  workflow_dispatch:
` : ''}

env:
  CI: true
${Object.entries(config.environment || {}).map(([k, v]) => `  ${k}: ${v}`).join('\n')}

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    
    strategy:
      fail-fast: false
      matrix:
        browser: [${config.browsers.map(b => `'${b}'`).join(', ')}]
        shard: [${Array.from({ length: config.parallel }, (_, i) => i + 1).join(', ')}]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '${config.nodeVersion}'
${config.cache?.enabled ? `          cache: 'npm'
` : ''}
      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps \${{ matrix.browser }}

      - name: Run tests
        run: ${config.testCommand} --project=\${{ matrix.browser }} --shard=\${{ matrix.shard }}/${config.parallel}
        env:
          BROWSER: \${{ matrix.browser }}
${config.secrets?.map(s => `          ${s}: \${{ secrets.${s} }}`).join('\n') || ''}

      - name: Upload artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-\${{ matrix.browser }}-\${{ matrix.shard }}
          path: |
${config.artifactPaths.map(p => `            ${p}`).join('\n')}
          retention-days: 30

  report:
    needs: test
    if: always()
    runs-on: ubuntu-latest
    
    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          path: all-results

      - name: Merge reports
        run: |
          npm i -g playwright-merge-html-reports
          npx playwright-merge-html-reports all-results
${config.notifications?.slack ? `
      - name: Notify Slack
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          channel-id: '${config.notifications.slack}'
          slack-message: "Test run failed for \${{ github.repository }}"
        env:
          SLACK_BOT_TOKEN: \${{ secrets.SLACK_BOT_TOKEN }}
` : ''}`;

    return yaml;
  }
}

export class GitLabCIGenerator {
  static generate(config: CIConfig): string {
    const yaml = `# Mind Engine - GitLab CI/CD
image: mcr.microsoft.com/playwright:v1.40.0-focal

stages:
  - test
  - report

variables:
  CI: "true"
${Object.entries(config.environment || {}).map(([k, v]) => `  ${k}: "${v}"`).join('\n')}

${config.cache?.enabled ? `cache:
  key: "\${CI_COMMIT_REF_SLUG}"
  paths:
${config.cache.paths.map(p => `    - ${p}`).join('\n')}
` : ''}

.test_template: &test_definition
  stage: test
  before_script:
    - npm ci
  script:
    - ${config.testCommand} --project=$BROWSER --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
  artifacts:
    when: always
    paths:
${config.artifactPaths.map(p => `      - ${p}`).join('\n')}
    expire_in: 7 days
  retry:
    max: ${config.retries}
    when: always

${config.browsers.map(browser => `test:${browser}:
  <<: *test_definition
  variables:
    BROWSER: "${browser}"
  parallel: ${config.parallel}
`).join('\n')}

report:
  stage: report
  when: always
  script:
    - npm i -g playwright-merge-html-reports
    - npx playwright-merge-html-reports test-results/
  artifacts:
    paths:
      - html-report/
    expire_in: 30 days
`;

    return yaml;
  }
}

export class JenkinsfileGenerator {
  static generate(config: CIConfig): string {
    const jenkinsfile = `// Mind Engine - Jenkinsfile
pipeline {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.40.0-focal'
            args '-u root'
        }
    }

    options {
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        CI = 'true'
${Object.entries(config.environment || {}).map(([k, v]) => `        ${k} = '${v}'`).join('\n')}
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install --with-deps'
            }
        }

        stage('Test') {
            matrix {
                axes {
                    axis {
                        name 'BROWSER'
                        values ${config.browsers.map(b => `'${b}'`).join(', ')}
                    }
                }
                stages {
                    stage('Run Tests') {
                        steps {
                            sh '${config.testCommand} --project=\${BROWSER}'
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright Report'
            ])
            
            archiveArtifacts artifacts: '${config.artifactPaths.join(', ')}', allowEmptyArchive: true
        }
${config.notifications?.slack ? `
        failure {
            slackSend(
                channel: '${config.notifications.slack}',
                color: 'danger',
                message: "Build failed: \${env.JOB_NAME} #\${env.BUILD_NUMBER}"
            )
        }
` : ''}
    }
}`;

    return jenkinsfile;
  }
}

export class AzurePipelinesGenerator {
  static generate(config: CIConfig): string {
    const yaml = `# Mind Engine - Azure Pipelines
trigger:
${config.triggers?.push !== false ? `  branches:
    include:
      - main
      - master
      - develop
` : '  none'}

pr:
${config.triggers?.pullRequest !== false ? `  branches:
    include:
      - main
      - master
` : '  none'}

pool:
  vmImage: 'ubuntu-latest'

variables:
  - name: CI
    value: 'true'
${Object.entries(config.environment || {}).map(([k, v]) => `  - name: ${k}
    value: '${v}'`).join('\n')}

stages:
  - stage: Test
    displayName: 'Run Tests'
    jobs:
      - job: Test
        displayName: 'Test'
        strategy:
          matrix:
${config.browsers.map(browser => `            ${browser}:
              BROWSER: '${browser}'`).join('\n')}
          maxParallel: ${config.parallel}
        
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '${config.nodeVersion}'
            displayName: 'Install Node.js'

          - script: npm ci
            displayName: 'Install dependencies'

          - script: npx playwright install --with-deps $(BROWSER)
            displayName: 'Install browsers'

          - script: ${config.testCommand} --project=$(BROWSER)
            displayName: 'Run tests'

          - task: PublishTestResults@2
            condition: always()
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: '**/junit-*.xml'
              mergeTestResults: true
              failTaskOnFailedTests: true

          - task: PublishBuildArtifacts@1
            condition: always()
            inputs:
              pathToPublish: 'playwright-report'
              artifactName: 'test-results-$(BROWSER)'
`;

    return yaml;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CI CONFIG MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class CIConfigManager extends EventEmitter {
  private config: CIConfig;

  constructor(config: Partial<CIConfig> = {}) {
    super();
    this.config = {
      provider: 'github',
      projectName: 'mind-engine-tests',
      nodeVersion: '20',
      browsers: ['chromium'],
      parallel: 4,
      retries: 2,
      testCommand: 'npx playwright test',
      artifactPaths: ['playwright-report/', 'test-results/'],
      triggers: {
        push: true,
        pullRequest: true
      },
      cache: {
        enabled: true,
        paths: ['node_modules/', '~/.cache/ms-playwright/']
      },
      ...config
    };
  }

  /**
   * Generate CI config
   */
  generate(provider?: CIProvider): string {
    const p = provider || this.config.provider;

    switch (p) {
      case 'github':
        return GitHubActionsGenerator.generate(this.config);
      case 'gitlab':
        return GitLabCIGenerator.generate(this.config);
      case 'jenkins':
        return JenkinsfileGenerator.generate(this.config);
      case 'azure':
        return AzurePipelinesGenerator.generate(this.config);
      default:
        throw new Error(`Unsupported CI provider: ${p}`);
    }
  }

  /**
   * Write config file
   */
  write(outputPath?: string): string {
    const content = this.generate();
    const filePath = outputPath || this.getDefaultPath();

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
    this.emit('config:written', { path: filePath, provider: this.config.provider });

    return filePath;
  }

  /**
   * Get default output path
   */
  private getDefaultPath(): string {
    switch (this.config.provider) {
      case 'github':
        return '.github/workflows/playwright.yml';
      case 'gitlab':
        return '.gitlab-ci.yml';
      case 'jenkins':
        return 'Jenkinsfile';
      case 'azure':
        return 'azure-pipelines.yml';
      case 'circleci':
        return '.circleci/config.yml';
      case 'bitbucket':
        return 'bitbucket-pipelines.yml';
      default:
        return 'ci-config.yml';
    }
  }

  /**
   * Update config
   */
  updateConfig(updates: Partial<CIConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current config
   */
  getConfig(): CIConfig {
    return { ...this.config };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CI REPORTER (FOR CI ENVIRONMENTS)
// ═══════════════════════════════════════════════════════════════════════════════

export class CIReporter extends EventEmitter {
  private ci = CIDetector.detect();

  /**
   * Report test start
   */
  testStart(testName: string): void {
    if (this.ci.provider === 'github') {
      logger.debug(`::group::${testName}`);
    } else if (this.ci.provider === 'azure') {
      logger.debug(`##[group]${testName}`);
    }
    this.emit('test:start', { testName });
  }

  /**
   * Report test end
   */
  testEnd(testName: string, passed: boolean, duration: number): void {
    if (this.ci.provider === 'github') {
      logger.debug('::endgroup::');
      if (!passed) {
        logger.debug(`::error::Test failed: ${testName}`);
      }
    } else if (this.ci.provider === 'azure') {
      logger.debug('##[endgroup]');
      if (!passed) {
        logger.debug(`##[error]Test failed: ${testName}`);
      }
    }
    this.emit('test:end', { testName, passed, duration });
  }

  /**
   * Report warning
   */
  warning(message: string, file?: string, line?: number): void {
    if (this.ci.provider === 'github') {
      const location = file ? ` file=${file}${line ? `,line=${line}` : ''}` : '';
      logger.debug(`::warning${location}::${message}`);
    } else if (this.ci.provider === 'azure') {
      logger.debug(`##[warning]${message}`);
    } else if (this.ci.provider === 'gitlab') {
      logger.debug(`\x1b[33mWarning: ${message}\x1b[0m`);
    } else {
      logger.warn(`Warning: ${message}`);
    }
  }

  /**
   * Report error
   */
  error(message: string, file?: string, line?: number): void {
    if (this.ci.provider === 'github') {
      const location = file ? ` file=${file}${line ? `,line=${line}` : ''}` : '';
      logger.debug(`::error${location}::${message}`);
    } else if (this.ci.provider === 'azure') {
      logger.debug(`##[error]${message}`);
    } else if (this.ci.provider === 'gitlab') {
      logger.debug(`\x1b[31mError: ${message}\x1b[0m`);
    } else {
      logger.error(`Error: ${message}`);
    }
  }

  /**
   * Set output variable
   */
  setOutput(name: string, value: string): void {
    if (this.ci.provider === 'github') {
      const outputFile = process.env.GITHUB_OUTPUT;
      if (outputFile) {
        fs.appendFileSync(outputFile, `${name}=${value}\n`);
      }
    } else if (this.ci.provider === 'azure') {
      logger.debug(`##vso[task.setvariable variable=${name}]${value}`);
    }
    this.emit('output:set', { name, value });
  }

  /**
   * Add summary
   */
  addSummary(markdown: string): void {
    if (this.ci.provider === 'github') {
      const summaryFile = process.env.GITHUB_STEP_SUMMARY;
      if (summaryFile) {
        fs.appendFileSync(summaryFile, markdown + '\n');
      }
    }
    this.emit('summary:added', { markdown });
  }

  /**
   * Create annotation
   */
  annotate(type: 'error' | 'warning' | 'notice', message: string, options?: {
    file?: string;
    line?: number;
    endLine?: number;
    title?: string;
  }): void {
    if (this.ci.provider === 'github') {
      let annotation = `::${type}`;
      const props: string[] = [];
      
      if (options?.file) props.push(`file=${options.file}`);
      if (options?.line) props.push(`line=${options.line}`);
      if (options?.endLine) props.push(`endLine=${options.endLine}`);
      if (options?.title) props.push(`title=${options.title}`);
      
      if (props.length > 0) {
        annotation += ` ${props.join(',')}`;
      }
      
      logger.debug(`${annotation}::${message}`);
    }
  }

  /**
   * Get CI info
   */
  getInfo(): ReturnType<typeof CIDetector.detect> {
    return this.ci;
  }
}

export default {
  CIDetector,
  CIConfigManager,
  CIReporter,
  GitHubActionsGenerator,
  GitLabCIGenerator,
  JenkinsfileGenerator,
  AzurePipelinesGenerator
};
