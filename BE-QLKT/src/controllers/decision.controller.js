const decisionService = require('../services/decision.service');

class DecisionController {
  /**
   * GET /api/decisions
   * Lấy tất cả quyết định khen thưởng
   * Query params: ?nam=2024&loai_khen_thuong=CA_NHAN_HANG_NAM&search=...&page=1&limit=50
   */
  async getAllDecisions(req, res) {
    try {
      const { nam, loai_khen_thuong, search, page = 1, limit = 50 } = req.query;

      const filters = {};
      if (nam) filters.nam = nam;
      if (loai_khen_thuong) filters.loai_khen_thuong = loai_khen_thuong;
      if (search) filters.search = search;

      const result = await decisionService.getAllDecisions(
        filters,
        parseInt(page),
        parseInt(limit)
      );

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách quyết định thành công',
        data: result.decisions,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Get decisions error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lấy danh sách quyết định thất bại',
      });
    }
  }

  /**
   * GET /api/decisions/autocomplete
   * Autocomplete tìm kiếm quyết định theo số quyết định
   * Query params: ?q=123&limit=10
   */
  async autocomplete(req, res) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập từ khóa tìm kiếm (q)',
        });
      }

      const decisions = await decisionService.autocomplete(q, parseInt(limit));

      return res.status(200).json({
        success: true,
        message: 'Tìm kiếm quyết định thành công',
        data: decisions,
      });
    } catch (error) {
      console.error('Autocomplete decisions error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Tìm kiếm quyết định thất bại',
      });
    }
  }

  /**
   * GET /api/decisions/:id
   * Lấy chi tiết quyết định theo ID
   */
  async getDecisionById(req, res) {
    try {
      const { id } = req.params;
      const decision = await decisionService.getDecisionById(id);

      return res.status(200).json({
        success: true,
        message: 'Lấy thông tin quyết định thành công',
        data: decision,
      });
    } catch (error) {
      console.error('Get decision by id error:', error);
      return res.status(404).json({
        success: false,
        message: error.message || 'Không tìm thấy quyết định',
      });
    }
  }

  /**
   * GET /api/decisions/by-number/:soQuyetDinh
   * Lấy quyết định theo số quyết định
   */
  async getDecisionBySoQuyetDinh(req, res) {
    try {
      const { soQuyetDinh } = req.params;
      const decision = await decisionService.getDecisionBySoQuyetDinh(soQuyetDinh);

      if (!decision) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy quyết định',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Lấy thông tin quyết định thành công',
        data: decision,
      });
    } catch (error) {
      console.error('Get decision by number error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lấy thông tin quyết định thất bại',
      });
    }
  }

  /**
   * POST /api/decisions
   * Tạo quyết định mới
   */
  async createDecision(req, res) {
    try {
      const { so_quyet_dinh, nam, ngay_ky, nguoi_ky, loai_khen_thuong, ghi_chu } = req.body;

      // Validate input
      if (!so_quyet_dinh || !nam || !ngay_ky || !nguoi_ky) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ thông tin bắt buộc: số quyết định, năm, ngày ký, người ký',
        });
      }

      // Xử lý file nếu có
      let file_path = null;
      if (req.file) {
        file_path = `uploads/decisions/${req.file.filename}`;
      }

      const decision = await decisionService.createDecision({
        so_quyet_dinh,
        nam,
        ngay_ky,
        nguoi_ky,
        file_path,
        loai_khen_thuong,
        ghi_chu,
      });

      return res.status(201).json({
        success: true,
        message: 'Tạo quyết định thành công',
        data: decision,
      });
    } catch (error) {
      console.error('Create decision error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Tạo quyết định thất bại',
      });
    }
  }

  /**
   * PUT /api/decisions/:id
   * Cập nhật quyết định
   */
  async updateDecision(req, res) {
    try {
      const { id } = req.params;
      const { so_quyet_dinh, nam, ngay_ky, nguoi_ky, loai_khen_thuong, ghi_chu } = req.body;

      // Xử lý file nếu có
      let file_path = req.body.file_path; // Giữ nguyên nếu không có file mới
      if (req.file) {
        file_path = `uploads/decisions/${req.file.filename}`;
      }

      if (
        !so_quyet_dinh &&
        !nam &&
        !ngay_ky &&
        !nguoi_ky &&
        file_path === undefined &&
        loai_khen_thuong === undefined &&
        ghi_chu === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp thông tin cần cập nhật',
        });
      }

      const decision = await decisionService.updateDecision(id, {
        so_quyet_dinh,
        nam,
        ngay_ky,
        nguoi_ky,
        file_path,
        loai_khen_thuong,
        ghi_chu,
      });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật quyết định thành công',
        data: decision,
      });
    } catch (error) {
      console.error('Update decision error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Cập nhật quyết định thất bại',
      });
    }
  }

  /**
   * DELETE /api/decisions/:id
   * Xóa quyết định
   */
  async deleteDecision(req, res) {
    try {
      const { id } = req.params;
      const result = await decisionService.deleteDecision(id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Delete decision error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Xóa quyết định thất bại',
      });
    }
  }

  /**
   * GET /api/decisions/years
   * Lấy danh sách năm có quyết định
   */
  async getAvailableYears(req, res) {
    try {
      const years = await decisionService.getAvailableYears();

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách năm thành công',
        data: years,
      });
    } catch (error) {
      console.error('Get available years error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lấy danh sách năm thất bại',
      });
    }
  }

  /**
   * GET /api/decisions/award-types
   * Lấy danh sách loại khen thưởng
   */
  async getAwardTypes(req, res) {
    try {
      const types = await decisionService.getAwardTypes();

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách loại khen thưởng thành công',
        data: types,
      });
    } catch (error) {
      console.error('Get award types error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lấy danh sách loại khen thưởng thất bại',
      });
    }
  }
}

module.exports = new DecisionController();
