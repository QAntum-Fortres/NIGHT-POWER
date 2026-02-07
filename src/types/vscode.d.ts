declare module 'vscode' {
    export interface ExtensionContext { subscriptions: { dispose(): any }[]; extensionPath: string; extensionUri: Uri; globalState: any; secrets: any; }
    export interface Webview { asWebviewUri(localResource: Uri): Uri; html: string; onDidReceiveMessage: Event<any>; postMessage(message: any): Thenable<boolean>; cspSource: string; }
    export interface CancellationToken { isCancellationRequested: boolean; onCancellationRequested: any; }
    export interface WebviewView { webview: any; show(preserveFocus?: boolean): void; }
    export interface WebviewViewResolveContext { [key: string]: any; }
    export interface WebviewViewProvider { resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext, token: CancellationToken): Thenable<void> | void; }
    export interface TreeDataProvider<T> { onDidChangeTreeData?: Event<T | undefined | null | void>; getTreeItem(element: T): TreeItem | Thenable<TreeItem>; getChildren(element?: T): ProviderResult<T[]>; }
    export class TreeItem { constructor(label: string | any, collapsibleState?: TreeItemCollapsibleState); id?: string; iconPath?: any; contextValue?: string; command?: any; label?: string | any; description?: string | boolean; }
    export interface Event<T> { (listener: (e: T) => any, thisArgs?: any, disposables?: any[]): Disposable; }
    export interface EventEmitter<T> { event: Event<T>; fire(data?: T): void; dispose(): void; }
    export class Disposable { static from(...disposableLikes: { dispose: () => any }[]): Disposable; constructor(callOnDispose: Function); dispose(): any; }
    export interface Uri { fsPath: string; toString(): string; with(change: any): Uri; }
    export namespace Uri { function file(path: string): Uri; function parse(path: string): Uri; }
    export class Range { constructor(startLine: number, startChar: number, endLine: number, endChar: number); constructor(start: Position, end: Position); }
    export class Position { constructor(line: number, char: number); line: number; character: number; }
    export enum ViewColumn { One = 1, Two = 2, Three = 3, Active = -1, Beside = -2 }
    export enum TreeItemCollapsibleState { None = 0, Collapsed = 1, Expanded = 2 }
    export enum StatusBarAlignment { Left = 1, Right = 2 }
    export enum ProgressLocation { SourceControl = 1, Window = 10, Notification = 15 }
    export type ProviderResult<T> = T | undefined | null | Thenable<T | undefined | null>;
    export class ThemeIcon { constructor(id: string, color?: any); }
    export class ThemeColor { constructor(id: string); }
    export interface TextDocument { uri: Uri; fileName: string; isUntitled: boolean; languageId: string; version: number; isDirty: boolean; save(): Thenable<boolean>; getText(range?: Range): string; positionAt(offset: number): Position; offsetAt(position: Position): number; lineAt(line: number): any; lineAt(position: Position): any; lineCount: number; }
    export interface InlineCompletionItem { insertText: string | any; range?: Range; command?: any; }
    export interface InlineCompletionContext { triggerKind: any; selectedCompletionInfo?: any; }

    export namespace languages {
        export function registerInlineCompletionItemProvider(selector: any, provider: any): Disposable;
        export function createDiagnosticCollection(name?: string): any;
    }

    export namespace window {
        export function createOutputChannel(name: string): any;
        export function showInformationMessage(message: string, ...items: any[]): Thenable<any>;
        export function showErrorMessage(message: string, ...items: any[]): Thenable<any>;
        export function showWarningMessage(message: string, ...items: any[]): Thenable<any>;
        export function showInputBox(options?: any, token?: CancellationToken): Thenable<string | undefined>;
        export function showQuickPick(items: any[] | Thenable<any[]>, options?: any, token?: CancellationToken): Thenable<any>;
        export function withProgress(options: any, task: (progress: any, token: any) => Thenable<any>): Thenable<any>;
        export function registerWebviewViewProvider(viewId: string, provider: WebviewViewProvider, options?: any): Disposable;
        export function createWebviewPanel(viewType: string, title: string, showOptions: any, options?: any): any;
        export function createStatusBarItem(alignment: StatusBarAlignment, priority?: number): any;
        export const activeTextEditor: any;
        export function showTextDocument(document: any, column?: any, preserveFocus?: boolean): Thenable<any>;
    }
    export namespace commands {
        export function executeCommand(command: string, ...rest: any[]): Thenable<any>;
        export function registerCommand(command: string, callback: (...args: any[]) => any, thisArg?: any): Disposable;
    }
    export namespace workspace {
        export const workspaceFolders: any[];
        export function getConfiguration(section?: string, resource?: Uri): any;
        export function openTextDocument(options: any): Thenable<any>;
        export const onDidSaveTextDocument: Event<any>;
        export const onDidChangeConfiguration: Event<any>;
    }
    export namespace env {
        export const clipboard: { writeText(text: string): Thenable<void> };
    }
}
