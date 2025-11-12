import { z } from "zod"

// Account schemas
export const accountFormSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "USER"]),
  personnel_id: z.string().optional(),
  quan_nhan_id: z.number().optional(),
})

export const accountCreateSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string().min(6, "Mật khẩu xác nhận phải có ít nhất 6 ký tự"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "USER"]),
  don_vi_id: z.string().optional(), // Đơn vị/Cơ quan đơn vị (UUID)
  chuc_vu_id: z.string().optional(), // Chức vụ (UUID)
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  }
).refine(
  (data) => {
    // Nếu là MANAGER hoặc USER thì bắt buộc phải có don_vi_id và chuc_vu_id
    if (data.role === "MANAGER" || data.role === "USER") {
      return data.don_vi_id !== undefined && data.chuc_vu_id !== undefined;
    }
    return true;
  },
  {
    message: "Vui lòng chọn đơn vị và chức vụ cho tài khoản MANAGER/USER",
    path: ["don_vi_id"],
  }
)

export const accountEditSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "USER"]),
  quan_nhan_id: z.number().optional(),
})

// Personnel schemas
export const personnelFormSchema = z.object({
  cccd: z.string().min(9, "CCCD phải có ít nhất 9 ký tự"),
  ho_ten: z.string().min(1, "Họ tên là bắt buộc"),
  ngay_sinh: z.string().optional(),
  ngay_nhap_ngu: z.string().min(1, "Ngày nhập ngũ là bắt buộc"),
  don_vi_id: z.string().min(1, "Đơn vị là bắt buộc"),
  chuc_vu_id: z.string().min(1, "Chức vụ là bắt buộc"),
})

// Unit schemas
export const unitFormSchema = z.object({
  ma_don_vi: z.string().min(1, "Mã đơn vị là bắt buộc"),
  ten_don_vi: z.string().min(1, "Tên đơn vị là bắt buộc"),
})

// Position schemas
export const positionFormSchema = z.object({
  don_vi_id: z.string().optional(), // Optional vì khi edit không cần
  ten_chuc_vu: z.string().min(1, "Tên chức vụ là bắt buộc"),
  is_manager: z.boolean().default(false),
  he_so_luong: z.number().optional(),
})
