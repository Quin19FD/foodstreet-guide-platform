# Scope Cleanup Checklist (Theo SYSTEM_ARCHITECTURE.md)

Mục tiêu: loại bỏ tính năng ngoài phạm vi hiện tại (cart/order/payment/revenue), giữ nguyên cấu trúc dự án và các thư mục hệ thống.

## Nguyên tắc giữ nguyên

- Giữ nguyên các thư mục: `.serena`, `.husky`, `.claude`.
- Giữ nguyên thư viện nền tảng đang cần cho hệ thống hiện tại: `next`, `react`, `typescript`, `@prisma/client`, `prisma`, `mapbox-gl`, `zod`, `zustand`, `tailwind*`, `@playwright/test`, `husky`.
- Không xóa các module thuộc phạm vi: Auth, POI, Tour, Media, Audio Guide, Translation, Location.

## A. UI/Web cần loại bỏ hoặc chỉnh sửa

1. [ ] `app/page.tsx`
- Bỏ copy/CTA liên quan đặt món, thanh toán, VietQR, VNPay.
- Bỏ icon/section mô tả Shopping Cart nếu chỉ phục vụ scope cũ.

2. [ ] `components/layouts/header.tsx`
- Bỏ menu `Giỏ hàng` (`/cart`).
- Bỏ icon `ShoppingCart` nếu không còn dùng.

3. [ ] `components/layouts/main-layout.tsx`
- Bỏ link `/orders`.

4. [ ] `components/layouts/admin-layout.tsx`
- Bỏ mục điều hướng `/admin/orders` nếu không còn trang trong scope.

## B. Domain/Application cần loại bỏ

1. [ ] `src/domain/entities/order.ts`
- Xóa toàn bộ entity `Order`.

2. [ ] `src/domain/entities/payment.ts`
- Xóa toàn bộ entity `Payment`.

3. [ ] `src/application/dtos/order.dto.ts`
- Xóa DTO order.

4. [ ] `src/application/dtos/payment.dto.ts`
- Xóa DTO payment.

5. [ ] `src/application/services/interfaces.ts`
- Xóa `IOrderService`, `IPaymentService`, `IVietQRService`, `IVNPayService`.
- Xóa import `Order`, `Payment`, `PaymentCallbackDTO`.

6. [ ] `src/domain/value-objects/qr-code.ts`
- Đổi type QR: bỏ `order`/`payment`, chỉ giữ type còn trong scope (ví dụ `district`, `poi`).
- Cập nhật regex parse tương ứng.

## C. Infrastructure/Config cần loại bỏ

1. [ ] `src/infrastructure/payment/vnpay.ts`
- Xóa file/module.

2. [ ] `src/infrastructure/payment/vietqr.ts`
- Xóa file/module.

3. [ ] `src/shared/config/index.ts`
- Xóa block config `payment` và biến môi trường liên quan VNPay/VietQR.

## D. Database (Prisma) cần chỉnh sửa

1. [ ] `src/infrastructure/database/prisma/schema.prisma`
- Xóa models: `Order`, `OrderItem`, `Payment`.
- Xóa enums: `OrderStatus`, `PaymentMethod`, `PaymentStatus`, `PaymentProvider`.
- Xóa quan hệ tham chiếu `orders`, `payments` ở model khác.

2. [ ] Migration
- Tạo migration loại bỏ bảng ngoài scope.
- Kiểm tra ràng buộc FK/Index sau khi xóa.

## E. Tests cần loại bỏ/cập nhật

1. [ ] `tests/e2e/payment/checkout.spec.ts`
- Xóa test checkout/payment.

2. [ ] Toàn bộ test liên quan `/order`, `/cart`, `/payment`
- Tìm và xóa/cập nhật theo scope mới.

## F. Quét lại sau cleanup

Chạy lại các lệnh sau và đảm bảo không còn kết quả trong code nghiệp vụ:

```powershell
rg -n -S "VNPay|VietQR|MoMo|ZaloPay|payment|checkout|order|cart|pre-order|transaction|revenue" app src components lib prisma tests
rg -n -S "admin/orders|/orders|/cart|/order/checkout" app src components tests
```

## G. Xác thực an toàn

1. [ ] `pnpm typecheck`
2. [ ] `pnpm lint`
3. [ ] `pnpm test` (hoặc subset e2e còn lại)

