/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM API VERSIONING                                                       ║
 * ║   "Semantic versioning for API routes"                                        ║
 * ║                                                                               ║
 * ║   TODO B #45 - API: Versioning                                                ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SemanticVersion {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
}

export interface VersionedRoute {
    path: string;
    versions: Map<string, RouteHandler>;
    deprecated: Map<string, DeprecationInfo>;
}

export type RouteHandler = (...args: any[]) => any;

export interface DeprecationInfo {
    since: string;
    sunset: string;
    replacement?: string;
    message?: string;
}

export interface VersionConfig {
    header?: string;          // e.g., 'X-API-Version'
    queryParam?: string;      // e.g., 'api-version'
    urlPrefix?: boolean;      // e.g., /v1/users
    defaultVersion: string;
    supportedVersions: string[];
}

export interface VersionNegotiationResult {
    version: string;
    source: 'header' | 'query' | 'url' | 'default';
    isDeprecated: boolean;
    deprecationInfo?: DeprecationInfo;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERSION PARSER
// ═══════════════════════════════════════════════════════════════════════════════

export class VersionParser {
    private static readonly VERSION_REGEX = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-(.+))?$/;

    /**
     * Parse version string to SemanticVersion
     */
    static parse(version: string): SemanticVersion | null {
        const match = version.match(this.VERSION_REGEX);
        if (!match) return null;

        return {
            major: parseInt(match[1], 10),
            minor: match[2] ? parseInt(match[2], 10) : 0,
            patch: match[3] ? parseInt(match[3], 10) : 0,
            prerelease: match[4]
        };
    }

    /**
     * Convert SemanticVersion to string
     */
    static stringify(version: SemanticVersion): string {
        let str = `${version.major}.${version.minor}.${version.patch}`;
        if (version.prerelease) {
            str += `-${version.prerelease}`;
        }
        return str;
    }

    /**
     * Compare two versions
     * Returns: -1 if a < b, 0 if equal, 1 if a > b
     */
    static compare(a: string | SemanticVersion, b: string | SemanticVersion): number {
        const vA = typeof a === 'string' ? this.parse(a) : a;
        const vB = typeof b === 'string' ? this.parse(b) : b;

        if (!vA || !vB) return 0;

        if (vA.major !== vB.major) return vA.major > vB.major ? 1 : -1;
        if (vA.minor !== vB.minor) return vA.minor > vB.minor ? 1 : -1;
        if (vA.patch !== vB.patch) return vA.patch > vB.patch ? 1 : -1;

        // Pre-release versions have lower precedence
        if (vA.prerelease && !vB.prerelease) return -1;
        if (!vA.prerelease && vB.prerelease) return 1;
        if (vA.prerelease && vB.prerelease) {
            return vA.prerelease.localeCompare(vB.prerelease);
        }

        return 0;
    }

    /**
     * Check if version satisfies a range
     */
    static satisfies(version: string, range: string): boolean {
        const parsed = this.parse(version);
        if (!parsed) return false;

        // Handle exact match
        if (!range.includes('^') && !range.includes('~') && !range.includes('-')) {
            const rangeVer = this.parse(range);
            return rangeVer ? this.compare(parsed, rangeVer) === 0 : false;
        }

        // Handle caret range (^1.2.3 = >=1.2.3 <2.0.0)
        if (range.startsWith('^')) {
            const base = this.parse(range.slice(1));
            if (!base) return false;

            if (this.compare(parsed, base) < 0) return false;
            if (parsed.major !== base.major) return false;
            return true;
        }

        // Handle tilde range (~1.2.3 = >=1.2.3 <1.3.0)
        if (range.startsWith('~')) {
            const base = this.parse(range.slice(1));
            if (!base) return false;

            if (this.compare(parsed, base) < 0) return false;
            if (parsed.major !== base.major) return false;
            if (parsed.minor !== base.minor) return false;
            return true;
        }

        // Handle range (1.0.0-2.0.0)
        if (range.includes(' - ')) {
            const [minStr, maxStr] = range.split(' - ');
            const min = this.parse(minStr.trim());
            const max = this.parse(maxStr.trim());
            if (!min || !max) return false;

            return this.compare(parsed, min) >= 0 && this.compare(parsed, max) <= 0;
        }

        return false;
    }

    /**
     * Get major version number
     */
    static major(version: string): number {
        const parsed = this.parse(version);
        return parsed ? parsed.major : 0;
    }

    /**
     * Check if breaking change (major version bump)
     */
    static isBreaking(oldVersion: string, newVersion: string): boolean {
        return this.major(newVersion) > this.major(oldVersion);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// API VERSION MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class APIVersionManager {
    private routes: Map<string, VersionedRoute> = new Map();
    private config: VersionConfig;
    private deprecations: Map<string, DeprecationInfo> = new Map();

    constructor(config: Partial<VersionConfig> = {}) {
        this.config = {
            header: 'X-API-Version',
            queryParam: 'version',
            urlPrefix: true,
            defaultVersion: '1.0.0',
            supportedVersions: ['1.0.0'],
            ...config
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ROUTE REGISTRATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Register a versioned route
     */
    register(
        path: string,
        version: string,
        handler: RouteHandler
    ): this {
        let route = this.routes.get(path);

        if (!route) {
            route = {
                path,
                versions: new Map(),
                deprecated: new Map()
            };
            this.routes.set(path, route);
        }

        route.versions.set(version, handler);

        // Add to supported versions if not present
        if (!this.config.supportedVersions.includes(version)) {
            this.config.supportedVersions.push(version);
            this.config.supportedVersions.sort((a, b) => VersionParser.compare(a, b));
        }

        return this;
    }

    /**
     * Mark a version as deprecated
     */
    deprecate(
        version: string,
        sunset: string,
        replacement?: string,
        message?: string
    ): this {
        this.deprecations.set(version, {
            since: new Date().toISOString().split('T')[0],
            sunset,
            replacement,
            message
        });
        return this;
    }

    /**
     * Deprecate a specific route version
     */
    deprecateRoute(
        path: string,
        version: string,
        info: DeprecationInfo
    ): this {
        const route = this.routes.get(path);
        if (route) {
            route.deprecated.set(version, info);
        }
        return this;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VERSION RESOLUTION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Resolve handler for a path and version
     */
    resolve(path: string, version?: string): {
        handler: RouteHandler | null;
        version: string;
        deprecated: boolean;
        deprecationInfo?: DeprecationInfo;
    } {
        const effectiveVersion = version || this.config.defaultVersion;
        const route = this.routes.get(path);

        if (!route) {
            return {
                handler: null,
                version: effectiveVersion,
                deprecated: false
            };
        }

        // Exact match
        let handler = route.versions.get(effectiveVersion);

        // Fallback to closest lower version
        if (!handler) {
            const versions = [...route.versions.keys()]
                .sort((a, b) => VersionParser.compare(b, a));  // Descending

            for (const v of versions) {
                if (VersionParser.compare(v, effectiveVersion) <= 0) {
                    handler = route.versions.get(v);
                    break;
                }
            }
        }

        // Check deprecation
        const routeDeprecation = route.deprecated.get(effectiveVersion);
        const globalDeprecation = this.deprecations.get(effectiveVersion);
        const deprecationInfo = routeDeprecation || globalDeprecation;

        return {
            handler: handler || null,
            version: effectiveVersion,
            deprecated: !!deprecationInfo,
            deprecationInfo
        };
    }

    /**
     * Negotiate version from request context
     */
    negotiate(context: {
        headers?: Record<string, string>;
        query?: Record<string, string>;
        url?: string;
    }): VersionNegotiationResult {
        let version: string | undefined;
        let source: 'header' | 'query' | 'url' | 'default' = 'default';

        // Check URL prefix first
        if (this.config.urlPrefix && context.url) {
            const match = context.url.match(/\/v(\d+(?:\.\d+)?(?:\.\d+)?)\//);
            if (match) {
                version = match[1];
                source = 'url';
            }
        }

        // Check header
        if (!version && context.headers && this.config.header) {
            version = context.headers[this.config.header] || 
                      context.headers[this.config.header.toLowerCase()];
            if (version) source = 'header';
        }

        // Check query param
        if (!version && context.query && this.config.queryParam) {
            version = context.query[this.config.queryParam];
            if (version) source = 'query';
        }

        // Use default
        const finalVersion = version || this.config.defaultVersion;
        const deprecationInfo = this.deprecations.get(finalVersion);

        return {
            version: finalVersion,
            source,
            isDeprecated: !!deprecationInfo,
            deprecationInfo
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERIES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get all supported versions
     */
    getSupportedVersions(): string[] {
        return [...this.config.supportedVersions];
    }

    /**
     * Get latest version
     */
    getLatestVersion(): string {
        const versions = this.getSupportedVersions();
        return versions[versions.length - 1] || this.config.defaultVersion;
    }

    /**
     * Check if version is supported
     */
    isSupported(version: string): boolean {
        return this.config.supportedVersions.some(v => 
            VersionParser.major(v) === VersionParser.major(version)
        );
    }

    /**
     * Get all routes for a version
     */
    getRoutesForVersion(version: string): string[] {
        const paths: string[] = [];

        for (const [path, route] of this.routes) {
            if (route.versions.has(version)) {
                paths.push(path);
            }
        }

        return paths;
    }

    /**
     * Get deprecation info for a version
     */
    getDeprecationInfo(version: string): DeprecationInfo | undefined {
        return this.deprecations.get(version);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════════

const versionMetadata = new Map<any, Map<string, string[]>>();

/**
 * @Version - Mark method as available for specific versions
 */
export function Version(...versions: string[]): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const key = String(propertyKey);
        
        if (!versionMetadata.has(target.constructor)) {
            versionMetadata.set(target.constructor, new Map());
        }
        
        versionMetadata.get(target.constructor)!.set(key, versions);
        
        return descriptor;
    };
}

/**
 * @Deprecated - Mark method as deprecated
 */
export function Deprecated(sunset: string, replacement?: string): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;

        descriptor.value = function (...args: any[]) {
            console.warn(
                `[DEPRECATED] ${String(propertyKey)} is deprecated. ` +
                `Sunset: ${sunset}. ` +
                (replacement ? `Use ${replacement} instead.` : '')
            );
            return original.apply(this, args);
        };

        return descriptor;
    };
}

/**
 * @Since - Mark method as available since version
 */
export function Since(version: string): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;

        descriptor.value = function (this: any, ...args: any[]) {
            const requestVersion = (this as any)._currentVersion || '1.0.0';
            
            if (VersionParser.compare(requestVersion, version) < 0) {
                throw new Error(
                    `${String(propertyKey)} requires API version ${version} or higher. ` +
                    `Current: ${requestVersion}`
                );
            }
            
            return original.apply(this, args);
        };

        return descriptor;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIGRATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export interface Migration {
    fromVersion: string;
    toVersion: string;
    transformRequest?: (req: any) => any;
    transformResponse?: (res: any) => any;
}

export class MigrationManager {
    private migrations: Migration[] = [];

    /**
     * Register a migration
     */
    register(migration: Migration): this {
        this.migrations.push(migration);
        return this;
    }

    /**
     * Transform request from old version to new
     */
    upgradeRequest(request: any, fromVersion: string, toVersion: string): any {
        const path = this.findMigrationPath(fromVersion, toVersion);
        
        let result = request;
        for (const migration of path) {
            if (migration.transformRequest) {
                result = migration.transformRequest(result);
            }
        }
        
        return result;
    }

    /**
     * Transform response from new version to old
     */
    downgradeResponse(response: any, fromVersion: string, toVersion: string): any {
        const path = this.findMigrationPath(toVersion, fromVersion).reverse();
        
        let result = response;
        for (const migration of path) {
            if (migration.transformResponse) {
                result = migration.transformResponse(result);
            }
        }
        
        return result;
    }

    private findMigrationPath(from: string, to: string): Migration[] {
        const path: Migration[] = [];
        let current = from;

        while (VersionParser.compare(current, to) < 0) {
            const next = this.migrations.find(m => m.fromVersion === current);
            if (!next) break;
            path.push(next);
            current = next.toVersion;
        }

        return path;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const createVersionManager = (config?: Partial<VersionConfig>): APIVersionManager => {
    return new APIVersionManager(config);
};

export const createMigrationManager = (): MigrationManager => {
    return new MigrationManager();
};

export default APIVersionManager;
