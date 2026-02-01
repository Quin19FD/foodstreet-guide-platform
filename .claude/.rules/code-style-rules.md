# Code Style Rules

## TypeScript

- Use strict mode (enabled in tsconfig.json)
- Avoid `any` - use `unknown` or proper types
- Use `interface` for public APIs, `type` for internal/shared types
- Use `readonly` for immutable data
- Use `as const` for object literals that should be inferred
- Prefer `const assertions` over type casts

```typescript
// Good
interface UserRepository {
  findById(id: string): Promise<User | null>;
}

type UserState = "active" | "inactive" | "suspended";

const config = {
  apiUrl: "/api",
  timeout: 5000,
} as const;

// Avoid
function foo(data: any) { }
```

## React

- Use functional components with hooks
- Use Server Components by default (Next.js 15)
- Use `"use client"` only when needed (interactivity, browser APIs)
- Prefer Server Actions over API Routes for mutations
- Use `useCallback` for callbacks passed to child components
- Use `useMemo` for expensive computations
- Follow Rules of Hooks

```typescript
// Server Component (default)
export default function UserList() {
  const users = await fetchUsers();
  return <div>{/* ... */}</div>;
}

// Client Component (when needed)
"use client";

export function InteractiveMap() {
  // ...
}
```

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `QRScanner.tsx`, `POICard.tsx` |
| Utilities | camelCase | `formatCurrency.ts`, `calculateDistance.ts` |
| Hooks | camelCase with "use" prefix | `useLocation.ts`, `useAuth.ts` |
| Types | PascalCase | `User.ts`, `Order.ts` |
| Tests | camelCase with `.spec` suffix | `qr-scanner.spec.ts` |
| Folders | kebab-case | `qr-scanner/`, `audio-guide/` |

## Import Order

```typescript
// 1. React/Next.js imports
import { useState } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party imports
import { useQuery } from "@tanstack/react-query";
import mapboxgl from "mapbox-gl";

// 3. Alias imports (@/*)
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

// 4. Relative imports
import { styles } from "./styles.css";

// 5. Styles (if using CSS modules)
import "./qr-scanner.css";
```

## Clean Architecture Layers

### Domain Layer
- Pure TypeScript, no framework dependencies
- Business entities and value objects
- Framework-agnostic

```typescript
// src/domain/entities/user.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
  ) {}
}
```

### Application Layer
- Use cases and business logic
- Interfaces for infrastructure services

### Infrastructure Layer
- External dependencies (Prisma, APIs, etc.)
- Implements interfaces from Application layer

### Presentation Layer
- Next.js App Router
- Components and pages
