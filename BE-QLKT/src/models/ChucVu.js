const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const ChucVu = sequelize.define('ChucVu', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  co_quan_don_vi_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'co_quan_don_vi',
      key: 'id'
    },
    onDelete: 'CASCADE',
    field: 'co_quan_don_vi_id'
  },
  don_vi_truc_thuoc_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'don_vi_truc_thuoc',
      key: 'id'
    },
    onDelete: 'CASCADE',
    field: 'don_vi_truc_thuoc_id'
  },
  ten_chuc_vu: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  is_manager: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  he_so_luong: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Hệ số lương'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'createdAt'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updatedAt'
  }
}, {
  tableName: 'chuc_vu',
  timestamps: true,
  // Unique constraints đã được tạo ở database level trong migration script
  // Sequelize không hỗ trợ partial unique indexes với WHERE clause
});

module.exports = ChucVu;
