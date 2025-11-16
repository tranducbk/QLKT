# 🤖 Tài liệu cho Cursor AI - Hệ thống QLKT

## 📋 Quick Overview

**QLKT** - Hệ thống Quản lý Khen thưởng cho Học viện Khoa học Quân sự.

- **Frontend**: Next.js 14 + TypeScript + Ant Design
- **Backend**: Express + PostgreSQL + Prisma
- **Auth**: JWT (Access + Refresh tokens)

## 🎯 Common Tasks

### Add New Award Type
1. Tạo file tài liệu trong `Document/`
2. Thêm validation trong `BE-QLKT/src/services/proposal.service.js`
3. Thêm UI trong `FE-QLKT/src/app/manager/proposals/create/`

### Add New API Endpoint
```javascript
// Backend: src/routes/featureRoutes.js
router.get('/', authenticate, controller.getAll);

// Backend: src/controllers/featureController.js
exports.getAll = async (req, res) => {
  const { role, userId } = req.user;
  const data = await service.getAll(role, userId);
  res.json({ success: true, data });
};

// Frontend: src/lib/api-client.ts
export const getFeatures = async () => {
  return await apiClient.get('/feature');
};
```

## 🏆 Award Types

| Loại | Mã | Điều kiện | File Tài liệu |
|------|-----|-----------|---------------|
| Cá nhân Hằng năm | CA_NHAN_HANG_NAM | CSTDCS, CSTT, BKBQP, CSTDTQ | `Document/01-CA-NHAN-HANG-NAM.md` |
| Đơn vị Hằng năm | DON_VI_HANG_NAM | ĐVQT, ĐVTT, BKBQP, BKTTCP | `Document/02-DON-VI-HANG-NAM.md` |
| Niên hạn | NIEN_HAN | HCCSVV (theo thời gian) | `Document/03-NIEN-HAN.md` |
| Cống hiến | CONG_HIEN | HCBVTQ (theo hệ số chức vụ) | `Document/04-CONG-HIEN.md` |
| HC Quân kỳ | HC_QKQT | ≥ 25 năm | `Document/05-HC-QKQT.md` |
| Kỷ niệm chương | KNC_VSNXD_QDNDVN | Nữ ≥ 20, Nam ≥ 25 năm | `Document/06-KNC-VSNXD-QDNDVN.md` |
| Đột xuất | DOT_XUAT | Chỉ ADMIN | `Document/07-DOT-XUAT.md` |
| Thành tích KH | NCKH | NCKH, SKKH | `Document/08-THANH-TICH-KHOA-HOC.md` |

## 📁 File Locations

### Backend
- **Controllers**: `BE-QLKT/src/controllers/`
- **Services**: `BE-QLKT/src/services/`
- **Routes**: `BE-QLKT/src/routes/`
- **Models**: `BE-QLKT/src/models/` (Prisma)
- **Schema**: `BE-QLKT/prisma/schema.prisma`

### Frontend
- **Pages**: `FE-QLKT/src/app/`
- **Components**: `FE-QLKT/src/components/`
- **API Client**: `FE-QLKT/src/lib/api-client.ts`
- **Constants**: `FE-QLKT/src/constants/`

## 🔑 Key Concepts

### Proposal Flow
1. Manager tạo đề xuất → `PENDING`
2. Admin xem/chỉnh sửa
3. Admin phê duyệt → `APPROVED`
4. Auto-update OUTPUT tables

### Data Storage
- **INPUT**: `DanhHieuHangNam`, `ThanhTichKhoaHoc`, `LichSuChucVu`
- **OUTPUT**: `HoSoHangNam`, `HoSoNienHan` (tự động tính)
- **Proposals**: `BangDeXuat` với `dataJSON`

### Important Rules
- ✅ Luôn dùng Prisma (không raw SQL)
- ✅ Validate role trước mọi action
- ✅ Lưu `cap_bac`/`chuc_vu` vào dataJSON khi tạo đề xuất
- ✅ Hiển thị từ dataJSON, không lấy từ personnel hiện tại
- ✅ Response format: `{ success: boolean, data?: any, error?: string }`

## 🚫 DON'T

- ❌ Không dùng raw SQL queries
- ❌ Không bỏ qua role validation
- ❌ Không lấy cap_bac/chuc_vu từ personnel hiện tại khi xem đề xuất
- ❌ Không hardcode credentials
- ❌ Không commit sensitive data

## ✅ DO

- ✅ Dùng Prisma cho tất cả DB operations
- ✅ Validate input và điều kiện nghiệp vụ
- ✅ Lưu đầy đủ thông tin vào dataJSON
- ✅ Kiểm tra quyền trước mọi action
- ✅ Dùng environment variables

## 📚 Documentation

- **API**: `QLKT.md`
- **Cheatsheet**: `CHEATSHEET.md`
- **Award Details**: `Document/*.md`
- **Index**: `Document/DOCUMENTATION_INDEX.md`

## 🔍 Quick Reference

### Check Award Eligibility
```javascript
// BKBQP: 5 years CSTDCS
const cstdcsLienTuc = calculateContinuousCSTDCS(danhHieuList, nam);
if (cstdcsLienTuc < 5) throw new Error('Chưa đủ 5 năm');

// CSTDTQ: 3 years CSTDCS + NCKH each year + BKBQP
const hasNCKH = thanhTichList.some(tt => tt.nam === nam && tt.status === 'APPROVED');
```

### Calculate Service Time
```javascript
const months = (endYear - startYear) * 12 + (endMonth - startMonth);
const years = Math.floor(months / 12);
```

### Proposal Data Structure
```javascript
{
  personnel_id: string,
  ho_ten: string,
  nam: number,
  danh_hieu: string,
  cap_bac: string,  // Lưu vào dataJSON
  chuc_vu: string,  // Lưu vào dataJSON
  thoi_gian?: { total_months, years, months, display }
}
```
