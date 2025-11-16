# 🏆 Khen thưởng Cá nhân Hằng năm

## 📋 Tổng quan

Khen thưởng Cá nhân Hằng năm là các danh hiệu được xét và trao tặng hàng năm cho các quân nhân có thành tích xuất sắc trong công tác, học tập và rèn luyện.

## 🎯 Các Loại Danh hiệu

### 1. Chiến sĩ thi đua cơ sở (CSTDCS)

- **Mã**: `CSTDCS`
- **Mô tả**: Danh hiệu cơ bản nhất, được xét hàng năm cho quân nhân có thành tích tốt
- **Điều kiện**: Theo quy định của đơn vị

### 2. Chiến sĩ tiên tiến (CSTT)

- **Mã**: `CSTT`
- **Mô tả**: Danh hiệu cho quân nhân có thành tích tốt nhưng chưa đạt CSTDCS
- **Điều kiện**: Theo quy định của đơn vị

### 3. Bằng khen của Bộ trưởng Bộ Quốc phòng (BKBQP)

- **Mã**: `BKBQP`
- **Mô tả**: Khen thưởng cấp Bộ cho quân nhân có thành tích xuất sắc
- **Điều kiện**:
  - **5 năm CSTDCS liên tục** (tính từ năm hiện tại trở về trước)
  - Có thể đề xuất cùng năm với CSTDCS hoặc năm sau

### 4. Chiến sĩ thi đua toàn quân (CSTDTQ)

- **Mã**: `CSTDTQ`
- **Mô tả**: Danh hiệu cao nhất cấp toàn quân
- **Điều kiện**:
  - **Đã có BKBQP** (trong cụm 3 năm)
  - **3 năm CSTDCS liên tục** (tính từ đầu chuỗi)
  - **Mỗi năm trong 3 năm đều có NCKH** (Đề tài khoa học hoặc Sáng kiến khoa học) đã được duyệt (`status = APPROVED`)
  - NCKH chỉ được kiểm tra trong phạm vi cụm 3 năm riêng biệt
  - Mỗi cụm 3 năm là độc lập (ví dụ: 1-2-3, 4-5-6 là các cụm độc lập)

## 📊 Cấu trúc Dữ liệu

### Database Schema

**Bảng**: `danh_hieu_hang_nam`

| Tên Cột                  | Kiểu          | Mô tả                   |
| ------------------------ | ------------- | ----------------------- |
| `id`                     | String (CUID) | Khóa chính              |
| `quan_nhan_id`           | String        | ID quân nhân            |
| `nam`                    | Integer       | Năm xét danh hiệu       |
| `danh_hieu`              | String?       | CSTDCS, CSTT, hoặc null |
| `so_quyet_dinh`          | String?       | Số quyết định danh hiệu |
| `file_quyet_dinh`        | String?       | File PDF quyết định     |
| `nhan_bkbqp`             | Boolean       | Đã nhận BKBQP (OUTPUT)  |
| `so_quyet_dinh_bkbqp`    | String?       | Số quyết định BKBQP     |
| `file_quyet_dinh_bkbqp`  | String?       | File PDF BKBQP          |
| `nhan_cstdtq`            | Boolean       | Đã nhận CSTDTQ (OUTPUT) |
| `so_quyet_dinh_cstdtq`   | String?       | Số quyết định CSTDTQ    |
| `file_quyet_dinh_cstdtq` | String?       | File PDF CSTDTQ         |

**Ràng buộc**: `UNIQUE(quan_nhan_id, nam)` - Mỗi quân nhân chỉ có 1 bản ghi mỗi năm

### JSON Structure trong Đề xuất

```json
{
  "personnel_id": "abc123",
  "ho_ten": "Nguyễn Văn A",
  "nam": 2024,
  "danh_hieu": "CSTDCS",
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

1. Chọn loại đề xuất: **Cá nhân Hằng năm**
2. Chọn quân nhân cần đề xuất
3. Chọn danh hiệu:
   - **Nhóm 1**: CSTDCS hoặc CSTT (không thể đề xuất cùng BKBQP/CSTDTQ)
   - **Nhóm 2**: BKBQP hoặc CSTDTQ (có thể đề xuất cùng nhau)
4. Nhập năm đề xuất
5. Upload file đính kèm (nếu có)
6. Gửi đề xuất

### Bước 2: Admin xem và chỉnh sửa

1. Xem danh sách đề xuất `PENDING`
2. Xem chi tiết từng đề xuất
3. Chỉnh sửa thông tin (nếu cần)
4. Thêm số quyết định (nếu đã có)

### Bước 3: Admin phê duyệt

1. Kiểm tra điều kiện:
   - BKBQP: Kiểm tra 5 năm CSTDCS liên tục
   - CSTDTQ: Kiểm tra 3 năm CSTDCS + NCKH + BKBQP
2. Phê duyệt đề xuất → Trạng thái `APPROVED`
3. Hệ thống tự động cập nhật:
   - Bảng `DanhHieuHangNam` với `danh_hieu`
   - Bảng `HoSoHangNam` với các trường `nhan_bkbqp`, `nhan_cstdtq`

## 📡 API Endpoints

### 1. Lấy danh sách Danh hiệu Hằng năm

**Endpoint**: `GET /api/annual-rewards`

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
      "danh_hieu": "CSTDCS",
      "so_quyet_dinh": "123/QĐ-HVKHQS",
      "nhan_bkbqp": false,
      "nhan_cstdtq": false
    }
  ]
}
```

### 2. Thêm Danh hiệu Hằng năm

**Endpoint**: `POST /api/annual-rewards`

**Request Body**:

```json
{
  "personnel_id": "xyz",
  "nam": 2024,
  "danh_hieu": "CSTDCS"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Đã thêm danh hiệu thành công",
  "data": { "id": "abc123" }
}
```

### 3. Cập nhật Danh hiệu

**Endpoint**: `PUT /api/annual-rewards/{id}`

**Request Body**:

```json
{
  "nam": 2024,
  "danh_hieu": "CSTT"
}
```

### 4. Xóa Danh hiệu

**Endpoint**: `DELETE /api/annual-rewards/{id}`

## 💡 Ví dụ Cụ thể

### Ví dụ 1: Đề xuất CSTDCS

**Quân nhân**: Nguyễn Văn A
**Năm**: 2024
**Danh hiệu**: CSTDCS
**Kết quả**: Đề xuất được phê duyệt, lưu vào `DanhHieuHangNam`

### Ví dụ 2: Đề xuất BKBQP

**Quân nhân**: Trần Văn B
**Lịch sử CSTDCS**: 2020, 2021, 2022, 2023, 2024 (5 năm liên tục)
**Năm đề xuất**: 2024
**Danh hiệu**: BKBQP
**Kết quả**:

- Đề xuất được phê duyệt
- `nhan_bkbqp = true` trong bản ghi năm 2024
- Hệ thống tự động cập nhật `HoSoHangNam.du_dieu_kien_bkbqp = true`

### Ví dụ 3: Đề xuất CSTDTQ

**Quân nhân**: Lê Văn C
**Lịch sử**:

- CSTDCS: 2022, 2023, 2024 (3 năm liên tục)
- NCKH: 2022 (APPROVED), 2023 (APPROVED), 2024 (APPROVED)
- BKBQP: 2023

**Năm đề xuất**: 2024
**Danh hiệu**: CSTDTQ
**Kết quả**:

- Đề xuất được phê duyệt
- `nhan_cstdtq = true` trong bản ghi năm 2024
- Hệ thống tự động cập nhật `HoSoHangNam.du_dieu_kien_cstdtq = true`

## ⚠️ Lưu ý Quan trọng

1. **Không thể đề xuất cùng lúc**: CSTDCS/CSTT không thể đề xuất cùng BKBQP/CSTDTQ trong một đề xuất
2. **Tính liên tục**: CSTDCS liên tục được tính từ năm hiện tại trở về trước
3. **NCKH cho CSTDTQ**: NCKH phải có `status = APPROVED` mới được tính
4. **Cụm 3 năm độc lập**: Mỗi cụm 3 năm CSTDCS là độc lập, không liên quan đến nhau
5. **BKBQP là điều kiện**: CSTDTQ chỉ được xét khi đã có BKBQP trong cụm 3 năm

## 📖 Use Cases

### UC-01: Manager đề xuất CSTDCS/CSTT

**Actor**: Manager

**Mô tả**: Manager tạo đề xuất khen thưởng CSTDCS hoặc CSTT cho quân nhân trong đơn vị

**Preconditions**:

- Manager đã đăng nhập hệ thống
- Manager có quyền quản lý đơn vị
- Quân nhân thuộc đơn vị của Manager

**Main Flow**:

1. Manager chọn loại đề xuất: "Cá nhân Hằng năm"
2. Manager chọn quân nhân cần đề xuất
3. Manager chọn danh hiệu: CSTDCS hoặc CSTT
4. Manager nhập năm đề xuất (năm hiện tại hoặc năm trước)
5. Manager upload file đính kèm (tùy chọn)
6. Manager gửi đề xuất
7. Hệ thống tạo đề xuất với trạng thái `PENDING`
8. Hệ thống gửi thông báo cho Admin

**Postconditions**:

- Đề xuất được tạo với trạng thái `PENDING`
- Admin nhận được thông báo có đề xuất mới

**Alternative Flow**:

- 3a. Manager chọn cả CSTDCS và BKBQP → Hệ thống từ chối, yêu cầu tách thành 2 đề xuất riêng

---

### UC-02: Manager đề xuất BKBQP

**Actor**: Manager

**Mô tả**: Manager tạo đề xuất BKBQP cho quân nhân đã có 5 năm CSTDCS liên tục

**Preconditions**:

- Manager đã đăng nhập hệ thống
- Quân nhân có ít nhất 5 năm CSTDCS liên tục (tính từ năm đề xuất trở về trước)

**Main Flow**:

1. Manager chọn loại đề xuất: "Cá nhân Hằng năm"
2. Manager chọn quân nhân cần đề xuất
3. Hệ thống hiển thị lịch sử CSTDCS của quân nhân
4. Manager chọn danh hiệu: BKBQP
5. Manager nhập năm đề xuất
6. Manager upload file đính kèm (tùy chọn)
7. Manager gửi đề xuất
8. Hệ thống tạo đề xuất với trạng thái `PENDING`

**Postconditions**:

- Đề xuất được tạo với trạng thái `PENDING`
- Admin nhận được thông báo

**Exception Flow**:

- 3a. Quân nhân chưa đủ 5 năm CSTDCS liên tục → Hệ thống cảnh báo nhưng vẫn cho phép gửi (Admin sẽ kiểm tra khi phê duyệt)

---

### UC-03: Manager đề xuất CSTDTQ

**Actor**: Manager

**Mô tả**: Manager tạo đề xuất CSTDTQ cho quân nhân đủ điều kiện

**Preconditions**:

- Manager đã đăng nhập hệ thống
- Quân nhân có 3 năm CSTDCS liên tục
- Mỗi năm trong 3 năm đều có NCKH (APPROVED)
- Quân nhân đã có BKBQP trong cụm 3 năm

**Main Flow**:

1. Manager chọn loại đề xuất: "Cá nhân Hằng năm"
2. Manager chọn quân nhân cần đề xuất
3. Hệ thống hiển thị:
   - Lịch sử CSTDCS (3 năm liên tục)
   - Danh sách NCKH theo từng năm
   - Trạng thái BKBQP
4. Manager chọn danh hiệu: CSTDTQ
5. Manager nhập năm đề xuất
6. Manager upload file đính kèm (tùy chọn)
7. Manager gửi đề xuất
8. Hệ thống tạo đề xuất với trạng thái `PENDING`

**Postconditions**:

- Đề xuất được tạo với trạng thái `PENDING`
- Admin nhận được thông báo

---

### UC-04: Admin phê duyệt đề xuất CSTDCS/CSTT

**Actor**: Admin

**Mô tả**: Admin xem xét và phê duyệt đề xuất CSTDCS hoặc CSTT

**Preconditions**:

- Admin đã đăng nhập hệ thống
- Có đề xuất với trạng thái `PENDING`

**Main Flow**:

1. Admin xem danh sách đề xuất `PENDING`
2. Admin chọn đề xuất cần xem xét
3. Admin xem chi tiết đề xuất:
   - Thông tin quân nhân
   - Danh hiệu đề xuất
   - Năm đề xuất
   - File đính kèm (nếu có)
4. Admin kiểm tra thông tin
5. Admin có thể chỉnh sửa:
   - Số quyết định (nếu đã có)
   - File quyết định (nếu đã có)
6. Admin phê duyệt đề xuất
7. Hệ thống cập nhật:
   - Trạng thái đề xuất: `APPROVED`
   - Bảng `DanhHieuHangNam`: Thêm/cập nhật bản ghi với `danh_hieu`
   - Bảng `HoSoHangNam`: Cập nhật nếu cần
8. Hệ thống gửi thông báo cho Manager

**Postconditions**:

- Đề xuất có trạng thái `APPROVED`
- Dữ liệu được cập nhật vào database
- Manager nhận được thông báo phê duyệt

**Alternative Flow**:

- 5a. Admin từ chối đề xuất → Trạng thái `REJECTED`, gửi thông báo cho Manager

---

### UC-05: Admin phê duyệt đề xuất BKBQP

**Actor**: Admin

**Mô tả**: Admin kiểm tra điều kiện và phê duyệt đề xuất BKBQP

**Preconditions**:

- Admin đã đăng nhập hệ thống
- Có đề xuất BKBQP với trạng thái `PENDING`

**Main Flow**:

1. Admin xem danh sách đề xuất `PENDING`
2. Admin chọn đề xuất BKBQP
3. Hệ thống tự động kiểm tra:
   - Lịch sử CSTDCS của quân nhân
   - Tính số năm CSTDCS liên tục
4. Admin xem kết quả kiểm tra:
   - Danh sách các năm có CSTDCS
   - Số năm liên tục
   - Cảnh báo nếu chưa đủ 5 năm
5. Nếu đủ điều kiện:
   - Admin phê duyệt đề xuất
   - Hệ thống cập nhật:
     - `DanhHieuHangNam.nhan_bkbqp = true` (năm đề xuất)
     - `HoSoHangNam.du_dieu_kien_bkbqp = true`
6. Nếu chưa đủ điều kiện:
   - Admin từ chối đề xuất
   - Ghi chú lý do từ chối

**Postconditions**:

- Đề xuất được phê duyệt hoặc từ chối
- Nếu phê duyệt: `nhan_bkbqp = true` được cập nhật

---

### UC-06: Admin phê duyệt đề xuất CSTDTQ

**Actor**: Admin

**Mô tả**: Admin kiểm tra điều kiện phức tạp và phê duyệt đề xuất CSTDTQ

**Preconditions**:

- Admin đã đăng nhập hệ thống
- Có đề xuất CSTDTQ với trạng thái `PENDING`

**Main Flow**:

1. Admin xem danh sách đề xuất `PENDING`
2. Admin chọn đề xuất CSTDTQ
3. Hệ thống tự động kiểm tra:
   - 3 năm CSTDCS liên tục (từ đầu chuỗi)
   - NCKH trong từng năm (status = APPROVED)
   - BKBQP trong cụm 3 năm
4. Admin xem báo cáo kiểm tra:
   - Danh sách 3 năm CSTDCS
   - Danh sách NCKH theo từng năm
   - Trạng thái BKBQP
   - Cảnh báo nếu thiếu điều kiện
5. Nếu đủ điều kiện:
   - Admin phê duyệt đề xuất
   - Hệ thống cập nhật:
     - `DanhHieuHangNam.nhan_cstdtq = true` (năm đề xuất)
     - `HoSoHangNam.du_dieu_kien_cstdtq = true`
6. Nếu chưa đủ điều kiện:
   - Admin từ chối đề xuất
   - Ghi chú lý do từ chối

**Postconditions**:

- Đề xuất được phê duyệt hoặc từ chối
- Nếu phê duyệt: `nhan_cstdtq = true` được cập nhật

---

## 🔧 Đặc tả Kỹ thuật

### Validation Rules

#### 1. Validation khi tạo đề xuất (Frontend)

**Rule V-01**: Kiểm tra loại đề xuất hợp lệ

- **Input**: `proposalType`
- **Validation**: Phải là `'CA_NHAN_HANG_NAM'`
- **Error**: "Loại đề xuất không hợp lệ"

**Rule V-02**: Kiểm tra đã chọn quân nhân

- **Input**: `selectedPersonnelIds`
- **Validation**: Phải có ít nhất 1 quân nhân
- **Error**: "Vui lòng chọn ít nhất 1 quân nhân"

**Rule V-03**: Kiểm tra đã chọn danh hiệu cho tất cả quân nhân

- **Input**: `titleData`
- **Validation**: Mỗi quân nhân phải có `danh_hieu` được chọn
- **Error**: "Vui lòng chọn danh hiệu cho tất cả quân nhân"

**Rule V-04**: Kiểm tra không mix CSTDCS/CSTT với BKBQP/CSTDTQ

- **Input**: `titleData` (danh sách danh hiệu)
- **Validation**:
  - Nếu có CSTDCS hoặc CSTT → Không được có BKBQP hoặc CSTDTQ
  - BKBQP và CSTDTQ có thể đề xuất cùng nhau
- **Error**: "Không thể đề xuất CSTDCS/CSTT cùng với BKBQP/CSTDTQ trong một đề xuất"

**Rule V-05**: Kiểm tra năm đề xuất

- **Input**: `nam`
- **Validation**:
  - Phải là số nguyên dương
  - Phải <= năm hiện tại
  - Phải >= 2000 (năm bắt đầu hệ thống)
- **Error**: "Năm đề xuất không hợp lệ"

#### 2. Validation khi phê duyệt (Backend)

**Rule V-06**: Kiểm tra điều kiện BKBQP

- **Input**: `personnel_id`, `nam`
- **Validation**:
  - Lấy lịch sử CSTDCS từ `DanhHieuHangNam`
  - Tính số năm CSTDCS liên tục từ `nam` trở về trước
  - Yêu cầu: >= 5 năm
- **Error**: `Chưa đủ 5 năm CSTDCS liên tục (hiện tại: ${count} năm)`

**Rule V-07**: Kiểm tra điều kiện CSTDTQ

- **Input**: `personnel_id`, `nam`
- **Validation**:
  - Tìm cụm 3 năm CSTDCS liên tục (từ đầu chuỗi)
  - Kiểm tra mỗi năm trong cụm có NCKH (status = APPROVED)
  - Kiểm tra có BKBQP trong cụm 3 năm (năm 1 hoặc năm 2)
- **Error**: `Chưa đủ điều kiện CSTDTQ: ${reason}`

**Rule V-08**: Kiểm tra trùng lặp bản ghi

- **Input**: `personnel_id`, `nam`
- **Validation**:
  - Kiểm tra `DanhHieuHangNam` đã có bản ghi với `quan_nhan_id` và `nam`
  - Nếu có → Cập nhật, nếu không → Tạo mới
- **Logic**: Sử dụng `upsert` với `UNIQUE(quan_nhan_id, nam)`

### Business Rules

**Rule B-01**: Tính CSTDCS liên tục

- **Mô tả**: Tính từ năm hiện tại trở về trước, dừng khi gặp năm không có CSTDCS
- **Ví dụ**: Năm 2024, có CSTDCS: 2024, 2023, 2022, 2021, 2020 → 5 năm liên tục
- **Ví dụ**: Năm 2024, có CSTDCS: 2024, 2023, 2022, 2020 (thiếu 2021) → 3 năm liên tục

**Rule B-02**: Cụm 3 năm CSTDTQ

- **Mô tả**: Mỗi cụm 3 năm CSTDCS là độc lập, không giao nhau
- **Ví dụ**: Cụm 1: 2020-2021-2022, Cụm 2: 2023-2024-2025 (độc lập)
- **Logic**: Tìm từ đầu chuỗi CSTDCS liên tục, mỗi cụm 3 năm là một đơn vị kiểm tra

**Rule B-03**: NCKH cho CSTDTQ

- **Mô tả**: Mỗi năm trong cụm 3 năm phải có ít nhất 1 NCKH với status = APPROVED
- **Kiểm tra**: Lấy từ bảng `ThanhTichKhoaHoc` với điều kiện:
  - `quan_nhan_id` = quân nhân
  - `nam` = năm trong cụm
  - `status` = 'APPROVED'
  - `loai` IN ('NCKH', 'SKKH')

**Rule B-04**: BKBQP trong cụm 3 năm

- **Mô tả**: BKBQP phải có trong cụm 3 năm, ở năm 1 hoặc năm 2 (không phải năm 3)
- **Ví dụ**: Cụm 2022-2023-2024, BKBQP phải có ở 2022 hoặc 2023

### Error Handling

**Error E-01**: Validation failed khi tạo đề xuất

- **HTTP Status**: 400 Bad Request
- **Response**:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "field": "danh_hieu",
    "message": "Không thể đề xuất CSTDCS cùng với BKBQP"
  }
}
```

**Error E-02**: Không đủ điều kiện BKBQP

- **HTTP Status**: 400 Bad Request
- **Response**:

```json
{
  "success": false,
  "error": "Chưa đủ điều kiện BKBQP",
  "details": {
    "required_years": 5,
    "current_years": 3,
    "missing_years": [2021, 2020]
  }
}
```

**Error E-03**: Không đủ điều kiện CSTDTQ

- **HTTP Status**: 400 Bad Request
- **Response**:

```json
{
  "success": false,
  "error": "Chưa đủ điều kiện CSTDTQ",
  "details": {
    "missing_cstdcs_years": [],
    "missing_nckh_years": [2023],
    "missing_bkbqp": true,
    "sequence": [2022, 2023, 2024]
  }
}
```

**Error E-04**: Trùng lặp bản ghi

- **HTTP Status**: 409 Conflict
- **Response**:

```json
{
  "success": false,
  "error": "Đã tồn tại bản ghi cho quân nhân này trong năm này",
  "details": {
    "personnel_id": "abc123",
    "nam": 2024,
    "existing_record_id": "xyz789"
  }
}
```

### Data Flow

**Flow F-01**: Tạo đề xuất CSTDCS

```
Manager → Frontend → API POST /api/proposals
  → ProposalService.submitProposal()
  → Validation (V-01 đến V-05)
  → Create Proposal (status: PENDING)
  → Create Notification (Admin)
  → Response to Manager
```

**Flow F-02**: Phê duyệt đề xuất BKBQP

```
Admin → Frontend → API PUT /api/proposals/{id}/approve
  → ProposalService.approveProposal()
  → Validation (V-06)
  → Update DanhHieuHangNam (nhan_bkbqp = true)
  → Update HoSoHangNam (du_dieu_kien_bkbqp = true)
  → Update Proposal (status: APPROVED)
  → Create Notification (Manager)
  → Response to Admin
```

**Flow F-03**: Phê duyệt đề xuất CSTDTQ

```
Admin → Frontend → API PUT /api/proposals/{id}/approve
  → ProposalService.approveProposal()
  → Validation (V-07)
    → Check 3 years CSTDCS
    → Check NCKH each year
    → Check BKBQP in sequence
  → Update DanhHieuHangNam (nhan_cstdtq = true)
  → Update HoSoHangNam (du_dieu_kien_cstdtq = true)
  → Update Proposal (status: APPROVED)
  → Create Notification (Manager)
  → Response to Admin
```

## 🔍 Logic Tính toán (Backend)

### Tính CSTDCS liên tục

```javascript
// Hàm tính số năm CSTDCS liên tục
function calculateContinuousCSTDCS(danhHieuList, currentYear) {
  let count = 0;
  for (let year = currentYear; year >= currentYear - 10; year--) {
    const record = danhHieuList.find(dh => dh.nam === year && dh.danh_hieu === 'CSTDCS');
    if (record) {
      count++;
    } else {
      break; // Ngắt khi gặp năm không có CSTDCS
    }
  }
  return count;
}
```

### Kiểm tra điều kiện BKBQP

```javascript
// Yêu cầu: >= 5 năm CSTDCS liên tục
const cstdcsLienTuc = calculateContinuousCSTDCS(danhHieuList, nam);
if (cstdcsLienTuc < 5) {
  throw new Error(`Chưa đủ 5 năm CSTDCS liên tục (hiện tại: ${cstdcsLienTuc} năm)`);
}
```

### Kiểm tra điều kiện CSTDTQ

```javascript
// Yêu cầu:
// 1. 3 năm CSTDCS liên tục (từ đầu chuỗi)
// 2. Mỗi năm đều có NCKH (APPROVED)
// 3. Có BKBQP trong cụm 3 năm (năm 1 hoặc năm 2)

const currentSequence = [2022, 2023, 2024]; // 3 năm CSTDCS liên tục
const hasNCKH_Nam1 = thanhTichList.some(tt => tt.nam === 2022 && tt.status === 'APPROVED');
const hasNCKH_Nam2 = thanhTichList.some(tt => tt.nam === 2023 && tt.status === 'APPROVED');
const hasNCKH_Nam3 = thanhTichList.some(tt => tt.nam === 2024 && tt.status === 'APPROVED');
const hasBKBQP = danhHieuList.some(
  dh => dh.nhan_bkbqp === true && (dh.nam === 2022 || dh.nam === 2023)
);

if (hasNCKH_Nam1 && hasNCKH_Nam2 && hasNCKH_Nam3 && hasBKBQP) {
  // Đủ điều kiện CSTDTQ
}
```

## 📈 Thống kê

- **Tổng số danh hiệu**: Đếm từ bảng `DanhHieuHangNam`
- **Theo năm**: Nhóm theo `nam`
- **Theo danh hiệu**: Nhóm theo `danh_hieu`
- **BKBQP**: Đếm `nhan_bkbqp = true`
- **CSTDTQ**: Đếm `nhan_cstdtq = true`

## 🔗 Tài liệu Liên quan

- [Tài liệu API](../QLKT.md) - Phần 5.1: Annual Rewards
- [Hồ sơ Hằng năm](./../QLKT.md#61-xem-hồ-sơ-gợi-ý) - Output từ hệ thống
- [Thành tích Khoa học](./08-THANH-TICH-KHOA-HOC.md) - Điều kiện cho CSTDTQ
