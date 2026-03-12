# Phân tích Tính năng Giao diện Khách hàng

## So sánh: Project.md vs Database Schema

### Database Schema có nhưng Project.md chưa đề cập đầy đủ:

| Entity | Database | Project.md | Ghi chú |
|--------|----------|------------|---------|
| **MenuItem** | ✅ Có (menu_items) | ❌ Không có | Cần hiển thị menu từng quán |
| **FavoritePOI** | ✅ Có (favorite_pois) | ❌ Không có | Tính năng yêu thích quán |
| **Review** | ✅ Có (reviews) | ❌ Không có | Đánh giá quán |
| **SearchHistory** | ✅ Có (search_history) | ❌ Không có | Lịch sử tìm kiếm |
| **UserActivity** | ✅ Có (user_activity) | ❌ Không có | Tracking hoạt động |
| **POIImage** | ✅ Có (poi_images) | ✅ Có (Upload ảnh) | Đã có |
| **POITranslation** | ✅ Có (poi_translations) | ✅ Có (Đa ngôn ngữ) | Đã có |
| **POIAudio** | ✅ Có (poi_audios) | ✅ Có (Audio Guide) | Đã có |

---

## Danh sách Tính năng Giao diện Khách hàng (Customer Interface)

### 1. Landing / Welcome Screen
- [ ] Màn hình chào mừng khi quét QR Code
- [ ] Chọn ngôn ngữ (VN, EN, CN, KR)
- [ ] Yêu cầu quyền truy cập GPS
- [ ] Hiển thị logo và thông tin khu phố

### 2. Bản đồ tương tác (Map Interface)
- [ ] Hiển thị bản đồ khu phố ẩm thực
- [ ] Hiển thị marker cho tất cả POI
- [ ] Hiển thị vị trí người dùng (GPS)
- [ ] Highlight POI gần nhất
- [ ] Hiển thị khoảng cách đến từng POI
- [ ] Click marker để xem chi tiết POI
- [ ] Filter POI theo loại (Food Stall / Supporting Facility)
- [ ] Filter POI theo trạng thái (isOpen)

### 3. Chi tiết POI (POI Detail)
- [ ] Tên gian hàng (có đa ngôn ngữ)
- [ ] Mô tả (có đa ngôn ngữ)
- [ ] Hình ảnh slider / gallery
- [ ] Menu món ăn (MenuItem) - **MỚI từ DB**
- [ ] Giá từng món (priceMin, priceMax) - **MỚI từ DB**
- [ ] Đánh giá trung bình (rating) - **MỚI từ DB**
- [ ] Khoảng cách từ vị trí hiện tại
- [ ] Nút nghe Audio Guide
- [ ] Nút thích / Yêu thích (Favorite) - **MỚI từ DB**
- [ ] Nút dẫn đường (Directions)

### 4. Audio Guide
- [ ] Text-to-Speech phát script thuyết minh
- [ ] Chọn ngôn ngữ audio
- [ ] Phát / Tạm dừng / Stop
- [ ] Tự động phát khi đến gần POI (geofencing)
- [ ] Thanh tiến độ audio

### 5. Tìm kiếm & Khám phá
- [ ] Thanh tìm kiếm theo tên quán
- [ ] Lọc theo loại (Food Stall vs Supporting Facility)
- [ ] Lọc theo khoảng cách
- [ ] Lọc theo đánh giá (rating)
- [ ] Lịch sử tìm kiếm - **MỚI từ DB**

### 6. Yêu thích (Favorites) - **MỚI từ DB**
- [ ] Thêm/xóa POI khỏi danh sách yêu thích
- [ ] Xem danh sách POI yêu thích
- [ ] Truy cập nhanh từ favorites

### 7. Đánh giá (Reviews) - **MỚI từ DB**
- [ ] Xem các đánh giá của POI
- [ ] Viết đánh giá mới (1-5 sao + comment)
- [ ] Xem đánh giá cá nhân của mình

### 8. Food Tour
- [ ] Xem danh sách Food Tour có sẵn
- [ ] Chi tiết tour: tên, mô tả, thời lượng
- [ ] Danh sách POI trong tour
- [ ] Bắt đầu tour (navigate theo thứ tự POI)
- [ ] Check-in tại từng POI

### 9. Tài khoản (Profile)
- [ ] Thông tin cá nhân (nếu đăng nhập)
- [ ] Lịch sử hoạt động - **MỚI từ DB**
- [ ] Đăng xuất
- [ ] Có thể dùng Guest Mode (không đăng nhập)

### 10. Responsive & Mobile-first
- [ ] Tối ưu cho mobile (người dùng đi bộ)
- [ ] Nút lớn, dễ tap
- [ ] Offline support (PWA)
- [ ] Loading states
- [ ] Error handling

---

## Cấu trúc Route đề xuất cho Customer Interface

```
app/
├── page.tsx                    # Landing / Welcome (QR scan entry)
├── (customer)/                 # Customer route group
│   ├── layout.tsx              # Customer layout (khác admin)
│   ├── page.tsx                # / - Homepage (bản đồ chính)
│   ├── scan/page.tsx           # /scan - Quét QR (nếu cần)
│   ├── map/page.tsx            # /map - Bản đồ đầy đủ
│   ├── pois/
│   │   ├── page.tsx            # /pois - Danh sách tất cả POI
│   │   └── [id]/page.tsx       # /pois/123 - Chi tiết POI
│   ├── tours/
│   │   ├── page.tsx            # /tours - Danh sách Food Tour
│   │   └── [id]/page.tsx       # /tours/123 - Chi tiết tour
│   ├── favorites/page.tsx      # /favorites - POI yêu thích
│   └── profile/page.tsx        # /profile - Tài khoản
├── (auth)/                     # Auth (đã có)
├── (map)/                      # Map pages (đã có, có thể merge)
└── admin/                      # Admin (đã có)
```

---

## API Endpoints cần thiết cho Customer

```
GET  /api/districts           # Lấy danh sách khu phố
GET  /api/districts/:id       # Chi tiết khu phố
GET  /api/pois                # Lấy danh sách POI (có filter)
GET  /api/pois/:id            # Chi tiết POI
GET  /api/pois/:id/menu       # Menu của POI - **MỚI**
GET  /api/pois/:id/reviews    # Đánh giá của POI - **MỚI**
POST /api/pois/:id/reviews    # Gửi đánh giá - **MỚI**
GET  /api/pois/nearby         # POI gần vị trí hiện tại
GET  /api/tours               # Danh sách Food Tour
GET  /api/tours/:id           # Chi tiết tour
GET  /api/audio/:translationId # Audio URL
GET  /api/user/favorites      # Danh sách yêu thích - **MỚI**
POST /api/user/favorites      # Thêm yêu thích - **MỚI**
DELETE /api/user/favorites/:id # Xóa yêu thích - **MỚI**
GET  /api/user/history        # Lịch sử tìm kiếm - **MỚI**
```

---

## Ưu tiên triển khai (MVP)

### Phase 1: Core Features
1. Landing với QR + GPS
2. Bản đồ với marker POI
3. Chi tiết POI cơ bản
4. Audio Guide (TTS)

### Phase 2: Engagement
5. Menu món ăn
6. Yêu thích (Favorites)
7. Đánh giá (Reviews)
8. Tìm kiếm

### Phase 3: Advanced
9. Food Tour navigation
10. Offline PWA
11. Profile/User account
