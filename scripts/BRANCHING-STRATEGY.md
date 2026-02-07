# 🌳 Git Branching Strategy - QAntum Framework

## Overview

This document describes the branching strategy for managing the QAntum codebase, especially after the absorption of 1172+ scripts from various sources.

## Branch Structure

### 🟢 `main` - Production Branch (Golden Standard)
**Purpose**: The production-ready, stable codebase
**Criteria**: 
- ✅ All code must be fully tested
- ✅ Zero known bugs
- ✅ Complete documentation
- ✅ Passed all security scans (CodeQL)
- ✅ Code review approved
- ✅ Integration tests passing

**Contains**:
- OmniCore verified modules
- Stable API endpoints
- Production-ready features
- Verified scripts from Neural Absorption

**Protection Rules**:
- Requires pull request reviews
- Status checks must pass
- No direct commits
- Merge only from `dev` after full validation

---

### 🟡 `dev` - Development Branch (Working Plate)
**Purpose**: Active development and integration testing
**Criteria**:
- ✅ Unit tests passing
- ✅ Basic functionality verified
- ⚠️ May contain minor bugs (acceptable)
- ⚠️ Documentation in progress

**Contains**:
- The Scribe (Watchdog) system
- Tools under optimization
- Features in integration testing
- Modules promoted from feature branches

**Workflow**:
- Merge feature branches here first
- Run integration tests
- Stabilize before merging to `main`

---

### 🔴 `vortex-raw` - Raw Harvest Branch (Chaos Zone)
**Purpose**: Contains all absorbed scripts before verification
**Criteria**:
- ⚠️ Unverified code
- ⚠️ May contain duplicates
- ⚠️ Security not validated
- ⚠️ No guarantees of functionality

**Contains**:
- All 1172+ harvested scripts
- Raw code from brutality-vortex
- Unprocessed modules
- Experimental imports

**Workflow**:
1. Scripts land here initially
2. Run deduplication analysis
3. Neural absorption and vectorization
4. The Scribe validation
5. Promote verified modules to `dev`

---

### 🔵 Feature Branches
**Naming Convention**: `feature/<feature-name>` or `feat/<feature-name>`
**Examples**:
- `feature/neural-magnet`
- `feature/semantic-search`
- `feature/training-dataset`

**Lifecycle**:
1. Branch from `dev`
2. Implement feature
3. Local testing
4. PR to `dev`
5. Delete after merge

---

### 🟠 Hotfix Branches
**Naming Convention**: `hotfix/<issue-description>`
**Examples**:
- `hotfix/security-vulnerability`
- `hotfix/critical-bug`

**Lifecycle**:
1. Branch from `main`
2. Fix critical issue
3. PR to both `main` and `dev`
4. Delete after merge

---

## Workflow Diagram

```
vortex-raw (Raw Harvest)
    ↓
    ├─→ Deduplication
    ├─→ Neural Absorption
    ├─→ The Scribe Validation
    ↓
dev (Development)
    ↓
    ├─→ Integration Tests
    ├─→ Code Review
    ├─→ Security Scan
    ↓
main (Production)
```

---

## Promotion Criteria

### From `vortex-raw` → `dev`
1. ✅ Deduplication completed
2. ✅ Vectorized by NeuralCoreMagnet
3. ✅ The Scribe validation passed
4. ✅ No security vulnerabilities
5. ✅ Basic documentation added

### From `dev` → `main`
1. ✅ All unit tests passing
2. ✅ Integration tests passing
3. ✅ Code review approved (2+ reviewers)
4. ✅ Full documentation
5. ✅ Security scan clean
6. ✅ Performance benchmarks met
7. ✅ Backward compatibility verified

---

## Commands Reference

### Creating Branches
```bash
# Create development branch
git checkout -b dev

# Create vortex-raw branch
git checkout -b vortex-raw

# Create feature branch
git checkout -b feature/my-feature
```

### Switching Branches
```bash
# Switch to dev
git checkout dev

# Switch to main
git checkout main

# Switch to vortex-raw
git checkout vortex-raw
```

### Merging Workflow
```bash
# Merge feature to dev
git checkout dev
git merge feature/my-feature --no-ff

# Merge dev to main (after testing)
git checkout main
git merge dev --no-ff
```

### Viewing Branch Status
```bash
# List all branches
git branch -a

# Show branch differences
git diff main..dev

# Show commit history
git log --oneline --graph --all
```

---

## Current Status

### Scripts Location
- **Phase 1**: Deduplication script → `scripts/deduplicate-analyze.ts`
- **Phase 2**: Neural Magnet → `scripts/neural-core-magnet.ts`
- **Phase 3**: QAntum Integrator → `scripts/qantum-integrator.ts`
- **Master**: Orchestrator → `scripts/master-orchestrator.ts`

### Recommended Initial Setup
```bash
# 1. Commit current work to feature branch
git add .
git commit -m "feat: Add 3-phase deduplication and integration system"

# 2. Create dev branch
git checkout -b dev
git push -u origin dev

# 3. Create vortex-raw branch (for raw harvest)
git checkout -b vortex-raw
git push -u origin vortex-raw

# 4. Return to main workflow
git checkout dev
```

---

## The Scribe (Watchdog) Integration

The Scribe validates code before promotion:

1. **Security Check**: Scans for vulnerabilities
2. **Quality Check**: Ensures code standards
3. **Duplication Check**: Prevents redundant code
4. **Documentation Check**: Validates inline docs
5. **Test Coverage**: Ensures adequate testing

Only scripts passing The Scribe's validation can be promoted from `vortex-raw` to `dev`.

---

## Best Practices

### DO ✅
- Always branch from the correct base (`dev` for features, `main` for hotfixes)
- Write meaningful commit messages
- Keep branches short-lived
- Delete branches after merge
- Run tests before pushing
- Use pull requests for all merges

### DON'T ❌
- Don't commit directly to `main`
- Don't merge untested code to `dev`
- Don't keep stale branches
- Don't push without running linters
- Don't merge without code review
- Don't commit sensitive data

---

## Emergency Procedures

### Rollback Production
```bash
# Revert to previous stable state
git checkout main
git revert HEAD
git push origin main
```

### Abandon Feature Branch
```bash
# Delete local branch
git branch -D feature/my-feature

# Delete remote branch
git push origin --delete feature/my-feature
```

### Sync Branches
```bash
# Update dev from main
git checkout dev
git merge main --no-ff

# Update vortex-raw from dev (if needed)
git checkout vortex-raw
git merge dev --no-ff
```

---

## Automation with Scripts

Use the master orchestrator with branch-aware behavior:

```bash
# Run on vortex-raw to analyze
git checkout vortex-raw
npm run analyze

# Promote verified modules to dev
git checkout dev
npm run integrate-verified

# Deploy stable modules to main
git checkout main
npm run deploy-production
```

---

## Monitoring and Metrics

Track these metrics per branch:

- **vortex-raw**: Raw module count, duplication rate
- **dev**: Test coverage, bug count, code quality score
- **main**: Uptime, performance metrics, user satisfaction

---

## Questions?

For questions about the branching strategy, contact:
- **Architecture**: АРХИТЕКТЕ team
- **Security**: The Scribe (Watchdog) system
- **DevOps**: QAntum DevOps team

---

**Last Updated**: 2026-02-04  
**Version**: 1.0.0  
**Owner**: QAntum Core Team
