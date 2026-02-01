# MCP Workflow Rules

## Rule 1: Serena MCP First for File Operations

**ALWAYS use Serena MCP tools for file operations.**

### ✅ ALLOWED (Serena MCP)
- `mcp__plugin_serena_serena__read_file`
- `mcp__plugin_serena_serena__create_text_file`
- `mcp__plugin_serena_serena__replace_content`
- `mcp__plugin_serena_serena__replace_symbol_body`
- `mcp__plugin_serena_serena__insert_before_symbol`
- `mcp__plugin_serena_serena__insert_after_symbol`
- `mcp__plugin_serena_serena__find_symbol`
- `mcp__plugin_serena_serena__find_referencing_symbols`
- `mcp__plugin_serena_serena__search_for_pattern`
- `mcp__plugin_serena_serena__get_symbols_overview`

### ❌ FORBIDDEN (Built-in tools)
- `Read` - DON'T USE, use `serena_read_file` instead
- `Edit` - DON'T USE, use `serena_replace_content` instead

### Why?
- Serena understands code structure (symbols, references)
- More precise code modifications
- Better for large codebases
- Consistent with Clean Architecture

---

## Rule 2: Playwright E2E After Every Code Change

**After modifying code, ALWAYS test with Playwright MCP.**

### Required Test Steps
1. `browser_navigate` - Navigate to affected page
2. `browser_snapshot` - Check accessibility tree
3. `browser_take_screenshot` - Visual verification
4. `browser_console_messages` - Check for errors
5. Test the specific functionality

### No Exceptions
- Even "small" changes need testing
- Even "obvious" fixes need testing
- Every PR must have E2E evidence

### If Test Fails
1. Fix the code
2. Re-run from step 1
3. Don't proceed until test passes

---

## Rule 3: Context7 for Documentation

**When needing library/framework documentation, use Context7 MCP.**

### When to Use
- "How do I use Next.js 15 App Router?"
- "What's the API for Prisma Client?"
- "How to configure Tailwind CSS?"

### How to Use
1. Use `resolve-library-id` to find the library
2. Use `query-docs` to get specific information

### Examples
```
Use Context7 to get Next.js 15 middleware docs.
Use Context7 to find Prisma schema best practices.
```

---

## Rule 4: Web Search for Current Info

**When needing latest information, use Web Search tools.**

### When to Use
- Recent documentation changes
- Latest package versions
- Current best practices
- New features or deprecations

### Available Tools
- `WebSearch` - Search the web
- `WebFetch` / `webReader` - Fetch specific URLs

---

## Rule 5: Think Before Acting

**Use Serena think tools to stay focused.**

### When to Use Think Tools
- `serena_think_about_task_adherence` - Before making changes
- `serena_think_about_collected_information` - After exploring
- `serena_think_about_whether_you_are_done` - Before finishing

### Why?
- Prevents going off-track
- Ensures information is sufficient
- Confirms task completion

---

## Rule 6: Clean Code Principles

### Before Writing Code
1. Read existing code patterns
2. Follow established conventions
3. Use existing utilities when possible

### After Writing Code
1. Run typecheck (`pnpm typecheck`)
2. Run lint (`pnpm lint`)
3. Fix all errors before proceeding

---

## Rule 7: Git Hygiene

### Commit Messages
Follow format: `type(scope): description`

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `perf`, `chore`

Scopes: `auth`, `poi`, `location`, `payment`, `order`, `ui`, etc.

### Before Pushing
1. Typecheck passes
2. Lint passes
3. E2E tests pass
4. No console errors
5. No broken features

---

## Rule 8: Testing Coverage

### What to Test
- New features MUST have E2E tests
- Bug fixes MUST have regression tests
- Critical paths MUST always work

### How to Test
1. Use Playwright MCP for E2E
2. Test user flows, not just components
3. Test error cases
4. Test edge cases

---

## Quick Reference

| Task | Tool | Command |
|------|------|---------|
| Read file | Serena | `serena_read_file(path)` |
| Create file | Serena | `serena_create_text_file(path, content)` |
| Modify file | Serena | `serena_replace_content(path, needle, repl, mode)` |
| Find symbol | Serena | `serena_find_symbol(pattern, path)` |
| E2E Test | Playwright | `browser_navigate(url)` → `browser_snapshot()` |
| Docs | Context7 | `resolve-library_id(name)` → `query-docs(id, query)` |
| Search | WebSearch | `WebSearch(query)` |
| Think | Serena | `serena_think_about_task_adherence()` |

---

## Violation Consequences

If you violate these rules:
1. Type errors will accumulate
2. Tests will fail
3. Code quality will degrade
4. Technical debt will increase

**Follow the rules. Every time.**