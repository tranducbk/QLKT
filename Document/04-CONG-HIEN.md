# 💪 Khen thưởng Cống hiến - Huân chương Bảo vệ Tổ quốc

## 📋 Tổng quan

Khen thưởng Cống hiến là các Huân chương Bảo vệ Tổ quốc (HCBVTQ) được trao tặng dựa trên **hệ số chức vụ** và **thời gian giữ chức vụ** của quân nhân. Hệ thống tính toán cống hiến dựa trên 3 nhóm hệ số chức vụ.

## 🎯 Các Hạng Huân chương

### 1. Huân chương Bảo vệ Tổ quốc Hạng Ba

- **Mã**: `HCBVTQ_HANG_BA`
- **Mô tả**: Hạng thấp nhất trong hệ thống HCBVTQ
- **Điều kiện**: Dựa trên tổng thời gian cống hiến theo hệ số chức vụ

### 2. Huân chương Bảo vệ Tổ quốc Hạng Nhì

- **Mã**: `HCBVTQ_HANG_NHI`
- **Mô tả**: Hạng trung bình
- **Điều kiện**: Dựa trên tổng thời gian cống hiến theo hệ số chức vụ

### 3. Huân chương Bảo vệ Tổ quốc Hạng Nhất

- **Mã**: `HCBVTQ_HANG_NHAT`
- **Mô tả**: Hạng cao nhất trong hệ thống HCBVTQ
- **Điều kiện**: Dựa trên tổng thời gian cống hiến theo hệ số chức vụ

## 📊 Hệ số Chức vụ và Nhóm Cống hiến

Hệ thống phân chia chức vụ thành 3 nhóm dựa trên hệ số:

### Nhóm 0.7

- **Hệ số**: 0.7
- **Mô tả**: Chức vụ có hệ số 0.7
- **Ví dụ**: Học viên, Quân nhân chuyên nghiệp

### Nhóm 0.8

- **Hệ số**: 0.8
- **Mô tả**: Chức vụ có hệ số 0.8
- **Ví dụ**: Lớp trưởng, Tiểu đội trưởng

### Nhóm 0.9-1.0

- **Hệ số**: 0.9 hoặc 1.0
- **Mô tả**: Chức vụ có hệ số cao (chỉ huy, quản lý)
- **Ví dụ**: Hệ trưởng, Phó Hệ trưởng, Trưởng phòng

## 📊 Cấu trúc Dữ liệu

### Database Schema

**Bảng**: `khen_thuong_cong_hien`

| Tên Cột                  | Kiểu          | Mô tả                                             |
| ------------------------ | ------------- | ------------------------------------------------- |
| `id`                     | String (CUID) | Khóa chính                                        |
| `quan_nhan_id`           | String        | ID quân nhân (UNIQUE)                             |
| `nam`                    | Integer       | Năm được trao tặng                                |
| `danh_hieu`              | String        | HCBVTQ_HANG_BA, HCBVTQ_HANG_NHI, HCBVTQ_HANG_NHAT |
| `so_quyet_dinh`          | String?       | Số quyết định                                     |
| `file_quyet_dinh`        | String?       | File PDF quyết định                               |
| `thoi_gian_nhom_0_7`     | JSON          | Thời gian cống hiến nhóm 0.7                      |
| `thoi_gian_nhom_0_8`     | JSON          | Thời gian cống hiến nhóm 0.8                      |
| `thoi_gian_nhom_0_9_1_0` | JSON          | Thời gian cống hiến nhóm 0.9-1.0                  |

**Bảng**: `lich_su_chuc_vu` (INPUT)

| Tên Cột         | Kiểu          | Mô tả                               |
| --------------- | ------------- | ----------------------------------- |
| `id`            | String (CUID) | Khóa chính                          |
| `quan_nhan_id`  | String        | ID quân nhân                        |
| `chuc_vu_id`    | String        | ID chức vụ                          |
| `ngay_bat_dau`  | Date          | Ngày bắt đầu giữ chức vụ            |
| `ngay_ket_thuc` | Date?         | Ngày kết thúc (null nếu đang giữ)   |
| `he_so_chuc_vu` | Decimal       | Hệ số chức vụ (0.7, 0.8, 0.9, 1.0)  |
| `so_thang`      | Integer       | Số tháng giữ chức vụ (tự động tính) |

**Ràng buộc**: `UNIQUE(quan_nhan_id)` - Mỗi quân nhân chỉ có 1 bản ghi HCBVTQ

### JSON Structure trong Đề xuất

```json
{
  "personnel_id": "abc123",
  "ho_ten": "Nguyễn Văn A",
  "nam": 2024,
  "danh_hieu": "HCBVTQ_HANG_BA",
  "thoi_gian_nhom_0_7": {
    "total_months": 60,
    "years": 5,
    "months": 0,
    "display": "5 năm"
  },
  "thoi_gian_nhom_0_8": {
    "total_months": 36,
    "years": 3,
    "months": 0,
    "display": "3 năm"
  },
  "thoi_gian_nhom_0_9_1_0": {
    "total_months": 24,
    "years": 2,
    "months": 0,
    "display": "2 năm"
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

1. Chọn loại đề xuất: **Cống hiến**
2. Chọn quân nhân cần đề xuất
3. Chọn hạng Huân chương:
   - HCBVTQ_HANG_BA
   - HCBVTQ_HANG_NHI
   - HCBVTQ_HANG_NHAT
4. Hệ thống tự động tính thời gian cống hiến từ `LichSuChucVu`:
   - Tính tổng thời gian theo từng nhóm hệ số
   - Hiển thị thời gian cho 3 nhóm: 0.7, 0.8, 0.9-1.0
5. Nhập năm đề xuất
6. Upload file đính kèm (nếu có)
7. Gửi đề xuất

### Bước 2: Admin xem và chỉnh sửa

1. Xem danh sách đề xuất `PENDING`
2. Xem chi tiết từng đề xuất
3. Kiểm tra thời gian cống hiến theo 3 nhóm
4. Chỉnh sửa thông tin (nếu cần)
5. Thêm số quyết định (nếu đã có)

### Bước 3: Admin phê duyệt

1. Kiểm tra điều kiện thời gian cống hiến
2. Phê duyệt đề xuất → Trạng thái `APPROVED`
3. Hệ thống tự động lưu vào bảng `KhenThuongCongHien`
4. Cập nhật `HoSoNienHan` với trạng thái tương ứng

## 📡 API Endpoints

### 1. Lấy Lịch sử Chức vụ

**Endpoint**: `GET /api/position-history`

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
      "chuc_vu_id": "def",
      "ten_chuc_vu": "Hệ trưởng",
      "he_so_chuc_vu": 1.0,
      "ngay_bat_dau": "2022-01-01",
      "ngay_ket_thuc": null,
      "so_thang": 24
    }
  ]
}
```

### 2. Lấy danh sách Đề xuất Cống hiến

**Endpoint**: `GET /api/proposals?type=CONG_HIEN`

## 💡 Ví dụ Cụ thể

### Ví dụ 1: Tính thời gian cống hiến

**Quân nhân**: Nguyễn Văn A
**Lịch sử chức vụ**:

- Học viên (0.7): 01/01/2019 - 31/12/2023 (5 năm)
- Lớp trưởng (0.8): 01/01/2021 - 31/12/2023 (3 năm)
- Hệ trưởng (1.0): 01/01/2022 - hiện tại (2 năm)

**Tổng thời gian**:

- Nhóm 0.7: 5 năm
- Nhóm 0.8: 3 năm
- Nhóm 0.9-1.0: 2 năm

**Hạng đề xuất**: HCBVTQ_HANG_BA
**Kết quả**: Đề xuất được phê duyệt

### Ví dụ 2: Tính toán từ LichSuChucVu

```javascript
// Lấy lịch sử chức vụ
const lichSuChucVu = await prisma.lichSuChucVu.findMany({
  where: { quan_nhan_id: personnelId },
});

// Tính tổng thời gian theo từng nhóm
let thoiGianNhom07 = 0;
let thoiGianNhom08 = 0;
let thoiGianNhom0910 = 0;

lichSuChucVu.forEach(ls => {
  const heSo = Number(ls.he_so_chuc_vu);
  const soThang = ls.so_thang || 0;

  if (heSo === 0.7) {
    thoiGianNhom07 += soThang;
  } else if (heSo === 0.8) {
    thoiGianNhom08 += soThang;
  } else if (heSo >= 0.9) {
    thoiGianNhom0910 += soThang;
  }
});

// Chuyển đổi sang năm/tháng
function formatTime(months) {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return {
    total_months: months,
    years: years,
    months: remainingMonths,
    display:
      years > 0 && remainingMonths > 0
        ? `${years} năm ${remainingMonths} tháng`
        : years > 0
        ? `${years} năm`
        : `${remainingMonths} tháng`,
  };
}
```

## ⚠️ Lưu ý Quan trọng

1. **Hệ số chức vụ**: Phải được gán đúng trong bảng `ChucVu` (thông qua `nhom_cong_hien_id`)
2. **Tính toán tự động**: Hệ thống tự động tính `so_thang` từ `ngay_bat_dau` và `ngay_ket_thuc`
3. **Mỗi quân nhân chỉ 1 bản ghi**: HCBVTQ là duy nhất cho mỗi quân nhân
4. **3 nhóm độc lập**: Thời gian cống hiến được tính riêng cho từng nhóm hệ số
5. **Dữ liệu lưu**: Lưu cả thông tin thời gian 3 nhóm vào JSON

## 📖 Use Cases

### UC-01: Manager đề xuất HCBVTQ

**Actor**: Manager

**Mô tả**: Manager tạo đề xuất Huân chương Bảo vệ Tổ quốc cho quân nhân dựa trên thời gian cống hiến theo hệ số chức vụ

**Preconditions**:
- Manager đã đăng nhập hệ thống
- Manager có quyền quản lý đơn vị
- Quân nhân thuộc đơn vị của Manager
- Quân nhân có lịch sử chức vụ trong `LichSuChucVu`

**Main Flow**:
1. Manager chọn loại đề xuất: "Cống hiến"
2. Manager chọn quân nhân cần đề xuất
3. Hệ thống tự động tính thời gian cống hiến:
   - Lấy lịch sử chức vụ từ `LichSuChucVu`
   - Tính tổng thời gian theo 3 nhóm hệ số:
     - Nhóm 0.7: Hệ số = 0.7
     - Nhóm 0.8: Hệ số = 0.8
     - Nhóm 0.9-1.0: Hệ số >= 0.9
   - Hiển thị thời gian cho từng nhóm
4. Manager chọn hạng Huân chương:
   - HCBVTQ_HANG_BA
   - HCBVTQ_HANG_NHI
   - HCBVTQ_HANG_NHAT
5. Manager nhập năm đề xuất
6. Manager upload file đính kèm (tùy chọn)
7. Manager gửi đề xuất
8. Hệ thống tạo đề xuất với trạng thái `PENDING`
9. Hệ thống gửi thông báo cho Admin

**Postconditions**:
- Đề xuất được tạo với trạng thái `PENDING`
- Thông tin thời gian cống hiến 3 nhóm được lưu trong đề xuất
- Admin nhận được thông báo có đề xuất mới

**Exception Flow**:
- 3a. Quân nhân chưa có lịch sử chức vụ → Hệ thống cảnh báo, không thể tính thời gian cống hiến
- 4a. Manager chọn danh hiệu không phải HCBVTQ → Hệ thống từ chối, chỉ cho phép các hạng HCBVTQ

---

### UC-02: Admin phê duyệt đề xuất HCBVTQ

**Actor**: Admin

**Mô tả**: Admin kiểm tra thời gian cống hiến và phê duyệt đề xuất HCBVTQ

**Preconditions**:
- Admin đã đăng nhập hệ thống
- Có đề xuất HCBVTQ với trạng thái `PENDING`

**Main Flow**:
1. Admin xem danh sách đề xuất `PENDING`
2. Admin chọn đề xuất HCBVTQ
3. Admin xem chi tiết đề xuất:
   - Thông tin quân nhân
   - Lịch sử chức vụ
   - Thời gian cống hiến theo 3 nhóm:
     - Nhóm 0.7: X năm Y tháng
     - Nhóm 0.8: X năm Y tháng
     - Nhóm 0.9-1.0: X năm Y tháng
   - Hạng Huân chương đề xuất
   - Năm đề xuất
   - File đính kèm (nếu có)
4. Admin kiểm tra thời gian cống hiến:
   - Xác nhận tính toán đúng
   - Kiểm tra điều kiện theo quy định (nếu có)
5. Admin có thể chỉnh sửa:
   - Số quyết định (nếu đã có)
   - File quyết định (nếu đã có)
6. Admin phê duyệt đề xuất
7. Hệ thống cập nhật:
   - Trạng thái đề xuất: `APPROVED`
   - Bảng `KhenThuongCongHien`: Thêm/cập nhật bản ghi (UNIQUE quan_nhan_id)
   - Bảng `HoSoNienHan`: Cập nhật trạng thái tương ứng
8. Hệ thống gửi thông báo cho Manager

**Postconditions**:
- Đề xuất có trạng thái `APPROVED`
- Dữ liệu được cập nhật vào database
- Manager nhận được thông báo phê duyệt

**Alternative Flow**:
- 5a. Admin từ chối đề xuất → Trạng thái `REJECTED`, gửi thông báo cho Manager
- 4a. Thời gian cống hiến không đủ điều kiện → Admin từ chối, ghi chú lý do

---

## 🔧 Đặc tả Kỹ thuật

### Validation Rules

#### 1. Validation khi tạo đề xuất (Frontend)

**Rule V-01**: Kiểm tra loại đề xuất hợp lệ
- **Input**: `proposalType`
- **Validation**: Phải là `'CONG_HIEN'`
- **Error**: "Loại đề xuất không hợp lệ"

**Rule V-02**: Kiểm tra đã chọn quân nhân
- **Input**: `selectedPersonnelIds`
- **Validation**: Phải có ít nhất 1 quân nhân
- **Error**: "Vui lòng chọn ít nhất 1 quân nhân"

**Rule V-03**: Kiểm tra đã chọn danh hiệu cho tất cả quân nhân
- **Input**: `titleData`
- **Validation**: Mỗi quân nhân phải có `danh_hieu` được chọn
- **Error**: "Vui lòng chọn danh hiệu cho tất cả quân nhân"

**Rule V-04**: Kiểm tra danh hiệu chỉ là HCBVTQ
- **Input**: `danh_hieu`
- **Validation**: Phải là một trong: `HCBVTQ_HANG_BA`, `HCBVTQ_HANG_NHI`, `HCBVTQ_HANG_NHAT`
- **Error**: "Loại đề xuất 'Cống hiến' chỉ cho phép các hạng HCBVTQ"

**Rule V-05**: Kiểm tra có lịch sử chức vụ
- **Input**: `personnel.lich_su_chuc_vu`
- **Validation**: Quân nhân phải có ít nhất 1 bản ghi trong `LichSuChucVu`
- **Error**: "Quân nhân chưa có lịch sử chức vụ"

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
  - Kiểm tra `KhenThuongCongHien` đã có bản ghi với `quan_nhan_id`
  - Nếu có → Cập nhật, nếu không → Tạo mới
- **Logic**: Sử dụng `upsert` với `UNIQUE(quan_nhan_id)`

**Rule V-08**: Kiểm tra tính toán thời gian cống hiến
- **Input**: `personnel_id`
- **Validation**:
  - Tính thời gian cống hiến theo 3 nhóm phải chính xác
  - Tổng thời gian mỗi nhóm phải >= 0
- **Error**: "Thời gian cống hiến không hợp lệ"

### Business Rules

**Rule B-01**: Phân nhóm hệ số chức vụ
- **Mô tả**: Chức vụ được phân thành 3 nhóm dựa trên hệ số:
  - **Nhóm 0.7**: Hệ số = 0.7
  - **Nhóm 0.8**: Hệ số = 0.8
  - **Nhóm 0.9-1.0**: Hệ số >= 0.9 (bao gồm 0.9 và 1.0)
- **Lưu ý**: Hệ số được lấy từ `ChucVu.he_so_chuc_vu` hoặc `LichSuChucVu.he_so_chuc_vu`

**Rule B-02**: Tính thời gian cống hiến theo nhóm
- **Mô tả**: Tính tổng số tháng giữ chức vụ trong mỗi nhóm
- **Công thức**:
  - Lấy tất cả bản ghi `LichSuChucVu` của quân nhân
  - Với mỗi bản ghi, kiểm tra hệ số chức vụ
  - Cộng dồn `so_thang` vào nhóm tương ứng
- **Ví dụ**:
  - Chức vụ hệ số 0.7: 60 tháng → Nhóm 0.7: 60 tháng
  - Chức vụ hệ số 0.8: 36 tháng → Nhóm 0.8: 36 tháng
  - Chức vụ hệ số 1.0: 24 tháng → Nhóm 0.9-1.0: 24 tháng

**Rule B-03**: Mỗi quân nhân chỉ 1 bản ghi HCBVTQ
- **Mô tả**: HCBVTQ là duy nhất cho mỗi quân nhân, không phân biệt hạng
- **Logic**: Sử dụng `UNIQUE(quan_nhan_id)` trong database
- **Lưu ý**: Nếu quân nhân đã có HCBVTQ, đề xuất mới sẽ cập nhật bản ghi cũ

**Rule B-04**: Lưu thông tin thời gian 3 nhóm vào JSON
- **Mô tả**: Thông tin thời gian cống hiến được lưu vào 3 trường JSON riêng biệt
- **Cấu trúc**:
  ```json
  {
    "thoi_gian_nhom_0_7": {
      "total_months": 60,
      "years": 5,
      "months": 0,
      "display": "5 năm"
    },
    "thoi_gian_nhom_0_8": {
      "total_months": 36,
      "years": 3,
      "months": 0,
      "display": "3 năm"
    },
    "thoi_gian_nhom_0_9_1_0": {
      "total_months": 24,
      "years": 2,
      "months": 0,
      "display": "2 năm"
    }
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
    "message": "Loại đề xuất 'Cống hiến' chỉ cho phép các hạng HCBVTQ"
  }
}
```

**Error E-02**: Thiếu lịch sử chức vụ
- **HTTP Status**: 400 Bad Request
- **Response**:
```json
{
  "success": false,
  "error": "Quân nhân chưa có lịch sử chức vụ",
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
  "error": "Quân nhân đã có Huân chương Bảo vệ Tổ quốc",
  "details": {
    "personnel_id": "abc123",
    "existing_record_id": "xyz789",
    "existing_danh_hieu": "HCBVTQ_HANG_BA",
    "existing_nam": 2020
  }
}
```

**Error E-04**: Thời gian cống hiến không hợp lệ
- **HTTP Status**: 400 Bad Request
- **Response**:
```json
{
  "success": false,
  "error": "Thời gian cống hiến không hợp lệ",
  "details": {
    "personnel_id": "abc123",
    "thoi_gian_nhom_0_7": null,
    "thoi_gian_nhom_0_8": null,
    "thoi_gian_nhom_0_9_1_0": null
  }
}
```

### Data Flow

**Flow F-01**: Tạo đề xuất HCBVTQ
```
Manager → Frontend → API POST /api/proposals
  → ProposalService.submitProposal()
  → Validation (V-01 đến V-06)
  → Get LichSuChucVu
  → Calculate contribution time (3 groups)
  → Create Proposal (status: PENDING)
  → Create Notification (Admin)
  → Response to Manager
```

**Flow F-02**: Phê duyệt đề xuất HCBVTQ
```
Admin → Frontend → API PUT /api/proposals/{id}/approve
  → ProposalService.approveProposal()
  → Validation (V-07, V-08)
  → Check existing record (UNIQUE quan_nhan_id)
  → Upsert KhenThuongCongHien
  → Update HoSoNienHan
  → Update Proposal (status: APPROVED)
  → Create Notification (Manager)
  → Response to Admin
```

## 🔍 Logic Tính toán

### Tính thời gian cống hiến theo nhóm

```javascript
async function calculateContributionTime(personnelId, group) {
  const lichSuChucVu = await prisma.lichSuChucVu.findMany({
    where: { quan_nhan_id: personnelId },
    include: { ChucVu: true },
  });

  let totalMonths = 0;

  lichSuChucVu.forEach(ls => {
    const heSo = Number(ls.he_so_chuc_vu);
    const soThang = ls.so_thang || 0;

    if (group === '0.7' && heSo === 0.7) {
      totalMonths += soThang;
    } else if (group === '0.8' && heSo === 0.8) {
      totalMonths += soThang;
    } else if (group === '0.9-1.0' && heSo >= 0.9) {
      totalMonths += soThang;
    }
  });

  return formatTime(totalMonths);
}
```

## 📈 Thống kê

- **Tổng số khen thưởng**: Đếm từ bảng `KhenThuongCongHien`
- **Theo hạng**: Nhóm theo `danh_hieu`
- **Theo nhóm hệ số**: Phân tích từ `thoi_gian_nhom_*`
- **Theo năm**: Nhóm theo `nam`

## 🔗 Tài liệu Liên quan

- [Tài liệu API](../QLKT.md) - Phần 5.3: Position History
- [Hồ sơ Niên hạn](./../QLKT.md#62-tính-toán-lại-hồ-sơ) - Output từ hệ thống
- [Niên hạn](./03-NIEN-HAN.md) - So sánh với khen thưởng niên hạn
