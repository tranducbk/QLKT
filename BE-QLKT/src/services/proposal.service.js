const { prisma } = require('../models');
const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');
const profileService = require('./profile.service');

// Dynamic import for uuid (ES Module) - load once and cache
let uuidv4;
(async () => {
  const uuidModule = await import('uuid');
  uuidv4 = uuidModule.v4;
})();

// Constants
const SHEET_NAMES = {
  QUAN_NHAN: 'QuanNhan',
  DANH_HIEU_HANG_NAM: 'DanhHieuHangNam',
  THANH_TICH_KHOA_HOC: 'ThanhTichKhoaHoc',
  NIEN_HAN: 'NienHan',
};

const CELL_INDICES = {
  CCCD: 1,
  HO_TEN: 2,
  NAM: 3,
  CSTDCS: 4,
  CSTT: 5,
  BKBQP: 6,
  SO_QUYET_DINH_BKBQP: 7,
  CSTDTQ: 8,
  SO_QUYET_DINH_CSTDTQ: 9,
  LOAI: 4,
  MO_TA: 5,
  STATUS: 6,
};

const VALID_LOAI_THANH_TICH = ['NCKH', 'SKKH'];
const VALID_STATUS = ['APPROVED', 'PENDING'];
const SAMPLE_ROW_KEYWORDS = ['ví dụ', 'example'];

class ProposalService {
  /**
   * Parse CCCD từ Excel cell - hỗ trợ CCCD bắt đầu bằng số 0
   * Excel tự động loại bỏ số 0 đầu tiên khi lưu dưới dạng số
   * @param {*} value - Giá trị từ Excel cell
   * @returns {string} - CCCD đã được format đúng
   */
  parseCCCD(value) {
    if (!value) return '';

    // Chuyển về string và trim
    let cccd = value.toString().trim();

    // Nếu CCCD có độ dài < 12 (bị mất số 0 đầu), padding thêm số 0
    // CCCD Việt Nam chuẩn là 12 số
    if (/^\d+$/.test(cccd) && cccd.length < 12) {
      cccd = cccd.padStart(12, '0');
    }

    return cccd;
  }

  /**
   * Parse cell value to string safely
   * @param {*} cell - Excel cell
   * @returns {string|null} - Trimmed string or null
   */
  parseCellToString(cell) {
    return cell?.value ? String(cell.value).trim() : null;
  }

  /**
   * Parse cell value to integer safely
   * @param {*} cell - Excel cell
   * @returns {number|null} - Parsed integer or null
   */
  parseCellToInt(cell) {
    const value = cell?.value ?? null;
    if (value === null || value === undefined) return null;
    const parsed = parseInt(value);
    return !isNaN(parsed) ? parsed : null;
  }

  /**
   * Check if cell value is checked (X)
   * @param {*} cell - Excel cell
   * @returns {boolean} - True if checked
   */
  isCellChecked(cell) {
    return cell?.value ? String(cell.value).toUpperCase().trim() === 'X' : false;
  }

  /**
   * Check if row is a sample row (contains example keywords)
   * @param {string} text - Text to check
   * @returns {boolean} - True if sample row
   */
  isSampleRow(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return SAMPLE_ROW_KEYWORDS.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Log sheet information for debugging
   * @param {Worksheet} sheet - Excel worksheet
   * @param {string} sheetName - Name of the sheet
   */
  logSheetInfo(sheet, sheetName) {
    // Removed console.log for production
  }

  /**
   * Parse danh hiệu hàng năm từ Excel row
   * @param {Row} row - Excel row
   * @param {number} rowNumber - Row number
   * @returns {Object|null} - Parsed data or null if invalid
   */
  parseDanhHieuRow(row, rowNumber) {
    const cccdCell = row.getCell(CELL_INDICES.CCCD);
    const hoTenCell = row.getCell(CELL_INDICES.HO_TEN);
    const namCell = row.getCell(CELL_INDICES.NAM);

    const cccdValue = cccdCell?.value ?? null;
    const cccd = cccdValue !== null && cccdValue !== undefined ? this.parseCCCD(cccdValue) : null;
    const ho_ten = this.parseCellToString(hoTenCell);
    const nam = this.parseCellToInt(namCell);

    // Validate required fields
    if (!cccd || !nam || isNaN(nam)) {
      return null;
    }

    // Skip sample rows
    if (this.isSampleRow(ho_ten)) {
      return null;
    }

    // Parse checkboxes and decision numbers
    const cstdcs_checked = this.isCellChecked(row.getCell(CELL_INDICES.CSTDCS));
    const cstt_checked = this.isCellChecked(row.getCell(CELL_INDICES.CSTT));
    const bkbqp_checked = this.isCellChecked(row.getCell(CELL_INDICES.BKBQP));
    const so_quyet_dinh_bkbqp = this.parseCellToString(
      row.getCell(CELL_INDICES.SO_QUYET_DINH_BKBQP)
    );
    const cstdtq_checked = this.isCellChecked(row.getCell(CELL_INDICES.CSTDTQ));
    const so_quyet_dinh_cstdtq = this.parseCellToString(
      row.getCell(CELL_INDICES.SO_QUYET_DINH_CSTDTQ)
    );

    // Determine main danh hieu
    let danh_hieu = null;
    if (cstdcs_checked) danh_hieu = 'CSTDCS';
    else if (cstt_checked) danh_hieu = 'CSTT';

    return {
      cccd,
      ho_ten: ho_ten || '',
      nam,
      danh_hieu,
      nhan_bkbqp: bkbqp_checked,
      so_quyet_dinh_bkbqp,
      nhan_cstdtq: cstdtq_checked,
      so_quyet_dinh_cstdtq,
    };
  }

  /**
   * Parse thành tích khoa học từ Excel row
   * @param {Row} row - Excel row
   * @param {number} rowNumber - Row number
   * @returns {Object|null} - Parsed data or null if invalid
   */
  parseThanhTichRow(row, rowNumber) {
    const cccdCell = row.getCell(CELL_INDICES.CCCD);
    const hoTenCell = row.getCell(CELL_INDICES.HO_TEN);
    const namCell = row.getCell(CELL_INDICES.NAM);
    const loaiCell = row.getCell(CELL_INDICES.LOAI);
    const moTaCell = row.getCell(CELL_INDICES.MO_TA);
    const statusCell = row.getCell(CELL_INDICES.STATUS);

    const cccdValue = cccdCell?.value ?? null;
    const cccd = cccdValue !== null && cccdValue !== undefined ? this.parseCCCD(cccdValue) : null;
    const ho_ten = this.parseCellToString(hoTenCell);
    const nam = this.parseCellToInt(namCell);
    const loai = this.parseCellToString(loaiCell);
    const mo_ta = this.parseCellToString(moTaCell);
    const status = this.parseCellToString(statusCell) || 'PENDING';

    // Validate required fields
    if (!cccd || !nam || isNaN(nam) || !loai || !mo_ta) {
      return null;
    }

    // Skip sample rows
    if (this.isSampleRow(mo_ta)) {
      return null;
    }

    // Validate loại
    if (!VALID_LOAI_THANH_TICH.includes(loai)) {
      throw new Error(
        `Loại thành tích không hợp lệ: ${loai} (chỉ chấp nhận ${VALID_LOAI_THANH_TICH.join(
          ' hoặc '
        )})`
      );
    }

    // Validate status
    if (!VALID_STATUS.includes(status)) {
      throw new Error(
        `Trạng thái không hợp lệ: ${status} (chỉ chấp nhận ${VALID_STATUS.join(' hoặc ')})`
      );
    }

    return {
      cccd,
      ho_ten: ho_ten || '',
      nam,
      loai,
      mo_ta,
      status,
    };
  }

  /**
   * Parse danh hiệu hàng năm từ Excel sheet
   * @param {Worksheet} sheet - Excel worksheet
   * @returns {Array} - Array of parsed danh hiệu data
   */
  parseDanhHieuSheet(sheet) {
    this.logSheetInfo(sheet, SHEET_NAMES.DANH_HIEU_HANG_NAM);

    const danhHieuData = [];
    let rowCount = 0;
    let skippedCount = 0;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return; // Skip header

      rowCount++;
      const parsed = this.parseDanhHieuRow(row, rowNumber);

      if (parsed) {
        danhHieuData.push(parsed);
      } else {
        skippedCount++;
      }
    });

    return danhHieuData;
  }

  /**
   * Parse thành tích khoa học từ Excel sheet
   * @param {Worksheet} sheet - Excel worksheet
   * @returns {Array} - Array of parsed thành tích data
   */
  parseThanhTichSheet(sheet) {
    this.logSheetInfo(sheet, SHEET_NAMES.THANH_TICH_KHOA_HOC);

    const thanhTichData = [];
    let rowCount = 0;
    let skippedCount = 0;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return; // Skip header

      rowCount++;
      const parsed = this.parseThanhTichRow(row, rowNumber);

      if (parsed) {
        thanhTichData.push(parsed);
      } else {
        skippedCount++;
      }
    });

    return thanhTichData;
  }

  /**
   * Tính số năm CSTDCS liên tục TRƯỚC năm đang xét
   * Lưu ý: Khi xét khen thưởng năm N, chỉ tính các năm CSTDCS từ (N-1) trở về trước
   * Ví dụ: Xét BKBQP năm 2024 cần 5 năm CSTDCS liên tục từ 2019-2023
   *
   * @param {Array} danhHieuList - Danh sách danh hiệu đã có
   * @param {number} currentYear - Năm đang xét khen thưởng
   * @returns {number} Số năm CSTDCS liên tục TRƯỚC năm đang xét
   */
  calculateContinuousCSTDCS(danhHieuList, currentYear) {
    if (!danhHieuList || danhHieuList.length === 0) {
      return 0;
    }

    // Sắp xếp theo năm giảm dần
    const sortedRewards = [...danhHieuList].sort((a, b) => b.nam - a.nam);

    let count = 0;
    // BẮT ĐẦU từ năm TRƯỚC năm đang xét, không bao gồm năm đang xét
    let expectedYear = (currentYear || new Date().getFullYear()) - 1;

    // Đếm ngược từ năm trước năm hiện tại
    for (const reward of sortedRewards) {
      // Nếu năm này là CSTDCS và đúng năm mong đợi
      if (reward.danh_hieu === 'CSTDCS' && reward.nam === expectedYear) {
        count++;
        expectedYear--; // Tiếp tục kiểm tra năm trước đó
      } else if (reward.nam < expectedYear) {
        // Nếu bỏ qua năm nào đó thì dừng (chuỗi bị gián đoạn)
        break;
      }
    }

    return count;
  }
  /**
   * Lấy thông tin user với đơn vị (helper method)
   * @param {number} userId - ID của tài khoản
   * @returns {Promise<Object>} - User object với QuanNhan
   */
  async getUserWithUnit(userId) {
    return await prisma.taiKhoan.findUnique({
      where: { id: userId },
      include: {
        QuanNhan: {
          include: {
            CoQuanDonVi: true,
            DonViTrucThuoc: {
              include: {
                CoQuanDonVi: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Xuất file mẫu Excel cho Manager
   * @param {number} userId - ID của tài khoản Manager
   * @param {string} type - Loại đề xuất: 'HANG_NAM' hoặc 'NIEN_HAN'
   * @returns {Promise<Buffer>} - Buffer của file Excel
   */
  async exportTemplate(userId, type = 'HANG_NAM') {
    try {
      // Lấy thông tin user và đơn vị
      const user = await prisma.taiKhoan.findUnique({
        where: { id: userId },
        include: {
          QuanNhan: {
            include: {
              CoQuanDonVi: true,
              DonViTrucThuoc: {
                include: {
                  CoQuanDonVi: true,
                },
              },
            },
          },
        },
      });

      if (!user || !user.QuanNhan) {
        throw new Error('Không tìm thấy thông tin quân nhân của tài khoản này');
      }

      const donViId = user.QuanNhan.co_quan_don_vi_id || user.QuanNhan.don_vi_truc_thuoc_id;

      // Lấy danh sách quân nhân thuộc đơn vị
      const quanNhanList = await prisma.quanNhan.findMany({
        where: {
          OR: [{ co_quan_don_vi_id: donViId }, { don_vi_truc_thuoc_id: donViId }],
        },
        include: {
          CoQuanDonVi: true,
          DonViTrucThuoc: {
            include: {
              CoQuanDonVi: true,
            },
          },
          ChucVu: true,
        },
        orderBy: { ho_ten: 'asc' },
      });

      // Tạo workbook mới
      const workbook = new ExcelJS.Workbook();

      if (type === 'NIEN_HAN') {
        return await this.exportTemplateNienHan(workbook, quanNhanList);
      }

      // ============================================
      // TEMPLATE CHO ĐỀ XUẤT HẰNG NĂM
      // ============================================

      // ============================================
      // TAB 1: QuanNhan (Danh sách tham khảo)
      // ============================================
      const sheetQuanNhan = workbook.addWorksheet('QuanNhan');

      // Header row với style
      sheetQuanNhan.columns = [
        { header: 'CCCD', key: 'cccd', width: 15 },
        { header: 'Họ và Tên', key: 'ho_ten', width: 30 },
        { header: 'Mã Đơn Vị', key: 'ma_don_vi', width: 15 },
        { header: 'Tên Chức Vụ', key: 'ten_chuc_vu', width: 25 },
      ];

      // Style cho header
      sheetQuanNhan.getRow(1).font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      sheetQuanNhan.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      sheetQuanNhan.getRow(1).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };

      // Format cột CCCD thành Text (để giữ số 0 đầu tiên)
      sheetQuanNhan.getColumn(1).numFmt = '@';

      // Thêm dữ liệu quân nhân
      quanNhanList.forEach(qn => {
        sheetQuanNhan.addRow({
          cccd: qn.cccd,
          ho_ten: qn.ho_ten,
          ma_don_vi: (qn.DonViTrucThuoc || qn.CoQuanDonVi)?.ma_don_vi || '',
          ten_chuc_vu: qn.ChucVu.ten_chuc_vu,
        });
      });

      // ============================================
      // TAB 2: DanhHieuHangNam (Đề xuất danh hiệu)
      // ============================================
      const sheetDanhHieu = workbook.addWorksheet('DanhHieuHangNam');

      sheetDanhHieu.columns = [
        { header: 'CCCD (Bắt buộc)', key: 'cccd', width: 15 },
        { header: 'Họ và Tên', key: 'ho_ten', width: 30 },
        { header: 'Năm (Bắt buộc)', key: 'nam', width: 12 },
        { header: 'CSTDCS (Đánh X)', key: 'cstdcs', width: 18 },
        { header: 'CSTT (Đánh X)', key: 'cstt', width: 15 },
        { header: 'BKBQP (Đánh X)', key: 'bkbqp', width: 18 },
        { header: 'Số QĐ BKBQP', key: 'so_quyet_dinh_bkbqp', width: 20 },
        { header: 'CSTĐTQ (Đánh X)', key: 'cstdtq', width: 18 },
        { header: 'Số QĐ CSTĐTQ', key: 'so_quyet_dinh_cstdtq', width: 20 },
      ];

      // Style cho header
      sheetDanhHieu.getRow(1).font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      sheetDanhHieu.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' },
      };
      sheetDanhHieu.getRow(1).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };

      // Format cột CCCD thành Text (để giữ số 0 đầu tiên)
      sheetDanhHieu.getColumn(1).numFmt = '@';

      // Thêm 1 hàng mẫu
      sheetDanhHieu.addRow({
        cccd: 'Ví dụ: 001234567890',
        ho_ten: 'Nguyễn Văn A',
        nam: 2024,
        cstdcs: 'X',
        cstt: '',
        bkbqp: 'X',
        so_quyet_dinh_bkbqp: '123/QĐ-BQP',
        cstdtq: '',
        so_quyet_dinh_cstdtq: '',
      });

      // ============================================
      // TAB 3: ThanhTichKhoaHoc (Đề xuất thành tích)
      // ============================================
      const sheetThanhTich = workbook.addWorksheet('ThanhTichKhoaHoc');

      sheetThanhTich.columns = [
        { header: 'CCCD (Bắt buộc)', key: 'cccd', width: 15 },
        { header: 'Họ và Tên', key: 'ho_ten', width: 30 },
        { header: 'Năm (Bắt buộc)', key: 'nam', width: 12 },
        { header: 'Loại (ĐTKH/SKKH)', key: 'loai', width: 18 },
        { header: 'Mô tả (Bắt buộc)', key: 'mo_ta', width: 40 },
        { header: 'Trạng thái (APPROVED/PENDING)', key: 'status', width: 25 },
      ];

      // Style cho header
      sheetThanhTich.getRow(1).font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      sheetThanhTich.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC000' },
      };
      sheetThanhTich.getRow(1).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };

      // Format cột CCCD thành Text (để giữ số 0 đầu tiên)
      sheetThanhTich.getColumn(1).numFmt = '@';

      // Thêm 1 hàng mẫu
      sheetThanhTich.addRow({
        cccd: 'Ví dụ: 001234567890',
        ho_ten: 'Nguyễn Văn A',
        nam: 2024,
        loai: 'NCKH',
        mo_ta: 'Nghiên cứu về trí tuệ nhân tạo trong quân sự',
        status: 'APPROVED',
      });

      // Thêm data validation cho cột Loại (D) - từ row 2 trở đi
      sheetThanhTich.getColumn(4).eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber > 1) {
          // Skip header
          cell.dataValidation = {
            type: 'list',
            allowBlank: false,
            formulae: ['"NCKH,SKKH"'],
            showErrorMessage: true,
            errorStyle: 'error',
            errorTitle: 'Giá trị không hợp lệ',
            error: 'Vui lòng chọn NCKH hoặc SKKH',
          };
        }
      });

      // Thêm data validation cho cột Trạng thái (F) - từ row 2 trở đi
      sheetThanhTich.getColumn(6).eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber > 1) {
          // Skip header
          cell.dataValidation = {
            type: 'list',
            allowBlank: false,
            formulae: ['"APPROVED,PENDING"'],
            showErrorMessage: true,
            errorStyle: 'error',
            errorTitle: 'Giá trị không hợp lệ',
            error: 'Vui lòng chọn APPROVED hoặc PENDING',
          };
        }
      });

      // Xuất file ra buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      console.error('Export template error:', error);
      throw error;
    }
  }

  /**
   * Xuất file mẫu Excel cho Đề xuất Niên hạn
   * @param {ExcelJS.Workbook} workbook - Workbook
   * @param {Array} quanNhanList - Danh sách quân nhân
   * @returns {Promise<Buffer>} - Buffer của file Excel
   */
  async exportTemplateNienHan(workbook, quanNhanList) {
    // ============================================
    // TAB 1: QuanNhan (Danh sách tham khảo)
    // ============================================
    const sheetQuanNhan = workbook.addWorksheet('QuanNhan');

    sheetQuanNhan.columns = [
      { header: 'CCCD', key: 'cccd', width: 15 },
      { header: 'Họ và Tên', key: 'ho_ten', width: 30 },
      { header: 'Ngày nhập ngũ', key: 'ngay_nhap_ngu', width: 15 },
      { header: 'Mã Đơn Vị', key: 'ma_don_vi', width: 15 },
      { header: 'Tên Chức Vụ', key: 'ten_chuc_vu', width: 25 },
    ];

    sheetQuanNhan.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheetQuanNhan.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    sheetQuanNhan.getRow(1).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    sheetQuanNhan.getColumn(1).numFmt = '@';

    quanNhanList.forEach(qn => {
      sheetQuanNhan.addRow({
        cccd: qn.cccd,
        ho_ten: qn.ho_ten,
        ngay_nhap_ngu: qn.ngay_nhap_ngu
          ? new Date(qn.ngay_nhap_ngu).toLocaleDateString('vi-VN')
          : '',
        ma_don_vi: qn.DonVi.ma_don_vi,
        ten_chuc_vu: qn.ChucVu.ten_chuc_vu,
      });
    });

    // ============================================
    // TAB 2: NienHan (Đề xuất khen thưởng niên hạn)
    // ============================================
    const sheetNienHan = workbook.addWorksheet('NienHan');

    sheetNienHan.columns = [
      { header: 'CCCD (Bắt buộc)', key: 'cccd', width: 15 },
      { header: 'Họ và Tên', key: 'ho_ten', width: 30 },
      { header: 'HCCSVV Hạng Ba (X)', key: 'hccsvv_hang_ba', width: 20 },
      { header: 'HCCSVV Hạng Nhì (X)', key: 'hccsvv_hang_nhi', width: 20 },
      { header: 'HCCSVV Hạng Nhất (X)', key: 'hccsvv_hang_nhat', width: 20 },
      { header: 'HCBVTQ Hạng Ba (X)', key: 'hcbvtq_hang_ba', width: 20 },
      { header: 'HCBVTQ Hạng Nhì (X)', key: 'hcbvtq_hang_nhi', width: 20 },
      { header: 'HCBVTQ Hạng Nhất (X)', key: 'hcbvtq_hang_nhat', width: 20 },
    ];

    sheetNienHan.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheetNienHan.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFED7D31' },
    };
    sheetNienHan.getRow(1).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    sheetNienHan.getColumn(1).numFmt = '@';

    // Thêm 1 hàng mẫu
    sheetNienHan.addRow({
      cccd: 'Ví dụ: 001234567890',
      ho_ten: 'Nguyễn Văn A',
      hccsvv_hang_ba: 'X',
      hccsvv_hang_nhi: '',
      hccsvv_hang_nhat: '',
      hcbvtq_hang_ba: '',
      hcbvtq_hang_nhi: '',
      hcbvtq_hang_nhat: '',
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Lưu đề xuất khen thưởng với nhiều file đính kèm
   * @param {Array} titleData - Dữ liệu danh hiệu/thành tích từ frontend
   * @param {Array} attachedFiles - Array các file đính kèm (multer file objects)
   * @param {string} soQuyetDinh - Số quyết định gốc
   * @param {string} userId - ID của tài khoản Manager
   * @param {string} type - Loại đề xuất
   * @param {number} nam - Năm đề xuất
   * @returns {Promise<Object>} - Kết quả lưu đề xuất
   */
  async submitProposal(
    titleData,
    attachedFiles,
    soQuyetDinh,
    userId,
    type = 'CA_NHAN_HANG_NAM',
    nam
  ) {
    try {
      // Lấy thông tin user và đơn vị
      const user = await prisma.taiKhoan.findUnique({
        where: { id: userId },
        include: {
          QuanNhan: {
            include: {
              CoQuanDonVi: true,
              DonViTrucThuoc: {
                include: {
                  CoQuanDonVi: true,
                },
              },
            },
          },
        },
      });

      if (!user || !user.QuanNhan) {
        throw new Error('Không tìm thấy thông tin quân nhân của tài khoản này');
      }

      const donViId = user.QuanNhan.co_quan_don_vi_id || user.QuanNhan.don_vi_truc_thuoc_id;

      // ============================================
      // LƯU NHIỀU FILE ĐÍNH KÈM VÀO SERVER
      // ============================================
      const filesInfo = [];

      if (attachedFiles && attachedFiles.length > 0) {
        // Đảm bảo uuid đã được load (nếu chưa thì load ngay)
        if (!uuidv4) {
          const uuidModule = await import('uuid');
          uuidv4 = uuidModule.v4;
        }

        // Đường dẫn lưu file
        const storagePath = path.join(__dirname, '../../storage/proposals');
        await fs.mkdir(storagePath, { recursive: true });

        // Loop qua từng file và lưu
        for (const file of attachedFiles) {
          if (file && file.buffer) {
            // Tạo tên file unique: timestamp_uuid_originalname
            const timestamp = Date.now();
            const uniqueId = uuidv4().slice(0, 8);
            const fileExtension = path.extname(file.originalname);
            const baseFilename = path.basename(file.originalname, fileExtension);
            const savedFilename = `${timestamp}_${uniqueId}_${baseFilename}${fileExtension}`;

            // Lưu file
            const filePath = path.join(storagePath, savedFilename);
            await fs.writeFile(filePath, file.buffer);

            // Thêm thông tin file vào array
            filesInfo.push({
              filename: savedFilename,
              originalName: file.originalname,
              size: file.size,
              uploadedAt: new Date().toISOString(),
            });
          }
        }
      }

      // ============================================
      // XỬ LÝ DỮ LIỆU TỪ FRONTEND
      // ============================================
      if (!titleData || !Array.isArray(titleData)) {
        throw new Error('Dữ liệu đề xuất không hợp lệ');
      }

      // Validate năm đề xuất cho DON_VI_HANG_NAM (chỉ cho phép năm sau)
      if (type === 'DON_VI_HANG_NAM') {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        if (!nam || parseInt(nam) !== nextYear) {
          throw new Error(
            `Đề xuất khen thưởng đơn vị hằng năm chỉ được phép đề xuất cho năm ${nextYear} (năm sau)`
          );
        }
      }

      // Fetch thông tin quân nhân để lấy họ tên, đơn vị (chỉ cho đề xuất cá nhân)
      // Với DON_VI_HANG_NAM, titleData sẽ có don_vi_id thay vì personnel_id
      let personnelList = [];
      if (type !== 'DON_VI_HANG_NAM') {
        const personnelIds = titleData
          .map(item => item.personnel_id)
          .filter(id => id !== undefined && id !== null); // Filter out undefined/null

        if (personnelIds.length > 0) {
          personnelList = await prisma.quanNhan.findMany({
            where: {
              id: {
                in: personnelIds,
              },
            },
            select: {
              id: true,
              ho_ten: true,
              co_quan_don_vi_id: true,
              don_vi_truc_thuoc_id: true,
              CoQuanDonVi: {
                select: {
                  id: true,
                  ten_don_vi: true,
                  ma_don_vi: true,
                },
              },
              DonViTrucThuoc: {
                select: {
                  id: true,
                  ten_don_vi: true,
                  ma_don_vi: true,
                  co_quan_don_vi_id: true,
                  CoQuanDonVi: {
                    select: {
                      id: true,
                      ten_don_vi: true,
                      ma_don_vi: true,
                    },
                  },
                },
              },
            },
          });
        }
      }

      // Tạo map để lookup nhanh và đảm bảo load đầy đủ thông tin đơn vị
      const personnelMap = {};
      const missingDonViIds = new Set();

      personnelList.forEach(p => {
        // Nếu có don_vi_truc_thuoc_id nhưng DonViTrucThuoc chưa được load, cần fetch lại
        if (p.don_vi_truc_thuoc_id && !p.DonViTrucThuoc) {
          missingDonViIds.add(p.don_vi_truc_thuoc_id);
        }
        personnelMap[p.id] = p;
      });

      // Fetch lại các đơn vị trực thuộc bị thiếu
      if (missingDonViIds.size > 0) {
        const missingDonVis = await prisma.donViTrucThuoc.findMany({
          where: {
            id: {
              in: Array.from(missingDonViIds),
            },
          },
          include: {
            CoQuanDonVi: {
              select: {
                id: true,
                ten_don_vi: true,
                ma_don_vi: true,
              },
            },
          },
        });

        const donViMap = {};
        missingDonVis.forEach(dv => {
          donViMap[dv.id] = dv;
        });

        // Cập nhật lại personnelMap với thông tin đơn vị đã fetch
        Object.keys(personnelMap).forEach(personnelId => {
          const personnel = personnelMap[personnelId];
          if (personnel.don_vi_truc_thuoc_id && !personnel.DonViTrucThuoc) {
            personnel.DonViTrucThuoc = donViMap[personnel.don_vi_truc_thuoc_id] || null;
          }
        });
      }

      // Format titleData theo type và enrich với thông tin quân nhân/đơn vị
      let dataDanhHieu = null;
      let dataThanhTich = null;
      let dataNienHan = null;

      if (type === 'NCKH') {
        // NCKH: titleData = [{ personnel_id, loai: 'NCKH'|'SKKH', mo_ta }]
        // Không lưu cccd, thêm thông tin đơn vị
        dataThanhTich = titleData.map(item => {
          const personnel = personnelMap[item.personnel_id];
          return {
            personnel_id: item.personnel_id,
            ho_ten: personnel?.ho_ten || '',
            nam: nam,
            loai: item.loai,
            mo_ta: item.mo_ta,
            status: item.status || 'PENDING',
            so_quyet_dinh: item.so_quyet_dinh || null,
            file_quyet_dinh: item.file_quyet_dinh || null,
            co_quan_don_vi: personnel?.CoQuanDonVi
              ? {
                  id: personnel.CoQuanDonVi.id,
                  ten_co_quan_don_vi: personnel.CoQuanDonVi.ten_don_vi,
                  ma_co_quan_don_vi: personnel.CoQuanDonVi.ma_don_vi,
                }
              : null,
            don_vi_truc_thuoc: personnel?.DonViTrucThuoc
              ? {
                  id: personnel.DonViTrucThuoc.id,
                  ten_don_vi: personnel.DonViTrucThuoc.ten_don_vi,
                  ma_don_vi: personnel.DonViTrucThuoc.ma_don_vi,
                  co_quan_don_vi: personnel.DonViTrucThuoc.CoQuanDonVi
                    ? {
                        id: personnel.DonViTrucThuoc.CoQuanDonVi.id,
                        ten_don_vi_truc: personnel.DonViTrucThuoc.CoQuanDonVi.ten_don_vi,
                        ma_don_vi: personnel.DonViTrucThuoc.CoQuanDonVi.ma_don_vi,
                      }
                    : null,
                }
              : null,
          };
        });
      } else if (type === 'DON_VI_HANG_NAM') {
        // DON_VI_HANG_NAM: titleData = [{ don_vi_id, don_vi_type, danh_hieu }]
        // don_vi_type: 'CO_QUAN_DON_VI' | 'DON_VI_TRUC_THUOC'
        // danh_hieu: 'ĐVQT' | 'ĐVTT' | 'BKBQP' | 'BKTTCP'
        dataDanhHieu = await Promise.all(
          titleData.map(async item => {
            let donViInfo = null;
            let coQuanDonViCha = null;

            if (item.don_vi_type === 'CO_QUAN_DON_VI') {
              const donVi = await prisma.coQuanDonVi.findUnique({
                where: { id: item.don_vi_id },
                select: {
                  id: true,
                  ten_don_vi: true,
                  ma_don_vi: true,
                },
              });
              donViInfo = donVi;
            } else if (item.don_vi_type === 'DON_VI_TRUC_THUOC') {
              const donVi = await prisma.donViTrucThuoc.findUnique({
                where: { id: item.don_vi_id },
                include: {
                  CoQuanDonVi: {
                    select: {
                      id: true,
                      ten_don_vi: true,
                      ma_don_vi: true,
                    },
                  },
                },
              });
              donViInfo = {
                id: donVi.id,
                ten_don_vi: donVi.ten_don_vi,
                ma_don_vi: donVi.ma_don_vi,
              };
              coQuanDonViCha = donVi.CoQuanDonVi;
            }

            return {
              don_vi_id: item.don_vi_id,
              don_vi_type: item.don_vi_type,
              ten_don_vi: donViInfo?.ten_don_vi || '',
              ma_don_vi: donViInfo?.ma_don_vi || '',
              nam: nam,
              danh_hieu: item.danh_hieu, // "ĐVQT" | "ĐVTT" | "BKBQP" | "BKTTCP"
              co_quan_don_vi_cha: coQuanDonViCha,
              // Thông tin quyết định
              so_quyet_dinh: item.so_quyet_dinh || null,
              file_quyet_dinh: item.file_quyet_dinh || null,
            };
          })
        );
      } else if (type === 'CA_NHAN_HANG_NAM') {
        // Standard: titleData = [{ personnel_id, danh_hieu }]
        // Không lưu cccd, thêm thông tin đơn vị
        // Luôn lưu cả co_quan_don_vi và don_vi_truc_thuoc nếu quân nhân có dữ liệu
        dataDanhHieu = titleData.map(item => {
          const personnel = personnelMap[item.personnel_id];

          // Xác định đơn vị của quân nhân
          const personnelCoQuanDonVi = personnel?.CoQuanDonVi;
          const personnelDonViTrucThuoc = personnel?.DonViTrucThuoc;

          // Luôn lưu cả hai nếu có dữ liệu
          let coQuanDonVi = null;
          let donViTrucThuoc = null;

          if (personnelCoQuanDonVi) {
            coQuanDonVi = {
              id: personnelCoQuanDonVi.id,
              ten_co_quan_don_vi: personnelCoQuanDonVi.ten_don_vi,
              ma_co_quan_don_vi: personnelCoQuanDonVi.ma_don_vi,
            };
          }

          // Kiểm tra cả don_vi_truc_thuoc_id và DonViTrucThuoc để đảm bảo lưu đúng
          // Nếu có don_vi_truc_thuoc_id, phải có DonViTrucThuoc (đã được fetch ở trên nếu thiếu)
          if (personnel?.don_vi_truc_thuoc_id && personnelDonViTrucThuoc) {
            donViTrucThuoc = {
              id: personnelDonViTrucThuoc.id,
              ten_don_vi: personnelDonViTrucThuoc.ten_don_vi,
              ma_don_vi: personnelDonViTrucThuoc.ma_don_vi,
              co_quan_don_vi: personnelDonViTrucThuoc.CoQuanDonVi
                ? {
                    id: personnelDonViTrucThuoc.CoQuanDonVi.id,
                    ten_don_vi_truc: personnelDonViTrucThuoc.CoQuanDonVi.ten_don_vi,
                    ma_don_vi: personnelDonViTrucThuoc.CoQuanDonVi.ma_don_vi,
                  }
                : null,
            };
          }

          return {
            personnel_id: item.personnel_id,
            ho_ten: personnel?.ho_ten || '',
            nam: nam,
            danh_hieu: item.danh_hieu,
            co_quan_don_vi: coQuanDonVi,
            don_vi_truc_thuoc: donViTrucThuoc,
          };
        });
      } else if (type === 'NIEN_HAN') {
        // NIEN_HAN: titleData = [{ personnel_id, danh_hieu }]
        // Không lưu cccd, thêm thông tin đơn vị
        dataNienHan = titleData.map(item => {
          const personnel = personnelMap[item.personnel_id];
          return {
            personnel_id: item.personnel_id,
            ho_ten: personnel?.ho_ten || '',
            nam: nam,
            danh_hieu: item.danh_hieu,
            so_quyet_dinh: item.so_quyet_dinh || null,
            file_quyet_dinh: item.file_quyet_dinh || null,
            co_quan_don_vi: personnel?.CoQuanDonVi
              ? {
                  id: personnel.CoQuanDonVi.id,
                  ten_co_quan_don_vi: personnel.CoQuanDonVi.ten_don_vi,
                  ma_co_quan_don_vi: personnel.CoQuanDonVi.ma_don_vi,
                }
              : null,
            don_vi_truc_thuoc: personnel?.DonViTrucThuoc
              ? {
                  id: personnel.DonViTrucThuoc.id,
                  ten_don_vi: personnel.DonViTrucThuoc.ten_don_vi,
                  ma_don_vi: personnel.DonViTrucThuoc.ma_don_vi,
                  co_quan_don_vi: personnel.DonViTrucThuoc.CoQuanDonVi
                    ? {
                        id: personnel.DonViTrucThuoc.CoQuanDonVi.id,
                        ten_don_vi_truc: personnel.DonViTrucThuoc.CoQuanDonVi.ten_don_vi,
                        ma_don_vi: personnel.DonViTrucThuoc.CoQuanDonVi.ma_don_vi,
                      }
                    : null,
                }
              : null,
          };
        });
      } else {
        // Các loại khác: CONG_HIEN, DOT_XUAT
        // Không lưu cccd, thêm thông tin đơn vị
        dataDanhHieu = titleData.map(item => {
          const personnel = personnelMap[item.personnel_id];
          return {
            personnel_id: item.personnel_id,
            ho_ten: personnel?.ho_ten || '',
            nam: nam,
            danh_hieu: item.danh_hieu,
            co_quan_don_vi: personnel?.CoQuanDonVi
              ? {
                  id: personnel.CoQuanDonVi.id,
                  ten_co_quan_don_vi: personnel.CoQuanDonVi.ten_don_vi,
                  ma_co_quan_don_vi: personnel.CoQuanDonVi.ma_don_vi,
                }
              : null,
            don_vi_truc_thuoc: personnel?.DonViTrucThuoc
              ? {
                  id: personnel.DonViTrucThuoc.id,
                  ten_don_vi: personnel.DonViTrucThuoc.ten_don_vi,
                  ma_don_vi: personnel.DonViTrucThuoc.ma_don_vi,
                  co_quan_don_vi: personnel.DonViTrucThuoc.CoQuanDonVi
                    ? {
                        id: personnel.DonViTrucThuoc.CoQuanDonVi.id,
                        ten_don_vi_truc: personnel.DonViTrucThuoc.CoQuanDonVi.ten_don_vi,
                        ma_don_vi: personnel.DonViTrucThuoc.CoQuanDonVi.ma_don_vi,
                      }
                    : null,
                }
              : null,
          };
        });
      }

      // ============================================
      // VALIDATION: Đảm bảo không mix CSTDCS/CSTT với BKBQP/CSTDTQ
      // BKBQP và CSTDTQ có thể đề xuất cùng nhau
      // ============================================
      if (type === 'CA_NHAN_HANG_NAM' && dataDanhHieu && dataDanhHieu.length > 0) {
        // Kiểm tra xem có CSTDCS/CSTT không
        const hasChinh = dataDanhHieu.some(
          item => item.danh_hieu === 'CSTDCS' || item.danh_hieu === 'CSTT'
        );
        const hasBKBQP = dataDanhHieu.some(item => item.danh_hieu === 'BKBQP');
        const hasCSTDTQ = dataDanhHieu.some(item => item.danh_hieu === 'CSTDTQ');

        // Không cho phép mix CSTDCS/CSTT với BKBQP/CSTDTQ
        // BKBQP và CSTDTQ có thể đề xuất cùng nhau
        if (hasChinh && (hasBKBQP || hasCSTDTQ)) {
          throw new Error(
            'Không thể đề xuất CSTDCS/CSTT cùng với BKBQP/CSTDTQ trong một đề xuất. ' +
              'Vui lòng tách thành các đề xuất riêng: một đề xuất cho CSTDCS/CSTT, và một đề xuất riêng cho BKBQP/CSTDTQ.'
          );
        }
      }

      // ============================================
      // VALIDATION cho NIEN_HAN: Đảm bảo chỉ chọn một nhóm
      // Nhóm 1: Các hạng HCCSVV (HCCSVV_HANG_BA, HCCSVV_HANG_NHI, HCCSVV_HANG_NHAT) đi với nhau
      // Nhóm 2: HC_QKQT (riêng)
      // Nhóm 3: KNC_VSNXD_QDNDVN (riêng)
      // ============================================
      if (type === 'NIEN_HAN' && dataNienHan && dataNienHan.length > 0) {
        const danhHieus = dataNienHan.map(item => item.danh_hieu).filter(Boolean);

        // Kiểm tra xem có các hạng HCCSVV không
        const hasHCCSVV = danhHieus.some(
          dh => dh === 'HCCSVV_HANG_BA' || dh === 'HCCSVV_HANG_NHI' || dh === 'HCCSVV_HANG_NHAT'
        );

        // Kiểm tra xem có HC_QKQT không
        const hasHC_QKQT = danhHieus.some(dh => dh === 'HC_QKQT');

        // Kiểm tra xem có KNC_VSNXD_QDNDVN không
        const hasKNC = danhHieus.some(dh => dh === 'KNC_VSNXD_QDNDVN');

        // Không cho phép mix các nhóm
        const groupCount = [hasHCCSVV, hasHC_QKQT, hasKNC].filter(Boolean).length;
        if (groupCount > 1) {
          throw new Error(
            'Không thể đề xuất các nhóm danh hiệu khác nhau trong một đề xuất. ' +
              'Vui lòng tách thành các đề xuất riêng: một đề xuất cho các hạng HCCSVV, một đề xuất cho HC_QKQT, và một đề xuất cho KNC_VSNXD_QDNDVN.'
          );
        }
      }

      // ============================================
      // LƯU VÀO CSDL
      // ============================================
      // Xác định loại đơn vị và set đúng foreign key
      const isCoQuanDonVi = !!user.QuanNhan.co_quan_don_vi_id;
      const proposalData = {
        nguoi_de_xuat_id: userId,
        loai_de_xuat: type,
        nam: parseInt(nam) || new Date().getFullYear(),
        status: 'PENDING',
        data_danh_hieu: dataDanhHieu,
        data_thanh_tich: dataThanhTich,
        data_nien_han: dataNienHan,
        files_attached: filesInfo.length > 0 ? filesInfo : null,
        ghi_chu: null,
      };

      if (isCoQuanDonVi) {
        proposalData.co_quan_don_vi_id = donViId;
        proposalData.don_vi_truc_thuoc_id = null;
      } else {
        proposalData.co_quan_don_vi_id = null;
        proposalData.don_vi_truc_thuoc_id = donViId;
      }

      const proposal = await prisma.bangDeXuat.create({
        data: proposalData,
        include: {
          CoQuanDonVi: true,
          DonViTrucThuoc: {
            include: {
              CoQuanDonVi: true,
            },
          },
          NguoiDeXuat: {
            include: {
              QuanNhan: true,
            },
          },
        },
      });

      return {
        message: 'Đã gửi đề xuất khen thưởng thành công',
        proposal: {
          id: proposal.id,
          loai_de_xuat: proposal.loai_de_xuat,
          don_vi: (proposal.DonViTrucThuoc || proposal.CoQuanDonVi)?.ten_don_vi || '-',
          nguoi_de_xuat: proposal.NguoiDeXuat.QuanNhan?.ho_ten || proposal.NguoiDeXuat.username,
          status: proposal.status,
          so_personnel: titleData.length,
          createdAt: proposal.createdAt,
        },
      };
    } catch (error) {
      console.error('Submit proposal error:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách đề xuất
   * @param {number} userId - ID của tài khoản
   * @param {string} userRole - Role của user (ADMIN, MANAGER)
   * @param {number} page - Trang hiện tại
   * @param {number} limit - Số bản ghi mỗi trang
   * @returns {Promise<Object>} - Danh sách đề xuất
   */
  async getProposals(userId, userRole, page = 1, limit = 10) {
    try {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Xây dựng điều kiện where
      let whereCondition = {};

      if (userRole === 'MANAGER') {
        // Manager chỉ xem đề xuất của đơn vị mình
        const user = await prisma.taiKhoan.findUnique({
          where: { id: userId },
          include: {
            QuanNhan: {
              include: {
                CoQuanDonVi: true,
                DonViTrucThuoc: true,
              },
            },
          },
        });

        if (!user || !user.QuanNhan) {
          throw new Error('Không tìm thấy thông tin quân nhân');
        }

        const donViId = user.QuanNhan.co_quan_don_vi_id || user.QuanNhan.don_vi_truc_thuoc_id;
        if (user.QuanNhan.co_quan_don_vi_id) {
          whereCondition.co_quan_don_vi_id = donViId;
        } else {
          whereCondition.don_vi_truc_thuoc_id = donViId;
        }
      }
      // ADMIN xem tất cả

      // Lấy danh sách và tổng số
      const [proposals, total] = await Promise.all([
        prisma.bangDeXuat.findMany({
          where: whereCondition,
          skip,
          take,
          include: {
            CoQuanDonVi: true,
            DonViTrucThuoc: {
              include: {
                CoQuanDonVi: true,
              },
            },
            NguoiDeXuat: {
              include: {
                QuanNhan: true,
              },
            },
            NguoiDuyet: {
              include: {
                QuanNhan: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.bangDeXuat.count({ where: whereCondition }),
      ]);

      return {
        proposals: proposals.map(p => ({
          id: p.id,
          loai_de_xuat: p.loai_de_xuat,
          nam: p.nam,
          don_vi: (p.DonViTrucThuoc || p.CoQuanDonVi)?.ten_don_vi || '-',
          nguoi_de_xuat: p.NguoiDeXuat.QuanNhan?.ho_ten || p.NguoiDeXuat.username,
          status: p.status,
          so_danh_hieu: Array.isArray(p.data_danh_hieu) ? p.data_danh_hieu.length : 0,
          so_thanh_tich: Array.isArray(p.data_thanh_tich) ? p.data_thanh_tich.length : 0,
          nguoi_duyet: p.NguoiDuyet?.QuanNhan?.ho_ten || null,
          ngay_duyet: p.ngay_duyet,
          ghi_chu: p.ghi_chu,
          createdAt: p.createdAt,
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      console.error('Get proposals error:', error);
      throw error;
    }
  }

  /**
   * Lấy chi tiết 1 đề xuất
   * @param {number} proposalId - ID của đề xuất
   * @param {number} userId - ID của tài khoản
   * @param {string} userRole - Role của user
   * @returns {Promise<Object>} - Chi tiết đề xuất
   */
  async getProposalById(proposalId, userId, userRole) {
    try {
      const proposal = await prisma.bangDeXuat.findUnique({
        where: { id: proposalId },
        include: {
          CoQuanDonVi: true,
          DonViTrucThuoc: {
            include: {
              CoQuanDonVi: true,
            },
          },
          NguoiDeXuat: {
            include: {
              QuanNhan: {
                include: {
                  CoQuanDonVi: true,
                  DonViTrucThuoc: {
                    include: {
                      CoQuanDonVi: true,
                    },
                  },
                },
              },
            },
          },
          NguoiDuyet: {
            include: {
              QuanNhan: true,
            },
          },
        },
      });

      if (!proposal) {
        throw new Error('Không tìm thấy đề xuất');
      }

      // Kiểm tra quyền truy cập
      if (userRole === 'MANAGER') {
        const user = await prisma.taiKhoan.findUnique({
          where: { id: userId },
          include: {
            QuanNhan: {
              include: {
                CoQuanDonVi: true,
                DonViTrucThuoc: true,
              },
            },
          },
        });

        if (user && user.QuanNhan) {
          const userDonViId = user.QuanNhan.co_quan_don_vi_id || user.QuanNhan.don_vi_truc_thuoc_id;
          const proposalDonViId = proposal.co_quan_don_vi_id || proposal.don_vi_truc_thuoc_id;

          if (userDonViId !== proposalDonViId) {
            throw new Error('Bạn không có quyền xem đề xuất này');
          }
        }
      }

      // Đảm bảo data_danh_hieu và data_thanh_tich luôn là array
      let dataDanhHieu = Array.isArray(proposal.data_danh_hieu)
        ? proposal.data_danh_hieu
        : proposal.data_danh_hieu
        ? [proposal.data_danh_hieu]
        : [];

      let dataThanhTich = Array.isArray(proposal.data_thanh_tich)
        ? proposal.data_thanh_tich
        : proposal.data_thanh_tich
        ? [proposal.data_thanh_tich]
        : [];

      // Enrich thông tin quân nhân/đơn vị nếu thiếu (dữ liệu cũ)
      // Xử lý riêng cho DON_VI_HANG_NAM (khen thưởng tập thể)
      if (proposal.loai_de_xuat === 'DON_VI_HANG_NAM') {
        // Enrich dataDanhHieu cho khen thưởng tập thể
        dataDanhHieu = await Promise.all(
          dataDanhHieu.map(async item => {
            // Nếu đã có đầy đủ thông tin, không cần enrich
            if (item.ten_don_vi && item.ma_don_vi) {
              return {
                ...item,
                nam: item.nam || proposal.createdAt?.getFullYear() || new Date().getFullYear(),
              };
            }

            // Enrich thông tin đơn vị nếu thiếu
            let donViInfo = null;
            let coQuanDonViCha = null;

            if (item.don_vi_type === 'CO_QUAN_DON_VI' && item.don_vi_id) {
              const donVi = await prisma.coQuanDonVi.findUnique({
                where: { id: item.don_vi_id },
                select: {
                  id: true,
                  ten_don_vi: true,
                  ma_don_vi: true,
                },
              });
              donViInfo = donVi;
            } else if (item.don_vi_type === 'DON_VI_TRUC_THUOC' && item.don_vi_id) {
              const donVi = await prisma.donViTrucThuoc.findUnique({
                where: { id: item.don_vi_id },
                include: {
                  CoQuanDonVi: {
                    select: {
                      id: true,
                      ten_don_vi: true,
                      ma_don_vi: true,
                    },
                  },
                },
              });
              donViInfo = {
                id: donVi.id,
                ten_don_vi: donVi.ten_don_vi,
                ma_don_vi: donVi.ma_don_vi,
              };
              coQuanDonViCha = donVi.CoQuanDonVi;
            }

            return {
              ...item,
              ten_don_vi: item.ten_don_vi || donViInfo?.ten_don_vi || '',
              ma_don_vi: item.ma_don_vi || donViInfo?.ma_don_vi || '',
              nam: item.nam || proposal.createdAt?.getFullYear() || new Date().getFullYear(),
              co_quan_don_vi_cha: item.co_quan_don_vi_cha || coQuanDonViCha,
            };
          })
        );
      } else {
        // Xử lý cho các loại khen thưởng cá nhân
        const allPersonnelIds = [
          ...dataDanhHieu.map(d => d.personnel_id).filter(Boolean),
          ...dataThanhTich.map(d => d.personnel_id).filter(Boolean),
        ];

        if (allPersonnelIds.length > 0) {
          // Fetch thông tin quân nhân và đơn vị
          const personnelList = await prisma.quanNhan.findMany({
            where: {
              id: {
                in: allPersonnelIds,
              },
            },
            select: {
              id: true,
              ho_ten: true,
              CoQuanDonVi: {
                select: {
                  id: true,
                  ten_don_vi: true,
                  ma_don_vi: true,
                },
              },
              DonViTrucThuoc: {
                select: {
                  id: true,
                  ten_don_vi: true,
                  ma_don_vi: true,
                  co_quan_don_vi_id: true,
                  CoQuanDonVi: {
                    select: {
                      id: true,
                      ten_don_vi: true,
                      ma_don_vi: true,
                    },
                  },
                },
              },
            },
          });

          const personnelMap = {};
          personnelList.forEach(p => {
            personnelMap[p.id] = p;
          });

          // Enrich dataDanhHieu nếu thiếu thông tin
          dataDanhHieu = dataDanhHieu.map(item => {
            const personnel = personnelMap[item.personnel_id];
            const enrichedItem = {
              ...item,
              ho_ten: item.ho_ten || personnel?.ho_ten || '',
              nam: item.nam || proposal.createdAt?.getFullYear() || new Date().getFullYear(),
            };

            // Thêm thông tin đơn vị nếu chưa có (theo cấu trúc mới)
            // Luôn lưu cả hai nếu quân nhân có dữ liệu
            if (!item.co_quan_don_vi && personnel?.CoQuanDonVi) {
              enrichedItem.co_quan_don_vi = {
                id: personnel.CoQuanDonVi.id,
                ten_co_quan_don_vi: personnel.CoQuanDonVi.ten_don_vi,
                ma_co_quan_don_vi: personnel.CoQuanDonVi.ma_don_vi,
              };
            }
            if (!item.don_vi_truc_thuoc && personnel?.DonViTrucThuoc) {
              enrichedItem.don_vi_truc_thuoc = {
                id: personnel.DonViTrucThuoc.id,
                ten_don_vi: personnel.DonViTrucThuoc.ten_don_vi,
                ma_don_vi: personnel.DonViTrucThuoc.ma_don_vi,
                co_quan_don_vi: personnel.DonViTrucThuoc.CoQuanDonVi
                  ? {
                      id: personnel.DonViTrucThuoc.CoQuanDonVi.id,
                      ten_don_vi_truc: personnel.DonViTrucThuoc.CoQuanDonVi.ten_don_vi,
                      ma_don_vi: personnel.DonViTrucThuoc.CoQuanDonVi.ma_don_vi,
                    }
                  : null,
              };
            }

            return enrichedItem;
          });

          // Enrich dataThanhTich nếu thiếu thông tin
          dataThanhTich = dataThanhTich.map(item => {
            const personnel = personnelMap[item.personnel_id];
            const enrichedItem = {
              ...item,
              ho_ten: item.ho_ten || personnel?.ho_ten || '',
              nam: item.nam || proposal.createdAt?.getFullYear() || new Date().getFullYear(),
            };

            // Thêm thông tin đơn vị nếu chưa có (theo cấu trúc mới)
            // Luôn lưu cả hai nếu quân nhân có dữ liệu
            if (!item.co_quan_don_vi && personnel?.CoQuanDonVi) {
              enrichedItem.co_quan_don_vi = {
                id: personnel.CoQuanDonVi.id,
                ten_co_quan_don_vi: personnel.CoQuanDonVi.ten_don_vi,
                ma_co_quan_don_vi: personnel.CoQuanDonVi.ma_don_vi,
              };
            }
            if (!item.don_vi_truc_thuoc && personnel?.DonViTrucThuoc) {
              enrichedItem.don_vi_truc_thuoc = {
                id: personnel.DonViTrucThuoc.id,
                ten_don_vi: personnel.DonViTrucThuoc.ten_don_vi,
                ma_don_vi: personnel.DonViTrucThuoc.ma_don_vi,
                co_quan_don_vi: personnel.DonViTrucThuoc.CoQuanDonVi
                  ? {
                      id: personnel.DonViTrucThuoc.CoQuanDonVi.id,
                      ten_don_vi_truc: personnel.DonViTrucThuoc.CoQuanDonVi.ten_don_vi,
                      ma_don_vi: personnel.DonViTrucThuoc.CoQuanDonVi.ma_don_vi,
                    }
                  : null,
              };
            }

            return enrichedItem;
          });
        }
      }

      // Nếu proposal đã được approve, enrich với thông tin file PDF từ database
      if (proposal.status === 'APPROVED' && dataDanhHieu.length > 0) {
        if (proposal.loai_de_xuat === 'DON_VI_HANG_NAM') {
          // Với khen thưởng tập thể, file PDF đã được lưu trong data đề xuất khi approve
          // Không cần enrich từ database khác vì không có bảng riêng cho khen thưởng tập thể
          // File PDF đã được lưu trong item.file_quyet_dinh khi approve
        } else {
          // Lấy danh hiệu từ database dựa trên personnel_id (cho khen thưởng cá nhân)
          const personnelIds = dataDanhHieu.map(d => d.personnel_id).filter(Boolean);
          if (personnelIds.length > 0) {
            const danhHieuFromDB = await prisma.danhHieuHangNam.findMany({
              where: {
                quan_nhan_id: { in: personnelIds },
                nam: proposal.nam,
              },
              include: {
                QuanNhan: {
                  select: { id: true },
                },
              },
            });

            const danhHieuMap = {};
            danhHieuFromDB.forEach(dh => {
              const personnelId = dh.quan_nhan_id;
              if (!danhHieuMap[personnelId]) {
                danhHieuMap[personnelId] = [];
              }
              danhHieuMap[personnelId].push(dh);
            });

            // Enrich dataDanhHieu với file PDF và số quyết định
            dataDanhHieu = dataDanhHieu.map(item => {
              const dbRecords = danhHieuMap[item.personnel_id] || [];
              const matchingRecord = dbRecords.find(
                r => r.danh_hieu === item.danh_hieu && r.nam === item.nam
              );
              if (matchingRecord) {
                return {
                  ...item,
                  so_quyet_dinh: matchingRecord.so_quyet_dinh || item.so_quyet_dinh,
                  file_quyet_dinh: matchingRecord.file_quyet_dinh,
                  file_quyet_dinh_bkbqp: matchingRecord.file_quyet_dinh_bkbqp,
                  file_quyet_dinh_cstdtq: matchingRecord.file_quyet_dinh_cstdtq,
                };
              }
              return item;
            });
          }
        }
      }

      return {
        id: proposal.id,
        loai_de_xuat: proposal.loai_de_xuat,
        nam: proposal.nam,
        don_vi: {
          id: (proposal.DonViTrucThuoc || proposal.CoQuanDonVi)?.id || null,
          ma_don_vi: (proposal.DonViTrucThuoc || proposal.CoQuanDonVi)?.ma_don_vi || '',
          ten_don_vi: (proposal.DonViTrucThuoc || proposal.CoQuanDonVi)?.ten_don_vi || '',
        },
        nguoi_de_xuat: {
          id: proposal.NguoiDeXuat.id,
          username: proposal.NguoiDeXuat.username,
          ho_ten: proposal.NguoiDeXuat.QuanNhan?.ho_ten,
        },
        status: proposal.status,
        data_danh_hieu: dataDanhHieu,
        data_thanh_tich: dataThanhTich,
        files_attached: proposal.files_attached || [],
        ghi_chu: proposal.ghi_chu,
        nguoi_duyet: proposal.NguoiDuyet
          ? {
              id: proposal.NguoiDuyet.id,
              username: proposal.NguoiDuyet.username,
              ho_ten: proposal.NguoiDuyet.QuanNhan?.ho_ten,
            }
          : null,
        ngay_duyet: proposal.ngay_duyet,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
      };
    } catch (error) {
      console.error('Get proposal by id error:', error);
      throw error;
    }
  }

  /**
   * Phê duyệt đề xuất và import vào CSDL chính
   * @param {number} proposalId - ID của đề xuất
   * @param {Object} editedData - Dữ liệu đã được chỉnh sửa từ Admin
   * @param {number} adminId - ID của Admin phê duyệt
   * @returns {Promise<Object>} - Kết quả phê duyệt
   */
  async approveProposal(
    proposalId,
    editedData,
    adminId,
    decisions = {},
    pdfFiles = {},
    ghiChu = null
  ) {
    const fs = require('fs').promises;
    const path = require('path');

    try {
      // Lấy thông tin đề xuất
      const proposal = await prisma.bangDeXuat.findUnique({
        where: { id: proposalId },
        include: {
          CoQuanDonVi: true,
          DonViTrucThuoc: {
            include: {
              CoQuanDonVi: true,
            },
          },
          NguoiDeXuat: {
            include: {
              QuanNhan: true,
            },
          },
          NguoiDuyet: {
            include: {
              QuanNhan: true,
            },
          },
        },
      });

      if (!proposal) {
        throw new Error('Không tìm thấy đề xuất');
      }

      if (proposal.status === 'APPROVED') {
        throw new Error('Đề xuất này đã được phê duyệt trước đó');
      }

      // Dữ liệu để import (ưu tiên dữ liệu đã chỉnh sửa)
      const danhHieuData = editedData.data_danh_hieu || proposal.data_danh_hieu || [];
      const thanhTichData = editedData.data_thanh_tich || proposal.data_thanh_tich || [];

      let importedDanhHieu = 0;
      let importedThanhTich = 0;
      const errors = [];
      const affectedPersonnelIds = new Set(); // Track quân nhân bị ảnh hưởng

      // ============================================
      // LƯU FILE PDF VÀO UPLOADS
      // Kiểm tra xem quyết định đã có file trong DB chưa, nếu có thì dùng file đó
      // ============================================
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'decisions');
      await fs.mkdir(uploadsDir, { recursive: true });

      const pdfPaths = {};

      // Hàm helper để tạo tên file giữ nguyên tên gốc, thêm số thứ tự nếu trùng
      const getUniqueFilename = async originalName => {
        const ext = path.extname(originalName);
        const baseName = path.basename(originalName, ext);
        let filename = originalName;
        let counter = 1;

        // Kiểm tra nếu file đã tồn tại, thêm số thứ tự
        while (
          await fs
            .access(path.join(uploadsDir, filename))
            .then(() => true)
            .catch(() => false)
        ) {
          filename = `${baseName}(${counter})${ext}`;
          counter++;
        }

        return filename;
      };

      // Hàm helper để lấy file_path từ DB nếu quyết định đã tồn tại
      const getFilePathFromDB = async soQuyetDinh => {
        if (!soQuyetDinh) return null;
        try {
          const decision = await prisma.fileQuyetDinh.findUnique({
            where: { so_quyet_dinh: soQuyetDinh },
            select: { file_path: true },
          });
          return decision?.file_path || null;
        } catch (error) {
          console.error(`Lỗi khi tìm file_path cho quyết định ${soQuyetDinh}:`, error);
          return null;
        }
      };

      // Map các key trong pdfFiles với số quyết định tương ứng
      const pdfFileToDecisionMap = {
        file_pdf_ca_nhan_hang_nam: decisions.so_quyet_dinh_ca_nhan_hang_nam,
        file_pdf_don_vi_hang_nam: decisions.so_quyet_dinh_don_vi_hang_nam,
        file_pdf_nien_han: decisions.so_quyet_dinh_nien_han,
        file_pdf_cong_hien: decisions.so_quyet_dinh_cong_hien,
        file_pdf_dot_xuat: decisions.so_quyet_dinh_dot_xuat,
        file_pdf_nckh: decisions.so_quyet_dinh_nckh,
      };

      // Lưu file PDF cho từng loại danh hiệu và thành tích
      // Chỉ upload nếu chưa có file trong DB
      for (const [key, file] of Object.entries(pdfFiles)) {
        if (file && file.buffer) {
          const soQuyetDinh = pdfFileToDecisionMap[key];

          // Kiểm tra xem quyết định đã có file trong DB chưa
          const existingFilePath = await getFilePathFromDB(soQuyetDinh);

          if (existingFilePath) {
            // Nếu đã có file trong DB, dùng file đó
            console.log(`✅ Quyết định ${soQuyetDinh} đã có file trong DB: ${existingFilePath}`);
            pdfPaths[key] = existingFilePath;
          } else {
            // Nếu chưa có, upload file mới
            console.log(`📤 Upload file mới cho quyết định ${soQuyetDinh}`);
            const filename = await getUniqueFilename(file.originalname);
            const filepath = path.join(uploadsDir, filename);
            await fs.writeFile(filepath, file.buffer);
            pdfPaths[key] = `uploads/decisions/${filename}`;
          }
        }
      }

      // Lưu file PDF cho thành tích NCKH/SKKH nếu có
      if (pdfFiles.file_pdf_nckh && pdfFiles.file_pdf_nckh.buffer) {
        const soQuyetDinh = decisions.so_quyet_dinh_nckh;
        const existingFilePath = await getFilePathFromDB(soQuyetDinh);

        if (existingFilePath) {
          console.log(`✅ Quyết định NCKH ${soQuyetDinh} đã có file trong DB: ${existingFilePath}`);
          pdfPaths.file_pdf_nckh = existingFilePath;
        } else {
          console.log(`📤 Upload file mới cho quyết định NCKH ${soQuyetDinh}`);
          const filename = await getUniqueFilename(pdfFiles.file_pdf_nckh.originalname);
          const filepath = path.join(uploadsDir, filename);
          await fs.writeFile(filepath, pdfFiles.file_pdf_nckh.buffer);
          pdfPaths.file_pdf_nckh = `uploads/decisions/${filename}`;
        }
      }

      // ============================================
      // TẠO MAPPING DANH HIỆU -> QUYẾT ĐỊNH
      // ============================================
      const decisionMapping = {
        CSTT: {
          so_quyet_dinh: decisions.so_quyet_dinh_cstt,
          file_pdf: pdfPaths.file_pdf_cstt,
        },
        CSTDCS: {
          so_quyet_dinh: decisions.so_quyet_dinh_cstdcs,
          file_pdf: pdfPaths.file_pdf_cstdcs,
        },
      };

      const specialDecisionMapping = {
        BKBQP: {
          so_quyet_dinh: decisions.so_quyet_dinh_bkbqp,
          file_pdf: pdfPaths.file_pdf_bkbqp,
        },
        CSTDTQ: {
          so_quyet_dinh: decisions.so_quyet_dinh_cstdtq,
          file_pdf: pdfPaths.file_pdf_cstdtq,
        },
      };

      // ============================================
      // IMPORT DANH HIỆU HẰNG NĂM
      // ============================================
      // Với đề xuất DON_VI_HANG_NAM, lưu vào bảng TheoDoiKhenThuongDonVi
      if (proposal.loai_de_xuat === 'DON_VI_HANG_NAM') {
        for (const item of danhHieuData) {
          try {
            // Kiểm tra có đủ thông tin đơn vị không
            if (!item.don_vi_id || !item.don_vi_type) {
              errors.push(`Thiếu thông tin đơn vị trong dữ liệu: ${JSON.stringify(item)}`);
              continue;
            }

            // Chỉ lưu các đơn vị có danh hiệu
            if (!item.danh_hieu || item.danh_hieu.trim() === '') {
              continue;
            }

            // Xác định co_quan_don_vi_id và don_vi_truc_thuoc_id
            const coQuanDonViId = item.don_vi_type === 'CO_QUAN_DON_VI' ? item.don_vi_id : null;
            const donViTrucThuocId =
              item.don_vi_type === 'DON_VI_TRUC_THUOC' ? item.don_vi_id : null;

            // Lấy số quyết định và file từ item (đã được Admin thêm vào)
            const soQuyetDinh = item.so_quyet_dinh || null;
            const fileQuyetDinh = item.file_quyet_dinh || null;

            // Lấy thông tin đơn vị cha (null nếu là đơn vị cha)
            const coQuanDonViChaId =
              item.don_vi_type === 'DON_VI_TRUC_THUOC' && item.co_quan_don_vi_cha?.id
                ? item.co_quan_don_vi_cha.id
                : null;

            // Upsert vào bảng TheoDoiKhenThuongDonVi
            // Tìm bản ghi hiện có theo (co_quan_don_vi_id hoặc don_vi_truc_thuoc_id) và nam
            const namValue = typeof item.nam === 'string' ? parseInt(item.nam, 10) : item.nam;
            const whereCondition = {
              nam: namValue,
              OR: [
                ...(coQuanDonViId ? [{ co_quan_don_vi_id: coQuanDonViId }] : []),
                ...(donViTrucThuocId ? [{ don_vi_truc_thuoc_id: donViTrucThuocId }] : []),
              ],
            };

            const existingRecord = await prisma.theoDoiKhenThuongDonVi.findFirst({
              where: whereCondition,
            });

            let savedRecord;
            if (existingRecord) {
              // Cập nhật bản ghi hiện có
              savedRecord = await prisma.theoDoiKhenThuongDonVi.update({
                where: { id: existingRecord.id },
                data: {
                  danh_hieu: item.danh_hieu,
                  ten_don_vi: item.ten_don_vi || null,
                  ma_don_vi: item.ma_don_vi || null,
                  co_quan_don_vi_cha_id: coQuanDonViChaId,
                  so_quyet_dinh: soQuyetDinh,
                  ten_file_pdf: fileQuyetDinh,
                  status: 'APPROVED',
                  nguoi_duyet_id: adminId,
                  ngay_duyet: new Date(),
                },
              });
            } else {
              // Tạo bản ghi mới
              savedRecord = await prisma.theoDoiKhenThuongDonVi.create({
                data: {
                  co_quan_don_vi_id: coQuanDonViId,
                  don_vi_truc_thuoc_id: donViTrucThuocId,
                  nam: namValue,
                  danh_hieu: item.danh_hieu,
                  ten_don_vi: item.ten_don_vi || null,
                  ma_don_vi: item.ma_don_vi || null,
                  co_quan_don_vi_cha_id: coQuanDonViChaId,
                  so_quyet_dinh: soQuyetDinh,
                  ten_file_pdf: fileQuyetDinh,
                  status: 'APPROVED',
                  nguoi_tao_id: adminId,
                  nguoi_duyet_id: adminId,
                  ngay_duyet: new Date(),
                },
              });
            }

            // Tính toán so_nam_lien_tuc và các flag
            // Query lại tất cả records của đơn vị này từ năm hiện tại trở về trước (bao gồm cả bản ghi vừa lưu)
            const whereConditionForYears = {
              nam: { lte: namValue },
              OR: [
                ...(coQuanDonViId ? [{ co_quan_don_vi_id: coQuanDonViId }] : []),
                ...(donViTrucThuocId ? [{ don_vi_truc_thuoc_id: donViTrucThuocId }] : []),
              ],
            };

            const allRecords = await prisma.theoDoiKhenThuongDonVi.findMany({
              where: whereConditionForYears,
              orderBy: { nam: 'desc' },
              select: { nam: true, danh_hieu: true },
            });

            // Tính số năm liên tục từ năm hiện tại trở về trước
            // Có danh hiệu = có danh_hieu không null và không rỗng
            let soNamLienTuc = 0;
            let currentYear = namValue;

            // Tạo map để dễ tra cứu
            const recordsByYear = {};
            for (const r of allRecords) {
              if (!recordsByYear[r.nam]) {
                recordsByYear[r.nam] = [];
              }
              recordsByYear[r.nam].push(r);
            }

            // Đếm từ năm hiện tại trở về trước
            while (currentYear > 0) {
              const yearRecords = recordsByYear[currentYear] || [];
              // Kiểm tra xem năm này có danh hiệu không
              const hasAward = yearRecords.some(r => r.danh_hieu && r.danh_hieu.trim() !== '');

              if (hasAward) {
                soNamLienTuc++;
                currentYear--;
              } else {
                // Nếu năm này không có danh hiệu, dừng lại
                break;
              }
            }

            // Tính các flag và gợi ý (chỉ khi chính xác bằng 3 hoặc 5)
            const du3 = soNamLienTuc === 3;
            const du5 = soNamLienTuc === 5;
            let goi_y = null;
            if (!soQuyetDinh) {
              if (du5) {
                goi_y = 'Đủ điều kiện đề xuất Bằng khen Thủ tướng Chính phủ (5 năm liên tục).';
              } else if (du3) {
                goi_y = 'Đủ điều kiện đề xuất Bằng khen Tổng cục (3 năm liên tục).';
              }
            }

            // Cập nhật lại các trường tính toán
            await prisma.theoDoiKhenThuongDonVi.update({
              where: { id: savedRecord.id },
              data: {
                so_nam_lien_tuc: soNamLienTuc,
                du_dieu_kien_bk_tong_cuc: du3,
                du_dieu_kien_bk_thu_tuong: du5,
                goi_y: goi_y,
              },
            });

            importedDanhHieu++;
          } catch (error) {
            errors.push(
              `Lỗi import khen thưởng đơn vị ${item.ten_don_vi || item.don_vi_id}: ${error.message}`
            );
          }
        }
      } else {
        // Với đề xuất cá nhân, import vào bảng DanhHieuHangNam
        for (const item of danhHieuData) {
          try {
            // Kiểm tra có personnel_id không (bắt buộc cho đề xuất cá nhân)
            if (!item.personnel_id) {
              errors.push(`Thiếu personnel_id trong dữ liệu danh hiệu: ${JSON.stringify(item)}`);
              continue;
            }

            // Tìm quân nhân theo personnel_id
            const quanNhan = await prisma.quanNhan.findUnique({
              where: { id: item.personnel_id },
            });

            if (!quanNhan) {
              errors.push(`Không tìm thấy quân nhân với ID: ${item.personnel_id}`);
              continue;
            }

            // Tự động gán số quyết định và file PDF dựa trên danh_hieu
            const danhHieuDecision = decisionMapping[item.danh_hieu] || {};
            const soQuyetDinhDanhHieu = danhHieuDecision.so_quyet_dinh;
            const filePdfDanhHieu = danhHieuDecision.file_pdf;

            // Quyết định BKBQP và CSTDTQ (từ item hoặc từ special mapping)
            // Nếu có so_quyet_dinh_bkbqp hoặc file_quyet_dinh_bkbqp, tự động set nhan_bkbqp = true
            let soQuyetDinhBKBQP = item.so_quyet_dinh_bkbqp;
            let filePdfBKBQP = item.file_quyet_dinh_bkbqp || null;
            let nhanBKBQP = item.nhan_bkbqp || false;

            // Tự động nhận diện nếu có quyết định BKBQP
            if (soQuyetDinhBKBQP || filePdfBKBQP) {
              nhanBKBQP = true;
            }

            if (nhanBKBQP && specialDecisionMapping.BKBQP) {
              soQuyetDinhBKBQP = soQuyetDinhBKBQP || specialDecisionMapping.BKBQP.so_quyet_dinh;
              filePdfBKBQP = filePdfBKBQP || specialDecisionMapping.BKBQP.file_pdf;
            }

            // Nếu có so_quyet_dinh_cstdtq hoặc file_quyet_dinh_cstdtq, tự động set nhan_cstdtq = true
            let soQuyetDinhCSTDTQ = item.so_quyet_dinh_cstdtq;
            let filePdfCSTDTQ = item.file_quyet_dinh_cstdtq || null;
            let nhanCSTDTQ = item.nhan_cstdtq || false;

            // Tự động nhận diện nếu có quyết định CSTDTQ
            if (soQuyetDinhCSTDTQ || filePdfCSTDTQ) {
              nhanCSTDTQ = true;
            }

            if (nhanCSTDTQ && specialDecisionMapping.CSTDTQ) {
              soQuyetDinhCSTDTQ = soQuyetDinhCSTDTQ || specialDecisionMapping.CSTDTQ.so_quyet_dinh;
              filePdfCSTDTQ = filePdfCSTDTQ || specialDecisionMapping.CSTDTQ.file_pdf;
            }

            // Lưu vào cùng năm đề xuất (không phải năm trong item.nam)
            const namLuu = proposal.nam;

            // Upsert vào bảng DanhHieuHangNam
            await prisma.danhHieuHangNam.upsert({
              where: {
                quan_nhan_id_nam: {
                  quan_nhan_id: quanNhan.id,
                  nam: namLuu,
                },
              },
              update: {
                danh_hieu: item.danh_hieu,
                so_quyet_dinh: soQuyetDinhDanhHieu,
                file_quyet_dinh: filePdfDanhHieu,
                nhan_bkbqp: nhanBKBQP,
                so_quyet_dinh_bkbqp: soQuyetDinhBKBQP,
                file_quyet_dinh_bkbqp: filePdfBKBQP,
                nhan_cstdtq: nhanCSTDTQ,
                so_quyet_dinh_cstdtq: soQuyetDinhCSTDTQ,
                file_quyet_dinh_cstdtq: filePdfCSTDTQ,
              },
              create: {
                quan_nhan_id: quanNhan.id,
                nam: namLuu,
                danh_hieu: item.danh_hieu,
                so_quyet_dinh: soQuyetDinhDanhHieu,
                file_quyet_dinh: filePdfDanhHieu,
                nhan_bkbqp: nhanBKBQP,
                so_quyet_dinh_bkbqp: soQuyetDinhBKBQP,
                file_quyet_dinh_bkbqp: filePdfBKBQP,
                nhan_cstdtq: nhanCSTDTQ,
                so_quyet_dinh_cstdtq: soQuyetDinhCSTDTQ,
                file_quyet_dinh_cstdtq: filePdfCSTDTQ,
              },
            });

            importedDanhHieu++;
            affectedPersonnelIds.add(quanNhan.id); // Track personnel bị ảnh hưởng
          } catch (error) {
            errors.push(
              `Lỗi import danh hiệu personnel_id ${item.personnel_id || 'N/A'}: ${error.message}`
            );
          }
        }
      }

      // ============================================
      // IMPORT THÀNH TÍCH KHOA HỌC
      // ============================================
      for (const item of thanhTichData) {
        try {
          // Chỉ tìm theo ID
          if (!item.personnel_id) {
            errors.push(`Thành tích thiếu personnel_id: ${JSON.stringify(item)}`);
            continue;
          }

          const quanNhan = await prisma.quanNhan.findUnique({
            where: { id: item.personnel_id },
          });

          if (!quanNhan) {
            errors.push(`Không tìm thấy quân nhân với ID: ${item.personnel_id}`);
            continue;
          }

          if (!item.nam) {
            errors.push(`Thành tích thiếu năm cho quân nhân ${quanNhan.id}`);
            continue;
          }

          if (!item.loai || !['NCKH', 'SKKH'].includes(item.loai)) {
            errors.push(
              `Thành tích có loại không hợp lệ cho quân nhân ${quanNhan.id}: ${item.loai}`
            );
            continue;
          }

          if (!item.mo_ta || item.mo_ta.trim() === '') {
            errors.push(`Thành tích thiếu mô tả cho quân nhân ${quanNhan.id}`);
            continue;
          }

          // Lấy số quyết định và file PDF cho thành tích
          // Ưu tiên lấy từ item, nếu không có thì có thể lấy từ decisions
          let soQuyetDinhThanhTich = item.so_quyet_dinh || null;
          let filePdfThanhTich = null;

          // Nếu có file PDF trong item, sử dụng nó
          if (item.file_quyet_dinh) {
            filePdfThanhTich = item.file_quyet_dinh;
          } else if (pdfPaths.file_pdf_nckh) {
            // Nếu có file PDF chung cho NCKH/SKKH
            filePdfThanhTich = pdfPaths.file_pdf_nckh;
          }

          // Create vào bảng ThanhTichKhoaHoc
          await prisma.thanhTichKhoaHoc.create({
            data: {
              quan_nhan_id: quanNhan.id,
              nam: parseInt(item.nam, 10),
              loai: item.loai,
              mo_ta: item.mo_ta.trim(),
              status: item.status || 'PENDING',
              so_quyet_dinh: soQuyetDinhThanhTich,
              file_quyet_dinh: filePdfThanhTich,
            },
          });

          importedThanhTich++;
          affectedPersonnelIds.add(quanNhan.id); // Track personnel bị ảnh hưởng
        } catch (error) {
          console.error(
            `❌ Lỗi import thành tích ID ${item.personnel_id || 'N/A'} hoặc CCCD ${
              item.cccd || 'N/A'
            }:`,
            error
          );
          errors.push(
            `Lỗi import thành tích ID ${item.personnel_id || 'N/A'} hoặc CCCD ${
              item.cccd || 'N/A'
            }: ${error.message}`
          );
        }
      }

      // ============================================
      // ĐỒNG BỘ QUYẾT ĐỊNH VÀO BẢNG QUYETDINH KHENTHUONG
      // ============================================
      const decisionsToSync = new Set();

      // Thu thập tất cả số quyết định từ danh hiệu
      for (const item of danhHieuData) {
        if (item.so_quyet_dinh) decisionsToSync.add(item.so_quyet_dinh);
        if (item.so_quyet_dinh_bkbqp) decisionsToSync.add(item.so_quyet_dinh_bkbqp);
        if (item.so_quyet_dinh_cstdtq) decisionsToSync.add(item.so_quyet_dinh_cstdtq);
      }

      // Thu thập số quyết định từ thành tích
      for (const item of thanhTichData) {
        if (item.so_quyet_dinh) decisionsToSync.add(item.so_quyet_dinh);
      }

      // Thu thập số quyết định cho từng loại đề xuất
      if (decisions.so_quyet_dinh_ca_nhan_hang_nam)
        decisionsToSync.add(decisions.so_quyet_dinh_ca_nhan_hang_nam);
      if (decisions.so_quyet_dinh_don_vi_hang_nam)
        decisionsToSync.add(decisions.so_quyet_dinh_don_vi_hang_nam);
      if (decisions.so_quyet_dinh_nien_han) decisionsToSync.add(decisions.so_quyet_dinh_nien_han);
      if (decisions.so_quyet_dinh_cong_hien) decisionsToSync.add(decisions.so_quyet_dinh_cong_hien);
      if (decisions.so_quyet_dinh_dot_xuat) decisionsToSync.add(decisions.so_quyet_dinh_dot_xuat);
      if (decisions.so_quyet_dinh_nckh) decisionsToSync.add(decisions.so_quyet_dinh_nckh);

      // Lấy thông tin người duyệt (admin hiện tại) một lần
      const adminInfo = await prisma.taiKhoan.findUnique({
        where: { id: adminId },
        include: {
          QuanNhan: {
            select: {
              ho_ten: true,
            },
          },
        },
      });
      const ngayKy = new Date(); // Ngày ký = ngày phê duyệt
      const nguoiKy = adminInfo?.QuanNhan?.ho_ten || adminInfo?.username || 'Chưa cập nhật';

      // Đồng bộ từng quyết định vào bảng FileQuyetDinh
      console.log(`📋 Đồng bộ ${decisionsToSync.size} quyết định vào bảng FileQuyetDinh`);
      for (const soQuyetDinh of decisionsToSync) {
        if (!soQuyetDinh) continue;

        try {
          // Kiểm tra xem đã tồn tại chưa
          const existing = await prisma.fileQuyetDinh.findUnique({
            where: { so_quyet_dinh: soQuyetDinh },
          });

          if (!existing) {
            // Tìm file PDF tương ứng dựa trên loại đề xuất
            let filePath = null;
            const loaiDeXuat = proposal.loai_de_xuat;

            // Map file PDF theo loại đề xuất
            // Ưu tiên kiểm tra số quyết định từ decisions (form upload)
            if (
              loaiDeXuat === 'CA_NHAN_HANG_NAM' &&
              decisions.so_quyet_dinh_ca_nhan_hang_nam === soQuyetDinh
            ) {
              filePath = pdfPaths.file_pdf_ca_nhan_hang_nam;
            } else if (
              loaiDeXuat === 'DON_VI_HANG_NAM' &&
              decisions.so_quyet_dinh_don_vi_hang_nam === soQuyetDinh
            ) {
              filePath = pdfPaths.file_pdf_don_vi_hang_nam;
            } else if (
              loaiDeXuat === 'NIEN_HAN' &&
              decisions.so_quyet_dinh_nien_han === soQuyetDinh
            ) {
              filePath = pdfPaths.file_pdf_nien_han;
            } else if (
              loaiDeXuat === 'CONG_HIEN' &&
              decisions.so_quyet_dinh_cong_hien === soQuyetDinh
            ) {
              filePath = pdfPaths.file_pdf_cong_hien;
            } else if (
              loaiDeXuat === 'DOT_XUAT' &&
              decisions.so_quyet_dinh_dot_xuat === soQuyetDinh
            ) {
              filePath = pdfPaths.file_pdf_dot_xuat;
            } else if (loaiDeXuat === 'NCKH') {
              // Cho NCKH, kiểm tra xem số quyết định có trong thanhTichData hoặc decisions không
              const matchingThanhTich = thanhTichData.find(t => t.so_quyet_dinh === soQuyetDinh);
              if (
                (matchingThanhTich || decisions.so_quyet_dinh_nckh === soQuyetDinh) &&
                pdfPaths.file_pdf_nckh
              ) {
                filePath = pdfPaths.file_pdf_nckh;
              }
            }

            // Nếu không tìm thấy file PDF từ decisions, thử tìm từ data_danh_hieu hoặc data_thanh_tich
            if (!filePath) {
              // Tìm trong danh hiệu
              const matchingDanhHieu = danhHieuData.find(
                d =>
                  d.so_quyet_dinh === soQuyetDinh ||
                  d.so_quyet_dinh_bkbqp === soQuyetDinh ||
                  d.so_quyet_dinh_cstdtq === soQuyetDinh
              );
              if (matchingDanhHieu) {
                // Lấy file từ item nếu có
                filePath =
                  matchingDanhHieu.file_quyet_dinh ||
                  matchingDanhHieu.file_quyet_dinh_bkbqp ||
                  matchingDanhHieu.file_quyet_dinh_cstdtq ||
                  null;
              }

              // Nếu vẫn chưa có, tìm trong thành tích
              if (!filePath) {
                const matchingThanhTich = thanhTichData.find(t => t.so_quyet_dinh === soQuyetDinh);
                if (matchingThanhTich && matchingThanhTich.file_quyet_dinh) {
                  filePath = matchingThanhTich.file_quyet_dinh;
                }
              }
            }

            // Xác định loại khen thưởng dựa trên loại đề xuất
            let loaiKhenThuong = proposal.loai_de_xuat || 'CA_NHAN_HANG_NAM';

            console.log(
              `✅ Tạo quyết định: ${soQuyetDinh}, loại: ${loaiKhenThuong}, file: ${
                filePath || 'null'
              }`
            );

            await prisma.fileQuyetDinh.create({
              data: {
                so_quyet_dinh: soQuyetDinh,
                nam: proposal.nam,
                ngay_ky: ngayKy,
                nguoi_ky: nguoiKy,
                file_path: filePath,
                loai_khen_thuong: loaiKhenThuong,
                ghi_chu: `Tự động đồng bộ từ đề xuất ${proposalId}`,
              },
            });
          } else {
            // Cập nhật file_path nếu có và chưa có
            if (!existing.file_path) {
              let filePath = null;
              const loaiDeXuat = proposal.loai_de_xuat;

              // Map file PDF theo loại đề xuất (giống logic tạo mới)
              if (
                loaiDeXuat === 'CA_NHAN_HANG_NAM' &&
                decisions.so_quyet_dinh_ca_nhan_hang_nam === soQuyetDinh
              ) {
                filePath = pdfPaths.file_pdf_ca_nhan_hang_nam;
              } else if (
                loaiDeXuat === 'DON_VI_HANG_NAM' &&
                decisions.so_quyet_dinh_don_vi_hang_nam === soQuyetDinh
              ) {
                filePath = pdfPaths.file_pdf_don_vi_hang_nam;
              } else if (
                loaiDeXuat === 'NIEN_HAN' &&
                decisions.so_quyet_dinh_nien_han === soQuyetDinh
              ) {
                filePath = pdfPaths.file_pdf_nien_han;
              } else if (
                loaiDeXuat === 'CONG_HIEN' &&
                decisions.so_quyet_dinh_cong_hien === soQuyetDinh
              ) {
                filePath = pdfPaths.file_pdf_cong_hien;
              } else if (
                loaiDeXuat === 'DOT_XUAT' &&
                decisions.so_quyet_dinh_dot_xuat === soQuyetDinh
              ) {
                filePath = pdfPaths.file_pdf_dot_xuat;
              } else if (loaiDeXuat === 'NCKH') {
                const matchingThanhTich = thanhTichData.find(t => t.so_quyet_dinh === soQuyetDinh);
                if (
                  (matchingThanhTich || decisions.so_quyet_dinh_nckh === soQuyetDinh) &&
                  pdfPaths.file_pdf_nckh
                ) {
                  filePath = pdfPaths.file_pdf_nckh;
                }
              }

              if (filePath) {
                await prisma.fileQuyetDinh.update({
                  where: { so_quyet_dinh: soQuyetDinh },
                  data: { file_path: filePath },
                });
              }
            }
          }
        } catch (error) {
          console.error(`⚠️ Lỗi khi đồng bộ quyết định ${soQuyetDinh}:`, error.message);
          // Không throw error để không làm gián đoạn quá trình approve
        }
      }

      // ============================================
      // KIỂM TRA LỖI TRƯỚC KHI CẬP NHẬT TRẠNG THÁI
      // ============================================
      // Nếu có lỗi khi import, không cho phép phê duyệt
      if (errors.length > 0) {
        throw new Error(
          `Không thể phê duyệt đề xuất do có ${errors.length} lỗi khi import:\n${errors.join('\n')}`
        );
      }

      // ============================================
      // CẬP NHẬT TRẠNG THÁI ĐỀ XUẤT
      // ============================================
      const updateData = {
        status: 'APPROVED',
        nguoi_duyet_id: adminId,
        ngay_duyet: new Date(),
        data_danh_hieu: danhHieuData, // Lưu lại dữ liệu đã chỉnh sửa
        data_thanh_tich: thanhTichData,
      };

      // Thêm ghi chú nếu có
      if (ghiChu) {
        updateData.ghi_chu = ghiChu;
      }

      await prisma.bangDeXuat.update({
        where: { id: proposalId },
        data: updateData,
      });

      // ============================================
      // TÍNH TOÁN LẠI HỒ SƠ HẰNG NĂM CHO CÁC QUÂN NHÂN BỊ ẢNH HƯỞNG
      // ============================================
      let recalculateSuccess = 0;
      let recalculateErrors = 0;

      for (const personnelId of affectedPersonnelIds) {
        try {
          await profileService.recalculateAnnualProfile(personnelId);
          recalculateSuccess++;
        } catch (recalcError) {
          recalculateErrors++;
          console.error(
            `❌ Lỗi tính toán hồ sơ cho quân nhân ID ${personnelId}:`,
            recalcError.message
          );
        }
      }

      return {
        message: 'Phê duyệt và import dữ liệu thành công',
        proposal: proposal, // Trả về proposal để gửi thông báo
        result: {
          don_vi: (proposal.DonViTrucThuoc || proposal.CoQuanDonVi)?.ten_don_vi || '-',
          nguoi_de_xuat: proposal.NguoiDeXuat.QuanNhan?.ho_ten || proposal.NguoiDeXuat.username,
          imported_danh_hieu: importedDanhHieu,
          imported_thanh_tich: importedThanhTich,
          total_danh_hieu: danhHieuData.length,
          total_thanh_tich: thanhTichData.length,
          errors: errors.length > 0 ? errors : null,
          recalculated_profiles: recalculateSuccess,
          recalculate_errors: recalculateErrors,
        },
      };
    } catch (error) {
      console.error('Approve proposal error:', error);
      throw error;
    }
  }

  /**
   * Lấy file PDF của đề xuất
   * @param {string} filename - Tên file PDF
   * @returns {Promise<Object>} - Đường dẫn file
   */
  async getPdfFile(filename) {
    try {
      const fs = require('fs').promises;

      // Thử tìm file trong storage/proposals (file đính kèm đề xuất)
      const storagePath = path.join(__dirname, '../../storage/proposals');
      let filePath = path.join(storagePath, filename);

      try {
        await fs.access(filePath);
        return {
          filePath,
          filename,
        };
      } catch {
        // Nếu không tìm thấy, thử tìm trong uploads/decisions (file quyết định)
        const decisionsPath = path.join(__dirname, '../../uploads/decisions');
        filePath = path.join(decisionsPath, filename);

        try {
          await fs.access(filePath);
          return {
            filePath,
            filename,
          };
        } catch {
          throw new Error('File PDF không tồn tại');
        }
      }
    } catch (error) {
      console.error('Get PDF file error:', error);
      throw error;
    }
  }

  /**
   * Từ chối đề xuất với lý do
   * @param {number} proposalId - ID của đề xuất
   * @param {string} lyDo - Lý do từ chối
   * @param {number} adminId - ID của Admin từ chối
   * @returns {Promise<Object>} - Kết quả từ chối
   */
  async rejectProposal(proposalId, lyDo, adminId) {
    try {
      // Lấy thông tin đề xuất
      const proposal = await prisma.bangDeXuat.findUnique({
        where: { id: proposalId },
        include: {
          CoQuanDonVi: true,
          DonViTrucThuoc: {
            include: {
              CoQuanDonVi: true,
            },
          },
          NguoiDeXuat: {
            include: { QuanNhan: true },
          },
        },
      });

      if (!proposal) {
        throw new Error('Không tìm thấy đề xuất');
      }

      if (proposal.status === 'APPROVED') {
        throw new Error('Không thể từ chối đề xuất đã được phê duyệt');
      }

      if (proposal.status === 'REJECTED') {
        throw new Error('Đề xuất này đã bị từ chối trước đó');
      }

      // Cập nhật trạng thái
      await prisma.bangDeXuat.update({
        where: { id: proposalId },
        data: {
          status: 'REJECTED',
          nguoi_duyet_id: adminId,
          ngay_duyet: new Date(),
          rejection_reason: lyDo,
        },
      });

      return {
        message: 'Từ chối đề xuất thành công',
        proposal: proposal, // Trả về proposal để gửi thông báo
        result: {
          don_vi: (proposal.DonViTrucThuoc || proposal.CoQuanDonVi)?.ten_don_vi || '-',
          nguoi_de_xuat: proposal.NguoiDeXuat.QuanNhan?.ho_ten || proposal.NguoiDeXuat.username,
          ly_do: lyDo,
        },
      };
    } catch (error) {
      console.error('Reject proposal error:', error);
      throw error;
    }
  }

  /**
   * Xuất file Excel đề xuất đã được gửi (để Admin download)
   * @param {number} proposalId - ID của đề xuất
   * @returns {Promise<Buffer>} - Buffer của file Excel
   */
  async downloadProposalExcel(proposalId) {
    try {
      const proposal = await prisma.bangDeXuat.findUnique({
        where: { id: proposalId },
        include: {
          CoQuanDonVi: true,
          DonViTrucThuoc: {
            include: {
              CoQuanDonVi: true,
            },
          },
          NguoiDeXuat: {
            include: { QuanNhan: true },
          },
        },
      });

      if (!proposal) {
        throw new Error('Không tìm thấy đề xuất');
      }

      const workbook = new ExcelJS.Workbook();

      // Tab 1: Danh hiệu
      const sheetDanhHieu = workbook.addWorksheet('DanhHieuHangNam');
      sheetDanhHieu.columns = [
        { header: 'CCCD', key: 'cccd', width: 15 },
        { header: 'Họ và Tên', key: 'ho_ten', width: 30 },
        { header: 'Năm', key: 'nam', width: 12 },
        { header: 'Danh hiệu', key: 'danh_hieu', width: 15 },
        { header: 'BKBQP', key: 'nhan_bkbqp', width: 10 },
        { header: 'Số QĐ BKBQP', key: 'so_quyet_dinh_bkbqp', width: 20 },
        { header: 'CSTĐTQ', key: 'nhan_cstdtq', width: 10 },
        { header: 'Số QĐ CSTĐTQ', key: 'so_quyet_dinh_cstdtq', width: 20 },
      ];

      // Style header
      sheetDanhHieu.getRow(1).font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      sheetDanhHieu.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' },
      };

      // Format cột CCCD thành Text
      sheetDanhHieu.getColumn(1).numFmt = '@';

      const danhHieuData = proposal.data_danh_hieu || [];
      danhHieuData.forEach(item => {
        sheetDanhHieu.addRow({
          cccd: item.cccd,
          ho_ten: item.ho_ten,
          nam: item.nam,
          danh_hieu: item.danh_hieu,
          nhan_bkbqp: item.nhan_bkbqp ? 'X' : '',
          so_quyet_dinh_bkbqp: item.so_quyet_dinh_bkbqp || '',
          nhan_cstdtq: item.nhan_cstdtq ? 'X' : '',
          so_quyet_dinh_cstdtq: item.so_quyet_dinh_cstdtq || '',
        });
      });

      // Tab 2: Thành tích
      const sheetThanhTich = workbook.addWorksheet('ThanhTichKhoaHoc');
      sheetThanhTich.columns = [
        { header: 'CCCD', key: 'cccd', width: 15 },
        { header: 'Họ và Tên', key: 'ho_ten', width: 30 },
        { header: 'Năm', key: 'nam', width: 12 },
        { header: 'Loại', key: 'loai', width: 10 },
        { header: 'Mô tả', key: 'mo_ta', width: 50 },
        { header: 'Trạng thái', key: 'status', width: 15 },
      ];

      sheetThanhTich.getRow(1).font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      sheetThanhTich.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFED7D31' },
      };

      // Format cột CCCD thành Text
      sheetThanhTich.getColumn(1).numFmt = '@';

      const thanhTichData = proposal.data_thanh_tich || [];
      thanhTichData.forEach(item => {
        sheetThanhTich.addRow({
          cccd: item.cccd,
          ho_ten: item.ho_ten,
          nam: item.nam,
          loai: item.loai,
          mo_ta: item.mo_ta,
          status: item.status,
        });
      });

      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      console.error('Download proposal Excel error:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả danh hiệu hằng năm (để Admin quản lý)
   * @param {Object} filters - Bộ lọc (don_vi_id, nam, danh_hieu)
   * @param {number} page - Trang
   * @param {number} limit - Số lượng mỗi trang
   * @returns {Promise<Object>} - Danh sách danh hiệu
   */
  async getAllAwards(filters = {}, page = 1, limit = 50) {
    try {
      const { don_vi_id, nam, danh_hieu } = filters;
      const skip = (page - 1) * limit;

      const where = {};
      if (nam) where.nam = parseInt(nam);
      if (danh_hieu) where.danh_hieu = danh_hieu;

      const [awards, total] = await Promise.all([
        prisma.danhHieuHangNam.findMany({
          where,
          include: {
            QuanNhan: {
              include: {
                CoQuanDonVi: true,
                DonViTrucThuoc: {
                  include: {
                    CoQuanDonVi: true,
                  },
                },
                ChucVu: true,
              },
            },
          },
          skip,
          take: parseInt(limit),
          orderBy: [{ nam: 'desc' }, { QuanNhan: { ho_ten: 'asc' } }],
        }),
        prisma.danhHieuHangNam.count({ where }),
      ]);

      // Lọc theo đơn vị nếu có
      let filteredAwards = awards;
      if (don_vi_id) {
        filteredAwards = awards.filter(
          a => (a.QuanNhan.co_quan_don_vi_id || a.QuanNhan.don_vi_truc_thuoc_id) === don_vi_id
        );
      }

      // Lấy thông tin NCKH cho từng quân nhân trong năm đó
      const awardsWithNCKH = await Promise.all(
        filteredAwards.map(async a => {
          // Lấy NCKH của quân nhân trong năm này
          const thanhTichList = await prisma.thanhTichKhoaHoc.findMany({
            where: {
              quan_nhan_id: a.QuanNhan.id,
              nam: a.nam,
            },
            select: {
              id: true,
              loai: true,
              mo_ta: true,
              status: true,
            },
          });

          return {
            id: a.id,
            cccd: a.QuanNhan.cccd,
            ho_ten: a.QuanNhan.ho_ten,
            don_vi: (a.QuanNhan.DonViTrucThuoc || a.QuanNhan.CoQuanDonVi)?.ten_don_vi || '-',
            chuc_vu: a.QuanNhan.ChucVu.ten_chuc_vu,
            nam: a.nam,
            danh_hieu: a.danh_hieu,
            nhan_bkbqp: a.nhan_bkbqp,
            so_quyet_dinh_bkbqp: a.so_quyet_dinh_bkbqp,
            nhan_cstdtq: a.nhan_cstdtq,
            so_quyet_dinh_cstdtq: a.so_quyet_dinh_cstdtq,
            thanh_tich_khoa_hoc: thanhTichList, // Danh sách NCKH
          };
        })
      );

      return {
        awards: awardsWithNCKH,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Get all awards error:', error);
      throw error;
    }
  }

  /**
   * Xuất file Excel tổng hợp tất cả khen thưởng
   * @param {Object} filters - Bộ lọc
   * @returns {Promise<Buffer>} - Buffer của file Excel
   */
  async exportAllAwardsExcel(filters = {}) {
    try {
      const { don_vi_id, nam, danh_hieu } = filters;
      const where = {};
      if (nam) where.nam = parseInt(nam);
      if (danh_hieu) where.danh_hieu = danh_hieu;

      const awards = await prisma.danhHieuHangNam.findMany({
        where,
        include: {
          QuanNhan: {
            include: {
              CoQuanDonVi: true,
              DonViTrucThuoc: {
                include: {
                  CoQuanDonVi: true,
                },
              },
              ChucVu: true,
            },
          },
        },
        orderBy: [{ nam: 'desc' }, { QuanNhan: { ho_ten: 'asc' } }],
      });

      let filteredAwards = awards;
      if (don_vi_id) {
        filteredAwards = awards.filter(a => a.QuanNhan.don_vi_id === don_vi_id);
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Danh Sách Khen Thưởng');

      sheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'CCCD', key: 'cccd', width: 15 },
        { header: 'Họ và Tên', key: 'ho_ten', width: 30 },
        { header: 'Đơn Vị', key: 'don_vi', width: 25 },
        { header: 'Chức Vụ', key: 'chuc_vu', width: 25 },
        { header: 'Năm', key: 'nam', width: 10 },
        { header: 'Danh Hiệu', key: 'danh_hieu', width: 15 },
        { header: 'BKBQP', key: 'bkbqp', width: 10 },
        { header: 'Số QĐ BKBQP', key: 'so_qd_bkbqp', width: 20 },
        { header: 'CSTĐTQ', key: 'cstdtq', width: 10 },
        { header: 'Số QĐ CSTĐTQ', key: 'so_qd_cstdtq', width: 20 },
      ];

      // Style header
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // Format cột CCCD thành Text
      sheet.getColumn(2).numFmt = '@'; // CCCD là cột thứ 2 (STT là cột 1)

      filteredAwards.forEach((award, index) => {
        sheet.addRow({
          stt: index + 1,
          cccd: award.QuanNhan.cccd,
          ho_ten: award.QuanNhan.ho_ten,
          don_vi: award.QuanNhan.DonVi.ten_don_vi,
          chuc_vu: award.QuanNhan.ChucVu.ten_chuc_vu,
          nam: award.nam,
          danh_hieu: award.danh_hieu || '',
          bkbqp: award.nhan_bkbqp ? 'X' : '',
          so_qd_bkbqp: award.so_quyet_dinh_bkbqp || '',
          cstdtq: award.nhan_cstdtq ? 'X' : '',
          so_qd_cstdtq: award.so_quyet_dinh_cstdtq || '',
        });
      });

      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      console.error('Export all awards Excel error:', error);
      throw error;
    }
  }

  /**
   * Xuất file mẫu Excel để import khen thưởng
   * @returns {Promise<Buffer>} - Buffer của file Excel mẫu
   */
  async exportAwardsTemplate() {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('KhenThuong');

      sheet.columns = [
        { header: 'CCCD (Bắt buộc)', key: 'cccd', width: 15 },
        { header: 'Năm (Bắt buộc)', key: 'nam', width: 12 },
        { header: 'Danh Hiệu (CSTDCS/CSTT)', key: 'danh_hieu', width: 20 },
        { header: 'BKBQP (Đánh X)', key: 'nhan_bkbqp', width: 15 },
        { header: 'Số QĐ BKBQP', key: 'so_quyet_dinh_bkbqp', width: 20 },
        { header: 'CSTĐTQ (Đánh X)', key: 'nhan_cstdtq', width: 15 },
        { header: 'Số QĐ CSTĐTQ', key: 'so_quyet_dinh_cstdtq', width: 20 },
      ];

      // Style header
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' },
      };
      sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // Format cột CCCD thành Text (để giữ số 0 đầu tiên)
      sheet.getColumn(1).numFmt = '@';

      // Thêm 1 row mẫu
      sheet.addRow({
        cccd: '001234567890',
        nam: 2024,
        danh_hieu: 'CSTDCS',
        nhan_bkbqp: 'X',
        so_quyet_dinh_bkbqp: '123/QĐ-BQP',
        nhan_cstdtq: '',
        so_quyet_dinh_cstdtq: '',
      });

      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      console.error('Export awards template error:', error);
      throw error;
    }
  }

  /**
   * Import khen thưởng từ file Excel
   * @param {Buffer} excelBuffer - Buffer của file Excel
   * @returns {Promise<Object>} - Kết quả import
   */
  async importAwards(excelBuffer, adminId) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(excelBuffer);

      const sheet = workbook.getWorksheet('KhenThuong');
      if (!sheet) {
        throw new Error('Không tìm thấy sheet "KhenThuong" trong file Excel');
      }

      const awards = [];
      const errors = [];
      const importedUnitsMap = new Map(); // Track các đơn vị đã import

      // Đọc từ row 2 (bỏ qua header)
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const cccd = this.parseCCCD(row.getCell(1).value);
        const nam = parseInt(row.getCell(2).value);
        const danh_hieu = row.getCell(3).value?.toString().trim() || null;
        const nhan_bkbqp = row.getCell(4).value?.toString().toUpperCase() === 'X';
        const so_quyet_dinh_bkbqp = row.getCell(5).value?.toString().trim() || null;
        const nhan_cstdtq = row.getCell(6).value?.toString().toUpperCase() === 'X';
        const so_quyet_dinh_cstdtq = row.getCell(7).value?.toString().trim() || null;

        // Validate
        if (!cccd || !nam) {
          errors.push(`Row ${rowNumber}: CCCD và Năm là bắt buộc`);
          return;
        }

        awards.push({
          cccd,
          nam,
          danh_hieu,
          nhan_bkbqp,
          so_quyet_dinh_bkbqp,
          nhan_cstdtq,
          so_quyet_dinh_cstdtq,
        });
      });

      if (errors.length > 0) {
        throw new Error(`Lỗi validate dữ liệu: ${errors.join(', ')}`);
      }

      // Import vào database với validation
      let imported = 0;
      const importErrors = [];
      const importWarnings = [];
      const affectedPersonnelIds = new Set(); // Track quân nhân bị ảnh hưởng

      for (const award of awards) {
        try {
          // Tìm quân nhân theo CCCD
          const quanNhan = await prisma.quanNhan.findUnique({
            where: { cccd: award.cccd },
            include: {
              CoQuanDonVi: true,
              DonViTrucThuoc: {
                include: {
                  CoQuanDonVi: true,
                },
              },
              DanhHieuHangNam: {
                orderBy: { nam: 'asc' },
              },
              ThanhTichKhoaHoc: {
                where: { status: 'APPROVED' },
              },
            },
          });

          if (!quanNhan) {
            importErrors.push(`CCCD ${award.cccd}: Không tìm thấy quân nhân`);
            continue;
          }

          // ============================================
          // VALIDATION LOGIC NGHIỆP VỤ
          // ============================================
          const cstdcsLienTuc = this.calculateContinuousCSTDCS(quanNhan.DanhHieuHangNam, award.nam);
          const nckhCount = quanNhan.ThanhTichKhoaHoc.length;

          // Kiểm tra BKBQP
          if (award.nhan_bkbqp && cstdcsLienTuc < 5) {
            importWarnings.push(
              `CCCD ${
                award.cccd
              }: Đề xuất BKBQP nhưng chỉ có ${cstdcsLienTuc}/5 năm CSTDCS liên tục. Thiếu ${
                5 - cstdcsLienTuc
              } năm.`
            );
          }

          // Kiểm tra CSTDTQ
          if (award.nhan_cstdtq) {
            if (cstdcsLienTuc < 10) {
              importWarnings.push(
                `CCCD ${
                  award.cccd
                }: Đề xuất CSTDTQ nhưng chỉ có ${cstdcsLienTuc}/10 năm CSTDCS liên tục. Thiếu ${
                  10 - cstdcsLienTuc
                } năm.`
              );
            } else if (nckhCount === 0) {
              importWarnings.push(
                `CCCD ${award.cccd}: Đề xuất CSTDTQ nhưng chưa có ĐTKH/SKKH được duyệt.`
              );
            }
          }

          // Upsert vào bảng DanhHieuHangNam
          await prisma.danhHieuHangNam.upsert({
            where: {
              quan_nhan_id_nam: {
                quan_nhan_id: quanNhan.id,
                nam: award.nam,
              },
            },
            update: {
              danh_hieu: award.danh_hieu,
              nhan_bkbqp: award.nhan_bkbqp,
              so_quyet_dinh_bkbqp: award.so_quyet_dinh_bkbqp,
              nhan_cstdtq: award.nhan_cstdtq,
              so_quyet_dinh_cstdtq: award.so_quyet_dinh_cstdtq,
            },
            create: {
              quan_nhan_id: quanNhan.id,
              nam: award.nam,
              danh_hieu: award.danh_hieu,
              nhan_bkbqp: award.nhan_bkbqp,
              so_quyet_dinh_bkbqp: award.so_quyet_dinh_bkbqp,
              nhan_cstdtq: award.nhan_cstdtq,
              so_quyet_dinh_cstdtq: award.so_quyet_dinh_cstdtq,
            },
          });

          // Track đơn vị đã import để gửi thông báo
          const unitKey = `${quanNhan.don_vi_id}_${award.nam}`;
          if (!importedUnitsMap.has(unitKey)) {
            importedUnitsMap.set(unitKey, {
              don_vi_id: quanNhan.don_vi_id,
              don_vi_name: quanNhan.DonVi.ten_don_vi,
              nam: award.nam,
              award_type: 'Danh hiệu',
            });
          }

          imported++;
          affectedPersonnelIds.add(quanNhan.id); // Track personnel bị ảnh hưởng
        } catch (error) {
          importErrors.push(`CCCD ${award.cccd}: ${error.message}`);
        }
      }

      // ============================================
      // TÍNH TOÁN LẠI HỒ SƠ HẰNG NĂM CHO CÁC QUÂN NHÂN BỊ ẢNH HƯỞNG
      // ============================================
      let recalculateSuccess = 0;
      let recalculateErrors = 0;

      for (const personnelId of affectedPersonnelIds) {
        try {
          await profileService.recalculateAnnualProfile(personnelId);
          recalculateSuccess++;
        } catch (recalcError) {
          recalculateErrors++;
          console.error(
            `❌ Lỗi tính toán hồ sơ cho quân nhân ID ${personnelId}:`,
            recalcError.message
          );
        }
      }

      return {
        message:
          importWarnings.length > 0
            ? `Import thành công ${imported} bản ghi nhưng có ${importWarnings.length} cảnh báo về điều kiện khen thưởng.`
            : 'Import khen thưởng thành công',
        importedUnits: Array.from(importedUnitsMap.values()), // Danh sách đơn vị để gửi thông báo
        result: {
          total: awards.length,
          imported,
          failed: awards.length - imported,
          errors: importErrors.length > 0 ? importErrors : null,
          warnings: importWarnings.length > 0 ? importWarnings : null,
          recalculated_profiles: recalculateSuccess,
          recalculate_errors: recalculateErrors,
        },
      };
    } catch (error) {
      console.error('Import awards error:', error);
      throw error;
    }
  }

  /**
   * Xóa đề xuất (chỉ Manager có thể xóa đề xuất của chính mình, và chỉ khi status = PENDING)
   * @param {number} proposalId - ID của đề xuất
   * @param {number} userId - ID của tài khoản
   * @param {string} userRole - Role của user
   * @returns {Promise<Object>} - Kết quả xóa
   */
  async deleteProposal(proposalId, userId, userRole) {
    try {
      const proposal = await prisma.bangDeXuat.findUnique({
        where: { id: proposalId },
        include: {
          CoQuanDonVi: true,
          DonViTrucThuoc: {
            include: {
              CoQuanDonVi: true,
            },
          },
          NguoiDeXuat: {
            include: {
              QuanNhan: true,
            },
          },
        },
      });

      if (!proposal) {
        throw new Error('Không tìm thấy đề xuất');
      }

      // Kiểm tra quyền: Manager chỉ có thể xóa đề xuất của chính mình
      if (userRole === 'MANAGER') {
        if (proposal.nguoi_de_xuat_id !== userId) {
          throw new Error('Bạn chỉ có thể xóa đề xuất của chính mình');
        }
        // Manager chỉ có thể xóa đề xuất chưa được duyệt
        if (proposal.status !== 'PENDING') {
          throw new Error('Chỉ có thể xóa đề xuất đang chờ duyệt (PENDING)');
        }
      }
      // ADMIN có thể xóa bất kỳ đề xuất nào

      // Xóa file PDF nếu có
      if (proposal.ten_file_pdf) {
        try {
          const fs = require('fs').promises;
          const path = require('path');
          const filePath = path.join(__dirname, '../../storage/proposals', proposal.ten_file_pdf);
          await fs.unlink(filePath);
        } catch (fileError) {
          console.warn(`[deleteProposal] Không thể xóa file PDF: ${fileError.message}`);
          // Không throw error, tiếp tục xóa proposal
        }
      }

      // Xóa proposal
      await prisma.bangDeXuat.delete({
        where: { id: proposalId },
      });

      return {
        message: 'Đã xóa đề xuất thành công',
        proposal: {
          id: proposal.id,
          don_vi: (proposal.DonViTrucThuoc || proposal.CoQuanDonVi)?.ten_don_vi || '-',
          status: proposal.status,
        },
      };
    } catch (error) {
      console.error('Delete proposal error:', error);
      throw error;
    }
  }
}

module.exports = new ProposalService();
