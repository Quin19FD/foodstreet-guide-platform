# Smart Food Street CMS & GPS Guide Platform - System Architecture

Nguồn mô tả áp dụng cho tài liệu này: `SYSTEM_ARCHITECTURE.md`.
Nguyên tắc: giữ nguyên cấu trúc dự án hiện tại, chỉ chuẩn hóa phạm vi chức năng theo tài liệu này.

## 1. Project Overview

Smart Food Street CMS & GPS Guide Platform là hệ thống quản trị nội dung và khám phá ẩm thực theo GPS cho khu phố ẩm thực/chợ đêm.

Hệ thống gồm:
- Admin CMS quản lý POI, tour, media, audio guide, đa ngôn ngữ
- Web Application cho người dùng khám phá POI theo vị trí thời gian thực
- API Gateway định tuyến vào các microservice

## 2. System Goals

1. Quản lý POI theo tọa độ GPS trên bản đồ.
2. Quản lý Food Tour từ nhiều POI.
3. Cung cấp trải nghiệm khám phá POI theo vị trí hiện tại.
4. Cung cấp Audio Guide tự động theo POI gần nhất.
5. Hỗ trợ đa ngôn ngữ cho nội dung POI và thuyết minh.

## 3. User Flow

1. Người dùng quét QR khu phố ẩm thực.
2. Hệ thống mở Web Application và chọn/nhận diện ngôn ngữ.
3. Ứng dụng xin quyền GPS.
4. Tính vị trí hiện tại và khoảng cách đến các POI.
5. Hiển thị POI trên bản đồ, highlight POI gần nhất.
6. Người dùng xem chi tiết POI (mô tả, ảnh, thuyết minh).
7. Khi người dùng đến gần POI, Audio Guide tự kích hoạt.
8. Khi người dùng di chuyển, hệ thống cập nhật POI gần nhất theo thời gian thực.

## 4. System Architecture

- Admin CMS (Next.js Dashboard)
- Web Application (Next.js GPS Food Exploration App)
- API Gateway
- Microservices:
  - Auth Service
  - POI Service
  - Tour Service
  - Media Service
  - Audio Guide Service
  - Translation Service
  - Location Service
- PostgreSQL dùng Prisma ORM

## 5. API Responsibilities per Service

| Service | Trách nhiệm API |
|---|---|
| Auth Service | Đăng nhập admin, quản lý session, đăng xuất |
| POI Service | Tạo/sửa/xóa POI, tìm kiếm/lọc POI, phân loại POI, quản lý bán kính hiển thị |
| Tour Service | Tạo/sửa tour, thêm/xóa POI trong tour, sắp xếp thứ tự POI |
| Media Service | Upload/quản lý ảnh POI, quản lý media liên quan |
| Audio Guide Service | Nhập script, tạo audio TTS, quản lý audio theo POI, phát audio tự động |
| Translation Service | Quản lý bản dịch tên/mô tả/nội dung thuyết minh đa ngôn ngữ |
| Location Service | Nhận GPS, tính khoảng cách, xác định POI gần nhất, cập nhật theo thời gian thực |

## 6. Data Model Concepts

- `AdminUser` (username, password_hash, session)
- `POI` (name, description, latitude, longitude, display_radius, type)
- `POIType` (`FOOD_STALL`, `SUPPORTING_FACILITY`)
- `POIMedia` (image_url, poi_id)
- `AudioGuide` (script_text, audio_url, poi_id, language)
- `Translation` (entity_type, entity_id, language, field, value)
- `Tour` (name, description, duration, image)
- `TourPOI` (tour_id, poi_id, sort_order)

## 7. Admin CMS Modules

1. Xác thực quản trị viên (login/session/logout).
2. Quản lý POI (CRUD, tọa độ, bán kính, loại, mô tả, media).
3. Phân loại POI (Food Stall, Supporting Facilities).
4. Quản lý Food Tour (CRUD, gắn POI, sắp thứ tự).
5. Quản lý Audio Guide (script, TTS, audio theo POI).
6. Quản lý đa ngôn ngữ (bản dịch tên/mô tả/thuyết minh).

## 8. Web Application Modules

1. Bản đồ tương tác (POI + vị trí người dùng + khoảng cách).
2. GPS positioning thời gian thực.
3. Chi tiết POI (tên, mô tả, ảnh, thuyết minh, khoảng cách).
4. Audio Guide (tự phát khi đến gần, tạm dừng/phát lại, đổi ngôn ngữ).
5. Tìm kiếm và khám phá POI/tour.

## 9. Current Project Structure (Giữ nguyên)

```text
foodstreet-guide-platform/
├─ app/
├─ components/
├─ lib/
├─ prisma/
├─ src/
├─ tests/
├─ project.md
└─ SYSTEM_ARCHITECTURE.md
```

Ghi chú:
- Không tái cấu trúc thư mục ở giai đoạn này.
- Thiết kế microservice là kiến trúc logic/triển khai, không bắt buộc phải tách thư mục vật lý ngay.

## 10. Technology Stack

- Frontend: Next.js, TypeScript, TailwindCSS, Leaflet/Mapbox, Web Speech API
- Backend: Node.js, NestJS, REST API, Prisma ORM, PostgreSQL
- DevOps: Docker, Docker Compose, Nginx/API Gateway, CI/CD

## 11. Deployment Architecture

1. Admin CMS và Web Application gọi API qua API Gateway.
2. API Gateway định tuyến đến 7 microservice.
3. Mỗi service truy cập PostgreSQL qua Prisma ORM.
4. Media/audio lưu qua lớp media tương ứng.

## 12. Out of Scope (Bỏ theo mô tả hiện tại)

Các tính năng sau không thuộc phạm vi của tài liệu này, cần loại khỏi thiết kế/chức năng hiện tại:
- Giỏ hàng và đặt món (cart/pre-order)
- Thanh toán online (VietQR/VNPay/MoMo/ZaloPay)
- Quản lý đơn hàng vận hành bán món
- Lịch sử giao dịch và đối soát thanh toán
- Báo cáo doanh thu tài chính
