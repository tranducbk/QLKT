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
- Đề xuất và phê duyệt khen thưởng
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
- Nhập/Sửa khen thưởng cho đơn vị
- Xem hồ sơ gợi ý
- Tạo đề xuất khen thưởng

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

## Important Notes

1. **Database**: Luôn dùng Prisma, KHÔNG dùng raw SQL
2. **ID System**: Tất cả ID là `cuid()` String VarChar(30)
3. **INPUT tables**: Chỉ nhập dữ liệu vào LichSuChucVu, ThanhTichKhoaHoc, DanhHieuHangNam
4. **OUTPUT tables**: HoSoNienHan, HoSoHangNam - chỉ đọc, tính toán qua endpoint `/api/profiles/recalculate`
5. **CCCD**: Primary key cho Import/Export operations
6. **Notification Types**: Định nghĩa trong `BE-QLKT/src/constants/notificationTypes.js`

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
