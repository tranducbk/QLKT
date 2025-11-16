/**
 * Helper functions để tạo mô tả log cho các resource khác nhau
 * Logic này được tách ra khỏi router để dễ maintain và test
 */

const createLogDescription = {
  /**
   * Tạo mô tả cho proposals actions
   */
  proposals: {
    CREATE: (req, res, responseData) => {
      const proposalType = req.body?.loai_de_xuat || req.body?.type || 'N/A';
      const typeNames = {
        CA_NHAN_HANG_NAM: 'Cá nhân Hằng năm',
        DON_VI_HANG_NAM: 'Đơn vị Hằng năm',
        NIEN_HAN: 'Niên hạn',
        CONG_HIEN: 'Cống hiến',
        DOT_XUAT: 'Đột xuất',
        NCKH: 'ĐTKH/SKKH',
        HC_QKQT: 'Huân chương Quân kỳ Quyết thắng',
        KNC_VSNXD_QDNDVN: 'Kỷ niệm chương Vì sự nghiệp xây dựng QĐNDVN',
      };
      const typeName = typeNames[proposalType] || proposalType;

      // Lấy thông tin từ response nếu có
      let soLuong = 0;
      let nam = '';
      let donVi = '';

      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const proposal = data?.data?.proposal || data?.proposal || data?.data || data;

        if (proposal) {
          soLuong =
            proposal.so_personnel ||
            (Array.isArray(proposal.data_danh_hieu) ? proposal.data_danh_hieu.length : 0) ||
            (Array.isArray(proposal.data_nien_han) ? proposal.data_nien_han.length : 0) ||
            (Array.isArray(proposal.data_cong_hien) ? proposal.data_cong_hien.length : 0) ||
            (Array.isArray(proposal.data_thanh_tich) ? proposal.data_thanh_tich.length : 0) ||
            0;
          nam = proposal.nam || req.body?.nam || '';
          donVi = proposal.don_vi || '';
        }
      } catch (e) {
        // Ignore parse error
      }

      // Nếu không có từ response, thử lấy từ request body
      if (soLuong === 0) {
        const titleData = req.body?.title_data;
        if (titleData) {
          try {
            const parsed = typeof titleData === 'string' ? JSON.parse(titleData) : titleData;
            soLuong = Array.isArray(parsed) ? parsed.length : 0;
          } catch (e) {
            // Ignore parse error
          }
        }
        nam = req.body?.nam || '';
      }

      // Tạo mô tả chi tiết
      let description = `Tạo đề xuất khen thưởng: ${typeName}`;

      if (soLuong > 0) {
        const unitText = proposalType === 'DON_VI_HANG_NAM' ? 'đơn vị' : 'quân nhân';
        description += ` (${soLuong} ${unitText}`;
        if (nam) {
          description += `, năm ${nam}`;
        }
        description += ')';
      } else if (nam) {
        description += ` (năm ${nam})`;
      }

      if (donVi) {
        description += ` - ${donVi}`;
      }

      return description;
    },
    APPROVE: (req, res, responseData) => {
      const proposalId = req.params?.id || 'N/A';
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const proposal = data?.data || data;
        if (proposal?.loai_de_xuat) {
          const typeNames = {
            CA_NHAN_HANG_NAM: 'Cá nhân Hằng năm',
            DON_VI_HANG_NAM: 'Đơn vị Hằng năm',
            NIEN_HAN: 'Niên hạn',
            CONG_HIEN: 'Cống hiến',
            DOT_XUAT: 'Đột xuất',
            NCKH: 'ĐTKH/SKKH',
          };
          const typeName = typeNames[proposal.loai_de_xuat] || proposal.loai_de_xuat;
          return `Phê duyệt đề xuất ${typeName}: ${proposalId}`;
        }
      } catch (e) {
        // Ignore parse error
      }
      return `Phê duyệt đề xuất: ${proposalId}`;
    },
    REJECT: (req, res, responseData) => {
      const proposalId = req.params?.id || 'N/A';
      const reason = req.body?.ly_do_tu_choi || '';
      return `Từ chối đề xuất: ${proposalId}${reason ? ` - Lý do: ${reason}` : ''}`;
    },
    DELETE: (req, res, responseData) => {
      const proposalId = req.params?.id || 'N/A';
      return `Xóa đề xuất: ${proposalId}`;
    },
  },

  /**
   * Tạo mô tả cho annual-reward actions
   */
  'annual-rewards': {
    CREATE: (req, res, responseData) => {
      const danhHieu = req.body?.danh_hieu || 'N/A';
      const nam = req.body?.nam || 'N/A';
      return `Tạo danh hiệu hằng năm: ${danhHieu} - Năm ${nam}`;
    },
    UPDATE: (req, res, responseData) => {
      const danhHieu = req.body?.danh_hieu || 'N/A';
      const nam = req.body?.nam || 'N/A';
      return `Cập nhật danh hiệu hằng năm: ${danhHieu} - Năm ${nam}`;
    },
    DELETE: (req, res, responseData) => {
      const rewardId = req.params?.id || 'N/A';
      return `Xóa danh hiệu hằng năm: ${rewardId}`;
    },
    BULK: (req, res, responseData) => {
      const danhHieu = req.body?.danh_hieu || 'N/A';
      const nam = req.body?.nam || 'N/A';
      let personnelCount = 0;
      let successCount = 0;

      // Lấy số lượng từ request body
      try {
        const personnelIds =
          typeof req.body?.personnel_ids === 'string'
            ? JSON.parse(req.body.personnel_ids)
            : req.body?.personnel_ids;
        personnelCount = Array.isArray(personnelIds) ? personnelIds.length : 0;
      } catch (e) {
        // Ignore parse error
      }

      // Lấy số lượng thành công từ response
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const result = data?.data || data;
        successCount = result?.success || result?.successCount || personnelCount;
      } catch (e) {
        // Ignore parse error
        successCount = personnelCount;
      }

      return `Thêm đồng loạt danh hiệu hằng năm: ${danhHieu} - Năm ${nam}${
        successCount > 0
          ? ` (${successCount}/${personnelCount} quân nhân thành công)`
          : personnelCount > 0
          ? ` (${personnelCount} quân nhân)`
          : ''
      }`;
    },
    IMPORT: (req, res, responseData) => {
      const fileName = req.file?.originalname || 'N/A';
      let successCount = 0;
      let failCount = 0;

      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const result = data?.data || data;
        successCount = result?.success || result?.successCount || result?.total || 0;
        failCount = result?.failed || result?.failCount || 0;

        if (successCount > 0 || failCount > 0) {
          return `Import danh hiệu hằng năm từ file: ${fileName} (${successCount} thành công${
            failCount > 0 ? `, ${failCount} thất bại` : ''
          })`;
        }
      } catch (e) {
        // Ignore parse error
      }

      return `Import danh hiệu hằng năm từ file: ${fileName}`;
    },
  },

  /**
   * Tạo mô tả cho position-history actions
   */
  'position-history': {
    CREATE: (req, res, responseData) => {
      const chucVuId = req.body?.chuc_vu_id || 'N/A';
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const history = data?.data || data;
        if (history?.ChucVu?.ten_chuc_vu) {
          return `Tạo lịch sử chức vụ: ${history.ChucVu.ten_chuc_vu}`;
        }
      } catch (e) {
        // Ignore parse error
      }
      return `Tạo lịch sử chức vụ: ${chucVuId}`;
    },
    UPDATE: (req, res, responseData) => {
      const historyId = req.params?.id || 'N/A';
      return `Cập nhật lịch sử chức vụ: ${historyId}`;
    },
    DELETE: (req, res, responseData) => {
      const historyId = req.params?.id || 'N/A';
      return `Xóa lịch sử chức vụ: ${historyId}`;
    },
  },

  /**
   * Tạo mô tả cho accounts actions
   */
  accounts: {
    CREATE: (req, res, responseData) => {
      const username = req.body?.username || 'N/A';
      const role = req.body?.role || '';
      const roleNames = {
        USER: 'Người dùng',
        MANAGER: 'Quản lý',
        ADMIN: 'Quản trị viên',
        SUPER_ADMIN: 'Quản trị viên cấp cao',
      };
      const roleName = roleNames[role] || role;
      return `Tạo tài khoản: ${username}${role ? ` (${roleName})` : ''}`;
    },
    UPDATE: (req, res, responseData) => {
      const username = req.body?.username || 'N/A';
      const role = req.body?.role || '';
      const roleNames = {
        USER: 'Người dùng',
        MANAGER: 'Quản lý',
        ADMIN: 'Quản trị viên',
        SUPER_ADMIN: 'Quản trị viên cấp cao',
      };
      const roleName = roleNames[role] || role;
      return `Cập nhật tài khoản: ${username}${role ? ` (${roleName})` : ''}`;
    },
    DELETE: (req, res, responseData) => {
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const username = data?.data?.username || `ID ${req.params?.id || 'N/A'}`;
        return `Xóa tài khoản: ${username}`;
      } catch (e) {
        return `Xóa tài khoản: ID ${req.params?.id || 'N/A'}`;
      }
    },
    RESET_PASSWORD: (req, res, responseData) => {
      const username = req.body?.username || req.body?.account_id || 'N/A';
      return `Đặt lại mật khẩu cho tài khoản: ${username}`;
    },
  },

  /**
   * Tạo mô tả cho personnel actions
   */
  personnel: {
    CREATE: (req, res, responseData) => {
      const hoTen = req.body?.ho_ten || 'N/A';
      const cccd = req.body?.cccd || '';
      return `Tạo quân nhân: ${hoTen}${cccd ? ` (CCCD: ${cccd})` : ''}`;
    },
    UPDATE: (req, res, responseData) => {
      const hoTen = req.body?.ho_ten || 'N/A';
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const personnel = data?.data || data;
        if (personnel?.ho_ten) {
          return `Cập nhật quân nhân: ${personnel.ho_ten}`;
        }
      } catch (e) {
        // Ignore parse error
      }
      return `Cập nhật quân nhân: ${hoTen}`;
    },
    DELETE: (req, res, responseData) => {
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const hoTen = data?.data?.ho_ten || `ID ${req.params?.id || 'N/A'}`;
        return `Xóa quân nhân: ${hoTen}`;
      } catch (e) {
        return `Xóa quân nhân: ID ${req.params?.id || 'N/A'}`;
      }
    },
    IMPORT: (req, res, responseData) => {
      const fileName = req.file?.originalname || 'N/A';
      let successCount = 0;
      let failCount = 0;

      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const result = data?.data || data;
        successCount = result?.success || result?.successCount || result?.total || 0;
        failCount = result?.failed || result?.failCount || 0;

        if (successCount > 0 || failCount > 0) {
          return `Import quân nhân từ file: ${fileName} (${successCount} thành công${
            failCount > 0 ? `, ${failCount} thất bại` : ''
          })`;
        }
      } catch (e) {
        // Ignore parse error
      }

      return `Import quân nhân từ file: ${fileName}`;
    },
    EXPORT: (req, res, responseData) => {
      return `Xuất dữ liệu quân nhân ra Excel`;
    },
  },

  /**
   * Tạo mô tả cho units actions
   */
  units: {
    CREATE: (req, res, responseData) => {
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const unit = data?.data || data;
        if (unit?.ten_don_vi) {
          return `Tạo đơn vị trực thuộc: ${unit.ten_don_vi}`;
        }
        if (unit?.ten_co_quan_don_vi) {
          return `Tạo cơ quan đơn vị: ${unit.ten_co_quan_don_vi}`;
        }
      } catch (e) {
        // Ignore parse error
      }
      // Kiểm tra từ request body để phân biệt
      if (req.body?.ten_don_vi) {
        return `Tạo đơn vị trực thuộc: ${req.body.ten_don_vi}`;
      }
      if (req.body?.ten_co_quan_don_vi) {
        return `Tạo cơ quan đơn vị: ${req.body.ten_co_quan_don_vi}`;
      }
      return `Tạo đơn vị: ${req.body?.ten_don_vi || req.body?.ten_co_quan_don_vi || 'N/A'}`;
    },
    UPDATE: (req, res, responseData) => {
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const unit = data?.data || data;
        if (unit?.ten_don_vi) {
          return `Cập nhật đơn vị trực thuộc: ${unit.ten_don_vi}`;
        }
        if (unit?.ten_co_quan_don_vi) {
          return `Cập nhật cơ quan đơn vị: ${unit.ten_co_quan_don_vi}`;
        }
      } catch (e) {
        // Ignore parse error
      }
      // Kiểm tra từ request body để phân biệt
      if (req.body?.ten_don_vi) {
        return `Cập nhật đơn vị trực thuộc: ${req.body.ten_don_vi}`;
      }
      if (req.body?.ten_co_quan_don_vi) {
        return `Cập nhật cơ quan đơn vị: ${req.body.ten_co_quan_don_vi}`;
      }
      return `Cập nhật đơn vị: ${req.body?.ten_don_vi || req.body?.ten_co_quan_don_vi || 'N/A'}`;
    },
    DELETE: (req, res, responseData) => {
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const unit = data?.data || data;
        if (unit?.ten_don_vi) {
          return `Xóa đơn vị trực thuộc: ${unit.ten_don_vi}`;
        }
        if (unit?.ten_co_quan_don_vi) {
          return `Xóa cơ quan đơn vị: ${unit.ten_co_quan_don_vi}`;
        }
      } catch (e) {
        // Ignore parse error
      }
      return `Xóa đơn vị: ID ${req.params?.id || 'N/A'}`;
    },
  },

  /**
   * Tạo mô tả cho positions actions
   */
  positions: {
    CREATE: (req, res, responseData) => {
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const position = data?.data || data;
        if (position?.ten_chuc_vu) {
          return `Tạo chức vụ: ${position.ten_chuc_vu}`;
        }
      } catch (e) {
        // Ignore parse error
      }
      const tenChucVu = req.body?.ten_chuc_vu || 'N/A';
      return `Tạo chức vụ: ${tenChucVu}`;
    },
    UPDATE: (req, res, responseData) => {
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const position = data?.data || data;
        if (position?.ten_chuc_vu) {
          let description = `Cập nhật chức vụ: ${position.ten_chuc_vu}`;

          // Thêm thông tin về cơ quan đơn vị hoặc đơn vị trực thuộc
          if (position?.CoQuanDonVi) {
            description += ` - ${position.CoQuanDonVi.ten_don_vi}`;
          } else if (position?.DonViTrucThuoc) {
            description += ` - ${position.DonViTrucThuoc.ten_don_vi}`;
            if (position.DonViTrucThuoc?.CoQuanDonVi) {
              description += ` (${position.DonViTrucThuoc.CoQuanDonVi.ten_don_vi})`;
            }
          }

          return description;
        }
      } catch (e) {
        // Ignore parse error
      }
      const tenChucVu = req.body?.ten_chuc_vu || 'N/A';
      return `Cập nhật chức vụ: ${tenChucVu}`;
    },
    DELETE: (req, res, responseData) => {
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const position = data?.data || data;
        if (position?.ten_chuc_vu) {
          return `Xóa chức vụ: ${position.ten_chuc_vu}`;
        }
      } catch (e) {
        // Ignore parse error
      }
      return `Xóa chức vụ: ID ${req.params?.id || 'N/A'}`;
    },
  },

  /**
   * Tạo mô tả cho decisions actions
   */
  decisions: {
    CREATE: (req, res, responseData) => {
      const soQuyetDinh = req.body?.so_quyet_dinh || 'N/A';
      const loaiQuyetDinh = req.body?.loai_quyet_dinh || '';
      const loaiNames = {
        DANH_HIEU_HANG_NAM: 'Danh hiệu hằng năm',
        DANH_HIEU_NIEN_HAN: 'Danh hiệu niên hạn',
        CONG_HIEN: 'Khen thưởng cống hiến',
        BKBQP: 'Bằng khen Bộ Quốc phòng',
        CSTDTQ: 'Chiến sĩ thi đua toàn quốc',
      };
      const loaiName = loaiNames[loaiQuyetDinh] || loaiQuyetDinh || '';
      return `Tạo quyết định: ${soQuyetDinh}${loaiName ? ` (${loaiName})` : ''}`;
    },
    UPDATE: (req, res, responseData) => {
      const soQuyetDinh = req.body?.so_quyet_dinh || 'N/A';
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const decision = data?.data || data;
        if (decision?.so_quyet_dinh) {
          return `Cập nhật quyết định: ${decision.so_quyet_dinh}`;
        }
      } catch (e) {
        // Ignore parse error
      }
      return `Cập nhật quyết định: ${soQuyetDinh}`;
    },
    DELETE: (req, res, responseData) => {
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const decision = data?.data || data;
        if (decision?.so_quyet_dinh) {
          return `Xóa quyết định: ${decision.so_quyet_dinh}`;
        }
      } catch (e) {
        // Ignore parse error
      }
      return `Xóa quyết định: ID ${req.params?.id || 'N/A'}`;
    },
  },

  /**
   * Tạo mô tả cho scientific-achievements actions
   */
  'scientific-achievements': {
    CREATE: (req, res, responseData) => {
      const loai = req.body?.loai || 'N/A';
      const moTa = req.body?.mo_ta || '';
      const nam = req.body?.nam || '';
      const loaiNames = {
        NCKH: 'Nghiên cứu khoa học',
        SKKH: 'Sáng kiến kinh nghiệm',
      };
      const loaiName = loaiNames[loai] || loai;
      return `Tạo thành tích khoa học: ${loaiName}${moTa ? ` - ${moTa}` : ''}${
        nam ? ` (Năm ${nam})` : ''
      }`;
    },
    UPDATE: (req, res, responseData) => {
      const loai = req.body?.loai || 'N/A';
      const moTa = req.body?.mo_ta || '';
      const nam = req.body?.nam || '';
      const loaiNames = {
        NCKH: 'Nghiên cứu khoa học',
        SKKH: 'Sáng kiến kinh nghiệm',
      };
      const loaiName = loaiNames[loai] || loai;
      return `Cập nhật thành tích khoa học: ${loaiName}${moTa ? ` - ${moTa}` : ''}${
        nam ? ` (Năm ${nam})` : ''
      }`;
    },
    DELETE: (req, res, responseData) => {
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        const achievement = data?.data || data;
        if (achievement?.loai && achievement?.mo_ta) {
          const loaiNames = {
            NCKH: 'Nghiên cứu khoa học',
            SKKH: 'Sáng kiến kinh nghiệm',
          };
          const loaiName = loaiNames[achievement.loai] || achievement.loai;
          return `Xóa thành tích khoa học: ${loaiName} - ${achievement.mo_ta}`;
        }
      } catch (e) {
        // Ignore parse error
      }
      return `Xóa thành tích khoa học: ID ${req.params?.id || 'N/A'}`;
    },
  },

  /**
   * Tạo mô tả cho auth actions
   */
  auth: {
    LOGIN: (req, res, responseData) => {
      const username = req.body?.username || 'N/A';
      return `Đăng nhập hệ thống: ${username}`;
    },
    LOGOUT: (req, res, responseData) => {
      return `Đăng xuất khỏi hệ thống`;
    },
    CHANGE_PASSWORD: (req, res, responseData) => {
      return `Đổi mật khẩu tài khoản`;
    },
  },
};

/**
 * Get log description helper
 * @param {string} resource - Resource name (proposals, annual-rewards, etc.)
 * @param {string} action - Action name (CREATE, UPDATE, DELETE, etc.)
 * @returns {Function} Function to create description
 */
const getLogDescription = (resource, action) => {
  const resourceHelper = createLogDescription[resource];
  if (!resourceHelper) {
    return (req, res, responseData) => `${action} ${resource}`;
  }

  const actionHelper = resourceHelper[action];
  if (!actionHelper) {
    return (req, res, responseData) => `${action} ${resource}`;
  }

  return actionHelper;
};

/**
 * Get resource ID from request
 */
const getResourceId = {
  fromParams:
    (paramName = 'id') =>
    req => {
      return req.params?.[paramName] || null;
    },
  fromResponse: () => (req, res, responseData) => {
    try {
      const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
      return data?.data?.id || data?.id || null;
    } catch {
      return null;
    }
  },
  fromBody:
    (fieldName = 'id') =>
    req => {
      return req.body?.[fieldName] || null;
    },
};

module.exports = {
  getLogDescription,
  getResourceId,
  createLogDescription,
};
