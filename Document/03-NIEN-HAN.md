# ⏱️ Khen thưởng Niên hạn - Huân chương Chiến sĩ Vẻ vang

## 📋 Tổng quan

Khen thưởng Niên hạn là các Huân chương Chiến sĩ Vẻ vang (HCCSVV) được trao tặng dựa trên **thời gian phục vụ** của quân nhân trong Quân đội Nhân dân Việt Nam.

## 🎯 Các Hạng Huân chương

### 1. Huân chương Chiến sĩ Vẻ vang Hạng Ba

- **Mã**: `HCCSVV_HANG_BA`
- **Mô tả**: Hạng thấp nhất trong hệ thống HCCSVV
- **Điều kiện**: Dựa trên thời gian phục vụ (theo quy định)

### 2. Huân chương Chiến sĩ Vẻ vang Hạng Nhì

- **Mã**: `HCCSVV_HANG_NHI`
- **Mô tả**: Hạng trung bình
- **Điều kiện**: Dựa trên thời gian phục vụ (theo quy định)

### 3. Huân chương Chiến sĩ Vẻ vang Hạng Nhất

- **Mã**: `HCCSVV_HANG_NHAT`
- **Mô tả**: Hạng cao nhất trong hệ thống HCCSVV
- **Điều kiện**: Dựa trên thời gian phục vụ (theo quy định)

## 📊 Cấu trúc Dữ liệu

### Database Schema

**Bảng**: `khen_thuong_hccsvv`

| Tên Cột           | Kiểu          | Mô tả                                             |
| ----------------- | ------------- | ------------------------------------------------- |
| `id`              | String (CUID) | Khóa chính                                        |
| `quan_nhan_id`    | String        | ID quân nhân (UNIQUE)                             |
| `nam`             | Integer       | Năm được trao tặng                                |
| `danh_hieu`       | String        | HCCSVV_HANG_BA, HCCSVV_HANG_NHI, HCCSVV_HANG_NHAT |
| `so_quyet_dinh`   | String?       | Số quyết định                                     |
| `file_quyet_dinh` | String?       | File PDF quyết định                               |
| `thoi_gian`       | JSON          | Thông tin thời gian phục vụ                       |

**Ràng buộc**: `UNIQUE(quan_nhan_id)` - Mỗi quân nhân chỉ có 1 bản ghi HCCSVV

### JSON Structure trong Đề xuất

```json
{
  "personnel_id": "abc123",
  "ho_ten": "Nguyễn Văn A",
  "nam": 2024,
  "danh_hieu": "HCCSVV_HANG_BA",
  "thoi_gian": {
    "total_months": 180,
    "years": 15,
    "months": 0,
    "display": "15 năm"
  },
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

### Cấu trúc `thoi_gian`

```json
{
  "total_months": 180,
  "years": 15,
  "months": 0,
  "display": "15 năm"
}
```

- `total_months`: Tổng số tháng phục vụ
- `years`: Số năm (làm tròn xuống)
- `months`: Số tháng còn lại
- `display`: Chuỗi hiển thị (ví dụ: "15 năm", "15 năm 6 tháng", "6 tháng")

## 🔄 Quy trình Đề xuất

### Bước 1: Manager tạo đề xuất

1. Chọn loại đề xuất: **Niên hạn**
2. Chọn quân nhân cần đề xuất
3. Chọn hạng Huân chương:
   - HCCSVV_HANG_BA
   - HCCSVV_HANG_NHI
   - HCCSVV_HANG_NHAT
4. Hệ thống tự động tính thời gian phục vụ từ `ngay_nhap_ngu`
5. Nhập năm đề xuất
6. Upload file đính kèm (nếu có)
7. Gửi đề xuất

### Bước 2: Admin xem và chỉnh sửa

1. Xem danh sách đề xuất `PENDING`
2. Xem chi tiết từng đề xuất
3. Kiểm tra thời gian phục vụ
4. Chỉnh sửa thông tin (nếu cần)
5. Thêm số quyết định (nếu đã có)

### Bước 3: Admin phê duyệt

1. Kiểm tra điều kiện thời gian phục vụ
2. Phê duyệt đề xuất → Trạng thái `APPROVED`
3. Hệ thống tự động lưu vào bảng `KhenThuongHCCSVV`
4. Cập nhật `HoSoNienHan` với trạng thái tương ứng

## 📡 API Endpoints

### 1. Lấy danh sách Khen thưởng Niên hạn

**Endpoint**: `GET /api/proposals?type=NIEN_HAN`

**Response**:

```json
{
  "success": true,
  "data": {
    "proposals": [
      {
        "id": 1,
        "loai_de_xuat": "NIEN_HAN",
        "data_nien_han": [
          {
            "personnel_id": "abc123",
            "ho_ten": "Nguyễn Văn A",
            "nam": 2024,
            "danh_hieu": "HCCSVV_HANG_BA",
            "thoi_gian": {
              "total_months": 180,
              "years": 15,
              "months": 0,
              "display": "15 năm"
            }
          }
        ]
      }
    ]
  }
}
```

## 💡 Ví dụ Cụ thể

### Ví dụ 1: Đề xuất HCCSVV Hạng Ba

**Quân nhân**: Nguyễn Văn A
**Ngày nhập ngũ**: 01/01/2009
**Ngày hiện tại**: 01/01/2024
**Thời gian phục vụ**: 15 năm
**Hạng đề xuất**: HCCSVV_HANG_BA
**Kết quả**: Đề xuất được phê duyệt, lưu vào `KhenThuongHCCSVV`

### Ví dụ 2: Tính thời gian phục vụ

```javascript
// Tính từ ngày nhập ngũ đến hiện tại (hoặc ngày xuất ngũ)
const ngayNhapNgu = new Date('2009-01-01');
const ngayKetThuc = new Date('2024-01-01'); // hoặc new Date() nếu chưa xuất ngũ

let months = (ngayKetThuc.getFullYear() - ngayNhapNgu.getFullYear()) * 12;
months += ngayKetThuc.getMonth() - ngayNhapNgu.getMonth();
if (ngayKetThuc.getDate() < ngayNhapNgu.getDate()) {
  months--;
}

const years = Math.floor(months / 12);
const remainingMonths = months % 12;

// Kết quả: 15 năm 0 tháng
```

## ⚠️ Lưu ý Quan trọng

1. **Thời gian phục vụ**: Tính từ `ngay_nhap_ngu` đến hiện tại (hoặc `ngay_xuat_ngu` nếu đã xuất ngũ)
2. **Mỗi quân nhân chỉ 1 bản ghi**: HCCSVV là duy nhất cho mỗi quân nhân
3. **Validation**: Chỉ cho phép các hạng HCCSVV trong loại đề xuất này
4. **Dữ liệu lưu**: Lưu cả thông tin thời gian phục vụ vào JSON

## 📖 Use Cases

### UC-01: Manager đề xuất HCCSVV

**Actor**: Manager

**Mô tả**: Manager tạo đề xuất Huân chương Chiến sĩ Vẻ vang cho quân nhân dựa trên thời gian phục vụ

**Preconditions**:

- Manager đã đăng nhập hệ thống
- Manager có quyền quản lý đơn vị
- Quân nhân thuộc đơn vị của Manager
- Quân nhân có `ngay_nhap_ngu` trong hồ sơ

**Main Flow**:

1. Manager chọn loại đề xuất: "Niên hạn"
2. Manager chọn quân nhân cần đề xuất
3. Hệ thống tự động tính thời gian phục vụ:
   - Lấy `ngay_nhap_ngu` từ hồ sơ quân nhân
   - Tính từ `ngay_nhap_ngu` đến hiện tại (hoặc `ngay_xuat_ngu` nếu có)
   - Hiển thị thời gian phục vụ (năm, tháng)
4. Manager chọn hạng Huân chương:
   - HCCSVV_HANG_BA
   - HCCSVV_HANG_NHI
   - HCCSVV_HANG_NHAT
5. Manager nhập năm đề xuất
6. Manager upload file đính kèm (tùy chọn)
7. Manager gửi đề xuất
8. Hệ thống tạo đề xuất với trạng thái `PENDING`
9. Hệ thống gửi thông báo cho Admin

**Postconditions**:

- Đề xuất được tạo với trạng thái `PENDING`
- Thông tin thời gian phục vụ được lưu trong đề xuất
- Admin nhận được thông báo có đề xuất mới

**Exception Flow**:

- 3a. Quân nhân chưa có `ngay_nhap_ngu` → Hệ thống cảnh báo, không thể tính thời gian phục vụ
- 4a. Manager chọn danh hiệu không phải HCCSVV → Hệ thống từ chối, chỉ cho phép các hạng HCCSVV

---

### UC-02: Admin phê duyệt đề xuất HCCSVV

**Actor**: Admin

**Mô tả**: Admin kiểm tra thời gian phục vụ và phê duyệt đề xuất HCCSVV

**Preconditions**:

- Admin đã đăng nhập hệ thống
- Có đề xuất HCCSVV với trạng thái `PENDING`

**Main Flow**:

1. Admin xem danh sách đề xuất `PENDING`
2. Admin chọn đề xuất HCCSVV
3. Admin xem chi tiết đề xuất:
   - Thông tin quân nhân
   - Ngày nhập ngũ
   - Ngày xuất ngũ (nếu có)
   - Thời gian phục vụ (tự động tính)
   - Hạng Huân chương đề xuất
   - Năm đề xuất
   - File đính kèm (nếu có)
4. Admin kiểm tra thời gian phục vụ:
   - Xác nhận tính toán đúng
   - Kiểm tra điều kiện theo quy định (nếu có)
5. Admin có thể chỉnh sửa:
   - Số quyết định (nếu đã có)
   - File quyết định (nếu đã có)
6. Admin phê duyệt đề xuất
7. Hệ thống cập nhật:
   - Trạng thái đề xuất: `APPROVED`
   - Bảng `KhenThuongHCCSVV`: Thêm/cập nhật bản ghi (UNIQUE quan_nhan_id)
   - Bảng `HoSoNienHan`: Cập nhật trạng thái tương ứng
8. Hệ thống gửi thông báo cho Manager

**Postconditions**:

- Đề xuất có trạng thái `APPROVED`
- Dữ liệu được cập nhật vào database
- Manager nhận được thông báo phê duyệt

**Alternative Flow**:

- 5a. Admin từ chối đề xuất → Trạng thái `REJECTED`, gửi thông báo cho Manager
- 4a. Thời gian phục vụ không đủ điều kiện → Admin từ chối, ghi chú lý do

---

## 🔧 Đặc tả Kỹ thuật

### Validation Rules

#### 1. Validation khi tạo đề xuất (Frontend)

**Rule V-01**: Kiểm tra loại đề xuất hợp lệ

- **Input**: `proposalType`
- **Validation**: Phải là `'NIEN_HAN'`
- **Error**: "Loại đề xuất không hợp lệ"

**Rule V-02**: Kiểm tra đã chọn quân nhân

- **Input**: `selectedPersonnelIds`
- **Validation**: Phải có ít nhất 1 quân nhân
- **Error**: "Vui lòng chọn ít nhất 1 quân nhân"

**Rule V-03**: Kiểm tra đã chọn danh hiệu cho tất cả quân nhân

- **Input**: `titleData`
- **Validation**: Mỗi quân nhân phải có `danh_hieu` được chọn
- **Error**: "Vui lòng chọn danh hiệu cho tất cả quân nhân"

**Rule V-04**: Kiểm tra danh hiệu chỉ là HCCSVV

- **Input**: `danh_hieu`
- **Validation**: Phải là một trong: `HCCSVV_HANG_BA`, `HCCSVV_HANG_NHI`, `HCCSVV_HANG_NHAT`
- **Error**: "Loại đề xuất 'Niên hạn' chỉ cho phép các hạng HCCSVV"

**Rule V-05**: Kiểm tra có ngày nhập ngũ

- **Input**: `personnel.ngay_nhap_ngu`
- **Validation**: Phải có `ngay_nhap_ngu` trong hồ sơ quân nhân
- **Error**: "Quân nhân chưa có thông tin ngày nhập ngũ"

**Rule V-06**: Kiểm tra năm đề xuất

- **Input**: `nam`
- **Validation**:
  - Phải là số nguyên dương
  - Phải <= năm hiện tại
  - Phải >= 2000
- **Error**: "Năm đề xuất không hợp lệ"

#### 2. Validation khi phê duyệt (Backend)

**Rule V-07**: Kiểm tra trùng lặp bản ghi

- **Input**: `personnel_id`
- **Validation**:
  - Kiểm tra `KhenThuongHCCSVV` đã có bản ghi với `quan_nhan_id`
  - Nếu có → Cập nhật, nếu không → Tạo mới
- **Logic**: Sử dụng `upsert` với `UNIQUE(quan_nhan_id)`

**Rule V-08**: Kiểm tra tính toán thời gian phục vụ

- **Input**: `ngay_nhap_ngu`, `ngay_xuat_ngu` (optional)
- **Validation**:
  - Tính thời gian phục vụ phải chính xác
  - Không được âm
  - Phải >= 0 tháng
- **Error**: "Thời gian phục vụ không hợp lệ"

### Business Rules

**Rule B-01**: Tính thời gian phục vụ

- **Mô tả**: Tính từ `ngay_nhap_ngu` đến `ngay_xuat_ngu` (nếu có) hoặc ngày hiện tại
- **Công thức**:
  - Số tháng = (năm kết thúc - năm bắt đầu) \* 12 + (tháng kết thúc - tháng bắt đầu)
  - Nếu ngày kết thúc < ngày bắt đầu → Trừ 1 tháng
  - Số năm = floor(số tháng / 12)
  - Số tháng còn lại = số tháng % 12
- **Ví dụ**: Nhập ngũ 01/01/2009, hiện tại 01/01/2024 → 15 năm 0 tháng

**Rule B-02**: Mỗi quân nhân chỉ 1 bản ghi HCCSVV

- **Mô tả**: HCCSVV là duy nhất cho mỗi quân nhân, không phân biệt hạng
- **Logic**: Sử dụng `UNIQUE(quan_nhan_id)` trong database
- **Lưu ý**: Nếu quân nhân đã có HCCSVV, đề xuất mới sẽ cập nhật bản ghi cũ

**Rule B-03**: Lưu thông tin thời gian vào JSON

- **Mô tả**: Thông tin thời gian phục vụ được lưu vào trường `thoi_gian` dạng JSON
- **Cấu trúc**:
  ```json
  {
    "total_months": 180,
    "years": 15,
    "months": 0,
    "display": "15 năm"
  }
  ```

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
    "message": "Loại đề xuất 'Niên hạn' chỉ cho phép các hạng HCCSVV"
  }
}
```

**Error E-02**: Thiếu thông tin ngày nhập ngũ

- **HTTP Status**: 400 Bad Request
- **Response**:

```json
{
  "success": false,
  "error": "Quân nhân chưa có thông tin ngày nhập ngũ",
  "details": {
    "personnel_id": "abc123",
    "ho_ten": "Nguyễn Văn A"
  }
}
```

**Error E-03**: Trùng lặp bản ghi

- **HTTP Status**: 409 Conflict
- **Response**:

```json
{
  "success": false,
  "error": "Quân nhân đã có Huân chương Chiến sĩ Vẻ vang",
  "details": {
    "personnel_id": "abc123",
    "existing_record_id": "xyz789",
    "existing_danh_hieu": "HCCSVV_HANG_BA",
    "existing_nam": 2020
  }
}
```

**Error E-04**: Thời gian phục vụ không hợp lệ

- **HTTP Status**: 400 Bad Request
- **Response**:

```json
{
  "success": false,
  "error": "Thời gian phục vụ không hợp lệ",
  "details": {
    "ngay_nhap_ngu": "2009-01-01",
    "ngay_xuat_ngu": null,
    "calculated_months": -5
  }
}
```

### Data Flow

**Flow F-01**: Tạo đề xuất HCCSVV

```
Manager → Frontend → API POST /api/proposals
  → ProposalService.submitProposal()
  → Validation (V-01 đến V-06)
  → Calculate service time (ngay_nhap_ngu)
  → Create Proposal (status: PENDING)
  → Create Notification (Admin)
  → Response to Manager
```

**Flow F-02**: Phê duyệt đề xuất HCCSVV

```
Admin → Frontend → API PUT /api/proposals/{id}/approve
  → ProposalService.approveProposal()
  → Validation (V-07, V-08)
  → Check existing record (UNIQUE quan_nhan_id)
  → Upsert KhenThuongHCCSVV
  → Update HoSoNienHan
  → Update Proposal (status: APPROVED)
  → Create Notification (Manager)
  → Response to Admin
```

## 🔍 Logic Validation

### Kiểm tra danh hiệu hợp lệ

```javascript
// Chỉ cho phép các hạng HCCSVV
const allowedDanhHieus = ['HCCSVV_HANG_BA', 'HCCSVV_HANG_NHI', 'HCCSVV_HANG_NHAT'];
if (!allowedDanhHieus.includes(danhHieu)) {
  throw new Error('Loại đề xuất "Niên hạn" chỉ cho phép các hạng HCCSVV');
}
```

### Tính thời gian phục vụ

```javascript
function calculateServiceTime(ngayNhapNgu, ngayXuatNgu = null) {
  const startDate = new Date(ngayNhapNgu);
  const endDate = ngayXuatNgu ? new Date(ngayXuatNgu) : new Date();

  let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
  months += endDate.getMonth() - startDate.getMonth();
  if (endDate.getDate() < startDate.getDate()) {
    months--;
  }
  months = Math.max(0, months);

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  return {
    total_months: months,
    years: years,
    months: remainingMonths,
    display:
      months === 0
        ? '-'
        : years > 0 && remainingMonths > 0
        ? `${years} năm ${remainingMonths} tháng`
        : years > 0
        ? `${years} năm`
        : `${remainingMonths} tháng`,
  };
}
```

## 📈 Thống kê

- **Tổng số khen thưởng**: Đếm từ bảng `KhenThuongHCCSVV`
- **Theo hạng**: Nhóm theo `danh_hieu`
- **Theo năm**: Nhóm theo `nam`
- **Theo thời gian phục vụ**: Phân tích từ trường `thoi_gian`

## 🔗 Tài liệu Liên quan

- [Tài liệu API](../QLKT.md) - Phần 5: Awards Management
- [Hồ sơ Niên hạn](./../QLKT.md#62-tính-toán-lại-hồ-sơ) - Output từ hệ thống
- [Cống hiến](./04-CONG-HIEN.md) - So sánh với khen thưởng cống hiến
