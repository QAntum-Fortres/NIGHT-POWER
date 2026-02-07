#!/usr/bin/env node
/**
 * ⚛️ QANTUM AUTO-DOC ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Автоматична документация при ВСЯКА промяна
 * НЕ ръчно. НЕ на периоди. ВИНАГИ автоматично.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  projectRoot: path.resolve(__dirname, '..'),
  docsDir: 'docs',
  websiteDir: 'website',
  publicDir: 'public',
  changelogFile: 'CHANGELOG.md',
  versionFile: 'package.json',
  
  // Какво да документираме
  docTargets: {
    api: 'src/api/**/*.ts',
    core: 'src/core/**/*.ts',
    plugins: 'src/plugins/**/*.ts',
    types: 'src/types/**/*.ts'
  },
  
  // Website pages
  websitePages: {
    home: 'index.html',
    docs: 'docs.html',
    api: 'api.html',
    changelog: 'changelog.html'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-DOC ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class AutoDocEngine {
  constructor() {
    this.changes = [];
    this.version = this.getVersion();
    this.timestamp = new Date().toISOString();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN PIPELINE
  // ─────────────────────────────────────────────────────────────────────────────

  async run(commitMessage = null) {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  ⚛️  QANTUM AUTO-DOC ENGINE v1.0.0                                           ║
║  Автоматична документация - НЕ ръчно, НЕ на периоди, ВИНАГИ автоматично     ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);

    const startTime = Date.now();

    try {
      // 1. Събери промените от git
      this.changes = this.detectChanges();
      
      if (this.changes.length === 0) {
        console.log('ℹ️  Няма промени за документиране');
        return;
      }

      console.log(`\n📊 Открити промени: ${this.changes.length} файла\n`);

      // 2. Генерирай документация
      await this.generateDocs();

      // 3. Обнови CHANGELOG
      await this.updateChangelog(commitMessage);

      // 4. Обнови Website
      await this.updateWebsite();

      // 5. Генерирай API Reference
      await this.generateApiDocs();

      // 6. Обнови версията в docs
      await this.syncVersionEverywhere();

      // 7. Commit docs (ако има промени)
      await this.commitDocs();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  ✅ AUTO-DOC COMPLETE                                                        ║
║  Duration: ${duration}s                                                          ║
║  Changes documented: ${this.changes.length} files                                    ║
║  Version: ${this.version}                                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
      `);

    } catch (error) {
      console.error('❌ Auto-Doc Error:', error.message);
      process.exit(1);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHANGE DETECTION
  // ─────────────────────────────────────────────────────────────────────────────

  detectChanges() {
    try {
      // Staged + unstaged changes
      const staged = execSync('git diff --cached --name-only', { 
        cwd: CONFIG.projectRoot, 
        encoding: 'utf-8' 
      }).trim().split('\n').filter(Boolean);
      
      const unstaged = execSync('git diff --name-only', { 
        cwd: CONFIG.projectRoot, 
        encoding: 'utf-8' 
      }).trim().split('\n').filter(Boolean);

      const allChanges = [...new Set([...staged, ...unstaged])];
      
      // Категоризирай промените
      return allChanges.map(file => ({
        path: file,
        type: this.categorizeChange(file),
        isSource: file.startsWith('src/'),
        isDoc: file.startsWith('docs/') || file.endsWith('.md'),
        isTest: file.includes('test') || file.includes('spec')
      }));
    } catch {
      return [];
    }
  }

  categorizeChange(file) {
    if (file.startsWith('src/api/')) return 'api';
    if (file.startsWith('src/core/')) return 'core';
    if (file.startsWith('src/plugins/')) return 'plugin';
    if (file.startsWith('src/types/')) return 'types';
    if (file.endsWith('.md')) return 'docs';
    if (file.includes('test')) return 'test';
    return 'other';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DOCUMENTATION GENERATION
  // ─────────────────────────────────────────────────────────────────────────────

  async generateDocs() {
    console.log('📝 Generating documentation...');
    
    const docsDir = path.join(CONFIG.projectRoot, CONFIG.docsDir);
    this.ensureDir(docsDir);

    // Групирай промените по тип
    const byType = this.changes.reduce((acc, change) => {
      if (!acc[change.type]) acc[change.type] = [];
      acc[change.type].push(change);
      return acc;
    }, {});

    // Генерирай docs за всеки тип
    for (const [type, changes] of Object.entries(byType)) {
      if (changes.some(c => c.isSource)) {
        await this.generateTypeDoc(type, changes);
      }
    }

    console.log('   ✅ Documentation generated');
  }

  async generateTypeDoc(type, changes) {
    const sourceChanges = changes.filter(c => c.isSource);
    if (sourceChanges.length === 0) return;

    const docFile = path.join(CONFIG.projectRoot, CONFIG.docsDir, `${type}-reference.md`);
    
    let content = `# ${type.toUpperCase()} Reference\n\n`;
    content += `> Auto-generated: ${this.timestamp}\n`;
    content += `> Version: ${this.version}\n\n`;
    content += `## Recent Changes\n\n`;

    for (const change of sourceChanges) {
      const filePath = path.join(CONFIG.projectRoot, change.path);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const exports = this.extractExports(fileContent);
        const jsdocs = this.extractJSDocs(fileContent);

        content += `### ${path.basename(change.path)}\n\n`;
        
        if (exports.length > 0) {
          content += `**Exports:**\n`;
          exports.forEach(exp => {
            content += `- \`${exp}\`\n`;
          });
          content += '\n';
        }

        if (jsdocs.length > 0) {
          content += `**Documentation:**\n`;
          jsdocs.forEach(doc => {
            content += `\`\`\`\n${doc}\n\`\`\`\n`;
          });
          content += '\n';
        }
      }
    }

    fs.writeFileSync(docFile, content);
  }

  extractExports(content) {
    const exports = [];
    const patterns = [
      /export\s+(class|function|const|let|var|interface|type|enum)\s+(\w+)/g,
      /export\s+\{\s*([^}]+)\s*\}/g,
      /export\s+default\s+(\w+)/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[2]) exports.push(match[2]);
        else if (match[1]) {
          match[1].split(',').forEach(e => exports.push(e.trim()));
        }
      }
    }

    return [...new Set(exports)];
  }

  extractJSDocs(content) {
    const jsdocs = [];
    const pattern = /\/\*\*[\s\S]*?\*\//g;
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      // Само първите 5 JSDoc блока
      if (jsdocs.length < 5) {
        jsdocs.push(match[0]);
      }
    }
    
    return jsdocs;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHANGELOG UPDATE
  // ─────────────────────────────────────────────────────────────────────────────

  async updateChangelog(commitMessage) {
    console.log('📋 Updating CHANGELOG...');
    
    const changelogPath = path.join(CONFIG.projectRoot, CONFIG.changelogFile);
    let changelog = '';
    
    if (fs.existsSync(changelogPath)) {
      changelog = fs.readFileSync(changelogPath, 'utf-8');
    }

    const date = new Date().toISOString().split('T')[0];
    const sourceChanges = this.changes.filter(c => c.isSource);
    
    if (sourceChanges.length === 0) {
      console.log('   ⏭️  No source changes to log');
      return;
    }

    // Групирай по тип
    const grouped = {
      api: sourceChanges.filter(c => c.type === 'api'),
      core: sourceChanges.filter(c => c.type === 'core'),
      plugin: sourceChanges.filter(c => c.type === 'plugin'),
      types: sourceChanges.filter(c => c.type === 'types'),
      other: sourceChanges.filter(c => !['api', 'core', 'plugin', 'types'].includes(c.type))
    };

    let newEntry = `\n## [${this.version}] - ${date}\n\n`;
    
    if (commitMessage) {
      newEntry += `### Summary\n${commitMessage}\n\n`;
    }

    if (grouped.api.length > 0) {
      newEntry += `### API Changes\n`;
      grouped.api.forEach(c => newEntry += `- Modified: \`${c.path}\`\n`);
      newEntry += '\n';
    }

    if (grouped.core.length > 0) {
      newEntry += `### Core Changes\n`;
      grouped.core.forEach(c => newEntry += `- Modified: \`${c.path}\`\n`);
      newEntry += '\n';
    }

    if (grouped.plugin.length > 0) {
      newEntry += `### Plugin Changes\n`;
      grouped.plugin.forEach(c => newEntry += `- Modified: \`${c.path}\`\n`);
      newEntry += '\n';
    }

    // Вмъкни след header-а
    const headerEnd = changelog.indexOf('\n## ');
    if (headerEnd > 0) {
      changelog = changelog.slice(0, headerEnd) + newEntry + changelog.slice(headerEnd);
    } else {
      // Ако няма съществуващи entries
      if (!changelog.includes('# Changelog')) {
        changelog = `# Changelog\n\nAll notable changes to QAntum are documented automatically.\n${newEntry}`;
      } else {
        changelog += newEntry;
      }
    }

    fs.writeFileSync(changelogPath, changelog);
    console.log('   ✅ CHANGELOG updated');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WEBSITE UPDATE
  // ─────────────────────────────────────────────────────────────────────────────

  async updateWebsite() {
    console.log('🌐 Updating website...');
    
    const websiteDir = path.join(CONFIG.projectRoot, CONFIG.websiteDir);
    const publicDir = path.join(CONFIG.projectRoot, CONFIG.publicDir);
    
    // Използвай който съществува
    const targetDir = fs.existsSync(websiteDir) ? websiteDir : publicDir;
    this.ensureDir(targetDir);

    // Обнови version badge навсякъде
    await this.updateVersionBadges(targetDir);

    // Генерирай changelog page
    await this.generateChangelogPage(targetDir);

    // Обнови docs page
    await this.generateDocsPage(targetDir);

    // Обнови last updated timestamp
    await this.updateTimestamps(targetDir);

    console.log('   ✅ Website updated');
  }

  async updateVersionBadges(dir) {
    const htmlFiles = this.findFiles(dir, '.html');
    
    for (const file of htmlFiles) {
      let content = fs.readFileSync(file, 'utf-8');
      
      // Update version badges
      content = content.replace(
        /v\d+\.\d+\.\d+(-[\w.]+)?/g, 
        `v${this.version}`
      );
      
      // Update version meta tags
      content = content.replace(
        /<meta name="version" content="[^"]*">/g,
        `<meta name="version" content="${this.version}">`
      );

      // Update data-version attributes
      content = content.replace(
        /data-version="[^"]*"/g,
        `data-version="${this.version}"`
      );

      fs.writeFileSync(file, content);
    }
  }

  async generateChangelogPage(dir) {
    const changelogMd = path.join(CONFIG.projectRoot, CONFIG.changelogFile);
    if (!fs.existsSync(changelogMd)) return;

    const changelogContent = fs.readFileSync(changelogMd, 'utf-8');
    const changelogHtml = this.markdownToHtml(changelogContent);

    const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="version" content="${this.version}">
  <title>Changelog - QAntum v${this.version}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <nav>
      <a href="index.html">Home</a>
      <a href="docs.html">Docs</a>
      <a href="api.html">API</a>
      <a href="changelog.html" class="active">Changelog</a>
    </nav>
    <div class="version-badge">v${this.version}</div>
  </header>
  
  <main class="changelog-page">
    <div class="auto-generated-notice">
      ⚛️ Auto-generated: ${this.timestamp}
    </div>
    ${changelogHtml}
  </main>
  
  <footer>
    <p>QAntum v${this.version} | Last updated: ${this.timestamp}</p>
  </footer>
</body>
</html>`;

    fs.writeFileSync(path.join(dir, 'changelog.html'), page);
  }

  async generateDocsPage(dir) {
    const docsDir = path.join(CONFIG.projectRoot, CONFIG.docsDir);
    if (!fs.existsSync(docsDir)) return;

    const docFiles = this.findFiles(docsDir, '.md');
    let docsContent = '';

    for (const file of docFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const name = path.basename(file, '.md');
      docsContent += `<section id="${name}">\n`;
      docsContent += this.markdownToHtml(content);
      docsContent += `</section>\n`;
    }

    const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="version" content="${this.version}">
  <title>Documentation - QAntum v${this.version}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <nav>
      <a href="index.html">Home</a>
      <a href="docs.html" class="active">Docs</a>
      <a href="api.html">API</a>
      <a href="changelog.html">Changelog</a>
    </nav>
    <div class="version-badge">v${this.version}</div>
  </header>
  
  <main class="docs-page">
    <aside class="docs-nav">
      <h3>Documentation</h3>
      <ul>
        ${docFiles.map(f => {
          const name = path.basename(f, '.md');
          return `<li><a href="#${name}">${name}</a></li>`;
        }).join('\n        ')}
      </ul>
    </aside>
    
    <div class="docs-content">
      <div class="auto-generated-notice">
        ⚛️ Auto-generated: ${this.timestamp}
      </div>
      ${docsContent}
    </div>
  </main>
  
  <footer>
    <p>QAntum v${this.version} | Last updated: ${this.timestamp}</p>
  </footer>
</body>
</html>`;

    fs.writeFileSync(path.join(dir, 'docs.html'), page);
  }

  async updateTimestamps(dir) {
    const htmlFiles = this.findFiles(dir, '.html');
    
    for (const file of htmlFiles) {
      let content = fs.readFileSync(file, 'utf-8');
      
      // Update last-updated timestamps
      content = content.replace(
        /Last updated: [^<]*/g,
        `Last updated: ${this.timestamp}`
      );
      
      content = content.replace(
        /data-updated="[^"]*"/g,
        `data-updated="${this.timestamp}"`
      );

      fs.writeFileSync(file, content);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // API DOCS GENERATION
  // ─────────────────────────────────────────────────────────────────────────────

  async generateApiDocs() {
    console.log('📚 Generating API documentation...');
    
    const apiDir = path.join(CONFIG.projectRoot, 'src/api');
    if (!fs.existsSync(apiDir)) {
      console.log('   ⏭️  No API directory found');
      return;
    }

    const apiFiles = this.findFiles(apiDir, '.ts');
    const apiDoc = this.generateApiReference(apiFiles);
    
    const docsDir = path.join(CONFIG.projectRoot, CONFIG.docsDir);
    this.ensureDir(docsDir);
    
    fs.writeFileSync(path.join(docsDir, 'api-reference.md'), apiDoc);
    console.log('   ✅ API documentation generated');
  }

  generateApiReference(files) {
    let doc = `# QAntum API Reference\n\n`;
    doc += `> Version: ${this.version}\n`;
    doc += `> Auto-generated: ${this.timestamp}\n\n`;
    doc += `---\n\n`;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(CONFIG.projectRoot, file);
      const exports = this.extractExports(content);
      const interfaces = this.extractInterfaces(content);
      const methods = this.extractMethods(content);

      if (exports.length > 0 || interfaces.length > 0) {
        doc += `## ${path.basename(file, '.ts')}\n\n`;
        doc += `**File:** \`${relativePath}\`\n\n`;

        if (exports.length > 0) {
          doc += `### Exports\n\n`;
          exports.forEach(exp => {
            doc += `- \`${exp}\`\n`;
          });
          doc += '\n';
        }

        if (interfaces.length > 0) {
          doc += `### Interfaces\n\n`;
          interfaces.forEach(iface => {
            doc += `\`\`\`typescript\n${iface}\n\`\`\`\n\n`;
          });
        }

        if (methods.length > 0) {
          doc += `### Methods\n\n`;
          methods.slice(0, 10).forEach(method => {
            doc += `- \`${method}\`\n`;
          });
          doc += '\n';
        }

        doc += `---\n\n`;
      }
    }

    return doc;
  }

  extractInterfaces(content) {
    const interfaces = [];
    const pattern = /(?:export\s+)?interface\s+\w+\s*(?:extends\s+[^{]+)?\s*\{[^}]*\}/g;
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      if (interfaces.length < 5) {
        interfaces.push(match[0]);
      }
    }
    
    return interfaces;
  }

  extractMethods(content) {
    const methods = [];
    const pattern = /(?:public\s+|private\s+|protected\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?(?=\s*\{)/g;
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && !['if', 'for', 'while', 'switch', 'catch'].includes(match[1])) {
        methods.push(match[0].trim());
      }
    }
    
    return [...new Set(methods)];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VERSION SYNC
  // ─────────────────────────────────────────────────────────────────────────────

  async syncVersionEverywhere() {
    console.log('🔄 Syncing version everywhere...');
    
    const files = [
      ...this.findFiles(path.join(CONFIG.projectRoot, CONFIG.docsDir), '.md'),
      ...this.findFiles(path.join(CONFIG.projectRoot, CONFIG.docsDir), '.html'),
      path.join(CONFIG.projectRoot, 'README.md')
    ].filter(f => fs.existsSync(f));

    for (const file of files) {
      let content = fs.readFileSync(file, 'utf-8');
      
      // Update version references
      content = content.replace(
        /version[:\s]+\d+\.\d+\.\d+(-[\w.]+)?/gi,
        `version: ${this.version}`
      );
      
      content = content.replace(
        /v\d+\.\d+\.\d+(-[\w.]+)?/g,
        `v${this.version}`
      );

      fs.writeFileSync(file, content);
    }

    console.log('   ✅ Version synced');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GIT OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async commitDocs() {
    console.log('📤 Committing documentation...');
    
    try {
      // Stage docs
      execSync(`git add ${CONFIG.docsDir}/ ${CONFIG.changelogFile} ${CONFIG.websiteDir}/ ${CONFIG.publicDir}/ README.md 2>/dev/null || true`, {
        cwd: CONFIG.projectRoot,
        stdio: 'pipe'
      });

      // Check if there are staged changes
      const staged = execSync('git diff --cached --name-only', {
        cwd: CONFIG.projectRoot,
        encoding: 'utf-8'
      }).trim();

      if (staged) {
        execSync(`git commit -m "📚 Auto-Doc: v${this.version} - ${new Date().toISOString().split('T')[0]}"`, {
          cwd: CONFIG.projectRoot,
          stdio: 'pipe'
        });
        console.log('   ✅ Documentation committed');
      } else {
        console.log('   ⏭️  No documentation changes to commit');
      }
    } catch (error) {
      console.log('   ⏭️  Nothing to commit or already committed');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────────────────────

  getVersion() {
    try {
      const pkgPath = path.join(CONFIG.projectRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return pkg.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  findFiles(dir, ext) {
    if (!fs.existsSync(dir)) return [];
    
    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...this.findFiles(fullPath, ext));
      } else if (item.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  markdownToHtml(md) {
    // Simple markdown to HTML conversion
    return md
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, (match) => {
        if (match.startsWith('<')) return match;
        return `<p>${match}</p>`;
      });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GIT HOOK INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

class GitHookInstaller {
  static install() {
    const hooksDir = path.join(CONFIG.projectRoot, '.git/hooks');
    
    if (!fs.existsSync(hooksDir)) {
      console.log('⚠️  Not a git repository');
      return;
    }

    // Post-commit hook
    const postCommit = `#!/bin/sh
# QAntum Auto-Doc Hook
node tools/auto-doc-engine.js --auto
`;

    fs.writeFileSync(path.join(hooksDir, 'post-commit'), postCommit);
    fs.chmodSync(path.join(hooksDir, 'post-commit'), '755');

    // Pre-push hook
    const prePush = `#!/bin/sh
# QAntum Auto-Doc Sync
node tools/auto-doc-engine.js --sync
`;

    fs.writeFileSync(path.join(hooksDir, 'pre-push'), prePush);
    fs.chmodSync(path.join(hooksDir, 'pre-push'), '755');

    console.log('✅ Git hooks installed');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const engine = new AutoDocEngine();

if (args.includes('--install-hooks')) {
  GitHookInstaller.install();
} else if (args.includes('--help')) {
  console.log(`
⚛️ QANTUM AUTO-DOC ENGINE

Usage:
  node auto-doc-engine.js              Run full documentation update
  node auto-doc-engine.js --auto       Run in auto mode (for git hooks)
  node auto-doc-engine.js --sync       Sync versions only
  node auto-doc-engine.js --install-hooks  Install git hooks for auto-doc
  node auto-doc-engine.js --help       Show this help

The engine automatically:
  • Detects changes from git
  • Generates documentation for changed files
  • Updates CHANGELOG.md
  • Updates website pages
  • Generates API reference
  • Syncs version everywhere
  • Commits documentation changes
`);
} else {
  engine.run(args.includes('--message') ? args[args.indexOf('--message') + 1] : null);
}

module.exports = { AutoDocEngine, GitHookInstaller };
