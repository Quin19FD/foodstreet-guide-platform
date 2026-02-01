# Tasks

Track ongoing and completed tasks for the FoodStreet Guide Platform.

## [Pending]

### Phase 1: Foundation
- [ ] Setup Prisma with PostgreSQL schema
- [ ] Configure Playwright E2E tests
- [ ] Setup shadcn/ui base components
- [ ] Configure environment variables
- [ ] Setup Docker compose for local development

### Phase 2: Domain Layer
- [ ] Create User entity
- [ ] Create District entity
- [ ] Create POI (Point of Interest) entity
- [ ] Create Order entity
- [ ] Create Payment entity
- [ ] Create value objects (Location, Money, QRCode)

### Phase 3: Application Layer
- [ ] Define use cases for authentication
- [ ] Define use cases for POI management
- [ ] Define use cases for location services
- [ ] Define use cases for payment processing
- [ ] Create DTOs for all use cases

### Phase 4: Infrastructure Layer
- [ ] Setup Prisma client and database connection
- [ ] Implement repository pattern with Prisma
- [ ] Create VNPay integration
- [ ] Create VietQR integration
- [ ] Setup S3-compatible storage (MinIO)

### Phase 5: Presentation Layer - User App
- [ ] Create main layout
- [ ] Create home page with QR scanner
- [ ] Create map view with POI markers
- [ ] Create POI detail page
- [ ] Create audio guide player
- [ ] Create order flow
- [ ] Create payment flow

### Phase 6: Presentation Layer - Admin Dashboard
- [ ] Create admin layout
- [ ] Create dashboard home page
- [ ] Create district management pages
- [ ] Create POI management pages
- [ ] Create order management pages
- [ ] Create analytics pages

---

## [In Progress]

- Setting up project structure and configuration

---

## [Completed]

### 2026-02-01
- [x] Initialize Next.js 15 project
- [x] Create Clean Architecture folder structure
- [x] Setup Biome for linting and formatting
- [x] Setup commitlint for conventional commits
- [x] Create .claude folder with rules and agents
- [x] Create base configuration files

---

## Legend

| Icon | Status |
|------|--------|
| [ ] | Pending |
| [~] | In Progress |
| [x] | Completed |
