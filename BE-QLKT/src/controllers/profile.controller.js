const profileService = require('../services/profile.service');

class ProfileController {
  /**
   * GET /api/profiles/annual/:personnel_id
   * Lấy hồ sơ gợi ý hằng năm
   * Query params: ?year=2025 (optional, nếu có sẽ tính toán lại với năm đó)
   */
  async getAnnualProfile(req, res) {
    try {
      const { personnel_id } = req.params;
      const { year } = req.query; // Lấy năm từ query params
      const yearNumber = year ? parseInt(year, 10) : null;

      // Nếu có năm, tính toán lại hồ sơ với năm đó trước khi lấy
      if (yearNumber) {
        await profileService.recalculateAnnualProfile(personnel_id, yearNumber);
      }

      const result = await profileService.getAnnualProfile(personnel_id);

      return res.status(200).json({
        success: true,
        message: 'Lấy hồ sơ hằng năm thành công',
        data: result,
      });
    } catch (error) {
      console.error('Get annual profile error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lấy hồ sơ hằng năm thất bại',
      });
    }
  }

  /**
   * GET /api/profiles/service/:personnel_id
   * Lấy hồ sơ gợi ý niên hạn
   */
  async getServiceProfile(req, res) {
    try {
      const { personnel_id } = req.params;

      const result = await profileService.getServiceProfile(personnel_id);

      return res.status(200).json({
        success: true,
        message: 'Lấy hồ sơ niên hạn thành công',
        data: result,
      });
    } catch (error) {
      console.error('Get service profile error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lấy hồ sơ niên hạn thất bại',
      });
    }
  }

  /**
   * POST /api/profiles/recalculate/:personnel_id
   * Tính toán lại hồ sơ cho 1 quân nhân
   * Query params: ?year=2025 (optional, mặc định là năm hiện tại)
   */
  async recalculateProfile(req, res) {
    try {
      const { personnel_id } = req.params;
      const { year } = req.query; // Lấy năm từ query params
      const yearNumber = year ? parseInt(year, 10) : null;

      const result = await profileService.recalculateProfile(personnel_id, yearNumber);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Recalculate profile error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Tính toán lại hồ sơ thất bại',
      });
    }
  }

  /**
   * POST /api/profiles/recalculate-all
   * Tính toán lại cho toàn bộ quân nhân
   */
  async recalculateAll(req, res) {
    try {
      const result = await profileService.recalculateAll();

      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          success: result.success,
          errors: result.errors,
        },
      });
    } catch (error) {
      console.error('Recalculate all profiles error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Tính toán lại toàn bộ hồ sơ thất bại',
      });
    }
  }

  /**
   * GET /api/profiles/service
   * Lấy danh sách tất cả hồ sơ niên hạn (cho admin)
   */
  async getAllServiceProfiles(req, res) {
    try {
      const result = await profileService.getAllServiceProfiles();

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách hồ sơ niên hạn thành công',
        data: result,
      });
    } catch (error) {
      console.error('Get all service profiles error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lấy danh sách hồ sơ niên hạn thất bại',
      });
    }
  }

  /**
   * PUT /api/profiles/service/:personnel_id
   * Cập nhật trạng thái hồ sơ niên hạn (ADMIN duyệt huân chương)
   */
  async updateServiceProfile(req, res) {
    try {
      const { personnel_id } = req.params;
      const updates = req.body;

      const result = await profileService.updateServiceProfile(personnel_id, updates);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật hồ sơ niên hạn thành công',
        data: result,
      });
    } catch (error) {
      console.error('Update service profile error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Cập nhật hồ sơ niên hạn thất bại',
      });
    }
  }
}

module.exports = new ProfileController();
