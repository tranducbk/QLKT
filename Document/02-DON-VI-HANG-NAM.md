# 🏆 Khen thưởng Đơn vị Hằng năm

## 📋 Tổng quan

Khen thưởng Đơn vị Hằng năm là các danh hiệu được xét và trao tặng hàng năm cho các đơn vị có thành tích xuất sắc trong công tác, xây dựng đơn vị vững mạnh toàn diện.

## 🎯 Các Loại Danh hiệu

### 1. Đơn vị Quyết thắng (ĐVQT)

- **Mã**: `ĐVQT`
- **Mô tả**: Danh hiệu cao nhất cho đơn vị có thành tích xuất sắc
- **Điều kiện**: Theo quy định của Học viện

### 2. Đơn vị Tiên tiến (ĐVTT)

- **Mã**: `ĐVTT`
- **Mô tả**: Danh hiệu cho đơn vị có thành tích tốt
- **Điều kiện**: Theo quy định của Học viện

### 3. Bằng khen của Bộ trưởng Bộ Quốc phòng (BKBQP)

- **Mã**: `BKBQP`
- **Mô tả**: Khen thưởng cấp Bộ cho đơn vị có thành tích xuất sắc
- **Điều kiện**: Theo quy định của Bộ Quốc phòng

### 4. Bằng khen Thủ tướng Chính phủ (BKTTCP)

- **Mã**: `BKTTCP`
- **Mô tả**: Khen thưởng cấp Chính phủ cho đơn vị có thành tích đặc biệt xuất sắc
- **Điều kiện**: Theo quy định của Chính phủ

## 📊 Cấu trúc Dữ liệu

### Database Schema

**Bảng**: `theo_doi_khen_thuong_don_vi`

| Tên Cột           | Kiểu          | Mô tả                                 |
| ----------------- | ------------- | ------------------------------------- |
| `id`              | String (CUID) | Khóa chính                            |
| `don_vi_id`       | String        | ID đơn vị                             |
| `don_vi_type`     | String        | CO_QUAN_DON_VI hoặc DON_VI_TRUC_THUOC |
| `nam`             | Integer       | Năm xét danh hiệu                     |
| `danh_hieu`       | String?       | ĐVQT, ĐVTT, BKBQP, BKTTCP             |
| `so_quyet_dinh`   | String?       | Số quyết định                         |
| `file_quyet_dinh` | String?       | File PDF quyết định                   |

### JSON Structure trong Đề xuất

```json
{
  "don_vi_id": "abc123",
  "don_vi_type": "DON_VI_TRUC_THUOC",
  "ten_don_vi": "Hệ 1",
  "ma_don_vi": "K1",
  "nam": 2024,
  "danh_hieu": "ĐVQT",
  "co_quan_don_vi_cha": {
    "id": "xyz",
    "ten_don_vi": "Học viện Khoa học Quân sự",
    "ma_don_vi": "HVKHQS"
  }
}
```

## 🔄 Quy trình Đề xuất

### Bước 1: Manager tạo đề xuất

1. Chọn loại đề xuất: **Đơn vị Hằng năm**
2. Chọn đơn vị cần đề xuất:
   - **Cơ quan đơn vị** (CO_QUAN_DON_VI)
   - **Đơn vị trực thuộc** (DON_VI_TRUC_THUOC)
3. Chọn danh hiệu: ĐVQT, ĐVTT, BKBQP, BKTTCP
4. Nhập năm đề xuất (chỉ cho phép năm sau năm hiện tại)
5. Upload file đính kèm (nếu có)
6. Gửi đề xuất

### Bước 2: Admin xem và chỉnh sửa

1. Xem danh sách đề xuất `PENDING`
2. Xem chi tiết từng đề xuất
3. Chỉnh sửa thông tin (nếu cần)
4. Thêm số quyết định (nếu đã có)

### Bước 3: Admin phê duyệt

1. Kiểm tra điều kiện theo quy định
2. Phê duyệt đề xuất → Trạng thái `APPROVED`
3. Hệ thống tự động lưu vào bảng `TheoDoiKhenThuongDonVi`

## 📡 API Endpoints

### 1. Lấy danh sách Khen thưởng Đơn vị

**Endpoint**: `GET /api/unit-annual-awards`

**Query Parameters**:

- `unit_id` (optional): ID đơn vị
- `nam` (optional): Năm

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "don_vi_id": "xyz",
      "don_vi_type": "DON_VI_TRUC_THUOC",
      "nam": 2024,
      "danh_hieu": "ĐVQT",
      "so_quyet_dinh": "123/QĐ-HVKHQS"
    }
  ]
}
```

### 2. Thêm Khen thưởng Đơn vị

**Endpoint**: `POST /api/unit-annual-awards`

**Request Body**:

```json
{
  "don_vi_id": "xyz",
  "don_vi_type": "DON_VI_TRUC_THUOC",
  "nam": 2024,
  "danh_hieu": "ĐVQT"
}
```

## 💡 Ví dụ Cụ thể

### Ví dụ 1: Đề xuất ĐVQT cho Hệ 1

**Đơn vị**: Hệ 1 (DON_VI_TRUC_THUOC)
**Năm**: 2025 (năm sau)
**Danh hiệu**: ĐVQT
**Kết quả**: Đề xuất được phê duyệt, lưu vào `TheoDoiKhenThuongDonVi`

### Ví dụ 2: Đề xuất BKBQP cho Phòng Chính trị

**Đơn vị**: Phòng Chính trị (CO_QUAN_DON_VI)
**Năm**: 2025
**Danh hiệu**: BKBQP
**Kết quả**: Đề xuất được phê duyệt

## ⚠️ Lưu ý Quan trọng

1. **Năm đề xuất**: Chỉ cho phép đề xuất cho **năm sau** năm hiện tại
2. **Loại đơn vị**: Phân biệt rõ Cơ quan đơn vị và Đơn vị trực thuộc
3. **Quyền đề xuất**: Manager chỉ có thể đề xuất cho đơn vị của mình
4. **Dữ liệu lưu**: Lưu cả thông tin đơn vị và cơ quan đơn vị cha (nếu có)

## 📖 Use Cases

### UC-01: Manager đề xuất khen thưởng đơn vị

**Actor**: Manager

**Mô tả**: Manager tạo đề xuất khen thưởng cho đơn vị của mình

**Preconditions**:
- Manager đã đăng nhập hệ thống
- Manager có quyền quản lý đơn vị
- Đơn vị thuộc quyền quản lý của Manager

**Main Flow**:
1. Manager chọn loại đề xuất: "Đơn vị Hằng năm"
2. Manager chọn đơn vị cần đề xuất:
   - Cơ quan đơn vị (CO_QUAN_DON_VI)
   - Đơn vị trực thuộc (DON_VI_TRUC_THUOC)
3. Manager chọn danh hiệu: ĐVQT, ĐVTT, BKBQP, hoặc BKTTCP
4. Manager nhập năm đề xuất (chỉ cho phép năm sau năm hiện tại)
5. Manager upload file đính kèm (tùy chọn)
6. Manager gửi đề xuất
7. Hệ thống tạo đề xuất với trạng thái `PENDING`
8. Hệ thống gửi thông báo cho Admin

**Postconditions**:
- Đề xuất được tạo với trạng thái `PENDING`
- Admin nhận được thông báo có đề xuất mới

**Exception Flow**:
- 4a. Manager nhập năm <= năm hiện tại → Hệ thống từ chối, yêu cầu nhập năm sau
- 2a. Manager chọn đơn vị không thuộc quyền quản lý → Hệ thống từ chối

---

### UC-02: Admin phê duyệt đề xuất đơn vị

**Actor**: Admin

**Mô tả**: Admin xem xét và phê duyệt đề xuất khen thưởng đơn vị

**Preconditions**:
- Admin đã đăng nhập hệ thống
- Có đề xuất với trạng thái `PENDING`

**Main Flow**:
1. Admin xem danh sách đề xuất `PENDING`
2. Admin chọn đề xuất cần xem xét
3. Admin xem chi tiết đề xuất:
   - Thông tin đơn vị (tên, mã, loại)
   - Cơ quan đơn vị cha (nếu có)
   - Danh hiệu đề xuất
   - Năm đề xuất
   - File đính kèm (nếu có)
4. Admin kiểm tra thông tin và điều kiện
5. Admin có thể chỉnh sửa:
   - Số quyết định (nếu đã có)
   - File quyết định (nếu đã có)
6. Admin phê duyệt đề xuất
7. Hệ thống cập nhật:
   - Trạng thái đề xuất: `APPROVED`
   - Bảng `TheoDoiKhenThuongDonVi`: Thêm/cập nhật bản ghi
8. Hệ thống gửi thông báo cho Manager

**Postconditions**:
- Đề xuất có trạng thái `APPROVED`
- Dữ liệu được cập nhật vào database
- Manager nhận được thông báo phê duyệt

**Alternative Flow**:
- 5a. Admin từ chối đề xuất → Trạng thái `REJECTED`, gửi thông báo cho Manager

---

## 🔧 Đặc tả Kỹ thuật

### Validation Rules

#### 1. Validation khi tạo đề xuất (Frontend)

**Rule V-01**: Kiểm tra loại đề xuất hợp lệ
- **Input**: `proposalType`
- **Validation**: Phải là `'DON_VI_HANG_NAM'`
- **Error**: "Loại đề xuất không hợp lệ"

**Rule V-02**: Kiểm tra đã chọn đơn vị
- **Input**: `selectedUnitIds`
- **Validation**: Phải có ít nhất 1 đơn vị
- **Error**: "Vui lòng chọn ít nhất 1 đơn vị"

**Rule V-03**: Kiểm tra đã chọn danh hiệu cho tất cả đơn vị
- **Input**: `titleData`
- **Validation**: Mỗi đơn vị phải có `danh_hieu` được chọn
- **Error**: "Vui lòng chọn danh hiệu cho tất cả đơn vị"

**Rule V-04**: Kiểm tra năm đề xuất
- **Input**: `nam`
- **Validation**:
  - Phải là số nguyên dương
  - Phải > năm hiện tại (chỉ cho phép năm sau)
  - Phải <= năm hiện tại + 1 (chỉ cho phép năm sau)
- **Error**: "Chỉ được đề xuất cho năm sau năm hiện tại"

**Rule V-05**: Kiểm tra danh hiệu hợp lệ
- **Input**: `danh_hieu`
- **Validation**: Phải là một trong: `ĐVQT`, `ĐVTT`, `BKBQP`, `BKTTCP`
- **Error**: "Danh hiệu không hợp lệ"

**Rule V-06**: Kiểm tra quyền quản lý đơn vị
- **Input**: `don_vi_id`, `userId`
- **Validation**: Đơn vị phải thuộc quyền quản lý của Manager
- **Error**: "Bạn không có quyền đề xuất cho đơn vị này"

#### 2. Validation khi phê duyệt (Backend)

**Rule V-07**: Kiểm tra trùng lặp bản ghi
- **Input**: `don_vi_id`, `don_vi_type`, `nam`
- **Validation**:
  - Kiểm tra `TheoDoiKhenThuongDonVi` đã có bản ghi với cùng `don_vi_id`, `don_vi_type`, `nam`
  - Nếu có → Cập nhật, nếu không → Tạo mới
- **Logic**: Sử dụng `upsert` với điều kiện unique

### Business Rules

**Rule B-01**: Năm đề xuất chỉ cho phép năm sau
- **Mô tả**: Đề xuất đơn vị chỉ được tạo cho năm sau năm hiện tại
- **Ví dụ**: Năm hiện tại 2024 → Chỉ được đề xuất cho năm 2025
- **Lý do**: Để có thời gian chuẩn bị và xét duyệt trước khi năm mới bắt đầu

**Rule B-02**: Phân biệt loại đơn vị
- **Mô tả**: Hệ thống phân biệt 2 loại đơn vị:
  - `CO_QUAN_DON_VI`: Cơ quan đơn vị (cấp cao)
  - `DON_VI_TRUC_THUOC`: Đơn vị trực thuộc (cấp thấp hơn)
- **Lưu ý**: Mỗi loại có thể có quy định khen thưởng khác nhau

**Rule B-03**: Quyền đề xuất theo đơn vị
- **Mô tả**: Manager chỉ có thể đề xuất cho đơn vị mà mình quản lý
- **Kiểm tra**: So sánh `don_vi_id` với danh sách đơn vị của Manager

### Error Handling

**Error E-01**: Validation failed khi tạo đề xuất
- **HTTP Status**: 400 Bad Request
- **Response**:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "field": "nam",
    "message": "Chỉ được đề xuất cho năm sau năm hiện tại"
  }
}
```

**Error E-02**: Không có quyền đề xuất
- **HTTP Status**: 403 Forbidden
- **Response**:
```json
{
  "success": false,
  "error": "Bạn không có quyền đề xuất cho đơn vị này",
  "details": {
    "unit_id": "abc123",
    "unit_name": "Hệ 1"
  }
}
```

**Error E-03**: Trùng lặp bản ghi
- **HTTP Status**: 409 Conflict
- **Response**:
```json
{
  "success": false,
  "error": "Đã tồn tại bản ghi khen thưởng cho đơn vị này trong năm này",
  "details": {
    "unit_id": "abc123",
    "nam": 2025,
    "existing_record_id": "xyz789"
  }
}
```

### Data Flow

**Flow F-01**: Tạo đề xuất đơn vị
```
Manager → Frontend → API POST /api/proposals
  → ProposalService.submitProposal()
  → Validation (V-01 đến V-06)
  → Check unit permission
  → Create Proposal (status: PENDING)
  → Create Notification (Admin)
  → Response to Manager
```

**Flow F-02**: Phê duyệt đề xuất đơn vị
```
Admin → Frontend → API PUT /api/proposals/{id}/approve
  → ProposalService.approveProposal()
  → Validation (V-07)
  → Update TheoDoiKhenThuongDonVi
  → Update Proposal (status: APPROVED)
  → Create Notification (Manager)
  → Response to Admin
```

## 🔍 Logic Validation

### Kiểm tra năm đề xuất

```javascript
// Chỉ cho phép năm sau năm hiện tại
const currentYear = new Date().getFullYear();
if (nam <= currentYear) {
  throw new Error(`Chỉ được đề xuất cho năm sau (năm hiện tại: ${currentYear})`);
}
```

## 📈 Thống kê

- **Tổng số khen thưởng**: Đếm từ bảng `TheoDoiKhenThuongDonVi`
- **Theo năm**: Nhóm theo `nam`
- **Theo danh hiệu**: Nhóm theo `danh_hieu`
- **Theo loại đơn vị**: Nhóm theo `don_vi_type`

## 🔗 Tài liệu Liên quan

- [Tài liệu API](../QLKT.md) - Phần 5: Awards Management
- [Cá nhân Hằng năm](./01-CA-NHAN-HANG-NAM.md) - So sánh với khen thưởng cá nhân
