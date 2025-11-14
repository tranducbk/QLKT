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
      so_quyet_dinh: body.so_quyet_dinh,
      ten_file_pdf: body.ten_file_pdf,
      ghi_chu: body.ghi_chu,
      nguoi_tao_id: req.user?.id || body.nguoi_tao_id, // fallback nếu chưa gắn middleware auth
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
      ten_file_pdf: req.body?.ten_file_pdf,
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
