# 🎯 Giới thiệu Chức năng Hệ thống QLKT

## 📋 Tổng quan

Hệ thống QLKT (Quản lý Khen thưởng) là hệ thống quản lý khen thưởng cho Học viện Khoa học Quân sự, hỗ trợ quản lý toàn bộ quy trình từ đề xuất đến phê duyệt và quản lý khen thưởng.

---

## 🏠 1. Dashboard (Trang chủ)

### Mô tả

Dashboard cung cấp cái nhìn tổng quan về hệ thống, hiển thị các thống kê và biểu đồ quan trọng.

### Chức năng

- **Thống kê Tổng quan**

  - Tổng số quân nhân
  - Tổng số đề xuất (theo trạng thái)
  - Tổng số khen thưởng đã phê duyệt
  - Tổng số đơn vị

- **Biểu đồ Thống kê**

  - Biểu đồ khen thưởng theo loại
  - Biểu đồ đề xuất theo trạng thái
  - Biểu đồ khen thưởng theo đơn vị

- **Thông báo Mới**
  - Hiển thị các thông báo mới nhất
  - Đề xuất cần phê duyệt (cho ADMIN)

### Phân quyền

- **SUPER_ADMIN/ADMIN**: Xem thống kê toàn hệ thống
- **MANAGER**: Xem thống kê đơn vị
- **USER**: Xem thống kê cá nhân

---

## 👥 2. Quản lý Quân nhân

### Mô tả

Quản lý thông tin quân nhân, lịch sử chức vụ, thành tích khoa học, và khen thưởng hằng năm.

### Chức năng

#### 2.1. Danh sách Quân nhân

- **Xem danh sách quân nhân**

  - Tìm kiếm theo tên, CCCD
  - Lọc theo đơn vị, chức vụ
  - Phân trang

- **Xem chi tiết quân nhân**
  - Thông tin cá nhân
  - Lịch sử chức vụ
  - Thành tích khoa học
  - Khen thưởng hằng năm
  - Khen thưởng đã nhận

#### 2.2. Quản lý Lịch sử Chức vụ

- **Thêm lịch sử chức vụ**

  - Chọn chức vụ
  - Ngày bắt đầu, ngày kết thúc
  - Hệ số chức vụ (tự động từ chức vụ)
  - Số tháng (tự động tính)

- **Sửa/Xóa lịch sử chức vụ**

  - Chỉnh sửa thông tin
  - Xóa lịch sử (nếu chưa được sử dụng)

- **Xem lịch sử chức vụ**
  - Hiển thị theo thời gian
  - Tính tổng thời gian theo nhóm hệ số (0.7, 0.8, 0.9-1.0)

#### 2.3. Quản lý Thành tích Khoa học

- **Thêm thành tích khoa học**

  - Loại: Đề tài khoa học (NCKH) hoặc Sáng kiến khoa học (SKKH)
  - Tên đề tài/sáng kiến
  - Năm hoàn thành
  - Vai trò: Chủ nhiệm, Thành viên
  - Cấp: Cấp Bộ, Cấp Học viện, Cấp Đơn vị

- **Sửa/Xóa thành tích khoa học**

#### 2.4. Quản lý Khen thưởng Hằng năm

- **Thêm khen thưởng hằng năm**

  - Danh hiệu: CSTĐCS, CSTT, BKBQP, BKTC
  - Năm
  - Số quyết định
  - File quyết định (PDF)

- **Sửa/Xóa khen thưởng hằng năm**

#### 2.5. Import/Export Excel

- **Import quân nhân từ Excel**

  - Upload file Excel
  - Validate dữ liệu
  - Import vào hệ thống

- **Export quân nhân ra Excel**
  - Xuất danh sách quân nhân
  - Bao gồm thông tin chi tiết

### Phân quyền

- **ADMIN**: Quản lý tất cả quân nhân, import/export
- **MANAGER**: Quản lý quân nhân trong đơn vị (không thể tạo mới)
- **USER**: Chỉ xem thông tin của mình

---

## 📝 3. Đề xuất Khen thưởng

### Mô tả

Tạo và quản lý đề xuất khen thưởng cho các loại khen thưởng khác nhau.

### Các loại Đề xuất

#### 3.1. Cá nhân Hằng năm

- **Mô tả**: Đề xuất khen thưởng cá nhân hằng năm (CSTĐCS, CSTT, BKBQP, BKTC)
- **Quy trình**:
  1. Chọn quân nhân
  2. Chọn danh hiệu và năm
  3. Gửi đề xuất

#### 3.2. Đơn vị Hằng năm

- **Mô tả**: Đề xuất khen thưởng đơn vị hằng năm (Đơn vị Quyết thắng, Đơn vị Tiên tiến)
- **Quy trình**:
  1. Chọn đơn vị
  2. Chọn danh hiệu và năm
  3. Gửi đề xuất

#### 3.3. Niên hạn

- **Mô tả**: Đề xuất Huân chương Chiến sĩ Vẻ vang (HCCSVV) - Hạng Ba, Nhì, Nhất
- **Điều kiện**:
  - Nữ: >= 20 năm phục vụ
  - Nam: >= 25 năm phục vụ
- **Quy trình**:
  1. Chọn quân nhân (tự động lọc theo điều kiện)
  2. Chọn hạng (Ba, Nhì, Nhất)
  3. Gửi đề xuất

#### 3.4. Cống hiến

- **Mô tả**: Đề xuất Huân chương Bảo vệ Tổ quốc (HCBVTQ) - Hạng Ba, Nhì, Nhất
- **Điều kiện**:
  - **Nam**: >= 10 năm (120 tháng) giữ chức vụ ở các nhóm hệ số
  - **Nữ**: >= 6 năm 8 tháng (80 tháng) giữ chức vụ ở các nhóm hệ số (giảm 1/3 thời gian)
  - Hạng Nhất: >= yêu cầu từ nhóm 0.9-1.0
  - Hạng Nhì: >= yêu cầu từ nhóm 0.8 + 0.9-1.0
  - Hạng Ba: >= yêu cầu từ nhóm 0.7 + 0.8 + 0.9-1.0
- **Quy trình**:
  1. Chọn quân nhân
  2. Xem lịch sử chức vụ và thời gian theo nhóm
  3. Chọn hạng (Ba, Nhì, Nhất)
  4. Gửi đề xuất

#### 3.5. Huy chương Quân kỳ Quyết thắng

- **Mô tả**: Đề xuất Huy chương Quân kỳ Quyết thắng (HC_QKQT)
- **Quy trình**:
  1. Chọn quân nhân
  2. Chọn năm
  3. Gửi đề xuất

#### 3.6. Kỷ niệm chương VSNXD QĐNDVN

- **Mô tả**: Đề xuất Kỷ niệm chương Vì sự nghiệp xây dựng QĐNDVN (KNC_VSNXD_QDNDVN)
- **Điều kiện**:
  - Nữ: >= 20 năm phục vụ
  - Nam: >= 25 năm phục vụ
- **Quy trình**:
  1. Chọn quân nhân (tự động lọc theo điều kiện)
  2. Chọn năm
  3. Gửi đề xuất

#### 3.7. Đột xuất

- **Mô tả**: Đề xuất khen thưởng đột xuất
- **Quy trình**:
  1. Chọn quân nhân
  2. Nhập lý do khen thưởng
  3. Chọn năm
  4. Gửi đề xuất

#### 3.8. Thành tích Khoa học

- **Mô tả**: Đề xuất khen thưởng thành tích khoa học (NCKH, SKKH)
- **Quy trình**:
  1. Chọn quân nhân
  2. Chọn thành tích khoa học
  3. Chọn năm
  4. Gửi đề xuất

### Quản lý Đề xuất

- **Xem danh sách đề xuất**

  - Lọc theo loại, trạng thái, năm
  - Tìm kiếm theo tên quân nhân

- **Xem chi tiết đề xuất**

  - Thông tin đề xuất
  - Danh sách quân nhân/đơn vị
  - Lịch sử phê duyệt

- **Chỉnh sửa đề xuất**

  - Chỉnh sửa khi chưa được phê duyệt
  - Thêm/Xóa quân nhân/đơn vị

- **Gửi đề xuất**

  - Gửi để ADMIN phê duyệt

- **Phê duyệt/Từ chối** (chỉ ADMIN)
  - Phê duyệt đề xuất
  - Từ chối đề xuất (kèm lý do)
  - Xuất quyết định khen thưởng

### Phân quyền

- **MANAGER**: Tạo và quản lý đề xuất của đơn vị
- **ADMIN**: Xem tất cả đề xuất, phê duyệt/từ chối

---

## 🏆 4. Khen thưởng

### Mô tả

Quản lý khen thưởng đã được phê duyệt.

### Chức năng

- **Xem danh sách khen thưởng**

  - Lọc theo loại, năm, đơn vị
  - Tìm kiếm theo tên quân nhân

- **Xem chi tiết khen thưởng**

  - Thông tin khen thưởng
  - Quyết định khen thưởng (PDF)
  - Danh sách quân nhân/đơn vị

- **Quản lý Quyết định** (chỉ ADMIN)

  - Upload quyết định
  - Xem/Tải quyết định
  - Xóa quyết định

- **Import/Export** (chỉ ADMIN)
  - Import khen thưởng từ Excel
  - Export khen thưởng ra Excel

### Phân quyền

- **ADMIN**: Quản lý tất cả khen thưởng
- **MANAGER**: Xem khen thưởng của đơn vị
- **USER**: Xem khen thưởng của mình

---

## 📊 5. Hồ sơ Gợi ý

### Mô tả

Xem và tính toán hồ sơ gợi ý khen thưởng cho quân nhân.

### Chức năng

#### 5.1. Hồ sơ Niên hạn

- **Xem hồ sơ niên hạn**

  - Thông tin quân nhân
  - Ngày nhập ngũ, ngày xuất ngũ
  - Số năm phục vụ
  - Gợi ý hạng HCCSVV (Ba, Nhì, Nhất)

- **Tính toán lại** (chỉ ADMIN)
  - Tính toán lại hồ sơ niên hạn
  - Cập nhật gợi ý

#### 5.2. Hồ sơ Hằng năm

- **Xem hồ sơ hằng năm**

  - Thông tin quân nhân
  - Khen thưởng hằng năm đã nhận
  - Gợi ý khen thưởng hằng năm

- **Tính toán lại** (chỉ ADMIN)
  - Tính toán lại hồ sơ hằng năm
  - Cập nhật gợi ý

#### 5.3. Thông tin Cống hiến

- **Xem thông tin cống hiến**
  - Tổng thời gian giữ chức vụ theo nhóm hệ số
  - Tháng cống hiến tích lũy
  - Gợi ý hạng HCBVTQ (Ba, Nhì, Nhất)

### Phân quyền

- **ADMIN**: Xem tất cả hồ sơ, tính toán lại
- **MANAGER**: Xem hồ sơ của quân nhân trong đơn vị
- **USER**: Xem hồ sơ của mình

---

## 🏢 6. Quản lý Đơn vị

### Mô tả

Quản lý cơ quan đơn vị và đơn vị trực thuộc.

### Chức năng

- **Quản lý Cơ quan Đơn vị**

  - Tạo, sửa, xóa cơ quan đơn vị
  - Xem danh sách cơ quan đơn vị

- **Quản lý Đơn vị Trực thuộc**

  - Tạo, sửa, xóa đơn vị trực thuộc
  - Gán đơn vị trực thuộc vào cơ quan đơn vị
  - Xem danh sách đơn vị trực thuộc

- **Xem chi tiết đơn vị**
  - Thông tin đơn vị
  - Danh sách quân nhân trong đơn vị
  - Khen thưởng của đơn vị

### Phân quyền

- **ADMIN**: Quản lý tất cả đơn vị
- **MANAGER/USER**: Chỉ xem thông tin đơn vị của mình

---

## 💼 7. Quản lý Chức vụ

### Mô tả

Quản lý chức vụ và gán nhóm cống hiến cho chức vụ.

### Chức năng

- **Tạo, sửa, xóa chức vụ**

  - Tên chức vụ
  - Hệ số chức vụ
  - Gán nhóm cống hiến
  - Gán vào đơn vị

- **Xem danh sách chức vụ**
  - Lọc theo đơn vị
  - Tìm kiếm theo tên

### Phân quyền

- **ADMIN**: Quản lý tất cả chức vụ
- **MANAGER/USER**: Chỉ xem thông tin chức vụ

---

## 🎖️ 8. Quản lý Nhóm Cống hiến

### Mô tả

Quản lý các nhóm cống hiến (Nhóm 5, 6, 7...) để tính toán khen thưởng cống hiến.

### Chức năng

- **Tạo, sửa, xóa nhóm cống hiến**

  - Tên nhóm (Nhóm 5, Nhóm 6, Nhóm 7...)

- **Xem danh sách nhóm cống hiến**

### Phân quyền

- **ADMIN**: Quản lý tất cả nhóm cống hiến
- **MANAGER/USER**: Chỉ xem thông tin

---

## 📄 9. Quản lý Quyết định

### Mô tả

Quản lý quyết định khen thưởng (file PDF).

### Chức năng

- **Upload quyết định**

  - Upload file PDF
  - Liên kết với khen thưởng

- **Xem/Tải quyết định**

  - Xem quyết định trong trình duyệt
  - Tải quyết định về máy

- **Xóa quyết định**

### Phân quyền

- **ADMIN**: Quản lý tất cả quyết định
- **MANAGER/USER**: Xem quyết định liên quan

---

## 👤 10. Quản lý Tài khoản

### Mô tả

Quản lý tài khoản người dùng trong hệ thống.

### Chức năng

- **Tạo tài khoản**

  - Username, password
  - Gán quyền (role)
  - Liên kết với quân nhân

- **Sửa tài khoản**

  - Đổi mật khẩu
  - Thay đổi quyền
  - Cập nhật thông tin

- **Xóa tài khoản**

- **Xem danh sách tài khoản**
  - Lọc theo quyền
  - Tìm kiếm theo username

### Phân quyền

- **SUPER_ADMIN**: Quản lý tất cả tài khoản
- **ADMIN**: Không có quyền quản lý tài khoản

---

## 📝 11. Nhật ký Hệ thống

### Mô tả

Xem nhật ký hoạt động của hệ thống.

### Chức năng

- **Xem nhật ký**

  - Lọc theo người dùng, thời gian, hành động
  - Tìm kiếm
  - Phân trang

- **Chi tiết nhật ký**
  - Người thực hiện
  - Thời gian
  - Hành động
  - Dữ liệu thay đổi

### Phân quyền

- **SUPER_ADMIN/ADMIN**: Xem tất cả nhật ký
- **MANAGER**: Xem nhật ký của mình
- **USER**: Không có quyền xem nhật ký

---

## ⚙️ 12. Cài đặt

### Mô tả

Cài đặt tài khoản cá nhân.

### Chức năng

- **Đổi mật khẩu**

  - Nhập mật khẩu cũ
  - Nhập mật khẩu mới
  - Xác nhận mật khẩu mới

- **Cài đặt khác**
  - Cài đặt thông báo
  - Cài đặt giao diện

### Phân quyền

- **Tất cả người dùng**: Đổi mật khẩu của mình

---

## 🔄 Quy trình Tổng thể

### Quy trình Đề xuất và Phê duyệt

1. **MANAGER tạo đề xuất**

   - Chọn loại khen thưởng
   - Chọn quân nhân/đơn vị
   - Điền thông tin
   - Gửi đề xuất

2. **ADMIN xem và phê duyệt**

   - Xem danh sách đề xuất
   - Xem chi tiết đề xuất
   - Phê duyệt hoặc từ chối
   - Nếu phê duyệt: Upload quyết định

3. **Khen thưởng được lưu**
   - Lưu vào bảng khen thưởng
   - Liên kết với quyết định
   - Hiển thị trong danh sách khen thưởng

---

## 📱 Tính năng Bổ sung

### Tìm kiếm và Lọc

- Tìm kiếm theo tên, CCCD
- Lọc theo đơn vị, chức vụ, năm
- Phân trang

### Xuất Báo cáo

- Xuất danh sách quân nhân ra Excel
- Xuất danh sách khen thưởng ra Excel
- Xuất báo cáo thống kê

### Thông báo

- Thông báo khi có đề xuất mới (cho ADMIN)
- Thông báo khi đề xuất được phê duyệt/từ chối
- Thông báo hệ thống

### Responsive Design

- Giao diện tương thích với mọi thiết bị
- Mobile-friendly

---

## 🔄 Cập nhật

Tài liệu này được cập nhật theo sự phát triển của hệ thống.

**Phiên bản**: 1.0.0
**Ngày cập nhật**: 2024
