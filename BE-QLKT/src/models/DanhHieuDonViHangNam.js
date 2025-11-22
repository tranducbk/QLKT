const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const DanhHieuDonViHangNam = sequelize.define(
  'DanhHieuDonViHangNam',
  {
    id: { type: DataTypes.STRING(30), primaryKey: true },
    co_quan_don_vi_id: {
      type: DataTypes.STRING(30),
      allowNull: true,
      references: { model: 'co_quan_don_vi', key: 'id' },
      onDelete: 'CASCADE',
    },
    don_vi_truc_thuoc_id: {
      type: DataTypes.STRING(30),
      allowNull: true,
      references: { model: 'don_vi_truc_thuoc', key: 'id' },
      onDelete: 'CASCADE',
    },
    nam: { type: DataTypes.INTEGER, allowNull: false },
    danh_hieu: { type: DataTypes.STRING(50), allowNull: true },
    so_quyet_dinh: { type: DataTypes.STRING(100), allowNull: true },
    file_quyet_dinh: { type: DataTypes.STRING(255), allowNull: true },
    nhan_bkbqp: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    so_quyet_dinh_bkbqp: { type: DataTypes.STRING(100), allowNull: true },
    file_quyet_dinh_bkbqp: { type: DataTypes.STRING(500), allowNull: true },
    nhan_bkttcp: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    so_quyet_dinh_bkttcp: { type: DataTypes.STRING(100), allowNull: true },
    file_quyet_dinh_bkttcp: { type: DataTypes.STRING(500), allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'PENDING' },
    nguoi_tao_id: {
      type: DataTypes.STRING(30),
      allowNull: false,
      references: { model: 'tai_khoan', key: 'id' },
    },
    nguoi_duyet_id: {
      type: DataTypes.STRING(30),
      allowNull: true,
      references: { model: 'tai_khoan', key: 'id' },
    },
    ngay_duyet: { type: DataTypes.DATE, allowNull: true },
    ghi_chu: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'createdat' },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updatedat' },
  },
  {
    tableName: 'danh_hieu_don_vi_hang_nam',
    timestamps: true,
    indexes: [
      { fields: ['co_quan_don_vi_id', 'nam'], unique: true, name: 'unique_co_quan_don_vi_nam_dh' },
      {
        fields: ['don_vi_truc_thuoc_id', 'nam'],
        unique: true,
        name: 'unique_don_vi_truc_thuoc_nam_dh',
      },
    ],
  }
);

module.exports = DanhHieuDonViHangNam;
