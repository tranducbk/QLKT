# 🔬 Thành tích Khoa học

## 📋 Tổng quan

Thành tích Khoa học là các đề tài khoa học (NCKH) và sáng kiến khoa học (SKKH) được quân nhân thực hiện và hoàn thành. Đây là một trong những điều kiện quan trọng để đạt các danh hiệu cao như CSTDTQ.

## 🎯 Các Loại Thành tích

### 1. Đề tài Khoa học (NCKH)
- **Mã**: `NCKH`
- **Mô tả**: Các đề tài nghiên cứu khoa học có quy mô và tính chất nghiên cứu
- **Ví dụ**: Nghiên cứu về AI quân sự, Nghiên cứu về chiến lược quốc phòng

### 2. Sáng kiến Khoa học (SKKH)
- **Mã**: `SKKH`
- **Mô tả**: Các sáng kiến, cải tiến kỹ thuật trong công tác
- **Ví dụ**: Sáng kiến cải tiến quy trình đào tạo, Sáng kiến nâng cao hiệu quả công tác

## 📊 Cấu trúc Dữ liệu

### Database Schema

**Bảng**: `thanh_tich_khoa_hoc`

| Tên Cột | Kiểu | Mô tả |
|---------|------|-------|
| `id` | String (CUID) | Khóa chính |
| `quan_nhan_id` | String | ID quân nhân |
| `nam` | Integer | Năm hoàn thành/được duyệt |
| `loai` | String | NCKH hoặc SKKH |
| `mo_ta` | String | Tên đề tài, sáng kiến |
| `status` | String | APPROVED hoặc PENDING |
| `so_quyet_dinh` | String? | Số quyết định khen thưởng (nếu có) |
| `file_quyet_dinh` | String? | File PDF quyết định (nếu có) |

### JSON Structure trong Đề xuất

```json
{
  "personnel_id": "abc123",
  "ho_ten": "Nguyễn Văn A",
  "nam": 2024,
  "loai": "NCKH",
  "mo_ta": "Nghiên cứu ứng dụng AI trong quân sự",
  "status": "APPROVED",
  "cap_bac": "Thiếu tá",
  "chuc_vu": "Hệ trưởng",
  "co_quan_don_vi": {
    "id": "xyz",
    "ten_co_quan_don_vi": "Học viện Khoa học Quân sự",
    "ma_co_quan_don_vi": "HVKHQS"
  },
  "don_vi_truc_thuoc": {
    "id": "def",
    "ten_don_vi": "Hệ 1",
    "ma_don_vi": "K1"
  }
}
```

## 🔄 Quy trình Đề xuất

### Bước 1: Manager tạo đề xuất
1. Chọn loại đề xuất: **Thành tích Khoa học**
2. Chọn quân nhân có thành tích
3. Nhập thông tin:
   - **Loại**: NCKH hoặc SKKH
   - **Mô tả**: Tên đề tài/sáng kiến
   - **Năm**: Năm hoàn thành/được duyệt
   - **Trạng thái**: APPROVED hoặc PENDING
4. Upload file đính kèm (nếu có)
5. Gửi đề xuất

### Bước 2: Admin xem và chỉnh sửa
1. Xem danh sách đề xuất `PENDING`
2. Xem chi tiết từng đề xuất
3. Chỉnh sửa thông tin (nếu cần)
4. Thay đổi trạng thái: PENDING → APPROVED
5. Thêm số quyết định (nếu đã có)

### Bước 3: Admin phê duyệt
1. Xem xét thành tích khoa học
2. Phê duyệt đề xuất → Trạng thái `APPROVED`
3. Hệ thống tự động lưu vào bảng `ThanhTichKhoaHoc`
4. Cập nhật `HoSoHangNam` với tổng số NCKH

## 📡 API Endpoints

### 1. Lấy danh sách Thành tích Khoa học

**Endpoint**: `GET /api/scientific-achievements`

**Query Parameters**:
- `personnel_id` (required): ID quân nhân

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "quan_nhan_id": "xyz",
      "nam": 2024,
      "loai": "NCKH",
      "mo_ta": "Nghiên cứu ứng dụng AI trong quân sự",
      "status": "APPROVED",
      "so_quyet_dinh": "123/QĐ-HVKHQS"
    }
  ]
}
```

### 2. Thêm Thành tích Khoa học

**Endpoint**: `POST /api/scientific-achievements`

**Request Body**:
```json
{
  "personnel_id": "xyz",
  "nam": 2024,
  "loai": "NCKH",
  "mo_ta": "Nghiên cứu ứng dụng AI trong quân sự",
  "status": "PENDING"
}
```

### 3. Cập nhật Thành tích

**Endpoint**: `PUT /api/scientific-achievements/{id}`

**Request Body**:
```json
{
  "nam": 2024,
  "loai": "NCKH",
  "mo_ta": "Nghiên cứu ứng dụng AI trong quân sự (Cập nhật)",
  "status": "APPROVED"
}
```

### 4. Xóa Thành tích

**Endpoint**: `DELETE /api/scientific-achievements/{id}`

## 💡 Ví dụ Cụ thể

### Ví dụ 1: Đề tài Khoa học (NCKH)

**Quân nhân**: Nguyễn Văn A
**Năm**: 2024
**Loại**: NCKH
**Mô tả**: Nghiên cứu ứng dụng Trí tuệ nhân tạo trong chiến lược quốc phòng
**Trạng thái**: APPROVED
**Kết quả**: Lưu vào `ThanhTichKhoaHoc`, được tính vào điều kiện CSTDTQ

### Ví dụ 2: Sáng kiến Khoa học (SKKH)

**Quân nhân**: Trần Văn B
**Năm**: 2024
**Loại**: SKKH
**Mô tả**: Sáng kiến cải tiến quy trình đào tạo học viên
**Trạng thái**: PENDING
**Kết quả**: Lưu vào `ThanhTichKhoaHoc`, chưa được tính vào điều kiện (chờ duyệt)

### Ví dụ 3: Sử dụng trong CSTDTQ

**Quân nhân**: Lê Văn C
**Lịch sử**:
- CSTDCS: 2022, 2023, 2024 (3 năm liên tục)
- NCKH:
  - 2022: "Nghiên cứu A" (APPROVED)
  - 2023: "Nghiên cứu B" (APPROVED)
  - 2024: "Nghiên cứu C" (APPROVED)
- BKBQP: 2023

**Kết quả**: ✅ Đủ điều kiện CSTDTQ năm 2024

## ⚠️ Lưu ý Quan trọng

1. **Trạng thái APPROVED**: Chỉ thành tích có `status = APPROVED` mới được tính vào điều kiện
2. **Mỗi năm có thể nhiều thành tích**: Một quân nhân có thể có nhiều NCKH/SKKH trong cùng 1 năm
3. **Điều kiện CSTDTQ**: Cần mỗi năm trong cụm 3 năm đều có ít nhất 1 NCKH/SKKH (APPROVED)
4. **Phạm vi kiểm tra**: NCKH chỉ được kiểm tra trong phạm vi cụm 3 năm riêng biệt
5. **Dữ liệu lưu**: Lưu cả thông tin cấp bậc/chức vụ vào JSON khi tạo đề xuất

## 📖 Use Cases

### UC-01: Manager đề xuất thành tích khoa học

**Actor**: Manager

**Mô tả**: Manager tạo đề xuất thành tích khoa học (NCKH hoặc SKKH) cho quân nhân

**Preconditions**:

- Manager đã đăng nhập hệ thống
- Manager có quyền quản lý đơn vị
- Quân nhân thuộc đơn vị của Manager

**Main Flow**:

1. Manager chọn loại đề xuất: "Thành tích Khoa học"
2. Manager chọn quân nhân cần đề xuất
3. Manager nhập thông tin thành tích:
   - Loại: NCKH (Đề tài khoa học) hoặc SKKH (Sáng kiến khoa học)
   - Mô tả: Tên đề tài/sáng kiến
   - Năm: Năm thực hiện
   - Thông tin khác (nếu có)
4. Manager upload file đính kèm (tùy chọn)
5. Manager gửi đề xuất
6. Hệ thống tạo đề xuất với trạng thái `PENDING`
7. Hệ thống gửi thông báo cho Admin

**Postconditions**:

- Đề xuất được tạo với trạng thái `PENDING`
- Thông tin thành tích được lưu trong đề xuất
- Admin nhận được thông báo có đề xuất mới

**Exception Flow**:

- 3a. Manager không nhập loại hoặc mô tả → Hệ thống từ chối, yêu cầu nhập đầy đủ

---

### UC-02: Admin phê duyệt thành tích khoa học

**Actor**: Admin

**Mô tả**: Admin xem xét và phê duyệt đề xuất thành tích khoa học

**Preconditions**:

- Admin đã đăng nhập hệ thống
- Có đề xuất thành tích khoa học với trạng thái `PENDING`

**Main Flow**:

1. Admin xem danh sách đề xuất `PENDING`
2. Admin chọn đề xuất thành tích khoa học
3. Admin xem chi tiết đề xuất:
   - Thông tin quân nhân
   - Loại thành tích (NCKH/SKKH)
   - Mô tả thành tích
   - Năm thực hiện
   - File đính kèm (nếu có)
4. Admin xem xét và đánh giá:
   - Đọc mô tả thành tích
   - Xem file đính kèm (nếu có)
   - Kiểm tra thông tin quân nhân
5. Admin có thể chỉnh sửa:
   - Mô tả (nếu cần)
   - Năm (nếu cần)
6. Admin phê duyệt đề xuất
7. Hệ thống cập nhật:
   - Trạng thái đề xuất: `APPROVED`
   - Bảng `ThanhTichKhoaHoc`: Thêm/cập nhật bản ghi với `status = APPROVED`
   - Bảng `HoSoHangNam`: Cập nhật `tong_nckh` (tổng số NCKH đã duyệt)
8. Hệ thống gửi thông báo cho Manager

**Postconditions**:

- Đề xuất có trạng thái `APPROVED`
- Dữ liệu được cập nhật vào database
- `tong_nckh` trong `HoSoHangNam` được cập nhật
- Manager nhận được thông báo phê duyệt

**Alternative Flow**:

- 5a. Admin từ chối đề xuất → Trạng thái `REJECTED`, gửi thông báo cho Manager

---

### UC-03: Sử dụng NCKH cho điều kiện CSTDTQ

**Actor**: Hệ thống (tự động)

**Mô tả**: Hệ thống kiểm tra NCKH khi phê duyệt đề xuất CSTDTQ

**Preconditions**:

- Có đề xuất CSTDTQ với trạng thái `PENDING`
- Quân nhân có 3 năm CSTDCS liên tục

**Main Flow**:

1. Admin phê duyệt đề xuất CSTDTQ
2. Hệ thống tự động kiểm tra:
   - Lấy cụm 3 năm CSTDCS liên tục
   - Với mỗi năm trong cụm, kiểm tra có NCKH/SKKH (status = APPROVED)
3. Nếu mỗi năm đều có NCKH:
   - Tiếp tục kiểm tra BKBQP
   - Nếu đủ điều kiện → Phê duyệt CSTDTQ
4. Nếu thiếu NCKH ở bất kỳ năm nào:
   - Từ chối đề xuất
   - Ghi chú lý do: Thiếu NCKH ở năm X

**Postconditions**:

- Đề xuất CSTDTQ được phê duyệt hoặc từ chối
- Nếu phê duyệt: `nhan_cstdtq = true` được cập nhật

---

## 🔧 Đặc tả Kỹ thuật

### Validation Rules

#### 1. Validation khi tạo đề xuất (Frontend)

**Rule V-01**: Kiểm tra loại đề xuất hợp lệ

- **Input**: `proposalType`
- **Validation**: Phải là `'NCKH'`
- **Error**: "Loại đề xuất không hợp lệ"

**Rule V-02**: Kiểm tra đã chọn quân nhân

- **Input**: `selectedPersonnelIds`
- **Validation**: Phải có ít nhất 1 quân nhân
- **Error**: "Vui lòng chọn ít nhất 1 quân nhân"

**Rule V-03**: Kiểm tra đã nhập loại thành tích

- **Input**: `loai`
- **Validation**: Phải là `'NCKH'` hoặc `'SKKH'`
- **Error**: "Vui lòng chọn loại thành tích (NCKH hoặc SKKH)"

**Rule V-04**: Kiểm tra đã nhập mô tả

- **Input**: `mo_ta`
- **Validation**: Phải có mô tả (không được để trống)
- **Error**: "Vui lòng nhập mô tả thành tích khoa học"

**Rule V-05**: Kiểm tra năm

- **Input**: `nam`
- **Validation**:
  - Phải là số nguyên dương
  - Phải <= năm hiện tại
  - Phải >= 2000
- **Error**: "Năm không hợp lệ"

#### 2. Validation khi phê duyệt (Backend)

**Rule V-06**: Kiểm tra trùng lặp (tùy chọn)

- **Input**: `personnel_id`, `nam`, `loai`, `mo_ta`
- **Validation**: Có thể cho phép nhiều thành tích cùng năm nếu mô tả khác nhau
- **Logic**: Không có ràng buộc UNIQUE nghiêm ngặt

**Rule V-07**: Cập nhật tổng số NCKH

- **Input**: `personnel_id`
- **Validation**: Sau khi phê duyệt, cập nhật `HoSoHangNam.tong_nckh`
- **Logic**: Đếm số lượng NCKH/SKKH có `status = APPROVED`

### Business Rules

**Rule B-01**: Chỉ APPROVED mới được tính

- **Mô tả**: Chỉ thành tích có `status = APPROVED` mới được tính vào điều kiện CSTDTQ
- **Logic**: Khi kiểm tra điều kiện, chỉ lấy các bản ghi với `status = 'APPROVED'`
- **Lưu ý**: Thành tích `PENDING` hoặc `REJECTED` không được tính

**Rule B-02**: Mỗi năm có thể nhiều thành tích

- **Mô tả**: Một quân nhân có thể có nhiều NCKH/SKKH trong cùng 1 năm
- **Logic**: Không có ràng buộc UNIQUE cho năm
- **Ví dụ**: Quân nhân có thể có 2 đề tài khoa học trong năm 2024

**Rule B-03**: Điều kiện CSTDTQ

- **Mô tả**: Cần mỗi năm trong cụm 3 năm CSTDCS đều có ít nhất 1 NCKH/SKKH (APPROVED)
- **Logic**:
  - Tìm cụm 3 năm CSTDCS liên tục
  - Với mỗi năm trong cụm, kiểm tra có ít nhất 1 NCKH/SKKH (APPROVED)
- **Ví dụ**: Cụm 2022-2023-2024, mỗi năm phải có ít nhất 1 NCKH đã duyệt

**Rule B-04**: Cập nhật tổng số NCKH

- **Mô tả**: Sau khi phê duyệt thành tích, cập nhật `HoSoHangNam.tong_nckh`
- **Logic**: Đếm tất cả NCKH/SKKH có `status = APPROVED` của quân nhân
- **Công thức**: `tong_nckh = COUNT(*) WHERE quan_nhan_id = X AND status = 'APPROVED'`

### Error Handling

**Error E-01**: Validation failed khi tạo đề xuất

- **HTTP Status**: 400 Bad Request
- **Response**:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "field": "mo_ta",
    "message": "Vui lòng nhập mô tả thành tích khoa học"
  }
}
```

**Error E-02**: Loại thành tích không hợp lệ

- **HTTP Status**: 400 Bad Request
- **Response**:

```json
{
  "success": false,
  "error": "Loại thành tích không hợp lệ",
  "details": {
    "loai": "INVALID",
    "allowed_types": ["NCKH", "SKKH"]
  }
}
```

**Error E-03**: Năm không hợp lệ

- **HTTP Status**: 400 Bad Request
- **Response**:

```json
{
  "success": false,
  "error": "Năm không hợp lệ",
  "details": {
    "nam": 2030,
    "current_year": 2024,
    "message": "Năm không được lớn hơn năm hiện tại"
  }
}
```

### Data Flow

**Flow F-01**: Tạo đề xuất thành tích khoa học

```
Manager → Frontend → API POST /api/proposals
  → ProposalService.submitProposal()
  → Validation (V-01 đến V-05)
  → Create Proposal (status: PENDING, type: NCKH)
  → Create Notification (Admin)
  → Response to Manager
```

**Flow F-02**: Phê duyệt thành tích khoa học

```
Admin → Frontend → API PUT /api/proposals/{id}/approve
  → ProposalService.approveProposal()
  → Validation (V-06, V-07)
  → Create/Update ThanhTichKhoaHoc (status: APPROVED)
  → Update HoSoHangNam.tong_nckh
  → Update Proposal (status: APPROVED)
  → Create Notification (Manager)
  → Response to Admin
```

**Flow F-03**: Kiểm tra NCKH cho CSTDTQ

```
Admin phê duyệt CSTDTQ
  → System checks 3-year CSTDCS sequence
  → For each year in sequence:
    → Check ThanhTichKhoaHoc (status: APPROVED)
    → Verify at least 1 NCKH/SKKH exists
  → If all years have NCKH:
    → Continue to check BKBQP
    → Approve CSTDTQ if all conditions met
  → If any year missing NCKH:
    → Reject proposal
    → Notify missing years
```

## 🔍 Logic Tính toán

### Kiểm tra NCKH cho CSTDTQ

```javascript
// Kiểm tra mỗi năm trong cụm 3 năm đều có NCKH (APPROVED)
const currentSequence = [2022, 2023, 2024]; // 3 năm CSTDCS liên tục
const thanhTichList = await prisma.thanhTichKhoaHoc.findMany({
  where: {
    quan_nhan_id: personnelId,
    status: 'APPROVED'
  }
});

const hasNCKH_Nam1 = thanhTichList.some(tt => tt.nam === 2022);
const hasNCKH_Nam2 = thanhTichList.some(tt => tt.nam === 2023);
const hasNCKH_Nam3 = thanhTichList.some(tt => tt.nam === 2024);

if (hasNCKH_Nam1 && hasNCKH_Nam2 && hasNCKH_Nam3) {
  // Đủ điều kiện NCKH cho CSTDTQ
}
```

### Đếm tổng số NCKH

```javascript
// Đếm tổng số NCKH đã được duyệt
const nckhCount = await prisma.thanhTichKhoaHoc.count({
  where: {
    quan_nhan_id: personnelId,
    status: 'APPROVED'
  }
});

// Cập nhật HoSoHangNam
await prisma.hoSoHangNam.upsert({
  where: { quan_nhan_id: personnelId },
  update: { tong_nckh: nckhCount },
  create: {
    quan_nhan_id: personnelId,
    tong_nckh: nckhCount
  }
});
```

## 📈 Thống kê

- **Tổng số thành tích**: Đếm từ bảng `ThanhTichKhoaHoc`
- **Theo loại**: Nhóm theo `loai` (NCKH, SKKH)
- **Theo trạng thái**: Nhóm theo `status` (APPROVED, PENDING)
- **Theo năm**: Nhóm theo `nam`
- **Theo quân nhân**: Phân tích theo `quan_nhan_id`

## 🔗 Tài liệu Liên quan

- [Tài liệu API](../QLKT.md) - Phần 5.2: Scientific Achievements
- [Cá nhân Hằng năm](./01-CA-NHAN-HANG-NAM.md) - NCKH là điều kiện cho CSTDTQ
- [Hồ sơ Hằng năm](./../QLKT.md#61-xem-hồ-sơ-gợi-ý) - Output từ hệ thống

