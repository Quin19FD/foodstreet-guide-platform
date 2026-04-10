# DUAN - Bản đồ chức năng & đường dẫn mã nguồn

## 1) Giới thiệu dự án

**Smart Food Street Guide Platform** là nền tảng quản lý và khám phá ẩm thực theo vị trí (GPS), gồm 3 nhóm người dùng chính:
- **Admin**: quản trị toàn bộ hệ thống (POI, tour, user, vendor, media, analytics...).
- **Vendor**: quản lý điểm bán/gian hàng của mình.
- **Customer**: khám phá POI/tour trên bản đồ, nghe audio guide, lưu yêu thích.

Dự án đang triển khai theo mô hình **Next.js fullstack**: frontend + API backend nằm chung trong một codebase, có định hướng microservice-style ở lớp domain/application/infrastructure.

---

## 2) Công nghệ sử dụng

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS, Radix UI
- **Bản đồ**: maplibre-gl
- **Backend API**: Next.js Route Handlers (`app/api/**`)
- **ORM/DB**: Prisma + PostgreSQL
- **Validation**: Zod
- **Auth/Security**: JWT, cookie auth, refresh token, rate-limit, lockout
- **Test**: Playwright (E2E), Vitest (unit)
- **Tooling**: Biome, Husky, Commitlint

---

## 3) Frontend ở đâu? Backend ở đâu?

## Frontend (UI/Pages)
- **App Router pages**: `app/**/page.tsx`
- **Layouts**: `app/layout.tsx`, `app/customer/layout.tsx`, `components/layouts/*`
- **UI components**: `components/ui/*`
- **Feature components**: `components/features/*`, `components/poi/*`

## Backend (API + nghiệp vụ)
- **API routes**: `app/api/**/route.ts`
- **Business/domain layers**:
  - `src/application/**` (DTO, validators, service contracts)
  - `src/domain/**` (entities, value objects)
  - `src/infrastructure/**` (security, prisma client, mailer, storage, logging)
- **DB schema/migrations**: `prisma/schema.prisma`, `prisma/migrations/*`

---

## 4) Các màn hình frontend chính (theo route)

## Public / Chung
- `/` → `app/page.tsx`
- `/welcome` → `app/welcome/page.tsx`
- `/auth/login` → `app/auth/login/page.tsx`
- `/auth/register` → `app/auth/register/page.tsx`

## Auth theo vai trò
- **Admin auth**
  - `/admin/login` → `app/(auth)/admin/login/page.tsx`
  - `/admin/register` → `app/(auth)/admin/register/page.tsx`
  - `/admin/forgot-password` → `app/(auth)/admin/forgot-password/page.tsx`
- **Vendor auth**
  - `/vendor/login` → `app/(auth)/vendor/login/page.tsx`
  - `/vendor/register` → `app/(auth)/vendor/register/page.tsx`
  - `/vendor/forgot-password` → `app/(auth)/vendor/forgot-password/page.tsx`
- **Customer auth**
  - `/customer/login` → `app/(auth)/customer/login/page.tsx`
  - `/customer/register` → `app/(auth)/customer/register/page.tsx`
  - `/customer/forgot-password` → `app/(auth)/customer/forgot-password/page.tsx`

## Admin UI
- `/admin` → `app/admin/page.tsx`
- `/admin/dashboard` → `app/admin/dashboard/page.tsx`
- `/admin/analytics` → `app/admin/analytics/page.tsx`
- `/admin/activity-logs` → `app/admin/activity-logs/page.tsx`
- `/admin/pois` → `app/admin/pois/page.tsx`
- `/admin/pois/[id]` → `app/admin/pois/[id]/page.tsx`
- `/admin/tours` → `app/admin/tours/page.tsx`
- `/admin/media` → `app/admin/media/page.tsx`
- `/admin/audio-guides` → `app/admin/audio-guides/page.tsx`
- `/admin/translations` → `app/admin/translations/page.tsx`
- `/admin/users` → `app/admin/users/page.tsx`
- `/admin/vendors` → `app/admin/vendors/page.tsx`
- `/admin/districts` → `app/admin/districts/page.tsx`
- `/admin/settings` → `app/admin/settings/page.tsx`

## Vendor UI
- `/vendor` → `app/vendor/page.tsx`
- `/vendor/pois/[id]` → `app/vendor/pois/[id]/page.tsx`
- `/vendor/settings` → `app/vendor/settings/page.tsx`

## Customer UI
- `/customer` → `app/customer/page.tsx`
- `/customer/map` → `app/customer/map/page.tsx`
- `/customer/pois/[id]` → `app/customer/pois/[id]/page.tsx`
- `/customer/tours` → `app/customer/tours/page.tsx`
- `/customer/tours/[id]` → `app/customer/tours/[id]/page.tsx`
- `/customer/favorites` → `app/customer/favorites/page.tsx`
- `/customer/profile` → `app/customer/profile/page.tsx`

---

## 5) Backend API endpoints (đường dẫn chức năng)

## Admin APIs
- `GET /api/admin/stats` → `app/api/admin/stats/route.ts`
- `GET /api/admin/audio-guides` → `app/api/admin/audio-guides/route.ts`
- `GET /api/admin/media` → `app/api/admin/media/route.ts`
- `GET,POST /api/admin/pois` → `app/api/admin/pois/route.ts`
- `GET /api/admin/pois/[id]` → `app/api/admin/pois/[id]/route.ts`
- `PATCH /api/admin/pois/[id]/decision` → `app/api/admin/pois/[id]/decision/route.ts`
- `POST /api/admin/pois/[id]/lock` → `app/api/admin/pois/[id]/lock/route.ts`
- `POST /api/admin/pois/[id]/unlock` → `app/api/admin/pois/[id]/unlock/route.ts`
- `GET,POST /api/admin/tours` → `app/api/admin/tours/route.ts`
- `GET,PATCH,DELETE /api/admin/tours/[id]` → `app/api/admin/tours/[id]/route.ts`
- `GET /api/admin/translations` → `app/api/admin/translations/route.ts`
- `GET,PATCH,DELETE /api/admin/users` → `app/api/admin/users/route.ts`
- `GET,POST /api/admin/vendors` → `app/api/admin/vendors/route.ts`
- `GET,PATCH,DELETE /api/admin/vendors/[id]` → `app/api/admin/vendors/[id]/route.ts`

### Admin session/auth/password
- `POST /api/admin/session/login` → `app/api/admin/session/login/route.ts`
- `POST /api/admin/session/register` → `app/api/admin/session/register/route.ts`
- `POST /api/admin/session/logout` → `app/api/admin/session/logout/route.ts`
- `POST /api/admin/session/refresh` → `app/api/admin/session/refresh/route.ts`
- `GET /api/admin/session/me` → `app/api/admin/session/me/route.ts`
- `PATCH /api/admin/session/profile` → `app/api/admin/session/profile/route.ts`
- `POST /api/admin/session/avatar-upload` → `app/api/admin/session/avatar-upload/route.ts`
- `POST /api/admin/password/request-otp` → `app/api/admin/password/request-otp/route.ts`
- `POST /api/admin/password/verify-otp` → `app/api/admin/password/verify-otp/route.ts`
- `POST /api/admin/password/reset` → `app/api/admin/password/reset/route.ts`

## Vendor APIs
- `GET,POST /api/vendor/pois` → `app/api/vendor/pois/route.ts`
- `GET,PATCH /api/vendor/pois/[id]` → `app/api/vendor/pois/[id]/route.ts`
- `POST /api/vendor/pois/[id]/lock` → `app/api/vendor/pois/[id]/lock/route.ts`
- `POST /api/vendor/pois/[id]/unlock` → `app/api/vendor/pois/[id]/unlock/route.ts`
- `POST /api/vendor/pois/[id]/resubmit` → `app/api/vendor/pois/[id]/resubmit/route.ts`
- `POST /api/vendor/media/upload` → `app/api/vendor/media/upload/route.ts`

### Vendor auth/password
- `POST /api/vendor/auth/login` → `app/api/vendor/auth/login/route.ts`
- `POST /api/vendor/auth/register` → `app/api/vendor/auth/register/route.ts`
- `POST /api/vendor/auth/logout` → `app/api/vendor/auth/logout/route.ts`
- `POST /api/vendor/auth/refresh` → `app/api/vendor/auth/refresh/route.ts`
- `GET /api/vendor/auth/me` → `app/api/vendor/auth/me/route.ts`
- `PATCH /api/vendor/auth/profile` → `app/api/vendor/auth/profile/route.ts`
- `POST /api/vendor/auth/avatar-upload` → `app/api/vendor/auth/avatar-upload/route.ts`
- `POST /api/vendor/password/request-otp` → `app/api/vendor/password/request-otp/route.ts`
- `POST /api/vendor/password/verify-otp` → `app/api/vendor/password/verify-otp/route.ts`
- `POST /api/vendor/password/reset` → `app/api/vendor/password/reset/route.ts`

## Customer APIs
- `GET /api/customer/pois` → `app/api/customer/pois/route.ts`
- `GET /api/customer/pois/[id]` → `app/api/customer/pois/[id]/route.ts`
- `GET /api/customer/tours` → `app/api/customer/tours/route.ts`
- `GET /api/customer/tours/[id]` → `app/api/customer/tours/[id]/route.ts`
- `GET /api/customer/search` → `app/api/customer/search/route.ts`
- `GET /api/customer/stats` → `app/api/customer/stats/route.ts`
- `GET,POST,DELETE /api/customer/favorites` → `app/api/customer/favorites/route.ts`

### Customer auth/password
- `POST /api/customer/auth/login` → `app/api/customer/auth/login/route.ts`
- `POST /api/customer/auth/register` → `app/api/customer/auth/register/route.ts`
- `POST /api/customer/auth/logout` → `app/api/customer/auth/logout/route.ts`
- `POST /api/customer/auth/refresh` → `app/api/customer/auth/refresh/route.ts`
- `GET /api/customer/auth/me` → `app/api/customer/auth/me/route.ts`
- `POST /api/customer/password/request-otp` → `app/api/customer/password/request-otp/route.ts`
- `POST /api/customer/password/verify-otp` → `app/api/customer/password/verify-otp/route.ts`
- `POST /api/customer/password/reset` → `app/api/customer/password/reset/route.ts`

## Tool/API tiện ích
- `POST /api/tools/translate` → `app/api/tools/translate/route.ts`
- `GET /api/tools/translate/languages` → `app/api/tools/translate/languages/route.ts`
- `GET,POST /api/tools/tts` → `app/api/tools/tts/route.ts`
- `GET /api/tools/tts/voices` → `app/api/tools/tts/voices/route.ts`

## API Gateway
- `GET,POST /api/gateway/[service]/[...path]` → `app/api/gateway/[service]/[...path]/route.ts`

---

## 6) Các thư mục lõi để tra cứu nhanh khi trả lời câu hỏi

- **Route & màn hình**: `app/`
- **API handlers**: `app/api/`
- **Middleware bảo vệ route**: `middleware.ts`
- **UI components dùng lại**: `components/ui/`
- **Layout theo vai trò**: `components/layouts/`
- **Feature customer**: `components/features/customer/`
- **POI detail component**: `components/poi/poi-detail-view.tsx`
- **Business DTO/validator**: `src/application/dtos`, `src/application/validators`, `src/application/validation`
- **Domain model**: `src/domain/entities`, `src/domain/value-objects`
- **Security/Auth**: `src/infrastructure/security/*`
- **Prisma client**: `src/infrastructure/database/prisma/client.ts`
- **Config**: `src/shared/config/index.ts`
- **DB schema**: `prisma/schema.prisma`
- **Migrations**: `prisma/migrations/*`
- **Tests E2E**: `tests/e2e/*`
- **Tests Unit**: `tests/unit/*`

---

## 7) Ghi chú vận hành

- Dự án dùng **App Router** nên route frontend lấy từ cấu trúc thư mục `app/**/page.tsx`.
- API backend lấy từ `app/api/**/route.ts`.
- Middleware phân quyền/redirect theo vai trò nằm ở `middleware.ts`.
- Nếu cần trả lời “chức năng X ở đâu?”, ưu tiên tìm theo nhóm:
  1) page route trong `app/`
  2) API route trong `app/api/`
  3) logic xử lý trong `src/application` + `src/infrastructure`.

---

## 8) CHI TIẾT CHỨC NĂNG POI (trọng tâm)

## 8.1 Mô hình dữ liệu POI nằm ở đâu?
- Model chính:
  - `POI` → `prisma/schema.prisma`
  - `POIImage` (ảnh POI) → `prisma/schema.prisma`
  - `MenuItem` (món ăn) → `prisma/schema.prisma`
  - `POITranslation` (đa ngôn ngữ, script audio) → `prisma/schema.prisma`
  - `POIAudio` (audio file theo translation) → `prisma/schema.prisma`
  - `FavoritePOI`, `Review`, `POIView` (yêu thích/đánh giá/lượt xem) → `prisma/schema.prisma`

## 8.2 POI phía Vendor (tạo/sửa/gửi duyệt) ở đâu?
### UI Vendor quản lý POI
- Màn hình chính: `app/vendor/vendor-poi-management.tsx`
- Route gọi vào màn hình: `app/vendor/page.tsx`
- Chọn tọa độ POI trên bản đồ: `app/vendor/poi-location-picker.tsx`

### Logic chính trong `vendor-poi-management.tsx`
- `load()` → tải danh sách POI vendor (`GET /api/vendor/pois`)
- `createPoi()` → tạo POI mới (gồm ảnh + menu + bản dịch tiếng Việt)
- `saveEdit()` → cập nhật POI + thêm audio cho translation
- `lockPoi()` / `unlockPoi()` → khóa/mở POI
- `resubmitPoi()` → gửi duyệt lại POI bị từ chối
- `uploadVendorFile()` → upload ảnh/audio qua `POST /api/vendor/media/upload`

### API Vendor cho POI
- `GET,POST /api/vendor/pois` → `app/api/vendor/pois/route.ts`
- `GET,PATCH /api/vendor/pois/[id]` → `app/api/vendor/pois/[id]/route.ts`
- `POST /api/vendor/pois/[id]/lock` → `app/api/vendor/pois/[id]/lock/route.ts`
- `POST /api/vendor/pois/[id]/unlock` → `app/api/vendor/pois/[id]/unlock/route.ts`
- `POST /api/vendor/pois/[id]/resubmit` → `app/api/vendor/pois/[id]/resubmit/route.ts`

## 8.3 POI phía Admin (duyệt/khóa/xem chi tiết) ở đâu?
### UI Admin quản lý POI
- Danh sách POI: `app/admin/pois/poi-management.tsx`
- Route: `app/admin/pois/page.tsx`
- Chi tiết POI admin: `app/admin/pois/[id]/admin-poi-detail.tsx`
- Route chi tiết: `app/admin/pois/[id]/page.tsx`

### Logic chính trong `app/admin/pois/poi-management.tsx`
- `loadPois()` (fetch danh sách)
- `approvePoi()` (duyệt POI)
- `openReject()` + submit reject (từ chối POI)
- `lockPoi()` / `unlockPoi()` (khóa/mở)

### API Admin cho POI
- `GET /api/admin/pois` → `app/api/admin/pois/route.ts`
- `GET /api/admin/pois/[id]` → `app/api/admin/pois/[id]/route.ts`
- `PATCH /api/admin/pois/[id]/decision` → `app/api/admin/pois/[id]/decision/route.ts`
- `POST /api/admin/pois/[id]/lock` → `app/api/admin/pois/[id]/lock/route.ts`
- `POST /api/admin/pois/[id]/unlock` → `app/api/admin/pois/[id]/unlock/route.ts`

> Điểm quan trọng: API `decision` có gửi mail cho vendor khi approve/reject.

## 8.4 POI phía Customer (map + chi tiết + audio + yêu thích) ở đâu?
### Màn hình customer liên quan POI
- Danh sách/landing customer: `app/customer/page.tsx`
- Bản đồ POI realtime: `app/customer/map/page.tsx`
- Chi tiết POI: `app/customer/pois/[id]/page.tsx`
- Favorites: `app/customer/favorites/page.tsx`
- State favorite: `components/contexts/favorites-context.tsx`

### API customer cho POI
- `GET /api/customer/pois` → `app/api/customer/pois/route.ts`
- `GET /api/customer/pois/[id]` → `app/api/customer/pois/[id]/route.ts`
- `GET,POST,DELETE /api/customer/favorites` → `app/api/customer/favorites/route.ts`

### Logic map + gần POI + route đường đi nằm ở đâu?
File: `app/customer/map/page.tsx`
- Tính khoảng cách: `haversineMeters(...)`
- Gom cụm POI gần nhau: `buildClusterCandidates(...)`
- Điều chỉnh bán kính cảnh báo theo mode đi bộ/xe máy: `computeAdaptiveAlertRadius(...)`
- Load POI gần user: `loadNearbyPois(...)` gọi `GET /api/customer/pois?mode=map`
- Lấy route tới POI: `fetchRouteToPoi(...)` (OSRM, fallback đường thẳng)
- Vẽ route trên map: `upsertRouteLine(...)`
- Trigger hỏi nghe thuyết minh khi gần POI: effect logic với `nearPromptPoi`
- Bấm nghe gần POI: `handleListenNearbyPoi()`

## 8.5 Chức năng NGHE (audio guide) ở đoạn code nào?
### A) Phát audio ở trang chi tiết POI
File: `app/customer/pois/[id]/page.tsx`
- Chọn nguồn audio: `resolveAudioPayload()` theo thứ tự ưu tiên:
  1. audio file đã upload (`translation.audios[0].audioUrl`)
  2. `audioScript`
  3. `description`
  4. dịch từ tiếng Việt rồi đọc TTS
- Phát: `handlePlay()`
- Dừng: `handleStop()` / `stopAllAudio()`

### B) Auto hỏi/nghe trên map khi đến gần
File: `app/customer/map/page.tsx`
- Hàng đợi speech: `enqueueSpeech`, `processSpeechQueue`, `pauseAudioQueue`, `resumeAudioQueue`
- Lấy nội dung thuyết minh theo ngôn ngữ: `getNarrationText(...)`
- Khi user bấm nghe popup gần POI: `handleListenNearbyPoi()`

### C) Engine TTS dùng chung
File: `lib/tts.ts`
- API chính: `speak(...)`, `stopSpeaking()`, `pauseSpeaking()`, `resumeSpeaking()`
- Cơ chế fallback:
  1. speechSynthesis native browser
  2. proxy `/api/tools/tts`
  3. Google Translate TTS

### D) API TTS backend
File: `app/api/tools/tts/route.ts`
- `GET /api/tools/tts` → proxy stream mp3 từ Google Translate
- `POST /api/tools/tts` → Google Cloud TTS (nếu có key), fallback translate TTS

---

## 9) CHI TIẾT CHỨC NĂNG FOOD TOURS (trọng tâm)

## 9.1 Mô hình dữ liệu Tour ở đâu?
- `Tour` + `TourPOI` (quan hệ n-n có thứ tự stop) → `prisma/schema.prisma`

## 9.2 Tour phía Admin (quản trị đầy đủ)
### UI
- Route: `/admin/tours` → `app/admin/tours/page.tsx`
- Component chính: `app/admin/tours/tour-management.tsx`

### Logic chính trong `tour-management.tsx`
- `loadTours()` → danh sách tour
- `searchRestaurants()` → tìm POI approved để thêm vào tour
- `togglePoi()`, `movePoi()`, `removePoi()` → chọn/sắp xếp điểm dừng
- `createTour()` → tạo tour
- `saveEdit()` → sửa tour + cập nhật danh sách POI
- `hideTour()` / `restoreTour()` → ẩn/hiện tour
- `openDetail()` → mở modal chi tiết
- `TourStopsMap` → hiển thị map các stop, click mở POI admin

### API admin cho tour
- `GET,POST /api/admin/tours` → `app/api/admin/tours/route.ts`
- `GET,PATCH,DELETE /api/admin/tours/[id]` → `app/api/admin/tours/[id]/route.ts`

> Điểm nghiệp vụ quan trọng:
> - Khi create/update tour, backend kiểm tra POI phải `APPROVED` và `isActive=true`.
> - Cập nhật danh sách điểm dừng bằng cách ghi lại `tour_pois` với `stopOrder`.

## 9.3 Tour phía Customer (xem & khám phá)
### UI
- Danh sách tour: `/customer/tours` → `app/customer/tours/page.tsx`
- Chi tiết tour: `/customer/tours/[id]` → `app/customer/tours/[id]/page.tsx`

### API customer cho tour
- `GET /api/customer/tours` → `app/api/customer/tours/route.ts`
  - Có cache response trong memory (TTL)
  - Search theo tên/mô tả/tên POI trong tour
- `GET /api/customer/tours/[id]` → `app/api/customer/tours/[id]/route.ts`
  - Trả danh sách stops theo `stopOrder`
  - Chỉ lấy POI approved + active

### Luồng customer từ Tour sang POI
- Ở `app/customer/tours/[id]/page.tsx`, mỗi stop link sang: `/customer/pois/[poiId]`
- Từ POI detail có nút điều hướng map: `/customer/map?focusPoi=<id>&routeTo=<id>`

---

## 10) Quick map: hỏi nhanh thì trả lời theo bảng này

### POI ở đâu?
- **DB model**: `prisma/schema.prisma` (POI, POIImage, MenuItem, POITranslation, POIAudio)
- **Vendor CRUD**: `app/vendor/vendor-poi-management.tsx` + `app/api/vendor/pois/**`
- **Admin duyệt/khóa**: `app/admin/pois/poi-management.tsx` + `app/api/admin/pois/**`
- **Customer xem map/chi tiết**: `app/customer/map/page.tsx`, `app/customer/pois/[id]/page.tsx`

### Chức năng nghe nằm ở đâu?
- **UI chi tiết POI**: `app/customer/pois/[id]/page.tsx` (`resolveAudioPayload`, `handlePlay`)
- **Auto nghe gần POI**: `app/customer/map/page.tsx` (`handleListenNearbyPoi`, queue speech)
- **TTS engine**: `lib/tts.ts`
- **TTS API**: `app/api/tools/tts/route.ts`

### Food Tour ở đâu?
- **Admin tạo/sửa/ẩn/hiện**: `app/admin/tours/tour-management.tsx`
- **Admin API**: `app/api/admin/tours/route.ts`, `app/api/admin/tours/[id]/route.ts`
- **Customer list/detail**: `app/customer/tours/page.tsx`, `app/customer/tours/[id]/page.tsx`
- **Customer API**: `app/api/customer/tours/route.ts`, `app/api/customer/tours/[id]/route.ts`
