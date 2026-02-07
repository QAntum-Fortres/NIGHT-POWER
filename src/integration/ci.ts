/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM CI/CD INTEGRATION                                                    ║
 * ║   "Seamless integration with CI/CD pipelines"                                 ║
 * ║                                                                               ║
 * ║   TODO B #28 - Integration: CI/CD Support                                     ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type CIProvider = 'github' | 'gitlab' | 'jenkins' | 'azure' | 'circleci' | 'travis' | 'bitbucket' | 'unknown';

export interface CIEnvironment {
    provider: CIProvider;
    isCI: boolean;
    branch?: string;
    commit?: string;
    buildNumber?: string;
    buildUrl?: string;
    prNumber?: string;
    repository?: string;
    actor?: string;
    event?: string;
    ref?: string;
}

export interface CIConfig {
    failFast?: boolean;
    retries?: number;
    timeout?: number;
    parallel?: number;
    artifacts?: string[];
    reportFormats?: string[];
}

export interface BuildAnnotation {
    type: 'error' | 'warning' | 'notice';
    message: string;
    file?: string;
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    title?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CI/CD INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

export class CIIntegration {
    private static instance: CIIntegration;
    private environment: CIEnvironment;
    private config: CIConfig;

    private constructor() {
        this.environment = this.detectEnvironment();
        this.config = {
            failFast: true,
            retries: 2,
            timeout: 60000,
            parallel: 4,
            reportFormats: ['junit', 'json']
        };
    }

    static getInstance(): CIIntegration {
        if (!CIIntegration.instance) {
            CIIntegration.instance = new CIIntegration();
        }
        return CIIntegration.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENVIRONMENT DETECTION
    // ─────────────────────────────────────────────────────────────────────────

    private detectEnvironment(): CIEnvironment {
        const env = process.env;

        // GitHub Actions
        if (env.GITHUB_ACTIONS === 'true') {
            return {
                provider: 'github',
                isCI: true,
                branch: env.GITHUB_REF_NAME || env.GITHUB_HEAD_REF,
                commit: env.GITHUB_SHA,
                buildNumber: env.GITHUB_RUN_NUMBER,
                buildUrl: `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`,
                prNumber: env.GITHUB_EVENT_NAME === 'pull_request' ? env.GITHUB_REF?.split('/')[2] : undefined,
                repository: env.GITHUB_REPOSITORY,
                actor: env.GITHUB_ACTOR,
                event: env.GITHUB_EVENT_NAME,
                ref: env.GITHUB_REF
            };
        }

        // GitLab CI
        if (env.GITLAB_CI === 'true') {
            return {
                provider: 'gitlab',
                isCI: true,
                branch: env.CI_COMMIT_REF_NAME,
                commit: env.CI_COMMIT_SHA,
                buildNumber: env.CI_PIPELINE_ID,
                buildUrl: env.CI_PIPELINE_URL,
                prNumber: env.CI_MERGE_REQUEST_IID,
                repository: env.CI_PROJECT_PATH,
                actor: env.GITLAB_USER_LOGIN
            };
        }

        // Jenkins
        if (env.JENKINS_URL) {
            return {
                provider: 'jenkins',
                isCI: true,
                branch: env.GIT_BRANCH || env.BRANCH_NAME,
                commit: env.GIT_COMMIT,
                buildNumber: env.BUILD_NUMBER,
                buildUrl: env.BUILD_URL,
                prNumber: env.CHANGE_ID,
                repository: env.GIT_URL
            };
        }

        // Azure Pipelines
        if (env.TF_BUILD === 'True') {
            return {
                provider: 'azure',
                isCI: true,
                branch: env.BUILD_SOURCEBRANCHNAME,
                commit: env.BUILD_SOURCEVERSION,
                buildNumber: env.BUILD_BUILDNUMBER,
                buildUrl: `${env.SYSTEM_TEAMFOUNDATIONSERVERURI}${env.SYSTEM_TEAMPROJECT}/_build/results?buildId=${env.BUILD_BUILDID}`,
                prNumber: env.SYSTEM_PULLREQUEST_PULLREQUESTID,
                repository: env.BUILD_REPOSITORY_NAME
            };
        }

        // CircleCI
        if (env.CIRCLECI === 'true') {
            return {
                provider: 'circleci',
                isCI: true,
                branch: env.CIRCLE_BRANCH,
                commit: env.CIRCLE_SHA1,
                buildNumber: env.CIRCLE_BUILD_NUM,
                buildUrl: env.CIRCLE_BUILD_URL,
                prNumber: env.CIRCLE_PULL_REQUEST?.split('/').pop(),
                repository: `${env.CIRCLE_PROJECT_USERNAME}/${env.CIRCLE_PROJECT_REPONAME}`
            };
        }

        // Travis CI
        if (env.TRAVIS === 'true') {
            return {
                provider: 'travis',
                isCI: true,
                branch: env.TRAVIS_BRANCH,
                commit: env.TRAVIS_COMMIT,
                buildNumber: env.TRAVIS_BUILD_NUMBER,
                buildUrl: env.TRAVIS_BUILD_WEB_URL,
                prNumber: env.TRAVIS_PULL_REQUEST !== 'false' ? env.TRAVIS_PULL_REQUEST : undefined,
                repository: env.TRAVIS_REPO_SLUG
            };
        }

        // Bitbucket Pipelines
        if (env.BITBUCKET_BUILD_NUMBER) {
            return {
                provider: 'bitbucket',
                isCI: true,
                branch: env.BITBUCKET_BRANCH,
                commit: env.BITBUCKET_COMMIT,
                buildNumber: env.BITBUCKET_BUILD_NUMBER,
                prNumber: env.BITBUCKET_PR_ID,
                repository: env.BITBUCKET_REPO_FULL_NAME
            };
        }

        // Generic CI detection
        if (env.CI === 'true' || env.CONTINUOUS_INTEGRATION === 'true') {
            return {
                provider: 'unknown',
                isCI: true
            };
        }

        return {
            provider: 'unknown',
            isCI: false
        };
    }

    /**
     * Get CI environment
     */
    getEnvironment(): CIEnvironment {
        return { ...this.environment };
    }

    /**
     * Check if running in CI
     */
    isCI(): boolean {
        return this.environment.isCI;
    }

    /**
     * Get CI provider
     */
    getProvider(): CIProvider {
        return this.environment.provider;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONFIGURATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Configure CI integration
     */
    configure(config: Partial<CIConfig>): this {
        this.config = { ...this.config, ...config };
        return this;
    }

    /**
     * Get configuration
     */
    getConfig(): CIConfig {
        return { ...this.config };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ANNOTATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Add build annotation
     */
    annotate(annotation: BuildAnnotation): void {
        if (!this.environment.isCI) return;

        switch (this.environment.provider) {
            case 'github':
                this.annotateGitHub(annotation);
                break;
            case 'gitlab':
                this.annotateGitLab(annotation);
                break;
            case 'azure':
                this.annotateAzure(annotation);
                break;
            default:
                this.annotateGeneric(annotation);
        }
    }

    private annotateGitHub(annotation: BuildAnnotation): void {
        let message = `::${annotation.type}`;
        
        const params: string[] = [];
        if (annotation.file) params.push(`file=${annotation.file}`);
        if (annotation.line) params.push(`line=${annotation.line}`);
        if (annotation.column) params.push(`col=${annotation.column}`);
        if (annotation.endLine) params.push(`endLine=${annotation.endLine}`);
        if (annotation.endColumn) params.push(`endColumn=${annotation.endColumn}`);
        if (annotation.title) params.push(`title=${annotation.title}`);

        if (params.length > 0) {
            message += ` ${params.join(',')}`;
        }

        message += `::${annotation.message}`;
        console.log(message);
    }

    private annotateGitLab(annotation: BuildAnnotation): void {
        // GitLab uses Code Quality reports
        const level = annotation.type === 'error' ? 'blocker' : 
                     annotation.type === 'warning' ? 'major' : 'minor';
        
        console.log(JSON.stringify({
            description: annotation.message,
            severity: level,
            location: {
                path: annotation.file || 'unknown',
                lines: { begin: annotation.line || 1 }
            }
        }));
    }

    private annotateAzure(annotation: BuildAnnotation): void {
        const type = annotation.type === 'error' ? 'error' : 
                    annotation.type === 'warning' ? 'warning' : 'debug';
        
        let message = `##vso[task.logissue type=${type}`;
        if (annotation.file) message += `;sourcepath=${annotation.file}`;
        if (annotation.line) message += `;linenumber=${annotation.line}`;
        if (annotation.column) message += `;columnnumber=${annotation.column}`;
        message += `]${annotation.message}`;
        
        console.log(message);
    }

    private annotateGeneric(annotation: BuildAnnotation): void {
        const prefix = annotation.type === 'error' ? '❌' :
                      annotation.type === 'warning' ? '⚠️' : 'ℹ️';
        
        let location = '';
        if (annotation.file) {
            location = ` (${annotation.file}`;
            if (annotation.line) location += `:${annotation.line}`;
            if (annotation.column) location += `:${annotation.column}`;
            location += ')';
        }

        console.log(`${prefix} ${annotation.message}${location}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OUTPUT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Set output variable
     */
    setOutput(name: string, value: string): void {
        if (!this.environment.isCI) return;

        switch (this.environment.provider) {
            case 'github':
                console.log(`::set-output name=${name}::${value}`);
                // Also write to GITHUB_OUTPUT file if available
                if (process.env.GITHUB_OUTPUT) {
                    const fs = require('fs');
                    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
                }
                break;
            case 'azure':
                console.log(`##vso[task.setvariable variable=${name}]${value}`);
                break;
            default:
                process.env[`OUTPUT_${name.toUpperCase()}`] = value;
        }
    }

    /**
     * Create group in logs
     */
    group(name: string, fn: () => void | Promise<void>): void | Promise<void> {
        this.startGroup(name);
        const result = fn();
        
        if (result instanceof Promise) {
            return result.finally(() => this.endGroup());
        }
        
        this.endGroup();
    }

    /**
     * Start log group
     */
    startGroup(name: string): void {
        if (!this.environment.isCI) {
            console.log(`\n=== ${name} ===`);
            return;
        }

        switch (this.environment.provider) {
            case 'github':
                console.log(`::group::${name}`);
                break;
            case 'azure':
                console.log(`##[group]${name}`);
                break;
            case 'gitlab':
                console.log(`\x1b[0Ksection_start:${Date.now()}:${name.replace(/\s/g, '_')}\r\x1b[0K${name}`);
                break;
            default:
                console.log(`>>> ${name}`);
        }
    }

    /**
     * End log group
     */
    endGroup(): void {
        if (!this.environment.isCI) {
            console.log('');
            return;
        }

        switch (this.environment.provider) {
            case 'github':
                console.log('::endgroup::');
                break;
            case 'azure':
                console.log('##[endgroup]');
                break;
            case 'gitlab':
                console.log('\x1b[0Ksection_end\r\x1b[0K');
                break;
            default:
                console.log('<<<');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WORKFLOW GENERATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate GitHub Actions workflow
     */
    generateGitHubWorkflow(options: {
        name?: string;
        nodeVersion?: string;
        testCommand?: string;
    } = {}): string {
        return `name: ${options.name || 'QAntum Tests'}

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '${options.nodeVersion || '20'}'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run QAntum Tests
        run: ${options.testCommand || 'npm test'}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            test-results/
            coverage/
`;
    }

    /**
     * Generate GitLab CI config
     */
    generateGitLabCI(options: {
        nodeVersion?: string;
        testCommand?: string;
    } = {}): string {
        return `image: node:${options.nodeVersion || '20'}

stages:
  - test

cache:
  paths:
    - node_modules/

test:
  stage: test
  script:
    - npm ci
    - ${options.testCommand || 'npm test'}
  artifacts:
    when: always
    paths:
      - test-results/
      - coverage/
    reports:
      junit: test-results/junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getCI = (): CIIntegration => CIIntegration.getInstance();

export default CIIntegration;
