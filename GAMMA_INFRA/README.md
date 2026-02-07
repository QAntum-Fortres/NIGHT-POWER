# GAMMA Deployment System

## Overview

**GAMMA** (Global Autonomous Machine Management Architecture) is a self-deploying, self-healing system orchestrator with military-grade encryption and millisecond startup.

## Features

- 🔐 **Password Protected**: `96-01-07-0443` with `A224682D` encryption key
- ⚡ **<10ms Startup**: Zero-entropy initialization
- 🔧 **Self-Healing**: Autonomous feedback loop monitors critical paths
- 🌍 **Cross-Platform**: Windows, Linux, macOS support
- 📦 **Auto-Import**: Automatically detects and adapts to target system
- 🚀 **Double-Click Deploy**: No manual configuration required

## Quick Start

### Windows

```cmd
DEPLOY.bat
```

### Linux/Mac

```bash
chmod +x DEPLOY.sh
./DEPLOY.sh
```

## Manual Deployment

```bash
npx ts-node gamma-deploy.ts <password> <source_path> <target_path>
```

**Example:**

```bash
npx ts-node gamma-deploy.ts 96-01-07-0443 ./MrMindQATool /opt/gamma
```

## Architecture

```
GAMMA_INFRA/
├── gamma-deploy.ts      # Main deployment orchestrator
├── DEPLOY.bat           # Windows launcher
├── DEPLOY.sh            # Linux/Mac launcher
├── README.md            # This file
└── reality/
    ├── kernel/          # Autonomous feedback loop
    ├── economy/         # Market watcher, config loader
    └── sdk/             # Veritas SDK
```

## Security

- **Encryption**: AES-256-CBC with hex key `A224682D`
- **Authentication**: SHA-256 password hashing
- **Signature**: Deployment signature for integrity verification

## System Requirements

- Node.js 16+ (auto-detected)
- TypeScript (auto-installed)
- Optional: Rust (for core compilation)
- Optional: Docker (for containerized deployment)

## Deployment Process

1. **Authentication**: Verifies password `96-01-07-0443`
2. **System Analysis**: Detects OS, CPU, memory, installed tools
3. **Auto-Import**: Copies `GAMMA_INFRA`, `rust_core`, `src`
4. **Configuration**: Adapts config for target system
5. **Dependencies**: Installs npm packages, compiles Rust
6. **Self-Healing**: Starts health monitoring loop

## Self-Healing

The system monitors critical paths every 5 seconds:

- `GAMMA_INFRA/`
- `src/`
- `config.json`

If any path is missing, the healer attempts automatic recovery.

## Troubleshooting

### "Authentication FAILED"

- Ensure password is exactly: `96-01-07-0443`

### "Rust compilation failed"

- Install MSVC Build Tools (Windows) or GCC (Linux)
- Or skip Rust compilation (TypeScript-only mode)

### "Permission denied"

- Run with `sudo` (Linux/Mac) or Administrator (Windows)

## Advanced Usage

### Programmatic Deployment

```typescript
import { GammaDeployment } from './gamma-deploy';

await GammaDeployment.execute(
    '96-01-07-0443',
    './MrMindQATool',
    '/opt/gamma'
);
```

### Custom Configuration

Edit `config.json` after deployment to customize:

- Runtime paths
- Self-healing intervals
- Security settings

## License

Proprietary - QAntum Empire  
© 2026 Dimitar Prodromov
