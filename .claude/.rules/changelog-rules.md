# Changelog Rules

## Auto-update CHANGELOG.md

After every commit, update `CHANGELOG.md` with:
- Date (YYYY-MM-DD format)
- Commit type and message
- Related files modified

## CHANGELOG.md Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### 2026-02-01
- feat(web): add QR scanner component
- fix(payment): handle VNPay callback error
- done(auth): implement JWT refresh flow

### 2026-01-31
- feat(admin): add district management page
- chore(deps): upgrade dependencies

## [1.0.0] - 2026-01-01

### Added
- Initial release
- Next.js 15 with App Router
- Clean Architecture structure
- Biome for linting and formatting
```

## Categories

Use these categories for releases:
- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security vulnerability fixes

## Automation

When making changes:
1. Run `git commit` with proper format
2. Update CHANGELOG.md manually or use automation
3. Reference related issues in commit footer
