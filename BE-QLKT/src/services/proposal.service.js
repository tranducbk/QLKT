const { prisma } = require('../models');
const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const profileService = require('./profile.service');

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
            DonVi: true,
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
              DonVi: true,
            },
          },
        },
      });

      if (!user || !user.QuanNhan) {
        throw new Error('Không tìm thấy thông tin quân nhân của tài khoản này');
      }

      const donViId = user.QuanNhan.don_vi_id;

      // Lấy danh sách quân nhân thuộc đơn vị
      const quanNhanList = await prisma.quanNhan.findMany({
        where: { don_vi_id: donViId },
        include: {
          DonVi: true,
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
      sheetQuanNhan.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheetQuanNhan.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      sheetQuanNhan.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // Format cột CCCD thành Text (để giữ số 0 đầu tiên)
      sheetQuanNhan.getColumn(1).numFmt = '@';

      // Thêm dữ liệu quân nhân
      quanNhanList.forEach(qn => {
        sheetQuanNhan.addRow({
          cccd: qn.cccd,
          ho_ten: qn.ho_ten,
          ma_don_vi: qn.DonVi.ma_don_vi,
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
      sheetDanhHieu.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheetDanhHieu.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' },
      };
      sheetDanhHieu.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

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
        { header: 'Loại (NCKH/SKKH)', key: 'loai', width: 18 },
        { header: 'Mô tả (Bắt buộc)', key: 'mo_ta', width: 40 },
        { header: 'Trạng thái (APPROVED/PENDING)', key: 'status', width: 25 },
      ];

      // Style cho header
      sheetThanhTich.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheetThanhTich.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC000' },
      };
      sheetThanhTich.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

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
    sheetQuanNhan.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
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
    sheetNienHan.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
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
   * Đọc file Excel đề xuất, lưu PDF, và lưu vào CSDL
   * @param {Buffer} excelBuffer - Buffer của file Excel upload
   * @param {Object} pdfFile - File PDF upload (multer file object)
   * @param {string} soQuyetDinh - Số quyết định gốc
   * @param {number} userId - ID của tài khoản Manager
   * @param {string} type - Loại đề xuất: 'HANG_NAM' hoặc 'NIEN_HAN'
   * @returns {Promise<Object>} - Kết quả lưu đề xuất
   */
  async submitProposal(excelBuffer, pdfFile, soQuyetDinh, userId, type = 'HANG_NAM') {
    try {
      // Lấy thông tin user và đơn vị
      const user = await prisma.taiKhoan.findUnique({
        where: { id: userId },
        include: {
          QuanNhan: true,
        },
      });

      if (!user || !user.QuanNhan) {
        throw new Error('Không tìm thấy thông tin quân nhân của tài khoản này');
      }

      const donViId = user.QuanNhan.don_vi_id;

      // ============================================
      // LƯU FILE PDF VÀO SERVER
      // ============================================
      let savedPdfFilename = null;

      if (pdfFile && pdfFile.buffer) {
        // Tạo tên file unique: timestamp_uuid_originalname
        const timestamp = Date.now();
        const uniqueId = uuidv4().slice(0, 8);
        const fileExtension = path.extname(pdfFile.originalname);
        const baseFilename = path.basename(pdfFile.originalname, fileExtension);
        savedPdfFilename = `${timestamp}_${uniqueId}_${baseFilename}${fileExtension}`;

        // Đường dẫn lưu file
        const storagePath = path.join(__dirname, '../../storage/proposals');
        const filePath = path.join(storagePath, savedPdfFilename);

        // Đảm bảo thư mục tồn tại
        await fs.mkdir(storagePath, { recursive: true });

        // Lưu file
        await fs.writeFile(filePath, pdfFile.buffer);
      }

      // ============================================
      // ĐỌC FILE EXCEL
      // ============================================
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(excelBuffer);

      let danhHieuData = [];
      let thanhTichData = [];
      let nienHanData = [];

      if (type === 'HANG_NAM') {
        // Parse danh hiệu hàng năm
        const sheetDanhHieu = workbook.getWorksheet(SHEET_NAMES.DANH_HIEU_HANG_NAM);
        if (!sheetDanhHieu) {
          throw new Error(
            `Không tìm thấy sheet "${SHEET_NAMES.DANH_HIEU_HANG_NAM}" trong file Excel`
          );
        }
        danhHieuData = this.parseDanhHieuSheet(sheetDanhHieu);

        // Parse thành tích khoa học
        const sheetThanhTich = workbook.getWorksheet(SHEET_NAMES.THANH_TICH_KHOA_HOC);
        if (!sheetThanhTich) {
          throw new Error(
            `Không tìm thấy sheet "${SHEET_NAMES.THANH_TICH_KHOA_HOC}" trong file Excel`
          );
        }
        thanhTichData = this.parseThanhTichSheet(sheetThanhTich);
      } else if (type === 'NIEN_HAN') {
        const sheetNienHan = workbook.getWorksheet(SHEET_NAMES.NIEN_HAN);
        if (!sheetNienHan) {
          throw new Error('Không tìm thấy sheet "NienHan" trong file Excel');
        }

        sheetNienHan.eachRow((row, rowNumber) => {
          // Bỏ qua header (row 1) và row mẫu (row 2)
          if (rowNumber <= 2) return;

          const cccd = this.parseCCCD(row.getCell(1).value);
          const ho_ten = row.getCell(2).value?.toString().trim();

          // Bỏ qua row trống
          if (!cccd) return;

          const hccsvv_hang_ba = row.getCell(3).value?.toString().toUpperCase() === 'X';
          const hccsvv_hang_nhi = row.getCell(4).value?.toString().toUpperCase() === 'X';
          const hccsvv_hang_nhat = row.getCell(5).value?.toString().toUpperCase() === 'X';
          const hcbvtq_hang_ba = row.getCell(6).value?.toString().toUpperCase() === 'X';
          const hcbvtq_hang_nhi = row.getCell(7).value?.toString().toUpperCase() === 'X';
          const hcbvtq_hang_nhat = row.getCell(8).value?.toString().toUpperCase() === 'X';

          nienHanData.push({
            cccd,
            ho_ten,
            hccsvv_hang_ba,
            hccsvv_hang_nhi,
            hccsvv_hang_nhat,
            hcbvtq_hang_ba,
            hcbvtq_hang_nhi,
            hcbvtq_hang_nhat,
          });
        });
      }

      // ============================================
      // VALIDATION LOGIC NGHIỆP VỤ
      // ============================================
      const warnings = [];

      if (type === 'HANG_NAM') {
        for (const item of danhHieuData) {
          try {
            const quanNhan = await prisma.quanNhan.findUnique({
              where: { cccd: item.cccd },
              include: {
                DanhHieuHangNam: {
                  orderBy: { nam: 'asc' },
                },
                ThanhTichKhoaHoc: {
                  where: { status: 'APPROVED' },
                },
              },
            });

            if (quanNhan) {
              // Tính số năm CSTDCS liên tục
              const cstdcsLienTuc = this.calculateContinuousCSTDCS(
                quanNhan.DanhHieuHangNam,
                item.nam
              );
              const nckhCount = quanNhan.ThanhTichKhoaHoc.length;

              // Kiểm tra BKBQP
              if (item.nhan_bkbqp && cstdcsLienTuc < 5) {
                warnings.push({
                  cccd: item.cccd,
                  ho_ten: item.ho_ten,
                  nam: item.nam,
                  warning: `Đề xuất BKBQP nhưng chỉ có ${cstdcsLienTuc}/5 năm CSTDCS liên tục. Thiếu ${
                    5 - cstdcsLienTuc
                  } năm.`,
                });
              }

              // Kiểm tra CSTDTQ
              if (item.nhan_cstdtq) {
                if (cstdcsLienTuc < 10) {
                  warnings.push({
                    cccd: item.cccd,
                    ho_ten: item.ho_ten,
                    nam: item.nam,
                    warning: `Đề xuất CSTDTQ nhưng chỉ có ${cstdcsLienTuc}/10 năm CSTDCS liên tục. Thiếu ${
                      10 - cstdcsLienTuc
                    } năm.`,
                  });
                } else if (nckhCount === 0) {
                  warnings.push({
                    cccd: item.cccd,
                    ho_ten: item.ho_ten,
                    nam: item.nam,
                    warning: `Đề xuất CSTDTQ nhưng chưa có NCKH/SKKH được duyệt.`,
                  });
                }
              }
            }
          } catch (err) {
            console.error(`Warning validation error for CCCD ${item.cccd}:`, err.message);
          }
        }
      }

      // ============================================
      // VALIDATION: Kiểm tra dữ liệu sau khi parse
      // ============================================
      if (type === 'HANG_NAM') {
        // Chỉ cảnh báo nếu cả hai đều rỗng, không throw error
        // Vì có thể Manager chỉ muốn submit danh hiệu hoặc chỉ thành tích
        if (danhHieuData.length === 0 && thanhTichData.length === 0) {
          console.warn(
            '[submitProposal] WARNING: Không có dữ liệu nào được parse từ Excel. Cả danh hiệu và thành tích đều rỗng.'
          );
          // Vẫn cho phép submit, nhưng sẽ có warning trong ghi_chu
        } else {
          if (danhHieuData.length === 0) {
            console.warn(
              '[submitProposal] WARNING: Không có dữ liệu danh hiệu nào được parse từ Excel'
            );
          }
          if (thanhTichData.length === 0) {
            console.warn(
              '[submitProposal] WARNING: Không có dữ liệu thành tích nào được parse từ Excel'
            );
          }
        }
      } else if (type === 'NIEN_HAN') {
        if (nienHanData.length === 0) {
          throw new Error(
            'File Excel không có dữ liệu hợp lệ. Vui lòng kiểm tra:\n' +
              '- Sheet "NienHan" có dữ liệu từ row 3 trở đi\n' +
              '- Đảm bảo cột CCCD đã được điền đầy đủ'
          );
        }
      }

      // ============================================
      // LƯU VÀO CSDL
      // ============================================
      // Đảm bảo dữ liệu là array hợp lệ (không phải null/undefined)
      const dataDanhHieu = type === 'HANG_NAM' && Array.isArray(danhHieuData) ? danhHieuData : null;
      const dataThanhTich =
        type === 'HANG_NAM' && Array.isArray(thanhTichData) ? thanhTichData : null;
      const dataNienHan = type === 'NIEN_HAN' && Array.isArray(nienHanData) ? nienHanData : null;

      const proposal = await prisma.bangDeXuat.create({
        data: {
          don_vi_id: donViId,
          nguoi_de_xuat_id: userId,
          loai_de_xuat: type,
          status: 'PENDING',
          data_danh_hieu: dataDanhHieu,
          data_thanh_tich: dataThanhTich,
          data_nien_han: dataNienHan,
          so_quyet_dinh_goc: soQuyetDinh || null,
          ten_file_pdf: savedPdfFilename,
          ghi_chu:
            warnings.length > 0
              ? `⚠️ Có ${warnings.length} cảnh báo về điều kiện khen thưởng. Vui lòng kiểm tra kỹ.`
              : null,
        },
        include: {
          DonVi: true,
          NguoiDeXuat: {
            include: {
              QuanNhan: true,
            },
          },
        },
      });

      return {
        message:
          warnings.length > 0
            ? `Đã gửi đề xuất thành công nhưng có ${warnings.length} cảnh báo về điều kiện khen thưởng.`
            : 'Đã gửi đề xuất khen thưởng thành công',
        proposal: {
          id: proposal.id,
          loai_de_xuat: proposal.loai_de_xuat,
          don_vi: proposal.DonVi.ten_don_vi,
          nguoi_de_xuat: proposal.NguoiDeXuat.QuanNhan.ho_ten,
          status: proposal.status,
          so_danh_hieu: danhHieuData.length,
          so_thanh_tich: thanhTichData.length,
          so_nien_han: nienHanData.length,
          createdAt: proposal.createdAt,
        },
        warnings: warnings.length > 0 ? warnings : null,
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
          include: { QuanNhan: true },
        });

        if (!user || !user.QuanNhan) {
          throw new Error('Không tìm thấy thông tin quân nhân');
        }

        whereCondition.don_vi_id = user.QuanNhan.don_vi_id;
      }
      // ADMIN xem tất cả

      // Lấy danh sách và tổng số
      const [proposals, total] = await Promise.all([
        prisma.bangDeXuat.findMany({
          where: whereCondition,
          skip,
          take,
          include: {
            DonVi: true,
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
          don_vi: p.DonVi.ten_don_vi,
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
        where: { id: parseInt(proposalId) },
        include: {
          DonVi: true,
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

      // Kiểm tra quyền truy cập
      if (userRole === 'MANAGER') {
        const user = await prisma.taiKhoan.findUnique({
          where: { id: userId },
          include: { QuanNhan: true },
        });

        if (user.QuanNhan.don_vi_id !== proposal.don_vi_id) {
          throw new Error('Bạn không có quyền xem đề xuất này');
        }
      }

      // Đảm bảo data_danh_hieu và data_thanh_tich luôn là array
      const dataDanhHieu = Array.isArray(proposal.data_danh_hieu)
        ? proposal.data_danh_hieu
        : proposal.data_danh_hieu
        ? [proposal.data_danh_hieu]
        : [];

      const dataThanhTich = Array.isArray(proposal.data_thanh_tich)
        ? proposal.data_thanh_tich
        : proposal.data_thanh_tich
        ? [proposal.data_thanh_tich]
        : [];

      return {
        id: proposal.id,
        don_vi: {
          id: proposal.DonVi.id,
          ma_don_vi: proposal.DonVi.ma_don_vi,
          ten_don_vi: proposal.DonVi.ten_don_vi,
        },
        nguoi_de_xuat: {
          id: proposal.NguoiDeXuat.id,
          username: proposal.NguoiDeXuat.username,
          ho_ten: proposal.NguoiDeXuat.QuanNhan?.ho_ten,
        },
        status: proposal.status,
        data_danh_hieu: dataDanhHieu,
        data_thanh_tich: dataThanhTich,
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
        ten_file_pdf: proposal.ten_file_pdf,
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
        where: { id: parseInt(proposalId) },
        include: {
          DonVi: true,
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
      // ============================================
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'decisions');
      await fs.mkdir(uploadsDir, { recursive: true });

      const pdfPaths = {};

      // Lưu file PDF cho từng loại danh hiệu
      for (const [key, file] of Object.entries(pdfFiles)) {
        if (file && file.buffer) {
          const filename = `${Date.now()}_${key}_${file.originalname}`;
          const filepath = path.join(uploadsDir, filename);
          await fs.writeFile(filepath, file.buffer);
          pdfPaths[key] = `uploads/decisions/${filename}`;
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
      for (const item of danhHieuData) {
        try {
          // Tìm quân nhân theo CCCD
          const quanNhan = await prisma.quanNhan.findUnique({
            where: { cccd: item.cccd },
          });

          if (!quanNhan) {
            errors.push(`Không tìm thấy quân nhân CCCD: ${item.cccd}`);
            continue;
          }

          // Tự động gán số quyết định và file PDF dựa trên danh_hieu
          const danhHieuDecision = decisionMapping[item.danh_hieu] || {};
          const soQuyetDinhDanhHieu = danhHieuDecision.so_quyet_dinh;
          const filePdfDanhHieu = danhHieuDecision.file_pdf;

          // Quyết định BKBQP và CSTDTQ (từ item hoặc từ special mapping)
          let soQuyetDinhBKBQP = item.so_quyet_dinh_bkbqp;
          let filePdfBKBQP = null;
          if (item.nhan_bkbqp && specialDecisionMapping.BKBQP) {
            soQuyetDinhBKBQP = soQuyetDinhBKBQP || specialDecisionMapping.BKBQP.so_quyet_dinh;
            filePdfBKBQP = specialDecisionMapping.BKBQP.file_pdf;
          }

          let soQuyetDinhCSTDTQ = item.so_quyet_dinh_cstdtq;
          let filePdfCSTDTQ = null;
          if (item.nhan_cstdtq && specialDecisionMapping.CSTDTQ) {
            soQuyetDinhCSTDTQ = soQuyetDinhCSTDTQ || specialDecisionMapping.CSTDTQ.so_quyet_dinh;
            filePdfCSTDTQ = specialDecisionMapping.CSTDTQ.file_pdf;
          }

          // Upsert vào bảng DanhHieuHangNam
          await prisma.danhHieuHangNam.upsert({
            where: {
              quan_nhan_id_nam: {
                quan_nhan_id: quanNhan.id,
                nam: item.nam,
              },
            },
            update: {
              danh_hieu: item.danh_hieu,
              so_quyet_dinh: soQuyetDinhDanhHieu,
              file_quyet_dinh: filePdfDanhHieu,
              nhan_bkbqp: item.nhan_bkbqp || false,
              so_quyet_dinh_bkbqp: soQuyetDinhBKBQP,
              file_quyet_dinh_bkbqp: filePdfBKBQP,
              nhan_cstdtq: item.nhan_cstdtq || false,
              so_quyet_dinh_cstdtq: soQuyetDinhCSTDTQ,
              file_quyet_dinh_cstdtq: filePdfCSTDTQ,
            },
            create: {
              quan_nhan_id: quanNhan.id,
              nam: item.nam,
              danh_hieu: item.danh_hieu,
              so_quyet_dinh: soQuyetDinhDanhHieu,
              file_quyet_dinh: filePdfDanhHieu,
              nhan_bkbqp: item.nhan_bkbqp || false,
              so_quyet_dinh_bkbqp: soQuyetDinhBKBQP,
              file_quyet_dinh_bkbqp: filePdfBKBQP,
              nhan_cstdtq: item.nhan_cstdtq || false,
              so_quyet_dinh_cstdtq: soQuyetDinhCSTDTQ,
              file_quyet_dinh_cstdtq: filePdfCSTDTQ,
            },
          });

          importedDanhHieu++;
          affectedPersonnelIds.add(quanNhan.id); // Track personnel bị ảnh hưởng
        } catch (error) {
          errors.push(`Lỗi import danh hiệu CCCD ${item.cccd}: ${error.message}`);
        }
      }

      // ============================================
      // IMPORT THÀNH TÍCH KHOA HỌC
      // ============================================
      for (const item of thanhTichData) {
        try {
          // Tìm quân nhân theo CCCD
          const quanNhan = await prisma.quanNhan.findUnique({
            where: { cccd: item.cccd },
          });

          if (!quanNhan) {
            errors.push(`Không tìm thấy quân nhân CCCD: ${item.cccd}`);
            continue;
          }

          // Create vào bảng ThanhTichKhoaHoc
          await prisma.thanhTichKhoaHoc.create({
            data: {
              quan_nhan_id: quanNhan.id,
              nam: item.nam,
              loai: item.loai,
              mo_ta: item.mo_ta,
              status: item.status || 'PENDING',
            },
          });

          importedThanhTich++;
          affectedPersonnelIds.add(quanNhan.id); // Track personnel bị ảnh hưởng
        } catch (error) {
          errors.push(`Lỗi import thành tích CCCD ${item.cccd}: ${error.message}`);
        }
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
        where: { id: parseInt(proposalId) },
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
          don_vi: proposal.DonVi.ten_don_vi,
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
      const storagePath = path.join(__dirname, '../../storage/proposals');
      const filePath = path.join(storagePath, filename);

      // Kiểm tra file có tồn tại không
      try {
        await fs.access(filePath);
      } catch {
        throw new Error('File PDF không tồn tại');
      }

      return {
        filePath,
        filename,
      };
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
        where: { id: parseInt(proposalId) },
        include: {
          DonVi: true,
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
        where: { id: parseInt(proposalId) },
        data: {
          status: 'REJECTED',
          nguoi_duyet_id: adminId,
          ngay_duyet: new Date(),
          ghi_chu: lyDo,
        },
      });

      return {
        message: 'Từ chối đề xuất thành công',
        proposal: proposal, // Trả về proposal để gửi thông báo
        result: {
          don_vi: proposal.DonVi.ten_don_vi,
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
        where: { id: parseInt(proposalId) },
        include: {
          DonVi: true,
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
      sheetDanhHieu.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
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

      sheetThanhTich.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
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
                DonVi: true,
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
        filteredAwards = awards.filter(a => a.QuanNhan.don_vi_id === parseInt(don_vi_id));
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
            don_vi: a.QuanNhan.DonVi.ten_don_vi,
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
              DonVi: true,
              ChucVu: true,
            },
          },
        },
        orderBy: [{ nam: 'desc' }, { QuanNhan: { ho_ten: 'asc' } }],
      });

      let filteredAwards = awards;
      if (don_vi_id) {
        filteredAwards = awards.filter(a => a.QuanNhan.don_vi_id === parseInt(don_vi_id));
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
              DonVi: true,
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
                `CCCD ${award.cccd}: Đề xuất CSTDTQ nhưng chưa có NCKH/SKKH được duyệt.`
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
        where: { id: parseInt(proposalId) },
        include: {
          DonVi: true,
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
        where: { id: parseInt(proposalId) },
      });

      return {
        message: 'Đã xóa đề xuất thành công',
        proposal: {
          id: proposal.id,
          don_vi: proposal.DonVi.ten_don_vi,
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
