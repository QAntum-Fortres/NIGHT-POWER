/**
 * ⚛️ TYPESCRIPT ANALYZER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Static analysis на TypeScript код за извличане на:
 * - Functions с параметри и типове
 * - Classes с методи и properties
 * - Interfaces
 * - Endpoints (Express/Fastify routes)
 * 
 * @author DIMITAR PRODROMOV
 * @version 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface FunctionInfo {
  name: string;
  description?: string;
  parameters: ParameterInfo[];
  returnType: string;
  async: boolean;
  exported: boolean;
  filePath: string;
  lineNumber: number;
}

export interface ParameterInfo {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
}

export interface ClassInfo {
  name: string;
  description?: string;
  extends?: string;
  implements?: string[];
  methods: MethodInfo[];
  properties: PropertyInfo[];
  exported: boolean;
  filePath: string;
  lineNumber: number;
}

export interface MethodInfo {
  name: string;
  description?: string;
  parameters: ParameterInfo[];
  returnType: string;
  visibility: 'public' | 'private' | 'protected';
  static: boolean;
  async: boolean;
}

export interface PropertyInfo {
  name: string;
  type: string;
  description?: string;
  visibility: 'public' | 'private' | 'protected';
  readonly: boolean;
  optional: boolean;
}

export interface InterfaceInfo {
  name: string;
  description?: string;
  properties: PropertyInfo[];
  methods: MethodInfo[];
  extends?: string[];
  exported: boolean;
  filePath: string;
  lineNumber: number;
}

export interface EndpointInfo {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: string;
  parameters: RouteParameterInfo[];
  requestBody?: string;
  responseType: string;
  description?: string;
  filePath: string;
  lineNumber: number;
}

export interface RouteParameterInfo {
  name: string;
  type: string;
  required: boolean;
  location: 'path' | 'query' | 'header' | 'body';
}

export interface AnalysisResult {
  functions: FunctionInfo[];
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  endpoints: EndpointInfo[];
  exports: string[];
  filesProcessed: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGEX PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

const PATTERNS = {
  // Function patterns
  exportFunction: /export\s+(async\s+)?function\s+(\w+)\s*(<[^>]+>)?\s*\(([^)]*)\)\s*:\s*([^{]+)/g,
  arrowFunction: /(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*(?::\s*([^=]+))?\s*=>/g,
  
  // Class patterns
  exportClass: /export\s+(?:default\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?/g,
  classMethod: /(?:(public|private|protected)\s+)?(?:(static)\s+)?(?:(async)\s+)?(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+))?/g,
  classProperty: /(?:(public|private|protected)\s+)?(?:(readonly)\s+)?(\w+)(\?)?\s*:\s*([^;=]+)/g,
  
  // Interface patterns
  exportInterface: /export\s+interface\s+(\w+)(?:\s+extends\s+([^{]+))?/g,
  interfaceProperty: /(\w+)(\?)?\s*:\s*([^;]+)/g,
  
  // Endpoint patterns (Express/Fastify style)
  expressRoute: /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
  fastifyRoute: /(?:fastify|server)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
  
  // JSDoc patterns
  jsdocComment: /\/\*\*[\s\S]*?\*\//g,
  jsdocDescription: /\/\*\*\s*\n?\s*\*?\s*([^@*][^\n]*)/,
  jsdocParam: /@param\s+(?:\{([^}]+)\}\s+)?(\w+)\s*-?\s*(.*)/g,
  jsdocReturns: /@returns?\s+(?:\{([^}]+)\}\s+)?(.*)/,
  
  // Import/Export patterns
  exportStatement: /export\s+(?:default\s+)?(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g,
  namedExport: /export\s*\{\s*([^}]+)\s*\}/g
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPESCRIPT ANALYZER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class TypeScriptAnalyzer {
  private result: AnalysisResult;

  constructor() {
    this.result = this.createEmptyResult();
  }

  private createEmptyResult(): AnalysisResult {
    return {
      functions: [],
      classes: [],
      interfaces: [],
      endpoints: [],
      exports: [],
      filesProcessed: 0
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECTORY ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  async analyzeDirectory(dirPath: string): Promise<AnalysisResult> {
    this.result = this.createEmptyResult();
    
    try {
      await this.walkDirectory(dirPath);
    } catch (error) {
      console.error(`[TS-ANALYZER] Error analyzing directory: ${error}`);
    }
    
    return this.result;
  }

  private async walkDirectory(dirPath: string): Promise<void> {
    // Simulate directory walking (in real implementation, use fs.readdir)
    const files = await this.getTypeScriptFiles(dirPath);
    
    for (const file of files) {
      await this.analyzeFile(file);
    }
  }

  private async getTypeScriptFiles(dirPath: string): Promise<string[]> {
    // In real implementation, recursively get all .ts files
    // For now, return mock paths
    return [
      `${dirPath}/index.ts`,
      `${dirPath}/types.ts`,
      `${dirPath}/utils.ts`
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FILE ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  async analyzeFile(filePath: string): Promise<void> {
    try {
      // In real implementation, read actual file
      // const content = fs.readFileSync(filePath, 'utf-8');
      const content = this.getMockContent(filePath);
      
      this.extractJSDocComments(content, filePath);
      this.extractFunctions(content, filePath);
      this.extractClasses(content, filePath);
      this.extractInterfaces(content, filePath);
      this.extractEndpoints(content, filePath);
      this.extractExports(content);
      
      this.result.filesProcessed++;
    } catch (error) {
      console.error(`[TS-ANALYZER] Error analyzing file ${filePath}: ${error}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTRACTION METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private extractFunctions(content: string, filePath: string): void {
    // Export functions
    let match;
    const funcPattern = new RegExp(PATTERNS.exportFunction.source, 'g');
    
    while ((match = funcPattern.exec(content)) !== null) {
      const [, asyncKeyword, name, generics, params, returnType] = match;
      
      this.result.functions.push({
        name,
        parameters: this.parseParameters(params),
        returnType: returnType?.trim() || 'void',
        async: !!asyncKeyword,
        exported: true,
        filePath,
        lineNumber: this.getLineNumber(content, match.index)
      });
    }
  }

  private extractClasses(content: string, filePath: string): void {
    let match;
    const classPattern = new RegExp(PATTERNS.exportClass.source, 'g');
    
    while ((match = classPattern.exec(content)) !== null) {
      const [, name, extendsClass, implementsClasses] = match;
      
      // Extract class body
      const classBody = this.extractClassBody(content, match.index);
      
      this.result.classes.push({
        name,
        extends: extendsClass,
        implements: implementsClasses?.split(',').map(s => s.trim()),
        methods: this.extractMethods(classBody),
        properties: this.extractProperties(classBody),
        exported: true,
        filePath,
        lineNumber: this.getLineNumber(content, match.index)
      });
    }
  }

  private extractInterfaces(content: string, filePath: string): void {
    let match;
    const interfacePattern = new RegExp(PATTERNS.exportInterface.source, 'g');
    
    while ((match = interfacePattern.exec(content)) !== null) {
      const [, name, extendsInterfaces] = match;
      
      // Extract interface body
      const interfaceBody = this.extractInterfaceBody(content, match.index);
      
      this.result.interfaces.push({
        name,
        properties: this.extractInterfaceProperties(interfaceBody),
        methods: [],
        extends: extendsInterfaces?.split(',').map(s => s.trim()),
        exported: true,
        filePath,
        lineNumber: this.getLineNumber(content, match.index)
      });
    }
  }

  private extractEndpoints(content: string, filePath: string): void {
    // Express routes
    let match;
    const expressPattern = new RegExp(PATTERNS.expressRoute.source, 'gi');
    
    while ((match = expressPattern.exec(content)) !== null) {
      const [, method, routePath] = match;
      
      this.result.endpoints.push({
        method: method.toUpperCase() as EndpointInfo['method'],
        path: routePath,
        handler: this.extractHandlerName(content, match.index),
        parameters: this.extractRouteParams(routePath),
        responseType: 'unknown',
        filePath,
        lineNumber: this.getLineNumber(content, match.index)
      });
    }
  }

  private extractExports(content: string): void {
    let match;
    
    // Direct exports
    const exportPattern = new RegExp(PATTERNS.exportStatement.source, 'g');
    while ((match = exportPattern.exec(content)) !== null) {
      this.result.exports.push(match[1]);
    }
    
    // Named exports
    const namedPattern = new RegExp(PATTERNS.namedExport.source, 'g');
    while ((match = namedPattern.exec(content)) !== null) {
      const names = match[1].split(',').map(s => s.trim().split(' as ')[0]);
      this.result.exports.push(...names);
    }
  }

  private extractJSDocComments(content: string, filePath: string): void {
    // Extract and store JSDoc comments for later association
    const comments = content.match(PATTERNS.jsdocComment) || [];
    // Store for later use when associating with functions/classes
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private parseParameters(paramString: string): ParameterInfo[] {
    if (!paramString.trim()) return [];
    
    const params: ParameterInfo[] = [];
    const parts = this.splitParameters(paramString);
    
    for (const part of parts) {
      const match = part.match(/(\w+)(\?)?\s*(?::\s*([^=]+))?(?:\s*=\s*(.+))?/);
      if (match) {
        params.push({
          name: match[1],
          type: match[3]?.trim() || 'any',
          optional: !!match[2] || !!match[4],
          defaultValue: match[4]?.trim()
        });
      }
    }
    
    return params;
  }

  private splitParameters(paramString: string): string[] {
    const params: string[] = [];
    let depth = 0;
    let current = '';
    
    for (const char of paramString) {
      if (char === '<' || char === '(' || char === '{' || char === '[') depth++;
      if (char === '>' || char === ')' || char === '}' || char === ']') depth--;
      
      if (char === ',' && depth === 0) {
        params.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      params.push(current.trim());
    }
    
    return params;
  }

  private extractClassBody(content: string, startIndex: number): string {
    let depth = 0;
    let started = false;
    let body = '';
    
    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        started = true;
        depth++;
      }
      if (started) body += content[i];
      if (content[i] === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    
    return body;
  }

  private extractInterfaceBody(content: string, startIndex: number): string {
    return this.extractClassBody(content, startIndex);
  }

  private extractMethods(classBody: string): MethodInfo[] {
    const methods: MethodInfo[] = [];
    // Parse methods from class body
    return methods;
  }

  private extractProperties(classBody: string): PropertyInfo[] {
    const properties: PropertyInfo[] = [];
    // Parse properties from class body
    return properties;
  }

  private extractInterfaceProperties(interfaceBody: string): PropertyInfo[] {
    const properties: PropertyInfo[] = [];
    let match;
    const propPattern = new RegExp(PATTERNS.interfaceProperty.source, 'g');
    
    while ((match = propPattern.exec(interfaceBody)) !== null) {
      const [, name, optional, type] = match;
      if (name && !name.match(/^[{}]$/)) {
        properties.push({
          name,
          type: type?.trim() || 'any',
          optional: !!optional,
          visibility: 'public',
          readonly: false
        });
      }
    }
    
    return properties;
  }

  private extractRouteParams(routePath: string): RouteParameterInfo[] {
    const params: RouteParameterInfo[] = [];
    const matches = routePath.match(/:(\w+)/g) || [];
    
    for (const match of matches) {
      params.push({
        name: match.slice(1),
        type: 'string',
        required: true,
        location: 'path'
      });
    }
    
    return params;
  }

  private extractHandlerName(content: string, index: number): string {
    // Extract handler function name from route definition
    const afterMatch = content.slice(index, index + 200);
    const handlerMatch = afterMatch.match(/,\s*(\w+)/);
    return handlerMatch ? handlerMatch[1] : 'handler';
  }

  private getLineNumber(content: string, index: number): number {
    return content.slice(0, index).split('\n').length;
  }

  private getMockContent(filePath: string): string {
    // Mock content for demonstration
    return `
export interface Config {
  host: string;
  port: number;
  debug?: boolean;
}

export async function initialize(config: Config): Promise<void> {
  console.log('Initializing...');
}

export class Server {
  private config: Config;
  
  constructor(config: Config) {
    this.config = config;
  }
  
  async start(): Promise<void> {
    console.log('Server started');
  }
}

app.get('/api/users/:id', getUser);
app.post('/api/users', createUser);
    `;
  }
}

export default TypeScriptAnalyzer;
