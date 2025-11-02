# 🎯 QLKT - Hệ thống Quản lý Khen thưởng Học viện Khoa học Quân sự

## 📖 Tổng quan Dự án

Hệ thống quản lý khen thưởng toàn diện cho Học viện Khoa học Quân sự, bao gồm:
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express, PostgreSQL, Prisma ORM
- **Authentication**: JWT (Access Token + Refresh Token)
- **File Processing**: Excel Import/Export

## 🏗️ Cấu trúc Dự án

```
QLKT/
├── FE-QLKT/               # Frontend Next.js
│   ├── src/
│   │   ├── app/           # App Router
│   │   │   ├── (auth)/    # Auth routes (login)
│   │   │   ├── super-admin/
│   │   │   ├── admin/
│   │   │   ├── manager/
│   │   │   └── user/
│   │   ├── components/    # React components
│   │   │   ├── ui/        # shadcn/ui components
│   │   │   ├── layout/    # Layout components
│   │   │   └── ...
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities
│   │   ├── configs/       # Configurations
│   │   └── constants/     # Constants
│   └── public/            # Static assets
│
└── BE-QLKT/               # Backend Express
    ├── src/
    │   ├── controllers/   # Route handlers
    │   ├── services/      # Business logic
    │   ├── models/        # Prisma models
    │   ├── routes/        # API routes
    │   ├── middlewares/   # Express middlewares
    │   ├── helpers/       # Helper functions
    │   ├── configs/       # Database config
    │   └── scripts/       # Utility scripts
    └── prisma/            # Prisma schema
```

## 🔑 Phân quyền & Vai trò

### Vai trò Hệ thống
1. **SUPER_ADMIN**: Quản trị toàn hệ thống
   - Quản lý tài khoản
   - Tất cả quyền của Admin

2. **ADMIN**: Quản lý toàn bộ dữ liệu
   - Quản lý đơn vị, chức vụ, nhóm cống hiến
   - Quản lý quân nhân (tất cả đơn vị)
   - Import/Export Excel
   - Quản lý khen thưởng toàn hệ thống
   - Tính toán lại hồ sơ

3. **MANAGER**: Quản lý đơn vị được phân công
   - Quản lý quân nhân trong đơn vị
   - Nhập/Sửa khen thưởng cho đơn vị
   - Xem hồ sơ gợi ý

4. **USER**: Xem thông tin cá nhân
   - Xem thông tin cá nhân
   - Xem lịch sử khen thưởng
   - Xem hồ sơ gợi ý của mình

## 📊 Database Schema - 10 Bảng Chính

### 1. DonVi (Đơn vị)
```typescript
{
  id: number              // PK
  ma_don_vi: string       // Unique: "K1", "K2"
  ten_don_vi: string      // "Hệ 1", "Hệ 2"
  so_luong: number        // Tổng quân số
}
```

### 2. NhomCongHien (Nhóm cống hiến)
```typescript
{
  id: number              // PK
  ten_nhom: string        // Unique: "Nhóm 5", "Nhóm 6"
  mo_ta: string?          // Mô tả
}
```

### 3. ChucVu (Chức vụ)
```typescript
{
  id: number              // PK
  don_vi_id: number       // FK -> DonVi
  ten_chuc_vu: string     // "Hệ trưởng", "Học viên"
  is_manager: boolean     // true = Chỉ huy
  nhom_cong_hien_id: number? // FK -> NhomCongHien
}
```

### 4. QuanNhan (Quân nhân)
```typescript
{
  id: number              // PK
  cccd: string            // Unique - Khóa Import/Export
  ho_ten: string
  ngay_sinh: Date
  ngay_nhap_ngu: Date     // Tính khen thưởng niên hạn
  don_vi_id: number       // FK -> DonVi
  chuc_vu_id: number      // FK -> ChucVu
}
```

### 5. TaiKhoan (Tài khoản)
```typescript
{
  id: number              // PK
  quan_nhan_id: number?   // FK -> QuanNhan (null cho SUPER_ADMIN)
  username: string        // Unique
  password_hash: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'
}
```

### 6. LichSuChucVu (Lịch sử chức vụ) - INPUT
```typescript
{
  id: number              // PK
  quan_nhan_id: number    // FK -> QuanNhan
  chuc_vu_id: number      // FK -> ChucVu
  ngay_bat_dau: Date
  ngay_ket_thuc: Date?    // null = hiện tại
}
```

### 7. ThanhTichKhoaHoc (Thành tích khoa học) - INPUT
```typescript
{
  id: number              // PK
  quan_nhan_id: number    // FK -> QuanNhan
  nam: number
  loai: 'NCKH' | 'SKKH'
  mo_ta: string           // Tên đề tài
  status: 'APPROVED' | 'PENDING'
}
```

### 8. DanhHieuHangNam (Danh hiệu hằng năm) - INPUT & OUTPUT
```typescript
{
  id: number              // PK
  quan_nhan_id: number    // FK -> QuanNhan
  nam: number
  danh_hieu: 'CSTDCS' | 'CSTT' | 'KHONG_DAT'  // INPUT
  // OUTPUT fields:
  nhan_bkbqp: boolean
  so_quyet_dinh_bkbqp: string?
  nhan_cstdtq: boolean
  so_quyet_dinh_cstdtq: string?
}
```

### 9. HoSoNienHan (Hồ sơ Niên hạn) - OUTPUT
```typescript
{
  id: number              // PK
  quan_nhan_id: number    // FK -> QuanNhan (Unique - 1:1)
  // Huân chương chiến sỹ vẻ vang
  hccsvv_hang_ba_status: 'CHUA_DU' | 'DU_DIEU_KIEN' | 'DA_NHAN'
  hccsvv_hang_ba_ngay: Date?
  hccsvv_hang_nhi_status: 'CHUA_DU' | 'DU_DIEU_KIEN' | 'DA_NHAN'
  hccsvv_hang_nhi_ngay: Date?
  hccsvv_hang_nhat_status: 'CHUA_DU' | 'DU_DIEU_KIEN' | 'DA_NHAN'
  hccsvv_hang_nhat_ngay: Date?
  // Huân chương bảo vệ Tổ quốc
  hcbvtq_total_months: number
  hcbvtq_hang_ba_status: 'CHUA_DU' | 'DU_DIEU_KIEN' | 'DA_NHAN'
  hcbvtq_hang_nhi_status: 'CHUA_DU' | 'DU_DIEU_KIEN' | 'DA_NHAN'
  hcbvtq_hang_nhat_status: 'CHUA_DU' | 'DU_DIEU_KIEN' | 'DA_NHAN'
  goi_y: string?          // Gợi ý
}
```

### 10. HoSoHangNam (Hồ sơ Hằng năm) - OUTPUT
```typescript
{
  id: number              // PK
  quan_nhan_id: number    // FK -> QuanNhan (Unique - 1:1)
  tong_cstdcs: number     // Tổng CSTDCS
  tong_nckh: number       // Tổng NCKH/SKKH
  cstdcs_lien_tuc: number // Số năm CSTDCS liên tục
  du_dieu_kien_bkbqp: boolean
  du_dieu_kien_cstdtq: boolean
  goi_y: string?          // Gợi ý
}
```

## 🔗 API Endpoints Chính

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/change-password` - Đổi mật khẩu

### Accounts (SUPER_ADMIN)
- `GET /api/accounts` - Danh sách tài khoản
- `POST /api/accounts` - Tạo tài khoản
- `PUT /api/accounts/:id` - Cập nhật vai trò
- `POST /api/accounts/reset-password` - Reset mật khẩu
- `DELETE /api/accounts/:id` - Xóa tài khoản

### Units (ADMIN)
- `GET /api/units` - Danh sách đơn vị
- `POST /api/units` - Tạo đơn vị
- `PUT /api/units/:id` - Cập nhật đơn vị
- `DELETE /api/units/:id` - Xóa đơn vị

### Contribution Groups (ADMIN)
- `GET /api/contribution-groups` - Danh sách nhóm cống hiến
- `POST /api/contribution-groups` - Tạo nhóm
- `PUT /api/contribution-groups/:id` - Cập nhật nhóm
- `DELETE /api/contribution-groups/:id` - Xóa nhóm

### Positions (ADMIN, MANAGER)
- `GET /api/positions?unit_id=...` - Danh sách chức vụ theo đơn vị
- `POST /api/positions` - Tạo chức vụ
- `PUT /api/positions/:id` - Cập nhật chức vụ
- `DELETE /api/positions/:id` - Xóa chức vụ

### Personnel (ADMIN, MANAGER, USER)
- `GET /api/personnel` - Danh sách quân nhân
- `GET /api/personnel/:id` - Chi tiết quân nhân
- `POST /api/personnel` - Thêm quân nhân
- `PUT /api/personnel/:id` - Cập nhật quân nhân
- `POST /api/personnel/import` - Import Excel
- `GET /api/personnel/export` - Export Excel

### Annual Rewards (ADMIN, MANAGER, USER)
- `GET /api/annual-rewards?personnel_id=...` - Lịch sử danh hiệu
- `POST /api/annual-rewards` - Thêm danh hiệu
- `PUT /api/annual-rewards/:id` - Cập nhật danh hiệu
- `DELETE /api/annual-rewards/:id` - Xóa danh hiệu

### Scientific Achievements (ADMIN, MANAGER, USER)
- `GET /api/scientific-achievements?personnel_id=...` - Lịch sử NCKH
- `POST /api/scientific-achievements` - Thêm NCKH
- `PUT /api/scientific-achievements/:id` - Cập nhật NCKH
- `DELETE /api/scientific-achievements/:id` - Xóa NCKH

### Position History (ADMIN, MANAGER, USER)
- `GET /api/position-history?personnel_id=...` - Lịch sử chức vụ
- `POST /api/position-history` - Thêm lịch sử
- `PUT /api/position-history/:id` - Cập nhật lịch sử
- `DELETE /api/position-history/:id` - Xóa lịch sử

### Profiles (ADMIN, MANAGER, USER)
- `GET /api/profiles/annual/:personnel_id` - Hồ sơ hằng năm
- `GET /api/profiles/service/:personnel_id` - Hồ sơ niên hạn
- `POST /api/profiles/recalculate/:personnel_id` - Tính toán lại
- `POST /api/profiles/recalculate-all` - Tính toán lại tất cả

## 🎨 Frontend Routing

```
/                         → Landing page (public)
/login                    → Login page
/super-admin/
  ├── dashboard           → Dashboard
  └── accounts            → Quản lý tài khoản
/admin/
  ├── dashboard           → Dashboard
  ├── units               → Quản lý đơn vị
  ├── positions           → Quản lý chức vụ
  ├── contribution-groups → Quản lý nhóm cống hiến
  ├── personnel           → Quản lý quân nhân
  │   ├── import          → Import Excel
  │   ├── export          → Export Excel
  │   └── [id]
  │       ├── annual-rewards       → Danh hiệu hằng năm
  │       ├── scientific-achievements → Thành tích khoa học
  │       └── position-history     → Lịch sử chức vụ
  └── reports             → Báo cáo thống kê
/manager/
  ├── dashboard           → Dashboard
  ├── personnel           → Quản lý quân nhân đơn vị
  └── reports             → Báo cáo đơn vị
/user/
  ├── dashboard           → Dashboard
  └── profile             → Thông tin cá nhân
```

## 💡 Business Logic - "Bộ não" Tính toán

### Khen thưởng Niên hạn (Service Years)
**Huân chương Chiến sỹ Vẻ vang:**
- Hạng Ba: 10 năm
- Hạng Nhì: 15 năm
- Hạng Nhất: 20 năm

**Huân chương Bảo vệ Tổ quốc (Cống hiến):**
Tính từ LichSuChucVu dựa trên nhóm cống hiến:
- Nhóm 5: 1x tháng
- Nhóm 6: 1.2x tháng
- Nhóm 7: 1.5x tháng
- ...

Điều kiện:
- Hạng Ba: 180 tháng
- Hạng Nhì: 240 tháng
- Hạng Nhất: 300 tháng

### Khen thưởng Hằng năm (Annual)
**Bằng khen BQP:**
- Đủ 5 năm CSTDCS liên tục

**CSTD Toàn quân:**
- Đủ 10 năm CSTDCS liên tục
- Có ít nhất 1 NCKH hoặc SKKH được duyệt

## 🛠️ Tech Stack Chi tiết

### Frontend
- **Framework**: Next.js 14.2.4 (App Router)
- **React**: 18
- **TypeScript**: 5.9.3
- **Styling**: TailwindCSS 3.4.18
- **UI Components**: shadcn/ui, Radix UI
- **Icons**: Lucide React, Ant Design Icons
- **Forms**: React Hook Form + Zod
- **State**: Redux Toolkit
- **Date**: date-fns, dayjs
- **HTTP**: Axios
- **Charts**: Chart.js

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT (jsonwebtoken)
- **Excel**: xlsx, fast-csv
- **File Upload**: Multer
- **Validation**: Express-validator
- **Password**: bcrypt

## 📝 Code Style & Conventions

### TypeScript/JavaScript
- Use `const` over `let`, avoid `var`
- Arrow functions for callbacks
- Async/await instead of promise chains
- Optional chaining `?.` and nullish coalescing `??`
- Destructuring where appropriate

### React
- Functional components with hooks
- Custom hooks for reusable logic
- Proper error and loading states
- Optimize with `useMemo` and `useCallback` when needed

### Naming Conventions
- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserData`)

### API Response Format
```typescript
// Success
{
  success: true,
  data: {...},
  message?: string
}

// Error
{
  success: false,
  error: string,
  details?: any
}
```

## 🔒 Security

- JWT Authentication với Access Token (15m) + Refresh Token (7d)
- Password hashing với bcrypt
- Input validation với express-validator
- Role-based access control (RBAC)
- CORS configuration
- SQL injection prevention (Prisma ORM)
- XSS prevention

## 🚀 Development Workflow

### Setup
```bash
# Frontend
cd FE-QLKT
npm install
npm run dev

# Backend
cd BE-QLKT
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Common Commands
```bash
# Build
npm run build

# Lint
npm run lint

# Prisma Studio
npx prisma studio

# Database migration
npx prisma migrate dev
```

## 📦 Key Files

### Frontend
- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Landing page
- `src/lib/axios.ts` - Axios instance with interceptors
- `src/hooks/useAuth.ts` - Authentication hook
- `tailwind.config.ts` - Tailwind configuration

### Backend
- `src/index.js` - Express server
- `src/routes/` - API routes
- `src/controllers/` - Request handlers
- `src/services/` - Business logic
- `src/middlewares/auth.js` - JWT middleware
- `prisma/schema.prisma` - Database schema

## 🎯 Important Notes

1. **CCCD là khóa chính** cho Import/Export Excel
2. **ngay_nhap_ngu** dùng để tính khen thưởng niên hạn
3. **LichSuChucVu** là INPUT cho tính toán cống hiến
4. **HoSoNienHan** và **HoSoHangNam** là OUTPUT (chỉ đọc từ phía người dùng)
5. **DanhHieuHangNam** vừa là INPUT (danh hiệu CSTDCS/CSTT) vừa là OUTPUT (BKBQP, CSTDTQ)
6. **Role hierarchy**: SUPER_ADMIN > ADMIN > MANAGER > USER
7. **Manager** chỉ quản lý đơn vị của mình (determined by personnel_id -> don_vi_id)

## 🐛 Common Issues & Solutions

1. **Token expired**: Sử dụng refresh token endpoint
2. **CORS errors**: Check backend CORS configuration
3. **Prisma errors**: Run `npx prisma generate`
4. **Import Excel fails**: Check CCCD format và validate data
5. **Permission denied**: Verify user role và check middleware

## 📚 Related Documentation

- Xem `QLKT.md` cho API documentation đầy đủ
- Xem `.cursorrules` cho code style rules
- Xem `IMPLEMENTATION_COMPLETE.md` cho implementation details
