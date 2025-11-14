const express = require('express');
const router = express.Router({ mergeParams: true });
const annualRewardController = require('../controllers/annualReward.controller');
const positionHistoryController = require('../controllers/positionHistory.controller');
const scientificAchievementController = require('../controllers/scientificAchievement.controller');
const { verifyToken, requireManager, requireAuth } = require('../middlewares/auth');

/**
 * Nested routes for /api/personnel/:personnelId/*
 * These are alias routes that convert nested URLs to query param format
 */

// ===== ANNUAL REWARDS =====
/**
 * @route   GET /api/personnel/:personnelId/annual-rewards
 * @desc    Lấy danh sách danh hiệu hằng năm (alias)
 * @access  Private - ADMIN, MANAGER, USER
 */
router.get('/annual-rewards', verifyToken, requireAuth, (req, res, next) => {
  // Convert nested route to query param format
  req.query.personnel_id = req.params.personnelId;
  annualRewardController.getAnnualRewards(req, res);
});

/**
 * @route   POST /api/personnel/:personnelId/annual-rewards
 * @desc    Thêm danh hiệu hằng năm (alias)
 * @access  Private - ADMIN, MANAGER
 */
router.post('/annual-rewards', verifyToken, requireManager, (req, res, next) => {
  // Add personnel_id from URL params to body (CUID string, không phải number)
  req.body.personnel_id = req.params.personnelId;
  annualRewardController.createAnnualReward(req, res);
});

// ===== POSITION HISTORY =====
/**
 * @route   GET /api/personnel/:personnelId/position-history
 * @desc    Lấy lịch sử chức vụ (alias)
 * @access  Private - ADMIN, MANAGER, USER
 */
router.get('/position-history', verifyToken, requireAuth, (req, res, next) => {
  // Convert nested route to query param format
  req.query.personnel_id = req.params.personnelId;
  positionHistoryController.getPositionHistory(req, res);
});

/**
 * @route   POST /api/personnel/:personnelId/position-history
 * @desc    Thêm lịch sử chức vụ (alias)
 * @access  Private - ADMIN, MANAGER
 */
router.post('/position-history', verifyToken, requireManager, (req, res, next) => {
  // Add personnel_id from URL params to body (CUID string, không phải number)
  req.body.personnel_id = req.params.personnelId;
  positionHistoryController.createPositionHistory(req, res);
});

// ===== SCIENTIFIC ACHIEVEMENTS =====
/**
 * @route   GET /api/personnel/:personnelId/scientific-achievements
 * @desc    Lấy danh sách thành tích khoa học (alias)
 * @access  Private - ADMIN, MANAGER, USER
 */
router.get('/scientific-achievements', verifyToken, requireAuth, (req, res, next) => {
  // Convert nested route to query param format
  req.query.personnel_id = req.params.personnelId;
  scientificAchievementController.getAchievements(req, res);
});

/**
 * @route   POST /api/personnel/:personnelId/scientific-achievements
 * @desc    Thêm thành tích khoa học (alias)
 * @access  Private - ADMIN, MANAGER
 */
router.post('/scientific-achievements', verifyToken, requireManager, (req, res, next) => {
  // Add personnel_id from URL params to body (CUID string, không phải number)
  req.body.personnel_id = req.params.personnelId;
  scientificAchievementController.createAchievement(req, res);
});

module.exports = router;
