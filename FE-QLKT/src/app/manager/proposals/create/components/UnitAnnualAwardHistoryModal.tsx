'use client';

import { Modal, Table, Tag, Typography, Spin, Descriptions } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Unit {
  id: string;
  ten_don_vi: string;
  ma_don_vi?: string;
}

interface UnitAnnualAward {
  id: string;
  nam: number;
  danh_hieu?: string | null;
  so_quyet_dinh?: string | null;
  ten_file_pdf?: string | null;
  so_nam_lien_tuc?: number;
  ghi_chu?: string | null;
  createdAt?: string;
}

interface UnitAnnualAwardHistoryModalProps {
  visible: boolean;
  unit: Unit | null;
  awards: UnitAnnualAward[];
  loading: boolean;
  onClose: () => void;
}

export default function UnitAnnualAwardHistoryModal({
  visible,
  unit,
  awards,
  loading,
  onClose,
}: UnitAnnualAwardHistoryModalProps) {
  console.log('awards', awards);
  const columns: ColumnsType<UnitAnnualAward> = [
    {
      title: 'Năm',
      dataIndex: 'nam',
      key: 'nam',
      width: 100,
      align: 'center',
      sorter: (a, b) => b.nam - a.nam,
      defaultSortOrder: 'descend',
    },
    {
      title: 'Danh hiệu',
      dataIndex: 'danh_hieu',
      key: 'danh_hieu',
      width: 200,
      align: 'center',
      render: (danhHieu: string | null) => {
        if (!danhHieu) return <Text type="secondary">-</Text>;
        const map: Record<string, { text: string; color: string }> = {
          ĐVTT: { text: 'Đơn vị tiên tiến', color: 'blue' },
          ĐVQT: { text: 'Đơn vị quyết thắng', color: 'green' },
          BKTTCP: { text: 'Bằng khen Thủ tướng Chính phủ', color: 'orange' },
          BKBQP: { text: 'Bằng khen Bộ Quốc phòng', color: 'purple' },
        };
        const item = map[danhHieu] || { text: danhHieu, color: 'default' };
        return <Tag color={item.color}>{item.text}</Tag>;
      },
    },
    {
      title: 'Số quyết định',
      dataIndex: 'so_quyet_dinh',
      key: 'so_quyet_dinh',
      width: 150,
      align: 'center',
      render: (soQuyetDinh: string | null) => soQuyetDinh || <Text type="secondary">-</Text>,
    },
    {
      title: 'Số năm liên tục',
      dataIndex: 'so_nam_lien_tuc',
      key: 'so_nam_lien_tuc',
      width: 120,
      align: 'center',
      render: (soNam: number | null) => {
        if (!soNam) return <Text type="secondary">-</Text>;
        return <Tag color="cyan">{soNam} năm</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      align: 'center',
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },
  ];

  // Tính tổng số năm liên tục hiện tại
  const getCurrentContinuousYears = () => {
    if (!awards || awards.length === 0) return 0;
    const sortedAwards = [...awards].sort((a, b) => b.nam - a.nam);
    const latestAward = sortedAwards[0];
    return latestAward?.so_nam_lien_tuc || 0;
  };

  return (
    <Modal
      title={
        <span>
          <HistoryOutlined style={{ marginRight: 8 }} />
          Lịch sử khen thưởng đơn vị hằng năm - {unit?.ten_don_vi}
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      centered
    >
      <Spin spinning={loading}>
        {awards && awards.length > 0 ? (
          <div>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Tổng số năm liên tục hiện tại">
                <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {getCurrentContinuousYears()} năm
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <Table
              columns={columns}
              dataSource={awards}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 800 }}
            />
          </div>
        ) : (
          <Text type="secondary">Chưa có dữ liệu lịch sử khen thưởng đơn vị</Text>
        )}
      </Spin>
    </Modal>
  );
}
