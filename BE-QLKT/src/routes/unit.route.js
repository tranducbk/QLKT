const express = require("express");
const router = express.Router();
const unitController = require("../controllers/unit.controller");
const { verifyToken, requireAdmin } = require("../middlewares/auth");
const {
  auditLog,
  createDescription,
  getResourceId,
} = require("../middlewares/auditLog");

/**
 * @route   GET /api/units
 * @desc    Lấy tất cả đơn vị (?hierarchy=true để lấy theo cấu trúc cây)
 * @access  Private - ADMIN and above
 */
router.get("/", verifyToken, requireAdmin, unitController.getAllUnits);

/**
 * @route   GET /api/units/:id
 * @desc    Lấy chi tiết đơn vị với cấu trúc cây
 * @access  Private - ADMIN and above
 */
router.get("/:id", verifyToken, requireAdmin, unitController.getUnitById);

/**
 * @route   POST /api/units
 * @desc    Tạo đơn vị mới (có thể là đơn vị trực thuộc với co_quan_don_vi_id)
 * @access  Private - ADMIN and above
 */
router.post(
  "/",
  verifyToken,
  requireAdmin,
  auditLog({
    action: "CREATE",
    resource: "units",
    getDescription: (req, res, responseData) => {
      const tenDonVi = req.body?.ten_don_vi || "N/A";
      return `Tạo mới đơn vị: ${tenDonVi}`;
    },
    getResourceId: getResourceId.fromResponse("id"),
  }),
  unitController.createUnit
);

/**
 * @route   PUT /api/units/:id
 * @desc    Sửa đơn vị (tên, co_quan_don_vi_id)
 * @access  Private - ADMIN and above
 */
router.put(
  "/:id",
  verifyToken,
  requireAdmin,
  auditLog({
    action: "UPDATE",
    resource: "units",
    getDescription: (req, res, responseData) => {
      const tenDonVi = req.body?.ten_don_vi || "N/A";
      return `Cập nhật đơn vị: ${tenDonVi}`;
    },
    getResourceId: getResourceId.fromParams("id"),
  }),
  unitController.updateUnit
);

/**
 * @route   DELETE /api/units/:id
 * @desc    Xóa đơn vị
 * @access  Private - ADMIN and above
 */
router.delete(
  "/:id",
  verifyToken,
  requireAdmin,
  auditLog({
    action: "DELETE",
    resource: "units",
    getDescription: (req, res, responseData) => {
      try {
        const data =
          typeof responseData === "string"
            ? JSON.parse(responseData)
            : responseData;
        const tenDonVi = data?.data?.ten_don_vi || `ID ${req.params.id}`;
        return `Xóa đơn vị: ${tenDonVi}`;
      } catch {
        return `Xóa đơn vị: ID ${req.params.id}`;
      }
    },
    getResourceId: getResourceId.fromParams("id"),
  }),
  unitController.deleteUnit
);

module.exports = router;
