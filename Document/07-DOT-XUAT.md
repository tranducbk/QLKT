# ⚡ Khen thưởng Đột xuất

## 📋 Tổng quan

Khen thưởng Đột xuất là các khen thưởng được trao tặng ngoài kế hoạch, dựa trên quyết định đặc biệt của cấp có thẩm quyền. Loại khen thưởng này không có điều kiện tự động, mà phụ thuộc vào quyết định của Admin.

## 🎯 Đặc điểm

### Không có Điều kiện Tự động

- Không có điều kiện cụ thể về thời gian phục vụ
- Không có điều kiện về danh hiệu trước đó
- Phụ thuộc hoàn toàn vào quyết định của Admin

### Quyền Quản lý

- **Manager**: **KHÔNG** có quyền đề xuất loại này
- **Admin**: Chỉ Admin mới có thể thêm khen thưởng đột xuất

## 📊 Cấu trúc Dữ liệu

### Database Schema

**Bảng**: `bang_de_xuat` (với `loai_de_xuat = 'DOT_XUAT'`)

| Tên Cột          | Kiểu    | Mô tả                        |
| ---------------- | ------- | ---------------------------- |
| `id`             | Integer | Khóa chính                   |
| `loai_de_xuat`   | String  | 'DOT_XUAT'                   |
| `data_danh_hieu` | JSON    | Dữ liệu khen thưởng đột xuất |
| `status`         | String  | PENDING, APPROVED, REJECTED  |

### JSON Structure trong Đề xuất

```json
{
  "personnel_id": "abc123",
  "ho_ten": "Nguyễn Văn A",
  "nam": 2024,
  "danh_hieu": "Khen thưởng đột xuất",
  "ly_do": "Có thành tích đặc biệt xuất sắc trong công tác",
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

### Bước 1: Admin tạo đề xuất

1. Chọn loại đề xuất: **Đột xuất**
2. Chọn quân nhân cần đề xuất
3. Nhập thông tin:
   - Danh hiệu/khen thưởng
   - Lý do đề xuất
   - Năm đề xuất
4. Upload file đính kèm (nếu có)
5. Gửi đề xuất

### Bước 2: Admin xem và chỉnh sửa

1. Xem danh sách đề xuất `PENDING`
2. Xem chi tiết từng đề xuất
3. Chỉnh sửa thông tin (nếu cần)
4. Thêm số quyết định (nếu đã có)

### Bước 3: Admin phê duyệt

1. Xem xét đề xuất
2. Phê duyệt đề xuất → Trạng thái `APPROVED`
3. Hệ thống tự động lưu vào bảng `BangDeXuat`

## 📡 API Endpoints

### 1. Lấy danh sách Đề xuất Đột xuất

**Endpoint**: `GET /api/proposals?type=DOT_XUAT`

**Quyền**: Chỉ ADMIN

**Response**:

```json
{
  "success": true,
  "data": {
    "proposals": [
      {
        "id": 1,
        "loai_de_xuat": "DOT_XUAT",
        "data_danh_hieu": [
          {
            "personnel_id": "abc123",
            "ho_ten": "Nguyễn Văn A",
            "nam": 2024,
            "danh_hieu": "Khen thưởng đột xuất",
            "ly_do": "Có thành tích đặc biệt xuất sắc"
          }
        ]
      }
    ]
  }
}
```

### 2. Tạo Đề xuất Đột xuất

**Endpoint**: `POST /api/proposals`

**Quyền**: Chỉ ADMIN

**Request Body**:

```json
{
  "type": "DOT_XUAT",
  "nam": 2024,
  "title_data": [
    {
      "personnel_id": "abc123",
      "danh_hieu": "Khen thưởng đột xuất",
      "ly_do": "Có thành tích đặc biệt xuất sắc"
    }
  ]
}
```

## 💡 Ví dụ Cụ thể

### Ví dụ 1: Khen thưởng đột xuất

**Quân nhân**: Nguyễn Văn A
**Năm**: 2024
**Lý do**: Có thành tích đặc biệt xuất sắc trong nghiên cứu khoa học, đạt giải thưởng quốc tế
**Kết quả**: Admin phê duyệt, lưu vào `BangDeXuat`

### Ví dụ 2: Validation quyền

```javascript
// Manager không được đề xuất loại này
if (userRole === 'MANAGER' && type === 'DOT_XUAT') {
  return res.status(403).json({
    success: false,
    message: 'Manager không có quyền đề xuất khen thưởng đột xuất. Loại này chỉ do Admin quản lý.',
  });
}
```

## ⚠️ Lưu ý Quan trọng

1. **Quyền đề xuất**: Chỉ ADMIN mới có thể tạo đề xuất đột xuất
2. **Không có validation tự động**: Không có điều kiện cụ thể, phụ thuộc vào quyết định của Admin
3. **Linh hoạt**: Có thể đề xuất bất kỳ loại khen thưởng nào không nằm trong các loại khác
4. **Lý do**: Nên ghi rõ lý do đề xuất để Admin xem xét

## 📖 Use Cases

### UC-01: Admin tạo đề xuất đột xuất

**Actor**: Admin

**Mô tả**: Admin tạo đề xuất khen thưởng đột xuất cho quân nhân có thành tích đặc biệt

**Preconditions**:

- Admin đã đăng nhập hệ thống
- Admin có quyền quản lý tất cả quân nhân

**Main Flow**:

1. Admin chọn loại đề xuất: "Đột xuất"
2. Admin chọn quân nhân cần đề xuất
3. Admin nhập thông tin:
   - Danh hiệu/khen thưởng
   - Lý do đề xuất (bắt buộc)
   - Năm đề xuất
4. Admin upload file đính kèm (tùy chọn)
5. Admin gửi đề xuất
6. Hệ thống tạo đề xuất với trạng thái `PENDING`
7. Hệ thống gửi thông báo cho Admin khác (nếu có)

**Postconditions**:

- Đề xuất được tạo với trạng thái `PENDING`
- Thông tin lý do được lưu trong đề xuất
- Admin khác nhận được thông báo (nếu có)

**Exception Flow**:

- 3a. Admin không nhập lý do → Hệ thống cảnh báo, yêu cầu nhập lý do

---

### UC-02: Admin phê duyệt đề xuất đột xuất

**Actor**: Admin

**Mô tả**: Admin xem xét và phê duyệt đề xuất khen thưởng đột xuất

**Preconditions**:

- Admin đã đăng nhập hệ thống
- Có đề xuất đột xuất với trạng thái `PENDING`

**Main Flow**:

1. Admin xem danh sách đề xuất `PENDING`
2. Admin chọn đề xuất đột xuất
3. Admin xem chi tiết đề xuất:
   - Thông tin quân nhân
   - Danh hiệu/khen thưởng
   - Lý do đề xuất
   - Năm đề xuất
   - File đính kèm (nếu có)
4. Admin xem xét và đánh giá:
   - Đọc lý do đề xuất
   - Xem file đính kèm (nếu có)
   - Kiểm tra thông tin quân nhân
5. Admin có thể chỉnh sửa:
   - Số quyết định (nếu đã có)
   - File quyết định (nếu đã có)
   - Lý do (nếu cần)
6. Admin phê duyệt đề xuất
7. Hệ thống cập nhật:
   - Trạng thái đề xuất: `APPROVED`
   - Lưu vào bảng `BangDeXuat` với `loai_de_xuat = 'DOT_XUAT'`
8. Hệ thống gửi thông báo cho Admin đã tạo đề xuất

**Postconditions**:

- Đề xuất có trạng thái `APPROVED`
- Dữ liệu được cập nhật vào database
- Admin tạo đề xuất nhận được thông báo phê duyệt

**Alternative Flow**:

- 5a. Admin từ chối đề xuất → Trạng thái `REJECTED`, gửi thông báo cho Admin tạo đề xuất

---

## 🔧 Đặc tả Kỹ thuật

### Validation Rules

#### 1. Validation khi tạo đề xuất (Frontend)

**Rule V-01**: Kiểm tra quyền Admin

- **Input**: `userRole`
- **Validation**: Phải là `'ADMIN'` hoặc `'SUPER_ADMIN'`
- **Error**: "Chỉ Admin mới có quyền đề xuất khen thưởng đột xuất"

**Rule V-02**: Kiểm tra loại đề xuất hợp lệ

- **Input**: `proposalType`
- **Validation**: Phải là `'DOT_XUAT'`
- **Error**: "Loại đề xuất không hợp lệ"

**Rule V-03**: Kiểm tra đã chọn quân nhân

- **Input**: `selectedPersonnelIds`
- **Validation**: Phải có ít nhất 1 quân nhân
- **Error**: "Vui lòng chọn ít nhất 1 quân nhân"

**Rule V-04**: Kiểm tra có lý do đề xuất

- **Input**: `ly_do`
- **Validation**: Phải có lý do đề xuất (không được để trống)
- **Error**: "Vui lòng nhập lý do đề xuất"

**Rule V-05**: Kiểm tra năm đề xuất

- **Input**: `nam`
- **Validation**:
  - Phải là số nguyên dương
  - Phải <= năm hiện tại
  - Phải >= 2000
- **Error**: "Năm đề xuất không hợp lệ"

#### 2. Validation khi phê duyệt (Backend)

**Rule V-06**: Kiểm tra quyền phê duyệt

- **Input**: `userRole`
- **Validation**: Phải là `'ADMIN'` hoặc `'SUPER_ADMIN'`
- **Error**: "Chỉ Admin mới có quyền phê duyệt đề xuất"

### Business Rules

**Rule B-01**: Chỉ Admin mới có quyền đề xuất

- **Mô tả**: Manager không có quyền đề xuất khen thưởng đột xuất
- **Logic**: Kiểm tra `userRole` trước khi cho phép tạo đề xuất
- **Lý do**: Đảm bảo tính nghiêm túc và quyết định đúng đắn

**Rule B-02**: Không có điều kiện tự động

- **Mô tả**: Khen thưởng đột xuất không có điều kiện cụ thể về thời gian, danh hiệu, v.v.
- **Logic**: Phụ thuộc hoàn toàn vào quyết định của Admin
- **Lưu ý**: Admin cần xem xét kỹ lý do đề xuất

**Rule B-03**: Lý do đề xuất bắt buộc

- **Mô tả**: Phải có lý do rõ ràng cho việc đề xuất khen thưởng đột xuất
- **Logic**: Trường `ly_do` không được để trống
- **Mục đích**: Đảm bảo tính minh bạch và có cơ sở

### Error Handling

**Error E-01**: Manager không có quyền

- **HTTP Status**: 403 Forbidden
- **Response**:

```json
{
  "success": false,
  "error": "Manager không có quyền đề xuất khen thưởng đột xuất",
  "details": {
    "user_role": "MANAGER",
    "required_role": "ADMIN"
  }
}
```

**Error E-02**: Validation failed khi tạo đề xuất

- **HTTP Status**: 400 Bad Request
- **Response**:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "field": "ly_do",
    "message": "Vui lòng nhập lý do đề xuất"
  }
}
```

**Error E-03**: Thiếu thông tin quân nhân

- **HTTP Status**: 400 Bad Request
- **Response**:

```json
{
  "success": false,
  "error": "Vui lòng chọn ít nhất 1 quân nhân",
  "details": {
    "selected_count": 0
  }
}
```

### Data Flow

**Flow F-01**: Tạo đề xuất đột xuất

```
Admin → Frontend → API POST /api/proposals
  → Check user role (must be ADMIN)
  → ProposalService.submitProposal()
  → Validation (V-01 đến V-05)
  → Create Proposal (status: PENDING, type: DOT_XUAT)
  → Create Notification (other Admins)
  → Response to Admin
```

**Flow F-02**: Phê duyệt đề xuất đột xuất

```
Admin → Frontend → API PUT /api/proposals/{id}/approve
  → Check user role (must be ADMIN)
  → ProposalService.approveProposal()
  → Validation (V-06)
  → Update BangDeXuat (loai_de_xuat = DOT_XUAT)
  → Update Proposal (status: APPROVED)
  → Create Notification (creator Admin)
  → Response to Admin
```

## 🔍 Logic Validation

### Kiểm tra quyền

```javascript
// Chỉ Admin mới được đề xuất đột xuất
if (userRole === 'MANAGER' && type === 'DOT_XUAT') {
  throw new Error(
    'Manager không có quyền đề xuất khen thưởng đột xuất. ' + 'Loại này chỉ do Admin quản lý.'
  );
}
```

## 📈 Thống kê

- **Tổng số khen thưởng**: Đếm từ bảng `BangDeXuat` với `loai_de_xuat = 'DOT_XUAT'`
- **Theo năm**: Nhóm theo `nam`
- **Theo người đề xuất**: Nhóm theo `nguoi_de_xuat_id`

## 🔗 Tài liệu Liên quan

- [Tài liệu API](../QLKT.md) - Phần 5: Awards Management
- [Cá nhân Hằng năm](./01-CA-NHAN-HANG-NAM.md) - So sánh với khen thưởng có điều kiện
