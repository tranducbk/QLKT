const { prisma } = require("../models");

class UnitService {
  /**
   * Lấy tất cả đơn vị (có thể lấy theo cấu trúc cây)
   */
  async getAllUnits(includeHierarchy = false) {
    try {
      if (includeHierarchy) {
        // Lấy đơn vị theo cấu trúc cây: chỉ lấy cơ quan đơn vị và các đơn vị trực thuộc
        const coQuanDonVi = await prisma.coQuanDonVi.findMany({
          include: {
            DonViTrucThuoc: {
              include: {
                ChucVu: true,
              },
            },
            ChucVu: true,
          },
          orderBy: {
            ma_don_vi: "asc",
          },
        });

        return coQuanDonVi;
      } else {
        // Lấy tất cả đơn vị phẳng (cả cơ quan đơn vị và đơn vị trực thuộc)
        const [coQuanDonVi, donViTrucThuoc] = await Promise.all([
          prisma.coQuanDonVi.findMany({
            include: {
              ChucVu: true,
            },
            orderBy: {
              ma_don_vi: "asc",
            },
          }),
          prisma.donViTrucThuoc.findMany({
            include: {
              CoQuanDonVi: true,
              ChucVu: true,
            },
            orderBy: {
              ma_don_vi: "asc",
            },
          }),
        ]);

        return [...coQuanDonVi, ...donViTrucThuoc];
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tạo đơn vị mới (có thể là cơ quan đơn vị hoặc đơn vị trực thuộc)
   */
  async createUnit(data) {
    try {
      const { ma_don_vi, ten_don_vi, co_quan_don_vi_id } = data;

      // Kiểm tra mã đơn vị đã tồn tại chưa (kiểm tra cả 2 bảng)
      const [existingCoQuanDonVi, existingDonViTrucThuoc] = await Promise.all([
        prisma.coQuanDonVi.findUnique({ where: { ma_don_vi } }),
        prisma.donViTrucThuoc.findUnique({ where: { ma_don_vi } }),
      ]);

      if (existingCoQuanDonVi || existingDonViTrucThuoc) {
        throw new Error("Mã đơn vị đã tồn tại");
      }

      // Nếu có co_quan_don_vi_id, tạo đơn vị trực thuộc
      if (co_quan_don_vi_id) {
        // Kiểm tra cơ quan đơn vị có tồn tại không
        const parentUnit = await prisma.coQuanDonVi.findUnique({
          where: { id: co_quan_don_vi_id },
        });

        if (!parentUnit) {
          throw new Error("Cơ quan đơn vị không tồn tại");
        }

        // Tạo đơn vị trực thuộc
        const newUnit = await prisma.donViTrucThuoc.create({
          data: {
            co_quan_don_vi_id,
            ma_don_vi,
            ten_don_vi,
            so_luong: 0,
          },
          include: {
            CoQuanDonVi: true,
            ChucVu: true,
          },
        });

        return newUnit;
      } else {
        // Tạo cơ quan đơn vị
        const newUnit = await prisma.coQuanDonVi.create({
          data: {
            ma_don_vi,
            ten_don_vi,
            so_luong: 0,
          },
          include: {
            DonViTrucThuoc: true,
            ChucVu: true,
          },
        });

        return newUnit;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sửa đơn vị (tên, co_quan_don_vi_id)
   */
  async updateUnit(id, data) {
    try {
      const { ten_don_vi, co_quan_don_vi_id } = data;

      // Kiểm tra đơn vị có tồn tại không (kiểm tra cả 2 bảng)
      const [coQuanDonVi, donViTrucThuoc] = await Promise.all([
        prisma.coQuanDonVi.findUnique({ where: { id } }),
        prisma.donViTrucThuoc.findUnique({ where: { id } }),
      ]);

      if (!coQuanDonVi && !donViTrucThuoc) {
        throw new Error("Đơn vị không tồn tại");
      }

      // Nếu là đơn vị trực thuộc
      if (donViTrucThuoc) {
        const updateData = {};
        if (ten_don_vi) updateData.ten_don_vi = ten_don_vi;
        if (co_quan_don_vi_id !== undefined) {
          // Kiểm tra cơ quan đơn vị có tồn tại không
          const parentUnit = await prisma.coQuanDonVi.findUnique({
            where: { id: co_quan_don_vi_id },
          });

          if (!parentUnit) {
            throw new Error("Cơ quan đơn vị không tồn tại");
          }

          updateData.co_quan_don_vi_id = co_quan_don_vi_id;
        }

        const updatedUnit = await prisma.donViTrucThuoc.update({
          where: { id },
          data: updateData,
          include: {
            CoQuanDonVi: true,
            ChucVu: true,
          },
        });

        return updatedUnit;
      } else {
        // Nếu là cơ quan đơn vị, chỉ cho phép sửa tên
        const updateData = {};
        if (ten_don_vi) updateData.ten_don_vi = ten_don_vi;

        const updatedUnit = await prisma.coQuanDonVi.update({
          where: { id },
          data: updateData,
          include: {
            DonViTrucThuoc: {
              include: {
                ChucVu: true,
              },
            },
            ChucVu: true,
          },
        });

        return updatedUnit;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Kiểm tra xem đơn vị có phải là con cháu của đơn vị khác không (để tránh vòng lặp)
   * Không cần thiết nữa vì chỉ có 2 cấp: cơ quan đơn vị và đơn vị trực thuộc
   */
  async isDescendant(ancestorId, descendantId) {
    try {
      if (ancestorId === descendantId) return true;

      // Kiểm tra xem descendant có phải là đơn vị trực thuộc của ancestor không
      const descendant = await prisma.donViTrucThuoc.findUnique({
        where: { id: descendantId },
      });

      if (!descendant) return false;

      return descendant.co_quan_don_vi_id === ancestorId;
    } catch (error) {
      return false;
    }
  }

  /**
   * Xóa đơn vị (nếu đơn vị đó không còn quân nhân và không có đơn vị con)
   * @param {string} id - UUID của đơn vị
   */
  async deleteUnit(id) {
    try {
      // Kiểm tra đơn vị có tồn tại không (kiểm tra cả 2 bảng)
      const [coQuanDonVi, donViTrucThuoc] = await Promise.all([
        prisma.coQuanDonVi.findUnique({
          where: { id },
          include: {
            DonViTrucThuoc: true,
          },
        }),
        prisma.donViTrucThuoc.findUnique({
          where: { id },
        }),
      ]);

      if (!coQuanDonVi && !donViTrucThuoc) {
        throw new Error("Đơn vị không tồn tại");
      }

      // Nếu là cơ quan đơn vị
      if (coQuanDonVi) {
        // Kiểm tra có đơn vị trực thuộc không
        if (
          coQuanDonVi.DonViTrucThuoc &&
          coQuanDonVi.DonViTrucThuoc.length > 0
        ) {
          throw new Error(
            `Không thể xóa cơ quan đơn vị vì còn ${coQuanDonVi.DonViTrucThuoc.length} đơn vị trực thuộc`
          );
        }

        // Kiểm tra có quân nhân không
        const personnelCount = await prisma.quanNhan.count({
          where: { co_quan_don_vi_id: id },
        });

        if (personnelCount > 0) {
          throw new Error(
            `Không thể xóa cơ quan đơn vị vì còn ${personnelCount} quân nhân`
          );
        }

        // Kiểm tra có chức vụ không
        const positionCount = await prisma.chucVu.count({
          where: { co_quan_don_vi_id: id },
        });

        if (positionCount > 0) {
          throw new Error(
            `Không thể xóa cơ quan đơn vị vì còn ${positionCount} chức vụ`
          );
        }

        // Xóa cơ quan đơn vị
        await prisma.coQuanDonVi.delete({
          where: { id },
        });
      } else {
        // Nếu là đơn vị trực thuộc
        // Kiểm tra có quân nhân không
        const personnelCount = await prisma.quanNhan.count({
          where: { don_vi_truc_thuoc_id: id },
        });

        if (personnelCount > 0) {
          throw new Error(
            `Không thể xóa đơn vị trực thuộc vì còn ${personnelCount} quân nhân`
          );
        }

        // Kiểm tra có chức vụ không
        const positionCount = await prisma.chucVu.count({
          where: { don_vi_truc_thuoc_id: id },
        });

        if (positionCount > 0) {
          throw new Error(
            `Không thể xóa đơn vị trực thuộc vì còn ${positionCount} chức vụ`
          );
        }

        // Xóa đơn vị trực thuộc
        await prisma.donViTrucThuoc.delete({
          where: { id },
        });
      }

      return { message: "Xóa đơn vị thành công" };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy đơn vị theo ID với cấu trúc cây đầy đủ
   * @param {string} id - UUID của đơn vị
   */
  async getUnitById(id) {
    try {
      // Kiểm tra cả 2 bảng
      const [coQuanDonVi, donViTrucThuoc] = await Promise.all([
        prisma.coQuanDonVi.findUnique({
          where: { id },
          include: {
            DonViTrucThuoc: {
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
            },
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
        }),
        prisma.donViTrucThuoc.findUnique({
          where: { id },
          include: {
            CoQuanDonVi: {
              select: {
                id: true,
                ma_don_vi: true,
                ten_don_vi: true,
                so_luong: true,
                createdAt: true,
                updatedAt: true,
              },
            },
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
        }),
      ]);

      if (!coQuanDonVi && !donViTrucThuoc) {
        throw new Error("Đơn vị không tồn tại");
      }

      return coQuanDonVi || donViTrucThuoc;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UnitService();
