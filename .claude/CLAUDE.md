# QLKT Project - Full Documentation for Claude AI

> **Tài liệu đầy đủ về dự án QLKT để Claude AI có thể hiểu và hỗ trợ phát triển**

## Project Overview

**QLKT** (Quản lý Khen thưởng) là hệ thống quản lý khen thưởng toàn diện cho Học viện Khoa học Quân sự.

### Tech Stack
- **Frontend**: Next.js 14 + React 18 + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Node.js + Express + PostgreSQL + Prisma
- **Auth**: JWT (Access Token + Refresh Token)

### Key Features
- Quản lý quân nhân và đơn vị
- Quản lý khen thưởng (danh hiệu, thành tích khoa học)
- Tính toán tự động hồ sơ khen thưởng
- Đề xuất và phê duyệt khen thưởng với validation theo nhóm danh hiệu
- Hiển thị tổng thời gian phục vụ (tổng tháng) cho đề xuất Niên hạn
- Hệ thống thông báo
- Nhật ký hệ thống

## Database Schema

### ID System
- **Tất cả ID**: Sử dụng `cuid()` - chuỗi không có dấu gạch ngang
- **Kiểu dữ liệu**: `String @db.VarChar(30)`
- **Ví dụ**: `clxx90y9w000108l0chox5y0x`

### Core Models

1. **CoQuanDonVi** - Cơ quan đơn vị
2. **DonViTrucThuoc** - Đơn vị trực thuộc
3. **ChucVu** - Chức vụ
4. **QuanNhan** - Quân nhân (CCCD là unique key)
5. **TaiKhoan** - Tài khoản

### Input Models (Dữ liệu đầu vào)

6. **LichSuChucVu** - Lịch sử chức vụ (tính cống hiến)
7. **ThanhTichKhoaHoc** - Thành tích NCKH/SKKH
8. **DanhHieuHangNam** - Danh hiệu hằng năm (CSTDCS/CSTT)

### Output Models (Dữ liệu đầu ra - chỉ đọc)

9. **HoSoNienHan** - Hồ sơ khen thưởng niên hạn
10. **HoSoHangNam** - Hồ sơ khen thưởng hằng năm

### System Models

11. **SystemLog** - Nhật ký hệ thống
12. **ThongBao** - Thông báo
13. **BangDeXuat** - Đề xuất khen thưởng
14. **TheoDoiKhenThuongDonVi** - Theo dõi khen thưởng đơn vị

## Role-Based Access Control

### SUPER_ADMIN
- Quản lý tài khoản hệ thống
- Tất cả quyền của ADMIN

### ADMIN
- Quản lý đơn vị, chức vụ
- Quản lý toàn bộ quân nhân
- Import/Export dữ liệu Excel
   - Quản lý khen thưởng toàn hệ thống
   - Tính toán lại hồ sơ
- Phê duyệt đề xuất từ Manager

### MANAGER
- Quản lý quân nhân trong đơn vị được phân công
   - Chỉnh sửa thông tin quân nhân trong đơn vị của mình
   - Nhập/Sửa khen thưởng cho đơn vị
   - Xem hồ sơ gợi ý
- Tạo đề xuất khen thưởng (trừ DOT_XUAT)
- Validation: Manager chỉ có thể chỉnh sửa quân nhân trong cùng cơ quan đơn vị hoặc đơn vị trực thuộc của mình

### USER
   - Xem thông tin cá nhân
   - Xem lịch sử khen thưởng
   - Xem hồ sơ gợi ý của mình

## API Patterns

### Response Format
```javascript
// Success
{ success: true, data: {...}, message?: string }

// Error
{ success: false, error: string, details?: any }
```

### Authentication
- All protected routes require: `Authorization: Bearer <access_token>`
- Access token expires in 15 minutes
- Use refresh token to get new access token

## Code Patterns

### Backend Controller
```javascript
exports.controllerName = async (req, res) => {
  try {
    const { role, userId } = req.user
    const data = await service.method(role, userId, req.body)
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}
```

### Frontend Component
```tsx
export default function ComponentName() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch data
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage />
  return <MainContent />
}
```

## Proposal Types & Award Groups

### Loại đề xuất

1. **CA_NHAN_HANG_NAM** - Cá nhân Hằng năm
   - **Nhóm 1**: CSTDCS, CSTT (đi với nhau)
   - **Nhóm 2**: BKBQP, CSTDTQ (đi với nhau)
   - **Validation**: Không cho phép mix Nhóm 1 với Nhóm 2 trong cùng một đề xuất

2. **DON_VI_HANG_NAM** - Đơn vị Hằng năm
   - ĐVQT, ĐVTT, BKBQP, BKTTCP
   - Chỉ đề xuất cho năm sau (nam = năm hiện tại + 1)

3. **NIEN_HAN** - Niên hạn
   - **Nhóm 1**: HCCSVV_HANG_BA, HCCSVV_HANG_NHI, HCCSVV_HANG_NHAT (các hạng đi với nhau)
   - **Nhóm 2**: HC_QKQT (riêng)
   - **Nhóm 3**: KNC_VSNXD_QDNDVN (riêng)
   - **Validation**: Chỉ cho phép chọn một nhóm trong một đề xuất
   - **Hiển thị**: Cột "Tổng tháng" tính từ ngày nhập ngũ đến hiện tại (hoặc ngày xuất ngũ)

4. **CONG_HIEN** - Cống hiến
   - HCBVTQ_HANG_BA, HCBVTQ_HANG_NHI, HCBVTQ_HANG_NHAT

5. **DOT_XUAT** - Đột xuất
   - Chỉ Admin mới có quyền đề xuất

6. **NCKH** - Nghiên cứu khoa học
   - Đề tài khoa học (NCKH) hoặc Sáng kiến khoa học (SKKH)

### Validation Rules

- **Frontend**: Filter dropdown options dựa trên nhóm đã chọn
- **Backend**: Validate khi submit để đảm bảo không mix các nhóm
- **Error Message**: Yêu cầu tách thành các đề xuất riêng cho từng nhóm

## Important Notes

1. **Database**: Luôn dùng Prisma, KHÔNG dùng raw SQL
2. **ID System**: Tất cả ID là `cuid()` String VarChar(30)
3. **INPUT tables**: Chỉ nhập dữ liệu vào LichSuChucVu, ThanhTichKhoaHoc, DanhHieuHangNam
4. **OUTPUT tables**: HoSoNienHan, HoSoHangNam - chỉ đọc, tính toán qua endpoint `/api/profiles/recalculate`
5. **CCCD**: Primary key cho Import/Export operations
6. **Notification Types**: Định nghĩa trong `BE-QLKT/src/constants/notificationTypes.js`
7. **Award Groups**: Mỗi loại đề xuất có các nhóm danh hiệu riêng, không được mix các nhóm trong cùng một đề xuất
8. **Total Months Calculation**: Tính từ `ngay_nhap_ngu` đến hiện tại (nếu chưa xuất ngũ) hoặc đến `ngay_xuat_ngu` (nếu đã xuất ngũ)

## File Structure

- `BE-QLKT/src/controllers/` - Request handlers
- `BE-QLKT/src/services/` - Business logic
- `BE-QLKT/src/routes/` - API routes
- `BE-QLKT/src/helpers/` - Helper functions
- `BE-QLKT/src/constants/` - Constants (notification types, etc.)
- `BE-QLKT/prisma/schema.prisma` - Database schema
- `FE-QLKT/src/app/` - Next.js pages
- `FE-QLKT/src/components/` - React components

## Common Tasks

### Thêm API endpoint mới
1. Tạo controller trong `BE-QLKT/src/controllers/`
2. Tạo service trong `BE-QLKT/src/services/`
3. Thêm route trong `BE-QLKT/src/routes/`
4. Kiểm tra authentication và authorization

### Thêm notification type mới
1. Thêm vào `BE-QLKT/src/constants/notificationTypes.js`
2. Sử dụng constant trong `BE-QLKT/src/helpers/notificationHelper.js`

### Thay đổi database schema
1. Cập nhật `BE-QLKT/prisma/schema.prisma`
2. Chạy `npx prisma db push` hoặc `npx prisma migrate dev`
3. Chạy `npx prisma generate`

## Proposal Submission Flow

### Multi-step Form (Manager)
1. **Step 1**: Chọn loại đề xuất
2. **Step 2**: Chọn quân nhân/đơn vị
   - Hiển thị "Ngày nhập ngũ", "Ngày xuất ngũ", "Tổng tháng" cho NIEN_HAN
3. **Step 3**: Chọn danh hiệu
   - Dropdown tự động filter theo nhóm đã chọn
   - Validation ngăn chặn mix các nhóm
4. **Step 4**: Upload files (optional)
5. **Step 5**: Review & Submit
   - Hiển thị "Tổng tháng" trong bảng review cho NIEN_HAN

### Data Structure

#### CA_NHAN_HANG_NAM
```json
{
  "personnel_id": "string",
  "ho_ten": "string",
  "nam": "number",
  "danh_hieu": "CSTDCS" | "CSTT" | "BKBQP" | "CSTDTQ",
  "co_quan_don_vi": { "id": "...", "ten_co_quan_don_vi": "...", "ma_co_quan_don_vi": "..." } | null,
  "don_vi_truc_thuoc": { "id": "...", "ten_don_vi": "...", "ma_don_vi": "...", "co_quan_don_vi": {...} } | null
}
```

#### NIEN_HAN
```json
{
  "personnel_id": "string",
  "ho_ten": "string",
  "nam": "number",
  "danh_hieu": "HCCSVV_HANG_BA" | "HCCSVV_HANG_NHI" | "HCCSVV_HANG_NHAT" | "HC_QKQT" | "KNC_VSNXD_QDNDVN",
  "so_quyet_dinh": "string" | null,
  "file_quyet_dinh": "string" | null,
  "co_quan_don_vi": {...} | null,
  "don_vi_truc_thuoc": {...} | null
}
```

#### DON_VI_HANG_NAM
```json
{
  "don_vi_id": "string",
  "don_vi_type": "CO_QUAN_DON_VI" | "DON_VI_TRUC_THUOC",
  "ten_don_vi": "string",
  "ma_don_vi": "string",
  "nam": "number",
  "danh_hieu": "ĐVQT" | "ĐVTT" | "BKBQP" | "BKTTCP",
  "so_quyet_dinh": "string" | null,
  "file_quyet_dinh": "string" | null,
  "co_quan_don_vi_cha": {...} | null
}
```

## UI Components

### Step2SelectPersonnel
- Hiển thị "Ngày nhập ngũ", "Ngày xuất ngũ", "Tổng tháng" cho `proposalType === 'NIEN_HAN'`
- Format tổng tháng: năm ở trên (in đậm), tháng nhỏ bên dưới (màu xám, font 12px)

### Step3SetTitles
- Filter dropdown options dựa trên nhóm đã chọn
- Validation khi chọn danh hiệu để ngăn chặn mix các nhóm
- Hiển thị "Tổng tháng" cho NIEN_HAN

### Review Step (Step 5)
- Hiển thị "Tổng tháng" trong bảng review cho NIEN_HAN
- Validation: Không cho phép submit nếu thiếu số quyết định
