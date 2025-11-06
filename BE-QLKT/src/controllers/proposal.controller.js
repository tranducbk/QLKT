const proposalService = require('../services/proposal.service');
const notificationHelper = require('../helpers/notificationHelper');

class ProposalController {
  /**
   * GET /api/proposals/template?type=HANG_NAM|NIEN_HAN
   * Xuất file mẫu Excel để Manager điền đề xuất
   */
  async exportTemplate(req, res) {
    try {
      const userId = req.user.id;
      const { type = 'HANG_NAM' } = req.query;

      // Validate type
      if (!['HANG_NAM', 'NIEN_HAN'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Loại đề xuất không hợp lệ. Chỉ chấp nhận HANG_NAM hoặc NIEN_HAN',
        });
      }

      const buffer = await proposalService.exportTemplate(userId, type);

      const typeName = type === 'HANG_NAM' ? 'hang_nam' : 'nien_han';
      const fileName = `mau_de_xuat_${typeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      return res.status(200).send(buffer);
    } catch (error) {
      console.error('Export template error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Xuất file mẫu thất bại',
      });
    }
  }

  /**
   * POST /api/proposals
   * Nộp file đề xuất khen thưởng (Excel + PDF)
   * Body: type=HANG_NAM|NIEN_HAN, so_quyet_dinh (optional)
   */
  async submitProposal(req, res) {
    try {
      const userId = req.user.id;
      const { so_quyet_dinh, type = 'HANG_NAM' } = req.body;

      // Validate type
      if (!['HANG_NAM', 'NIEN_HAN'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Loại đề xuất không hợp lệ. Chỉ chấp nhận HANG_NAM hoặc NIEN_HAN',
        });
      }

      // Kiểm tra file Excel bắt buộc
      if (!req.files || !req.files.file_excel) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng gửi file Excel đề xuất',
        });
      }

      const excelFile = req.files.file_excel[0];
      const pdfFile = req.files.file_pdf ? req.files.file_pdf[0] : null;

      const result = await proposalService.submitProposal(
        excelFile.buffer,
        pdfFile,
        so_quyet_dinh,
        userId,
        type
      );

      // Gửi thông báo cho tất cả ADMIN
      try {
        await notificationHelper.notifyAdminsOnProposalSubmission(result.proposal, req.user);
      } catch (notifError) {
        console.error('Failed to send notifications:', notifError);
      }

      return res.status(201).json({
        success: true,
        message: result.message,
        data: result.proposal,
      });
    } catch (error) {
      console.error('Submit proposal error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Nộp đề xuất khen thưởng thất bại',
      });
    }
  }

  /**
   * GET /api/proposals
   * Lấy danh sách đề xuất
   */
  async getProposals(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { page = 1, limit = 10 } = req.query;

      const result = await proposalService.getProposals(userId, userRole, page, limit);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách đề xuất thành công',
        data: result,
      });
    } catch (error) {
      console.error('Get proposals error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lấy danh sách đề xuất thất bại',
      });
    }
  }

  /**
   * GET /api/proposals/:id
   * Lấy chi tiết 1 đề xuất
   */
  async getProposalById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Validate id
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID đề xuất không hợp lệ',
        });
      }

      const result = await proposalService.getProposalById(parseInt(id), userId, userRole);

      return res.status(200).json({
        success: true,
        message: 'Lấy chi tiết đề xuất thành công',
        data: result,
      });
    } catch (error) {
      console.error('Get proposal by id error:', error);
      return res.status(403).json({
        success: false,
        message: error.message || 'Lấy chi tiết đề xuất thất bại',
      });
    }
  }

  /**
   * POST /api/proposals/:id/approve
   * Phê duyệt đề xuất và import vào CSDL
   */
  async approveProposal(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      // Parse JSON data từ FormData
      const editedData = {
        data_danh_hieu: JSON.parse(req.body.data_danh_hieu || '[]'),
        data_thanh_tich: JSON.parse(req.body.data_thanh_tich || '[]'),
      };

      // Lấy số quyết định
      const decisions = {
        so_quyet_dinh_cstt: req.body.so_quyet_dinh_cstt,
        so_quyet_dinh_cstdcs: req.body.so_quyet_dinh_cstdcs,
        so_quyet_dinh_bkbqp: req.body.so_quyet_dinh_bkbqp,
        so_quyet_dinh_cstdtq: req.body.so_quyet_dinh_cstdtq,
      };

      // Lấy file PDF
      const pdfFiles = {
        file_pdf_cstt: req.files?.file_pdf_cstt?.[0],
        file_pdf_cstdcs: req.files?.file_pdf_cstdcs?.[0],
        file_pdf_bkbqp: req.files?.file_pdf_bkbqp?.[0],
        file_pdf_cstdtq: req.files?.file_pdf_cstdtq?.[0],
      };

      // Lấy ghi chú (optional)
      const ghiChu = req.body.ghi_chu || null;

      // Validate id
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID đề xuất không hợp lệ',
        });
      }

      const result = await proposalService.approveProposal(
        parseInt(id),
        editedData,
        adminId,
        decisions,
        pdfFiles,
        ghiChu
      );

      // Gửi thông báo cho người gửi đề xuất
      try {
        await notificationHelper.notifyManagerOnProposalApproval(result.proposal, req.user);
      } catch (notifError) {
        console.error('Failed to send notifications:', notifError);
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.result,
      });
    } catch (error) {
      console.error('Approve proposal error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Phê duyệt đề xuất thất bại',
      });
    }
  }

  /**
   * GET /api/proposals/uploads/:filename
   * Lấy file PDF đã upload
   */
  async getPdfFile(req, res) {
    try {
      const { filename } = req.params;

      const result = await proposalService.getPdfFile(filename);

      // Trả về file
      return res.sendFile(result.filePath);
    } catch (error) {
      console.error('Get PDF file error:', error);
      return res.status(404).json({
        success: false,
        message: error.message || 'Không tìm thấy file PDF',
      });
    }
  }

  /**
   * POST /api/proposals/:id/reject
   * Từ chối đề xuất với lý do
   */
  async rejectProposal(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const { ghi_chu, ly_do } = req.body;

      // Accept both ghi_chu and ly_do for backward compatibility
      const rejectReason = ghi_chu || ly_do;

      // Validate
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID đề xuất không hợp lệ',
        });
      }

      if (!rejectReason || rejectReason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập lý do từ chối',
        });
      }

      const result = await proposalService.rejectProposal(parseInt(id), rejectReason, adminId);

      // Gửi thông báo cho người gửi đề xuất
      try {
        await notificationHelper.notifyManagerOnProposalRejection(
          result.proposal,
          req.user,
          rejectReason
        );
      } catch (notifError) {
        console.error('Failed to send notifications:', notifError);
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.result,
      });
    } catch (error) {
      console.error('Reject proposal error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Từ chối đề xuất thất bại',
      });
    }
  }

  /**
   * GET /api/proposals/:id/download-excel
   * Tải file Excel của đề xuất
   */
  async downloadProposalExcel(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID đề xuất không hợp lệ',
        });
      }

      const buffer = await proposalService.downloadProposalExcel(parseInt(id));

      const fileName = `de_xuat_${id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      return res.status(200).send(buffer);
    } catch (error) {
      console.error('Download proposal Excel error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Tải file Excel thất bại',
      });
    }
  }

  /**
   * GET /api/awards
   * Lấy danh sách tất cả khen thưởng (Admin hoặc Manager)
   */
  async getAllAwards(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { don_vi_id, nam, danh_hieu, page = 1, limit = 50 } = req.query;

      const filters = {};
      if (don_vi_id) filters.don_vi_id = don_vi_id;
      if (nam) filters.nam = nam;
      if (danh_hieu) filters.danh_hieu = danh_hieu;

      // Nếu là Manager, chỉ xem khen thưởng đơn vị mình
      if (userRole === 'MANAGER') {
        const user = await proposalService.getUserWithUnit(userId);
        if (!user || !user.QuanNhan) {
          return res.status(403).json({
            success: false,
            message: 'Không tìm thấy thông tin đơn vị',
          });
        }
        filters.don_vi_id = user.QuanNhan.don_vi_id;
      }

      const result = await proposalService.getAllAwards(filters, page, limit);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách khen thưởng thành công',
        data: result,
      });
    } catch (error) {
      console.error('Get all awards error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lấy danh sách khen thưởng thất bại',
      });
    }
  }

  /**
   * GET /api/awards/template
   * Tải file mẫu Excel để import khen thưởng
   */
  async getAwardsTemplate(req, res) {
    try {
      const buffer = await proposalService.exportAwardsTemplate();

      const fileName = `mau_import_khen_thuong_${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      return res.status(200).send(buffer);
    } catch (error) {
      console.error('Get awards template error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Tải file mẫu thất bại',
      });
    }
  }

  /**
   * POST /api/awards/import
   * Import khen thưởng từ file Excel
   */
  async importAwards(req, res) {
    try {
      // Kiểm tra file upload
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng gửi file Excel',
        });
      }

      const result = await proposalService.importAwards(req.file.buffer, req.user.id);

      // Gửi thông báo cho tất cả MANAGER của đơn vị được thêm khen thưởng
      try {
        if (result.importedUnits && result.importedUnits.length > 0) {
          for (const unitInfo of result.importedUnits) {
            await notificationHelper.notifyManagersOnAwardAdded(
              unitInfo.don_vi_id,
              unitInfo.don_vi_name,
              unitInfo.nam,
              unitInfo.award_type,
              req.user.username
            );
          }
        }
      } catch (notifError) {
        console.error('Failed to send notifications:', notifError);
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.result,
      });
    } catch (error) {
      console.error('Import awards error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Import khen thưởng thất bại',
      });
    }
  }

  /**
   * GET /api/awards/export
   * Xuất file Excel tổng hợp khen thưởng
   */
  async exportAllAwardsExcel(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { don_vi_id, nam, danh_hieu } = req.query;

      const filters = {};
      if (don_vi_id) filters.don_vi_id = don_vi_id;
      if (nam) filters.nam = nam;
      if (danh_hieu) filters.danh_hieu = danh_hieu;

      // Nếu là Manager, chỉ xuất khen thưởng đơn vị mình
      if (userRole === 'MANAGER') {
        const user = await proposalService.getUserWithUnit(userId);
        if (!user || !user.QuanNhan) {
          return res.status(403).json({
            success: false,
            message: 'Không tìm thấy thông tin đơn vị',
          });
        }
        filters.don_vi_id = user.QuanNhan.don_vi_id;
      }

      const buffer = await proposalService.exportAllAwardsExcel(filters);

      const fileName = `danh_sach_khen_thuong_${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      return res.status(200).send(buffer);
    } catch (error) {
      console.error('Export all awards Excel error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Xuất file Excel thất bại',
      });
    }
  }

  /**
   * DELETE /api/proposals/:id
   * Xóa đề xuất (Manager chỉ có thể xóa đề xuất của chính mình, status = PENDING)
   * @access  MANAGER, ADMIN
   */
  async deleteProposal(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Validate id
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID đề xuất không hợp lệ',
        });
      }

      const result = await proposalService.deleteProposal(parseInt(id), userId, userRole);

      // Ghi log hệ thống
      try {
        const { prisma } = require('../models');
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        const userAgent = req.get('User-Agent');

        await prisma.systemLog.create({
          data: {
            actor_id: userId,
            actor_role: userRole,
            action: 'DELETE',
            resource: 'proposals',
            resource_id: parseInt(id),
            description: `Xóa đề xuất khen thưởng ID ${id} - Đơn vị: ${result.proposal.don_vi}`,
            payload: {
              proposal_id: parseInt(id),
              don_vi: result.proposal.don_vi,
              status: result.proposal.status,
            },
            ip_address: ipAddress,
            user_agent: userAgent,
          },
        });
      } catch (logError) {
        console.error('[deleteProposal] Lỗi khi ghi system log:', logError);
        // Không throw error, tiếp tục trả về response
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.proposal,
      });
    } catch (error) {
      console.error('Delete proposal error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Xóa đề xuất thất bại',
      });
    }
  }
}

module.exports = new ProposalController();
