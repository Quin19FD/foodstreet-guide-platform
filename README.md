# Project Title

Smart Food Street Guide Platform

## Description

Nền tảng quản lý và khám phá ẩm thực theo QR + GPS, gồm:

- Admin CMS để quản lý District, POI, Food Tour, Media, Audio Guide, Translation.
- Web Application cho người dùng khám phá POI theo vị trí thực.

Hiện trạng codebase đang theo hướng microservice-style scaffold (service-based trong cùng Next.js app).

## Features

- Admin Dashboard
- POI Management
- District Management
- Food Tour Management
- Media Library
- Audio Guide Management
- Translation Management
- Analytics Overview
- Web map exploration (scan, districts, pois, tours)
- API Gateway route: `/api/gateway/[service]/[...path]`

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- TailwindCSS
- Prisma
- Playwright

## Installation

```bash
pnpm install
```

Yêu cầu môi trường:

- Node.js >= 22
- pnpm >= 9

## Run Project

```bash
pnpm dev
```

Mở trên trình duyệt:

- `http://localhost:3000`
- `http://localhost:3000/admin/dashboard`

## Authors

- Nguyễn Hoàng Quyên - 3122410351
- Cao Tiến Cường - 3122410043
- Đỗ Mai Anh - 3122410006
- Nguyễn Tuấn Vũ - 3122410483
