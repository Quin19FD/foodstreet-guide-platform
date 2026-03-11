# Schema Update Summary - FoodStreet Guide Platform

## Tổng quan
Schema Prisma đã được cập nhật để hoàn toàn đồng bộ với PostgreSQL database schema được cung cấp (sqldatabasedotnet.sql).

---

## 📋 Các thay đổi chính

### 1. **Schema Prisma** (`src/infrastructure/database/prisma/schema.prisma`)
✅ Cập nhật hoàn chỉnh với tất cả 13 tables từ SQL schema:

#### Models mới đã thêm:
- **POIImage** - Hình ảnh của tổng gian hàng
- **POITranslation** - Hỗ trợ đa ngôn ngữ cho POI
- **POIAudio** - Audio guides cho translations
- **FavoritePOI** - Danh sách yêu thích của người dùng
- **Review** - Đánh giá và bình luận
- **SearchHistory** - Lịch sử tìm kiếm
- **UserActivity** - Log hoạt động người dùng

#### Models đã cập nhật:
- **User**: Thêm `lastLogin`, `refreshTokenHash`, `refreshTokenExpiry`, `resetPasswordTokenHash`, `resetPasswordTokenExpiry`
- **District**: `description`, `address`, `qrCode` giờ là optional (nullable)
- **POI**: 
  - Loại bỏ `audioUrl` và `audioScript` (giờ là trong POITranslation)
  - Thay đổi `slug` thành optional
  - Thay đổi `category` thành String (thay vì enum)
  - Thay đổi `priceMin`, `priceMax` thành optional (nullable)

#### PageView & POIView:
- Thêm relations với User
- Thêm proper indexes theo SQL schema

---

### 2. **Domain Entities** 

#### `src/domain/entities/user.ts`
- ✅ Thêm auth fields: `lastLogin`, `refreshTokenHash`, `refreshTokenExpiry`, `resetPasswordTokenHash`, `resetPasswordTokenExpiry`
- ✅ Thay đổi UserRole thành UPPERCASE: `"USER" | "ADMIN" | "VENDOR"`
- ✅ Thêm `isUserActive()` method (tránh naming conflict với property)

#### `src/domain/entities/district.ts`
- ✅ Tất cả fields (ngoại trừ `name`, `slug`) giờ đều optional
- ✅ Thêm `address` field
- ✅ Thêm `getCoordinates()` helper method

#### `src/domain/entities/poi.ts`
- ✅ Loại bỏ `description`, `imageUrl`, `audioUrl`, `audioScript` fields
- ✅ Đơn giản hóa `priceRange` -> `priceMin`, `priceMax` (optional, nullable)
- ✅ Đơn giản hóa `location` (optional)
- ✅ Thay đổi `category` từ enum thành string optional
- ✅ Thêm helper methods: `getPriceRange()`, `getCoordinates()`, `getCategory()`

---

### 3. **DTOs (Data Transfer Objects)**

#### Cập nhật hiện tại:
- ✅ `auth.dto.ts` - Thêm `avatarUrl`, `ResetPasswordRequestDTO`
- ✅ `district.dto.ts` - Làm optional tất cả non-essential fields, thêm `DistrictWithPOIsDTO`
- ✅ `poi.dto.ts` - Loại bỏ `description`, thêm separate DTOs cho images, translations, audios, reviews
- ✅ `audio-guide.dto.ts` - Align với `POITranslation` & `POIAudio` models
- ✅ `translation.dto.ts` - Tập trung vào POI translations
- ✅ `tour.dto.ts` - Làm optional các fields không bắt buộc
- ✅ `location.dto.ts` - Thêm `GeoLocationDTO` và `BoundsDTO`

#### DTOs mới được tạo:
- ✅ **search.dto.ts** - `SearchHistoryDTO`, `SearchResultsDTO`
- ✅ **analytics.dto.ts** - `PageViewDTO`, `POIViewDTO`, `AnalyticsDTO`
- ✅ **review.dto.ts** - `ReviewRequestDTO`, `RatingStatsDTO`
- ✅ **favorite.dto.ts** - `FavoriteRequestDTO`, `FavoritePOIDTO`

---

### 4. **Database Migrations**
Created migration structure:
```
src/infrastructure/database/prisma/migrations/
├── migration_lock.toml
└── initial_schema/
    └── migration.sql
```

✅ Migration file đầy đủ với:
- CreateEnum for `UserRole`
- Tất cả 13 CREATE TABLE statements
- Foreign keys với ON DELETE CASCADE
- Indexes theo SQL schema
- Unique constraints

---

## 🔄 Đồng bộ hoàn toàn

### So sánh SQL Schema vs Prisma Schema:

| Feature | SQL | Prisma | Status |
|---------|-----|--------|--------|
| Users table | ✓ | ✓ | ✅ |
| Auth fields | ✓ | ✓ | ✅ |
| Districts table | ✓ | ✓ | ✅ |
| POIs table | ✓ | ✓ | ✅ |
| POI Images | ✓ | ✓ | ✅ |
| Menu Items | ✓ | ✓ | ✅ |
| POI Translations | ✓ | ✓ | ✅ |
| POI Audios | ✓ | ✓ | ✅ |
| Page Views | ✓ | ✓ | ✅ |
| POI Views | ✓ | ✓ | ✅ |
| Favorites | ✓ | ✓ | ✅ |
| Reviews | ✓ | ✓ | ✅ |
| Search History | ✓ | ✓ | ✅ |
| User Activity | ✓ | ✓ | ✅ |

---

## ✅ Code Quality

- ✅ **TypeScript**: Không có lỗi type (`pnpm typecheck` - PASS)
- ✅ **Linting**: Code được format theo Biome rules
- ✅ **Naming**: Sử dụng camelCase (TypeScript) và snake_case (database)
- ✅ **Constraints**: Foreign keys, unique constraints, indexes đầy đủ

---

## 📝 Notes

### Breaking Changes:
- `User.role` giờ dùng UPPERCASE values (`"USER" | "ADMIN" | "VENDOR"`)
- `POI` không còn `audioUrl`, `audioScript`, `description` trực tiếp
- `POI.category` từ enum thành string

### Migration Steps:
1. Đảm bảo database đã được backup
2. Áp dụng migration: `pnpm prisma migrate deploy`
3. Kiểm tra Prisma Client: `pnpm prisma generate`

### Next Steps:
1. Cập nhật service layer để sử dụng các models mới
2. Tạo API endpoints cho các features mới (translations, audios, reviews, favorites, etc.)
3. Cập nhật UI components để hiển thị multi-language support
4. Implement analytics dashboard

---

## 📂 Files Modified/Created

### Modified:
- `src/infrastructure/database/prisma/schema.prisma`
- `src/domain/entities/user.ts`
- `src/domain/entities/district.ts`
- `src/domain/entities/poi.ts`
- `src/application/dtos/auth.dto.ts`
- `src/application/dtos/district.dto.ts`
- `src/application/dtos/poi.dto.ts`
- `src/application/dtos/audio-guide.dto.ts`
- `src/application/dtos/translation.dto.ts`
- `src/application/dtos/tour.dto.ts`
- `src/application/dtos/location.dto.ts`
- `prisma/schema.prisma`

### Created:
- `src/application/dtos/search.dto.ts`
- `src/application/dtos/analytics.dto.ts`
- `src/application/dtos/review.dto.ts`
- `src/application/dtos/favorite.dto.ts`
- `src/infrastructure/database/prisma/migrations/migration_lock.toml`
- `src/infrastructure/database/prisma/migrations/initial_schema/migration.sql`

---

## 🚀 Testing
```bash
# Verify types
pnpm typecheck

# Verify formatting
pnpm lint:fix

# Generate Prisma Client
pnpm prisma generate

# (Optional) Deploy migration
pnpm prisma migrate deploy

# (Optional) Run E2E tests
pnpm test
```
