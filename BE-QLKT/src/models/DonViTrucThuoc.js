const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const DonViTrucThuoc = sequelize.define(
  "DonViTrucThuoc",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    co_quan_don_vi_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "ID cơ quan đơn vị",
      references: {
        model: "co_quan_don_vi",
        key: "id",
      },
      onDelete: "CASCADE",
      field: "co_quan_don_vi_id",
    },
    ma_don_vi: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    ten_don_vi: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    so_luong: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "createdAt",
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "updatedAt",
    },
  },
  {
    tableName: "don_vi_truc_thuoc",
    timestamps: true,
  }
);

module.exports = DonViTrucThuoc;
