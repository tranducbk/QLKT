// ============================================
// PRISMA CLIENT
// ============================================
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// ============================================
// SEQUELIZE MODELS
// ============================================
const sequelize = require('./database');

// Import models
const DonVi = require('./DonVi');
const NhomCongHien = require('./NhomCongHien');
const ChucVu = require('./ChucVu');
const QuanNhan = require('./QuanNhan');
const TaiKhoan = require('./TaiKhoan');
const LichSuChucVu = require('./LichSuChucVu');
const ThanhTichKhoaHoc = require('./ThanhTichKhoaHoc');
const DanhHieuHangNam = require('./DanhHieuHangNam');
const HoSoNienHan = require('./HoSoNienHan');
const HoSoHangNam = require('./HoSoHangNam');
const ThongBao = require('./ThongBao');
const TheoDoiKhenThuongDonVi = require('./TheoDoiKhenThuongDonVi');

// ============================================
// SEQUELIZE RELATIONSHIPS
// ============================================

// DonVi relationships
DonVi.hasMany(ChucVu, { foreignKey: 'don_vi_id', as: 'chucVu' });
DonVi.hasMany(QuanNhan, { foreignKey: 'don_vi_id', as: 'quanNhan' });
DonVi.hasMany(TheoDoiKhenThuongDonVi, { foreignKey: 'don_vi_id', as: 'theoDoiKhenThuong' });

// NhomCongHien relationships
NhomCongHien.hasMany(ChucVu, { foreignKey: 'nhom_cong_hien_id', as: 'chucVu' });

// ChucVu relationships
ChucVu.belongsTo(DonVi, { foreignKey: 'don_vi_id', as: 'donVi' });
ChucVu.belongsTo(NhomCongHien, { foreignKey: 'nhom_cong_hien_id', as: 'nhomCongHien' });
ChucVu.hasMany(QuanNhan, { foreignKey: 'chuc_vu_id', as: 'quanNhan' });
ChucVu.hasMany(LichSuChucVu, { foreignKey: 'chuc_vu_id', as: 'lichSuChucVu' });

// QuanNhan relationships
QuanNhan.belongsTo(DonVi, { foreignKey: 'don_vi_id', as: 'donVi' });
QuanNhan.belongsTo(ChucVu, { foreignKey: 'chuc_vu_id', as: 'chucVu' });
QuanNhan.hasOne(TaiKhoan, { foreignKey: 'quan_nhan_id', as: 'taiKhoan' });
QuanNhan.hasMany(LichSuChucVu, { foreignKey: 'quan_nhan_id', as: 'lichSuChucVu' });
QuanNhan.hasMany(ThanhTichKhoaHoc, { foreignKey: 'quan_nhan_id', as: 'thanhTichKhoaHoc' });
QuanNhan.hasMany(DanhHieuHangNam, { foreignKey: 'quan_nhan_id', as: 'danhHieuHangNam' });
QuanNhan.hasOne(HoSoNienHan, { foreignKey: 'quan_nhan_id', as: 'hoSoNienHan' });
QuanNhan.hasOne(HoSoHangNam, { foreignKey: 'quan_nhan_id', as: 'hoSoHangNam' });

// TaiKhoan relationships
TaiKhoan.belongsTo(QuanNhan, { foreignKey: 'quan_nhan_id', as: 'quanNhan' });
TaiKhoan.hasMany(ThongBao, { foreignKey: 'recipient_id', as: 'thongBao' });

// LichSuChucVu relationships
LichSuChucVu.belongsTo(QuanNhan, { foreignKey: 'quan_nhan_id', as: 'quanNhan' });
LichSuChucVu.belongsTo(ChucVu, { foreignKey: 'chuc_vu_id', as: 'chucVu' });

// ThanhTichKhoaHoc relationships
ThanhTichKhoaHoc.belongsTo(QuanNhan, { foreignKey: 'quan_nhan_id', as: 'quanNhan' });

// DanhHieuHangNam relationships
DanhHieuHangNam.belongsTo(QuanNhan, { foreignKey: 'quan_nhan_id', as: 'quanNhan' });

// HoSoNienHan relationships
HoSoNienHan.belongsTo(QuanNhan, { foreignKey: 'quan_nhan_id', as: 'quanNhan' });

// HoSoHangNam relationships
HoSoHangNam.belongsTo(QuanNhan, { foreignKey: 'quan_nhan_id', as: 'quanNhan' });

// ThongBao relationships
ThongBao.belongsTo(TaiKhoan, { foreignKey: 'recipient_id', as: 'nguoiNhan' });

// TheoDoiKhenThuongDonVi relationships
TheoDoiKhenThuongDonVi.belongsTo(DonVi, { foreignKey: 'don_vi_id', as: 'donVi' });
TheoDoiKhenThuongDonVi.belongsTo(TaiKhoan, { foreignKey: 'nguoi_tao_id', as: 'nguoiTao' });
TaiKhoan.hasMany(TheoDoiKhenThuongDonVi, {
  foreignKey: 'nguoi_tao_id',
  as: 'theoDoiKhenThuongTao',
});

// ============================================
// EXPORTS
// ============================================

// Export Prisma
module.exports.prisma = prisma;

// Export Sequelize instance
module.exports.sequelize = sequelize;

// Export Sequelize models
module.exports.DonVi = DonVi;
module.exports.NhomCongHien = NhomCongHien;
module.exports.ChucVu = ChucVu;
module.exports.QuanNhan = QuanNhan;
module.exports.TaiKhoan = TaiKhoan;
module.exports.LichSuChucVu = LichSuChucVu;
module.exports.ThanhTichKhoaHoc = ThanhTichKhoaHoc;
module.exports.DanhHieuHangNam = DanhHieuHangNam;
module.exports.HoSoNienHan = HoSoNienHan;
module.exports.HoSoHangNam = HoSoHangNam;
module.exports.ThongBao = ThongBao;
module.exports.TheoDoiKhenThuongDonVi = TheoDoiKhenThuongDonVi;
