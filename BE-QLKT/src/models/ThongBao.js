const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const ThongBao = sequelize.define(
  "ThongBao",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    nguoi_nhan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "tai_khoan",
        key: "id",
      },
      onDelete: "CASCADE",
      comment: "ID người nhận thông báo",
      field: "nguoi_nhan_id",
    },
    recipient_role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "SUPER_ADMIN, ADMIN, MANAGER, USER",
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "NEW_PERSONNEL, APPROVAL_PENDING, ACHIEVEMENT_SUBMITTED, etc.",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Tiêu đề thông báo",
    },
    message: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: "Nội dung thông báo",
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "personnel, achievements, proposals, etc.",
    },
    tai_nguyen_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "ID của tài nguyên liên quan",
      field: "tai_nguyen_id",
    },
    link: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "URL để navigate đến",
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Đã đọc chưa",
    },
    nhat_ky_he_thong_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "system_logs",
        key: "id",
      },
      onDelete: "SET NULL",
      comment: "ID của system log liên quan (nếu có)",
      field: "nhat_ky_he_thong_id",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "read_at",
      comment: "Thời gian đọc",
    },
  },
  {
    tableName: "notifications",
    timestamps: false,
    indexes: [
      {
        fields: ["nguoi_nhan_id", "is_read", "created_at"],
      },
      {
        fields: ["recipient_role", "is_read", "created_at"],
      },
      {
        fields: ["type", "created_at"],
      },
    ],
  }
);

module.exports = ThongBao;
