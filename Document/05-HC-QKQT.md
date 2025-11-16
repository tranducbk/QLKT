# 🎖️ Huy chương Quân kỳ Quyết thắng (HC_QKQT)

## 📋 Tổng quan

Huy chương Quân kỳ Quyết thắng là huân chương đặc biệt được trao tặng cho quân nhân có thời gian phục vụ lâu dài và có nhiều đóng góp cho Quân đội Nhân dân Việt Nam.

## 🎯 Điều kiện Đề xuất

### Điều kiện Bắt buộc

- **Thời gian phục vụ**: **≥ 25 năm** (tính từ ngày nhập ngũ)
- **Không phân biệt giới tính**: Nam và nữ đều yêu cầu ≥ 25 năm

### Tính toán Thời gian

- **Bắt đầu**: Từ `ngay_nhap_ngu`
- **Kết thúc**: `ngay_xuat_ngu` (nếu có) hoặc ngày hiện tại
- **Đơn vị**: Tính theo năm (làm tròn xuống)

## 📊 Cấu trúc Dữ liệu

### Database Schema

**Bảng**: `huan_chuong_quan_ky_quyet_thang`

| Tên Cột           | Kiểu          | Mô tả                       |
| ----------------- | ------------- | --------------------------- |
| `id`              | String (CUID) | Khóa chính                  |
| `quan_nhan_id`    | String        | ID quân nhân (UNIQUE)       |
| `nam`             | Integer       | Năm được trao tặng          |
| `so_quyet_dinh`   | String?       | Số quyết định               |
| `file_quyet_dinh` | String?       | File PDF quyết định         |
| `thoi_gian`       | JSON          | Thông tin thời gian phục vụ |

**Ràng buộc**: `UNIQUE(quan_nhan_id)` - Mỗi quân nhân chỉ có 1 bản ghi HC_QKQT

### JSON Structure trong Đề xuất

```json
{
  "personnel_id": "abc123",
  "ho_ten": "Nguyễn Văn A",
  "nam": 2024,
  "danh_hieu": "HC_QKQT",
  "thoi_gian": {
    "total_months": 300,
    "years": 25,
    "months": 0,
    "display": "25 năm"
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

## 🔄 Quy trình Đề xuất

### Bước 1: Manager tạo đề xuất

1. Chọn loại đề xuất: **Huy chương Quân kỳ Quyết thắng**
2. Chọn quân nhân cần đề xuất
3. Hệ thống tự động:
   - Kiểm tra `ngay_nhap_ngu`
   - Tính thời gian phục vụ
   - **Validation**: Chỉ cho phép nếu ≥ 25 năm
4. Nhập năm đề xuất
5. Upload file đính kèm (nếu có)
6. Gửi đề xuất

### Bước 2: Admin xem và chỉnh sửa

1. Xem danh sách đề xuất `PENDING`
2. Xem chi tiết từng đề xuất
3. Kiểm tra thời gian phục vụ (≥ 25 năm)
4. Chỉnh sửa thông tin (nếu cần)
5. Thêm số quyết định (nếu đã có)

### Bước 3: Admin phê duyệt

1. Kiểm tra lại điều kiện ≥ 25 năm
2. Phê duyệt đề xuất → Trạng thái `APPROVED`
3. Hệ thống tự động lưu vào bảng `HuanChuongQuanKyQuyetThang`

## 📡 API Endpoints

### 1. Lấy danh sách Đề xuất HC_QKQT

**Endpoint**: `GET /api/proposals?type=HC_QKQT`

**Response**:

```json
{
  "success": true,
  "data": {
    "proposals": [
      {
        "id": 1,
        "loai_de_xuat": "HC_QKQT",
        "data_nien_han": [
          {
            "personnel_id": "abc123",
            "ho_ten": "Nguyễn Văn A",
            "nam": 2024,
            "danh_hieu": "HC_QKQT",
            "thoi_gian": {
              "total_months": 300,
              "years": 25,
              "months": 0,
              "display": "25 năm"
            }
          }
        ]
      }
    ]
  }
}
```

## 💡 Ví dụ Cụ thể

### Ví dụ 1: Đề xuất thành công

**Quân nhân**: Nguyễn Văn A
**Ngày nhập ngũ**: 01/01/1999
**Ngày hiện tại**: 01/01/2024
**Thời gian phục vụ**: 25 năm
**Kết quả**: ✅ Đủ điều kiện, đề xuất được gửi

### Ví dụ 2: Không đủ điều kiện

**Quân nhân**: Trần Văn B
**Ngày nhập ngũ**: 01/01/2005
**Ngày hiện tại**: 01/01/2024
**Thời gian phục vụ**: 19 năm
**Kết quả**: ❌ Chưa đủ 25 năm, không thể đề xuất

### Ví dụ 3: Tính thời gian phục vụ

```javascript
// Tính từ ngày nhập ngũ
const ngayNhapNgu = new Date('1999-01-01');
const ngayKetThuc = new Date('2024-01-01'); // hoặc new Date()

let months = (ngayKetThuc.getFullYear() - ngayNhapNgu.getFullYear()) * 12;
months += ngayKetThuc.getMonth() - ngayNhapNgu.getMonth();
if (ngayKetThuc.getDate() < ngayNhapNgu.getDate()) {
  months--;
}
months = Math.max(0, months);

const years = Math.floor(months / 12);

// Yêu cầu: >= 25 năm
if (years < 25) {
  throw new Error(`Chưa đủ 25 năm phục vụ (hiện tại: ${years} năm)`);
}
```

## ⚠️ Lưu ý Quan trọng

1. **Điều kiện bắt buộc**: ≥ 25 năm phục vụ (không phân biệt nam/nữ)
2. **Mỗi quân nhân chỉ 1 bản ghi**: HC_QKQT là duy nhất cho mỗi quân nhân
3. **Validation tự động**: Hệ thống tự động kiểm tra điều kiện khi tạo đề xuất
4. **Ngày nhập ngũ**: Bắt buộc phải có `ngay_nhap_ngu` trong hồ sơ
5. **Dữ liệu lưu**: Lưu cả thông tin thời gian phục vụ vào JSON

## 📖 Use Cases

### UC-01: Manager đề xuất HC_QKQT

**Actor**: Manager

**Mô tả**: Manager tạo đề xuất Huy chương Quân kỳ Quyết thắng cho quân nhân đã có ≥ 25 năm phục vụ

**Preconditions**:

- Manager đã đăng nhập hệ thống
- Manager có quyền quản lý đơn vị
- Quân nhân thuộc đơn vị của Manager
- Quân nhân có `ngay_nhap_ngu` trong hồ sơ
- Quân nhân có ≥ 25 năm phục vụ

**Main Flow**:

1. Manager chọn loại đề xuất: "Huy chương Quân kỳ Quyết thắng"
2. Manager chọn quân nhân cần đề xuất
3. Hệ thống tự động kiểm tra điều kiện:
   - Lấy `ngay_nhap_ngu` từ hồ sơ quân nhân
   - Tính thời gian phục vụ từ `ngay_nhap_ngu` đến hiện tại (hoặc `ngay_xuat_ngu`)
   - Kiểm tra: ≥ 25 năm
4. Nếu đủ điều kiện:
   - Hệ thống hiển thị thời gian phục vụ
   - Manager nhập năm đề xuất
   - Manager upload file đính kèm (tùy chọn)
   - Manager gửi đề xuất
   - Hệ thống tạo đề xuất với trạng thái `PENDING`
5. Hệ thống gửi thông báo cho Admin

**Postconditions**:

- Đề xuất được tạo với trạng thái `PENDING`
- Thông tin thời gian phục vụ được lưu trong đề xuất
- Admin nhận được thông báo có đề xuất mới

**Exception Flow**:

- 3a. Quân nhân chưa có `ngay_nhap_ngu` → Hệ thống từ chối, yêu cầu cập nhật thông tin
- 3b. Quân nhân chưa đủ 25 năm phục vụ → Hệ thống từ chối, hiển thị số năm hiện tại

---

### UC-02: Admin phê duyệt đề xuất HC_QKQT

**Actor**: Admin

**Mô tả**: Admin kiểm tra điều kiện và phê duyệt đề xuất HC_QKQT

**Preconditions**:

- Admin đã đăng nhập hệ thống
- Có đề xuất HC_QKQT với trạng thái `PENDING`

**Main Flow**:

1. Admin xem danh sách đề xuất `PENDING`
2. Admin chọn đề xuất HC_QKQT
3. Admin xem chi tiết đề xuất:
   - Thông tin quân nhân
   - Ngày nhập ngũ
   - Ngày xuất ngũ (nếu có)
   - Thời gian phục vụ (tự động tính)
   - Năm đề xuất
   - File đính kèm (nếu có)
4. Admin kiểm tra lại điều kiện:
   - Xác nhận thời gian phục vụ ≥ 25 năm
   - Kiểm tra tính toán đúng
5. Admin có thể chỉnh sửa:
   - Số quyết định (nếu đã có)
   - File quyết định (nếu đã có)
6. Admin phê duyệt đề xuất
7. Hệ thống cập nhật:
   - Trạng thái đề xuất: `APPROVED`
   - Bảng `HuanChuongQuanKyQuyetThang`: Thêm/cập nhật bản ghi (UNIQUE quan_nhan_id)
8. Hệ thống gửi thông báo cho Manager

**Postconditions**:

- Đề xuất có trạng thái `APPROVED`
- Dữ liệu được cập nhật vào database
- Manager nhận được thông báo phê duyệt

**Alternative Flow**:

- 5a. Admin từ chối đề xuất → Trạng thái `REJECTED`, gửi thông báo cho Manager
- 4a. Thời gian phục vụ không đủ 25 năm → Admin từ chối, ghi chú lý do

---

## 🔧 Đặc tả Kỹ thuật

### Validation Rules

#### 1. Validation khi tạo đề xuất (Frontend)

**Rule V-01**: Kiểm tra loại đề xuất hợp lệ

- **Input**: `proposalType`
- **Validation**: Phải là `'HC_QKQT'`
- **Error**: "Loại đề xuất không hợp lệ"

**Rule V-02**: Kiểm tra đã chọn quân nhân

- **Input**: `selectedPersonnelIds`
- **Validation**: Phải có ít nhất 1 quân nhân
- **Error**: "Vui lòng chọn ít nhất 1 quân nhân"

**Rule V-03**: Kiểm tra có ngày nhập ngũ

- **Input**: `personnel.ngay_nhap_ngu`
- **Validation**: Phải có `ngay_nhap_ngu` trong hồ sơ quân nhân
- **Error**: "Quân nhân chưa có thông tin ngày nhập ngũ"

**Rule V-04**: Kiểm tra điều kiện thời gian phục vụ

- **Input**: `personnel.ngay_nhap_ngu`, `personnel.ngay_xuat_ngu` (optional)
- **Validation**: Thời gian phục vụ phải ≥ 25 năm
- **Error**: `Chưa đủ 25 năm phục vụ (hiện tại: ${years} năm)`

**Rule V-05**: Kiểm tra năm đề xuất

- **Input**: `nam`
- **Validation**:
  - Phải là số nguyên dương
  - Phải <= năm hiện tại
  - Phải >= 2000
- **Error**: "Năm đề xuất không hợp lệ"

#### 2. Validation khi phê duyệt (Backend)

**Rule V-06**: Kiểm tra trùng lặp bản ghi

- **Input**: `personnel_id`
- **Validation**:
  - Kiểm tra `HuanChuongQuanKyQuyetThang` đã có bản ghi với `quan_nhan_id`
  - Nếu có → Cập nhật, nếu không → Tạo mới
- **Logic**: Sử dụng `upsert` với `UNIQUE(quan_nhan_id)`

**Rule V-07**: Kiểm tra lại điều kiện thời gian

- **Input**: `personnel_id`
- **Validation**:
  - Tính lại thời gian phục vụ
  - Phải ≥ 25 năm
- **Error**: `Chưa đủ 25 năm phục vụ (hiện tại: ${years} năm)`

### Business Rules

**Rule B-01**: Điều kiện thời gian phục vụ

- **Mô tả**: Yêu cầu ≥ 25 năm phục vụ, không phân biệt nam/nữ
- **Tính toán**: Từ `ngay_nhap_ngu` đến `ngay_xuat_ngu` (nếu có) hoặc ngày hiện tại
- **Ví dụ**: Nhập ngũ 01/01/1999, hiện tại 01/01/2024 → 25 năm → Đủ điều kiện

**Rule B-02**: Mỗi quân nhân chỉ 1 bản ghi HC_QKQT

- **Mô tả**: HC_QKQT là duy nhất cho mỗi quân nhân
- **Logic**: Sử dụng `UNIQUE(quan_nhan_id)` trong database
- **Lưu ý**: Nếu quân nhân đã có HC_QKQT, đề xuất mới sẽ cập nhật bản ghi cũ

**Rule B-03**: Lưu thông tin thời gian vào JSON

- **Mô tả**: Thông tin thời gian phục vụ được lưu vào trường `thoi_gian` dạng JSON
- **Cấu trúc**:
  ```json
  {
    "total_months": 300,
    "years": 25,
    "months": 0,
    "display": "25 năm"
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
    "field": "thoi_gian",
    "message": "Chưa đủ 25 năm phục vụ (hiện tại: 20 năm)"
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
  "error": "Quân nhân đã có Huy chương Quân kỳ Quyết thắng",
  "details": {
    "personnel_id": "abc123",
    "existing_record_id": "xyz789",
    "existing_nam": 2020
  }
}
```

**Error E-04**: Chưa đủ điều kiện thời gian

- **HTTP Status**: 400 Bad Request
- **Response**:

```json
{
  "success": false,
  "error": "Chưa đủ 25 năm phục vụ",
  "details": {
    "required_years": 25,
    "current_years": 20,
    "missing_years": 5
  }
}
```

### Data Flow

**Flow F-01**: Tạo đề xuất HC_QKQT

```
Manager → Frontend → API POST /api/proposals
  → ProposalService.submitProposal()
  → Validation (V-01 đến V-05)
  → Calculate service time (ngay_nhap_ngu)
  → Check >= 25 years
  → Create Proposal (status: PENDING)
  → Create Notification (Admin)
  → Response to Manager
```

**Flow F-02**: Phê duyệt đề xuất HC_QKQT

```
Admin → Frontend → API PUT /api/proposals/{id}/approve
  → ProposalService.approveProposal()
  → Validation (V-06, V-07)
  → Check existing record (UNIQUE quan_nhan_id)
  → Upsert HuanChuongQuanKyQuyetThang
  → Update Proposal (status: APPROVED)
  → Create Notification (Manager)
  → Response to Admin
```

## 🔍 Logic Validation

### Kiểm tra điều kiện thời gian

```javascript
async function validateHC_QKQT(personnelId) {
  const quanNhan = await prisma.quanNhan.findUnique({
    where: { id: personnelId },
    select: {
      ho_ten: true,
      ngay_nhap_ngu: true,
      ngay_xuat_ngu: true,
    },
  });

  if (!quanNhan.ngay_nhap_ngu) {
    throw new Error('Chưa có thông tin ngày nhập ngũ');
  }

  const ngayNhapNgu = new Date(quanNhan.ngay_nhap_ngu);
  const ngayKetThuc = quanNhan.ngay_xuat_ngu ? new Date(quanNhan.ngay_xuat_ngu) : new Date();

  let months = (ngayKetThuc.getFullYear() - ngayNhapNgu.getFullYear()) * 12;
  months += ngayKetThuc.getMonth() - ngayNhapNgu.getMonth();
  if (ngayKetThuc.getDate() < ngayNhapNgu.getDate()) {
    months--;
  }
  months = Math.max(0, months);

  const years = Math.floor(months / 12);
  const requiredYears = 25;

  if (years < requiredYears) {
    throw new Error(`Chưa đủ ${requiredYears} năm phục vụ (hiện tại: ${years} năm)`);
  }

  return true;
}
```

### Kiểm tra trùng lặp

```javascript
// Kiểm tra xem quân nhân đã có HC_QKQT chưa
const existing = await prisma.huanChuongQuanKyQuyetThang.findUnique({
  where: { quan_nhan_id: personnelId },
});

if (existing) {
  throw new Error(`Quân nhân đã có Huy chương Quân kỳ quyết thắng (năm ${existing.nam})`);
}
```

## 📈 Thống kê

- **Tổng số khen thưởng**: Đếm từ bảng `HuanChuongQuanKyQuyetThang`
- **Theo năm**: Nhóm theo `nam`
- **Theo thời gian phục vụ**: Phân tích từ trường `thoi_gian`

## 🔗 Tài liệu Liên quan

- [Tài liệu API](../QLKT.md) - Phần 5: Awards Management
- [Niên hạn](./03-NIEN-HAN.md) - So sánh với khen thưởng niên hạn
- [Kỷ niệm chương VSNXD QĐNDVN](./06-KNC-VSNXD-QDNDVN.md) - So sánh điều kiện
