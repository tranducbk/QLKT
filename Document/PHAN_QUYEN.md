# 📋 Tài liệu Phân quyền Hệ thống QLKT

## 🎯 Tổng quan

Hệ thống QLKT (Quản lý Khen thưởng) sử dụng mô hình phân quyền 4 cấp độ:

1. **SUPER_ADMIN** - Quản trị viên cấp cao
2. **ADMIN** - Quản trị viên
3. **MANAGER** - Quản lý đơn vị
4. **USER** - Người dùng thông thường

---

## 🔐 1. SUPER_ADMIN (Quản trị viên cấp cao)

### Quyền hạn

- ✅ **Quản lý tài khoản hệ thống**

  - Tạo, sửa, xóa tài khoản của tất cả người dùng
  - Gán quyền (role) cho tài khoản
  - Xem danh sách tất cả tài khoản
  - Đổi mật khẩu tài khoản

- ✅ **Tất cả quyền của ADMIN** (xem phần 2)

### Menu và Chức năng

- **Dashboard**: Xem tổng quan hệ thống
- **Quản lý Tài khoản**: Quản lý tất cả tài khoản trong hệ thống
- **Nhật ký Hệ thống**: Xem nhật ký hoạt động của hệ thống

### Giới hạn

- Không thể xóa chính tài khoản của mình
- Không thể tự hạ cấp quyền của mình

---

## 👨‍💼 2. ADMIN (Quản trị viên)

### Quyền hạn

#### 2.1. Quản lý Dữ liệu Cơ bản

- ✅ **Quản lý Đơn vị**

  - Tạo, sửa, xóa Cơ quan Đơn vị
  - Tạo, sửa, xóa Đơn vị Trực thuộc
  - Xem danh sách tất cả đơn vị

- ✅ **Quản lý Chức vụ**

  - Tạo, sửa, xóa chức vụ
  - Gán nhóm cống hiến cho chức vụ
  - Xem danh sách tất cả chức vụ

- ✅ **Quản lý Nhóm Cống hiến**
  - Tạo, sửa, xóa nhóm cống hiến (Nhóm 5, 6, 7...)
  - Xem danh sách tất cả nhóm cống hiến

#### 2.2. Quản lý Quân nhân

- ✅ **Quản lý toàn bộ quân nhân**

  - Tạo, sửa, xóa thông tin quân nhân
  - Xem chi tiết quân nhân
  - Quản lý lịch sử chức vụ của quân nhân
  - Quản lý thành tích khoa học của quân nhân
  - Quản lý khen thưởng hằng năm của quân nhân

- ✅ **Import/Export dữ liệu Excel**
  - Import danh sách quân nhân từ Excel
  - Export danh sách quân nhân ra Excel
  - Import/Export các loại dữ liệu khác

#### 2.3. Quản lý Khen thưởng

- ✅ **Xem và quản lý tất cả đề xuất khen thưởng**

  - Xem danh sách tất cả đề xuất (của tất cả đơn vị)
  - Phê duyệt/Từ chối đề xuất
  - Xem chi tiết đề xuất
  - Xuất quyết định khen thưởng

- ✅ **Quản lý Khen thưởng Đã Phê duyệt**
  - Xem danh sách tất cả khen thưởng đã phê duyệt
  - Quản lý quyết định khen thưởng
  - Import/Export khen thưởng

#### 2.4. Tính toán và Báo cáo

- ✅ **Tính toán lại Hồ sơ**

  - Tính toán lại hồ sơ niên hạn cho quân nhân
  - Tính toán lại hồ sơ hằng năm cho quân nhân
  - Xem gợi ý khen thưởng

- ✅ **Xem Báo cáo và Thống kê**
  - Xem thống kê tổng quan hệ thống
  - Xem báo cáo khen thưởng theo đơn vị
  - Xem báo cáo khen thưởng theo loại

#### 2.5. Quản lý Hệ thống

- ✅ **Xem Nhật ký Hệ thống**
  - Xem nhật ký hoạt động của tất cả người dùng
  - Lọc nhật ký theo người dùng, thời gian, hành động

### Menu và Chức năng

- **Dashboard**: Xem tổng quan hệ thống
- **Danh mục**: Quản lý đơn vị, chức vụ, nhóm cống hiến
- **Quân nhân**: Quản lý quân nhân, import/export
- **Đề xuất**: Xem và phê duyệt đề xuất khen thưởng
- **Khen thưởng**: Xem danh sách khen thưởng đã phê duyệt
- **Hồ sơ Gợi ý**: Xem và tính toán lại hồ sơ gợi ý
- **Quyết định**: Quản lý quyết định khen thưởng
- **Nhật ký**: Xem nhật ký hệ thống

---

## 👔 3. MANAGER (Quản lý đơn vị)

### Quyền hạn

#### 3.1. Quản lý Quân nhân trong Đơn vị

- ✅ **Quản lý quân nhân thuộc đơn vị được phân công**

  - Xem danh sách quân nhân trong đơn vị
  - Sửa thông tin quân nhân trong đơn vị
  - Xem chi tiết quân nhân
  - Quản lý lịch sử chức vụ của quân nhân trong đơn vị
  - Quản lý thành tích khoa học của quân nhân trong đơn vị
  - Quản lý khen thưởng hằng năm của quân nhân trong đơn vị

- ❌ **Không thể** tạo quân nhân mới (chỉ ADMIN mới có quyền)
- ❌ **Không thể** xóa quân nhân

#### 3.2. Tạo và Quản lý Đề xuất Khen thưởng

- ✅ **Tạo đề xuất khen thưởng cho đơn vị**

  - Tạo đề xuất khen thưởng cá nhân hằng năm
  - Tạo đề xuất khen thưởng đơn vị hằng năm
  - Tạo đề xuất khen thưởng niên hạn
  - Tạo đề xuất khen thưởng cống hiến
  - Tạo đề xuất huy chương Quân kỳ Quyết thắng
  - Tạo đề xuất kỷ niệm chương VSNXD QĐNDVN
  - Tạo đề xuất khen thưởng đột xuất
  - Tạo đề xuất khen thưởng thành tích khoa học

- ✅ **Quản lý đề xuất đã tạo**
  - Xem danh sách đề xuất đã tạo
  - Xem chi tiết đề xuất
  - Chỉnh sửa đề xuất (khi chưa được phê duyệt)
  - Hủy đề xuất (khi chưa được phê duyệt)
  - Gửi đề xuất để phê duyệt

#### 3.3. Xem Hồ sơ Gợi ý

- ✅ **Xem hồ sơ gợi ý khen thưởng**
  - Xem hồ sơ gợi ý niên hạn của quân nhân trong đơn vị
  - Xem hồ sơ gợi ý hằng năm của quân nhân trong đơn vị
  - Xem thông tin cống hiến của quân nhân

#### 3.4. Xem Khen thưởng

- ✅ **Xem khen thưởng đã phê duyệt**
  - Xem danh sách khen thưởng của quân nhân trong đơn vị
  - Xem chi tiết khen thưởng
  - Xem quyết định khen thưởng

#### 3.5. Quản lý Cá nhân

- ✅ **Quản lý thông tin cá nhân**

  - Xem thông tin cá nhân
  - Sửa thông tin cá nhân
  - Đổi mật khẩu

- ✅ **Xem nhật ký hoạt động cá nhân**
  - Xem nhật ký các hành động của mình

### Menu và Chức năng

- **Dashboard**: Xem tổng quan đơn vị
- **Quân nhân**: Quản lý quân nhân trong đơn vị
- **Đề xuất**: Tạo và quản lý đề xuất khen thưởng
- **Khen thưởng**: Xem khen thưởng đã phê duyệt
- **Hồ sơ Gợi ý**: Xem hồ sơ gợi ý khen thưởng
- **Cá nhân**: Quản lý thông tin cá nhân
- **Nhật ký**: Xem nhật ký hoạt động

### Giới hạn

- ❌ Không thể quản lý quân nhân ngoài đơn vị được phân công
- ❌ Không thể phê duyệt đề xuất (chỉ ADMIN mới có quyền)
- ❌ Không thể quản lý đơn vị, chức vụ, nhóm cống hiến
- ❌ Không thể import/export dữ liệu Excel

---

## 👤 4. USER (Người dùng thông thường)

### Quyền hạn

#### 4.1. Xem Thông tin Cá nhân

- ✅ **Xem thông tin cá nhân**

  - Xem thông tin quân nhân của mình
  - Xem lịch sử chức vụ của mình
  - Xem thành tích khoa học của mình
  - Xem khen thưởng hằng năm của mình

- ✅ **Sửa thông tin cá nhân**
  - Sửa một số thông tin cá nhân (theo quy định)
  - Đổi mật khẩu

#### 4.2. Xem Khen thưởng

- ✅ **Xem lịch sử khen thưởng**
  - Xem tất cả khen thưởng đã nhận
  - Xem chi tiết khen thưởng
  - Xem quyết định khen thưởng

#### 4.3. Xem Hồ sơ Gợi ý

- ✅ **Xem hồ sơ gợi ý khen thưởng**
  - Xem hồ sơ gợi ý niên hạn của mình
  - Xem hồ sơ gợi ý hằng năm của mình
  - Xem thông tin cống hiến của mình

### Menu và Chức năng

- **Dashboard**: Xem tổng quan cá nhân
- **Hồ sơ**: Xem và sửa thông tin cá nhân
- **Khen thưởng**: Xem lịch sử khen thưởng
- **Hồ sơ Gợi ý**: Xem hồ sơ gợi ý khen thưởng
- **Cài đặt**: Đổi mật khẩu, cài đặt tài khoản

### Giới hạn

- ❌ Không thể tạo đề xuất khen thưởng
- ❌ Không thể quản lý quân nhân khác
- ❌ Không thể xem thông tin quân nhân khác
- ❌ Không thể xem thông tin đơn vị, chức vụ (trừ thông tin của mình)

---

## 🔒 Bảng So sánh Quyền hạn

| Chức năng                  | SUPER_ADMIN | ADMIN     | MANAGER    | USER        |
| -------------------------- | ----------- | --------- | ---------- | ----------- |
| **Quản lý Tài khoản**      |
| Tạo/Sửa/Xóa tài khoản      | ✅ Tất cả   | ❌        | ❌         | ❌          |
| Gán quyền                  | ✅          | ❌        | ❌         | ❌          |
| **Quản lý Dữ liệu Cơ bản** |
| Quản lý Đơn vị             | ✅          | ✅        | ❌         | ❌          |
| Quản lý Chức vụ            | ✅          | ✅        | ❌         | ❌          |
| Quản lý Nhóm Cống hiến     | ✅          | ✅        | ❌         | ❌          |
| **Quản lý Quân nhân**      |
| Tạo quân nhân              | ✅          | ✅        | ❌         | ❌          |
| Sửa quân nhân              | ✅          | ✅ Tất cả | ✅ Đơn vị  | ❌          |
| Xóa quân nhân              | ✅          | ✅        | ❌         | ❌          |
| Xem quân nhân              | ✅          | ✅ Tất cả | ✅ Đơn vị  | ✅ Bản thân |
| Import/Export Excel        | ✅          | ✅        | ❌         | ❌          |
| **Đề xuất Khen thưởng**    |
| Tạo đề xuất                | ✅          | ✅        | ✅         | ❌          |
| Xem đề xuất                | ✅          | ✅ Tất cả | ✅ Đơn vị  | ❌          |
| Phê duyệt/Từ chối          | ✅          | ✅        | ❌         | ❌          |
| **Khen thưởng**            |
| Xem khen thưởng            | ✅          | ✅ Tất cả | ✅ Đơn vị  | ✅ Bản thân |
| Quản lý quyết định         | ✅          | ✅        | ❌         | ❌          |
| **Hồ sơ Gợi ý**            |
| Xem hồ sơ gợi ý            | ✅          | ✅ Tất cả | ✅ Đơn vị  | ✅ Bản thân |
| Tính toán lại              | ✅          | ✅        | ❌         | ❌          |
| **Hệ thống**               |
| Xem nhật ký                | ✅          | ✅ Tất cả | ✅ Cá nhân | ❌          |

---

## 🛡️ Bảo mật và Xác thực

### Xác thực

- Tất cả người dùng phải đăng nhập để sử dụng hệ thống
- Sử dụng JWT (JSON Web Token) để xác thực
- Access token có thời hạn 15 phút
- Refresh token được sử dụng để làm mới access token

### Phân quyền

- Phân quyền được kiểm tra ở cả **Frontend** và **Backend**
- Backend middleware kiểm tra quyền trước khi xử lý request
- Frontend ẩn/hiện menu và chức năng dựa trên quyền của người dùng

### Kiểm tra Quyền

- **Backend**: Sử dụng middleware `requireSuperAdmin`, `requireAdmin`, `requireManager`
- **Frontend**: Sử dụng utility functions `isSuperAdmin()`, `isAdmin()`, `isManager()`

---

## 📝 Lưu ý

1. **Quyền kế thừa**: SUPER_ADMIN có tất cả quyền của ADMIN, ADMIN có tất cả quyền của MANAGER (trong phạm vi quản lý toàn hệ thống)

2. **Quyền theo Đơn vị**: MANAGER chỉ có thể quản lý quân nhân và đề xuất trong đơn vị được phân công

3. **Quyền Xem**: USER chỉ có thể xem thông tin của chính mình

4. **Quyền Sửa**: MANAGER có thể sửa thông tin quân nhân trong đơn vị, nhưng không thể tạo mới hoặc xóa

5. **Quyền Phê duyệt**: Chỉ ADMIN và SUPER_ADMIN mới có quyền phê duyệt đề xuất khen thưởng

---

## 🔄 Cập nhật

Tài liệu này được cập nhật theo sự phát triển của hệ thống.

**Phiên bản**: 1.0.0
**Ngày cập nhật**: 2024
