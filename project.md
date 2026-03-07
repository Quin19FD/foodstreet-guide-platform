
---

# 📍 Smart Food Street CMS & GPS Guide Platform

## 1. Tổng quan dự án

Smart Food Street CMS & GPS Guide Platform là một hệ thống quản lý nội dung và khám phá ẩm thực dựa trên vị trí địa lý (GPS), được thiết kế cho các khu phố ẩm thực, chợ đêm và khu du lịch ẩm thực.

Hệ thống cho phép quản trị viên quản lý các gian hàng ẩm thực, các tiện ích hỗ trợ và xây dựng các tuyến tham quan ẩm thực thông qua một **hệ thống quản trị nội dung (CMS)**. Dữ liệu này sau đó được sử dụng bởi **ứng dụng web dành cho người dùng cuối** để cung cấp trải nghiệm khám phá ẩm thực dựa trên vị trí thực tế của người dùng.

Hệ thống sử dụng mô hình **Point of Interest (POI)** để đại diện cho các gian hàng ẩm thực hoặc các tiện ích trong khu phố.

Mỗi POI được gắn với các thông tin sau:

* Tọa độ GPS (latitude / longitude)
* Nội dung mô tả
* Hình ảnh minh họa
* Nội dung thuyết minh (Audio Guide)
* Dữ liệu đa ngôn ngữ

Kiến trúc hệ thống được thiết kế theo mô hình **Microservice**, cho phép các chức năng chính của hệ thống được triển khai dưới dạng các service độc lập nhằm tăng khả năng mở rộng, bảo trì và phát triển trong tương lai.

---

# 2. Mục tiêu hệ thống

## 2.1 Mục tiêu chính

Xây dựng một nền tảng quản lý nội dung cho các khu phố ẩm thực thông minh, cho phép quản trị viên:

* Quản lý các gian hàng ẩm thực
* Quản lý các tiện ích phục vụ du khách
* Tạo và quản lý các tuyến tham quan ẩm thực (Food Tour)
* Quản lý nội dung thuyết minh cho từng điểm tham quan

Toàn bộ dữ liệu được quản lý thông qua **giao diện bản đồ trực quan**, giúp việc quản lý vị trí các POI trở nên dễ dàng và trực quan hơn.

---

## 2.2 Mục tiêu phụ

Ngoài chức năng quản trị nội dung, hệ thống cũng hướng đến các mục tiêu sau:

* Quản lý POI dựa trên **tọa độ GPS**
* Hỗ trợ **đa ngôn ngữ** cho khách du lịch quốc tế
* Cung cấp **Audio Guide tự động**
* Hỗ trợ **khám phá gian hàng thông qua bản đồ**
* Cho phép xây dựng **Food Tour** bằng cách kết hợp nhiều POI

---

# 3. Luồng hoạt động chính (User Flow)

## 3.1 Luồng người dùng

1. Người dùng **quét QR Code của khu phố ẩm thực**
2. Hệ thống mở **Smart Food Street Web Application**
3. Hệ thống:

   * tự động nhận diện ngôn ngữ của thiết bị
   * hoặc cho phép người dùng chọn ngôn ngữ
4. Ứng dụng yêu cầu **quyền truy cập GPS**
5. Hệ thống xác định **vị trí hiện tại của người dùng**
6. Bản đồ hiển thị:

   * vị trí người dùng
   * các POI trong khu phố
7. Người dùng có thể:

   * xem POI gần nhất
   * khám phá các gian hàng
   * tìm kiếm món ăn
8. Khi người dùng đến gần một POI:

   * hệ thống hiển thị thông tin gian hàng
   * kích hoạt **Audio Guide**
9. Khi người dùng tiếp tục di chuyển:

   * hệ thống cập nhật vị trí GPS
   * xác định POI gần nhất mới
   * cập nhật nội dung hiển thị

---

# 4. Chức năng hệ thống

## 4.1 Admin Content Management System (CMS)

Admin CMS là hệ thống quản trị nội dung dành cho quản trị viên, cho phép quản lý toàn bộ dữ liệu của khu phố ẩm thực.

---

### 4.1.1 Xác thực quản trị viên

Hệ thống cung cấp cơ chế xác thực cơ bản cho quản trị viên.

Các chức năng bao gồm:

* Đăng nhập bằng **username và password**
* Quản lý **session đăng nhập**
* Chức năng **đăng xuất**

---

### 4.1.2 Quản lý POI (Points of Interest)

Quản trị viên có thể tạo và quản lý các POI đại diện cho các gian hàng ẩm thực hoặc tiện ích hỗ trợ.

#### Tạo POI

POI có thể được tạo bằng:

* Click trực tiếp trên bản đồ
* Nhập thủ công tọa độ **latitude / longitude**

#### Chỉnh sửa POI

Thông tin POI bao gồm:

* Tên gian hàng
* Mô tả
* Tọa độ
* Bán kính hiển thị
* Loại POI
* Hình ảnh
* Nội dung thuyết minh

#### Upload hình ảnh

* Upload ảnh gian hàng
* Quản lý thư viện ảnh
* Cập nhật ảnh minh họa cho POI

#### Tìm kiếm và lọc POI

* Tìm POI theo tên
* Lọc theo loại
* Lọc theo khu vực trên bản đồ

#### Xóa POI

* Xóa POI khỏi hệ thống
* Tự động xóa POI khỏi các tour liên quan (cascade deletion)

---

### 4.1.3 Phân loại POI

POI được phân thành hai nhóm chính.

#### 1. Food Stall

Đại diện cho các gian hàng ẩm thực trong khu phố.

Ví dụ:

* Street food
* Đặc sản địa phương
* Món ăn truyền thống

Thông tin bao gồm:

* Tên gian hàng
* Mô tả món ăn
* Hình ảnh
* Nội dung thuyết minh

---

#### 2. Supporting Facilities

Các tiện ích phục vụ du khách.

Ví dụ:

* WC
* ATM
* Bãi gửi xe
* Quầy thông tin
* Khu nghỉ chân

---

### 4.1.4 Quản lý Food Tour

Quản trị viên có thể tạo các tuyến tham quan ẩm thực (Food Tour).

Chức năng bao gồm:

* Tạo tour mới
* Chỉnh sửa tour
* Thêm POI vào tour
* Xóa POI khỏi tour
* Sắp xếp thứ tự POI bằng **drag-and-drop**

Thông tin tour bao gồm:

* Tên tour
* Mô tả
* Thời lượng
* Hình ảnh
* Danh sách POI

---

### 4.1.5 Hệ thống Audio Guide

Hệ thống hỗ trợ thuyết minh tự động cho từng POI.

Các chức năng bao gồm:

* Nhập **script thuyết minh**
* Tạo **audio bằng Text-to-Speech**
* Quản lý audio theo từng POI

---

### 4.1.6 Quản lý đa ngôn ngữ

Hệ thống hỗ trợ quản lý nội dung bằng nhiều ngôn ngữ.

Quản trị viên có thể quản lý bản dịch cho:

* Tên POI
* Mô tả
* Nội dung thuyết minh

Ví dụ ngôn ngữ hỗ trợ:

* Tiếng Việt
* Tiếng Anh
* Tiếng Trung
* Tiếng Hàn

---

# 5. Smart Food Street Web Application

Đây là ứng dụng web dành cho người dùng cuối giúp khám phá khu phố ẩm thực.

---

## 5.1 Bản đồ tương tác

Ứng dụng hiển thị bản đồ khu phố ẩm thực.

Chức năng bao gồm:

* Hiển thị tất cả POI
* Hiển thị vị trí người dùng
* Hiển thị khoảng cách đến POI
* Highlight POI gần nhất

---

## 5.2 GPS Positioning

Ứng dụng sử dụng GPS của thiết bị để:

* Xác định vị trí người dùng
* Cập nhật vị trí theo thời gian thực
* Tính khoảng cách đến các POI

---

## 5.3 Xem thông tin gian hàng

Khi người dùng chọn một POI, hệ thống hiển thị:

* Tên gian hàng
* Mô tả món ăn
* Hình ảnh
* Nội dung thuyết minh
* Khoảng cách từ vị trí hiện tại

---

## 5.4 Audio Guide

Người dùng có thể nghe thuyết minh cho từng POI.

Chức năng:

* Text-to-Speech
* Phát audio tự động khi đến gần POI
* Tạm dừng / phát lại
* Chọn ngôn ngữ

---

## 5.5 Tìm kiếm và khám phá

Người dùng có thể:

* Tìm kiếm gian hàng theo tên
* Lọc gian hàng theo loại
* Xem danh sách POI
* Xem gian hàng gần nhất
* Xem gợi ý Food Tour

---

## 5.6 Cập nhật POI theo chuyển động

Hệ thống theo dõi vị trí người dùng theo thời gian thực.

Khi người dùng di chuyển:

1. Cập nhật vị trí GPS
2. Tính khoảng cách đến các POI
3. Xác định POI gần nhất
4. Hiển thị thông tin POI
5. Kích hoạt Audio Guide

---

# 6. Kiến trúc hệ thống (Microservice Architecture)

Hệ thống được thiết kế theo **kiến trúc Microservice**, trong đó mỗi chức năng chính được triển khai dưới dạng một service độc lập.

Các service giao tiếp với nhau thông qua **REST API**.

```
Admin CMS (Next.js Dashboard)
        │
        │ REST API
        ▼
     API Gateway
        │
 ┌─────────────────────────────┐
 │        Microservices        │
 │                             │
 │  Auth Service               │
 │  POI Service                │
 │  Tour Service               │
 │  Media Service              │
 │  Audio Guide Service        │
 │  Translation Service        │
 │  Location Service           │
 │                             │
 └─────────────────────────────┘
        │
        ▼
     PostgreSQL
        │
        ▼
Smart Food Street Web Application
(GPS Food Exploration App)
```

---

# 7. Công nghệ đề xuất

## Frontend

* Next.js
* TypeScript
* TailwindCSS
* Leaflet / Mapbox
* Web Speech API

---

## Backend

* Node.js
* NestJS
* Microservice Architecture
* REST API
* Prisma ORM
* PostgreSQL

---

## DevOps

* Docker
* Docker Compose
* Nginx / API Gateway
* CI/CD Pipeline

---

