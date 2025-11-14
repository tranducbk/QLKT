/**
 * Script đồng bộ file quyết định từ các bảng đề xuất, danh hiệu, thành tích vào bảng FileQuyetDinh
 *
 * Chạy: node src/scripts/syncDecisions.js
 */

require('dotenv').config();
const { PrismaClient } = require('../generated/prisma');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function syncDecisions() {
  console.log('🔄 Bắt đầu đồng bộ quyết định...\n');

  let syncedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors = [];

  try {
    // ============================================
    // 1. ĐỒNG BỘ TỪ DANH HIỆU HẰNG NĂM
    // ============================================
    console.log('📋 Đang đồng bộ từ DanhHieuHangNam...');

    const danhHieuList = await prisma.danhHieuHangNam.findMany({
      where: {
        OR: [
          { so_quyet_dinh: { not: null } },
          { so_quyet_dinh_bkbqp: { not: null } },
          { so_quyet_dinh_cstdtq: { not: null } },
        ],
      },
      include: {
        QuanNhan: {
          select: {
            id: true,
            ho_ten: true,
          },
        },
      },
    });

    const decisionMap = new Map(); // Map để tránh trùng lặp: so_quyet_dinh -> decision data

    for (const danhHieu of danhHieuList) {
      // Xử lý số quyết định chính (CSTT/CSTDCS)
      if (danhHieu.so_quyet_dinh) {
        const key = danhHieu.so_quyet_dinh;
        if (!decisionMap.has(key)) {
          decisionMap.set(key, {
            so_quyet_dinh: danhHieu.so_quyet_dinh,
            nam: danhHieu.nam,
            file_path: danhHieu.file_quyet_dinh,
            loai_khen_thuong: 'CA_NHAN_HANG_NAM',
            ngay_ky: null, // Sẽ để null, admin cần cập nhật sau
            nguoi_ky: null, // Sẽ để null, admin cần cập nhật sau
          });
        }
      }

      // Xử lý số quyết định BKBQP
      if (danhHieu.so_quyet_dinh_bkbqp) {
        const key = danhHieu.so_quyet_dinh_bkbqp;
        if (!decisionMap.has(key)) {
          decisionMap.set(key, {
            so_quyet_dinh: danhHieu.so_quyet_dinh_bkbqp,
            nam: danhHieu.nam,
            file_path: danhHieu.file_quyet_dinh_bkbqp,
            loai_khen_thuong: 'CA_NHAN_HANG_NAM',
            ngay_ky: null,
            nguoi_ky: null,
          });
        }
      }

      // Xử lý số quyết định CSTDTQ
      if (danhHieu.so_quyet_dinh_cstdtq) {
        const key = danhHieu.so_quyet_dinh_cstdtq;
        if (!decisionMap.has(key)) {
          decisionMap.set(key, {
            so_quyet_dinh: danhHieu.so_quyet_dinh_cstdtq,
            nam: danhHieu.nam,
            file_path: danhHieu.file_quyet_dinh_cstdtq,
            loai_khen_thuong: 'CA_NHAN_HANG_NAM',
            ngay_ky: null,
            nguoi_ky: null,
          });
        }
      }
    }

    console.log(`   Tìm thấy ${decisionMap.size} quyết định từ DanhHieuHangNam`);

    // ============================================
    // 2. ĐỒNG BỘ TỪ THÀNH TÍCH KHOA HỌC
    // ============================================
    console.log('📋 Đang đồng bộ từ ThanhTichKhoaHoc...');

    const thanhTichList = await prisma.thanhTichKhoaHoc.findMany({
      where: {
        so_quyet_dinh: { not: null },
      },
      include: {
        QuanNhan: {
          select: {
            id: true,
            ho_ten: true,
          },
        },
      },
    });

    for (const thanhTich of thanhTichList) {
      if (thanhTich.so_quyet_dinh) {
        const key = thanhTich.so_quyet_dinh;
        if (!decisionMap.has(key)) {
          decisionMap.set(key, {
            so_quyet_dinh: thanhTich.so_quyet_dinh,
            nam: thanhTich.nam,
            file_path: thanhTich.file_quyet_dinh,
            loai_khen_thuong: 'NCKH',
            ngay_ky: null,
            nguoi_ky: null,
          });
        }
      }
    }

    console.log(`   Tìm thấy ${thanhTichList.length} thành tích có số quyết định`);

    // ============================================
    // 3. ĐỒNG BỘ TỪ BẢNG ĐỀ XUẤT (BangDeXuat)
    // ============================================
    console.log('📋 Đang đồng bộ từ BangDeXuat...');

    const proposals = await prisma.bangDeXuat.findMany({
      where: {
        status: 'APPROVED',
        OR: [{ so_quyet_dinh_goc: { not: null } }, { ten_file_pdf: { not: null } }],
      },
      include: {
        NguoiDuyet: {
          select: {
            QuanNhan: {
              select: {
                ho_ten: true,
              },
            },
          },
        },
      },
    });

    for (const proposal of proposals) {
      // Lấy số quyết định từ so_quyet_dinh_goc hoặc từ data_danh_hieu/data_thanh_tich
      if (proposal.so_quyet_dinh_goc) {
        const key = proposal.so_quyet_dinh_goc;
        if (!decisionMap.has(key)) {
          // Lấy ngày ký từ ngay_duyet (có thể dùng làm ngày ký)
          const ngayKy = proposal.ngay_duyet ? new Date(proposal.ngay_duyet) : null;
          const nguoiKy = proposal.NguoiDuyet?.QuanNhan?.ho_ten || null;

          decisionMap.set(key, {
            so_quyet_dinh: proposal.so_quyet_dinh_goc,
            nam: proposal.nam,
            file_path: proposal.ten_file_pdf,
            loai_khen_thuong: proposal.loai_de_xuat === 'NCKH' ? 'NCKH' : 'CA_NHAN_HANG_NAM',
            ngay_ky: ngayKy,
            nguoi_ky: nguoiKy,
          });
        }
      }

      // Lấy số quyết định từ data_danh_hieu và data_thanh_tich
      if (proposal.data_danh_hieu && Array.isArray(proposal.data_danh_hieu)) {
        for (const item of proposal.data_danh_hieu) {
          if (item.so_quyet_dinh) {
            const key = item.so_quyet_dinh;
            if (!decisionMap.has(key)) {
              const ngayKy = proposal.ngay_duyet ? new Date(proposal.ngay_duyet) : null;
              const nguoiKy = proposal.NguoiDuyet?.QuanNhan?.ho_ten || null;

              decisionMap.set(key, {
                so_quyet_dinh: item.so_quyet_dinh,
                nam: item.nam || proposal.nam,
                file_path: item.file_quyet_dinh || null,
                loai_khen_thuong: 'CA_NHAN_HANG_NAM',
                ngay_ky: ngayKy,
                nguoi_ky: nguoiKy,
              });
            }
          }
        }
      }

      if (proposal.data_thanh_tich && Array.isArray(proposal.data_thanh_tich)) {
        for (const item of proposal.data_thanh_tich) {
          if (item.so_quyet_dinh) {
            const key = item.so_quyet_dinh;
            if (!decisionMap.has(key)) {
              const ngayKy = proposal.ngay_duyet ? new Date(proposal.ngay_duyet) : null;
              const nguoiKy = proposal.NguoiDuyet?.QuanNhan?.ho_ten || null;

              decisionMap.set(key, {
                so_quyet_dinh: item.so_quyet_dinh,
                nam: item.nam || proposal.nam,
                file_path: item.file_quyet_dinh || null,
                loai_khen_thuong: 'NCKH',
                ngay_ky: ngayKy,
                nguoi_ky: nguoiKy,
              });
            }
          }
        }
      }
    }

    console.log(`   Tìm thấy ${proposals.length} đề xuất đã được phê duyệt`);

    // ============================================
    // 4. LƯU VÀO BẢNG QUYETDINH KHENTHUONG
    // ============================================
    console.log(`\n💾 Đang lưu ${decisionMap.size} quyết định vào bảng FileQuyetDinh...\n`);

    for (const [soQuyetDinh, decisionData] of decisionMap.entries()) {
      try {
        // Kiểm tra xem quyết định đã tồn tại chưa
        const existing = await prisma.fileQuyetDinh.findUnique({
          where: { so_quyet_dinh: soQuyetDinh },
        });

        if (existing) {
          // Cập nhật nếu thiếu thông tin
          const updateData = {};
          if (!existing.ngay_ky && decisionData.ngay_ky) {
            updateData.ngay_ky = decisionData.ngay_ky;
          }
          if (!existing.nguoi_ky && decisionData.nguoi_ky) {
            updateData.nguoi_ky = decisionData.nguoi_ky;
          }
          if (!existing.file_path && decisionData.file_path) {
            updateData.file_path = decisionData.file_path;
          }
          if (!existing.loai_khen_thuong && decisionData.loai_khen_thuong) {
            updateData.loai_khen_thuong = decisionData.loai_khen_thuong;
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.fileQuyetDinh.update({
              where: { so_quyet_dinh: soQuyetDinh },
              data: updateData,
            });
            console.log(`   ✓ Cập nhật: ${soQuyetDinh}`);
            syncedCount++;
          } else {
            skippedCount++;
          }
        } else {
          // Tạo mới
          // Nếu thiếu ngày ký hoặc người ký, dùng giá trị mặc định
          const ngayKy = decisionData.ngay_ky || new Date();
          const nguoiKy = decisionData.nguoi_ky || 'Chưa cập nhật';

          await prisma.fileQuyetDinh.create({
            data: {
              id: uuidv4(),
              so_quyet_dinh: decisionData.so_quyet_dinh,
              nam: decisionData.nam,
              ngay_ky: ngayKy,
              nguoi_ky: nguoiKy,
              file_path: decisionData.file_path,
              loai_khen_thuong: decisionData.loai_khen_thuong,
              ghi_chu: `Đồng bộ tự động từ hệ thống - ${new Date().toISOString()}`,
            },
          });
          console.log(`   ✓ Tạo mới: ${soQuyetDinh} (${decisionData.loai_khen_thuong || 'N/A'})`);
          syncedCount++;
        }
      } catch (error) {
        errorCount++;
        errors.push({
          so_quyet_dinh: soQuyetDinh,
          error: error.message,
        });
        console.error(`   ✗ Lỗi: ${soQuyetDinh} - ${error.message}`);
      }
    }

    // ============================================
    // KẾT QUẢ
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 KẾT QUẢ ĐỒNG BỘ:');
    console.log('='.repeat(60));
    console.log(`✓ Đã đồng bộ: ${syncedCount} quyết định`);
    console.log(`⊘ Đã bỏ qua: ${skippedCount} quyết định (đã tồn tại và đầy đủ)`);
    console.log(`✗ Lỗi: ${errorCount} quyết định`);

    if (errors.length > 0) {
      console.log('\n❌ Chi tiết lỗi:');
      errors.forEach(err => {
        console.log(`   - ${err.so_quyet_dinh}: ${err.error}`);
      });
    }

    console.log('\n✅ Hoàn thành đồng bộ quyết định!\n');
  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
if (require.main === module) {
  syncDecisions()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { syncDecisions };
