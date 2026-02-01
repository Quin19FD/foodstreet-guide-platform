# 📍 Smart Food Street QR Guide (Microservice Web App)

## 1. Tổng quan dự án

Ứng dụng web (WebApp) hướng dẫn ẩm thực khu phố thông minh dựa trên **QR Code + GPS**.  
Người dùng chỉ cần **quét QR của khu phố**, hệ thống sẽ tự động:

- Hiển thị các **gian hàng ẩm thực (POI – Point of Interest)**
- Tự động nhận biết **vị trí người dùng**
- Hiển thị thông tin gian hàng gần nhất
- **Đọc thuyết minh bằng giọng nói đa ngôn ngữ (Text-to-Speech)**

Ứng dụng phù hợp cho:
- Du lịch ẩm thực
- Khu phố đi bộ
- Food street / night market
- Smart tourism

---

## 2. Luồng hoạt động chính (User Flow)

1. Người dùng **quét QR Code của khu phố**
2. App lấy `district_id`
3. App định vị người dùng bằng **GPS**
4. Xác định **POI (gian hàng) gần nhất**
5. Gọi **Store / POI Service**
6. Hiển thị thông tin gian hàng
7. Gọi **TTS Service → đọc thuyết minh**
8. Người dùng di chuyển → vị trí thay đổi → POI thay đổi → lặp lại

---

## 3. Chức năng chính

### 3.1 Chức năng cho người dùng

- Quét QR để kích hoạt nội dung
- Hiển thị:
  - Danh sách gian hàng (POI)
  - Thông tin chi tiết gian hàng
  - Ảnh minh họa
  - Mô tả văn bản
  - Link bản đồ (Google Maps / Mapbox)
- Định vị người dùng trên bản đồ
- Hiển thị tất cả POI trong khu phố
- Highlight POI gần nhất
- Xem chi tiết từng POI
- Tự động thuyết minh bằng **Text-to-Speech**
- Hỗ trợ **đa ngôn ngữ**
- Tự động chuyển POI khi người dùng di chuyển
- **Thanh toán online**:
  - Mua món ăn trực tiếp trên app
  - Thanh toán qua QR Code (VietQR / VNPay)
  - Lịch sử giao dịch
  - Đặt món trước (Pre-order)

---

### 3.2 Hệ thống thanh toán online

- Đặt món từ gian hàng (POI)
- Giỏ hàng tính toán
- Thanh toán qua:
  - **VietQR** (quét mã ngân hàng)
  - **VNPay** (gateway)
  - **MoMo / ZaloPay** ( ví điện tử - tùy chọn)
- Xác thực giao dịch an toàn
- Thông báo đặt món thành công đến gian hàng
- Quét mã QR tại quầy để nhận món
- Đánh giá sau giao dịch

---

### 3.3 Hệ thống thuyết minh (Audio Guide)

- Danh sách điểm thuyết minh (POI)
- Nội dung thuyết minh dạng:
  - Text
  - Script TTS
  - Audio sinh tự động
- Đọc tự động khi người dùng đến gần POI
- Chọn ngôn ngữ thuyết minh

---

## 4. Hệ thống quản trị nội dung (CMS / Admin)

### 4.1 Quản lý nội dung

- Quản lý khu phố (District)
- Quản lý POI (Gian hàng)
- Quản lý:
  - Mô tả văn bản
  - Ảnh minh họa
  - Script TTS
  - Audio
- Quản lý bản dịch đa ngôn ngữ
- Quản lý QR Code kích hoạt nội dung
- Quản lý tour / tuyến tham quan
- Quản lý **Menu món ăn** theo gian hàng
- Quản lý **Đơn hàng**:
  - Xem đơn hàng mới
  - Xác nhận / từ chối đơn
  - Cập nhật trạng thái chuẩn bị
  - Thông báo khi món xong

---

### 4.3 Quản lý thanh toán

- Cấu hình cổng thanh toán:
  - VietQR
  - VNPay
  - MoMo / ZaloPay
- Xem lịch sử giao dịch
- Báo cáo doanh thu
- Xuất báo cáo Excel / PDF

---

### 4.4 Analytics & Data

- Lưu lịch sử sử dụng (ẩn danh)
- Phân tích dữ liệu:
  - Top POI được nghe nhiều nhất
  - Thời gian trung bình nghe 1 POI
  - Heatmap vị trí người dùng
  - Tuyến di chuyển phổ biến
  - **Top món ăn bán chạy**
  - **Doanh thu theo gian hàng / khu vực**
  - **Thống kê đơn hàng thành công / hủy**
- Báo cáo theo thời gian / khu vực

---

## 5. Kiến trúc hệ thống (Microservice)

### 5.1 Frontend

- WebApp
- Công nghệ:
  - **Next.js**
  - **TypeScript**
- Chức năng:
  - Quét QR
  - Bản đồ
  - Hiển thị POI
  - Audio Guide
  - Giỏ hàng & Thanh toán

---

### 5.2 Backend (Microservices)

| Service | Chức năng |
|------|---------|
| Auth Service | Xác thực, phân quyền |
| District Service | Quản lý khu phố |
| POI / Store Service | Gian hàng, thông tin |
| Location Service | Xử lý GPS |
| TTS Service | Sinh giọng nói |
| Media Service | Ảnh, Audio |
| Analytics Service | Phân tích dữ liệu |
| QR Service | Sinh & quản lý QR |
| Payment Service | Thanh toán online, đơn hàng |
| Order Service | Quản lý giỏ hàng, đặt món |

---

## 6. Công nghệ đề xuất

### Frontend
- Next.js + TypeScript
- Mapbox / Google Maps
- Web Speech API (fallback)
- Responsive WebApp

### Backend
- Node.js / NestJS
- REST / GraphQL
- PostgreSQL
- Redis (cache)
- Object Storage (Audio, Image)
- **Payment Gateway**:
  - VNPay SDK
  - VietQR API
  - MoMo / ZaloPay API (tùy chọn)

### DevOps
- Docker
- Docker Compose / Kubernetes
- CI/CD
- Nginx / API Gateway

---

## 7. Mục tiêu dự án

- Xây dựng nền tảng **du lịch ẩm thực thông minh**
- Tăng trải nghiệm người dùng bằng **tự động hóa & âm thanh**
- Dễ mở rộng cho nhiều khu phố / thành phố
- Phù hợp triển khai thực tế

---

## 8. Hướng phát triển tương lai

- AI gợi ý tour ẩm thực
- Nhận diện hành vi người dùng
- Offline mode
- Mobile App (React Native / Flutter)
- Cá nhân hóa nội dung theo người dùng
