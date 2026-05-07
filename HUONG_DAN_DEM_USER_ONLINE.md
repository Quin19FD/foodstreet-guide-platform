# Hướng Dẫn Chi Tiết Chức Năng Đếm User Online

## 1. Mục tiêu chức năng

Chức năng này dùng để hiển thị số **user đang sử dụng hệ thống theo thời gian thực** mà **không dùng Socket.IO**.

Mục tiêu thực tế:

- Khi user vào hệ thống: số đếm tăng nhanh.
- Khi user rời trang: số đếm giảm nhanh (không chờ quá lâu).
- Hoạt động tốt trên môi trường nhiều instance như Vercel.

---

## 2. Các thành phần chính

### 2.1 API heartbeat/count

- File: `pages/api/socket.ts`
- Nhiệm vụ:
  - `GET /api/socket`: trả số user online hiện tại.
  - `POST /api/socket`: nhận heartbeat từ client để cập nhật trạng thái online.

### 2.2 API offline signal

- File: `pages/api/socket-offline.ts`
- Nhiệm vụ:
  - `POST /api/socket-offline`: nhận tín hiệu user rời trang (sendBeacon/keepalive fetch) để giảm count ngay.

### 2.3 API stream SSE

- File: `pages/api/socket-stream.ts`
- Nhiệm vụ:
  - `GET /api/socket-stream`: mở kênh SSE (Server-Sent Events), push event `count` về client khi số đếm thay đổi.

### 2.4 Store xử lý online counter

- File: `src/infrastructure/realtime/customer-online-store.ts`
- Nhiệm vụ:
  - Xử lý logic đếm online bằng Upstash Redis (REST + Lua script).
  - Publish biến động count lên channel Redis để SSE nhận gần realtime.
  - Fallback sang memory nếu không có cấu hình Upstash.

### 2.5 Frontend customer counter

- File: `components/features/customer/shared/customer-online-counter.tsx`
- Nhiệm vụ:
  - Tạo `presenceId` cho client.
  - Gửi heartbeat định kỳ.
  - Mở SSE stream để nhận count realtime.
  - Gửi tín hiệu offline khi rời trang.

### 2.6 Frontend admin dashboard

- File: `app/admin/dashboard/page.tsx`
- Nhiệm vụ:
  - Vẫn có polling fallback.
  - Có SSE để cập nhật số truy cập nhanh hơn.

---

## 3. Tổng quan luồng hoạt động

### 3.1 Khi user đang dùng hệ thống

1. Frontend tạo/đọc `presenceId` từ `localStorage`.
2. Frontend gọi `POST /api/socket` kèm header `x-presence-id`.
3. API xác thực user qua cookie access token.
4. Store cập nhật dữ liệu online trong Redis bằng Lua script:
   - Cập nhật session hiện tại.
   - Dọn session hết hạn theo TTL.
   - Cập nhật tập user online.
   - Trả về tổng user online.
5. Store publish count lên Redis channel.
6. SSE stream nhận publish, đẩy event `count` xuống client.
7. UI customer/admin cập nhật số online gần như ngay lập tức.

### 3.2 Khi user rời trang

1. Frontend bắt sự kiện `pagehide`.
2. Gửi `sendBeacon("/api/socket-offline?presenceId=...")`.
3. API offline gọi `markCustomerOffline`.
4. Store xóa session, cập nhật lại count, publish lên channel.
5. SSE stream đẩy số mới xuống các client.

### 3.3 Khi mạng lỗi hoặc stream lỗi

- SSE stream có polling fallback (2 giây/lần trong endpoint stream nếu subscribe Upstash lỗi).
- Counter frontend vẫn có heartbeat định kỳ để giữ trạng thái online.
- Store có fallback memory nếu không dùng được Upstash.

---

## 4. Chi tiết từng endpoint

## `GET /api/socket`

- Mục đích: lấy tổng user online hiện tại.
- Không bắt buộc auth.
- Trả về JSON:

```json
{ "ok": true, "total": 12 }
```

## `POST /api/socket`

- Mục đích: heartbeat online.
- Bắt buộc:
  - Cookie access token hợp lệ (`USER` role).
  - Header `x-presence-id`.
- Trả về JSON:

```json
{ "ok": true, "total": 12 }
```

## `POST /api/socket-offline`

- Mục đích: báo user rời trang để giảm count ngay.
- Nhận `presenceId` qua query hoặc header.
- Trả về JSON:

```json
{ "ok": true, "total": 11 }
```

## `GET /api/socket-stream`

- Mục đích: kênh SSE để push realtime.
- Push event:

```text
event: count
data: 12
```

- Có heartbeat ping SSE để giữ kết nối.

---

## 5. Dữ liệu và thuật toán trong Redis

Để đảm bảo đếm đúng theo user và xử lý nhiều thiết bị/tab, store dùng các key:

- `...:sessions` (ZSET): session online + timestamp.
- `...:session_users` (HASH): map `sessionId -> userId`.
- `...:user_session_counts` (HASH): số session đang sống theo user.
- `...:active_users` (SET): tập user online thực tế.
- `...:count` (channel): publish count để SSE subscribe.

### Vì sao cần nhiều key?

Chỉ một ZSET là chưa đủ khi cần:

- gộp nhiều session về cùng 1 user,
- giảm ngay khi 1 session rời,
- không làm sai count khi user có nhiều tab/thiết bị.

### Lua script đang làm gì?

Store có 3 script chính:

- `HEARTBEAT_LUA`: cập nhật/đổi session-user, prune session hết hạn, trả count.
- `OFFLINE_LUA`: xóa session vừa rời, cập nhật count, trả count.
- `COUNT_LUA`: chỉ prune hết hạn + trả count.

Lý do dùng Lua:

- Các bước cập nhật/phụ thuộc nhau được chạy atomically trong Redis,
- tránh race condition khi nhiều request cùng lúc.

---

## 6. Fallback memory (khi không có Upstash)

Nếu thiếu env Upstash:

- Store tự chạy bằng memory trong process.
- Vẫn hoạt động local/dev.
- Không đảm bảo chính xác khi nhiều instance (production scale).

=> Khuyến nghị production trên Vercel: **luôn bật Upstash**.

---

## 7. Cấu hình môi trường

Đặt trên Vercel (Project Settings -> Environment Variables):

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Tuỳ chọn namespace:

- `ONLINE_COUNTER_NAMESPACE`

Nếu không set namespace, hệ thống tự suy ra từ:

- `NODE_ENV`, `VERCEL_ENV`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`.

---

## 8. Các thông số quan trọng

- TTL online: `45 giây` (`CUSTOMER_ONLINE_TTL_MS = 45_000`).
- Heartbeat từ client: `15 giây/lần`.
- SSE ping: `15 giây/lần`.
- SSE fallback polling (server side stream): `2 giây/lần`.

### Gợi ý tinh chỉnh

- Muốn nhạy hơn: giảm heartbeat xuống 8-10s.
- Muốn tiết kiệm request hơn: tăng heartbeat lên 20-30s (đổi lại phản hồi chậm hơn).

---

## 9. Test checklist đề xuất

## Case A: 1 user đăng nhập

- Mở customer page.
- Kỳ vọng: count tăng gần ngay.

## Case B: 1 user đóng tab

- Đóng tab customer.
- Kỳ vọng: count giảm nhanh (beacon).

## Case C: 1 user mở nhiều tab cùng browser

- Mở 2 tab customer cùng account.
- Kỳ vọng: vẫn tính là 1 user.

## Case D: 2 account khác nhau

- Mỗi account 1 browser.
- Kỳ vọng: count tăng thành 2.

## Case E: lỗi stream

- Chặn stream tạm thời.
- Kỳ vọng: vẫn cập nhật được nhờ fallback.

---

## 10. Lưu ý vận hành

- `sendBeacon` rất hữu ích nhưng không bảo đảm 100% trong mọi tình huống browser/system.
- TTL là lớp bảo hiểm để tự dọn session “mồ côi”.
- Nếu bạn cần audit/analytics dài hạn, nên tách thêm hệ thống thống kê riêng; online counter hiện tại ưu tiên realtime.

---

## 11. Tóm tắt ngắn

Chức năng đếm user online hiện tại là:

- **Không dùng Socket.IO**
- **Dùng SSE + Redis + heartbeat + offline signal**
- **Đếm user online theo thời gian thực gần tương đương socket**
- **Phù hợp với Vercel nhiều instance**

