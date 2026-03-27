# PROJECT FLOW GUIDE

Tài liệu này mô tả nhanh luồng dự án, công nghệ sử dụng, API chính và vị trí file theo từng chức năng để đội phát triển dễ quản lý.

## 1. Tổng quan kiến trúc

Dự án đang chạy theo mô hình **modular monolith** trên Next.js App Router:
- UI pages + API route nằm chung trong `app/`
- Logic/domain tách lớp trong `src/`
- ORM và schema DB dùng Prisma trong `prisma/`

Luồng chính:
1. Người dùng truy cập UI (`app/*`)
2. UI gọi API nội bộ (`app/api/*`)
3. API xử lý auth/validate/business
4. API đọc/ghi PostgreSQL qua Prisma client
5. Trả dữ liệu về UI

## 2. Công nghệ sử dụng

- Frontend: Next.js 15, React 19, TailwindCSS, Lucide
- Backend/API: Next.js Route Handler (Node runtime), TypeScript, Zod
- Database: PostgreSQL + Prisma ORM
- Auth/Security: JWT access/refresh token, cookie-based session, password hashing, login lockout
- Media: Cloudinary + S3/MinIO adapter
- Email: Nodemailer (OTP/reset password)
- Testing: Playwright (E2E)
- Tooling: Biome, Husky, Commitlint

## 3. Cấu trúc thư mục quản lý

- `app/`: page UI và API route
- `app/api/`: toàn bộ endpoint REST nội bộ
- `components/`: UI component/layout theo vai trò
- `src/application/`: DTO, validator, service contract
- `src/domain/`: entity/value object
- `src/infrastructure/`: prisma client, security, mailer, media, logging
- `prisma/`: schema và migrations
- `tests/`: test e2e (Playwright)

## 4. Luồng nghiệp vụ theo vai trò

### 4.1 Admin
- UI: `app/admin/*`
- Đăng nhập/session: `app/api/admin/session/*`
- Quản lý POI: `app/api/admin/pois/*`
- Quản lý Tour: `app/api/admin/tours/*`
- Quản lý Vendor: `app/api/admin/vendors/*`

Luồng mẫu:
1. Admin login ở `app/(auth)/admin/login/page.tsx`
2. Nhận cookie token qua `app/api/admin/session/login/route.ts`
3. Vào dashboard/module admin, gọi API tương ứng để CRUD dữ liệu

### 4.2 Vendor
- UI: `app/vendor/*`
- Auth vendor: `app/api/vendor/auth/*`
- Quản lý POI vendor: `app/api/vendor/pois/*`
- Upload media: `app/api/vendor/media/upload/route.ts`

Luồng mẫu:
1. Vendor login ở `app/(auth)/vendor/login/page.tsx`
2. Quản lý POI tại `app/vendor/vendor-poi-management.tsx`
3. Dữ liệu đi qua `app/api/vendor/pois/route.ts` và `app/api/vendor/pois/[id]/route.ts`

### 4.3 Customer
- UI: `app/customer/*`
- Auth customer: `app/api/customer/auth/*`
- Khám phá POI/Tour: `app/api/customer/pois/*`, `app/api/customer/tours/*`, `app/api/customer/search/route.ts`
- Dịch nội dung: `app/api/tools/translate/route.ts`

Luồng mẫu:
1. Customer mở trang khám phá ở `app/customer/page.tsx`
2. Gọi `GET /api/customer/pois` hoặc `GET /api/customer/tours`
3. Trang bản đồ `app/customer/map/page.tsx` lấy GPS, gọi POI theo vị trí
4. Vào chi tiết POI/Tour qua `[id]` route

## 5. Danh sách API chính (theo module)

### 5.1 Auth chung (legacy)
- `POST /api/auth/register` -> `app/api/auth/register/route.ts`
- `POST /api/auth/login` -> `app/api/auth/login/route.ts`
- `POST /api/auth/refresh` -> `app/api/auth/refresh/route.ts`
- `POST /api/auth/logout` -> `app/api/auth/logout/route.ts`
- `GET /api/auth/me` -> `app/api/auth/me/route.ts`

### 5.2 Admin Session/Auth
- `POST /api/admin/session/register`
- `POST /api/admin/session/login`
- `POST /api/admin/session/refresh`
- `POST /api/admin/session/logout`
- `GET /api/admin/session/me`
- `PATCH /api/admin/session/profile`
- `POST /api/admin/session/avatar-upload`

Thư mục: `app/api/admin/session/*`

### 5.3 Admin POI/Tour/Vendor
- POI: `app/api/admin/pois/*`
- Tour: `app/api/admin/tours/*`
- Vendor: `app/api/admin/vendors/*`

### 5.4 Vendor
- Auth: `app/api/vendor/auth/*`
- POI CRUD: `app/api/vendor/pois/route.ts`, `app/api/vendor/pois/[id]/route.ts`
- Lock/Unlock/Resubmit: `app/api/vendor/pois/[id]/lock|unlock|resubmit/route.ts`
- Upload media: `app/api/vendor/media/upload/route.ts`
- Password reset: `app/api/vendor/password/*`

### 5.5 Customer
- Auth: `app/api/customer/auth/*`
- POI list/detail: `app/api/customer/pois/route.ts`, `app/api/customer/pois/[id]/route.ts`
- Tour list/detail: `app/api/customer/tours/route.ts`, `app/api/customer/tours/[id]/route.ts`
- Search: `app/api/customer/search/route.ts`
- Password reset: `app/api/customer/password/*`

### 5.6 API Gateway
- `app/api/gateway/[service]/[...path]/route.ts`
- Vai trò: route proxy/điều phối kiểu service-based

## 6. Bản đồ chức năng -> file để quản lý nhanh

| Chức năng | UI file chính | API file chính | Hạ tầng liên quan |
|---|---|---|---|
| Admin đăng nhập | `app/(auth)/admin/login/page.tsx` | `app/api/admin/session/login/route.ts` | `src/infrastructure/security/*` |
| Vendor đăng nhập | `app/(auth)/vendor/login/page.tsx` | `app/api/vendor/auth/login/route.ts` | `src/infrastructure/security/*` |
| Customer đăng nhập | `app/(auth)/customer/login/page.tsx` | `app/api/customer/auth/login/route.ts` | `src/infrastructure/security/*` |
| Quản lý POI (Admin) | `app/admin/pois/page.tsx` | `app/api/admin/pois/route.ts` | `src/infrastructure/database/prisma/client.ts` |
| Quản lý POI (Vendor) | `app/vendor/vendor-poi-management.tsx` | `app/api/vendor/pois/route.ts` | `src/infrastructure/media/cloudinary.ts` |
| Quản lý Tour (Admin) | `app/admin/tours/page.tsx` | `app/api/admin/tours/route.ts` | `prisma/schema.prisma` |
| Khám phá POI (Customer) | `app/customer/page.tsx` | `app/api/customer/pois/route.ts` | `app/api/customer/_shared.ts` |
| Bản đồ POI + GPS | `app/customer/map/page.tsx` | `app/api/customer/pois/route.ts` | `maplibre-gl`, Web Speech API |
| Chi tiết POI | `app/customer/pois/[id]/page.tsx` | `app/api/customer/pois/[id]/route.ts` | `components/poi/poi-detail-view.tsx` |
| Dịch nội dung | (được gọi từ UI map/POI) | `app/api/tools/translate/route.ts` | `LIBRETRANSLATE_*` |
| Upload avatar/media | `app/vendor/settings/page.tsx`, `app/admin/settings/page.tsx` | `app/api/vendor/auth/avatar-upload/route.ts`, `app/api/admin/session/avatar-upload/route.ts` | `src/infrastructure/media/cloudinary.ts` |
| Reset mật khẩu OTP | `app/(auth)/*/forgot-password/page.tsx` | `app/api/*/password/*` | `src/infrastructure/password-reset/*`, `src/infrastructure/vendor/mailer.ts` |

## 7. Cấu hình môi trường quan trọng

Xem file mẫu: `.env.example`

Nhóm biến chính:
- Database: `DATABASE_URL`
- JWT/Auth: `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`
- Mail/OTP: `SMTP_*`
- Media: `CLOUDINARY_*`, `STORAGE_*`
- Map/UI: `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_APP_URL`
- Translate: `LIBRETRANSLATE_*`

## 8. Quy ước khi thêm chức năng mới

1. Thêm/đổi UI ở `app/<role>/...`
2. Thêm API ở `app/api/<domain>/.../route.ts`
3. Đặt validator ở `src/application/validators/*`
4. Đặt hạ tầng dùng chung ở `src/infrastructure/*`
5. Nếu đổi model dữ liệu: cập nhật `prisma/schema.prisma` + migration
6. Cập nhật lại tài liệu này ở các mục 4, 5, 6

## 9. Gợi ý quản lý team

- Dùng tài liệu này làm chuẩn onboarding cho thành viên mới.
- Khi tạo task, ghi theo format: `Feature -> UI file -> API file -> DB model`.
- Mỗi PR nên chỉ rõ các file thuộc bảng ở mục 6 bị ảnh hưởng.
