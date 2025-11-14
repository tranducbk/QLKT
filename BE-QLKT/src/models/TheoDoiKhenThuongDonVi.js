const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const TheoDoiKhenThuongDonVi = sequelize.define(
  'TheoDoiKhenThuongDonVi',
  {
    id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
    },
    co_quan_don_vi_id: {
      type: DataTypes.STRING(30),
      allowNull: true,
      references: {
        model: 'co_quan_don_vi',
        key: 'id',
      },
      onDelete: 'CASCADE',
      comment: 'ID cơ quan đơn vị được khen thưởng (nullable)',
    },
    don_vi_truc_thuoc_id: {
      type: DataTypes.STRING(30),
      allowNull: true,
      references: {
        model: 'don_vi_truc_thuoc',
        key: 'id',
      },
      onDelete: 'CASCADE',
      comment: 'ID đơn vị trực thuộc được khen thưởng (nullable)',
    },
    nam: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Năm khen thưởng',
    },
    danh_hieu: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Danh hiệu: ĐVQT, ĐVTT, BKBQP, BKTTCP',
    },
    ten_don_vi: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Tên đơn vị (lưu để dễ query)',
    },
    ma_don_vi: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Mã đơn vị (lưu để dễ query)',
    },
    co_quan_don_vi_cha_id: {
      type: DataTypes.STRING(30),
      allowNull: true,
      references: {
        model: 'co_quan_don_vi',
        key: 'id',
      },
      onDelete: 'SET NULL',
      comment: 'ID cơ quan đơn vị cha (null nếu là đơn vị cha)',
    },
    so_quyet_dinh: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Số quyết định khen thưởng',
    },
    ten_file_pdf: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Tên file PDF quyết định (nếu có)',
    },
    so_nam_lien_tuc: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Số năm đạt tiêu chí liên tục đến năm hiện tại',
    },
    du_dieu_kien_bk_tong_cuc: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Đủ điều kiện 3 năm (đề xuất/đạt Bằng khen Tổng cục)',
    },
    du_dieu_kien_bk_thu_tuong: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Đủ điều kiện 5 năm (đề xuất/đạt Bằng khen Thủ tướng)',
    },
    goi_y: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Gợi ý nếu đủ điều kiện nhưng chưa nhận',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'PENDING',
      comment: 'PENDING, APPROVED, REJECTED',
    },
    nguoi_tao_id: {
      type: DataTypes.STRING(30),
      allowNull: false,
      references: {
        model: 'tai_khoan',
        key: 'id',
      },
      onDelete: 'CASCADE',
      comment: 'ID người tạo (Admin phê duyệt)',
    },
    nguoi_duyet_id: {
      type: DataTypes.STRING(30),
      allowNull: true,
      references: {
        model: 'tai_khoan',
        key: 'id',
      },
      onDelete: 'SET NULL',
      comment: 'ID Admin duyệt',
    },
    ngay_duyet: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Ngày duyệt',
    },
    ghi_chu: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ghi chú bổ sung',
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
    tableName: 'theo_doi_khen_thuong_don_vi',
    timestamps: true,
    indexes: [
      {
        fields: ['co_quan_don_vi_id', 'nam'],
        unique: true,
        name: 'unique_co_quan_don_vi_nam',
      },
      {
        fields: ['don_vi_truc_thuoc_id', 'nam'],
        unique: true,
        name: 'unique_don_vi_truc_thuoc_nam',
      },
      {
        fields: ['co_quan_don_vi_id', 'nam'],
      },
      {
        fields: ['don_vi_truc_thuoc_id', 'nam'],
      },
    ],
  }
);

module.exports = TheoDoiKhenThuongDonVi;
