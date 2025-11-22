const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const HoSoDonViHangNam = sequelize.define(
  'HoSoDonViHangNam',
  {
    id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
    },
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
    tong_dvqt: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    tong_dvqt_json: { type: DataTypes.JSON, allowNull: true },
    dvqt_lien_tuc: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    du_dieu_kien_bk_tong_cuc: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    du_dieu_kien_bk_thu_tuong: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    goi_y: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'createdat' },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updatedat' },
  },
  {
    tableName: 'ho_so_don_vi_hang_nam',
    timestamps: true,
    indexes: [
      { fields: ['co_quan_don_vi_id', 'nam'], unique: true, name: 'unique_co_quan_don_vi_nam' },
      {
        fields: ['don_vi_truc_thuoc_id', 'nam'],
        unique: true,
        name: 'unique_don_vi_truc_thuoc_nam',
      },
    ],
  }
);

module.exports = HoSoDonViHangNam;
