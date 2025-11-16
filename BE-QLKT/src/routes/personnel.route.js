const express = require('express');
const router = express.Router();
const multer = require('multer');
const personnelController = require('../controllers/personnel.controller');
const { verifyToken, requireAdmin, requireManager, requireAuth } = require('../middlewares/auth');
const { auditLog, createDescription, getResourceId } = require('../middlewares/auditLog');
const { getLogDescription } = require('../helpers/auditLogHelper');

// Sử dụng memory storage để đọc file Excel trực tiếp từ buffer
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @route   GET /api/personnel
 * @desc    Lấy danh sách quân nhân (có phân trang)
 * @access  Private - ADMIN, MANAGER
 */
router.get('/', verifyToken, requireManager, personnelController.getPersonnel);

/**
 * @route   GET /api/personnel/:id
 * @desc    Lấy chi tiết 1 quân nhân
 * @access  Private - ADMIN, MANAGER, USER (chỉ xem của mình)
 */
router.get('/:id', verifyToken, requireAuth, personnelController.getPersonnelById);

/**
 * @route   POST /api/personnel
 * @desc    Thêm quân nhân mới
 * @access  Private - ADMIN only
 */
router.post(
  '/',
  verifyToken,
  requireAdmin,
  auditLog({
    action: 'CREATE',
    resource: 'personnel',
    getDescription: getLogDescription('personnel', 'CREATE'),
    getResourceId: getResourceId.fromResponse('id'),
  }),
  personnelController.createPersonnel
);

/**
 * @route   PUT /api/personnel/:id
 * @desc    Cập nhật quân nhân (chuyển đơn vị, chức vụ)
 * @access  Private - ADMIN, MANAGER (cho đơn vị mình), USER (chỉ chính mình)
 */
router.put(
  '/:id',
  verifyToken,
  requireAuth, // Thay đổi từ requireManager sang requireAuth để cho phép USER
  auditLog({
    action: 'UPDATE',
    resource: 'personnel',
    getDescription: getLogDescription('personnel', 'UPDATE'),
    getResourceId: getResourceId.fromParams('id'),
  }),
  personnelController.updatePersonnel
);

/**
 * @route   POST /api/personnel/import
 * @desc    Import hàng loạt từ Excel
 * @access  Private - ADMIN only
 */
router.post(
  '/import',
  verifyToken,
  requireAdmin,
  upload.single('file'),
  auditLog({
    action: 'IMPORT',
    resource: 'personnel',
    getDescription: getLogDescription('personnel', 'IMPORT'),
  }),
  personnelController.importPersonnel
);

/**
 * @route   GET /api/personnel/export
 * @desc    Xuất toàn bộ dữ liệu ra Excel
 * @access  Private - ADMIN only
 */
router.get(
  '/export',
  verifyToken,
  requireAdmin,
  auditLog({
    action: 'EXPORT',
    resource: 'personnel',
    getDescription: getLogDescription('personnel', 'EXPORT'),
  }),
  personnelController.exportPersonnel
);

/**
 * @route   GET /api/personnel/export-sample
 * @desc    Xuất file mẫu Excel để import
 * @access  Private - ADMIN only
 */
router.get('/export-sample', verifyToken, requireAdmin, personnelController.exportPersonnelSample);

module.exports = router;
