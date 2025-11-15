const router = require('express').Router();
const multer = require('multer');
const proposalController = require('../controllers/proposal.controller');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Cấu hình multer cho file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'));
    }
  },
});

// ============================================
// ROUTES - QUẢN LÝ KHEN THƯỞNG
// ============================================

/**
 * @route   GET /api/awards/template
 * @desc    Tải file mẫu Excel để import khen thưởng
 * @access  ADMIN
 */
router.get('/template', verifyToken, checkRole(['ADMIN']), proposalController.getAwardsTemplate);

/**
 * @route   POST /api/awards/import
 * @desc    Import khen thưởng từ file Excel
 * @access  ADMIN
 */
router.post(
  '/import',
  verifyToken,
  checkRole(['ADMIN']),
  upload.single('file'),
  proposalController.importAwards
);

/**
 * @route   GET /api/awards
 * @desc    Lấy danh sách tất cả khen thưởng (Admin: tất cả, Manager: đơn vị mình)
 * @access  ADMIN, MANAGER
 */
router.get('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), proposalController.getAllAwards);

/**
 * @route   GET /api/awards/export
 * @desc    Xuất file Excel tổng hợp khen thưởng (Admin: tất cả, Manager: đơn vị mình)
 * @access  ADMIN, MANAGER
 */
router.get(
  '/export',
  verifyToken,
  checkRole(['ADMIN', 'MANAGER']),
  proposalController.exportAllAwardsExcel
);

/**
 * @route   GET /api/awards/statistics
 * @desc    Thống kê khen thưởng theo loại
 * @access  ADMIN, MANAGER
 */
router.get(
  '/statistics',
  verifyToken,
  checkRole(['ADMIN', 'MANAGER']),
  proposalController.getAwardsStatistics
);

module.exports = router;
