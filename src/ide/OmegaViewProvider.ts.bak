/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OMEGA VIEW PROVIDER - Webview Provider for Sidebar
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Визуалният команден център на QAntum OMEGA."
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 30.4.0 - THE SOVEREIGN SIDEBAR
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class OmegaViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'qantum-omega-sidebar';

  private _view?: vscode.WebviewView;
  private _messages: Array<{ role: string; content: string; timestamp: Date }> = [];
  private _led: { color: string; label: string } = { color: 'green', label: 'SYNCED' };

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'ask':
          vscode.commands.executeCommand('qantum.askExpert');
          break;
        case 'heal':
          vscode.commands.executeCommand('qantum.omegaHeal');
          break;
        case 'audit':
          vscode.commands.executeCommand('qantum.ghostAudit');
          break;
        case 'swap':
          vscode.commands.executeCommand('qantum.failoverSwap');
          break;
        case 'synthesize':
          vscode.commands.executeCommand('qantum.synthesize');
          break;
        case 'command':
          await this._handleCommand(data.command, data.file);
          break;
      }
    });

    // Initial status update
    this.updateLed('green', 'SYNCED');
  }

  private async _handleCommand(command: string, file?: string): Promise<void> {
    const { AIAgentExpert } = await import('../intelligence/AIAgentExpert');
    const expert = AIAgentExpert.getInstance();

    this.addMessage('user', command);

    const editor = vscode.window.activeTextEditor;
    const filePath = file || editor?.document.uri.fsPath;

    const response = await expert.ask(command, filePath);
    this.addMessage('assistant', response);
  }

  public addMessage(role: string, content: string): void {
    this._messages.push({ role, content, timestamp: new Date() });

    if (this._view) {
      this._view.webview.postMessage({
        type: 'message',
        role,
        content,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  }

  public updateLed(color: string, label: string): void {
    this._led = { color, label };

    if (this._view) {
      this._view.webview.postMessage({
        type: 'led',
        color,
        label,
      });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>QAntum OMEGA</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-sideBar-background);
            color: var(--vscode-sideBar-foreground);
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* Header */
        .header {
            padding: 12px;
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .logo {
            font-size: 14px;
            font-weight: 600;
            color: #a5b4fc;
        }

        .version {
            font-size: 10px;
            color: #6366f1;
        }

        /* Status LED */
        .status-led {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .led {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #22c55e;
            box-shadow: 0 0 8px #22c55e;
            transition: all 0.3s ease;
        }

        .led.green { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
        .led.purple { background: #a855f7; box-shadow: 0 0 8px #a855f7; }
        .led.red { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
        .led.yellow { background: #eab308; box-shadow: 0 0 8px #eab308; }

        .led-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
        }

        /* Chat Area */
        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .message {
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 12px;
            line-height: 1.5;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .message.user {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            align-self: flex-end;
            max-width: 85%;
        }

        .message.assistant {
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
            border: 1px solid #4338ca;
            align-self: flex-start;
            max-width: 85%;
        }

        .message.system {
            background: var(--vscode-editorWidget-background);
            border: 1px solid var(--vscode-editorWidget-border);
            font-style: italic;
            color: var(--vscode-descriptionForeground);
            max-width: 100%;
        }

        .message-time {
            font-size: 9px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }

        /* Welcome Message */
        .welcome {
            text-align: center;
            padding: 20px;
            color: var(--vscode-descriptionForeground);
        }

        .welcome-icon {
            font-size: 32px;
            margin-bottom: 10px;
        }

        .welcome-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-sideBar-foreground);
            margin-bottom: 6px;
        }

        .welcome-text {
            font-size: 11px;
            line-height: 1.5;
        }

        /* Input Area */
        .input-container {
            padding: 12px;
            background: var(--vscode-sideBar-background);
            border-top: 1px solid var(--vscode-panel-border);
        }

        .input-wrapper {
            display: flex;
            gap: 8px;
            margin-bottom: 10px;
        }

        #command-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 6px;
            font-size: 12px;
            outline: none;
        }

        #command-input:focus {
            border-color: #6366f1;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }

        #send-btn {
            padding: 8px 12px;
            background: #6366f1;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s;
        }

        #send-btn:hover {
            background: #4f46e5;
        }

        /* Action Buttons */
        .actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
        }

        .action-btn {
            padding: 8px;
            border: 1px solid var(--vscode-button-border);
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            transition: all 0.2s;
        }

        .action-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .action-btn.heal {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            border-color: #059669;
            color: white;
        }

        .action-btn.audit {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            border-color: #7c3aed;
            color: white;
        }

        .action-btn.swap {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            border-color: #dc2626;
            color: white;
        }

        .action-btn.synthesize {
            background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
            border-color: #0891b2;
            color: white;
        }

        /* Code blocks */
        pre {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 8px;
            overflow-x: auto;
            font-family: var(--vscode-editor-font-family);
            font-size: 11px;
            margin-top: 8px;
        }

        code {
            font-family: var(--vscode-editor-font-family);
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-background);
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--vscode-scrollbarSlider-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="logo">⚡ QAntum OMEGA</div>
            <div class="version">v30.4.0 - Sovereign Sidebar</div>
        </div>
        <div class="status-led">
            <div class="led green" id="led"></div>
            <span class="led-label" id="led-label">SYNCED</span>
        </div>
    </div>

    <div class="chat-container" id="chat">
        <div class="welcome">
            <div class="welcome-icon">🤖</div>
            <div class="welcome-title">AIAgentExpert Ready</div>
            <div class="welcome-text">
                Cloud Opus x3 replacement.<br>
                Type a command or use the action buttons below.<br><br>
                <strong>В QAntum не лъжем.</strong>
            </div>
        </div>
    </div>

    <div class="input-container">
        <div class="input-wrapper">
            <input type="text" id="command-input" placeholder="Ask AIAgentExpert..." />
            <button id="send-btn">Send</button>
        </div>
        <div class="actions">
            <button class="action-btn heal" onclick="sendAction('heal')">🌀 Heal</button>
            <button class="action-btn audit" onclick="sendAction('audit')">👻 Audit</button>
            <button class="action-btn swap" onclick="sendAction('swap')">🔄 Swap</button>
            <button class="action-btn synthesize" onclick="sendAction('synthesize')">🧬 Synth</button>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const chatContainer = document.getElementById('chat');
        const commandInput = document.getElementById('command-input');
        const sendBtn = document.getElementById('send-btn');
        const led = document.getElementById('led');
        const ledLabel = document.getElementById('led-label');

        let hasMessages = false;

        // Send command
        function sendCommand() {
            const text = commandInput.value.trim();
            if (!text) return;

            vscode.postMessage({ type: 'command', command: text });
            commandInput.value = '';
        }

        sendBtn.addEventListener('click', sendCommand);
        commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendCommand();
        });

        // Action buttons
        function sendAction(action) {
            vscode.postMessage({ type: action });
        }

        // Handle messages from extension
        window.addEventListener('message', (event) => {
            const data = event.data;

            switch (data.type) {
                case 'message':
                    addMessage(data.role, data.content, data.timestamp);
                    break;
                case 'led':
                    updateLed(data.color, data.label);
                    break;
            }
        });

        function addMessage(role, content, timestamp) {
            // Remove welcome message on first real message
            if (!hasMessages) {
                const welcome = chatContainer.querySelector('.welcome');
                if (welcome) welcome.remove();
                hasMessages = true;
            }

            const messageEl = document.createElement('div');
            messageEl.className = 'message ' + role;

            // Format content (handle code blocks)
            let formattedContent = content
                .replace(/\`\`\`(\\w*)\\n?([\\s\\S]*?)\`\`\`/g, '<pre><code>$2</code></pre>')
                .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
                .replace(/\\n/g, '<br>');

            messageEl.innerHTML = formattedContent;

            if (timestamp) {
                const timeEl = document.createElement('div');
                timeEl.className = 'message-time';
                timeEl.textContent = timestamp;
                messageEl.appendChild(timeEl);
            }

            chatContainer.appendChild(messageEl);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function updateLed(color, label) {
            led.className = 'led ' + color;
            ledLabel.textContent = label;
        }
    </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
