const { prisma } = require("../models");

class PositionService {
  /**
   * Lấy chức vụ (lọc theo đơn vị nếu có, nếu không thì trả về tất cả)
   * @param {string} unitId - UUID đơn vị (optional)
   * @param {boolean} includeChildren - Có lấy chức vụ của các đơn vị con không
   */
  async getPositions(unitId, includeChildren = false) {
    try {
      if (includeChildren && unitId) {
        // Kiểm tra đơn vị có tồn tại không (có thể là CoQuanDonVi hoặc DonViTrucThuoc)
        const [coQuanDonVi, donViTrucThuoc] = await Promise.all([
          prisma.coQuanDonVi.findUnique({ where: { id: unitId } }),
          prisma.donViTrucThuoc.findUnique({ where: { id: unitId } }),
        ]);

        if (!coQuanDonVi && !donViTrucThuoc) {
          throw new Error("Đơn vị không tồn tại");
        }

        // Thu thập tất cả ID đơn vị (cha + tất cả các cấp con)
        const unitIds = [unitId];

        // Nếu là cơ quan đơn vị, lấy tất cả đơn vị trực thuộc
        if (coQuanDonVi) {
          const childUnits = await prisma.donViTrucThuoc.findMany({
            where: { co_quan_don_vi_id: unitId },
            select: { id: true },
          });
          childUnits.forEach((child) => unitIds.push(child.id));
        }

        // Lấy tất cả chức vụ của các đơn vị này
        const positions = await prisma.chucVu.findMany({
          where: {
            OR: [
              { co_quan_don_vi_id: { in: unitIds } },
              { don_vi_truc_thuoc_id: { in: unitIds } },
            ],
          },
          include: {
            CoQuanDonVi: true,
            DonViTrucThuoc: {
              include: {
                CoQuanDonVi: true,
              },
            },
          },
          orderBy: [
            { CoQuanDonVi: { ma_don_vi: "asc" } },
            { DonViTrucThuoc: { ma_don_vi: "asc" } },
            { id: "asc" },
          ],
        });

        return positions;
      } else {
        // Lấy chức vụ của đơn vị cụ thể hoặc tất cả
        const whereClause = unitId
          ? {
              OR: [
                { co_quan_don_vi_id: unitId },
                { don_vi_truc_thuoc_id: unitId },
              ],
            }
          : {};

        const positions = await prisma.chucVu.findMany({
          where: whereClause,
          include: {
            CoQuanDonVi: true,
            DonViTrucThuoc: {
              include: {
                CoQuanDonVi: true,
              },
            },
          },
          orderBy: [
            { CoQuanDonVi: { ma_don_vi: "asc" } },
            { DonViTrucThuoc: { ma_don_vi: "asc" } },
            { id: "asc" },
          ],
        });

        return positions;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tạo chức vụ mới
   */
  async createPosition(data) {
    try {
      const { unit_id, ten_chuc_vu, is_manager, he_so_luong } = data;

      // Đảm bảo unit_id là string (UUID)
      const unitIdString =
        typeof unit_id === "string" ? unit_id : unit_id?.toString();

      // Kiểm tra đơn vị có tồn tại không (có thể là CoQuanDonVi hoặc DonViTrucThuoc)
      const [coQuanDonVi, donViTrucThuoc] = await Promise.all([
        prisma.coQuanDonVi.findUnique({ where: { id: unitIdString } }),
        prisma.donViTrucThuoc.findUnique({ where: { id: unitIdString } }),
      ]);

      if (!coQuanDonVi && !donViTrucThuoc) {
        throw new Error("Đơn vị không tồn tại");
      }

      // Xác định đơn vị là cơ quan đơn vị hay đơn vị trực thuộc
      const isCoQuanDonVi = !!coQuanDonVi;

      // Kiểm tra trùng tên chức vụ trong cùng đơn vị
      const existingPosition = await prisma.chucVu.findFirst({
        where: isCoQuanDonVi
          ? {
              co_quan_don_vi_id: unitIdString,
              ten_chuc_vu,
            }
          : {
              don_vi_truc_thuoc_id: unitIdString,
              ten_chuc_vu,
            },
      });

      if (existingPosition) {
        throw new Error("Tên chức vụ đã tồn tại trong đơn vị này");
      }

      // Tạo chức vụ mới
      const createData = {
        ten_chuc_vu,
        is_manager: is_manager || false,
        he_so_luong: he_so_luong || null,
      };

      if (isCoQuanDonVi) {
        createData.co_quan_don_vi_id = unitIdString;
        createData.don_vi_truc_thuoc_id = null;
      } else {
        createData.co_quan_don_vi_id = null;
        createData.don_vi_truc_thuoc_id = unitIdString;
      }

      const newPosition = await prisma.chucVu.create({
        data: createData,
        include: {
          CoQuanDonVi: true,
          DonViTrucThuoc: {
            include: {
              CoQuanDonVi: true,
            },
          },
        },
      });

      return newPosition;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sửa chức vụ
   */
  async updatePosition(id, data) {
    try {
      const { ten_chuc_vu, is_manager, he_so_luong } = data;

      // Kiểm tra chức vụ có tồn tại không
      const position = await prisma.chucVu.findUnique({
        where: { id },
      });

      if (!position) {
        throw new Error("Chức vụ không tồn tại");
      }

      // Cập nhật chức vụ
      const updatedPosition = await prisma.chucVu.update({
        where: { id },
        data: {
          ten_chuc_vu: ten_chuc_vu || position.ten_chuc_vu,
          is_manager:
            is_manager !== undefined ? is_manager : position.is_manager,
          he_so_luong:
            he_so_luong !== undefined ? he_so_luong : position.he_so_luong,
        },
        include: {
          CoQuanDonVi: true,
          DonViTrucThuoc: {
            include: {
              CoQuanDonVi: true,
            },
          },
        },
      });

      return updatedPosition;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Xóa chức vụ
   */
  async deletePosition(id) {
    try {
      // Kiểm tra chức vụ có tồn tại không
      const position = await prisma.chucVu.findUnique({
        where: { id },
      });

      if (!position) {
        throw new Error("Chức vụ không tồn tại");
      }

      // Kiểm tra có quân nhân nào đang giữ chức vụ này không
      const personnelCount = await prisma.quanNhan.count({
        where: { chuc_vu_id: id },
      });

      if (personnelCount > 0) {
        throw new Error(
          `Không thể xóa chức vụ vì còn ${personnelCount} quân nhân đang giữ chức vụ này`
        );
      }

      // Xóa chức vụ
      await prisma.chucVu.delete({
        where: { id },
      });

      return { message: "Xóa chức vụ thành công" };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PositionService();
