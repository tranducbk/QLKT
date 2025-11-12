const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const CoQuanDonVi = sequelize.define(
  "CoQuanDonVi",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
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
    tableName: "co_quan_don_vi",
    timestamps: true,
  }
);

module.exports = CoQuanDonVi;
