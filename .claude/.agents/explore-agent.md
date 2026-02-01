# Explore Agent Configuration

## Purpose

This agent is used to explore the codebase and understand:
- Existing patterns and conventions
- File locations and structure
- Dependencies between modules
- Implementation of specific features

## Usage Guidelines

When exploring, focus on:
1. **Understanding before changing** - Always read before editing
2. **Pattern recognition** - Identify existing patterns to follow
3. **Clean Architecture layers** - Know which layer you're in
4. **Related files** - Find all files related to a feature

## Search Strategy

```
1. Start with domain entities for business logic
2. Check application layer for use cases
3. Look at infrastructure for external dependencies
4. Review presentation layer for UI components
```

## Common Exploration Tasks

| Task | Command |
|------|---------|
| Find component location | `components/features/**/*` |
| Find domain entity | `src/domain/entities/*.ts` |
| Find use case | `src/application/use-cases/**/*.ts` |
| Find API route | `app/api/**/*.ts` |
| Find page | `app/**/page.tsx` |
