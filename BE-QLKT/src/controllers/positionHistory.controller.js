const positionHistoryService = require('../services/positionHistory.service');
const profileService = require('../services/profile.service');

class PositionHistoryController {
  async getPositionHistory(req, res) {
    try {
      const { personnel_id } = req.query;

      if (!personnel_id) {
        return res.status(400).json({
          success: false,
          message: 'Tham số personnel_id là bắt buộc',
        });
      }

      const result = await positionHistoryService.getPositionHistory(personnel_id);

      return res.status(200).json({
        success: true,
        message: 'Lấy lịch sử chức vụ thành công',
        data: result,
      });
    } catch (error) {
      console.error('Get position history error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lấy lịch sử chức vụ thất bại',
      });
    }
  }

  async createPositionHistory(req, res) {
    try {
      // personnel_id lấy từ URL params (nested route: /api/personnel/:personnelId/position-history)
      const personnel_id = req.params.personnelId || req.body.personnel_id;
      const { chuc_vu_id, ngay_bat_dau, ngay_ket_thuc } = req.body;

      if (!personnel_id || !chuc_vu_id || !ngay_bat_dau) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ: personnel_id, chuc_vu_id, ngay_bat_dau',
        });
      }

      const result = await positionHistoryService.createPositionHistory({
        personnel_id,
        chuc_vu_id,
        ngay_bat_dau,
        ngay_ket_thuc,
      });

      // Tự động cập nhật lại hồ sơ sau khi thêm lịch sử chức vụ
      try {
        await profileService.recalculateProfile(personnel_id);
        console.log(`✅ Auto-recalculated profile for personnel ${personnel_id}`);
      } catch (recalcError) {
        console.error(`⚠️ Failed to auto-recalculate profile:`, recalcError.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Thêm lịch sử chức vụ thành công',
        data: result,
      });
    } catch (error) {
      console.error('Create position history error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Thêm lịch sử chức vụ thất bại',
      });
    }
  }

  async updatePositionHistory(req, res) {
    try {
      const { id } = req.params;
      const { chuc_vu_id, ngay_bat_dau, ngay_ket_thuc } = req.body;

      const result = await positionHistoryService.updatePositionHistory(id, {
        chuc_vu_id,
        ngay_bat_dau,
        ngay_ket_thuc,
      });

      // Tự động cập nhật lại hồ sơ sau khi cập nhật lịch sử chức vụ
      try {
        await profileService.recalculateProfile(result.quan_nhan_id);
        console.log(`✅ Auto-recalculated profile for personnel ${result.quan_nhan_id}`);
      } catch (recalcError) {
        console.error(`⚠️ Failed to auto-recalculate profile:`, recalcError.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Cập nhật lịch sử chức vụ thành công',
        data: result,
      });
    } catch (error) {
      console.error('Update position history error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Cập nhật lịch sử chức vụ thất bại',
      });
    }
  }

  async deletePositionHistory(req, res) {
    try {
      const { id } = req.params;

      const result = await positionHistoryService.deletePositionHistory(id);

      // Tự động cập nhật lại hồ sơ sau khi xóa lịch sử chức vụ
      if (result.personnelId) {
        try {
          await profileService.recalculateProfile(result.personnelId);
          console.log(`✅ Auto-recalculated profile for personnel ${result.personnelId}`);
        } catch (recalcError) {
          console.error(`⚠️ Failed to auto-recalculate profile:`, recalcError.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Delete position history error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Xóa lịch sử chức vụ thất bại',
      });
    }
  }
}

module.exports = new PositionHistoryController();
