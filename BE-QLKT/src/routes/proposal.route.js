const router = require('express').Router();
const multer = require('multer');
const proposalController = require('../controllers/proposal.controller');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Cấu hình multer để xử lý file upload (lưu vào memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Giới hạn 10MB
  },
  fileFilter: (req, file, cb) => {
    // Chấp nhận file Excel và PDF
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/pdf', // .pdf
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc PDF (.pdf)'));
    }
  },
});

// ============================================
// ROUTES
// ============================================

/**
 * @route   GET /api/proposals/template
 * @desc    Xuất file mẫu Excel
 * @access  MANAGER, ADMIN
 */
router.get(
  '/template',
  verifyToken,
  checkRole(['MANAGER', 'ADMIN']),
  proposalController.exportTemplate
);

/**
 * @route   POST /api/proposals
 * @desc    Nộp file đề xuất khen thưởng (Excel + PDF)
 * @access  MANAGER, ADMIN
 */
router.post(
  '/',
  verifyToken,
  checkRole(['MANAGER', 'ADMIN']),
  upload.fields([
    { name: 'file_excel', maxCount: 1 },
    { name: 'file_pdf', maxCount: 1 },
  ]),
  proposalController.submitProposal
);

/**
 * @route   GET /api/proposals
 * @desc    Lấy danh sách đề xuất
 * @access  MANAGER, ADMIN
 */
router.get('/', verifyToken, checkRole(['MANAGER', 'ADMIN']), proposalController.getProposals);

/**
 * @route   GET /api/proposals/:id
 * @desc    Lấy chi tiết 1 đề xuất
 * @access  MANAGER, ADMIN
 */
router.get(
  '/:id',
  verifyToken,
  checkRole(['MANAGER', 'ADMIN']),
  proposalController.getProposalById
);

/**
 * @route   POST /api/proposals/:id/approve
 * @desc    Phê duyệt đề xuất và import vào CSDL
 * @access  ADMIN
 */
router.post(
  '/:id/approve',
  verifyToken,
  checkRole(['ADMIN']),
  upload.fields([
    { name: 'file_pdf_cstt', maxCount: 1 },
    { name: 'file_pdf_cstdcs', maxCount: 1 },
    { name: 'file_pdf_bkbqp', maxCount: 1 },
    { name: 'file_pdf_cstdtq', maxCount: 1 },
  ]),
  proposalController.approveProposal
);

/**
 * @route   POST /api/proposals/:id/reject
 * @desc    Từ chối đề xuất với lý do
 * @access  ADMIN
 */
router.post('/:id/reject', verifyToken, checkRole(['ADMIN']), proposalController.rejectProposal);

/**
 * @route   GET /api/proposals/:id/download-excel
 * @desc    Tải file Excel của đề xuất
 * @access  MANAGER, ADMIN
 */
router.get(
  '/:id/download-excel',
  verifyToken,
  checkRole(['MANAGER', 'ADMIN']),
  proposalController.downloadProposalExcel
);

/**
 * @route   GET /api/proposals/uploads/:filename
 * @desc    Lấy file PDF đã upload
 * @access  MANAGER, ADMIN
 */
router.get(
  '/uploads/:filename',
  verifyToken,
  checkRole(['MANAGER', 'ADMIN']),
  proposalController.getPdfFile
);

/**
 * @route   DELETE /api/proposals/:id
 * @desc    Xóa đề xuất (Manager chỉ có thể xóa đề xuất của chính mình, status = PENDING)
 * @access  MANAGER, ADMIN
 */
router.delete(
  '/:id',
  verifyToken,
  checkRole(['MANAGER', 'ADMIN']),
  proposalController.deleteProposal
);

module.exports = router;
