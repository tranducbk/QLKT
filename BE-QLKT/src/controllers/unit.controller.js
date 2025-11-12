const unitService = require("../services/unit.service");

class UnitController {
  /**
   * GET /api/units
   * Lấy tất cả đơn vị
   * Query params: ?hierarchy=true để lấy theo cấu trúc cây
   */
  async getAllUnits(req, res) {
    try {
      const includeHierarchy = req.query.hierarchy === "true";
      const result = await unitService.getAllUnits(includeHierarchy);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách đơn vị thành công",
        data: result,
      });
    } catch (error) {
      console.error("Get units error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lấy danh sách đơn vị thất bại",
      });
    }
  }

  /**
   * POST /api/units
   * Tạo đơn vị mới (có thể là đơn vị con)
   */
  async createUnit(req, res) {
    try {
      const { ma_don_vi, ten_don_vi, co_quan_don_vi_id } = req.body;

      // Validate input
      if (!ma_don_vi || !ten_don_vi) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập đầy đủ thông tin: ma_don_vi, ten_don_vi",
        });
      }

      const result = await unitService.createUnit({
        ma_don_vi,
        ten_don_vi,
        co_quan_don_vi_id,
      });

      return res.status(201).json({
        success: true,
        message: "Tạo đơn vị thành công",
        data: result,
      });
    } catch (error) {
      console.error("Create unit error:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Tạo đơn vị thất bại",
      });
    }
  }

  /**
   * PUT /api/units/:id
   * Sửa đơn vị (tên, co_quan_don_vi_id)
   */
  async updateUnit(req, res) {
    try {
      const { id } = req.params;
      const { ten_don_vi, co_quan_don_vi_id } = req.body;

      if (!ten_don_vi && co_quan_don_vi_id === undefined) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp thông tin cần cập nhật",
        });
      }

      const result = await unitService.updateUnit(id, {
        ten_don_vi,
        co_quan_don_vi_id,
      });

      return res.status(200).json({
        success: true,
        message: "Cập nhật đơn vị thành công",
        data: result,
      });
    } catch (error) {
      console.error("Update unit error:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Cập nhật đơn vị thất bại",
      });
    }
  }

  /**
   * GET /api/units/:id
   * Lấy chi tiết đơn vị với cấu trúc cây
   */
  async getUnitById(req, res) {
    try {
      const { id } = req.params;
      const result = await unitService.getUnitById(id);

      return res.status(200).json({
        success: true,
        message: "Lấy thông tin đơn vị thành công",
        data: result,
      });
    } catch (error) {
      console.error("Get unit by id error:", error);
      return res.status(404).json({
        success: false,
        message: error.message || "Không tìm thấy đơn vị",
      });
    }
  }

  /**
   * DELETE /api/units/:id
   * Xóa đơn vị
   */
  async deleteUnit(req, res) {
    try {
      const { id } = req.params;

      const result = await unitService.deleteUnit(id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Delete unit error:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Xóa đơn vị thất bại",
      });
    }
  }
}

module.exports = new UnitController();
