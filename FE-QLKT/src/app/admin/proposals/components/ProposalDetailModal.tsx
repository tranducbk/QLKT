'use client';

import { Modal, Descriptions, Tag, Table, Button, Space, Typography, Divider } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface Proposal {
  id: string;
  loai_de_xuat: string;
  nam: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  ngay_duyet?: string;
  rejection_reason?: string;
  file_path?: string;
  ghi_chu?: string;
  NguoiDeXuat?: {
    QuanNhan?: {
      ho_ten: string;
    };
    username: string;
  };
  CoQuanDonVi?: {
    ten_don_vi: string;
  };
  DonViTrucThuoc?: {
    ten_don_vi: string;
  };
  NguoiDuyet?: {
    QuanNhan?: {
      ho_ten: string;
    };
    username: string;
  };
  data_danh_hieu?: any[];
  title_data?: any[];
  selected_personnel?: string[];
}

interface ProposalDetailModalProps {
  visible: boolean;
  proposal: Proposal;
  onClose: () => void;
  onReject?: () => void;
  onApprove?: () => void;
}

export default function ProposalDetailModal({
  visible,
  proposal,
  onClose,
  onReject,
  onApprove,
}: ProposalDetailModalProps) {
  const proposalTypeLabels: Record<string, string> = {
    CA_NHAN_HANG_NAM: 'Cá nhân Hằng năm',
    DON_VI_HANG_NAM: 'Đơn vị Hằng năm',
    NIEN_HAN: 'Niên hạn',
    CONG_HIEN: 'Cống hiến',
    DOT_XUAT: 'Đột xuất',
    NCKH: 'ĐTKH/SKKH',
  };

  const statusConfig = {
    PENDING: { color: 'warning', text: 'Đang chờ phê duyệt' },
    APPROVED: { color: 'success', text: 'Đã phê duyệt' },
    REJECTED: { color: 'error', text: 'Đã từ chối' },
  };

  // Get title data
  const titleData = proposal.title_data || proposal.data_danh_hieu || [];
  const personnelCount = proposal.selected_personnel?.length || titleData.length || 0;

  // Columns for title data table
  const columns: ColumnsType<any> = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'ho_ten',
      key: 'ho_ten',
      width: 250,
      align: 'center',
      render: (text: string, record: any) => {
        const coQuanDonVi = record.co_quan_don_vi?.ten_co_quan_don_vi;
        const donViTrucThuoc = record.don_vi_truc_thuoc?.ten_don_vi;
        const parts = [];
        if (donViTrucThuoc) parts.push(donViTrucThuoc);
        if (coQuanDonVi) parts.push(coQuanDonVi);
        const unitInfo = parts.length > 0 ? parts.join(', ') : null;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Text strong>{text || '-'}</Text>
            {unitInfo && (
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                {unitInfo}
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: 'Chức vụ hiện tại',
      key: 'chuc_vu',
      width: 200,
      align: 'center',
      render: (_: any, record: any) => {
        // Lấy chức vụ từ record nếu có
        const chucVu = record.ChucVu?.ten_chuc_vu || record.chuc_vu;
        return <Text>{chucVu || '-'}</Text>;
      },
    },
  ];

  // Add appropriate columns based on proposal type
  if (proposal.loai_de_xuat === 'NCKH') {
    columns.push(
      {
        title: 'Loại',
        dataIndex: 'loai',
        key: 'loai',
        width: 120,
        render: (loai: string) => (
          <Tag color={loai === 'NCKH' ? 'blue' : 'green'}>
            {loai === 'NCKH' ? 'Nghiên cứu KH' : 'Sáng kiến KN'}
          </Tag>
        ),
      },
      {
        title: 'Mô tả đề tài',
        dataIndex: 'mo_ta',
        key: 'mo_ta',
        ellipsis: true,
      }
    );
  } else {
    columns.push({
      title: 'Danh hiệu đề xuất',
      dataIndex: 'danh_hieu',
      key: 'danh_hieu',
      width: 200,
      render: (danh_hieu: string) => <Tag color="blue">{danh_hieu}</Tag>,
    });
  }

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span>Chi tiết đề xuất khen thưởng</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={
        proposal.status === 'PENDING'
          ? [
              <Button key="close" onClick={onClose}>
                Đóng
              </Button>,
              <Button key="reject" danger icon={<CloseCircleOutlined />} onClick={onReject}>
                Từ chối
              </Button>,
              <Button
                key="approve"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={onApprove}
              >
                Phê duyệt
              </Button>,
            ]
          : [
              <Button key="close" type="primary" onClick={onClose}>
                Đóng
              </Button>,
            ]
      }
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Basic Info */}
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Loại khen thưởng" span={2}>
            <Tag color="blue">{proposalTypeLabels[proposal.loai_de_xuat]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Người đề xuất">
            <Text strong>
              {proposal.NguoiDeXuat?.QuanNhan?.ho_ten || proposal.NguoiDeXuat?.username || '-'}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Đơn vị">
            {proposal.DonViTrucThuoc?.ten_don_vi || proposal.CoQuanDonVi?.ten_don_vi || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Năm đề xuất">
            <Text strong>{proposal.nam}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Số quân nhân">
            <Tag color="cyan">{personnelCount}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {dayjs(proposal.createdAt).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={statusConfig[proposal.status].color}>
              {statusConfig[proposal.status].text}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        {/* File attachment */}
        {proposal.file_path && (
          <div style={{ marginTop: 16 }}>
            <Text strong>File đính kèm:</Text>
            <div style={{ marginTop: 8 }}>
              <Button icon={<DownloadOutlined />} size="small">
                Tải xuống file
              </Button>
            </div>
          </div>
        )}

        {/* Rejection reason */}
        {proposal.status === 'REJECTED' && proposal.rejection_reason && (
          <div style={{ marginTop: 16 }}>
            <Text strong type="danger">
              Lý do từ chối:
            </Text>
            <div
              style={{
                marginTop: 8,
                padding: 12,
                background: '#fff1f0',
                border: '1px solid #ffa39e',
                borderRadius: 4,
              }}
            >
              <Text>{proposal.rejection_reason}</Text>
            </div>
          </div>
        )}

        {/* Approval info */}
        {proposal.status === 'APPROVED' && (
          <div style={{ marginTop: 16 }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Người phê duyệt">
                {proposal.NguoiDuyet?.QuanNhan?.ho_ten || proposal.NguoiDuyet?.username || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày phê duyệt">
                {proposal.ngay_duyet ? dayjs(proposal.ngay_duyet).format('DD/MM/YYYY HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}

        <Divider />

        {/* Title data table */}
        <div style={{ marginTop: 16 }}>
          <Title level={5}>Danh sách quân nhân và danh hiệu</Title>
          <Table
            columns={columns}
            dataSource={titleData}
            rowKey={(record, index) => record.personnel_id || String(index)}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
            }}
            size="small"
            bordered
            scroll={{ x: 800 }}
            locale={{
              emptyText: 'Không có dữ liệu',
            }}
          />
        </div>

        {/* Notes */}
        {proposal.ghi_chu && (
          <div style={{ marginTop: 16 }}>
            <Text strong>Ghi chú:</Text>
            <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 4 }}>
              <Text>{proposal.ghi_chu}</Text>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
