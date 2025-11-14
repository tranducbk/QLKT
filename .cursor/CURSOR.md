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

## Role Permissions

- **SUPER_ADMIN**: Manage accounts + all ADMIN
- **ADMIN**: Manage all data
- **MANAGER**: Manage own unit only
- **USER**: View own profile only
