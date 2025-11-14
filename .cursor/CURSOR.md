# QLKT Project - Quick Reference for Cursor AI

> **Hướng dẫn nhanh cho Cursor AI khi làm việc với dự án QLKT**

## Quick Facts

- **Project**: QLKT (Quản lý Khen thưởng)
- **Frontend**: Next.js 14 + TypeScript + TailwindCSS
- **Backend**: Express + Prisma + PostgreSQL
- **ID Format**: `cuid()` - String VarChar(30) (không có dấu gạch ngang)

## Key Rules

1. **Database**: Luôn dùng Prisma, KHÔNG raw SQL
2. **ID**: Tất cả ID là `cuid()` String VarChar(30)
3. **Response Format**: `{ success: true/false, data/error, message? }`
4. **Auth**: Check role trước mọi thao tác
5. **Constants**: Notification types trong `BE-QLKT/src/constants/notificationTypes.js`

## Common Patterns

### Check Role
```javascript
const { role, userId } = req.user
if (role !== 'ADMIN') {
  return res.status(403).json({ success: false, error: 'Forbidden' })
}
```

### Prisma Query
```javascript
const data = await prisma.modelName.findMany({
  where: { field: value },
  include: { relation: true }
})
```

### Create Notification
```javascript
const { NOTIFICATION_TYPES, RESOURCE_TYPES } = require('../constants/notificationTypes')
await prisma.thongBao.create({
  data: {
    nguoi_nhan_id: userId,
    type: NOTIFICATION_TYPES.PROPOSAL_SUBMITTED,
    resource: RESOURCE_TYPES.PROPOSALS,
    tai_nguyen_id: resourceId,
    // ...
  }
})
```

## File Locations

- **Controllers**: `BE-QLKT/src/controllers/`
- **Services**: `BE-QLKT/src/services/`
- **Routes**: `BE-QLKT/src/routes/`
- **Schema**: `BE-QLKT/prisma/schema.prisma`
- **Constants**: `BE-QLKT/src/constants/`

## Important Models

- `QuanNhan` - Quân nhân (CCCD là unique)
- `TaiKhoan` - Tài khoản
- `ThongBao` - Thông báo
- `SystemLog` - Nhật ký hệ thống
- `BangDeXuat` - Đề xuất khen thưởng
- `TheoDoiKhenThuongDonVi` - Theo dõi khen thưởng đơn vị

## Proposal Types & Award Groups

### CA_NHAN_HANG_NAM
- **Nhóm 1**: CSTDCS, CSTT (đi với nhau)
- **Nhóm 2**: BKBQP, CSTDTQ (đi với nhau)
- ❌ Không mix Nhóm 1 với Nhóm 2

### NIEN_HAN
- **Nhóm 1**: HCCSVV_HANG_BA, HCCSVV_HANG_NHI, HCCSVV_HANG_NHAT (các hạng đi với nhau)
- **Nhóm 2**: HC_QKQT (riêng)
- **Nhóm 3**: KNC_VSNXD_QDNDVN (riêng)
- ❌ Chỉ chọn một nhóm trong một đề xuất
- 📊 Hiển thị "Tổng tháng" từ `ngay_nhap_ngu` đến hiện tại/xuất ngũ

### DON_VI_HANG_NAM
- ĐVQT, ĐVTT, BKBQP, BKTTCP
- ⚠️ Chỉ đề xuất cho năm sau (nam = năm hiện tại + 1)

## Role Permissions

- **SUPER_ADMIN**: Manage accounts + all ADMIN
- **ADMIN**: Manage all data + approve proposals
- **MANAGER**: 
  - Manage own unit personnel only
  - Edit personnel info in own unit
  - Create proposals (except DOT_XUAT)
- **USER**: View own profile only

## Validation Rules

- **Frontend**: Filter dropdown options based on selected group
- **Backend**: Validate on submit to prevent mixing groups
- **Manager Edit**: Only edit personnel in same `co_quan_don_vi_id` or `don_vi_truc_thuoc_id`
