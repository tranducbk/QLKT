const service = require('../services/unitAnnualAward.service');

exports.list = async (req, res) => {
  try {
    const { page, limit, year, don_vi_id } = req.query;
    const data = await service.list({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      year,
      donViId: don_vi_id,
      userRole: req.user?.role,
      userQuanNhanId: req.user?.quan_nhan_id,
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await service.getById(req.params.id, req.user?.role, req.user?.quan_nhan_id);
    if (!data) {
      return res
        .status(404)
        .json({ success: false, error: 'Không tìm thấy bản ghi hoặc không có quyền xem' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.upsert = async (req, res) => {
  try {
    const body = req.body || {};
    const payload = {
      don_vi_id: body.don_vi_id,
      nam: body.nam,
      danh_hieu: body.danh_hieu,
      so_quyet_dinh: body.so_quyet_dinh,
      file_quyet_dinh: body.file_quyet_dinh,
      ghi_chu: body.ghi_chu,
      nguoi_tao_id: req.user?.id || body.nguoi_tao_id,
    };

    const data = await service.upsert(payload);
    res
      .status(201)
      .json({ success: true, data, message: 'Lưu khen thưởng đơn vị hằng năm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.propose = async (req, res) => {
  try {
    const body = req.body || {};
    const data = await service.propose({
      don_vi_id: body.don_vi_id,
      nam: body.nam,
      danh_hieu: body.danh_hieu,
      ghi_chu: body.ghi_chu,
      nguoi_tao_id: req.user?.id || body.nguoi_tao_id,
    });
    res.status(201).json({
      success: true,
      data,
      message: 'Đã gửi đề xuất khen thưởng đơn vị. Hãy chờ admin duyệt',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.approve = async (req, res) => {
  try {
    const data = await service.approve(req.params.id, {
      so_quyet_dinh: req.body?.so_quyet_dinh,
      file_quyet_dinh: req.body?.file_quyet_dinh,
      nguoi_duyet_id: req.user?.id || req.body?.nguoi_duyet_id,
    });
    res.json({ success: true, data, message: 'Đã phê duyệt đề xuất' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.reject = async (req, res) => {
  try {
    const data = await service.reject(req.params.id, {
      ghi_chu: req.body?.ghi_chu,
      nguoi_duyet_id: req.user?.id || req.body?.nguoi_duyet_id,
    });
    res.json({ success: true, data, message: 'Đã từ chối đề xuất' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.recalculate = async (req, res) => {
  try {
    const count = await service.recalculate({ don_vi_id: req.body?.don_vi_id, nam: req.body?.nam });
    res.json({ success: true, data: { updated: count } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await service.remove(req.params.id);
    res.json({ success: true, data: true, message: 'Đã xóa bản ghi' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Lấy lịch sử khen thưởng hằng năm của đơn vị (mảng)
 * Query: don_vi_id (bắt buộc)
 */
exports.getUnitAnnualAwards = async (req, res) => {
  try {
    const { don_vi_id } = req.query;

    if (!don_vi_id) {
      return res.status(400).json({ success: false, message: 'Tham số don_vi_id là bắt buộc' });
    }

    const result = await service.getUnitAnnualAwards(
      don_vi_id,
      req.user?.role,
      req.user?.quan_nhan_id
    );

    return res
      .status(200)
      .json({ success: true, message: 'Lấy lịch sử khen thưởng đơn vị thành công', data: result });
  } catch (error) {
    console.error('Get unit annual awards error:', error);
    const msg = error?.message || 'Lấy lịch sử thất bại';
    if (msg.includes('quyền')) {
      return res.status(403).json({ success: false, message: msg });
    }
    return res.status(500).json({ success: false, message: msg });
  }
};

/**
 * GET /api/awards/units/annual/profile/:don_vi_id
 * Lấy hồ sơ gợi ý hằng năm của đơn vị (tương tự getAnnualProfile cho cá nhân)
 * Query params: ?year=2025 (optional, nếu có sẽ tính toán lại với năm đó)
 */
exports.getUnitAnnualProfile = async (req, res) => {
  try {
    const { don_vi_id } = req.params;
    const { year } = req.query;
    const yearNumber = year ? parseInt(year, 10) : null;

    if (!don_vi_id) {
      return res.status(400).json({ success: false, message: 'Tham số don_vi_id là bắt buộc' });
    }

    // Nếu có năm, tính toán lại hồ sơ với năm đó trước khi lấy
    if (yearNumber) {
      await service.recalculateAnnualUnit(don_vi_id, yearNumber);
    }

    const result = await service.getAnnualUnit(don_vi_id, yearNumber || new Date().getFullYear());

    return res.status(200).json({
      success: true,
      message: 'Lấy hồ sơ hằng năm đơn vị thành công',
      data: result,
    });
  } catch (error) {
    console.error('Get unit annual profile error:', error);
    const msg = error?.message || 'Lấy hồ sơ hằng năm đơn vị thất bại';
    if (msg.includes('quyền')) {
      return res.status(403).json({ success: false, message: msg });
    }
    return res.status(500).json({ success: false, message: msg });
  }
};
