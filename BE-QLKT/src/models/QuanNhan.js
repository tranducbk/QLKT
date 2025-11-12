const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const QuanNhan = sequelize.define(
  "QuanNhan",
  {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
      autoIncrement: true,
  },
  cccd: {
    type: DataTypes.STRING(20),
    allowNull: false,
      unique: true,
  },
  ho_ten: {
    type: DataTypes.STRING(255),
      allowNull: false,
  },
  ngay_sinh: {
    type: DataTypes.DATEONLY,
      allowNull: true,
    },
    que_quan_2_cap: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Quê quán 2 cấp: Xã Hoà An, tỉnh Ninh Bình",
    },
    que_quan_3_cap: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Quê quán 3 cấp: Xã An Hoà, huyện Yên Bình, tỉnh Nam Định",
    },
    tru_quan: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Trú quán 2 cấp: Xã Hoà An, tỉnh Ninh Bình",
    },
    cho_o_hien_nay: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Chỗ ở hiện nay 2 cấp: Xã Hoà An, tỉnh Ninh Bình",
    },
    co_quan_don_vi: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment:
        "JSON lưu thông tin cơ quan đơn vị: {don_vi_cap_tren, co_quan_don_vi, tap_the}",
  },
  ngay_nhap_ngu: {
    type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Phục vụ cho tính thời gian cống hiến",
    },
    ngay_xuat_ngu: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment:
        "Phục vụ cho tính thời gian để nhận Kỷ niệm chương (20 năm nữ, 25 năm nam)",
    },
    ngay_vao_dang: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Ngày vào Đảng",
    },
    ngay_vao_dang_chinh_thuc: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Ngày vào Đảng chính thức",
    },
    so_the_dang_vien: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Số thẻ Đảng viên",
    },
    so_dien_thoai: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Số điện thoại",
  },
  don_vi_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: "don_vi",
        key: "id",
    },
      onDelete: "CASCADE",
  },
  chuc_vu_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: "chuc_vu",
        key: "id",
    },
      onDelete: "RESTRICT",
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
      field: "createdat",
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
      field: "updatedat",
    },
  },
  {
    tableName: "quan_nhan",
    timestamps: true,
  }
);

module.exports = QuanNhan;
