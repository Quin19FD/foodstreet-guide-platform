# FoodStreet Guide Platform - AI Assistant Context

## Project Overview
Nền tảng hướng dẫn ẩm thực đường phố thông minh với QR Code và GPS.

Người dùng quét mã QR tại khu phố ẩm thực để:
- Xem danh sách gian hàng (POI) gần vị trí của họ
- Nghe thuyết minh đa ngôn ngữ về các món ăn
- Đặt món trực tuyến và thanh toán qua VietQR/VNPay

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Database**: PostgreSQL với Prisma ORM
- **Testing**: Playwright (E2E)
- **State**: Zustand, TanStack Query
- **Maps**: Mapbox GL JS
- **Icons**: Lucide React
- **UI**: Radix UI components

## ⚡ MANDATORY WORKFLOW (BẮT BUỘC)

Luôn tuân theo quy trình này cho mỗi task:

```
PLAN → CODE → REVIEW → OPTIMIZE → FIX BUGS → E2E TEST → LOOP
```

### Phase 1: PLAN
- Sử dụng **Serena MCP** để đọc file hiện tại
- Dùng `find_symbol` để hiểu code structure
- Dùng `search_for_pattern` để tìm code liên quan
- Đặt câu hỏi nếu yêu cầu không rõ

### Phase 2: CODE
- Dùng `create_text_file` cho file mới
- Dùng `replace_content` hoặc `replace_symbol_body` để sửa
- Follow existing code patterns

### Phase 3: REVIEW
- Chạy: `pnpm typecheck`
- Chạy: `pnpm lint`
- Fix tất cả errors

### Phase 4: OPTIMIZE
- Review code để cải thiện
- Tối ưu nếu cần

### Phase 5: FIX BUGS
- Nếu typecheck/lint fail, fix ngay
- Nếu Serena tools error, fix và retry

### Phase 6: E2E TEST (BẮT BUỘC)
- Dùng **Playwright MCP**:
  1. `browser_navigate` đến http://localhost:3000
  2. `browser_snapshot` để kiểm tra DOM
  3. `browser_take_screenshot` để kiểm tra visual
  4. `browser_console_messages` để kiểm tra errors
  5. Test chức năng cụ thể
- Nếu test fails: FIX và RETEST từ Phase 2

### Phase 7: LOOP
- Nếu test passes: DONE
- Nếu test fails: Quay lại Phase 2

## MCP Tools Priority

### Serena MCP (Ưu tiên #1 - Code interaction)
**LUÔN dùng Serena cho mọi thao tác file:**

| Tool | Mục đích |
|------|----------|
| `read_file` | Đọc nội dung file |
| `create_text_file` | Tạo file mới |
| `replace_content` | Thay thế nội dung (regex/literal) |
| `replace_symbol_body` | Thay thế function/class body |
| `insert_before_symbol` | Chèn code trước symbol |
| `insert_after_symbol` | Chèn code sau symbol |
| `find_symbol` | Tìm class, function, interface |
| `find_referencing_symbols` | Tìm nơi symbol được dùng |
| `search_for_pattern` | Tìm pattern trong codebase |
| `find_file` | Tìm file theo pattern |
| `get_symbols_overview` | Xem tổng quan symbols trong file |
| `list_dir` | Liệt kê directory |
| `execute_shell_command` | Chạy shell commands |

**KHÔNG BAO GIỜ DÙNG Read/Edit tools mặc định.**

### Playwright MCP (Ưu tiên #2 - E2E Testing)
**LUÔN dùng Playwright MCP để test sau mỗi code change:**

| Tool | Mục đích |
|------|----------|
| `browser_navigate` | Mở trang web |
| `browser_snapshot` | Kiểm tra accessibility tree |
| `browser_take_screenshot` | Chụp màn hình |
| `browser_click` | Click element |
| `browser_type` | Nhập text |
| `browser_fill_form` | Điền form |
| `browser_select_option` | Chọn dropdown |
| `browser_console_messages` | Kiểm tra console errors |
| `browser_network_requests` | Kiểm tra network requests |
| `browser_evaluate` | Run JavaScript |
| `browser_wait_for` | Đợi element/time |

### Context7 MCP (Documentation)
Dùng khi cần tài liệu library/framework:
- `resolve-library-id` - Tìm library ID
- `query-docs` - Truy vấn docs

### Web Search (Tìm kiếm)
Dùng khi cần thông tin mới từ internet.

## Development Commands
```bash
pnpm dev          # Start dev server
pnpm build        # Build production
pnpm start        # Start production server
pnpm typecheck    # TypeScript check
pnpm lint         # Biome lint
pnpm lint:fix     # Auto fix
pnpm format       # Format code
pnpm test         # Playwright E2E
pnpm test:ui      # Playwright UI mode
```

## Code Style Rules

### TypeScript
- Strict mode, không dùng `any`
- Dùng `interface` cho object shapes
- Dùng `type` cho unions/intersections
- Dùng `readonly` cho immutable data

### React
- Server Components by default
- Chỉ dùng `"use client"` khi cần (interactivity)
- Server Actions优先过 client-side handlers
- File naming: PascalCase (e.g., `QRScanner.tsx`)

### Clean Architecture Layers
```
src/
├── domain/           # Business logic (entities, value objects)
├── application/      # Use cases, orchestration
├── infrastructure/   # External integrations (DB, API)
└── shared/           # Shared utilities
```

## Project Structure
```
app/              # Next.js App Router pages
components/       # React components
│   ├── features/ # Feature-specific components
│   ├── layouts/  # Layout components (Header, Footer)
│   └── ui/       # Reusable UI components (Button, Card, ...)
lib/             # Utility functions
src/
├── domain/           # Business logic
├── application/      # Use cases
├── infrastructure/   # External integrations
└── shared/           # Shared utilities
infrastructure/   # Docker, configs
tests/           # E2E tests
```

## Testing Requirements
**MỌI thay đổi PHẢI được test với Playwright MCP:**

1. Navigate đến affected page
2. Take snapshot để kiểm tra accessibility
3. Take screenshot để kiểm tra visual
4. Check console messages cho errors
5. Verify functionality works

## Environment Variables
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox access token
- Database URL trong `.env` (KHÔNG commit)

## Common Patterns

### Reading Code
```typescript
// 1. Activate project first
serena_activate_project(project_path)

// 2. Get symbols overview
serena_get_symbols_overview(relative_path)

// 3. Find specific symbol
serena_find_symbol(name_path_pattern, relative_path)
```

### Writing Code
```typescript
// 1. Create new file
serena_create_text_file(relative_path, content)

// 2. Modify existing - small change
serena_replace_content(relative_path, needle, repl, "literal")

// 3. Modify existing - regex
serena_replace_content(relative_path, needle, repl, "regex")

// 4. Replace symbol body
serena_replace_symbol_body(name_path, relative_path, body)
```

### Testing with Playwright
```typescript
// 1. Navigate
browser_navigate("http://localhost:3000")

// 2. Check page
browser_snapshot()
browser_take_screenshot({filename: "test.png"})

// 3. Check errors
browser_console_messages({level: "error"})

// 4. Test functionality
browser_click(element, ref)
```

## Skills Available
- `/e2e-test` - Run E2E test với Playwright MCP
- `/code-with-serena` - Write code sử dụng Serena MCP

## Agents Available
- `workflow-agent` - Enforce plan->code->review->test workflow
- `serena-code-reader` - Expert at reading codebase với Serena