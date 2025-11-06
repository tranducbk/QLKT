const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/unitAnnualAward.controller');

// TODO: gắn middleware auth/role khi sẵn có: requireAuth, requireRole

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.upsert);
router.post('/propose', ctrl.propose); // Manager gửi đề xuất
router.post('/:id/approve', ctrl.approve); // Admin duyệt
router.post('/:id/reject', ctrl.reject); // Admin từ chối
router.post('/recalculate', ctrl.recalculate);
router.delete('/:id', ctrl.remove);

module.exports = router;
