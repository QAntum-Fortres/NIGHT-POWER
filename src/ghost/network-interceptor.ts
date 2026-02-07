/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM NETWORK INTERCEPTOR                                                  ║
 * ║   "Capture, mock, and replay network traffic"                                 ║
 * ║                                                                               ║
 * ║   TODO B #23 - Ghost: Network Interception                                    ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface NetworkRequest {
    id: string;
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string | Buffer;
    timestamp: number;
}

export interface NetworkResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: string | Buffer;
    duration: number;
}

export interface InterceptedCall {
    request: NetworkRequest;
    response?: NetworkResponse;
    mocked: boolean;
    blocked: boolean;
    error?: string;
}

export interface MockRule {
    id: string;
    pattern: string | RegExp;
    method?: string;
    response: Partial<NetworkResponse> | ((req: NetworkRequest) => NetworkResponse);
    delay?: number;
    times?: number;
    used: number;
}

export interface InterceptionOptions {
    enabled?: boolean;
    recordMode?: boolean;
    blockThirdParty?: boolean;
    allowedDomains?: string[];
    timeout?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NETWORK INTERCEPTOR
// ═══════════════════════════════════════════════════════════════════════════════

export class NetworkInterceptor {
    private static instance: NetworkInterceptor;

    private enabled: boolean = false;
    private recording: boolean = false;
    private mockRules: Map<string, MockRule> = new Map();
    private recordings: InterceptedCall[] = [];
    private options: InterceptionOptions = {};

    static getInstance(): NetworkInterceptor {
        if (!NetworkInterceptor.instance) {
            NetworkInterceptor.instance = new NetworkInterceptor();
        }
        return NetworkInterceptor.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LIFECYCLE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Enable interception
     */
    enable(options: InterceptionOptions = {}): void {
        this.enabled = true;
        this.options = options;
        console.log('[NetworkInterceptor] Enabled');
    }

    /**
     * Disable interception
     */
    disable(): void {
        this.enabled = false;
        console.log('[NetworkInterceptor] Disabled');
    }

    /**
     * Check if enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MOCKING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Add mock rule
     */
    mock(
        pattern: string | RegExp,
        response: Partial<NetworkResponse> | ((req: NetworkRequest) => NetworkResponse),
        options?: { method?: string; delay?: number; times?: number }
    ): string {
        const id = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        this.mockRules.set(id, {
            id,
            pattern,
            method: options?.method,
            response,
            delay: options?.delay,
            times: options?.times,
            used: 0
        });

        return id;
    }

    /**
     * Mock GET request
     */
    mockGet(
        pattern: string | RegExp,
        response: Partial<NetworkResponse>,
        options?: { delay?: number; times?: number }
    ): string {
        return this.mock(pattern, response, { ...options, method: 'GET' });
    }

    /**
     * Mock POST request
     */
    mockPost(
        pattern: string | RegExp,
        response: Partial<NetworkResponse>,
        options?: { delay?: number; times?: number }
    ): string {
        return this.mock(pattern, response, { ...options, method: 'POST' });
    }

    /**
     * Mock API endpoint
     */
    mockApi(
        endpoint: string,
        data: any,
        options?: { status?: number; delay?: number }
    ): string {
        return this.mock(endpoint, {
            status: options?.status || 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data)
        }, { delay: options?.delay });
    }

    /**
     * Remove mock rule
     */
    unmock(id: string): boolean {
        return this.mockRules.delete(id);
    }

    /**
     * Clear all mocks
     */
    clearMocks(): void {
        this.mockRules.clear();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERCEPTION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Intercept request
     */
    async intercept(request: NetworkRequest): Promise<NetworkResponse | null> {
        if (!this.enabled) return null;

        // Check third-party blocking
        if (this.options.blockThirdParty) {
            const url = new URL(request.url);
            if (!this.isAllowedDomain(url.hostname)) {
                this.record(request, undefined, false, true);
                throw new Error(`Blocked third-party request to ${url.hostname}`);
            }
        }

        // Find matching mock
        const mock = this.findMatchingMock(request);
        
        if (mock) {
            // Check times limit
            if (mock.times !== undefined && mock.used >= mock.times) {
                return null;
            }

            mock.used++;

            // Apply delay
            if (mock.delay) {
                await this.delay(mock.delay);
            }

            // Generate response
            const response = typeof mock.response === 'function'
                ? mock.response(request)
                : {
                    status: mock.response.status || 200,
                    statusText: mock.response.statusText || 'OK',
                    headers: mock.response.headers || {},
                    body: mock.response.body,
                    duration: mock.delay || 0
                };

            this.record(request, response, true, false);
            return response;
        }

        return null;
    }

    /**
     * Block request
     */
    block(pattern: string | RegExp, errorMessage: string = 'Request blocked'): string {
        return this.mock(pattern, () => {
            throw new Error(errorMessage);
        });
    }

    /**
     * Abort request
     */
    abort(pattern: string | RegExp): string {
        return this.block(pattern, 'Request aborted');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RECORDING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Start recording
     */
    startRecording(): void {
        this.recording = true;
        this.recordings = [];
        console.log('[NetworkInterceptor] Recording started');
    }

    /**
     * Stop recording
     */
    stopRecording(): InterceptedCall[] {
        this.recording = false;
        console.log(`[NetworkInterceptor] Recording stopped. ${this.recordings.length} calls recorded`);
        return [...this.recordings];
    }

    /**
     * Get recordings
     */
    getRecordings(): InterceptedCall[] {
        return [...this.recordings];
    }

    /**
     * Clear recordings
     */
    clearRecordings(): void {
        this.recordings = [];
    }

    /**
     * Replay recordings as mocks
     */
    replayRecordings(): number {
        let count = 0;

        for (const call of this.recordings) {
            if (call.response && !call.blocked) {
                this.mock(call.request.url, call.response, {
                    method: call.request.method
                });
                count++;
            }
        }

        return count;
    }

    /**
     * Export recordings as HAR
     */
    exportAsHAR(): object {
        return {
            log: {
                version: '1.2',
                creator: { name: 'QAntum NetworkInterceptor', version: '1.0' },
                entries: this.recordings.map(call => ({
                    startedDateTime: new Date(call.request.timestamp).toISOString(),
                    time: call.response?.duration || 0,
                    request: {
                        method: call.request.method,
                        url: call.request.url,
                        headers: Object.entries(call.request.headers).map(([name, value]) => ({ name, value })),
                        postData: call.request.body ? { text: call.request.body.toString() } : undefined
                    },
                    response: call.response ? {
                        status: call.response.status,
                        statusText: call.response.statusText,
                        headers: Object.entries(call.response.headers).map(([name, value]) => ({ name, value })),
                        content: {
                            text: call.response.body?.toString()
                        }
                    } : undefined
                }))
            }
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WAITING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Wait for request matching pattern
     */
    async waitForRequest(
        pattern: string | RegExp,
        options?: { timeout?: number; method?: string }
    ): Promise<NetworkRequest> {
        const timeout = options?.timeout || 30000;
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                const match = this.recordings.find(call => {
                    if (options?.method && call.request.method !== options.method) {
                        return false;
                    }
                    return this.matchesPattern(call.request.url, pattern);
                });

                if (match) {
                    clearInterval(checkInterval);
                    resolve(match.request);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    reject(new Error(`Timeout waiting for request matching ${pattern}`));
                }
            }, 100);
        });
    }

    /**
     * Wait for response matching pattern
     */
    async waitForResponse(
        pattern: string | RegExp,
        options?: { timeout?: number }
    ): Promise<InterceptedCall> {
        const timeout = options?.timeout || 30000;
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                const match = this.recordings.find(call => 
                    call.response && this.matchesPattern(call.request.url, pattern)
                );

                if (match) {
                    clearInterval(checkInterval);
                    resolve(match);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    reject(new Error(`Timeout waiting for response matching ${pattern}`));
                }
            }, 100);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATISTICS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get interception statistics
     */
    getStatistics(): {
        totalCalls: number;
        mockedCalls: number;
        blockedCalls: number;
        byMethod: Record<string, number>;
        byDomain: Record<string, number>;
        avgDuration: number;
    } {
        const stats = {
            totalCalls: this.recordings.length,
            mockedCalls: this.recordings.filter(c => c.mocked).length,
            blockedCalls: this.recordings.filter(c => c.blocked).length,
            byMethod: {} as Record<string, number>,
            byDomain: {} as Record<string, number>,
            avgDuration: 0
        };

        let totalDuration = 0;
        let durationCount = 0;

        for (const call of this.recordings) {
            // By method
            stats.byMethod[call.request.method] = (stats.byMethod[call.request.method] || 0) + 1;

            // By domain
            try {
                const domain = new URL(call.request.url).hostname;
                stats.byDomain[domain] = (stats.byDomain[domain] || 0) + 1;
            } catch {}

            // Duration
            if (call.response?.duration) {
                totalDuration += call.response.duration;
                durationCount++;
            }
        }

        stats.avgDuration = durationCount > 0 ? totalDuration / durationCount : 0;

        return stats;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE
    // ─────────────────────────────────────────────────────────────────────────

    private findMatchingMock(request: NetworkRequest): MockRule | undefined {
        for (const mock of this.mockRules.values()) {
            if (mock.method && mock.method !== request.method) {
                continue;
            }

            if (this.matchesPattern(request.url, mock.pattern)) {
                return mock;
            }
        }
        return undefined;
    }

    private matchesPattern(url: string, pattern: string | RegExp): boolean {
        if (typeof pattern === 'string') {
            // Glob-like matching
            if (pattern.includes('*')) {
                const regex = new RegExp(
                    '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
                );
                return regex.test(url);
            }
            return url.includes(pattern);
        }
        return pattern.test(url);
    }

    private isAllowedDomain(domain: string): boolean {
        if (!this.options.allowedDomains?.length) return true;
        return this.options.allowedDomains.some(allowed => 
            domain === allowed || domain.endsWith('.' + allowed)
        );
    }

    private record(
        request: NetworkRequest,
        response: NetworkResponse | undefined,
        mocked: boolean,
        blocked: boolean,
        error?: string
    ): void {
        if (this.recording || this.enabled) {
            this.recordings.push({
                request,
                response,
                mocked,
                blocked,
                error
            });
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getNetworkInterceptor = (): NetworkInterceptor => NetworkInterceptor.getInstance();

export default NetworkInterceptor;
