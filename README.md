# 🍜 FoodStreet Guide Platform

> Nền tảng hướng dẫn ẩm thực đường phố thông minh dựa trên QR Code và GPS

Ứng dụng web giúp người dùng khám phá ẩm thực đường phố bằng cách quét mã QR tại các khu phố ẩm thực, với tính năng định vị GPS, thuyết minh đa ngôn ngữ và đặt món trực tuyến.

## 📋 Tổng quan

FoodStreet Guide là một WebApp cho phép người dùng:
- **Quét QR Code** tại khu phố để kích hoạt nội dung hướng dẫn
- **Định vị GPS** tự động nhận diện vị trí và gợi ý gian hàng gần nhất
- **Nghe thuyết minh** đa ngôn giới thiệu về các món ăn đặc sắc
- **Đặt món trực tuyến** và thanh toán qua VietQR / VNPay

## 🚀 Bắt đầu

### Yêu cầu

- Node.js >= 22.0.0
- pnpm >= 9.0.0
- PostgreSQL (cho database)

### Cài đặt

```bash
# Clone repository
git clone <repository-url>
cd foodstreet-guide-platform

# Cài đặt dependencies
pnpm install

# Copy file environment variables
cp .env.example .env

# Thiết lập database
pnpm db:push
```

### Chạy project

```bash
# Chạy development server
pnpm dev

# Build cho production
pnpm build

# Chạy production server
pnpm start
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 🏗️ Kiến trúc dự án

```
foodstreet-guide-platform/
├── app/                    # Next.js App Router
│   ├── (map)/             # Map related pages
│   ├── (order)/           # Order related pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── features/          # Feature-specific components
│   ├── layouts/           # Layout components (Header, Footer)
│   └── ui/                # UI components (Button, Card, ...)
├── infrastructure/        # Infrastructure configurations
│   └── docker/            # Docker configurations
├── lib/                   # Utility functions
├── public/                # Static assets
├── src/                   # Source code
│   ├── application/       # Application layer
│   ├── domain/            # Domain logic
│   └── infrastructure/    # Infrastructure implementations
└── tests/                 # E2E tests with Playwright
```

## 🛠️ Công nghệ

### Frontend
- **Next.js 15** - React framework với App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Mapbox GL JS** - Interactive maps

### UI Components
- **Radix UI** - Headless UI components
- **class-variance-authority** - Component variants
- **tailwind-merge** - Merge Tailwind classes

### Backend & Database
- **Prisma** - ORM cho TypeScript
- **PostgreSQL** - Database
- **Zustand** - State management
- **TanStack Query** - Data fetching & caching

### Testing
- **Playwright** - E2E testing
- **Biome** - Linting & Formatting

## 📦 Các scripts

```bash
# Development
pnpm dev              # Start dev server

# Building
pnpm build            # Build for production
pnpm start            # Start production server

# Code quality
pnpm lint             # Check code with Biome
pnpm lint:fix         # Fix code issues
pnpm format           # Format code
pnpm typecheck        # Check TypeScript types

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run database migrations
pnpm db:studio        # Open Prisma Studio

# Testing
pnpm test             # Run Playwright tests
pnpm test:ui          # Run tests with UI
pnpm test:e2e         # Run E2E tests

# Docker
pnpm docker:up        # Start Docker services
pnpm docker:down      # Stop Docker services
```

## 🎨 Giao diện

Dự án sử dụng hệ thống design theme với các màu:
- **Primary** - Màu chính (xanh lá #16a34a)
- **Secondary** - Màu phụ
- **Muted** - Màu nhạt cho background
- **Destructive** - Màu cho hành động hủy

## 🌐 Tính năng chính

### Người dùng
- [x] Trang chủ với giới thiệu tính năng
- [x] Header với navigation responsive
- [x] Footer với links
- [ ] Quét QR Code
- [ ] Bản đồ với Mapbox
- [ ] Xem danh sách gian hàng
- [ ] Thuyết minh đa ngôn ngữ
- [ ] Giỏ hàng
- [ ] Thanh toán online

### Quản trị
- [ ] Dashboard
- [ ] Quản lý khu phố
- [ ] Quản lý gian hàng (POI)
- [ ] Quản lý menu món ăn
- [ ] Quản lý đơn hàng
- [ ] Thống kê & báo cáo

## 📝 Hướng phát triển

Dự án theo mô hình **Clean Architecture** với các layer:
- **Domain Layer** - Business logic thuần túy
- **Application Layer** - Use cases & orchestration
- **Infrastructure Layer** - External integrations

## 🤝 Đóng góp

1. Fork dự án
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Dự án được phát triển cho mục đích học tập và nghiên cứu.

## 🔗 Liên hệ

- **Project Seminar** - University Project
- **Issues** - GitHub Issues

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS
