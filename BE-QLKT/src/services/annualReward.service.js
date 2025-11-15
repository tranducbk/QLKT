const { prisma } = require('../models');
const ExcelJS = require('exceljs');

class AnnualRewardService {
  /**
   * Lấy nhật ký danh hiệu của 1 quân nhân
   */
  async getAnnualRewards(personnelId) {
    try {
      if (!personnelId) {
        throw new Error('personnel_id là bắt buộc');
      }

      // Kiểm tra quân nhân có tồn tại không
      const personnel = await prisma.quanNhan.findUnique({
        where: { id: personnelId },
      });

      if (!personnel) {
        throw new Error('Quân nhân không tồn tại');
      }

      const rewards = await prisma.danhHieuHangNam.findMany({
        where: { quan_nhan_id: personnelId },
        orderBy: {
          nam: 'desc',
        },
      });

      return rewards;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Thêm danh hiệu cho quân nhân
   */
  async createAnnualReward(data) {
    try {
      const {
        personnel_id,
        nam,
        danh_hieu,
        nhan_bkbqp,
        so_quyet_dinh_bkbqp,
        nhan_cstdtq,
        so_quyet_dinh_cstdtq,
      } = data;

      // Kiểm tra quân nhân có tồn tại không
      const personnel = await prisma.quanNhan.findUnique({
        where: { id: personnel_id },
      });

      if (!personnel) {
        throw new Error('Quân nhân không tồn tại');
      }

      // Validate danh hiệu (cho phép null = không đạt)
      const validDanhHieu = ['CSTDCS', 'CSTT'];
      if (danh_hieu && !validDanhHieu.includes(danh_hieu)) {
        throw new Error(
          'Danh hiệu không hợp lệ. Danh hiệu hợp lệ: ' +
            validDanhHieu.join(', ') +
            ' (hoặc null = không đạt)'
        );
      }

      // Kiểm tra đã có bản ghi cho năm này chưa
      const existingReward = await prisma.danhHieuHangNam.findFirst({
        where: {
          quan_nhan_id: personnel_id,
          nam,
        },
      });

      if (existingReward) {
        throw new Error(`Quân nhân đã có danh hiệu cho năm ${nam}`);
      }

      // Tạo bản ghi mới
      const newReward = await prisma.danhHieuHangNam.create({
        data: {
          quan_nhan_id: personnel_id,
          nam,
          danh_hieu,
          nhan_bkbqp: nhan_bkbqp || false,
          so_quyet_dinh_bkbqp: so_quyet_dinh_bkbqp || null,
          nhan_cstdtq: nhan_cstdtq || false,
          so_quyet_dinh_cstdtq: so_quyet_dinh_cstdtq || null,
        },
      });

      // Tự động cập nhật lại hồ sơ hằng năm
      try {
        const profileService = require('./profile.service');
        await profileService.recalculateAnnualProfile(personnel_id);
      } catch (recalcError) {
        console.error(
          `⚠️ Failed to auto-recalculate annual profile for personnel ${personnel_id}:`,
          recalcError.message
        );
        // Không throw error, chỉ log để không ảnh hưởng đến việc tạo danh hiệu
      }

      return newReward;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sửa một bản ghi danh hiệu
   */
  async updateAnnualReward(id, data) {
    try {
      const { nam, danh_hieu, nhan_bkbqp, so_quyet_dinh_bkbqp, nhan_cstdtq, so_quyet_dinh_cstdtq } =
        data;

      // Kiểm tra bản ghi có tồn tại không
      const reward = await prisma.danhHieuHangNam.findUnique({
        where: { id },
      });

      if (!reward) {
        throw new Error('Bản ghi danh hiệu không tồn tại');
      }

      // Validate danh hiệu nếu có (cho phép null = không đạt)
      if (danh_hieu) {
        const validDanhHieu = ['CSTDCS', 'CSTT'];
        if (!validDanhHieu.includes(danh_hieu)) {
          throw new Error(
            'Danh hiệu không hợp lệ. Danh hiệu hợp lệ: ' +
              validDanhHieu.join(', ') +
              ' (hoặc null = không đạt)'
          );
        }
      }

      // Cập nhật
      const updatedReward = await prisma.danhHieuHangNam.update({
        where: { id },
        data: {
          nam: nam || reward.nam,
          danh_hieu: danh_hieu || reward.danh_hieu,
          nhan_bkbqp: nhan_bkbqp !== undefined ? nhan_bkbqp : reward.nhan_bkbqp,
          so_quyet_dinh_bkbqp:
            so_quyet_dinh_bkbqp !== undefined ? so_quyet_dinh_bkbqp : reward.so_quyet_dinh_bkbqp,
          nhan_cstdtq: nhan_cstdtq !== undefined ? nhan_cstdtq : reward.nhan_cstdtq,
          so_quyet_dinh_cstdtq:
            so_quyet_dinh_cstdtq !== undefined ? so_quyet_dinh_cstdtq : reward.so_quyet_dinh_cstdtq,
        },
      });

      // Tự động cập nhật lại hồ sơ hằng năm
      try {
        const profileService = require('./profile.service');
        await profileService.recalculateAnnualProfile(reward.quan_nhan_id);
      } catch (recalcError) {
        console.error(
          `⚠️ Failed to auto-recalculate annual profile for personnel ${reward.quan_nhan_id}:`,
          recalcError.message
        );
        // Không throw error, chỉ log để không ảnh hưởng đến việc cập nhật danh hiệu
      }

      return updatedReward;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Xóa một bản ghi danh hiệu
   */
  async deleteAnnualReward(id) {
    try {
      // Kiểm tra bản ghi có tồn tại không
      const reward = await prisma.danhHieuHangNam.findUnique({
        where: { id },
      });

      if (!reward) {
        throw new Error('Bản ghi danh hiệu không tồn tại');
      }

      const personnelId = reward.quan_nhan_id;

      // Xóa
      await prisma.danhHieuHangNam.delete({
        where: { id },
      });

      // Tự động cập nhật lại hồ sơ hằng năm
      try {
        const profileService = require('./profile.service');
        await profileService.recalculateAnnualProfile(personnelId);
      } catch (recalcError) {
        console.error(
          `⚠️ Failed to auto-recalculate annual profile for personnel ${personnelId}:`,
          recalcError.message
        );
        // Không throw error, chỉ log để không ảnh hưởng đến việc xóa danh hiệu
      }

      return { message: 'Xóa bản ghi danh hiệu thành công' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Import danh hiệu hằng năm từ Excel buffer
   * Cột: CCCD (bắt buộc), nam (bắt buộc), danh_hieu (CSTDCS, CSTT)
   * Nếu danh_hieu rỗng hoặc KHONG_DAT → lưu là null (= không đạt)
   * Khóa: CCCD + nam (nếu đã có sẽ cập nhật danh_hieu; nếu chưa có sẽ tạo mới)
   */
  async importFromExcelBuffer(buffer) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new Error('File Excel không hợp lệ');
      }

      // Header map
      const headerRow = worksheet.getRow(1);
      const headerMap = {};
      headerRow.eachCell((cell, colNumber) => {
        const key = String(cell.value || '')
          .trim()
          .toLowerCase();
        if (key) headerMap[key] = colNumber;
      });

      const required = ['cccd', 'nam', 'danh_hieu'];
      for (const k of required) {
        if (!headerMap[k]) throw new Error(`Thiếu cột bắt buộc: ${k}`);
      }

      const validDanhHieu = ['CSTDCS', 'CSTT'];
      const created = [];
      const updated = [];
      const errors = [];

      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const cccd = String(row.getCell(headerMap['cccd']).value || '').trim();
        const namVal = row.getCell(headerMap['nam']).value;
        const danh_hieu_raw = String(row.getCell(headerMap['danh_hieu']).value || '').trim();

        if (!cccd && !namVal && !danh_hieu_raw) continue; // dòng trống
        if (!cccd || !namVal) {
          errors.push({ row: rowNumber, error: 'Thiếu CCCD hoặc nam' });
          continue;
        }

        const nam = parseInt(namVal);
        if (!Number.isInteger(nam)) {
          errors.push({ row: rowNumber, error: 'Giá trị năm không hợp lệ' });
          continue;
        }

        // Xử lý danh_hieu: rỗng hoặc KHONG_DAT → null (không đạt)
        let danh_hieu = null;
        if (danh_hieu_raw) {
          const danhHieuUpper = danh_hieu_raw.toUpperCase();
          if (danhHieuUpper !== 'KHONG_DAT') {
            if (!validDanhHieu.includes(danhHieuUpper)) {
              errors.push({
                row: rowNumber,
                error: `Danh hiệu không hợp lệ: ${danh_hieu_raw}`,
              });
              continue;
            }
            danh_hieu = danhHieuUpper;
          }
          // Nếu là KHONG_DAT → để null
        }

        // Tìm quân nhân theo CCCD
        const personnel = await prisma.quanNhan.findUnique({ where: { cccd } });
        if (!personnel) {
          errors.push({
            row: rowNumber,
            error: `Không tìm thấy quân nhân với CCCD ${cccd}`,
          });
          continue;
        }

        // Tìm bản ghi danh hiệu theo khóa (quan_nhan_id + nam)
        const existing = await prisma.danhHieuHangNam.findFirst({
          where: { quan_nhan_id: personnel.id, nam },
        });

        if (!existing) {
          const createdReward = await prisma.danhHieuHangNam.create({
            data: {
              quan_nhan_id: personnel.id,
              nam,
              danh_hieu,
              nhan_bkbqp: false,
              nhan_cstdtq: false,
            },
          });
          created.push(createdReward.id);
        } else {
          await prisma.danhHieuHangNam.update({
            where: { id: existing.id },
            data: { danh_hieu },
          });
          updated.push(existing.id);
        }

        // Tự động cập nhật lại hồ sơ hằng năm cho quân nhân này
        try {
          const profileService = require('./profile.service');
          await profileService.recalculateAnnualProfile(personnel.id);
        } catch (recalcError) {
          console.error(
            `⚠️ Failed to auto-recalculate annual profile for personnel ${personnel.id}:`,
            recalcError.message
          );
          // Không throw error, chỉ log
        }
      }

      return {
        createdCount: created.length,
        updatedCount: updated.length,
        errors,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Thêm danh hiệu đồng loạt cho nhiều quân nhân
   */
  async bulkCreateAnnualRewards(data) {
    try {
      const { personnel_ids, nam, danh_hieu, so_quyet_dinh, file_quyet_dinh } = data;
      const profileService = require('./profile.service');

      // Validate danh hiệu
      const validDanhHieu = ['CSTDCS', 'CSTT', 'KHONG_DAT'];
      if (!validDanhHieu.includes(danh_hieu)) {
        throw new Error('Danh hiệu không hợp lệ. Danh hiệu hợp lệ: ' + validDanhHieu.join(', '));
      }

      const created = [];
      const errors = [];
      const skipped = [];

      for (const personnelId of personnel_ids) {
        try {
          // Kiểm tra quân nhân có tồn tại không
          const personnel = await prisma.quanNhan.findUnique({
            where: { id: personnelId },
          });

          if (!personnel) {
            errors.push({
              personnelId,
              error: 'Quân nhân không tồn tại',
            });
            continue;
          }

          // Kiểm tra đã có danh hiệu cho năm này chưa
          const existingReward = await prisma.danhHieuHangNam.findFirst({
            where: {
              quan_nhan_id: personnelId,
              nam: parseInt(nam),
            },
          });

          if (existingReward) {
            skipped.push({
              personnelId,
              reason: `Đã có danh hiệu cho năm ${nam}`,
            });
            continue;
          }

          // Tạo bản ghi mới (KHONG_DAT = null trong DB)
          const finalDanhHieu = danh_hieu === 'KHONG_DAT' ? null : danh_hieu;

          const newReward = await prisma.danhHieuHangNam.create({
            data: {
              quan_nhan_id: personnelId,
              nam: parseInt(nam),
              danh_hieu: finalDanhHieu,
              so_quyet_dinh: so_quyet_dinh || null,
              file_quyet_dinh: file_quyet_dinh || null,
              nhan_bkbqp: false,
              so_quyet_dinh_bkbqp: null,
              nhan_cstdtq: false,
              so_quyet_dinh_cstdtq: null,
            },
          });

          created.push(newReward);

          // Tự động cập nhật lại hồ sơ hằng năm
          try {
            await profileService.recalculateAnnualProfile(personnelId);
          } catch (recalcError) {
            console.error(
              `⚠️ Failed to auto-recalculate annual profile for personnel ${personnelId}:`,
              recalcError.message
            );
          }
        } catch (error) {
          errors.push({
            personnelId,
            error: error.message,
          });
        }
      }

      return {
        success: created.length,
        skipped: skipped.length,
        errors: errors.length,
        details: {
          created,
          skipped,
          errors,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AnnualRewardService();
