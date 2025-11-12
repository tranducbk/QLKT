const bcrypt = require('bcrypt');
const { prisma } = require('../models');

class AccountService {
  /**
   * Lấy danh sách tài khoản (có phân trang)
   */
  async getAccounts(page = 1, limit = 10, search = '', role) {
    try {
      const skip = (page - 1) * limit;

      // Hỗ trợ lọc nhiều role (ví dụ: "MANAGER,USER")
      let roleFilter = {};
      if (role) {
        const roles = String(role).split(',').map(r => r.trim());
        roleFilter = roles.length > 1 ? { role: { in: roles } } : { role: roles[0] };
      }

      const whereClause = {
        AND: [
          search
            ? {
                OR: [
                  { username: { contains: String(search), mode: 'insensitive' } },
                  { QuanNhan: { ho_ten: { contains: String(search), mode: 'insensitive' } } },
                ],
              }
            : {},
          roleFilter,
        ],
      };

      const [accounts, total] = await Promise.all([
        prisma.taiKhoan.findMany({
          skip,
          take: parseInt(limit),
          where: whereClause,
          include: {
            QuanNhan: {
              include: {
                CoQuanDonVi: true,
                DonViTrucThuoc: {
                  include: {
                    CoQuanDonVi: true,
                  },
                },
                ChucVu: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.taiKhoan.count({ where: whereClause }),
      ]);

      // Format dữ liệu trả về
      const formattedAccounts = accounts.map(account => {
        const quanNhan = account.QuanNhan;
        const donVi = quanNhan?.DonViTrucThuoc || quanNhan?.CoQuanDonVi;
        return {
          id: account.id,
          username: account.username,
          role: account.role,
          quan_nhan_id: account.quan_nhan_id,
          ho_ten: quanNhan?.ho_ten || null,
          don_vi: donVi?.ten_don_vi || null,
          chuc_vu: quanNhan?.ChucVu?.ten_chuc_vu || null,
          createdAt: account.createdAt,
        };
      });

      return {
        accounts: formattedAccounts,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy chi tiết tài khoản theo id
   */
  async getAccountById(id) {
    try {
      const account = await prisma.taiKhoan.findUnique({
        where: { id },
        include: {
          QuanNhan: {
            include: {
              CoQuanDonVi: true,
              DonViTrucThuoc: {
                include: {
                  CoQuanDonVi: true,
                },
              },
              ChucVu: true,
            },
          },
        },
      });

      if (!account) {
        throw new Error('Tài khoản không tồn tại');
      }

      return {
        id: account.id,
        username: account.username,
        role: account.role,
        quan_nhan_id: account.quan_nhan_id,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        QuanNhan: account.QuanNhan
          ? {
              id: account.QuanNhan.id,
              ho_ten: account.QuanNhan.ho_ten,
              cccd: account.QuanNhan.cccd,
              CoQuanDonVi: account.QuanNhan.CoQuanDonVi
                ? { id: account.QuanNhan.CoQuanDonVi.id, ten_don_vi: account.QuanNhan.CoQuanDonVi.ten_don_vi }
                : null,
              DonViTrucThuoc: account.QuanNhan.DonViTrucThuoc
                ? { id: account.QuanNhan.DonViTrucThuoc.id, ten_don_vi: account.QuanNhan.DonViTrucThuoc.ten_don_vi }
                : null,
              ChucVu: account.QuanNhan.ChucVu
                ? {
                    id: account.QuanNhan.ChucVu.id,
                    ten_chuc_vu: account.QuanNhan.ChucVu.ten_chuc_vu,
                  }
                : null,
            }
          : null,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tạo tài khoản mới
   */
  async createAccount(data) {
    try {
      const { personnel_id, username, password, role, don_vi_id, chuc_vu_id } = data;

      // Kiểm tra username đã tồn tại chưa
      const existingAccount = await prisma.taiKhoan.findUnique({
        where: { username },
      });

      if (existingAccount) {
        throw new Error('Tên đăng nhập đã tồn tại');
      }

      let finalPersonnelId = personnel_id || null;

      // Nếu có personnel_id, kiểm tra quân nhân có tồn tại không
      if (personnel_id) {
        const personnel = await prisma.quanNhan.findUnique({
          where: { id: personnel_id },
        });

        if (!personnel) {
          throw new Error('Quân nhân không tồn tại');
        }

        // Kiểm tra quân nhân đã có tài khoản chưa
        const existingPersonnelAccount = await prisma.taiKhoan.findUnique({
          where: { quan_nhan_id: personnel_id },
        });

        if (existingPersonnelAccount) {
          throw new Error('Quân nhân này đã có tài khoản');
        }
      }

      // Tự động tạo QuanNhan cho MANAGER/USER
      if ((role === 'MANAGER' || role === 'USER') && !personnel_id) {
        if (!don_vi_id || !chuc_vu_id) {
          throw new Error('Vui lòng cung cấp đơn vị và chức vụ');
        }

        // Kiểm tra đơn vị và chức vụ có tồn tại không
        const [coQuanDonVi, donViTrucThuoc, chucVu] = await Promise.all([
          prisma.coQuanDonVi.findUnique({ where: { id: don_vi_id } }),
          prisma.donViTrucThuoc.findUnique({ where: { id: don_vi_id } }),
          prisma.chucVu.findUnique({ where: { id: chuc_vu_id } }),
        ]);

        if (!coQuanDonVi && !donViTrucThuoc) {
          throw new Error('Đơn vị không tồn tại');
        }

        if (!chucVu) {
          throw new Error('Chức vụ không tồn tại');
        }

        // Xác định loại đơn vị và set đúng foreign key
        const isCoQuanDonVi = !!coQuanDonVi;
        const personnelData = {
          cccd: null, // CCCD có thể null, người dùng sẽ cập nhật sau
          ho_ten: username, // Dùng username làm họ tên mặc định
          chuc_vu_id,
          ngay_sinh: null,
          ngay_nhap_ngu: null,
        };

        if (isCoQuanDonVi) {
          personnelData.co_quan_don_vi_id = don_vi_id;
          personnelData.don_vi_truc_thuoc_id = null;
        } else {
          personnelData.co_quan_don_vi_id = null;
          personnelData.don_vi_truc_thuoc_id = don_vi_id;
        }

        // Tạo QuanNhan mới với thông tin tối thiểu
        const newPersonnel = await prisma.quanNhan.create({
          data: personnelData,
        });

        finalPersonnelId = newPersonnel.id;

        // Tạo LichSuChucVu cho chức vụ ban đầu
        await prisma.lichSuChucVu.create({
          data: {
            quan_nhan_id: newPersonnel.id,
            chuc_vu_id: chuc_vu_id,
            ngay_bat_dau: new Date(),
            ngay_ket_thuc: null,
          },
        });

        // Cập nhật số lượng quân nhân trong đơn vị
        if (isCoQuanDonVi) {
          await prisma.coQuanDonVi.update({
            where: { id: don_vi_id },
            data: {
              so_luong: {
                increment: 1,
              },
            },
          });
        } else {
          await prisma.donViTrucThuoc.update({
            where: { id: don_vi_id },
            data: {
              so_luong: {
                increment: 1,
              },
            },
          });
        }
      }

      // Mã hóa mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);

      // Tạo tài khoản
      const newAccount = await prisma.taiKhoan.create({
        data: {
          quan_nhan_id: finalPersonnelId || null,
          username,
          password_hash: hashedPassword,
          role,
        },
        include: {
          QuanNhan: {
            include: {
              CoQuanDonVi: true,
              DonViTrucThuoc: {
                include: {
                  CoQuanDonVi: true,
                },
              },
              ChucVu: true,
            },
          },
        },
      });

      return {
        id: newAccount.id,
        username: newAccount.username,
        role: newAccount.role,
        quan_nhan_id: newAccount.quan_nhan_id,
        ho_ten: newAccount.QuanNhan?.ho_ten || null,
        don_vi: (newAccount.QuanNhan?.DonViTrucThuoc || newAccount.QuanNhan?.CoQuanDonVi)?.ten_don_vi || null,
        chuc_vu: newAccount.QuanNhan?.ChucVu?.ten_chuc_vu || null,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cập nhật tài khoản (đổi vai trò)
   */
  async updateAccount(id, data) {
    try {
      const { role } = data;

      // Kiểm tra tài khoản có tồn tại không
      const account = await prisma.taiKhoan.findUnique({
        where: { id },
      });

      if (!account) {
        throw new Error('Tài khoản không tồn tại');
      }

      // Cập nhật vai trò
      const updatedAccount = await prisma.taiKhoan.update({
        where: { id },
        data: { role },
        include: {
          QuanNhan: {
            include: {
              CoQuanDonVi: true,
              DonViTrucThuoc: {
                include: {
                  CoQuanDonVi: true,
                },
              },
              ChucVu: true,
            },
          },
        },
      });

      return {
        id: updatedAccount.id,
        username: updatedAccount.username,
        role: updatedAccount.role,
        quan_nhan_id: updatedAccount.quan_nhan_id,
        ho_ten: updatedAccount.QuanNhan?.ho_ten || null,
        don_vi: (updatedAccount.QuanNhan?.DonViTrucThuoc || updatedAccount.QuanNhan?.CoQuanDonVi)?.ten_don_vi || null,
        chuc_vu: updatedAccount.QuanNhan?.ChucVu?.ten_chuc_vu || null,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Đặt lại mật khẩu cho tài khoản (mật khẩu mặc định: 123456)
   */
  async resetPassword(accountId) {
    try {
      // Kiểm tra tài khoản có tồn tại không
      const account = await prisma.taiKhoan.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        throw new Error('Tài khoản không tồn tại');
      }

      // Mật khẩu mặc định
      const defaultPassword = '123456';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // Cập nhật mật khẩu
      await prisma.taiKhoan.update({
        where: { id: accountId },
        data: { password_hash: hashedPassword },
      });

      return { message: 'Đặt lại mật khẩu thành công. Mật khẩu mới: 123456' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Xóa (vô hiệu hóa) tài khoản
   */
  async deleteAccount(id) {
    try {
      // Kiểm tra tài khoản có tồn tại không
      const account = await prisma.taiKhoan.findUnique({
        where: { id },
        include: {
          QuanNhan: true,
        },
      });

      if (!account) {
        throw new Error('Tài khoản không tồn tại');
      }

      // Không cho phép xóa SUPER_ADMIN
      if (account.role === 'SUPER_ADMIN') {
        throw new Error('Không thể xóa tài khoản SUPER_ADMIN');
      }

      // Nếu có QuanNhan liên kết và CCCD = null, xóa luôn QuanNhan (phải xóa trước TaiKhoan)
      if (account.QuanNhan && !account.QuanNhan.cccd) {
        const personnelId = account.QuanNhan.id;
        const unitId = account.QuanNhan.co_quan_don_vi_id || account.QuanNhan.don_vi_truc_thuoc_id;
        const isCoQuanDonVi = !!account.QuanNhan.co_quan_don_vi_id;

        // Xóa tài khoản trước (để không vi phạm foreign key)
        await prisma.taiKhoan.delete({
          where: { id },
        });

        // Xóa QuanNhan
        await prisma.quanNhan.delete({
          where: { id: personnelId },
        });

        // Giảm số lượng quân nhân trong đơn vị
        if (unitId) {
          if (isCoQuanDonVi) {
            await prisma.coQuanDonVi.update({
              where: { id: unitId },
              data: {
                so_luong: {
                  decrement: 1,
                },
              },
            });
          } else {
            await prisma.donViTrucThuoc.update({
              where: { id: unitId },
              data: {
                so_luong: {
                  decrement: 1,
                },
              },
            });
          }
        }
      } else {
        // Chỉ xóa tài khoản, không xóa QuanNhan
        await prisma.taiKhoan.delete({
          where: { id },
        });
      }

      return { message: 'Xóa tài khoản thành công' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AccountService();
