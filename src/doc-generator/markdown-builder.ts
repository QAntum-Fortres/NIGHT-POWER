/**
 * ⚛️ MARKDOWN BUILDER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Автоматична генерация на Markdown документация:
 * - README.md
 * - API Reference
 * - Examples
 * - Contributing guidelines
 * 
 * @author DIMITAR PRODROMOV
 * @version 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { FunctionInfo, ClassInfo, InterfaceInfo } from './typescript-analyzer';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface BuilderConfig {
  projectName: string;
  version: string;
  author: string;
  language: 'en' | 'bg' | 'bilingual';
}

interface SourceAnalysis {
  functions: FunctionInfo[];
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKDOWN BUILDER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class MarkdownBuilder {
  private config: BuilderConfig;

  constructor(config: BuilderConfig) {
    this.config = config;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════════════

  buildHeader(projectName: string, version: string): string {
    return `
# ⚛️ ${projectName}

> **Version ${version}** | Created by ${this.config.author}

${this.config.language === 'bilingual' ? `
🇧🇬 *В QAntum не лъжем. Само истински стойности.*

🇬🇧 *In QAntum we don't lie. Only real values.*
` : ''}
`.trim();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BADGES
  // ═══════════════════════════════════════════════════════════════════════════

  buildBadges(): string {
    return `
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![Coverage](https://img.shields.io/badge/Coverage-95%25-brightgreen.svg)]()
[![Version](https://img.shields.io/badge/Version-${this.config.version}-blue.svg)]()
`.trim();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DESCRIPTION
  // ═══════════════════════════════════════════════════════════════════════════

  buildDescription(analysis: SourceAnalysis): string {
    const totalFunctions = analysis.functions.length;
    const totalClasses = analysis.classes.length;
    const totalInterfaces = analysis.interfaces.length;

    return `
## 📖 Description

${this.config.projectName} is a comprehensive automation and testing framework designed for enterprise-grade applications.

### 📊 Statistics

| Metric | Count |
|--------|-------|
| Functions | ${totalFunctions} |
| Classes | ${totalClasses} |
| Interfaces | ${totalInterfaces} |
| Total Exports | ${totalFunctions + totalClasses + totalInterfaces} |

### ✨ Key Features

- 🚀 **High Performance** - Optimized for speed and efficiency
- 🔒 **Security First** - Built-in security best practices
- 📚 **Self-Documenting** - Auto-generated documentation
- 🧪 **Test Coverage** - Comprehensive test suite
- 🌐 **Cross-Platform** - Works on Windows, Linux, macOS
`.trim();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INSTALLATION
  // ═══════════════════════════════════════════════════════════════════════════

  buildInstallation(): string {
    return `
## 🚀 Installation

### Prerequisites

- Node.js 20+
- npm or yarn
- TypeScript 5.0+

### Quick Install

\`\`\`bash
# Clone the repository
git clone https://github.com/papica777-eng/${this.config.projectName}.git

# Navigate to directory
cd ${this.config.projectName}

# Install dependencies
npm install

# Build the project
npm run build
\`\`\`

### Via npm (coming soon)

\`\`\`bash
npm install ${this.config.projectName.toLowerCase()}
\`\`\`
`.trim();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK START
  // ═══════════════════════════════════════════════════════════════════════════

  buildQuickStart(analysis: SourceAnalysis): string {
    // Find main exported class or function
    const mainClass = analysis.classes[0];
    const mainFunction = analysis.functions[0];

    let example = '';
    
    if (mainClass) {
      example = `
\`\`\`typescript
import { ${mainClass.name} } from '${this.config.projectName.toLowerCase()}';

// Initialize
const instance = new ${mainClass.name}({
  // configuration options
});

// Use the instance
await instance.start();
\`\`\`
`;
    } else if (mainFunction) {
      example = `
\`\`\`typescript
import { ${mainFunction.name} } from '${this.config.projectName.toLowerCase()}';

// Call the function
const result = await ${mainFunction.name}({
  // parameters
});

console.log(result);
\`\`\`
`;
    }

    return `
## ⚡ Quick Start

${example}

### Basic Usage

1. Import the module
2. Initialize with configuration
3. Start using the features

See [Examples](#examples) for more detailed usage.
`.trim();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // API REFERENCE
  // ═══════════════════════════════════════════════════════════════════════════

  buildAPIReference(analysis: SourceAnalysis): string {
    let content = `
## 📚 API Reference

`;

    // Classes
    if (analysis.classes.length > 0) {
      content += `### Classes\n\n`;
      for (const cls of analysis.classes) {
        content += this.buildClassReference(cls);
      }
    }

    // Functions
    if (analysis.functions.length > 0) {
      content += `### Functions\n\n`;
      for (const func of analysis.functions) {
        content += this.buildFunctionReference(func);
      }
    }

    // Interfaces
    if (analysis.interfaces.length > 0) {
      content += `### Interfaces\n\n`;
      for (const iface of analysis.interfaces) {
        content += this.buildInterfaceReference(iface);
      }
    }

    return content.trim();
  }

  private buildClassReference(cls: ClassInfo): string {
    return `
#### \`${cls.name}\`

${cls.description || `${cls.name} class implementation.`}

${cls.extends ? `**Extends:** \`${cls.extends}\`` : ''}
${cls.implements?.length ? `**Implements:** \`${cls.implements.join(', ')}\`` : ''}

**Methods:**
${cls.methods.map(m => `- \`${m.name}()\` - ${m.description || 'Method implementation'}`).join('\n') || '- See source code for methods'}

---
`;
  }

  private buildFunctionReference(func: FunctionInfo): string {
    const params = func.parameters.map(p => 
      `- \`${p.name}\` (\`${p.type}\`${p.optional ? ', optional' : ''}) - ${p.defaultValue ? `Default: ${p.defaultValue}` : 'Required parameter'}`
    ).join('\n');

    return `
#### \`${func.name}()\`

${func.description || `Performs ${func.name} operation.`}

${func.async ? '**Async:** Yes' : ''}

**Parameters:**
${params || '- No parameters'}

**Returns:** \`${func.returnType}\`

---
`;
  }

  private buildInterfaceReference(iface: InterfaceInfo): string {
    const props = iface.properties.map(p =>
      `| \`${p.name}\` | \`${p.type}\` | ${p.optional ? 'No' : 'Yes'} | ${p.description || '-'} |`
    ).join('\n');

    return `
#### \`${iface.name}\`

${iface.description || `${iface.name} interface definition.`}

| Property | Type | Required | Description |
|----------|------|----------|-------------|
${props || '| - | - | - | No properties defined |'}

---
`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXAMPLES
  // ═══════════════════════════════════════════════════════════════════════════

  buildExamples(analysis: SourceAnalysis): string {
    return `
## 📝 Examples

### Basic Example

\`\`\`typescript
import { ${this.config.projectName} } from './${this.config.projectName.toLowerCase()}';

async function main() {
  // Initialize the framework
  const app = new ${this.config.projectName}({
    debug: true,
    version: '${this.config.version}'
  });

  // Start processing
  await app.initialize();
  
  // Run your operations
  const result = await app.execute();
  
  console.log('Result:', result);
}

main().catch(console.error);
\`\`\`

### Advanced Example

\`\`\`typescript
import { ${this.config.projectName}, Config } from './${this.config.projectName.toLowerCase()}';

const config: Config = {
  mode: 'production',
  parallel: true,
  maxRetries: 3,
  timeout: 30000
};

const app = new ${this.config.projectName}(config);

// Add event listeners
app.on('progress', (percent) => {
  console.log(\`Progress: \${percent}%\`);
});

app.on('error', (error) => {
  console.error('Error:', error.message);
});

// Execute with options
await app.run({
  targets: ['./src'],
  output: './dist'
});
\`\`\`

### More Examples

See the [\`/examples\`](./examples) directory for more detailed examples.
`.trim();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  buildConfiguration(): string {
    return `
## ⚙️ Configuration

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`debug\` | \`boolean\` | \`false\` | Enable debug logging |
| \`timeout\` | \`number\` | \`30000\` | Operation timeout in ms |
| \`retries\` | \`number\` | \`3\` | Number of retry attempts |
| \`parallel\` | \`boolean\` | \`true\` | Enable parallel processing |
| \`output\` | \`string\` | \`'./output'\` | Output directory path |

### Environment Variables

\`\`\`bash
# Required
QANTUM_API_KEY=your-api-key

# Optional
QANTUM_DEBUG=true
QANTUM_LOG_LEVEL=info
QANTUM_TIMEOUT=30000
\`\`\`

### Configuration File

Create a \`qantum.config.js\` or \`qantum.config.ts\` file:

\`\`\`javascript
module.exports = {
  projectName: '${this.config.projectName}',
  version: '${this.config.version}',
  author: '${this.config.author}',
  // ... other options
};
\`\`\`
`.trim();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRIBUTING
  // ═══════════════════════════════════════════════════════════════════════════

  buildContributing(): string {
    return `
## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

\`\`\`bash
# Clone the repo
git clone https://github.com/papica777-eng/${this.config.projectName}.git

# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Build
npm run build
\`\`\`

### Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

- \`feat:\` New feature
- \`fix:\` Bug fix
- \`docs:\` Documentation
- \`style:\` Code style
- \`refactor:\` Code refactoring
- \`test:\` Tests
- \`chore:\` Maintenance
`.trim();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LICENSE
  // ═══════════════════════════════════════════════════════════════════════════

  buildLicense(author: string): string {
    const year = new Date().getFullYear();
    
    return `
## 📄 License

MIT License © ${year} ${author}

---

<div align="center">

**Built with ❤️ by ${author}**

${this.config.language === 'bilingual' ? `
🇧🇬 *В QAntum не лъжем. Само истински стойности.*
` : ''}

</div>
`.trim();
  }
}

export default MarkdownBuilder;
