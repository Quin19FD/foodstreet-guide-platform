---
description: Write code using Serena MCP tools only
---

Write code using Serena MCP tools efficiently and correctly.

## 🎯 Serena Code Writing Workflow

### Phase 1: Read Existing Code First

**Before writing, always understand what exists:**

```javascript
// Quick overview of a file
serena_get_symbols_overview("components/ui/Button.tsx")

// Find specific symbol
serena_find_symbol("Button", "components/ui/")

// Read full file if needed
serena_read_file("components/ui/Button.tsx")
```

### Phase 2: Search Before Writing

**Check if similar code already exists:**

```javascript
// Find files by pattern
serena_find_file("*.tsx", "components/")

// Search for code patterns
serena_search_for_pattern("export function", "components/", restrict_search_to_code_files=true)

// Find where symbols are used
serena_find_referencing_symbols("Button", "components/ui/button.tsx")
```

### Phase 3: Create New Files

```javascript
serena_create_text_file(
  "components/ui/Card.tsx",
  "import * as React from 'react';\n\nexport const Card = () => {...}"
)
```

### Phase 4: Modify Existing Code

**For small changes (regex replacement):**
```javascript
serena_replace_content(
  "components/ui/Button.tsx",
  "className=\"btn\"",
  "className=\"btn btn-primary\"",
  "literal"
)
```

**For large changes (regex with wildcards):**
```javascript
serena_replace_content(
  "components/ui/Button.tsx",
  "export function Button.*?\\{.*?return.*?\\}",
  "NEW BUTTON BODY HERE",
  "regex"
)
```

**For symbol-level changes (most precise):**
```javascript
serena_replace_symbol_body(
  "Button",
  "components/ui/Button.tsx",
  "export function Button() {\n  // new body\n}"
)
```

**For inserting imports (before first symbol):**
```javascript
serena_insert_before_symbol(
  "Button",
  "components/ui/Button.tsx",
  "import { Icon } from 'lucide-react';"
)
```

**For adding exports (after symbol):**
```javascript
serena_insert_after_symbol(
  "Button",
  "components/ui/Button.tsx",
  "export type { ButtonProps } from './button.types';"
)
```

## 📋 Common Scenarios

### Adding a New Component
```javascript
// 1. Check if similar component exists
serena_find_file("button.tsx", "components/ui/")

// 2. Read the similar component for patterns
serena_read_file("components/ui/button.tsx")

// 3. Create new component following the pattern
serena_create_text_file("components/ui/Card.tsx", card_content)
```

### Adding a New Function to Existing File
```javascript
// 1. Get symbols overview to find insertion point
serena_get_symbols_overview("lib/utils.ts", depth=0)

// 2. Insert after the last symbol
serena_insert_after_symbol("lastFunction", "lib/utils.ts", new_function)
```

### Updating a Function
```javascript
// 1. Find the function
serena_find_symbol("formatDate", "lib/utils.ts")

// 2. Replace its body
serena_replace_symbol_body("formatDate", "lib/utils.ts", new_body)
```

### Fixing Import Paths
```javascript
// Search for all files with old import
serena_search_for_pattern("from '@/old/path'", "src/", restrict_search_to_code_files=true)

// Replace in each file
serena_replace_content(file_path, "from '@/old/path'", "from '@/new/path'", "literal")
```

## 🎨 Code Patterns to Follow

### Component Structure
```typescript
/**
 * Component Description
 */

import { cn } from '@/lib/utils';

export interface ComponentProps {
  // props
}

export function Component({ props }: ComponentProps) {
  return (
    <div className={cn("base-class", className)}>
      {/* content */}
    </div>
  );
}
```

### Utility Function Structure
```typescript
/**
 * Function description
 */
export function utilityFunction(param: Type): ReturnType {
  // implementation
  return result;
}
```

### Hook Structure
```typescript
/**
 * Hook description
 */
export function useHook() {
  // implementation
  return { /* returns */ };
}
```

## 🚀 Best Practices

### 1. Read Before Writing
Always check existing patterns:
```javascript
serena_get_symbols_overview(path)  // Quick scan
serena_find_symbol(name, path)      // Find specific
serena_read_file(path)              // Full read
```

### 2. Use Symbol Operations When Possible
- `replace_symbol_body` - More precise than replace_content
- `insert_before_symbol` - Perfect for imports
- `insert_after_symbol` - Perfect for exports

### 3. Use Regex for Large Changes
- `replace_content` with `mode: "regex"`
- Use wildcards `.*?` for matching large blocks
- Safer than guessing exact text

### 4. Always Type Check After Changes
```bash
pnpm typecheck
```

### 5. Follow Existing Patterns
- Copy naming conventions
- Match code style
- Use same utilities
- Follow folder structure

## ⚠️ Common Mistakes to Avoid

### Don't: Use Read/Edit tools
```javascript
// ❌ WRONG
Read(file_path)
Edit(file_path, ...)
```

### Do: Use Serena MCP
```javascript
// ✅ CORRECT
serena_read_file(relative_path)
serena_replace_content(relative_path, needle, repl, mode)
```

### Don't: Guess file paths
```javascript
// ❌ WRONG - might not exist
serena_read_file("src/components/Button.tsx")
```

### Do: Search first
```javascript
// ✅ CORRECT - verify exists
serena_find_file("Button.tsx", "components/")
```

### Don't: Replace blindly
```javascript
// ❌ WRONG - could replace wrong occurrence
serena_replace_content(path, "return", "return modified", "literal")
```

### Do: Be specific
```javascript
// ✅ CORRECT - unique pattern
serena_replace_content(path, "return specificValue", "return modifiedValue", "literal")
```

## 🧪 After Writing Code

Always verify:
1. `pnpm typecheck` - No type errors
2. `pnpm lint` - No lint errors
3. Playwright E2E test - Functionality works

## 💡 Pro Tips

1. **Use `get_symbols_overview` first** - Understand the file structure
2. **Use `find_symbol` with `depth=1`** - Get child symbols too
3. **Use `search_for_pattern` for cross-file changes** - Find all occurrences
4. **Use `replace_symbol_body` for functions** - More precise
5. **Use regex mode for large blocks** - Less error-prone

Remember: **Serena MCP > Built-in tools. Always.**