# Tổng Hợp Thư Viện, API và Công Nghệ Dự Án

Cập nhật theo codebase hiện tại tại thời điểm rà soát.

## 1) Thư viện/Framework đã dùng trong hệ thống

### Nhóm Frontend/Web
- `next` (App Router, route handler API)
- `react`, `react-dom`
- `tailwindcss`, `postcss`, `autoprefixer`, `tailwindcss-animate`
- `lucide-react` (icon UI)
- `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge` (xây dựng component UI)

### Nhóm Bản đồ/GIS
- `maplibre-gl` (bản đồ chính trong trang khách hàng và admin tour)
- `mapbox-gl` (được import tại component mapbox)

### Nhóm Backend/Data
- `@prisma/client`, `prisma` (ORM)
- PostgreSQL (khai báo trong `prisma/schema.prisma`)
- `zod` (validate input)
- `nodemailer` (gửi email OTP/đặt lại mật khẩu)

### Nhóm Chất lượng mã & kiểm thử
- `typescript`
- `@biomejs/biome` (lint/format)
- `@playwright/test` (E2E test)
- `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`

### Ghi chú sử dụng thực tế
- `@tanstack/react-query` và `zustand` có trong `package.json` nhưng hiện chưa thấy xuất hiện trong import chính của mã nguồn đang chạy.

## 2) Các API đã dùng trong hệ thống

## 2.1 API nội bộ (Next.js Route Handlers)

### Auth chung
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

### Admin session/profile
- `POST /api/admin/session/register`
- `POST /api/admin/session/login`
- `POST /api/admin/session/logout`
- `POST /api/admin/session/refresh`
- `GET /api/admin/session/me`
- `PATCH /api/admin/session/profile`
- `POST /api/admin/session/avatar-upload`

### Admin password reset
- `POST /api/admin/password/request-otp`
- `POST /api/admin/password/verify-otp`
- `POST /api/admin/password/reset`

### Admin POI
- `GET /api/admin/pois`
- `POST /api/admin/pois`
- `GET /api/admin/pois/[id]`
- `PATCH /api/admin/pois/[id]/decision`
- `POST /api/admin/pois/[id]/lock`
- `POST /api/admin/pois/[id]/unlock`

### Admin tours
- `GET /api/admin/tours`
- `POST /api/admin/tours`
- `GET /api/admin/tours/[id]`
- `PATCH /api/admin/tours/[id]`
- `DELETE /api/admin/tours/[id]`

### Admin vendors
- `GET /api/admin/vendors`
- `POST /api/admin/vendors`
- `GET /api/admin/vendors/[id]`
- `PATCH /api/admin/vendors/[id]`
- `DELETE /api/admin/vendors/[id]`

### Customer auth
- `POST /api/customer/auth/register`
- `POST /api/customer/auth/login`
- `POST /api/customer/auth/logout`
- `POST /api/customer/auth/refresh`
- `GET /api/customer/auth/me`

### Customer password reset
- `POST /api/customer/password/request-otp`
- `POST /api/customer/password/verify-otp`
- `POST /api/customer/password/reset`

### Customer content/search
- `GET /api/customer/pois`
- `GET /api/customer/pois/[id]`
- `GET /api/customer/tours`
- `GET /api/customer/tours/[id]`
- `GET /api/customer/search`

### Vendor auth/profile
- `POST /api/vendor/auth/register`
- `POST /api/vendor/auth/login`
- `POST /api/vendor/auth/logout`
- `POST /api/vendor/auth/refresh`
- `GET /api/vendor/auth/me`
- `PATCH /api/vendor/auth/profile`
- `POST /api/vendor/auth/avatar-upload`

### Vendor password reset
- `POST /api/vendor/password/request-otp`
- `POST /api/vendor/password/verify-otp`
- `POST /api/vendor/password/reset`

### Vendor POI/media
- `GET /api/vendor/pois`
- `POST /api/vendor/pois`
- `GET /api/vendor/pois/[id]`
- `PATCH /api/vendor/pois/[id]`
- `POST /api/vendor/pois/[id]/lock`
- `POST /api/vendor/pois/[id]/unlock`
- `POST /api/vendor/pois/[id]/resubmit`
- `POST /api/vendor/media/upload`

### Tools/Gateway
- `POST /api/tools/translate`
- `GET /api/tools/translate/languages`
- `POST /api/tools/tts`
- `GET /api/tools/tts/voices`
- `GET|POST /api/gateway/[service]/[...path]`

## 2.2 API/dịch vụ bên ngoài đã tích hợp
- Google Cloud Text-to-Speech API: `https://texttospeech.googleapis.com/v1/text:synthesize`
- Google Gemini API (dịch): `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- LibreTranslate: `https://libretranslate.com` (và endpoint fallback cấu hình)
- MyMemory Translate: `https://api.mymemory.translated.net/get`
- Lingva Translate: `https://lingva.ml/api/v1/...`
- Cloudinary Upload API: `https://api.cloudinary.com/v1_1/.../upload`
- QR Server API (tạo QR image URL): `https://api.qrserver.com/v1/create-qr-code/`
- OpenStreetMap tile server: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- Google Maps direction link: `https://www.google.com/maps/dir/?api=1...`

## 3) Bổ sung phần công nghệ sử dụng

### Kiến trúc và tổ chức
- Monolith theo hướng microservice-style trong cùng Next.js app (`/api/gateway/[service]/[...path]`, contracts service).
- Tách lớp tương đối rõ: `domain` - `application` - `infrastructure` - `app`.

### Xác thực và bảo mật
- JWT HS256 tự triển khai ở tầng `infrastructure/security`.
- Access/Refresh token qua cookie HTTP-only, có cơ chế refresh/rotate token.
- Mật khẩu dùng `scrypt` + salt/hash (Node `crypto`).
- OTP reset mật khẩu qua email SMTP (Nodemailer).

### Dữ liệu và lưu trữ
- PostgreSQL + Prisma ORM.
- Schema bao gồm user/role/status, POI, tour, translation, audio, favorite, review, analytics.

### Media, bản đồ, đa ngôn ngữ
- Upload ảnh/media qua Cloudinary.
- Bản đồ hiển thị qua MapLibre + OpenStreetMap tiles.
- Hệ dịch tự động đa provider (Gemini, Lingva, MyMemory, LibreTranslate).
- TTS tiếng nói dùng Google Cloud TTS.

### Chất lượng phát triển
- TypeScript strict.
- Biome cho lint/format.
- Playwright cho kiểm thử E2E.
- Husky + Commitlint cho quy trình commit.

## 4) Kết luận
- Dự án đã có nền tảng kỹ thuật tương đối đầy đủ cho một hệ thống Food Street Guide thực chiến: có phân vai Admin/Customer/Vendor, quản trị POI/Tour, xác thực, media upload, dịch ngôn ngữ, TTS, và bản đồ.
- Cấu trúc code theo layer giúp dễ mở rộng thêm module mới.
- API nội bộ đã bao phủ phần lớn luồng nghiệp vụ chính.

## 5) Hướng phát triển dự án
1. Chuẩn hóa tài liệu API bằng OpenAPI/Swagger và versioning (`/api/v1`).
2. Bổ sung test coverage cho API quan trọng (auth, vendor, admin moderation), không chỉ E2E.
3. Tăng cường bảo mật: rate limit cho login/OTP, audit log bảo mật, che giấu thông tin nhạy cảm khỏi repo.
4. Tối ưu hiệu năng truy vấn: index theo truy vấn thực tế, cache lớp đọc (Redis) cho màn hình nhiều traffic.
5. Nâng cấp observability: logging tập trung, metrics, tracing cho các route quan trọng.
6. Hoàn thiện pipeline CI/CD: lint + test + migration check + deploy tự động.
7. Chuẩn hóa phân tách service thật sự (nếu cần scale cao), tách module translation/tts/media thành service độc lập.
8. Mở rộng trải nghiệm người dùng: đề xuất tour cá nhân hóa, offline map/guide, đa ngôn ngữ sâu hơn theo vùng.

## 6) Ghi chú bảo mật quan trọng
- Dự án đang sử dụng nhiều biến môi trường nhạy cảm (DB/SMTP/Cloudinary/API keys). Nên đảm bảo các giá trị thật không bị lộ trong repository công khai, đồng thời xoay vòng (rotate) các key nếu đã từng bị lộ.
