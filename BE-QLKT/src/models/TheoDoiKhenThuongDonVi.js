const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const TheoDoiKhenThuongDonVi = sequelize.define(
  'TheoDoiKhenThuongDonVi',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    don_vi_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'don_vi',
        key: 'id',
      },
      onDelete: 'CASCADE',
      comment: 'ID đơn vị được khen thưởng',
    },
    nam: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Năm khen thưởng',
    },
    // Theo dõi điều kiện 3 năm/5 năm chỉ áp dụng hằng năm
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
    tong_so_quan_nhan: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Tổng số quân nhân được khen thưởng',
    },
    chi_tiet: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Chi tiết khen thưởng (JSON): danh sách quân nhân, loại khen thưởng, v.v.',
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
      comment: 'Đủ điều kiện 3 năm để đề xuất/đạt Bằng khen Tổng cục',
    },
    du_dieu_kien_bk_thu_tuong: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Đủ điều kiện 5 năm để đề xuất/đạt Bằng khen Thủ tướng',
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
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tai_khoan',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      comment: 'ID người tạo bản ghi (thường là Admin phê duyệt đề xuất)',
    },
    nguoi_duyet_id: {
      type: DataTypes.INTEGER,
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
      comment: 'Thời gian duyệt',
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
        fields: ['don_vi_id', 'nam'],
        unique: true,
        name: 'unique_don_vi_nam',
      },
      {
        fields: ['don_vi_id', 'nam'],
      },
    ],
  }
);

module.exports = TheoDoiKhenThuongDonVi;
