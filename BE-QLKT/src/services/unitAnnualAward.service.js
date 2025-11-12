const { prisma } = require('../models');

class UnitAnnualAwardService {
  /**
   * Tính số năm liên tục theo các bản ghi đã có của đơn vị đến năm N
   * Quy ước: có bản ghi năm X với tong_so_quan_nhan > 0 thì tính là đạt năm đó
   */
  async calculateContinuousYears(donViId, year) {
    const records = await prisma.theoDoiKhenThuongDonVi.findMany({
      where: { don_vi_id: donViId, nam: { lte: year } },
      orderBy: { nam: 'desc' },
      select: { nam: true, tong_so_quan_nhan: true },
    });

    let continuous = 0;
    let current = year;
    for (const r of records) {
      if (r.nam !== current) continue; // chỉ xét chuỗi liên tiếp từ năm hiện tại trở lùi
      if ((r.tong_so_quan_nhan ?? 0) > 0) {
        continuous += 1;
        current -= 1;
      } else {
        break;
      }
    }
    return continuous;
  }

  buildSuggestion(soNamLienTuc, hasDecision) {
    if (hasDecision) return null;
    if (soNamLienTuc == 5) {
      return 'Đủ điều kiện đề xuất Bằng khen Thủ tướng Chính phủ (5 năm liên tục).';
    }
    if (soNamLienTuc == 3) {
      return 'Đủ điều kiện đề xuất Bằng khen Tổng cục (3 năm liên tục).';
    }
    return null;
  }

  /** Manager đề xuất (status=PENDING) */
  async propose({ don_vi_id, nam, tong_so_quan_nhan = 0, chi_tiet, ghi_chu, nguoi_tao_id }) {
    const year = Number(nam);
    const unitId = don_vi_id; // Giữ nguyên UUID string

    const base = {
      don_vi_id: unitId,
      nam: year,
      tong_so_quan_nhan: Number(tong_so_quan_nhan) || 0,
      chi_tiet: chi_tiet ?? null,
      ghi_chu: ghi_chu ?? null,
      nguoi_tao_id: Number(nguoi_tao_id),
      status: 'PENDING',
      so_quyet_dinh: null,
      ten_file_pdf: null,
    };

    const record = await prisma.theoDoiKhenThuongDonVi.upsert({
      where: { unique_don_vi_nam: { don_vi_id: unitId, nam: year } },
      update: base,
      create: base,
    });

    const soNamLienTuc = await this.calculateContinuousYears(unitId, year);
    const du3 = soNamLienTuc >= 3;
    const du5 = soNamLienTuc >= 5;
    const goi_y = this.buildSuggestion(soNamLienTuc, !!record.so_quyet_dinh);

    return prisma.theoDoiKhenThuongDonVi.update({
      where: { id: record.id },
      data: {
        so_nam_lien_tuc: soNamLienTuc,
        du_dieu_kien_bk_tong_cuc: du3,
        du_dieu_kien_bk_thu_tuong: du5,
        goi_y,
      },
      include: { DonVi: true },
    });
  }

  /** Admin duyệt */
  async approve(id, { so_quyet_dinh, ten_file_pdf, nguoi_duyet_id }) {
    return prisma.theoDoiKhenThuongDonVi.update({
      where: { id: Number(id) },
      data: {
        status: 'APPROVED',
        so_quyet_dinh: so_quyet_dinh ?? null,
        ten_file_pdf: ten_file_pdf ?? null,
        nguoi_duyet_id: Number(nguoi_duyet_id),
        ngay_duyet: new Date(),
        goi_y: null,
      },
      include: { DonVi: true },
    });
  }

  /** Admin từ chối */
  async reject(id, { ghi_chu, nguoi_duyet_id }) {
    return prisma.theoDoiKhenThuongDonVi.update({
      where: { id: Number(id) },
      data: {
        status: 'REJECTED',
        ghi_chu: ghi_chu ?? null,
        nguoi_duyet_id: Number(nguoi_duyet_id),
        ngay_duyet: new Date(),
      },
      include: { DonVi: true },
    });
  }

  async list({ page = 1, limit = 10, year, donViId, userRole, userQuanNhanId }) {
    const where = {};
    if (year) where.nam = Number(year);
    if (donViId) where.don_vi_id = Number(donViId);

    // Phân quyền: USER và MANAGER chỉ xem được đơn vị của mình
    if ((userRole === 'USER' || userRole === 'MANAGER') && userQuanNhanId) {
      const user = await prisma.quanNhan.findUnique({
        where: { id: Number(userQuanNhanId) },
        select: { don_vi_id: true },
      });

      if (user) {
        where.don_vi_id = user.don_vi_id;
      } else {
        // Nếu không tìm thấy quân nhân, trả về rỗng
        return {
          items: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit),
            totalPages: 0,
          },
        };
      }
    }
    // ADMIN xem tất cả (không cần filter)

    const [total, items] = await Promise.all([
      prisma.theoDoiKhenThuongDonVi.count({ where }),
      prisma.theoDoiKhenThuongDonVi.findMany({
        where,
        orderBy: [{ nam: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: { DonVi: true },
      }),
    ]);

    return {
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id, userRole, userQuanNhanId) {
    const record = await prisma.theoDoiKhenThuongDonVi.findUnique({
      where: { id: Number(id) },
      include: { DonVi: true },
    });

    if (!record) return null;

    // Phân quyền: USER và MANAGER chỉ xem được đơn vị của mình
    if ((userRole === 'USER' || userRole === 'MANAGER') && userQuanNhanId) {
      const user = await prisma.quanNhan.findUnique({
        where: { id: Number(userQuanNhanId) },
        select: { don_vi_id: true },
      });

      if (!user || user.don_vi_id !== record.don_vi_id) {
        return null; // Không có quyền xem
      }
    }
    // ADMIN xem được tất cả

    return record;
  }

  /**
   * Upsert bản ghi theo (don_vi_id, nam) và tự động tính so_nam_lien_tuc + flags + gợi ý
   */
  async upsert({
    don_vi_id,
    nam,
    tong_so_quan_nhan = 0,
    so_quyet_dinh,
    ten_file_pdf,
    chi_tiet,
    ghi_chu,
    nguoi_tao_id,
  }) {
    const year = Number(nam);
    const unitId = don_vi_id; // Giữ nguyên UUID string

    // Tạm thời set 0, sẽ cập nhật lại sau khi upsert
    const dataBase = {
      don_vi_id: unitId,
      nam: year,
      tong_so_quan_nhan: Number(tong_so_quan_nhan) || 0,
      so_quyet_dinh: so_quyet_dinh ?? null,
      ten_file_pdf: ten_file_pdf ?? null,
      chi_tiet: chi_tiet ?? null,
      ghi_chu: ghi_chu ?? null,
      nguoi_tao_id: Number(nguoi_tao_id),
    };

    const record = await prisma.theoDoiKhenThuongDonVi.upsert({
      where: { unique_don_vi_nam: { don_vi_id: unitId, nam: year } },
      update: dataBase,
      create: dataBase,
    });

    const soNamLienTuc = await this.calculateContinuousYears(unitId, year);
    const du3 = soNamLienTuc >= 3;
    const du5 = soNamLienTuc >= 5;
    const goi_y = this.buildSuggestion(soNamLienTuc, !!record.so_quyet_dinh);

    const updated = await prisma.theoDoiKhenThuongDonVi.update({
      where: { id: record.id },
      data: {
        so_nam_lien_tuc: soNamLienTuc,
        du_dieu_kien_bk_tong_cuc: du3,
        du_dieu_kien_bk_thu_tuong: du5,
        goi_y,
      },
      include: { DonVi: true },
    });

    return updated;
  }

  /**
   * Recalculate theo đơn vị và năm (hoặc toàn bộ đơn vị)
   */
  async recalculate({ don_vi_id, nam }) {
    const where = {};
    if (don_vi_id) where.don_vi_id = don_vi_id; // Giữ nguyên UUID string
    if (nam) where.nam = Number(nam);

    const records = await prisma.theoDoiKhenThuongDonVi.findMany({ where });
    const updates = [];
    for (const r of records) {
      const soNamLienTuc = await this.calculateContinuousYears(r.don_vi_id, r.nam);
      const du3 = soNamLienTuc >= 3;
      const du5 = soNamLienTuc >= 5;
      const goi_y = this.buildSuggestion(soNamLienTuc, !!r.so_quyet_dinh);
      updates.push(
        prisma.theoDoiKhenThuongDonVi.update({
          where: { id: r.id },
          data: {
            so_nam_lien_tuc: soNamLienTuc,
            du_dieu_kien_bk_tong_cuc: du3,
            du_dieu_kien_bk_thu_tuong: du5,
            goi_y,
          },
        })
      );
    }
    await prisma.$transaction(updates);
    return updates.length;
  }

  async remove(id) {
    await prisma.theoDoiKhenThuongDonVi.delete({ where: { id: Number(id) } });
    return true;
  }
}

module.exports = new UnitAnnualAwardService();
