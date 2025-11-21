const { prisma } = require('../models');

class ProfileService {
  /**
   * Lấy hồ sơ gợi ý hằng năm
   */
  async getAnnualProfile(personnelId) {
    try {
      const personnel = await prisma.quanNhan.findUnique({
        where: { id: personnelId },
      });

      if (!personnel) {
        throw new Error('Quân nhân không tồn tại');
      }

      let profile = await prisma.hoSoHangNam.findUnique({
        where: { quan_nhan_id: personnelId },
        include: {
          QuanNhan: {
            include: {
              CoQuanDonVi: true,
              DonViTrucThuoc: true,
              ChucVu: true,
            },
          },
        },
      });

      // Nếu chưa có hồ sơ, tạo mới với giá trị mặc định
      if (!profile) {
        profile = await prisma.hoSoHangNam.create({
          data: {
            quan_nhan_id: personnelId,
            tong_cstdcs: 0,
            tong_nckh: 0,
            tong_cstdcs_json: [],
            tong_nckh_json: [],
            cstdcs_lien_tuc: 0,
            du_dieu_kien_bkbqp: false,
            du_dieu_kien_cstdtq: false,
            goi_y: 'Chưa có dữ liệu để tính toán. Vui lòng nhập danh hiệu và thành tích.',
          },
          include: {
            QuanNhan: {
              include: {
                CoQuanDonVi: true,
                DonViTrucThuoc: true,
                ChucVu: true,
              },
            },
          },
        });
      }

      return profile;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy hồ sơ gợi ý niên hạn
   */
  async getServiceProfile(personnelId) {
    try {
      const personnel = await prisma.quanNhan.findUnique({
        where: { id: personnelId },
      });

      if (!personnel) {
        throw new Error('Quân nhân không tồn tại');
      }

      let profile = await prisma.hoSoNienHan.findUnique({
        where: { quan_nhan_id: personnelId },
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
      });

      // Nếu chưa có hồ sơ, tạo mới với giá trị mặc định
      if (!profile) {
        profile = await prisma.hoSoNienHan.create({
          data: {
            quan_nhan_id: personnelId,
            hccsvv_hang_ba_status: 'CHUA_DU',
            hccsvv_hang_nhi_status: 'CHUA_DU',
            hccsvv_hang_nhat_status: 'CHUA_DU',
            hcbvtq_total_months: 0,
            hcbvtq_hang_ba_status: 'CHUA_DU',
            hcbvtq_hang_nhi_status: 'CHUA_DU',
            hcbvtq_hang_nhat_status: 'CHUA_DU',
            goi_y: 'Chưa có dữ liệu để tính toán. Vui lòng nhập lịch sử chức vụ.',
          },
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
        });
      }

      return profile;
    } catch (error) {
      throw error;
    }
  }

  /**
   * ==============================================
   * HELPER FUNCTIONS - KHEN THƯỞNG HẰNG NĂM
   * ==============================================
   */

  /**
   * Tính số năm CSTDCS liên tục từ năm gần nhất
   * @param {Array} danhHieuList - Danh sách danh hiệu đã sắp xếp theo năm giảm dần
   * @returns {number} Số năm liên tục
   */
  calculateContinuousCSTDCS(danhHieuList) {
    let count = 0;
    const sortedRewards = [...danhHieuList].sort((a, b) => b.nam - a.nam);

    for (const reward of sortedRewards) {
      // Kiểm tra đã nhận CSTDTQ → reset chuỗi
      if (reward.nhan_cstdtq === true) {
        // Nếu gặp năm đã nhận CSTDTQ, reset về 0 (bắt đầu chuỗi mới)
        count = 0;
        continue;
      }

      // Đếm CSTDCS
      if (reward.danh_hieu === 'CSTDCS') {
        count++;
      } else {
        // Gặp năm không phải CSTDCS (CSTT, KHONG_DAT, null) → dừng đếm
        break;
      }
    }

    return count;
  }

  /**
   * Kiểm tra NCKH trong khoảng năm
   * @param {Array} nckhList - Danh sách NCKH đã approved
   * @param {Array} years - Mảng các năm cần kiểm tra [2023, 2024, 2025]
   * @returns {Object} { hasNCKH: boolean, years: [2023, 2025] }
   */
  checkNCKHInYears(nckhList, years) {
    const nckhYears = nckhList.map(n => n.nam);
    const foundYears = years.filter(year => nckhYears.includes(year));
    return {
      hasNCKH: foundYears.length > 0,
      years: foundYears,
    };
  }

  /**
   * Tính toán gợi ý BKBQP (5 năm CSTDCS liên tục)
   * @param {number} CSTDCSLienTuc - Số năm CSTDCS liên tục
   * @param {Array} danhHieuList - Danh sách danh hiệu
   * @param {Array} nckhList - Danh sách NCKH đã approved
   * @returns {Object} { duDieuKien: boolean, goiY: string }
   */
  calculateBKBQP(CSTDCSLienTuc, danhHieuList, nckhList) {
    // Chưa đủ 5 năm CSTDCS liên tục
    if (CSTDCSLienTuc < 5) {
      return {
        duDieuKien: false,
        goiY: `Hiện có ${CSTDCSLienTuc} năm CSTDCS liên tục. Cần ${
          5 - CSTDCSLienTuc
        } năm CSTDCS nữa để xét BKBQP.`,
      };
    }

    // Đã có đủ 5 năm CSTDCS liên tục
    if (CSTDCSLienTuc >= 5) {
      return {
        duDieuKien: true,
        goiY: 'Đã đủ điều kiện đề nghị xét Bằng khen Bộ Quốc phòng.',
      };
    }

    // Trường hợp mặc định: chưa đủ
    return {
      duDieuKien: false,
      goiY: `Hiện có ${CSTDCSLienTuc} năm CSTDCS liên tục. Cần ${
        5 - CSTDCSLienTuc
      } năm CSTDCS nữa để xét BKBQP.`,
    };
  }

  /**
   * Tính toán gợi ý CSTDTQ (10 năm CSTDCS liên tục + 1 ĐTKH/SKKH)
   * @param {number} CSTDCSLienTuc - Số năm CSTDCS liên tục
   * @param {Object} bkbqpResult - Kết quả tính toán BKBQP
   * @param {Array} danhHieuList - Danh sách danh hiệu
   * @param {Array} nckhList - Danh sách NCKH đã approved
   * @returns {Object} { duDieuKien: boolean, goiY: string }
   */
  calculateCSTDTQ(CSTDCSLienTuc, bkbqpResult, danhHieuList, nckhList) {
    // CSTDTQ chỉ xét nếu đã đủ điều kiện BKBQP (5 năm)
    if (!bkbqpResult.duDieuKien) {
      return {
        duDieuKien: false,
        goiY: '',
      };
    }

    // Chưa đủ 10 năm CSTDCS liên tục
    if (CSTDCSLienTuc < 10) {
      return {
        duDieuKien: false,
        goiY: `Đã đủ điều kiện BKBQP. Hiện có ${CSTDCSLienTuc} năm CSTDCS liên tục. Cần ${
          10 - CSTDCSLienTuc
        } năm CSTDCS nữa để xét CSTDTQ.`,
      };
    }

    // Đã có đủ 10 năm CSTDCS liên tục
    if (CSTDCSLienTuc >= 10) {
      // Kiểm tra có ít nhất 1 ĐTKH/SKKH
      if (nckhList.length > 0) {
        return {
          duDieuKien: true,
          goiY: 'Đã đủ điều kiện đề nghị xét Chiến sĩ thi đua Toàn quân.',
        };
      } else {
        return {
          duDieuKien: false,
          goiY: `Đã có ${CSTDCSLienTuc} năm CSTDCS liên tục. Cần thêm ít nhất 1 ĐTKH/SKKH để đủ điều kiện xét CSTDTQ.`,
        };
      }
    }

    // Trường hợp mặc định
    return {
      duDieuKien: false,
      goiY: '',
    };
  }

  /**
   * Xử lý trường hợp đặc biệt (Reset, đã nhận)
   * @param {Array} danhHieuList - Danh sách danh hiệu
   * @returns {Object} { isSpecialCase: boolean, goiY: string, resetChain: boolean }
   */
  handleSpecialCases(danhHieuList) {
    const sortedRewards = [...danhHieuList].sort((a, b) => b.nam - a.nam);
    const latestReward = sortedRewards[0];

    if (!latestReward) {
      return { isSpecialCase: false, goiY: '', resetChain: false };
    }

    // Trường hợp 8: Admin đã cập nhật nhận CSTDTQ
    if (latestReward.nhan_cstdtq === true) {
      return {
        isSpecialCase: true,
        goiY: `Đã nhận Chiến sĩ thi đua Toàn quân (Năm ${latestReward.nam}). Bắt đầu chuỗi thành tích mới.`,
        resetChain: true,
      };
    }

    // Trường hợp 9: Admin đã cập nhật nhận BKBQP (nhưng chưa đủ CSTDTQ)
    if (latestReward.nhan_bkbqp === true && !latestReward.nhan_cstdtq) {
      return {
        isSpecialCase: true,
        goiY: `Đã nhận Bằng khen Bộ Quốc phòng (Năm ${latestReward.nam}).`,
        resetChain: false,
      };
    }

    // Trường hợp 10: Năm nay không đạt CSTDCS
    if (latestReward.danh_hieu !== 'CSTDCS' && latestReward.danh_hieu !== null) {
      return {
        isSpecialCase: true,
        goiY: 'Chưa có CSTDCS liên tục. Cần đạt CSTDCS để bắt đầu tính điều kiện khen thưởng.',
        resetChain: true,
      };
    }

    return { isSpecialCase: false, goiY: '', resetChain: false };
  }

  /**
   * ==============================================
   * HELPER FUNCTIONS - KHEN THƯỞNG NIÊN HẠN
   * ==============================================
   */

  /**
   * Tính ngày đủ điều kiện xét HCCSVV
   * @param {Date} ngayNhapNgu - Ngày nhập ngũ
   * @param {number} soNam - Số năm yêu cầu (10, 15, 20)
   * @returns {Date} Ngày đủ điều kiện
   */
  calculateEligibilityDate(ngayNhapNgu, soNam) {
    if (!ngayNhapNgu) return null;
    const eligibilityDate = new Date(ngayNhapNgu);
    eligibilityDate.setFullYear(eligibilityDate.getFullYear() + soNam);
    return eligibilityDate;
  }

  /**
   * Tính toán gợi ý HCCSVV cho một hạng
   * @param {Date} ngayNhapNgu - Ngày nhập ngũ
   * @param {number} soNam - Số năm yêu cầu (10, 15, 20)
   * @param {string} currentStatus - Trạng thái hiện tại
   * @param {string} hangName - Tên hạng (Ba, Nhì, Nhất)
   * @returns {Object} { status: string, ngay: Date, goiY: string }
   */
  calculateHCCSVV(ngayNhapNgu, soNam, currentStatus, hangName) {
    if (!ngayNhapNgu) {
      return {
        status: 'CHUA_DU',
        ngay: null,
        goiY: `Chưa có ngày nhập ngũ. Không thể tính toán HCCSVV Hạng ${hangName}.`,
      };
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const eligibilityDate = this.calculateEligibilityDate(ngayNhapNgu, soNam);
    const eligibilityYear = eligibilityDate.getFullYear();

    // Trường hợp 13: Admin đã cập nhật DA_NHAN
    if (currentStatus === 'DA_NHAN') {
      return {
        status: 'DA_NHAN',
        ngay: eligibilityDate,
        goiY: `Đã nhận HCCSVV Hạng ${hangName}.`,
      };
    }

    // Trường hợp 11: Năm hiện tại BẰNG năm đủ điều kiện
    if (currentYear === eligibilityYear) {
      return {
        status: 'DU_DIEU_KIEN',
        ngay: eligibilityDate,
        goiY: `Đủ điều kiện (${soNam} năm) xét HCCSVV Hạng ${hangName} trong năm nay. Ngày xét duyệt dự kiến: ${eligibilityDate.toLocaleDateString(
          'vi-VN'
        )}.`,
      };
    }

    // Trường hợp 12: Năm hiện tại LỚN HƠN năm đủ điều kiện (đã quá hạn)
    if (currentYear > eligibilityYear) {
      return {
        status: 'DU_DIEU_KIEN',
        ngay: eligibilityDate,
        goiY: `Đã quá hạn xét HCCSVV Hạng ${hangName}. Ngày đủ điều kiện: ${eligibilityDate.toLocaleDateString(
          'vi-VN'
        )}. Chờ Admin cập nhật.`,
      };
    }

    // Trường hợp 14: Năm hiện tại NHỎ HƠN năm đủ điều kiện (chưa đến hạn)
    if (currentYear < eligibilityYear) {
      const yearsLeft = eligibilityYear - currentYear;
      return {
        status: 'CHUA_DU',
        ngay: null,
        goiY: `Chưa đủ điều kiện (${soNam} năm) xét HCCSVV Hạng ${hangName}. Dự kiến: ${eligibilityDate.toLocaleDateString(
          'vi-VN'
        )} (còn ${yearsLeft} năm).`,
      };
    }

    // Fallback
    return {
      status: 'CHUA_DU',
      ngay: null,
      goiY: `Đang tính toán HCCSVV Hạng ${hangName}...`,
    };
  }

  /**
   * ==============================================
   * HELPER FUNCTIONS - KHEN THƯỞNG CỐNG HIẾN
   * ==============================================
   */

  /**
   * Tính tổng tháng cống hiến từ lịch sử chức vụ
   * @param {Array} lichSuChucVu - Danh sách lịch sử chức vụ
   * @returns {number} Tổng tháng cống hiến (đã nhân hệ số)
   */
  calculateContributionMonths(lichSuChucVu) {
    let totalMonths = 0;
    const today = new Date();

    // Mapping nhóm cống hiến sang hệ số
    const hesoMap = {
      'Nhóm 5': 1.0,
      'Nhóm 6': 1.2,
      'Nhóm 7': 1.5,
      // Thêm các nhóm khác nếu có
    };

    for (const ls of lichSuChucVu) {
      if (ls.ChucVu?.NhomCongHien) {
        const ngayBatDau = new Date(ls.ngay_bat_dau);
        const ngayKetThuc = ls.ngay_ket_thuc ? new Date(ls.ngay_ket_thuc) : today;

        // Tính số tháng thực tế theo lịch (chính xác)
        let months = (ngayKetThuc.getFullYear() - ngayBatDau.getFullYear()) * 12;
        months += ngayKetThuc.getMonth() - ngayBatDau.getMonth();

        // Nếu ngày kết thúc < ngày bắt đầu trong tháng thì trừ 1 tháng
        if (ngayKetThuc.getDate() < ngayBatDau.getDate()) {
          months--;
        }

        const monthsWorked = Math.max(0, months); // Đảm bảo không âm

        // Lấy hệ số từ tên nhóm cống hiến
        const tenNhom = ls.ChucVu.NhomCongHien.ten_nhom;
        const heso = hesoMap[tenNhom] || 1.0;

        // Tính tháng cống hiến = tháng làm việc * hệ số
        totalMonths += Math.floor(monthsWorked * heso);
      }
    }

    return totalMonths;
  }

  /**
   * Tính toán gợi ý HCBVTQ cho một hạng
   * @param {number} totalMonths - Tổng tháng cống hiến
   * @param {number} requiredMonths - Số tháng yêu cầu (180, 240, 300)
   * @param {string} currentStatus - Trạng thái hiện tại
   * @param {string} hangName - Tên hạng (Ba, Nhì, Nhất)
   * @returns {Object} { status: string, goiY: string }
   */
  calculateHCBVTQ(totalMonths, requiredMonths, currentStatus, hangName) {
    // Trường hợp 17: Admin đã cập nhật DA_NHAN
    if (currentStatus === 'DA_NHAN') {
      return {
        status: 'DA_NHAN',
        goiY: '', // Không tạo gợi ý cho HCBVTQ
      };
    }

    // Trường hợp 16: Đã đủ điều kiện
    if (totalMonths >= requiredMonths) {
      return {
        status: 'DU_DIEU_KIEN',
        goiY: '', // Không tạo gợi ý cho HCBVTQ
      };
    }

    // Trường hợp 15: Chưa đủ điều kiện
    return {
      status: 'CHUA_DU',
      goiY: '', // Không tạo gợi ý cho HCBVTQ
    };
  }

  /**
   * ==============================================
   * HÀM TÍNH TOÁN CHÍNH
   * ==============================================
   */

  /**
   * ==============================================
   * TÍNH TOÁN HỒ SƠ HẰNG NĂM - LOGIC MỚI
   * ==============================================
   */

  /**
   * Tính toán lại hồ sơ hằng năm cho 1 quân nhân
   * Logic: BKBQP (2 năm) và CSTDTQ (3 năm)
   * @param {number} personnelId - ID quân nhân
   * @param {number} [year] - Năm để tính toán gợi ý (mặc định là năm hiện tại)
   * @returns {Promise<Object>} Kết quả tính toán
   */
  async recalculateAnnualProfile(personnelId, year = null) {
    try {
      // ==============================================
      // BƯỚC 1: Thu thập Toàn bộ Dữ liệu Lịch sử (Input)
      // ==============================================
      const personnel = await prisma.quanNhan.findUnique({
        where: { id: personnelId },
        include: {
          DanhHieuHangNam: {
            orderBy: { nam: 'asc' }, // Sắp xếp theo năm tăng dần
          },
          ThanhTichKhoaHoc: {
            where: { status: 'APPROVED' }, // Chỉ lấy ĐTKH/SKKH đã duyệt
            orderBy: { nam: 'asc' }, // Sắp xếp theo năm tăng dần
          },
        },
      });

      if (!personnel) {
        throw new Error('Quân nhân không tồn tại');
      }

      const danhHieuList = personnel.DanhHieuHangNam || [];
      const thanhTichList = personnel.ThanhTichKhoaHoc || [];

      console.log(
        `📋 [recalculateAnnualProfile] Quân nhân ID: ${personnelId}, Số danh hiệu: ${danhHieuList.length}, Số thành tích: ${thanhTichList.length}`
      );
      console.log(
        `📋 [recalculateAnnualProfile] Danh sách danh hiệu:`,
        danhHieuList.map(dh => `${dh.nam}: ${dh.danh_hieu}`).join(', ')
      );

      // ==============================================
      // BƯỚC 2: Định nghĩa Biến Tính toán
      // ==============================================
      let du_dieu_kien_bkbqp = false;
      let du_dieu_kien_cstdtq = false;
      // Lưu lại 2 năm đã đủ điều kiện BKBQP để tạo gợi ý (nếu có)
      let nam_bkbqp_sequence = [];
      // Lưu TẤT CẢ danh hiệu cá nhân hằng năm dạng JSON (CSTT, CSTDCS, BKBQP, CSTDTQ)
      const tong_cstdcs_json = danhHieuList
        .filter(
          dh =>
            dh.danh_hieu === 'CSTDCS' ||
            dh.danh_hieu === 'CSTT' ||
            dh.danh_hieu === 'BKBQP' ||
            dh.danh_hieu === 'CSTDTQ'
        )
        .map(dh => ({
          nam: dh.nam,
          danh_hieu: dh.danh_hieu,
          so_quyet_dinh: dh.so_quyet_dinh || null,
          file_quyet_dinh: dh.file_quyet_dinh || null,
          nhan_bkbqp: dh.nhan_bkbqp || false,
          nhan_cstdtq: dh.nhan_cstdtq || false,
          so_quyet_dinh_bkbqp: dh.so_quyet_dinh_bkbqp || null,
          file_quyet_dinh_bkbqp: dh.file_quyet_dinh_bkbqp || null,
          so_quyet_dinh_cstdtq: dh.so_quyet_dinh_cstdtq || null,
          file_quyet_dinh_cstdtq: dh.file_quyet_dinh_cstdtq || null,
        }))
        .sort((a, b) => a.nam - b.nam); // Sắp xếp theo năm tăng dần
      const tong_cstdcs = tong_cstdcs_json.length;
      // Lưu danh sách NCKH dạng JSON
      const tong_nckh_json = thanhTichList
        .map(tt => ({
          nam: tt.nam,
          loai: tt.loai,
          mo_ta: tt.mo_ta,
          status: tt.status,
          so_quyet_dinh: tt.so_quyet_dinh || null,
          file_quyet_dinh: tt.file_quyet_dinh || null,
        }))
        .sort((a, b) => a.nam - b.nam); // Sắp xếp theo năm tăng dần
      const tong_nckh = tong_nckh_json.length;
      console.log(
        `📋 [recalculateAnnualProfile] Số NCKH: ${tong_nckh}, JSON:`,
        JSON.stringify(tong_nckh_json, null, 2)
      );
      let cstdcs_lien_tuc = 0;
      let nam_cstdcs_lien_tuc = []; // Mảng lưu các năm CSTĐCS liên tục

      // ==============================================
      // BƯỚC 3: Logic "Bộ não" (Lặp và Kiểm tra)
      // ==============================================

      // Tìm các chuỗi CSTĐCS liên tục và kiểm tra điều kiện
      // Logic mới: Tìm từng chuỗi liên tục, kiểm tra điều kiện, nếu không đủ thì reset và bắt đầu chuỗi mới

      let currentSequence = []; // Chuỗi CSTDCS hiện tại đang xét
      let lastCheckedYear = null; // Năm cuối cùng đã kiểm tra

      for (const danhHieu of danhHieuList) {
        if (danhHieu.danh_hieu === 'CSTDCS') {
          // tong_cstdcs đã được tính từ tong_cstdcs_json.length ở trên

          // Kiểm tra xem năm này có liên tiếp với chuỗi hiện tại không
          if (currentSequence.length === 0 || danhHieu.nam === lastCheckedYear + 1) {
            // Thêm vào chuỗi hiện tại
            currentSequence.push(danhHieu.nam);
            lastCheckedYear = danhHieu.nam;
            cstdcs_lien_tuc = currentSequence.length;
            nam_cstdcs_lien_tuc = [...currentSequence];
          } else {
            // Không liên tiếp, reset và bắt đầu chuỗi mới
            currentSequence = [danhHieu.nam];
            lastCheckedYear = danhHieu.nam;
            cstdcs_lien_tuc = 1;
            nam_cstdcs_lien_tuc = [danhHieu.nam];
          }

          // B. Logic kiểm tra điều kiện BKBQP (2 năm) - KIỂM TRA TRƯỚC
          // Điều kiện: ĐÚNG 2 năm CSTDCS liên tục + MỖI năm đều có NCKH (ĐTKH/SKKH) đã duyệt
          // Mỗi cụm 2 năm là độc lập, không liên quan đến nhau (ví dụ: 1-2, 3-4, 5-6 là các cụm độc lập)
          // NCKH chỉ được kiểm tra trong phạm vi của từng cụm 2 năm riêng biệt
          // Tính cụm 2 năm từ đầu đến cuối, không lấy 2 năm cuối
          let hasBKBQPInSequence = false; // Biến để lưu trạng thái BKBQP trong cụm hiện tại

          if (currentSequence.length >= 2) {
            // Luôn kiểm tra cụm 2 năm đầu tiên (từ đầu chuỗi)
            const nam_1 = currentSequence[0];
            const nam_2 = currentSequence[1];

            // Kiểm tra mỗi năm đều có NCKH (chỉ trong phạm vi cụm 2 năm này)
            const hasNCKH_Nam1 = thanhTichList.some(tt => tt.nam === nam_1);
            const hasNCKH_Nam2 = thanhTichList.some(tt => tt.nam === nam_2);

            // Kiểm tra đã có BKBQP chưa (trong cụm 2 năm này: năm 1 hoặc năm 2)
            const hasBKBQP = danhHieuList.some(
              dh => dh.nhan_bkbqp === true && (dh.nam === nam_1 || dh.nam === nam_2)
            );

            if (hasNCKH_Nam1 && hasNCKH_Nam2) {
              // Cụm 2 năm đầu đủ điều kiện BKBQP
              du_dieu_kien_bkbqp = true;
              hasBKBQPInSequence = hasBKBQP;
              // Lưu lại 2 năm đã đủ điều kiện BKBQP để tạo gợi ý
              nam_bkbqp_sequence = [nam_1, nam_2];

              if (hasBKBQP) {
                // Đã có BKBQP rồi, có thể kiểm tra CSTDTQ nếu có đủ 3 năm
                // Không reset, để kiểm tra CSTDTQ
              } else {
                // Chưa có BKBQP, reset và bắt đầu cụm mới từ năm tiếp theo
                if (currentSequence.length === 2) {
                  // Có đúng 2 năm, reset và bắt đầu cụm mới
                  currentSequence = [];
                  lastCheckedYear = null;
                  cstdcs_lien_tuc = 0;
                  nam_cstdcs_lien_tuc = [];
                } else if (currentSequence.length > 2) {
                  // Có hơn 2 năm, reset và bắt đầu cụm mới từ năm thứ 3
                  // Bỏ qua 2 năm đầu (đã xử lý xong), bắt đầu từ năm thứ 3
                  const remainingYears = currentSequence.slice(2);
                  if (remainingYears.length > 0) {
                    currentSequence = remainingYears;
                    lastCheckedYear = remainingYears[remainingYears.length - 1];
                    cstdcs_lien_tuc = remainingYears.length;
                    nam_cstdcs_lien_tuc = [...remainingYears];
                  } else {
                    currentSequence = [];
                    lastCheckedYear = null;
                    cstdcs_lien_tuc = 0;
                    nam_cstdcs_lien_tuc = [];
                  }
                }
              }
            } else if (currentSequence.length === 2) {
              // Có đúng 2 năm nhưng không đủ điều kiện BKBQP, giữ lại để hiển thị gợi ý
              du_dieu_kien_bkbqp = false;
              // Không reset, giữ lại để logic tạo gợi ý có thể xử lý
            } else if (currentSequence.length > 2) {
              // Có hơn 2 năm, cụm 2 năm đầu không đủ điều kiện
              // Bắt đầu cụm mới từ năm thứ 3 (bỏ qua 2 năm đầu)
              const remainingYears = currentSequence.slice(2);
              if (remainingYears.length > 0) {
                currentSequence = remainingYears;
                lastCheckedYear = remainingYears[remainingYears.length - 1];
                cstdcs_lien_tuc = remainingYears.length;
                nam_cstdcs_lien_tuc = [...remainingYears];
              } else {
                currentSequence = [];
                lastCheckedYear = null;
                cstdcs_lien_tuc = 0;
                nam_cstdcs_lien_tuc = [];
              }
              du_dieu_kien_bkbqp = false;
            }
          }

          // C. Logic kiểm tra điều kiện CSTDTQ (3 năm) - CHỈ KIỂM TRA SAU KHI ĐÃ CÓ BKBQP
          // Điều kiện: ĐÚNG 3 năm CSTDCS liên tục + MỖI năm đều có NCKH (ĐTKH/SKKH) đã duyệt + Có BKBQP
          // Mỗi cụm 3 năm là độc lập, không liên quan đến nhau (ví dụ: 1-2-3, 4-5-6 là các cụm độc lập)
          // NCKH chỉ được kiểm tra trong phạm vi của từng cụm 3 năm riêng biệt
          // CHỈ KIỂM TRA NẾU ĐÃ CÓ BKBQP (vì BKBQP là điều kiện của CSTDTQ)
          // Tính cụm 3 năm từ đầu đến cuối, không lấy 3 năm cuối
          if (currentSequence.length >= 3 && hasBKBQPInSequence) {
            // Kiểm tra cụm 3 năm đầu tiên (từ đầu chuỗi)
            const nam_1 = currentSequence[0];
            const nam_2 = currentSequence[1];
            const nam_3 = currentSequence[2];

            // Kiểm tra mỗi năm đều có NCKH (chỉ trong phạm vi cụm 3 năm này)
            const hasNCKH_Nam1 = thanhTichList.some(tt => tt.nam === nam_1);
            const hasNCKH_Nam2 = thanhTichList.some(tt => tt.nam === nam_2);
            const hasNCKH_Nam3 = thanhTichList.some(tt => tt.nam === nam_3);

            // Kiểm tra có BKBQP không (chỉ trong phạm vi cụm 3 năm này: năm 1 hoặc năm 2)
            const hasBKBQP = danhHieuList.some(
              dh => dh.nhan_bkbqp === true && (dh.nam === nam_1 || dh.nam === nam_2)
            );

            if (hasNCKH_Nam1 && hasNCKH_Nam2 && hasNCKH_Nam3 && hasBKBQP) {
              // Cụm 3 năm đầu đủ điều kiện CSTDTQ, reset và bắt đầu cụm mới từ năm thứ 4
              du_dieu_kien_cstdtq = true;
              const remainingYears = currentSequence.slice(3);
              if (remainingYears.length > 0) {
                currentSequence = remainingYears;
                lastCheckedYear = remainingYears[remainingYears.length - 1];
                cstdcs_lien_tuc = remainingYears.length;
                nam_cstdcs_lien_tuc = [...remainingYears];
              } else {
                currentSequence = [];
                lastCheckedYear = null;
                cstdcs_lien_tuc = 0;
                nam_cstdcs_lien_tuc = [];
              }
            } else if (currentSequence.length === 3) {
              // Có đúng 3 năm nhưng không đủ điều kiện CSTDTQ, reset và bắt đầu cụm mới
              currentSequence = [];
              lastCheckedYear = null;
              cstdcs_lien_tuc = 0;
              nam_cstdcs_lien_tuc = [];
              du_dieu_kien_cstdtq = false;
            } else if (currentSequence.length > 3) {
              // Có hơn 3 năm, cụm 3 năm đầu không đủ điều kiện
              // Bắt đầu cụm mới từ năm thứ 4 (bỏ qua 3 năm đầu)
              const remainingYears = currentSequence.slice(3);
              if (remainingYears.length > 0) {
                currentSequence = remainingYears;
                lastCheckedYear = remainingYears[remainingYears.length - 1];
                cstdcs_lien_tuc = remainingYears.length;
                nam_cstdcs_lien_tuc = [...remainingYears];
              } else {
                currentSequence = [];
                lastCheckedYear = null;
                cstdcs_lien_tuc = 0;
                nam_cstdcs_lien_tuc = [];
              }
              du_dieu_kien_cstdtq = false;
            }
          }
        } else {
          // Reset chuỗi nếu không phải CSTDCS
          currentSequence = [];
          lastCheckedYear = null;
          cstdcs_lien_tuc = 0;
          nam_cstdcs_lien_tuc = [];
        }
      }

      // Kiểm tra xem chuỗi CSTDCS liên tục có còn hiệu lực không
      // Chỉ tính chuỗi nếu kết thúc ở năm hiện tại hoặc năm trước (cách không quá 1 năm)
      // Nếu chuỗi kết thúc quá xa, coi như đã quá hạn và không còn hợp lệ
      // Sử dụng năm được truyền lên (nếu có) thay vì năm hiện tại
      const currentYear = year || new Date().getFullYear();
      if (nam_cstdcs_lien_tuc.length > 0) {
        const namCuoiCung = nam_cstdcs_lien_tuc[nam_cstdcs_lien_tuc.length - 1];
        // Nếu chuỗi kết thúc cách năm hiện tại hơn 1 năm (ví dụ: kết thúc 2023, năm hiện tại 2025), coi như đã quá hạn
        if (currentYear - namCuoiCung > 1) {
          // Chuỗi đã quá hạn, reset về 0
          cstdcs_lien_tuc = 0;
          nam_cstdcs_lien_tuc = [];
          du_dieu_kien_bkbqp = false;
          du_dieu_kien_cstdtq = false;
        }
      }

      // ==============================================
      // BƯỚC 4: Logic Tạo Gợi ý (Suggestion)
      // ==============================================
      let goi_y = '';

      if (du_dieu_kien_cstdtq === true) {
        goi_y =
          'Đã đủ điều kiện đề nghị xét Chiến sĩ thi đua Toàn quân (3 năm CSTDCS liên tục, mỗi năm đều có NCKH, và có BKBQP).';
      } else if (cstdcs_lien_tuc >= 3) {
        // Đã có 3 năm CSTDCS nhưng chưa đủ điều kiện CSTDTQ
        const nam_1 = nam_cstdcs_lien_tuc[nam_cstdcs_lien_tuc.length - 3];
        const nam_2 = nam_cstdcs_lien_tuc[nam_cstdcs_lien_tuc.length - 2];
        const nam_3 = nam_cstdcs_lien_tuc[nam_cstdcs_lien_tuc.length - 1];

        const hasNCKH_Nam1 = thanhTichList.some(tt => tt.nam === nam_1);
        const hasNCKH_Nam2 = thanhTichList.some(tt => tt.nam === nam_2);
        const hasNCKH_Nam3 = thanhTichList.some(tt => tt.nam === nam_3);
        const hasBKBQP = danhHieuList.some(
          dh => dh.nhan_bkbqp === true && (dh.nam === nam_1 || dh.nam === nam_2)
        );

        const missing = [];
        if (!hasNCKH_Nam1) missing.push(`NCKH vào năm ${nam_1}`);
        if (!hasNCKH_Nam2) missing.push(`NCKH vào năm ${nam_2}`);
        if (!hasNCKH_Nam3) missing.push(`NCKH vào năm ${nam_3}`);
        if (!hasBKBQP) {
          // Tìm năm nào nên có BKBQP (thường là năm thứ 2 hoặc thứ 3)
          missing.push(`BKBQP vào năm ${nam_2} hoặc ${nam_3}`);
        }

        if (missing.length > 0) {
          goi_y = `Đã có CSTDCS vào năm ${nam_1}, ${nam_2}, ${nam_3}.\nCần:\n${missing.join(
            '\n'
          )} để đủ điều kiện CSTDTQ.`;
        }
      } else if (du_dieu_kien_bkbqp === true) {
        // Tìm 2 năm CSTDCS liên tục đã đủ điều kiện BKBQP
        // Sử dụng nam_bkbqp_sequence nếu có (đã lưu trước khi reset), nếu không thì lấy từ nam_cstdcs_lien_tuc
        let nam_1, nam_2;
        if (nam_bkbqp_sequence.length >= 2) {
          nam_1 = nam_bkbqp_sequence[0];
          nam_2 = nam_bkbqp_sequence[1];
        } else if (nam_cstdcs_lien_tuc.length >= 2) {
          nam_1 = nam_cstdcs_lien_tuc[nam_cstdcs_lien_tuc.length - 2];
          nam_2 = nam_cstdcs_lien_tuc[nam_cstdcs_lien_tuc.length - 1];
        } else {
          // Fallback: không thể xác định năm, bỏ qua gợi ý này
          goi_y = 'Đã đủ điều kiện BKBQP nhưng không thể xác định năm cụ thể.';
        }

        // Chỉ tiếp tục nếu đã xác định được nam_1 và nam_2
        if (nam_1 && nam_2) {
          const nam_3 = nam_2 + 1; // Năm thứ 3 - đề xuất BKBQP
          const nam_4 = nam_3 + 1; // Năm thứ 4 - đề xuất CSTDTQ (nếu năm 3 có CSTDCS + NCKH)
          const currentYear = year;

          // Kiểm tra xem BKBQP đã được trao chưa
          const hasBKBQP = danhHieuList.some(
            dh =>
              dh.nhan_bkbqp === true && (dh.nam === nam_1 || dh.nam === nam_2 || dh.nam === nam_3)
          );

          // Kiểm tra năm thứ 3 có CSTDCS và NCKH chưa
          const hasCSTDCS_Nam3 = danhHieuList.some(
            dh => dh.danh_hieu === 'CSTDCS' && dh.nam === nam_3
          );
          const hasNCKH_Nam3 = thanhTichList.some(tt => tt.nam === nam_3);

          // Nếu năm thứ 3 đã qua (nam_3 < currentYear) và chưa có đủ điều kiện, báo đã qua đợt đề xuất
          if (nam_3 < currentYear && !(hasCSTDCS_Nam3 && hasNCKH_Nam3 && hasBKBQP)) {
            goi_y = `Đã đủ điều kiện BKBQP (CSTDCS vào năm ${nam_1}, ${nam_2} và mỗi năm đều có NCKH).\nNăm ${nam_3} đã qua đợt đề xuất nhưng chưa được đề xuất BKBQP.`;
          } else if (hasCSTDCS_Nam3 && hasNCKH_Nam3 && hasBKBQP) {
            // Năm thứ 3 đã có CSTDCS + NCKH + BKBQP → đề xuất CSTDTQ vào năm thứ 4
            const missing = [];
            missing.push(`CSTDTQ vào năm ${nam_4}`);
            goi_y = `Đã đủ điều kiện BKBQP (CSTDCS vào năm ${nam_1}, ${nam_2} và mỗi năm đều có NCKH).\nNăm ${nam_3} đã có CSTDCS, NCKH và BKBQP.\nCần:\n${missing.join(
              '\n'
            )}.`;
          } else {
            // Năm thứ 3 chưa đủ điều kiện - chỉ gợi ý hoàn thành năm thứ 3, KHÔNG đề xuất CSTDTQ
            const missing = [];
            if (!hasBKBQP) {
              missing.push(`BKBQP vào năm ${nam_3}`);
            }
            if (!hasCSTDCS_Nam3) {
              missing.push(`CSTDCS vào năm ${nam_3}`);
            }
            if (!hasNCKH_Nam3) {
              missing.push(`NCKH vào năm ${nam_3}`);
            }
            // KHÔNG đề xuất CSTDTQ vào năm thứ 4 nếu năm thứ 3 chưa đủ điều kiện
            // Chỉ gợi ý hoàn thành năm thứ 3 để đủ điều kiện BKBQP
            // Chỉ khi đủ chuỗi 3 năm (năm 1, 2, 3) mới đề xuất CSTDTQ

            goi_y = `Đã đủ điều kiện BKBQP (CSTDCS vào năm ${nam_1}, ${nam_2} và mỗi năm đều có NCKH).\nCần:\n${missing.join(
              '\n'
            )}.`;
          }
        }
      } else if (cstdcs_lien_tuc === 2) {
        // Đã có 2 năm CSTDCS
        const nam_1 = nam_cstdcs_lien_tuc[nam_cstdcs_lien_tuc.length - 2];
        const nam_2 = nam_cstdcs_lien_tuc[nam_cstdcs_lien_tuc.length - 1];
        const hasNCKH_Nam1 = thanhTichList.some(tt => tt.nam === nam_1);
        const hasNCKH_Nam2 = thanhTichList.some(tt => tt.nam === nam_2);

        const missing = [];
        if (!hasNCKH_Nam1) missing.push(`NCKH vào năm ${nam_1}`);
        if (!hasNCKH_Nam2) missing.push(`NCKH vào năm ${nam_2}`);

        if (missing.length > 0) {
          goi_y = `Đã có CSTDCS vào năm ${nam_1}, ${nam_2}.\nCần:\n${missing.join(
            '\n'
          )} để đủ điều kiện BKBQP.`;
        } else {
          const nam_3 = nam_2 + 1; // Năm thứ 3 - đề xuất BKBQP
          const nam_4 = nam_3 + 1; // Năm thứ 4 - đề xuất CSTDTQ (nếu năm 3 có CSTDCS + NCKH)
          const currentYear = year;

          // Kiểm tra xem BKBQP đã được trao chưa
          const hasBKBQP = danhHieuList.some(
            dh =>
              dh.nhan_bkbqp === true && (dh.nam === nam_1 || dh.nam === nam_2 || dh.nam === nam_3)
          );

          // Kiểm tra năm thứ 3 có CSTDCS và NCKH chưa
          const hasCSTDCS_Nam3 = danhHieuList.some(
            dh => dh.danh_hieu === 'CSTDCS' && dh.nam === nam_3
          );
          const hasNCKH_Nam3 = thanhTichList.some(tt => tt.nam === nam_3);

          // Nếu năm thứ 3 đã qua (nam_3 < currentYear) và chưa có đủ điều kiện, báo đã qua đợt đề xuất
          if (nam_3 < currentYear && !(hasCSTDCS_Nam3 && hasNCKH_Nam3 && hasBKBQP)) {
            goi_y = `Đã đủ điều kiện BKBQP (CSTDCS vào năm ${nam_1}, ${nam_2} và mỗi năm đều có NCKH).\nNăm ${nam_3} đã qua đợt đề xuất nhưng chưa có đủ điều kiện (CSTDCS, NCKH, BKBQP).`;
          } else if (hasCSTDCS_Nam3 && hasNCKH_Nam3 && hasBKBQP) {
            // Năm thứ 3 đã có CSTDCS + NCKH + BKBQP → đề xuất CSTDTQ vào năm thứ 4
            const missing = [];
            missing.push(`CSTDTQ vào năm ${nam_4}`);
            goi_y = `Đã đủ điều kiện BKBQP (CSTDCS vào năm ${nam_1}, ${nam_2} và mỗi năm đều có NCKH).\nNăm ${nam_3} đã có CSTDCS, NCKH và BKBQP.\nCần:\n${missing.join(
              '\n'
            )}.`;
          } else {
            // Năm thứ 3 chưa đủ điều kiện - chỉ gợi ý hoàn thành năm thứ 3, KHÔNG đề xuất CSTDTQ
            const missing = [];
            if (!hasBKBQP) {
              missing.push(`BKBQP vào năm ${nam_3}`);
            }
            if (!hasCSTDCS_Nam3) {
              missing.push(`CSTDCS vào năm ${nam_3}`);
            }
            if (!hasNCKH_Nam3) {
              missing.push(`NCKH vào năm ${nam_3}`);
            }
            // KHÔNG đề xuất CSTDTQ vào năm thứ 4 nếu năm thứ 3 chưa đủ điều kiện
            // Chỉ gợi ý hoàn thành năm thứ 3 để đủ điều kiện BKBQP
            // Chỉ khi đủ chuỗi 3 năm (năm 1, 2, 3) mới đề xuất CSTDTQ

            goi_y = `Đã đủ điều kiện BKBQP (CSTDCS vào năm ${nam_1}, ${nam_2} và mỗi năm đều có NCKH).\nCần:\n${missing.join(
              '\n'
            )}.`;
          }
        }
      } else if (cstdcs_lien_tuc === 1) {
        const nam_hien_tai = nam_cstdcs_lien_tuc[nam_cstdcs_lien_tuc.length - 1];
        const nam_tiep_theo = nam_hien_tai + 1;

        // Kiểm tra NCKH năm hiện tại
        const hasNCKH_NamHienTai = thanhTichList.some(tt => tt.nam === nam_hien_tai);

        const missing = [];
        if (!hasNCKH_NamHienTai) {
          missing.push(`NCKH vào năm ${nam_hien_tai}`);
        }
        missing.push(`CSTDCS vào năm ${nam_tiep_theo}`);
        missing.push(`NCKH vào năm ${nam_tiep_theo}`);
        missing.push(
          `BKBQP vào năm ${nam_tiep_theo} (sau khi có đủ 2 năm CSTDCS liên tục: ${nam_hien_tai} và ${nam_tiep_theo})`
        );

        const missingText = missing.length > 0 ? `Cần:\n${missing.join('\n')}.` : '';
        goi_y = `Đã có CSTDCS vào năm ${nam_hien_tai}.\n${missingText}`;
      } else if (cstdcs_lien_tuc === 0) {
        goi_y = 'Chưa có CSTDCS liên tục. Cần đạt CSTDCS để bắt đầu tính điều kiện khen thưởng.';
      } else {
        goi_y = 'Chưa có dữ liệu để tính toán. Vui lòng nhập danh hiệu và thành tích.';
      }

      // ==============================================
      // BƯỚC 5: Cập nhật Kết quả (Output)
      // ==============================================
      console.log(
        `💾 [recalculateAnnualProfile] Chuẩn bị lưu vào hoSoHangNam:`,
        JSON.stringify(
          {
            tong_cstdcs: tong_cstdcs_json,
            tong_nckh: tong_nckh_json,
            cstdcs_lien_tuc: cstdcs_lien_tuc,
            du_dieu_kien_bkbqp: du_dieu_kien_bkbqp,
            du_dieu_kien_cstdtq: du_dieu_kien_cstdtq,
            goi_y: goi_y,
          },
          null,
          2
        )
      );

      const hoSoHangNam = await prisma.hoSoHangNam.upsert({
        where: { quan_nhan_id: personnelId },
        update: {
          tong_cstdcs: tong_cstdcs, // Số lượng (Int)
          tong_nckh: tong_nckh, // Số lượng (Int)
          tong_cstdcs_json: tong_cstdcs_json, // Chi tiết dạng JSON
          tong_nckh_json: tong_nckh_json, // Chi tiết dạng JSON
          cstdcs_lien_tuc: cstdcs_lien_tuc,
          du_dieu_kien_bkbqp: du_dieu_kien_bkbqp,
          du_dieu_kien_cstdtq: du_dieu_kien_cstdtq,
          goi_y: goi_y,
        },
        create: {
          quan_nhan_id: personnelId,
          tong_cstdcs: tong_cstdcs, // Số lượng (Int)
          tong_nckh: tong_nckh, // Số lượng (Int)
          tong_cstdcs_json: tong_cstdcs_json, // Chi tiết dạng JSON
          tong_nckh_json: tong_nckh_json, // Chi tiết dạng JSON
          cstdcs_lien_tuc: cstdcs_lien_tuc,
          du_dieu_kien_bkbqp: du_dieu_kien_bkbqp,
          du_dieu_kien_cstdtq: du_dieu_kien_cstdtq,
          goi_y: goi_y,
        },
      });

      console.log(
        `✅ [recalculateAnnualProfile] Đã lưu hoSoHangNam thành công. ID: ${hoSoHangNam.id}`
      );
      console.log(
        `✅ [recalculateAnnualProfile] Dữ liệu đã lưu:`,
        JSON.stringify(
          {
            tong_cstdcs: hoSoHangNam.tong_cstdcs,
            tong_nckh: hoSoHangNam.tong_nckh,
            cstdcs_lien_tuc: hoSoHangNam.cstdcs_lien_tuc,
          },
          null,
          2
        )
      );

      return {
        success: true,
        message: 'Tính toán hồ sơ hằng năm thành công',
        data: hoSoHangNam,
      };
    } catch (error) {
      console.error('Lỗi khi tính toán hồ sơ hằng năm:', error);
      throw error;
    }
  }

  /**
   * Tính toán lại hồ sơ cho 1 quân nhân (CẢ NIÊN HẠN VÀ HẰNG NĂM)
   * @param {string} personnelId - ID quân nhân
   * @param {number} [year] - Năm để tính toán gợi ý (mặc định là null, sẽ dùng năm hiện tại)
   */
  async recalculateProfile(personnelId, year = null) {
    try {
      // Load tất cả dữ liệu cần thiết
      const personnel = await prisma.quanNhan.findUnique({
        where: { id: personnelId },
        include: {
          DanhHieuHangNam: {
            orderBy: { nam: 'desc' },
          },
          ThanhTichKhoaHoc: {
            where: { status: 'APPROVED' },
          },
          LichSuChucVu: {
            include: {
              ChucVu: true,
            },
          },
        },
      });

      if (!personnel) {
        throw new Error('Quân nhân không tồn tại');
      }

      // Lấy hồ sơ hiện tại (nếu có) để giữ status đã được Admin cập nhật
      const existingAnnualProfile = await prisma.hoSoHangNam.findUnique({
        where: { quan_nhan_id: personnelId },
      });

      const existingServiceProfile = await prisma.hoSoNienHan.findUnique({
        where: { quan_nhan_id: personnelId },
      });

      // ==============================================
      // TÍNH TOÁN HỒ SƠ HẰNG NĂM
      // ==============================================
      const annualProfileResult = await this.recalculateAnnualProfile(personnelId, year);

      // Lưu TẤT CẢ danh hiệu cá nhân hằng năm dạng JSON (CSTT, CSTDCS, BKBQP, CSTDTQ)
      // Lưu ý: recalculateAnnualProfile đã tính toán và lưu đúng, nên không cần tính lại ở đây
      // Chỉ cần lấy từ kết quả đã tính
      const tong_cstdcs_json = personnel.DanhHieuHangNam.filter(
        dh =>
          dh.danh_hieu === 'CSTDCS' ||
          dh.danh_hieu === 'CSTT' ||
          dh.danh_hieu === 'BKBQP' ||
          dh.danh_hieu === 'CSTDTQ'
      )
        .map(dh => ({
          nam: dh.nam,
          danh_hieu: dh.danh_hieu,
          so_quyet_dinh: dh.so_quyet_dinh || null,
          file_quyet_dinh: dh.file_quyet_dinh || null,
          nhan_bkbqp: dh.nhan_bkbqp || false,
          nhan_cstdtq: dh.nhan_cstdtq || false,
          so_quyet_dinh_bkbqp: dh.so_quyet_dinh_bkbqp || null,
          file_quyet_dinh_bkbqp: dh.file_quyet_dinh_bkbqp || null,
          so_quyet_dinh_cstdtq: dh.so_quyet_dinh_cstdtq || null,
          file_quyet_dinh_cstdtq: dh.file_quyet_dinh_cstdtq || null,
        }))
        .sort((a, b) => a.nam - b.nam);
      const CSTDCSCount = tong_cstdcs_json.length;

      // Lưu danh sách NCKH dạng JSON
      const tong_nckh_json = personnel.ThanhTichKhoaHoc.filter(tt =>
        ['NCKH', 'SKKH'].includes(tt.loai)
      )
        .map(tt => ({
          nam: tt.nam,
          loai: tt.loai,
          mo_ta: tt.mo_ta,
          status: tt.status,
          so_quyet_dinh: tt.so_quyet_dinh || null,
          file_quyet_dinh: tt.file_quyet_dinh || null,
        }))
        .sort((a, b) => a.nam - b.nam);
      const nckhCount = tong_nckh_json.length;

      // Xử lý trường hợp đặc biệt (Reset, đã nhận)
      const specialCase = this.handleSpecialCases(personnel.DanhHieuHangNam);

      // Tính số năm CSTDCS liên tục
      const CSTDCSLienTuc = this.calculateContinuousCSTDCS(personnel.DanhHieuHangNam);

      // Tính toán BKBQP
      const bkbqpResult = this.calculateBKBQP(
        CSTDCSLienTuc,
        personnel.DanhHieuHangNam,
        personnel.ThanhTichKhoaHoc
      );

      // Tính toán CSTDTQ
      const cstdtqResult = this.calculateCSTDTQ(
        CSTDCSLienTuc,
        bkbqpResult,
        personnel.DanhHieuHangNam,
        personnel.ThanhTichKhoaHoc
      );

      // Tổng hợp gợi ý
      let finalGoiYHangNam = '';
      if (specialCase.isSpecialCase) {
        finalGoiYHangNam = specialCase.goiY;
      } else if (cstdtqResult.duDieuKien) {
        finalGoiYHangNam = cstdtqResult.goiY;
      } else if (bkbqpResult.duDieuKien) {
        finalGoiYHangNam = bkbqpResult.goiY + ' ' + cstdtqResult.goiY;
      } else {
        finalGoiYHangNam = bkbqpResult.goiY;
      }

      // Cập nhật hoặc tạo mới hồ sơ hằng năm
      // Lưu ý: recalculateAnnualProfile đã lưu đúng dữ liệu với logic mới (2 năm BKBQP, 3 năm CSTDTQ)
      // Hàm này chỉ cập nhật các trường bổ sung nếu cần, nhưng tốt nhất là không ghi đè
      // Vì recalculateAnnualProfile đã tính toán chính xác hơn
      // Chỉ cập nhật nếu cần thiết (ví dụ: goi_y từ logic cũ)
      // Nhưng để tránh xung đột, chúng ta sẽ bỏ qua phần lưu này vì recalculateAnnualProfile đã lưu rồi
      // Nếu cần cập nhật goi_y từ logic cũ, có thể uncomment phần dưới:
      /*
      await prisma.hoSoHangNam.upsert({
        where: { quan_nhan_id: personnelId },
        update: {
          tong_cstdcs: CSTDCSCount, // Số lượng (Int)
          tong_nckh: nckhCount, // Số lượng (Int)
          tong_cstdcs_json: tong_cstdcs_json, // Chi tiết dạng JSON
          tong_nckh_json: tong_nckh_json, // Chi tiết dạng JSON
          cstdcs_lien_tuc: CSTDCSLienTuc,
          du_dieu_kien_bkbqp: bkbqpResult.duDieuKien,
          du_dieu_kien_cstdtq: cstdtqResult.duDieuKien,
          goi_y: finalGoiYHangNam,
        },
        create: {
          quan_nhan_id: personnelId,
          tong_cstdcs: CSTDCSCount, // Số lượng (Int)
          tong_nckh: nckhCount, // Số lượng (Int)
          tong_cstdcs_json: tong_cstdcs_json, // Chi tiết dạng JSON
          tong_nckh_json: tong_nckh_json, // Chi tiết dạng JSON
          cstdcs_lien_tuc: CSTDCSLienTuc,
          du_dieu_kien_bkbqp: bkbqpResult.duDieuKien,
          du_dieu_kien_cstdtq: cstdtqResult.duDieuKien,
          goi_y: finalGoiYHangNam,
        },
      });
      */

      // ==============================================
      // TÍNH TOÁN HỒ SƠ NIÊN HẠN
      // ==============================================
      await this.recalculateTenureProfile(personnelId);

      // ==============================================
      // TÍNH TOÁN HỒ SƠ CỐNG HIẾN
      // ==============================================
      await this.recalculateContributionProfile(personnelId);

      return { message: 'Tính toán lại hồ sơ thành công' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tính toán lại hồ sơ niên hạn cho 1 quân nhân (chỉ HCCSVV - Huân chương Chiến sỹ Vẻ vang)
   * @param {string} personnelId - ID quân nhân
   */
  async recalculateTenureProfile(personnelId) {
    try {
      // Load thông tin quân nhân
      const personnel = await prisma.quanNhan.findUnique({
        where: { id: personnelId },
      });

      if (!personnel) {
        throw new Error('Quân nhân không tồn tại');
      }

      // Lấy hồ sơ niên hạn hiện tại
      const existingProfile = await prisma.hoSoNienHan.findUnique({
        where: { quan_nhan_id: personnelId },
      });

      const khenthuonghccsvv = await prisma.khenThuongHCCSVV.findMany({
        where: { quan_nhan_id: personnelId },
      });

      // update status huân chương từ khen thưởng hccsvv
      for (const kt of khenthuonghccsvv) {
        if (kt.danh_hieu === 'HCCSVV_HANG_BA') {
          existingProfile.hccsvv_hang_ba_status = 'DA_NHAN';
        }
        if (kt.danh_hieu === 'HCCSVV_HANG_NHI') {
          existingProfile.hccsvv_hang_nhi_status = 'DA_NHAN';
        }
        if (kt.danh_hieu === 'HCCSVV_HANG_NHAT') {
          existingProfile.hccsvv_hang_nhat_status = 'DA_NHAN';
        }
      }

      // Tính HCCSVV (Huân chương Chiến sỹ Vẻ vang)
      // Logic thứ bậc: Phải NHẬN hạng thấp trước mới được đề xuất hạng cao
      const hccsvvBa = this.calculateHCCSVV(
        personnel.ngay_nhap_ngu,
        10,
        existingProfile.hccsvv_hang_ba_status || 'CHUA_DU',
        'Ba'
      );

      // Chỉ xét Hạng Nhì nếu ĐÃ NHẬN Hạng Ba (DA_NHAN)
      let hccsvvNhi;
      if (existingProfile.hccsvv_hang_ba_status === 'DA_NHAN') {
        hccsvvNhi = this.calculateHCCSVV(
          personnel.ngay_nhap_ngu,
          15,
          existingProfile.hccsvv_hang_nhi_status || 'CHUA_DU',
          'Nhì'
        );
      } else {
        hccsvvNhi = {
          status: 'CHUA_DU',
          ngay: null,
          goiY: '',
        };
      }

      // Chỉ xét Hạng Nhất nếu ĐÃ NHẬN Hạng Nhì (DA_NHAN)
      let hccsvvNhat;
      if (existingProfile.hccsvv_hang_nhi_status === 'DA_NHAN') {
        hccsvvNhat = this.calculateHCCSVV(
          personnel.ngay_nhap_ngu,
          20,
          existingProfile.hccsvv_hang_nhat_status || 'CHUA_DU',
          'Nhất'
        );
      } else {
        hccsvvNhat = {
          status: 'CHUA_DU',
          ngay: null,
          goiY: '',
        };
      }

      // Tổng hợp gợi ý niên hạn
      const goiYList = [];
      if (hccsvvBa.goiY) goiYList.push(hccsvvBa.goiY);
      if (hccsvvNhi.goiY) goiYList.push(hccsvvNhi.goiY);
      if (hccsvvNhat.goiY) goiYList.push(hccsvvNhat.goiY);

      const finalGoiY =
        goiYList.length > 0
          ? goiYList.join('\n')
          : 'Chưa đủ điều kiện xét huân chương Chiến sĩ Vẻ vang.';

      // Cập nhật hoặc tạo mới hồ sơ niên hạn
      await prisma.hoSoNienHan.upsert({
        where: { quan_nhan_id: personnelId },
        update: {
          hccsvv_hang_ba_status: hccsvvBa.status,
          hccsvv_hang_ba_ngay: hccsvvBa.ngay,
          hccsvv_hang_nhi_status: hccsvvNhi.status,
          hccsvv_hang_nhi_ngay: hccsvvNhi.ngay,
          hccsvv_hang_nhat_status: hccsvvNhat.status,
          hccsvv_hang_nhat_ngay: hccsvvNhat.ngay,
          goi_y: finalGoiY,
        },
        create: {
          quan_nhan_id: personnelId,
          hccsvv_hang_ba_status: hccsvvBa.status,
          hccsvv_hang_ba_ngay: hccsvvBa.ngay,
          hccsvv_hang_nhi_status: hccsvvNhi.status,
          hccsvv_hang_nhi_ngay: hccsvvNhi.ngay,
          hccsvv_hang_nhat_status: hccsvvNhat.status,
          hccsvv_hang_nhat_ngay: hccsvvNhat.ngay,
          goi_y: finalGoiY,
        },
      });
      return { message: 'Tính toán lại hồ sơ niên hạn thành công' };
    } catch (error) {
      console.error('Lỗi recalculateTenureProfile:', error);
      throw error;
    }
  }

  /**
   * Tính toán lại hồ sơ cống hiến cho 1 quân nhân (chỉ HCBVTQ - Huân chương Bảo vệ Tổ quốc)
   * @param {string} personnelId - ID quân nhân
   */
  async recalculateContributionProfile(personnelId) {
    try {
      // Load thông tin quân nhân và lịch sử chức vụ
      const personnel = await prisma.quanNhan.findUnique({
        where: { id: personnelId },
        include: {
          LichSuChucVu: {
            include: {
              ChucVu: true,
            },
            orderBy: {
              ngay_bat_dau: 'asc',
            },
          },
        },
      });

      if (!personnel) {
        throw new Error('Quân nhân không tồn tại');
      }

      // Lấy hồ sơ cống hiến hiện tại
      const existingProfile = await prisma.hoSoCongHien.findUnique({
        where: { quan_nhan_id: personnelId },
      });

      // Tính toán tổng số tháng công tác
      let totalMonths = 0;
      if (personnel.ngay_nhap_ngu) {
        const ngayNhapNgu = new Date(personnel.ngay_nhap_ngu);
        const ngayKetThuc = personnel.ngay_xuat_ngu
          ? new Date(personnel.ngay_xuat_ngu)
          : new Date();

        totalMonths = (ngayKetThuc.getFullYear() - ngayNhapNgu.getFullYear()) * 12;
        totalMonths += ngayKetThuc.getMonth() - ngayNhapNgu.getMonth();
        if (ngayKetThuc.getDate() < ngayNhapNgu.getDate()) {
          totalMonths--;
        }
        totalMonths = Math.max(0, totalMonths);
      }

      // Tính HCBVTQ dựa trên tổng số tháng công tác
      // Logic thứ bậc: Phải NHẬN hạng thấp trước mới được đề xuất hạng cao
      const hcbvtqBa = this.calculateHCBVTQ(
        totalMonths,
        120, // 10 năm
        existingProfile?.hcbvtq_hang_ba_status || 'CHUA_DU',
        'Ba'
      );

      // Chỉ xét Hạng Nhì nếu ĐÃ NHẬN Hạng Ba
      let hcbvtqNhi;
      if (existingProfile?.hcbvtq_hang_ba_status === 'DA_NHAN') {
        hcbvtqNhi = this.calculateHCBVTQ(
          totalMonths,
          180, // 15 năm
          existingProfile?.hcbvtq_hang_nhi_status || 'CHUA_DU',
          'Nhì'
        );
      } else {
        hcbvtqNhi = {
          status: 'CHUA_DU',
          ngay: null,
          goiY: '',
        };
      }

      // Chỉ xét Hạng Nhất nếu ĐÃ NHẬN Hạng Nhì
      let hcbvtqNhat;
      if (existingProfile?.hcbvtq_hang_nhi_status === 'DA_NHAN') {
        hcbvtqNhat = this.calculateHCBVTQ(
          totalMonths,
          240, // 20 năm
          existingProfile?.hcbvtq_hang_nhat_status || 'CHUA_DU',
          'Nhất'
        );
      } else {
        hcbvtqNhat = {
          status: 'CHUA_DU',
          ngay: null,
          goiY: '',
        };
      }

      // Tổng hợp gợi ý cống hiến
      const goiYList = [];
      if (hcbvtqBa.goiY) goiYList.push(hcbvtqBa.goiY);
      if (hcbvtqNhi.goiY) goiYList.push(hcbvtqNhi.goiY);
      if (hcbvtqNhat.goiY) goiYList.push(hcbvtqNhat.goiY);

      const finalGoiY =
        goiYList.length > 0
          ? goiYList.join('\n')
          : 'Chưa đủ điều kiện xét huân chương Bảo vệ Tổ quốc.';

      // Cập nhật hoặc tạo mới hồ sơ cống hiến
      await prisma.hoSoCongHien.upsert({
        where: { quan_nhan_id: personnelId },
        update: {
          hcbvtq_total_months: totalMonths,
          hcbvtq_hang_ba_status: hcbvtqBa.status,
          hcbvtq_hang_ba_ngay: hcbvtqBa.ngay,
          hcbvtq_hang_nhi_status: hcbvtqNhi.status,
          hcbvtq_hang_nhi_ngay: hcbvtqNhi.ngay,
          hcbvtq_hang_nhat_status: hcbvtqNhat.status,
          hcbvtq_hang_nhat_ngay: hcbvtqNhat.ngay,
          goi_y: finalGoiY,
        },
        create: {
          quan_nhan_id: personnelId,
          hcbvtq_total_months: totalMonths,
          hcbvtq_hang_ba_status: hcbvtqBa.status,
          hcbvtq_hang_ba_ngay: hcbvtqBa.ngay,
          hcbvtq_hang_nhi_status: hcbvtqNhi.status,
          hcbvtq_hang_nhi_ngay: hcbvtqNhi.ngay,
          hcbvtq_hang_nhat_status: hcbvtqNhat.status,
          hcbvtq_hang_nhat_ngay: hcbvtqNhat.ngay,
          goi_y: finalGoiY,
        },
      });

      // ============================================
      // ĐỒNG BỘ STATUS VÀO BẢNG KhenThuongCongHien
      // Kiểm tra và cập nhật status của huân chương đã có
      // ============================================

      const existingCongHien = await prisma.khenThuongCongHien.findUnique({
        where: { quan_nhan_id: personnelId },
      });

      if (existingCongHien) {
        // Xác định status dựa trên hạng đã nhận
        let updatedStatus = existingCongHien.danh_hieu;

        // Kiểm tra và cập nhật dữ liệu nếu cần
        // Ví dụ: Nếu đã đủ điều kiện hạng cao hơn, có thể cập nhật gợi ý
        await prisma.khenThuongCongHien.update({
          where: { id: existingCongHien.id },
          data: {
            // Cập nhật thời gian tính toán (nếu có thay đổi)
            thoi_gian_nhom_0_7: existingCongHien.thoi_gian_nhom_0_7,
            thoi_gian_nhom_0_8: existingCongHien.thoi_gian_nhom_0_8,
            thoi_gian_nhom_0_9_1_0: existingCongHien.thoi_gian_nhom_0_9_1_0,
          },
        });
      }

      return { message: 'Tính toán lại hồ sơ cống hiến thành công' };
    } catch (error) {
      console.error('Lỗi recalculateContributionProfile:', error);
      throw error;
    }
  }

  /**
   * Hàm helper tính toán HCBVTQ (Huân chương Bảo vệ Tổ quốc)
   * @param {number} totalMonths - Tổng số tháng công tác
   * @param {number} requiredMonths - Số tháng yêu cầu
   * @param {string} currentStatus - Trạng thái hiện tại
   * @param {string} rank - Hạng (Ba, Nhì, Nhất)
   */
  calculateHCBVTQ(totalMonths, requiredMonths, currentStatus, rank) {
    // Nếu đã nhận rồi, giữ nguyên trạng thái
    if (currentStatus === 'DA_NHAN') {
      return {
        status: 'DA_NHAN',
        ngay: null,
        goiY: '',
      };
    }

    // Kiểm tra đủ điều kiện
    if (totalMonths >= requiredMonths) {
      const years = Math.floor(totalMonths / 12);
      return {
        status: 'DU_DIEU_KIEN',
        ngay: new Date(), // Ngày đủ điều kiện
        goiY: `Đủ điều kiện xét Huân chương Bảo vệ Tổ quốc Hạng ${rank} (đã công tác ${years} năm).`,
      };
    }

    // Chưa đủ điều kiện
    const remainingMonths = requiredMonths - totalMonths;
    const remainingYears = Math.floor(remainingMonths / 12);
    const remainingMonthsOnly = remainingMonths % 12;

    return {
      status: 'CHUA_DU',
      ngay: null,
      goiY:
        remainingYears > 0
          ? `Còn ${remainingYears} năm ${remainingMonthsOnly} tháng nữa mới đủ điều kiện xét Huân chương Bảo vệ Tổ quốc Hạng ${rank}.`
          : `Còn ${remainingMonthsOnly} tháng nữa mới đủ điều kiện xét Huân chương Bảo vệ Tổ quốc Hạng ${rank}.`,
    };
  }

  /**
   * Tính toán lại cho toàn bộ quân nhân
   */
  async recalculateAll() {
    try {
      const allPersonnel = await prisma.quanNhan.findMany({
        select: { id: true },
      });

      let successCount = 0;
      let errorCount = 0;

      for (const personnel of allPersonnel) {
        try {
          await this.recalculateProfile(personnel.id);
          successCount++;
        } catch (error) {
          console.error(`Lỗi khi tính toán cho quân nhân ID ${personnel.id}:`, error.message);
          errorCount++;
        }
      }

      return {
        message: `Tính toán hoàn tất. Thành công: ${successCount}, Lỗi: ${errorCount}`,
        success: successCount,
        errors: errorCount,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy danh sách tất cả hồ sơ niên hạn (cho admin)
   */
  async getAllServiceProfiles() {
    try {
      const profiles = await prisma.hoSoNienHan.findMany({
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
        orderBy: {
          quan_nhan_id: 'asc',
        },
      });

      return profiles;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái hồ sơ niên hạn (ADMIN duyệt huân chương)
   */
  async updateServiceProfile(personnelId, updates) {
    try {
      const profile = await prisma.hoSoNienHan.findUnique({
        where: { quan_nhan_id: personnelId },
      });

      if (!profile) {
        throw new Error('Hồ sơ niên hạn không tồn tại');
      }

      // Validate và cập nhật
      const validStatuses = ['CHUA_DU', 'DU_DIEU_KIEN', 'DA_NHAN'];
      const updateData = {};

      // HCCSVV updates
      if (updates.hccsvv_hang_ba_status && validStatuses.includes(updates.hccsvv_hang_ba_status)) {
        updateData.hccsvv_hang_ba_status = updates.hccsvv_hang_ba_status;
      }
      if (
        updates.hccsvv_hang_nhi_status &&
        validStatuses.includes(updates.hccsvv_hang_nhi_status)
      ) {
        updateData.hccsvv_hang_nhi_status = updates.hccsvv_hang_nhi_status;
      }
      if (
        updates.hccsvv_hang_nhat_status &&
        validStatuses.includes(updates.hccsvv_hang_nhat_status)
      ) {
        updateData.hccsvv_hang_nhat_status = updates.hccsvv_hang_nhat_status;
      }

      // HCBVTQ updates
      if (updates.hcbvtq_hang_ba_status && validStatuses.includes(updates.hcbvtq_hang_ba_status)) {
        updateData.hcbvtq_hang_ba_status = updates.hcbvtq_hang_ba_status;
      }
      if (
        updates.hcbvtq_hang_nhi_status &&
        validStatuses.includes(updates.hcbvtq_hang_nhi_status)
      ) {
        updateData.hcbvtq_hang_nhi_status = updates.hcbvtq_hang_nhi_status;
      }
      if (
        updates.hcbvtq_hang_nhat_status &&
        validStatuses.includes(updates.hcbvtq_hang_nhat_status)
      ) {
        updateData.hcbvtq_hang_nhat_status = updates.hcbvtq_hang_nhat_status;
      }

      const updatedProfile = await prisma.hoSoNienHan.update({
        where: { quan_nhan_id: personnelId },
        data: updateData,
      });

      return updatedProfile;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProfileService();
