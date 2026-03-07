# Codebase Structure Overview

Tài liệu này mô tả ngắn gọn vị trí code theo hiện trạng dự án.

## 1) Frontend Code Ở Đâu?

Frontend nằm chủ yếu tại:

- `app/` (Next.js App Router pages)
- `components/` (UI components, layouts)
- `lib/` (helper dùng cho frontend)
- `app/globals.css` (global styles)

## 2) Backend Code Ở Đâu?

Backend (theo kiểu internal API + service layer trong cùng repo) nằm tại:

- `app/api/` (API routes, hiện có gateway route)
- `src/application/` (DTOs, service contracts)
- `src/domain/` (domain entities/value objects)
- `src/infrastructure/` (gateway router, storage, prisma schema phụ)
- `prisma/` + `prisma.config.ts` (Prisma schema/config chính)

## 3) Có Phải Microservice Không?

**Kết luận hiện tại: chưa phải microservice runtime thực tế.**

Hiện trạng:
- Có phân tách logic theo service (Auth, POI, Tour, Media, Audio Guide, Translation, Location).
- Có API gateway route (`app/api/gateway/...`).
- Nhưng vẫn chạy trong **một ứng dụng Next.js** (một process deploy).

=> Đây là **microservice-style scaffold / modular monolith**, chưa phải hệ microservice deploy độc lập từng service.

## 4) Admin Code Ở Đâu?

Admin UI nằm tại:

- `app/(admin)/...` (nguồn trang admin)
- `app/admin/...` (route thật `/admin/*`, wrapper re-export)
- `components/layouts/admin-layout.tsx` (layout dashboard admin)

Các trang admin chính:
- `dashboard`, `districts`, `pois`, `tours`, `media`, `audio-guides`, `translations`, `analytics`, `settings`.

## 5) Người Dùng (Web App) Code Ở Đâu?

Web app cho người dùng cuối nằm tại:

- `app/(map)/...` (map, scan, districts, pois, tours)
- `app/(map)/layout.tsx` (layout user-facing: header/footer)
- `app/(auth)/login/page.tsx` (đăng nhập)
- `components/layouts/header.tsx`, `components/layouts/footer.tsx`, `components/layouts/main-layout.tsx`

