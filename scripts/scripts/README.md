# 🔥 QAntum 3-Phase Deduplication & Integration System

This directory contains the implementation of the 3-phase plan for deduplication, neural absorption, and integration of code modules.

## 📋 Overview

The system processes large codebases through three phases:

1. **Phase 1**: Deduplication + Analysis
2. **Phase 2**: Neural Core Magnet (Absorption)
3. **Phase 3**: QAntum Integration

## 🚀 Quick Start

### Run All Phases
```bash
npm run orchestrate
# or
ts-node scripts/master-orchestrator.ts
```

### Run Individual Phases
```bash
# Phase 1: Deduplication
npm run analyze

# Phase 2: Neural Absorption
npm run absorb

# Phase 3: Integration
npm run integrate
```

### Branch Management
```bash
# Setup branch structure
npm run branch:setup

# Check branch status
npm run branch:status

# Promote verified modules
npm run branch:promote

# Cleanup merged branches
npm run branch:cleanup
```

## 📁 Scripts

### `deduplicate-analyze.ts`
**Phase 1: Deduplication + Analysis**

Performs:
- SHA-256 hashing of all source files
- Identifies and removes identical duplicates
- Groups files by similarity (>90% code overlap)
- Generates TAXONOMY.json with domain categorization

**Usage:**
```bash
ts-node scripts/deduplicate-analyze.ts [rootDir] [outputDir]
```

**Output:**
- `TAXONOMY.json` - Domain categorization
- `deduplication-report.json` - Full analysis
- `deduplication-summary.txt` - Human-readable summary

---

### `neural-core-magnet.ts`
**Phase 2: Neural Absorption**

Performs:
- Vectorization of unique modules (TF-IDF)
- Semantic search index creation
- Architectural pattern recognition
- Auto-documentation generation

**Usage:**
```bash
ts-node scripts/neural-core-magnet.ts [targetDir] [taxonomyPath] [outputDir]
```

**Output:**
- `architectural-patterns.json` - Detected patterns
- `auto-documentation.json` - Module documentation
- `code-vectors.json` - Semantic vectors
- `neural-absorption-summary.txt` - Summary

---

### `qantum-integrator.ts`
**Phase 3: QAntum Integration**

Performs:
- Extracts TOP 50 most valuable modules
- Identifies OmniCore integration candidates
- Creates @qantum/core-utils shared library structure
- Generates training dataset for code-gen models

**Usage:**
```bash
ts-node scripts/qantum-integrator.ts [analysisDir] [outputDir]
```

**Output:**
- `integration-plan.json` - Integration roadmap
- `training-dataset.jsonl` - Code-gen training data
- `OMNICORE-INTEGRATION-GUIDE.md` - Integration guide
- `qantum-core-utils/` - Shared library structure
- `integration-summary.txt` - Summary

---

### `master-orchestrator.ts`
**Master Orchestrator**

Runs all 3 phases in sequence with comprehensive reporting.

**Usage:**
```bash
ts-node scripts/master-orchestrator.ts [options]

Options:
  --root <path>       Root directory to analyze (default: current directory)
  --output <path>     Output directory for results (default: ./analysis-output)
  --top <number>      Number of top modules to extract (default: 50)
  --skip-phase1       Skip Phase 1 (Deduplication)
  --skip-phase2       Skip Phase 2 (Neural Absorption)
  --skip-phase3       Skip Phase 3 (Integration)
  --help              Show help message
```

**Example:**
```bash
ts-node scripts/master-orchestrator.ts --root /path/to/project --top 100
```

---

### `branch-manager.js`
**Git Branch Management**

Automates the Git branching strategy for QAntum.

**Usage:**
```bash
node scripts/branch-manager.js <command>

Commands:
  setup       - Setup branch structure (main, dev, vortex-raw)
  status      - Show status of all branches
  promote     - Promote verified modules from vortex-raw to dev
  feature     - Create new feature branch
  cleanup     - Clean up merged branches
  help        - Show help message
```

**Examples:**
```bash
# Setup branches
node scripts/branch-manager.js setup

# Create feature branch
node scripts/branch-manager.js feature semantic-search

# Check status
node scripts/branch-manager.js status
```

---

## 🌳 Branch Structure

The system uses a three-tier branch strategy:

- **🟢 main** - Production (golden standard)
- **🟡 dev** - Development (working area)
- **🔴 vortex-raw** - Raw harvest (unverified)

See `BRANCHING-STRATEGY.md` for detailed workflow.

---

## 📊 Output Structure

After running the orchestrator, you'll have:

```
analysis-output/
├── TAXONOMY.json                      # Domain categorization
├── deduplication-report.json          # Deduplication analysis
├── deduplication-summary.txt          # Human-readable summary
├── architectural-patterns.json        # Detected patterns
├── auto-documentation.json            # Module documentation
├── code-vectors.json                  # Semantic vectors
├── neural-absorption-summary.txt      # Neural summary
├── integration-plan.json              # Integration roadmap
├── training-dataset.jsonl             # Training data (JSONL format)
├── integration-summary.txt            # Integration summary
├── OMNICORE-INTEGRATION-GUIDE.md      # Integration guide
└── qantum-core-utils/                 # Shared library structure
    ├── package.json
    ├── tsconfig.json
    ├── README.md
    └── src/
        ├── index.ts
        ├── security/
        ├── ai/
        ├── utils/
        └── swarm/
```

---

## 🎯 Typical Workflow

### 1. Initial Analysis (vortex-raw branch)
```bash
# Switch to vortex-raw
git checkout vortex-raw

# Run complete analysis
npm run orchestrate

# Review results
cat analysis-output/deduplication-summary.txt
cat analysis-output/integration-summary.txt
```

### 2. Promote to Development
```bash
# Check what will be promoted
npm run branch:status

# Promote verified modules
npm run branch:promote

# Switch to dev
git checkout dev
```

### 3. Deploy to Production
```bash
# Ensure everything is tested
npm test

# Switch to main
git checkout main

# Merge from dev
git merge dev --no-ff
```

---

## 🧪 Testing

Before promotion, run tests:

```bash
# Unit tests
npm test

# Phase-specific tests
npm run test:phase1
npm run test:phase2
npm run test:phase3

# All tests
npm run test:all
```

---

## 🔒 Security

All code must pass security checks before promotion:

1. CodeQL scan
2. Dependency vulnerability check
3. The Scribe validation
4. Manual code review

---

## 📚 Documentation

- `BRANCHING-STRATEGY.md` - Git workflow guide
- `TAXONOMY.json` - Code categorization
- `OMNICORE-INTEGRATION-GUIDE.md` - Integration steps
- `auto-documentation.json` - Module documentation

---

## 🤝 Contributing

1. Create feature branch from dev
2. Implement changes
3. Run analysis and tests
4. Create PR to dev
5. After review, merge to dev

---

## 📝 Notes

- All TypeScript scripts require `ts-node` to run
- Analysis output is excluded from git (see `.gitignore`)
- Training dataset is in JSONL format (one JSON per line)
- Module scoring prioritizes: security, AI core, swarm intelligence

---

## 🆘 Troubleshooting

### "Cannot find module"
```bash
npm install
npm install -g ts-node
```

### "Permission denied"
```bash
chmod +x scripts/*.ts
chmod +x scripts/*.js
```

### "Analysis output not found"
```bash
# Run phase 1 first
npm run analyze
```

---

## 📊 Metrics

Track these metrics:

- **Deduplication Rate**: (Total - Unique) / Total
- **Code Quality Score**: Based on complexity, reusability
- **Pattern Coverage**: Files using recognized patterns
- **Training Dataset Size**: Number of examples generated

---

## 🔮 Future Enhancements

- [ ] Real-time code monitoring
- [ ] Auto-promotion based on test results
- [ ] ML-based module scoring
- [ ] Integration with CI/CD pipeline
- [ ] Dashboard for visualization

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-04  
**Maintainer**: QAntum Core Team
