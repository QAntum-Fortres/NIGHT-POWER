# Contributing to QANTUM v27.1.0

## 🎯 Code Quality Standards

This project maintains **100% perfectionism**. All contributions must meet the following standards:

### TypeScript Requirements
- All code must be written in TypeScript
- No `any` types without explicit justification
- All functions must have proper return types
- All interfaces must be properly documented

### Testing Requirements
- All new features must include unit tests
- Test coverage must not decrease
- E2E tests for critical paths

### Code Style
- Follow the `.prettierrc` configuration
- Follow the `.eslintrc.json` rules
- Maximum function complexity: 15
- Maximum file length: 500 lines

## 🔧 Development Workflow

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Run linter
npm run lint

# Build
npm run build

# Health check
npm run system:meditate
```

## 📊 Quality Gates

Before submitting a PR, ensure:
- [ ] `npm run lint` passes with no errors
- [ ] `npm run test` passes all tests
- [ ] `npm run system:meditate` shows 100% health
- [ ] `npm run neural:map` shows no new hotspots

## 🏆 Gold Standard Metrics

Your code must not degrade these metrics:
- Failover Latency: < 1ms
- P99 Latency: < 5ms
- Message Loss: 0%
- Health Score: ≥ 95%

## 📝 Commit Messages

Use semantic commit messages:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Test additions
- `chore:` Maintenance

Example: `feat: add predictive resource allocation engine`
