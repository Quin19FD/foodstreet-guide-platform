# CHECK - Audit chuc nang hien tai

## Pham vi kiem tra
- Da doc code thuc te trong `app/`, `app/api/`, `src/`, `prisma/`.
- Bao cao nay dua tren code dang co, khong chi dua vao README.

## 1) Chuc nang da hoan thanh

### A. Auth va session
- Admin: login, refresh, me, logout, bootstrap admin dau tien, cap nhat profile, upload avatar.
  - File: `app/api/admin/session/login/route.ts`, `app/api/admin/session/refresh/route.ts`, `app/api/admin/session/me/route.ts`, `app/api/admin/session/logout/route.ts`, `app/api/admin/session/register/route.ts`, `app/api/admin/session/profile/route.ts`, `app/api/admin/session/avatar-upload/route.ts`.
- Vendor: register (PENDING), login, refresh, me, logout, profile, avatar.
  - File: `app/api/vendor/auth/register/route.ts`, `app/api/vendor/auth/login/route.ts`, `app/api/vendor/auth/refresh/route.ts`, `app/api/vendor/auth/me/route.ts`, `app/api/vendor/auth/logout/route.ts`, `app/api/vendor/auth/profile/route.ts`, `app/api/vendor/auth/avatar-upload/route.ts`.
- Customer: register, login, refresh, me, logout.
  - File: `app/api/customer/auth/register/route.ts`, `app/api/customer/auth/login/route.ts`, `app/api/customer/auth/refresh/route.ts`, `app/api/customer/auth/me/route.ts`, `app/api/customer/auth/logout/route.ts`.
- Quen mat khau OTP cho ca 3 role.
  - File: `app/api/admin/password/*`, `app/api/vendor/password/*`, `app/api/customer/password/*`.
- Middleware bao ve route admin/vendor bang cookie.
  - File: `middleware.ts`.

### B. Admin
- Quan ly POI theo DB: list/filter, detail, approve/reject, lock/unlock.
  - UI: `app/admin/pois/page.tsx`, `app/admin/pois/poi-management.tsx`, `app/admin/pois/[id]/admin-poi-detail.tsx`.
  - API: `app/api/admin/pois/route.ts`, `app/api/admin/pois/[id]/route.ts`, `app/api/admin/pois/[id]/decision/route.ts`, `app/api/admin/pois/[id]/lock/route.ts`, `app/api/admin/pois/[id]/unlock/route.ts`.
- Quan ly Vendor theo DB: tao/sua/duyet/tu choi/xoa mem/khoi phuc.
  - UI: `app/admin/vendors/vendor-management.tsx`.
  - API: `app/api/admin/vendors/route.ts`, `app/api/admin/vendors/[id]/route.ts`.
- Quan ly Tour theo DB: tao/sua, sap xep stop, an/hien tour, xem chi tiet.
  - UI: `app/admin/tours/tour-management.tsx`.
  - API: `app/api/admin/tours/route.ts`, `app/api/admin/tours/[id]/route.ts`.
- Nhat ky he thong (userActivity) da co.
  - File: `app/admin/activity-logs/page.tsx`.
- Settings admin (profile + avatar) da co.
  - File: `app/admin/settings/page.tsx`.

### C. Vendor
- Quan ly POI vendor theo DB: tao POI (translation, image, menu), sua, lock/unlock, resubmit.
  - UI: `app/vendor/vendor-poi-management.tsx`, `app/vendor/pois/[id]/page.tsx`.
  - API: `app/api/vendor/pois/route.ts`, `app/api/vendor/pois/[id]/route.ts`, `app/api/vendor/pois/[id]/lock/route.ts`, `app/api/vendor/pois/[id]/unlock/route.ts`, `app/api/vendor/pois/[id]/resubmit/route.ts`.
- Upload media vendor da co.
  - File: `app/api/vendor/media/upload/route.ts`.
- Settings vendor (profile + avatar) da co.
  - File: `app/vendor/settings/page.tsx`, `app/api/vendor/auth/profile/route.ts`, `app/api/vendor/auth/avatar-upload/route.ts`.

### D. Customer
- Kham pha POI/Tour theo DB da co.
  - UI: `app/customer/page.tsx`.
  - API: `app/api/customer/pois/route.ts`, `app/api/customer/tours/route.ts`.
- Ban do GPS + cluster + hang doi thuyet minh da co.
  - UI: `app/customer/map/page.tsx`.
- Chi tiet POI da co (anh, menu, TTS, dich).
  - UI: `app/customer/pois/[id]/page.tsx`.
  - API: `app/api/customer/pois/[id]/route.ts`, `app/api/tools/translate/route.ts`.
- Danh sach/chi tiet tour da co.
  - UI: `app/customer/tours/page.tsx`, `app/customer/tours/[id]/page.tsx`.
  - API: `app/api/customer/tours/route.ts`, `app/api/customer/tours/[id]/route.ts`.
- Search tong hop customer da co.
  - File: `app/api/customer/search/route.ts`.

## 2) Chuc nang chua hoan thanh / dang partial

### A. Con dung mock data
Nhung man hinh sau dang dung `mockPlatformService` (`src/application/services/mock-platform.ts`), chua noi day du voi DB:
- `app/admin/dashboard/page.tsx`
- `app/admin/districts/page.tsx`
- `app/admin/media/page.tsx`
- `app/admin/audio-guides/page.tsx`
- `app/admin/translations/page.tsx`
- `app/admin/analytics/page.tsx`
- `app/customer/favorites/page.tsx`

### B. Customer profile co link den route chua ton tai
Trong `app/customer/profile/page.tsx` co cac link:
- `/customer/history`
- `/customer/reviews`
- `/customer/language`
- `/customer/notifications`
- `/customer/settings`

Nhung hien tai khong co file route tuong ung trong `app/customer/*` -> se 404.

### C. API Gateway dang o muc mock
- Gateway route co san: `app/api/gateway/[service]/[...path]/route.ts`.
- Router van dispatch vao mock service: `src/infrastructure/api-gateway/router.ts`.

### D. Entry root chua phuc vu user chung
- `app/page.tsx` dang redirect thang ve `/admin/login`.

### E. Script docker chua dung duoc
- `package.json` co `docker:up`/`docker:down` tro toi `infrastructure/docker/docker-compose.yml`.
- Trong repo hien tai khong co file/folder do.

### F. Chua co seed script ro rang
- Khong thay `prisma seed` hoac file seed.

## 3) Cach chay du an (Admin, Vendor, User)

### 3.1 Dieu kien
- Node.js >= 22
- pnpm >= 9
- PostgreSQL dang chay

### 3.2 Setup va run
1. Cai dependencies:
```bash
pnpm install
```

2. Tao `.env` tu `.env.example`, it nhat can:
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`

3. Dong bo schema DB:
```bash
pnpm db:push
```

4. Chay dev:
```bash
pnpm dev
```

### 3.3 Truy cap theo role

#### Admin
- Login: `http://localhost:3000/admin/login`
- Neu lan dau chua co admin: vao `http://localhost:3000/admin/register` de bootstrap admin dau tien.
- Sau login: `http://localhost:3000/admin/dashboard`

#### Vendor
- Register: `http://localhost:3000/vendor/register`
- Login: `http://localhost:3000/vendor/login`
- Luu y: tai khoan vendor tu dang ky la `PENDING`, can admin duyet moi login duoc.
- Sau login: `http://localhost:3000/vendor`

#### Customer (User)
- Register: `http://localhost:3000/customer/register`
- Login: `http://localhost:3000/customer/login`
- Cac trang chinh:
  - `http://localhost:3000/customer`
  - `http://localhost:3000/customer/map`
  - `http://localhost:3000/customer/tours`

## 4) Tong ket nhanh
- Auth/session 3 role: **Da co**
- Admin quan ly Vendor/POI/Tour: **Da co**
- Vendor quan ly POI: **Da co**
- Customer discovery/map/poi/tour: **Da co**
- Dashboard/analytics/media/audio/translation/district: **Partial (mock)**
- Favorites/profile customer: **Partial/Chua xong**
- Gateway microservice: **Partial (van mock)**
