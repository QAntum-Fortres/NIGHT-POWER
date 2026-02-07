/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM FILE STORAGE                                                         ║
 * ║   "Unified file storage operations"                                           ║
 * ║                                                                               ║
 * ║   TODO B #31 - Storage: File Operations                                       ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface FileInfo {
    path: string;
    name: string;
    extension: string;
    size: number;
    createdAt: Date;
    modifiedAt: Date;
    isDirectory: boolean;
    isFile: boolean;
}

export interface DirectoryInfo {
    path: string;
    name: string;
    files: FileInfo[];
    directories: DirectoryInfo[];
    totalSize: number;
    fileCount: number;
}

export interface WriteOptions {
    encoding?: BufferEncoding;
    mode?: number;
    flag?: string;
    append?: boolean;
}

export interface ReadOptions {
    encoding?: BufferEncoding;
    flag?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILE STORAGE
// ═══════════════════════════════════════════════════════════════════════════════

export class FileStorage {
    private static instance: FileStorage;
    private basePath: string;

    private constructor() {
        this.basePath = process.cwd();
    }

    static getInstance(): FileStorage {
        if (!FileStorage.instance) {
            FileStorage.instance = new FileStorage();
        }
        return FileStorage.instance;
    }

    /**
     * Set base path
     */
    setBasePath(basePath: string): this {
        this.basePath = basePath;
        return this;
    }

    /**
     * Get base path
     */
    getBasePath(): string {
        return this.basePath;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READ OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Read file as string
     */
    async read(filePath: string, options?: ReadOptions): Promise<string> {
        const fullPath = this.resolvePath(filePath);
        return fs.promises.readFile(fullPath, { 
            encoding: options?.encoding || 'utf-8',
            flag: options?.flag
        });
    }

    /**
     * Read file sync
     */
    readSync(filePath: string, options?: ReadOptions): string {
        const fullPath = this.resolvePath(filePath);
        return fs.readFileSync(fullPath, { 
            encoding: options?.encoding || 'utf-8',
            flag: options?.flag
        });
    }

    /**
     * Read file as JSON
     */
    async readJSON<T = any>(filePath: string): Promise<T> {
        const content = await this.read(filePath);
        return JSON.parse(content);
    }

    /**
     * Read file as buffer
     */
    async readBuffer(filePath: string): Promise<Buffer> {
        const fullPath = this.resolvePath(filePath);
        return fs.promises.readFile(fullPath);
    }

    /**
     * Read file lines
     */
    async readLines(filePath: string): Promise<string[]> {
        const content = await this.read(filePath);
        return content.split(/\r?\n/);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WRITE OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Write file
     */
    async write(filePath: string, content: string | Buffer, options?: WriteOptions): Promise<void> {
        const fullPath = this.resolvePath(filePath);
        await this.ensureDir(path.dirname(fullPath));

        if (options?.append) {
            await fs.promises.appendFile(fullPath, content, {
                encoding: options?.encoding,
                mode: options?.mode,
                flag: options?.flag
            });
        } else {
            await fs.promises.writeFile(fullPath, content, {
                encoding: options?.encoding,
                mode: options?.mode,
                flag: options?.flag
            });
        }
    }

    /**
     * Write file sync
     */
    writeSync(filePath: string, content: string | Buffer, options?: WriteOptions): void {
        const fullPath = this.resolvePath(filePath);
        this.ensureDirSync(path.dirname(fullPath));

        if (options?.append) {
            fs.appendFileSync(fullPath, content, {
                encoding: options?.encoding,
                mode: options?.mode,
                flag: options?.flag
            });
        } else {
            fs.writeFileSync(fullPath, content, {
                encoding: options?.encoding,
                mode: options?.mode,
                flag: options?.flag
            });
        }
    }

    /**
     * Write JSON file
     */
    async writeJSON(filePath: string, data: any, pretty: boolean = true): Promise<void> {
        const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        await this.write(filePath, content);
    }

    /**
     * Append to file
     */
    async append(filePath: string, content: string | Buffer): Promise<void> {
        await this.write(filePath, content, { append: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FILE OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Check if file exists
     */
    async exists(filePath: string): Promise<boolean> {
        const fullPath = this.resolvePath(filePath);
        try {
            await fs.promises.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if exists sync
     */
    existsSync(filePath: string): boolean {
        const fullPath = this.resolvePath(filePath);
        return fs.existsSync(fullPath);
    }

    /**
     * Delete file
     */
    async delete(filePath: string): Promise<void> {
        const fullPath = this.resolvePath(filePath);
        await fs.promises.unlink(fullPath);
    }

    /**
     * Copy file
     */
    async copy(src: string, dest: string): Promise<void> {
        const srcPath = this.resolvePath(src);
        const destPath = this.resolvePath(dest);
        await this.ensureDir(path.dirname(destPath));
        await fs.promises.copyFile(srcPath, destPath);
    }

    /**
     * Move file
     */
    async move(src: string, dest: string): Promise<void> {
        const srcPath = this.resolvePath(src);
        const destPath = this.resolvePath(dest);
        await this.ensureDir(path.dirname(destPath));
        await fs.promises.rename(srcPath, destPath);
    }

    /**
     * Get file info
     */
    async info(filePath: string): Promise<FileInfo> {
        const fullPath = this.resolvePath(filePath);
        const stats = await fs.promises.stat(fullPath);
        const parsed = path.parse(fullPath);

        return {
            path: fullPath,
            name: parsed.name,
            extension: parsed.ext,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile()
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DIRECTORY OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create directory
     */
    async mkdir(dirPath: string): Promise<void> {
        const fullPath = this.resolvePath(dirPath);
        await fs.promises.mkdir(fullPath, { recursive: true });
    }

    /**
     * Ensure directory exists
     */
    async ensureDir(dirPath: string): Promise<void> {
        const fullPath = this.resolvePath(dirPath);
        await fs.promises.mkdir(fullPath, { recursive: true });
    }

    /**
     * Ensure directory exists sync
     */
    ensureDirSync(dirPath: string): void {
        const fullPath = this.resolvePath(dirPath);
        fs.mkdirSync(fullPath, { recursive: true });
    }

    /**
     * List directory contents
     */
    async list(dirPath: string): Promise<string[]> {
        const fullPath = this.resolvePath(dirPath);
        return fs.promises.readdir(fullPath);
    }

    /**
     * List files with info
     */
    async listFiles(dirPath: string): Promise<FileInfo[]> {
        const fullPath = this.resolvePath(dirPath);
        const names = await fs.promises.readdir(fullPath);
        
        const files: FileInfo[] = [];
        for (const name of names) {
            const filePath = path.join(fullPath, name);
            const info = await this.info(filePath);
            files.push(info);
        }

        return files;
    }

    /**
     * Read directory recursively
     */
    async readDirRecursive(dirPath: string): Promise<DirectoryInfo> {
        const fullPath = this.resolvePath(dirPath);
        return this.readDirRecursiveInternal(fullPath);
    }

    private async readDirRecursiveInternal(dirPath: string): Promise<DirectoryInfo> {
        const names = await fs.promises.readdir(dirPath);
        const result: DirectoryInfo = {
            path: dirPath,
            name: path.basename(dirPath),
            files: [],
            directories: [],
            totalSize: 0,
            fileCount: 0
        };

        for (const name of names) {
            const itemPath = path.join(dirPath, name);
            const stats = await fs.promises.stat(itemPath);

            if (stats.isDirectory()) {
                const subDir = await this.readDirRecursiveInternal(itemPath);
                result.directories.push(subDir);
                result.totalSize += subDir.totalSize;
                result.fileCount += subDir.fileCount;
            } else {
                const info = await this.info(itemPath);
                result.files.push(info);
                result.totalSize += stats.size;
                result.fileCount++;
            }
        }

        return result;
    }

    /**
     * Remove directory
     */
    async rmdir(dirPath: string, recursive: boolean = false): Promise<void> {
        const fullPath = this.resolvePath(dirPath);
        await fs.promises.rm(fullPath, { recursive, force: recursive });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GLOB OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Find files by pattern
     */
    async glob(pattern: string, dirPath?: string): Promise<string[]> {
        const searchPath = dirPath ? this.resolvePath(dirPath) : this.basePath;
        const files: string[] = [];

        await this.globRecursive(searchPath, pattern, files);
        return files;
    }

    private async globRecursive(dirPath: string, pattern: string, results: string[]): Promise<void> {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        const regex = this.globToRegex(pattern);

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            const relativePath = path.relative(this.basePath, fullPath);

            if (entry.isDirectory()) {
                await this.globRecursive(fullPath, pattern, results);
            } else if (regex.test(relativePath) || regex.test(entry.name)) {
                results.push(fullPath);
            }
        }
    }

    private globToRegex(pattern: string): RegExp {
        const escaped = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        return new RegExp(`^${escaped}$`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private resolvePath(filePath: string): string {
        if (path.isAbsolute(filePath)) {
            return filePath;
        }
        return path.join(this.basePath, filePath);
    }

    /**
     * Join paths
     */
    join(...paths: string[]): string {
        return path.join(...paths);
    }

    /**
     * Get directory name
     */
    dirname(filePath: string): string {
        return path.dirname(filePath);
    }

    /**
     * Get base name
     */
    basename(filePath: string, ext?: string): string {
        return path.basename(filePath, ext);
    }

    /**
     * Get extension
     */
    extname(filePath: string): string {
        return path.extname(filePath);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getFileStorage = (): FileStorage => FileStorage.getInstance();

// Quick file operations
export const file = {
    read: (path: string) => FileStorage.getInstance().read(path),
    write: (path: string, content: string | Buffer) => FileStorage.getInstance().write(path, content),
    readJSON: <T>(path: string) => FileStorage.getInstance().readJSON<T>(path),
    writeJSON: (path: string, data: any) => FileStorage.getInstance().writeJSON(path, data),
    exists: (path: string) => FileStorage.getInstance().exists(path),
    delete: (path: string) => FileStorage.getInstance().delete(path),
    copy: (src: string, dest: string) => FileStorage.getInstance().copy(src, dest),
    move: (src: string, dest: string) => FileStorage.getInstance().move(src, dest),
    mkdir: (path: string) => FileStorage.getInstance().mkdir(path),
    list: (path: string) => FileStorage.getInstance().list(path),
    glob: (pattern: string, dir?: string) => FileStorage.getInstance().glob(pattern, dir)
};

export default FileStorage;
