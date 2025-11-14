const { prisma } = require('../models');
const moment = require('moment');

class PositionHistoryService {
  async getPositionHistory(personnelId) {
    try {
      if (!personnelId) {
        throw new Error('personnel_id là bắt buộc');
      }

      const personnel = await prisma.quanNhan.findUnique({
        where: { id: personnelId },
      });

      if (!personnel) {
        throw new Error('Quân nhân không tồn tại');
      }

      const history = await prisma.lichSuChucVu.findMany({
        where: { quan_nhan_id: personnelId },
        include: {
          ChucVu: {
            include: {
              CoQuanDonVi: true,
              DonViTrucThuoc: {
                include: {
                  CoQuanDonVi: true,
                },
              },
            },
          },
        },
        orderBy: { ngay_bat_dau: 'desc' },
      });

      // Tính số tháng tự động cho chức vụ hiện tại (chưa có ngày kết thúc)
      const today = new Date();
      const updatedHistory = history.map(item => {
        if (!item.ngay_ket_thuc) {
          // Chức vụ hiện tại - tính số tháng từ ngày bắt đầu đến hôm nay
          const ngayBatDau = new Date(item.ngay_bat_dau);
          let months = (today.getFullYear() - ngayBatDau.getFullYear()) * 12;
          months += today.getMonth() - ngayBatDau.getMonth();
          // Nếu ngày hôm nay < ngày bắt đầu trong tháng thì trừ 1 tháng
          if (today.getDate() < ngayBatDau.getDate()) {
            months--;
          }
          const soThang = Math.max(0, months);

          return {
            ...item,
            so_thang: soThang, // Cập nhật số tháng tính tự động
          };
        }
        return item;
      });

      return updatedHistory;
    } catch (error) {
      throw error;
    }
  }

  async createPositionHistory(data) {
    try {
      const { personnel_id, chuc_vu_id, ngay_bat_dau, ngay_ket_thuc, he_so_luong } = data;

      // Validate ngày bắt đầu
      if (!ngay_bat_dau) {
        throw new Error('Ngày bắt đầu là bắt buộc');
      }

      // Validate ngày bắt đầu và ngày kết thúc
      if (ngay_ket_thuc) {
        const dateBatDau = moment(ngay_bat_dau);
        const dateKetThuc = moment(ngay_ket_thuc);

        // So sánh ngày bắt đầu phải trước ngày kết thúc
        if (dateBatDau.isAfter(dateKetThuc) || dateBatDau.isSame(dateKetThuc)) {
          throw new Error('Ngày bắt đầu phải trước ngày kết thúc');
        }
      }

      const personnel = await prisma.quanNhan.findUnique({
        where: { id: personnel_id },
      });

      if (!personnel) {
        throw new Error('Quân nhân không tồn tại');
      }

      const position = await prisma.chucVu.findUnique({
        where: { id: chuc_vu_id },
        select: { he_so_luong: true },
      });

      if (!position) {
        throw new Error('Chức vụ không tồn tại');
      }

      // Sử dụng he_so_luong từ request nếu có, nếu không thì lấy từ chức vụ
      const finalHeSoLuong = he_so_luong !== undefined ? he_so_luong : position.he_so_luong || 0;

      // Tính số tháng từ ngày bắt đầu và ngày kết thúc
      const ngayBatDau = new Date(ngay_bat_dau);
      let soThang = null;
      if (ngay_ket_thuc) {
        const ngayKetThuc = new Date(ngay_ket_thuc);
        // Tính số tháng giữ chức vụ (tính tới tháng)
        let months = (ngayKetThuc.getFullYear() - ngayBatDau.getFullYear()) * 12;
        months += ngayKetThuc.getMonth() - ngayBatDau.getMonth();
        // Nếu ngày kết thúc < ngày bắt đầu trong tháng thì trừ 1 tháng
        if (ngayKetThuc.getDate() < ngayBatDau.getDate()) {
          months--;
        }
        soThang = Math.max(0, months); // Đảm bảo không âm
      }

      const newHistory = await prisma.lichSuChucVu.create({
        data: {
          quan_nhan_id: personnel_id,
          chuc_vu_id,
          he_so_luong: finalHeSoLuong,
          ngay_bat_dau: ngayBatDau,
          ngay_ket_thuc: ngay_ket_thuc ? new Date(ngay_ket_thuc) : null,
          so_thang: soThang,
        },
        include: {
          ChucVu: {
            include: {
              CoQuanDonVi: true,
              DonViTrucThuoc: {
                include: {
                  CoQuanDonVi: true,
                },
              },
            },
          },
        },
      });

      return newHistory;
    } catch (error) {
      throw error;
    }
  }

  async updatePositionHistory(id, data) {
    try {
      const { chuc_vu_id, ngay_bat_dau, ngay_ket_thuc, he_so_luong } = data;

      const history = await prisma.lichSuChucVu.findUnique({
        where: { id },
      });

      if (!history) {
        throw new Error('Lịch sử chức vụ không tồn tại');
      }

      // Ưu tiên he_so_luong từ request, nếu không có thì lấy từ chức vụ hoặc giữ nguyên
      let heSoLuong = he_so_luong !== undefined ? he_so_luong : history.he_so_luong;
      if (chuc_vu_id && he_so_luong === undefined) {
        const position = await prisma.chucVu.findUnique({
          where: { id: chuc_vu_id },
          select: { he_so_luong: true },
        });

        if (!position) {
          throw new Error('Chức vụ không tồn tại');
        }
        // Cập nhật hệ số lương nếu đổi chức vụ và không có he_so_luong từ request
        heSoLuong = position.he_so_luong || 0;
      }

      // Tính số tháng từ ngày bắt đầu và ngày kết thúc
      const ngayBatDauFinal = ngay_bat_dau ? new Date(ngay_bat_dau) : history.ngay_bat_dau;
      const ngayKetThucFinal =
        ngay_ket_thuc !== undefined
          ? ngay_ket_thuc
            ? new Date(ngay_ket_thuc)
            : null
          : history.ngay_ket_thuc;

      // Validate ngày bắt đầu và ngày kết thúc
      if (ngayBatDauFinal && ngayKetThucFinal) {
        const dateBatDau = moment(ngayBatDauFinal);
        const dateKetThuc = moment(ngayKetThucFinal);

        // So sánh ngày bắt đầu phải trước ngày kết thúc
        if (dateBatDau.isAfter(dateKetThuc) || dateBatDau.isSame(dateKetThuc)) {
          throw new Error('Ngày bắt đầu phải trước ngày kết thúc');
        }
      }

      // Tính số tháng giữ chức vụ (chỉ tính khi có đầy đủ ngày bắt đầu và ngày kết thúc)
      let soThang = history.so_thang; // Giữ nguyên số tháng cũ nếu không có đủ thông tin
      if (ngayBatDauFinal && ngayKetThucFinal) {
        let months = (ngayKetThucFinal.getFullYear() - ngayBatDauFinal.getFullYear()) * 12;
        months += ngayKetThucFinal.getMonth() - ngayBatDauFinal.getMonth();
        // Nếu ngày kết thúc < ngày bắt đầu trong tháng thì trừ 1 tháng
        if (ngayKetThucFinal.getDate() < ngayBatDauFinal.getDate()) {
          months--;
        }
        soThang = Math.max(0, months); // Đảm bảo không âm
      } else if (!ngayKetThucFinal) {
        // Nếu không có ngày kết thúc (chức vụ đang giữ), số tháng = null
        soThang = null;
      }

      const updatedHistory = await prisma.lichSuChucVu.update({
        where: { id },
        data: {
          chuc_vu_id: chuc_vu_id || history.chuc_vu_id,
          he_so_luong: heSoLuong,
          ngay_bat_dau: ngayBatDauFinal,
          ngay_ket_thuc: ngayKetThucFinal,
          so_thang: soThang,
        },
        include: {
          ChucVu: {
            include: {
              CoQuanDonVi: true,
              DonViTrucThuoc: {
                include: {
                  CoQuanDonVi: true,
                },
              },
            },
          },
        },
      });

      return updatedHistory;
    } catch (error) {
      throw error;
    }
  }

  async deletePositionHistory(id) {
    try {
      const history = await prisma.lichSuChucVu.findUnique({
        where: { id },
      });

      if (!history) {
        throw new Error('Lịch sử chức vụ không tồn tại');
      }

      await prisma.lichSuChucVu.delete({
        where: { id },
      });

      return { message: 'Xóa lịch sử chức vụ thành công' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PositionHistoryService();
