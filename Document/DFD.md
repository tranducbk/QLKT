# 📊 Sơ đồ DFD (Data Flow Diagram) - Hệ thống QLKT

## 📋 Mục lục

1. [DFD Mức 0 (Context Diagram)](#dfd-mức-0-context-diagram)
2. [DFD Mức 1 (Level 1 DFD)](#dfd-mức-1-level-1-dfd)
3. [Chú thích Ký hiệu](#chú-thích-ký-hiệu)
4. [Mô tả Chi tiết các Quá trình](#mô-tả-chi-tiết-các-quá-trình)

---

## 🎯 DFD Mức 0 (Context Diagram)

### Mô tả

Sơ đồ DFD mức 0 mô tả hệ thống QLKT như một quá trình duy nhất và các tác nhân ngoài tương tác với hệ thống.

### Sơ đồ

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    HỆ THỐNG QLKT                               │
│              (Quản lý Khen thưởng)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
    ┌─────────┐         ┌─────────┐         ┌─────────┐
    │ SUPER   │         │ ADMIN   │         │ MANAGER │
    │ ADMIN   │         │         │         │         │
    └─────────┘         └─────────┘         └─────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
    ┌─────────┐         ┌─────────┐         ┌─────────┐
    │  USER   │         │ Database│         │  Files  │
    │         │         │(PostgreSQL)       │  (PDF)  │
    └─────────┘         └─────────┘         └─────────┘
```

### Luồng Dữ liệu

#### 1. SUPER_ADMIN ↔ Hệ thống QLKT

- **Vào hệ thống:**

  - Thông tin đăng nhập (username, password)
  - Yêu cầu quản lý tài khoản (tạo, sửa, xóa, gán quyền)
  - Yêu cầu xem nhật ký hệ thống

- **Ra khỏi hệ thống:**
  - Thông tin tài khoản
  - Danh sách tài khoản
  - Nhật ký hệ thống
  - Thông báo kết quả

#### 2. ADMIN ↔ Hệ thống QLKT

- **Vào hệ thống:**

  - Thông tin đăng nhập
  - Yêu cầu quản lý dữ liệu cơ bản (đơn vị, chức vụ, nhóm cống hiến)
  - Yêu cầu quản lý quân nhân (CRUD, import/export)
  - Yêu cầu phê duyệt/từ chối đề xuất
  - Yêu cầu tính toán lại hồ sơ
  - Yêu cầu xem báo cáo, thống kê
  - File Excel (import)

- **Ra khỏi hệ thống:**
  - Danh sách đơn vị, chức vụ, nhóm cống hiến
  - Danh sách quân nhân
  - Danh sách đề xuất
  - Hồ sơ gợi ý
  - Báo cáo, thống kê
  - File Excel (export)
  - Thông báo kết quả

#### 3. MANAGER ↔ Hệ thống QLKT

- **Vào hệ thống:**

  - Thông tin đăng nhập
  - Yêu cầu quản lý quân nhân trong đơn vị (sửa, xem)
  - Yêu cầu tạo đề xuất khen thưởng
  - Yêu cầu xem hồ sơ gợi ý
  - Yêu cầu xem khen thưởng đã phê duyệt
  - File đính kèm đề xuất (PDF)

- **Ra khỏi hệ thống:**
  - Danh sách quân nhân trong đơn vị
  - Danh sách đề xuất đã tạo
  - Hồ sơ gợi ý
  - Khen thưởng đã phê duyệt
  - Thông báo kết quả

#### 4. USER ↔ Hệ thống QLKT

- **Vào hệ thống:**

  - Thông tin đăng nhập
  - Yêu cầu xem thông tin cá nhân
  - Yêu cầu sửa thông tin cá nhân
  - Yêu cầu xem khen thưởng

- **Ra khỏi hệ thống:**
  - Thông tin cá nhân
  - Lịch sử khen thưởng
  - Hồ sơ gợi ý cá nhân
  - Thông báo kết quả

#### 5. Database (PostgreSQL) ↔ Hệ thống QLKT

- **Vào hệ thống:**

  - Dữ liệu từ database (queries)

- **Ra khỏi hệ thống:**
  - Dữ liệu lưu trữ (inserts, updates, deletes)

#### 6. Files (PDF) ↔ Hệ thống QLKT

- **Vào hệ thống:**

  - File quyết định khen thưởng (upload)

- **Ra khỏi hệ thống:**
  - File quyết định khen thưởng (download)

---

## 🔄 DFD Mức 1 (Level 1 DFD)

### Mô tả

Sơ đồ DFD mức 1 phân rã hệ thống QLKT thành các quá trình chính và các kho dữ liệu.

### Sơ đồ

```
┌──────────┐
│ SUPER    │
│ ADMIN    │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  1.0 Quản lý Tài khoản                                        │
│     ┌──────────┐                                             │
│     │ D1: Tài  │                                             │
│     │  khoản   │                                             │
│     └──────────┘                                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌──────────┐
│ ADMIN    │
└────┬─────┘
     │
     ├─────────────────────────────────────────────────────────┐
     │                                                           │
     ▼                                                           ▼
┌──────────────────────┐                          ┌──────────────────────┐
│                                                               │
│  2.0 Quản lý Dữ liệu Cơ bản                    │  3.0 Quản lý Quân nhân│
│     ┌──────────┐     ┌──────────┐               │     ┌──────────┐      │
│     │ D2: Đơn │     │ D3: Chức│               │     │ D5: Quân│      │
│     │   vị    │     │   vụ    │               │     │  nhân   │      │
│     └──────────┘     └──────────┘               │     └──────────┘      │
│     ┌──────────┐                                │     ┌──────────┐      │
│     │ D4: Nhóm │                                │     │ D6: Lịch │      │
│     │  Cống    │                                │     │  sử Chức│      │
│     │  hiến    │                                │     │   vụ     │      │
│     └──────────┘                                │     └──────────┘      │
│                                                  │     ┌──────────┐      │
│                                                  │     │ D7: Thành│      │
│                                                  │     │  tích KH │      │
│                                                  │     └──────────┘      │
│                                                  │     ┌──────────┐      │
│                                                  │     │ D8: Danh │      │
│                                                  │     │  hiệu HN │      │
│                                                  │     └──────────┘      │
└──────────────────────┘                          └──────────────────────┘
     │                                                           │
     └───────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  4.0 Quản lý Đề xuất Khen thưởng                              │
│     ┌──────────┐                                             │
│     │ D9: Đề  │                                             │
│     │  xuất   │                                             │
│     └──────────┘                                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────┐
│ ADMIN    │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  5.0 Phê duyệt Đề xuất                                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
     │
     ├─────────────────────────────────────────────────────────┐
     │                                                           │
     ▼                                                           ▼
┌──────────────────────┐                          ┌──────────────────────┐
│                                                               │
│  6.0 Tính toán Hồ sơ Gợi ý                     │  7.0 Quản lý Khen thưởng│
│     ┌──────────┐     ┌──────────┐               │     ┌──────────┐      │
│     │ D10: Hồ │     │ D11: Hồ  │               │     │ D12: Khen│      │
│     │  sơ NH  │     │  sơ HN   │               │     │  thưởng  │      │
│     └──────────┘     └──────────┘               │     └──────────┘      │
│                                                  │     ┌──────────┐      │
│                                                  │     │ D13: Quyết│     │
│                                                  │     │  định    │      │
│                                                  │     └──────────┘      │
└──────────────────────┘                          └──────────────────────┘
     │                                                           │
     └───────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  8.0 Báo cáo và Thống kê                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Các Quá trình (Process)

#### 1.0 Quản lý Tài khoản

- **Mô tả**: Quản lý tài khoản người dùng trong hệ thống
- **Input**:
  - Yêu cầu tạo/sửa/xóa tài khoản (từ SUPER_ADMIN)
  - Thông tin tài khoản (username, password, role, quan_nhan_id)
- **Output**:
  - Thông tin tài khoản
  - Danh sách tài khoản
  - Kết quả thao tác
- **Kho dữ liệu**: D1 (Tài khoản)

#### 2.0 Quản lý Dữ liệu Cơ bản

- **Mô tả**: Quản lý đơn vị, chức vụ, nhóm cống hiến
- **Input**:
  - Yêu cầu CRUD đơn vị/chức vụ/nhóm cống hiến (từ ADMIN)
  - Thông tin đơn vị/chức vụ/nhóm cống hiến
- **Output**:
  - Danh sách đơn vị/chức vụ/nhóm cống hiến
  - Kết quả thao tác
- **Kho dữ liệu**: D2 (Đơn vị), D3 (Chức vụ), D4 (Nhóm cống hiến)

#### 3.0 Quản lý Quân nhân

- **Mô tả**: Quản lý thông tin quân nhân, lịch sử chức vụ, thành tích khoa học, danh hiệu hằng năm
- **Input**:
  - Yêu cầu CRUD quân nhân (từ ADMIN/MANAGER)
  - Thông tin quân nhân
  - Lịch sử chức vụ
  - Thành tích khoa học
  - Danh hiệu hằng năm
  - File Excel (import)
- **Output**:
  - Danh sách quân nhân
  - Thông tin chi tiết quân nhân
  - File Excel (export)
  - Kết quả thao tác
- **Kho dữ liệu**: D5 (Quân nhân), D6 (Lịch sử chức vụ), D7 (Thành tích khoa học), D8 (Danh hiệu hằng năm)

#### 4.0 Quản lý Đề xuất Khen thưởng

- **Mô tả**: Tạo và quản lý đề xuất khen thưởng
- **Input**:
  - Yêu cầu tạo đề xuất (từ MANAGER)
  - Thông tin đề xuất (loại, năm, danh sách quân nhân/đơn vị, danh hiệu)
  - File đính kèm (PDF)
- **Output**:
  - Danh sách đề xuất
  - Chi tiết đề xuất
  - Kết quả thao tác
- **Kho dữ liệu**: D9 (Đề xuất)
- **Luồng dữ liệu từ**: D5 (Quân nhân), D6 (Lịch sử chức vụ), D7 (Thành tích khoa học), D8 (Danh hiệu hằng năm)

#### 5.0 Phê duyệt Đề xuất

- **Mô tả**: Phê duyệt hoặc từ chối đề xuất khen thưởng
- **Input**:
  - Yêu cầu phê duyệt/từ chối (từ ADMIN)
  - Lý do từ chối (nếu có)
- **Output**:
  - Kết quả phê duyệt
  - Thông báo cho MANAGER
- **Kho dữ liệu**: D9 (Đề xuất)
- **Luồng dữ liệu đến**: 7.0 (Quản lý Khen thưởng)

#### 6.0 Tính toán Hồ sơ Gợi ý

- **Mô tả**: Tính toán và cập nhật hồ sơ gợi ý khen thưởng
- **Input**:
  - Yêu cầu tính toán lại (từ ADMIN)
  - Dữ liệu từ D5, D6, D7, D8
- **Output**:
  - Hồ sơ gợi ý niên hạn
  - Hồ sơ gợi ý hằng năm
  - Gợi ý khen thưởng
- **Kho dữ liệu**: D10 (Hồ sơ niên hạn), D11 (Hồ sơ hằng năm)
- **Luồng dữ liệu từ**: D5 (Quân nhân), D6 (Lịch sử chức vụ), D7 (Thành tích khoa học), D8 (Danh hiệu hằng năm)

#### 7.0 Quản lý Khen thưởng

- **Mô tả**: Quản lý khen thưởng đã được phê duyệt
- **Input**:
  - Đề xuất đã phê duyệt (từ 5.0)
  - File quyết định khen thưởng (PDF)
- **Output**:
  - Danh sách khen thưởng
  - Chi tiết khen thưởng
  - File quyết định
  - Kết quả thao tác
- **Kho dữ liệu**: D12 (Khen thưởng), D13 (Quyết định)

#### 8.0 Báo cáo và Thống kê

- **Mô tả**: Tạo báo cáo và thống kê
- **Input**:
  - Yêu cầu báo cáo/thống kê (từ ADMIN/MANAGER/USER)
- **Output**:
  - Báo cáo theo đơn vị
  - Báo cáo theo năm
  - Thống kê tổng quan
  - Biểu đồ
- **Luồng dữ liệu từ**: Tất cả các kho dữ liệu

---

## 📚 Chú thích Ký hiệu

### Ký hiệu DFD

- **Hình tròn (○)**: Quá trình (Process) - Xử lý dữ liệu
- **Hình chữ nhật (□)**: Tác nhân ngoài (External Entity) - Người dùng hoặc hệ thống bên ngoài
- **Hình chữ nhật mở (⊂⊃)**: Kho dữ liệu (Data Store) - Lưu trữ dữ liệu
- **Mũi tên (→)**: Luồng dữ liệu (Data Flow) - Hướng di chuyển dữ liệu

### Ký hiệu trong tài liệu

- **D1, D2, ...**: Kho dữ liệu (Data Store)
- **1.0, 2.0, ...**: Quá trình (Process)
- **→**: Luồng dữ liệu vào
- **←**: Luồng dữ liệu ra

---

## 🔍 Mô tả Chi tiết các Quá trình

### 1.0 Quản lý Tài khoản

**Chức năng:**

- Tạo tài khoản mới
- Sửa thông tin tài khoản
- Xóa tài khoản
- Gán quyền (role) cho tài khoản
- Đổi mật khẩu
- Xem danh sách tài khoản

**Luồng dữ liệu:**

- **Vào**: Thông tin tài khoản, yêu cầu CRUD
- **Ra**: Thông tin tài khoản, danh sách tài khoản
- **Kho dữ liệu**: D1 (Tài khoản)

**Người dùng**: SUPER_ADMIN

---

### 2.0 Quản lý Dữ liệu Cơ bản

**Chức năng:**

- Quản lý Cơ quan Đơn vị (CRUD)
- Quản lý Đơn vị Trực thuộc (CRUD)
- Quản lý Chức vụ (CRUD)
- Quản lý Nhóm Cống hiến (CRUD)

**Luồng dữ liệu:**

- **Vào**: Thông tin đơn vị/chức vụ/nhóm cống hiến, yêu cầu CRUD
- **Ra**: Danh sách đơn vị/chức vụ/nhóm cống hiến
- **Kho dữ liệu**: D2 (Đơn vị), D3 (Chức vụ), D4 (Nhóm cống hiến)

**Người dùng**: ADMIN

---

### 3.0 Quản lý Quân nhân

**Chức năng:**

- Quản lý thông tin quân nhân (CRUD)
- Quản lý lịch sử chức vụ (CRUD)
- Quản lý thành tích khoa học (CRUD)
- Quản lý danh hiệu hằng năm (CRUD)
- Import/Export Excel

**Luồng dữ liệu:**

- **Vào**:
  - Thông tin quân nhân
  - Lịch sử chức vụ
  - Thành tích khoa học
  - Danh hiệu hằng năm
  - File Excel (import)
- **Ra**:
  - Danh sách quân nhân
  - Thông tin chi tiết quân nhân
  - File Excel (export)
- **Kho dữ liệu**: D5 (Quân nhân), D6 (Lịch sử chức vụ), D7 (Thành tích khoa học), D8 (Danh hiệu hằng năm)

**Người dùng**: ADMIN (toàn bộ), MANAGER (trong đơn vị), USER (bản thân)

---

### 4.0 Quản lý Đề xuất Khen thưởng

**Chức năng:**

- Tạo đề xuất khen thưởng
- Xem danh sách đề xuất
- Chỉnh sửa đề xuất (khi chưa phê duyệt)
- Gửi đề xuất để phê duyệt
- Upload file đính kèm

**Loại đề xuất:**

- Cá nhân Hằng năm
- Đơn vị Hằng năm
- Niên hạn
- Cống hiến
- Huy chương Quân kỳ Quyết thắng
- Kỷ niệm chương VSNXD QĐNDVN
- Đột xuất
- Thành tích Khoa học

**Luồng dữ liệu:**

- **Vào**:
  - Thông tin đề xuất (loại, năm, danh sách quân nhân/đơn vị, danh hiệu)
  - File đính kèm (PDF)
  - Dữ liệu từ D5, D6, D7, D8 (để validate)
- **Ra**:
  - Danh sách đề xuất
  - Chi tiết đề xuất
  - Kết quả validation
- **Kho dữ liệu**: D9 (Đề xuất)

**Người dùng**: MANAGER

---

### 5.0 Phê duyệt Đề xuất

**Chức năng:**

- Xem danh sách đề xuất (tất cả đơn vị)
- Xem chi tiết đề xuất
- Phê duyệt đề xuất
- Từ chối đề xuất (kèm lý do)
- Upload quyết định khen thưởng

**Luồng dữ liệu:**

- **Vào**:
  - Yêu cầu phê duyệt/từ chối
  - Lý do từ chối
  - File quyết định (PDF)
  - Dữ liệu từ D9 (Đề xuất)
- **Ra**:
  - Kết quả phê duyệt
  - Thông báo cho MANAGER
  - Dữ liệu đề xuất đã phê duyệt → 7.0
- **Kho dữ liệu**: D9 (Đề xuất)

**Người dùng**: ADMIN

---

### 6.0 Tính toán Hồ sơ Gợi ý

**Chức năng:**

- Tính toán hồ sơ gợi ý niên hạn
- Tính toán hồ sơ gợi ý hằng năm
- Cập nhật gợi ý khen thưởng

**Logic tính toán:**

- **Niên hạn**: Dựa trên ngày nhập ngũ, ngày xuất ngũ, giới tính
- **Hằng năm**: Dựa trên danh hiệu hằng năm, thành tích khoa học
- **Cống hiến**: Dựa trên lịch sử chức vụ, nhóm hệ số, giới tính (nữ giảm 1/3 thời gian)

**Luồng dữ liệu:**

- **Vào**:
  - Yêu cầu tính toán lại (từ ADMIN)
  - Dữ liệu từ D5 (Quân nhân), D6 (Lịch sử chức vụ), D7 (Thành tích khoa học), D8 (Danh hiệu hằng năm)
- **Ra**:
  - Hồ sơ gợi ý niên hạn
  - Hồ sơ gợi ý hằng năm
  - Gợi ý khen thưởng
- **Kho dữ liệu**: D10 (Hồ sơ niên hạn), D11 (Hồ sơ hằng năm)

**Người dùng**: ADMIN (tính toán), ADMIN/MANAGER/USER (xem)

---

### 7.0 Quản lý Khen thưởng

**Chức năng:**

- Lưu khen thưởng đã phê duyệt
- Quản lý quyết định khen thưởng (upload/download)
- Xem danh sách khen thưởng
- Import/Export khen thưởng

**Luồng dữ liệu:**

- **Vào**:
  - Đề xuất đã phê duyệt (từ 5.0)
  - File quyết định khen thưởng (PDF)
- **Ra**:
  - Danh sách khen thưởng
  - Chi tiết khen thưởng
  - File quyết định
- **Kho dữ liệu**: D12 (Khen thưởng), D13 (Quyết định)

**Người dùng**: ADMIN (quản lý), ADMIN/MANAGER/USER (xem)

---

### 8.0 Báo cáo và Thống kê

**Chức năng:**

- Thống kê tổng quan
- Báo cáo theo đơn vị
- Báo cáo theo năm
- Báo cáo theo loại khen thưởng
- Biểu đồ thống kê

**Luồng dữ liệu:**

- **Vào**:
  - Yêu cầu báo cáo/thống kê
  - Dữ liệu từ tất cả các kho dữ liệu
- **Ra**:
  - Báo cáo
  - Thống kê
  - Biểu đồ

**Người dùng**: ADMIN (toàn hệ thống), MANAGER (đơn vị), USER (cá nhân)

---

## 💾 Kho Dữ liệu (Data Stores)

### D1: Tài khoản (TaiKhoan)

- Thông tin tài khoản người dùng
- Username, password_hash, role, quan_nhan_id

### D2: Đơn vị (CoQuanDonVi, DonViTrucThuoc)

- Thông tin cơ quan đơn vị và đơn vị trực thuộc

### D3: Chức vụ (ChucVu)

- Thông tin chức vụ, hệ số chức vụ, nhóm cống hiến

### D4: Nhóm Cống hiến (NhomCongHien)

- Danh sách nhóm cống hiến (Nhóm 5, 6, 7...)

### D5: Quân nhân (QuanNhan)

- Thông tin quân nhân (CCCD, họ tên, giới tính, ngày nhập ngũ, đơn vị, chức vụ...)

### D6: Lịch sử Chức vụ (LichSuChucVu)

- Lịch sử đảm nhiệm chức vụ của quân nhân
- Dùng để tính cống hiến

### D7: Thành tích Khoa học (ThanhTichKhoaHoc)

- Đề tài khoa học (NCKH), Sáng kiến khoa học (SKKH)

### D8: Danh hiệu Hằng năm (DanhHieuHangNam)

- Danh hiệu hằng năm: CSTĐCS, CSTT, BKBQP, CSTDTQ

### D9: Đề xuất (BangDeXuat)

- Đề xuất khen thưởng (PENDING, APPROVED, REJECTED)

### D10: Hồ sơ Niên hạn (HoSoNienHan)

- Hồ sơ gợi ý khen thưởng niên hạn
- Gợi ý HCCSVV, HC_QKQT, KNC_VSNXD_QDNDVN

### D11: Hồ sơ Hằng năm (HoSoHangNam)

- Hồ sơ gợi ý khen thưởng hằng năm
- Gợi ý BKBQP, CSTDTQ

### D12: Khen thưởng

- Khen thưởng đã được phê duyệt
- Các bảng: KhenThuongCongHien, KhenThuongHCCSVV, HuanChuongQuanKyQuyetThang, KyNiemChuongVSNXDQDNDVN, KhenThuongDotXuat

### D13: Quyết định

- File quyết định khen thưởng (PDF)
- Lưu trữ trên filesystem

---

## 🔄 Luồng Dữ liệu Chính

### Luồng 1: Quản lý Quân nhân

```
ADMIN/MANAGER → 3.0 Quản lý Quân nhân → D5, D6, D7, D8
```

### Luồng 2: Tạo Đề xuất

```
MANAGER → 4.0 Quản lý Đề xuất → D9
D5, D6, D7, D8 → 4.0 (validation)
```

### Luồng 3: Phê duyệt

```
ADMIN → 5.0 Phê duyệt → D9
D9 → 7.0 Quản lý Khen thưởng → D12, D13
```

### Luồng 4: Tính toán

```
ADMIN → 6.0 Tính toán → D10, D11
D5, D6, D7, D8 → 6.0 (tính toán)
```

### Luồng 5: Báo cáo

```
ADMIN/MANAGER/USER → 8.0 Báo cáo
Tất cả D → 8.0 (tổng hợp)
```

---

## 📝 Lưu ý

1. **Phân quyền**: Mỗi quá trình có kiểm tra phân quyền trước khi xử lý
2. **Validation**: Dữ liệu được validate trước khi lưu vào database
3. **Audit Log**: Tất cả thao tác được ghi nhật ký
4. **Thông báo**: Hệ thống gửi thông báo khi có sự kiện quan trọng
5. **File Storage**: File PDF được lưu trên filesystem, path lưu trong database

---

## 🔄 Cập nhật

Tài liệu này được cập nhật theo sự phát triển của hệ thống.

**Phiên bản**: 1.0.0
**Ngày cập nhật**: 2024
