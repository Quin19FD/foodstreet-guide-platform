# Smart Food Street Guide Platform

Nền tảng quản trị và khám phá ẩm thực theo **QR + GPS**.

## 1. Project Summary

Project gồm 2 phần chính:

- **Admin CMS**: quản lý District, POI, Tour, Media, Audio Guide, Translation, Analytics.
- **Web Application**: trải nghiệm người dùng cuối theo vị trí thực (GPS), hiển thị POI gần nhất và Audio Guide.

Backend đang tổ chức theo hướng service-based trong cùng codebase:

- **API Gateway route**: `app/api/gateway/[service]/[...path]`
- Service modules: `auth`, `poi`, `tour`, `media`, `audio-guide`, `translation`, `location`

Lưu ý: hiện trạng runtime là **microservice-style scaffold** (modular monolith), chưa tách thành nhiều service deploy độc lập.

## 2. Tech Stack

- Next.js 15 (App Router)
- TypeScript
- TailwindCSS
- Prisma
- Playwright

## 3. Prerequisites

- Node.js `>= 22`
- pnpm `>= 9`

## 4. Environment Setup

Tạo file `.env` từ `.env.example` (nếu chưa có), tối thiểu cấu hình:

- `DATABASE_URL`
- `NEXT_PUBLIC_MAPBOX_TOKEN` (nếu dùng map thật)
- `JWT_SECRET` (cho auth flow)

## 5. Install & Run

```bash
pnpm install
pnpm dev
```

Mặc định app chạy tại:

- `http://localhost:3000` (redirect về admin dashboard)
- `http://localhost:3000/admin/dashboard`

## 6. Available Scripts

```bash
pnpm dev         # run development server
pnpm build       # production build
pnpm start       # run production server
pnpm typecheck   # TypeScript check
pnpm lint        # biome check
pnpm test        # playwright tests
```

## 7. Main Routes

### 7.1 Admin CMS

- `/admin/dashboard`
- `/admin/districts`
- `/admin/pois`
- `/admin/tours`
- `/admin/media`
- `/admin/audio-guides`
- `/admin/translations`
- `/admin/analytics`
- `/admin/settings`

### 7.2 User Web App

- `/map`
- `/scan`
- `/districts`
- `/pois`
- `/tours`

## 8. Code Structure

```text
app/                    # Next.js routes: admin, user, api
  (admin)/              # admin source pages
  admin/                # public admin URL wrappers (/admin/*)
  (map)/                # user-facing pages
  api/gateway/          # gateway route

components/             # shared UI/layout components
lib/                    # utility helpers

src/
  application/          # DTOs, contracts, service interfaces
  domain/               # entities, value objects
  infrastructure/       # gateway router, storage, prisma infra schema
  shared/               # shared config/utils

prisma/                 # primary Prisma schema/config
tests/                  # e2e tests
```

## 9. Architecture Notes

- Source of architecture scope: `SYSTEM_ARCHITECTURE.md`
- Codebase map: `CODEBASE_STRUCTURE.md`
- Scope cleanup notes: `SCOPE_CLEANUP_CHECKLIST.md`

## 10. Troubleshooting

### 10.1 Route 404 sau khi đổi cấu trúc route

```bash
# stop dev server first
rm -rf .next
pnpm dev
```

(Windows PowerShell)

```powershell
Remove-Item -Recurse -Force .next
pnpm dev
```

### 10.2 SWC/version mismatch khi build

```bash
pnpm install
pnpm dev
```

Nếu cần, xóa cache `.next` rồi chạy lại.
