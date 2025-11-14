const { prisma } = require('../models');

class DecisionService {
  /**
   * Lấy tất cả quyết định khen thưởng
   * @param {Object} filters - Bộ lọc tùy chọn (nam, loai_khen_thuong)
   * @param {number} page - Trang hiện tại
   * @param {number} limit - Số lượng mỗi trang
   */
  async getAllDecisions(filters = {}, page = 1, limit = 50) {
    try {
      const { nam, loai_khen_thuong, search } = filters;
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause = {};
      if (nam) whereClause.nam = parseInt(nam);
      if (loai_khen_thuong) whereClause.loai_khen_thuong = loai_khen_thuong;
      if (search) {
        whereClause.OR = [
          { so_quyet_dinh: { contains: search, mode: 'insensitive' } },
          { nguoi_ky: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [decisions, total] = await Promise.all([
        prisma.fileQuyetDinh.findMany({
          where: whereClause,
          orderBy: [{ nam: 'desc' }, { ngay_ky: 'desc' }, { so_quyet_dinh: 'desc' }],
          skip,
          take: limit,
        }),
        prisma.fileQuyetDinh.count({ where: whereClause }),
      ]);

      return {
        decisions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Autocomplete tìm kiếm quyết định theo số quyết định
   * @param {string} query - Từ khóa tìm kiếm
   * @param {number} limit - Số lượng kết quả tối đa
   */
  async autocomplete(query, limit = 10) {
    try {
      if (!query || query.trim() === '') {
        return [];
      }

      const decisions = await prisma.fileQuyetDinh.findMany({
        where: {
          so_quyet_dinh: {
            contains: query.trim(),
            mode: 'insensitive',
          },
        },
        orderBy: [{ nam: 'desc' }, { ngay_ky: 'desc' }],
        take: limit,
      });

      return decisions;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy chi tiết quyết định theo ID
   * @param {string} id - UUID của quyết định
   */
  async getDecisionById(id) {
    try {
      const decision = await prisma.fileQuyetDinh.findUnique({
        where: { id },
      });

      if (!decision) {
        throw new Error('Quyết định không tồn tại');
      }

      return decision;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy quyết định theo số quyết định
   * @param {string} soQuyetDinh - Số quyết định
   */
  async getDecisionBySoQuyetDinh(soQuyetDinh) {
    try {
      const decision = await prisma.fileQuyetDinh.findUnique({
        where: { so_quyet_dinh: soQuyetDinh },
      });

      return decision;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tạo quyết định mới
   * @param {Object} data - Dữ liệu quyết định
   */
  async createDecision(data) {
    try {
      const { so_quyet_dinh, nam, ngay_ky, nguoi_ky, file_path, loai_khen_thuong, ghi_chu } =
        data;

      // Kiểm tra số quyết định đã tồn tại chưa
      const existingDecision = await prisma.fileQuyetDinh.findUnique({
        where: { so_quyet_dinh },
      });

      if (existingDecision) {
        throw new Error('Số quyết định đã tồn tại');
      }

      // Validate dữ liệu
      if (!so_quyet_dinh || !nam || !ngay_ky || !nguoi_ky) {
        throw new Error('Thiếu thông tin bắt buộc: số quyết định, năm, ngày ký, người ký');
      }

      // Tạo quyết định mới
      const newDecision = await prisma.fileQuyetDinh.create({
        data: {
          so_quyet_dinh: so_quyet_dinh.trim(),
          nam: parseInt(nam),
          ngay_ky: new Date(ngay_ky),
          nguoi_ky: nguoi_ky.trim(),
          file_path: file_path || null,
          loai_khen_thuong: loai_khen_thuong || null,
          ghi_chu: ghi_chu || null,
        },
      });

      return newDecision;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cập nhật quyết định
   * @param {string} id - UUID của quyết định
   * @param {Object} data - Dữ liệu cập nhật
   */
  async updateDecision(id, data) {
    try {
      // Kiểm tra quyết định có tồn tại không
      const existingDecision = await prisma.fileQuyetDinh.findUnique({
        where: { id },
      });

      if (!existingDecision) {
        throw new Error('Quyết định không tồn tại');
      }

      const { so_quyet_dinh, nam, ngay_ky, nguoi_ky, file_path, loai_khen_thuong, ghi_chu } =
        data;

      // Nếu thay đổi số quyết định, kiểm tra trùng
      if (so_quyet_dinh && so_quyet_dinh !== existingDecision.so_quyet_dinh) {
        const duplicateDecision = await prisma.fileQuyetDinh.findUnique({
          where: { so_quyet_dinh },
        });

        if (duplicateDecision) {
          throw new Error('Số quyết định đã tồn tại');
        }
      }

      // Build update data
      const updateData = {};
      if (so_quyet_dinh !== undefined) updateData.so_quyet_dinh = so_quyet_dinh.trim();
      if (nam !== undefined) updateData.nam = parseInt(nam);
      if (ngay_ky !== undefined) updateData.ngay_ky = new Date(ngay_ky);
      if (nguoi_ky !== undefined) updateData.nguoi_ky = nguoi_ky.trim();
      if (file_path !== undefined) updateData.file_path = file_path;
      if (loai_khen_thuong !== undefined) updateData.loai_khen_thuong = loai_khen_thuong;
      if (ghi_chu !== undefined) updateData.ghi_chu = ghi_chu;

      // Cập nhật
      const updatedDecision = await prisma.fileQuyetDinh.update({
        where: { id },
        data: updateData,
      });

      return updatedDecision;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Xóa quyết định
   * @param {string} id - UUID của quyết định
   */
  async deleteDecision(id) {
    try {
      // Kiểm tra quyết định có tồn tại không
      const existingDecision = await prisma.fileQuyetDinh.findUnique({
        where: { id },
      });

      if (!existingDecision) {
        throw new Error('Quyết định không tồn tại');
      }

      // TODO: Kiểm tra quyết định có đang được sử dụng trong đề xuất nào không
      // Nếu có, không cho phép xóa

      // Xóa quyết định
      await prisma.fileQuyetDinh.delete({
        where: { id },
      });

      return { message: 'Xóa quyết định thành công' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy danh sách năm có quyết định
   */
  async getAvailableYears() {
    try {
      const years = await prisma.fileQuyetDinh.findMany({
        select: {
          nam: true,
        },
        distinct: ['nam'],
        orderBy: {
          nam: 'desc',
        },
      });

      return years.map((y) => y.nam);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy danh sách loại khen thưởng
   */
  async getAwardTypes() {
    try {
      const types = await prisma.fileQuyetDinh.findMany({
        select: {
          loai_khen_thuong: true,
        },
        distinct: ['loai_khen_thuong'],
        where: {
          loai_khen_thuong: {
            not: null,
          },
        },
      });

      return types
        .map((t) => t.loai_khen_thuong)
        .filter((t) => t !== null);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DecisionService();
