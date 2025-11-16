# 🤖 Tài liệu cho Claude AI - Hệ thống QLKT

## 📋 Tổng quan Dự án

**QLKT** (Quản lý Khen thưởng) là hệ thống quản lý khen thưởng cho Học viện Khoa học Quân sự.

### Tech Stack

- **Frontend**: Next.js 14 + React 18 + TypeScript + TailwindCSS + shadcn/ui + Ant Design
- **Backend**: Node.js + Express + PostgreSQL + Prisma ORM
- **Auth**: JWT (Access Token + Refresh Token)

### Cấu trúc Thư mục

```
QLKT/
├── FE-QLKT/          # Frontend (Next.js)
├── BE-QLKT/          # Backend (Express)
├── Document/         # 📚 Tài liệu chi tiết từng loại khen thưởng
└── .claude/         # Tài liệu này
```

## 👥 Phân quyền (Roles)

1. **SUPER_ADMIN**: Quản lý tài khoản + tất cả quyền ADMIN
2. **ADMIN**: Quản lý toàn bộ dữ liệu (đơn vị, chức vụ, quân nhân, khen thưởng)
3. **MANAGER**: Quản lý dữ liệu đơn vị của mình (chỉ quân nhân trong đơn vị)
4. **USER**: Chỉ xem thông tin cá nhân

## 🏆 Các Loại Khen thưởng

### 1. Cá nhân Hằng năm (CA_NHAN_HANG_NAM)

- **Danh hiệu**: CSTDCS, CSTT, BKBQP, CSTDTQ
- **Điều kiện**:
  - BKBQP: 5 năm CSTDCS liên tục
  - CSTDTQ: 3 năm CSTDCS + NCKH mỗi năm + BKBQP
- **Tài liệu**: `Document/01-CA-NHAN-HANG-NAM.md`

### 2. Đơn vị Hằng năm (DON_VI_HANG_NAM)

- **Danh hiệu**: ĐVQT, ĐVTT, BKBQP, BKTTCP
- **Tài liệu**: `Document/02-DON-VI-HANG-NAM.md`

### 3. Niên hạn (NIEN_HAN)

- **Danh hiệu**: HCCSVV (Hạng Ba, Nhì, Nhất)
- **Điều kiện**: Dựa trên thời gian phục vụ
- **Tài liệu**: `Document/03-NIEN-HAN.md`

### 4. Cống hiến (CONG_HIEN)

- **Danh hiệu**: HCBVTQ (Hạng Ba, Nhì, Nhất)
- **Điều kiện**: Dựa trên hệ số chức vụ (3 nhóm: 0.7, 0.8, 0.9-1.0)
- **Tài liệu**: `Document/04-CONG-HIEN.md`

### 5. Huân chương Quân kỳ Quyết thắng (HC_QKQT)

- **Điều kiện**: ≥ 25 năm phục vụ (không phân biệt nam/nữ)
- **Tài liệu**: `Document/05-HC-QKQT.md`

### 6. Kỷ niệm chương VSNXD QĐNDVN (KNC_VSNXD_QDNDVN)

- **Điều kiện**: Nữ ≥ 20 năm, Nam ≥ 25 năm
- **Tài liệu**: `Document/06-KNC-VSNXD-QDNDVN.md`

### 7. Đột xuất (DOT_XUAT)

- **Quyền**: Chỉ ADMIN
- **Tài liệu**: `Document/07-DOT-XUAT.md`

### 8. Thành tích Khoa học (NCKH)

- **Loại**: NCKH (Đề tài), SKKH (Sáng kiến)
- **Trạng thái**: APPROVED, PENDING
- **Tài liệu**: `Document/08-THANH-TICH-KHOA-HOC.md`

## 🗄️ Database Schema (Prisma)

### Bảng Chính

1. **QuanNhan**: Quân nhân

   - `id` (CUID), `cccd` (Unique), `ho_ten`, `cap_bac`, `ngay_nhap_ngu`, `ngay_xuat_ngu`
   - Relations: `DonViTrucThuoc`, `CoQuanDonVi`, `ChucVu`

2. **DanhHieuHangNam**: Danh hiệu hằng năm (INPUT + OUTPUT)

   - `quan_nhan_id`, `nam`, `danh_hieu` (CSTDCS, CSTT)
   - `nhan_bkbqp`, `nhan_cstdtq` (OUTPUT)

3. **ThanhTichKhoaHoc**: Thành tích khoa học (INPUT)

   - `quan_nhan_id`, `nam`, `loai` (NCKH, SKKH), `mo_ta`, `status`

4. **LichSuChucVu**: Lịch sử chức vụ (INPUT)

   - `quan_nhan_id`, `chuc_vu_id`, `ngay_bat_dau`, `ngay_ket_thuc`, `he_so_chuc_vu`

5. **HoSoHangNam**: Hồ sơ hằng năm (OUTPUT)

   - `quan_nhan_id` (Unique), `tong_CSTĐCS`, `tong_nckh`, `CSTĐCS_lien_tuc`
   - `du_dieu_kien_bkbqp`, `du_dieu_kien_cstdtq`

6. **HoSoNienHan**: Hồ sơ niên hạn (OUTPUT)

   - `quan_nhan_id` (Unique), `hccsvv_*_status`, `hcbvtq_total_months`

7. **BangDeXuat**: Đề xuất khen thưởng
   - `loai_de_xuat`, `status` (PENDING, APPROVED, REJECTED)
   - `data_danh_hieu` (JSON), `data_thanh_tich` (JSON), `data_nien_han` (JSON), `data_cong_hien` (JSON)

## 🔄 Quy trình Đề xuất

1. **Manager** tạo đề xuất → `status = PENDING`
2. **Admin** xem và chỉnh sửa
3. **Admin** phê duyệt → `status = APPROVED`
4. Hệ thống tự động cập nhật các bảng OUTPUT

## 📡 API Patterns

### Response Format

```javascript
// Success
{ success: true, data: {...}, message?: string }

// Error
{ success: false, error: string, details?: any }
```

### Authentication

- Header: `Authorization: Bearer <access_token>`
- Access token: 15 phút
- Refresh token: Dùng để lấy access token mới

## 🔍 Logic Quan trọng

### Tính CSTDCS liên tục

- Tính từ năm hiện tại trở về trước
- Ngắt khi gặp năm không có CSTDCS

### Tính CSTDTQ

- 3 năm CSTDCS liên tục (từ đầu chuỗi)
- Mỗi năm đều có NCKH (APPROVED)
- Có BKBQP trong cụm 3 năm
- Mỗi cụm 3 năm là độc lập

### Tính Cống hiến

- Tính theo 3 nhóm hệ số: 0.7, 0.8, 0.9-1.0
- Tổng thời gian giữ chức vụ trong mỗi nhóm

### Validation Đề xuất

- HC_QKQT: ≥ 25 năm (không phân biệt nam/nữ)
- KNC_VSNXD_QDNDVN: Nữ ≥ 20 năm, Nam ≥ 25 năm
- DOT_XUAT: Chỉ ADMIN

## 📚 Tài liệu Tham khảo

- **API Docs**: `QLKT.md`
- **Cheatsheet**: `CHEATSHEET.md`
- **Chi tiết từng loại**: `Document/*.md`
- **Proposal API**: `BE-QLKT/PROPOSAL_API_GUIDE.md`

## ⚠️ Lưu ý Quan trọng

1. **Dữ liệu trong dataJSON**: Khi tạo đề xuất, lưu `cap_bac` và `chuc_vu` vào dataJSON
2. **Hiển thị từ dataJSON**: Khi xem đề xuất, chỉ hiển thị từ dataJSON, không lấy từ personnel hiện tại
3. **Prisma**: Luôn dùng Prisma, không dùng raw SQL
4. **Role-based**: Luôn kiểm tra role trước khi thực hiện action
5. **Validation**: Validate input và điều kiện nghiệp vụ

## 🎯 Code Conventions

- **Backend**: JavaScript (ES6+), Express, Prisma
- **Frontend**: TypeScript, React Hooks, Next.js App Router
- **Formatting**: Prettier (2 spaces, single quotes, semicolons)
- **Naming**: camelCase cho variables, PascalCase cho components
