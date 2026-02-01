# 📍 Smart Food Street QR Guide Platform

> Hướng dẫn ẩm thực đường phố thông minh - Kiến trúc Monorepo + Microservices + Next.js 15

## 📖 Giới thiệu

Nền tảng giúp người dùng khám phá ẩm thực đường phố thông qua:
- **QR Code** - Quét mã để kích hoạt nội dung khu phố
- **GPS** - Tự động nhận diện vị trí và gợi ý POI gần nhất
- **Audio Guide** - Thuyết minh đa ngôn ngữ (Text-to-Speech)
- **Online Payment** - Đặt món và thanh toán qua VietQR / VNPay

## 🏗️ Kiến trúc

```
foodstreet-guide-platform/
├── apps/
│   ├── web/              # Next.js 15 Web App (Port 4000)
│   ├── admin/            # Admin Dashboard (Port 4001)
│   └── mobile/           # React Native App (coming soon)
├── services/             # NestJS Microservices
│   ├── auth-service/     # Authentication (Port 3001)
│   ├── district-service/ # District Management (Port 3002)
│   ├── poi-service/      # POI/Store Management (Port 3003)
│   ├── location-service/ # GPS/Location (Port 3004)
│   ├── tts-service/      # Text-to-Speech (Port 3005)
│   ├── media-service/    # Media Storage (Port 3006)
│   ├── analytics-service/# Analytics (Port 3007)
│   ├── qr-service/       # QR Generation (Port 3008)
│   ├── payment-service/  # Payment Gateway (Port 3009)
│   └── order-service/    # Order Management (Port 3010)
├── packages/
│   ├── shared-types/     # TypeScript types
│   ├── utils/            # Utility functions
│   └── config/           # Configuration
└── infrastructure/
    ├── docker/           # Docker Compose
    └── nginx/            # API Gateway (Port 3000)
```

## 🚀 Bắt đầu

### Yêu cầu

- **Node.js** >= 22.0.0
- **pnpm** >= 9.0.0
- **Docker** (cho PostgreSQL, Redis, MinIO)

### Cài đặt

```bash
# Clone repository
git clone <repository-url>
cd foodstreet-guide-platform

# Cài đặt dependencies
pnpm install

# Copy file environment variables
cp .env.example .env

# Khởi động infrastructure (PostgreSQL, Redis, MinIO)
pnpm docker:up
```

### Chạy development

```bash
# Chạy tất cả apps và services
pnpm dev

# Chạy riêng lẻ
pnpm dev:web          # Web App
pnpm dev:admin        # Admin Dashboard
pnpm dev:services     # Tất cả Microservices
```

### Truy cập ứng dụng

| Service | URL | Credentials |
|---------|-----|-------------|
| Web App | http://localhost:4000 | - |
| Admin Dashboard | http://localhost:4001 | - |
| API Gateway | http://localhost:3000 | - |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| pgAdmin | http://localhost:5050 | admin@foodstreet.local / admin |

## 📦 Packages

### @foodstreet/shared-types
TypeScript types chia sẻ giữa frontend và backend:
- User, District, POI types
- Order, Payment types
- API Response types

### @foodstreet/utils
Utility functions:
- `calculateDistance()` - Tính khoảng cách GPS (Haversine)
- `formatCurrency()` - Format tiền tệ VND
- `slugify()` - Tạo slug từ string
- `generateId()` - Tạo UUID v4

### @foodstreet/config
Cấu hình chung cho toàn project:
- API endpoints
- Database connection
- Payment gateway config
- Map services config

## 🔌 API Endpoints

### Auth Service (`/api/auth`)
```
POST   /api/auth/register     Đăng ký
POST   /api/auth/login        Đăng nhập
POST   /api/auth/refresh      Làm mới token
GET    /api/auth/profile      Thông tin user (JWT)
```

### District Service (`/api/districts`)
```
GET    /api/districts         Danh sách khu phố
GET    /api/districts/:id     Chi tiết khu phố
POST   /api/districts         Tạo khu phố (Admin)
PUT    /api/districts/:id     Cập nhật khu phố
DELETE /api/districts/:id     Xóa khu phố
```

### POI Service (`/api/pois`)
```
GET    /api/pois              Danh sách gian hàng
GET    /api/pois/:id          Chi tiết gian hàng
GET    /api/pois/:id/menu     Menu món ăn
POST   /api/pois              Tạo gian hàng (Admin)
```

### Location Service (`/api/location`)
```
POST   /api/location/nearby   POI gần nhất
POST   /api/location/within   POI trong bán kính
```

### Payment Service (`/api/payment`)
```
POST   /api/payment/vietqr    Tạo QR VietQR
POST   /api/payment/vnpay     Tạo URL VNPay
POST   /api/payment/momo      Tạo URL MoMo
POST   /api/payment/callback  Webhook callback
```

### Order Service (`/api/orders`)
```
GET    /api/orders            Danh sách đơn hàng
GET    /api/orders/:id        Chi tiết đơn hàng
POST   /api/orders            Tạo đơn hàng
PUT    /api/orders/:id/status Cập nhật trạng thái
```

## 🗄️ Database

### PostgreSQL
- **Primary Database** - User, District, POI, Order, Transaction
- **Port:** 5432
- **Database:** foodstreet

### Redis
- **Cache** - Session, POI data, TTS cache
- **Pub/Sub** - Real-time order updates
- **Port:** 6379

### MinIO
- **Object Storage** - Images, Audio files
- **Port:** 9000 (API), 9001 (Console)

## 🔐 Payment Gateways

| Gateway | Status | Sandbox |
|---------|--------|---------|
| VietQR | ✅ Active | https://api.vietqr.io |
| VNPay | ✅ Active | https://sandbox.vnpayment.vn |
| MoMo | 🔶 Optional | https://test-payment.momo.vn |
| ZaloPay | 🔶 Optional | https://sb-openapi.zalopay.vn |

## 📱 Tech Stack

### Frontend
- **Next.js** 15 với App Router
- **TypeScript** 5
- **TailwindCSS** + shadcn/ui
- **TanStack Query** (React Query)
- **Zustand** (State management)
- **Mapbox GL JS** (Maps)

### Backend
- **NestJS** (Microservices)
- **PostgreSQL** + Prisma/TypeORM
- **Redis** (Cache)
- **JWT** (Authentication)
- **Passport** (Authorization)

### DevOps
- **Docker** + Docker Compose
- **Nginx** (API Gateway)
- **Turborepo** (Monorepo)
- **pnpm** (Package manager)

## 📝 Development Scripts

```bash
pnpm dev              # Chạy dev mode tất cả
pnpm build            # Build tất cả
pnpm lint             # Lint tất cả
pnpm docker:up        # Khởi động Docker infrastructure
pnpm docker:down      # Dừng Docker infrastructure
pnpm clean            # Clean build artifacts
```

## 📚 Tài liệu

- [project.md](project.md) - Chi tiết yêu cầu dự án
- [TASKS.md](TASKS.md) - Danh sách công việc cần làm

## 🗺️ Roadmap

- [x] Khởi tạo monorepo structure
- [x] Auth Service cơ bản
- [x] Web App cơ bản
- ] ] District Service
- [ ] POI Service
- [ ] Location Service
- [ ] TTS Service
- [ ] Payment Service
- [ ] Order Service
- [ ] Admin Dashboard
- [ ] Mobile App (React Native)

## 📄 License

MIT
