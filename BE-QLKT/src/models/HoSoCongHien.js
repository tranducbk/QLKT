const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const HoSoCongHien = sequelize.define(
  'HoSoCongHien',
  {
    id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    quan_nhan_id: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      references: {
        model: 'quan_nhan',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    // Huân chương Bảo vệ Tổ quốc (HCBVTQ - Cống hiến)
    hcbvtq_total_months: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Tổng số tháng công tác',
    },
    hcbvtq_hang_ba_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'CHUA_DU',
      comment: 'CHUA_DU, DU_DIEU_KIEN, DA_NHAN',
    },
    hcbvtq_hang_ba_ngay: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    hcbvtq_hang_nhi_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'CHUA_DU',
    },
    hcbvtq_hang_nhi_ngay: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    hcbvtq_hang_nhat_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'CHUA_DU',
    },
    hcbvtq_hang_nhat_ngay: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    goi_y: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'createdat',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updatedat',
    },
  },
  {
    tableName: 'ho_so_cong_hien',
    timestamps: true,
  }
);

module.exports = HoSoCongHien;
