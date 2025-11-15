'use client';

import { Modal, Button, Descriptions, Tabs, Table, Tag, Typography, message } from 'antd';
import { HistoryOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axiosInstance from '@/utils/axiosInstance';

const { Text } = Typography;

interface Personnel {
  id: string;
  ho_ten: string;
}

interface AnnualProfile {
  tong_cstdcs?: any[] | number;
  tong_nckh?: any[] | number;
  cstdcs_lien_tuc?: number;
  du_dieu_kien_bkbqp?: boolean;
  du_dieu_kien_cstdtq?: boolean;
  goi_y?: string;
}

interface PersonnelRewardHistoryModalProps {
  visible: boolean;
  personnel: Personnel | null;
  annualProfile: AnnualProfile | null;
  loading: boolean;
  onClose: () => void;
}

export default function PersonnelRewardHistoryModal({
  visible,
  personnel,
  annualProfile,
  loading,
  onClose,
}: PersonnelRewardHistoryModalProps) {
  const tongCstdcs = Array.isArray(annualProfile?.tong_cstdcs) ? annualProfile.tong_cstdcs : [];
  const tongNckh = Array.isArray(annualProfile?.tong_nckh) ? annualProfile.tong_nckh : [];

  const hasData = tongCstdcs.length > 0 || tongNckh.length > 0;

  // Hàm tải file quyết định
  const handleDownloadFile = async (filePath: string, soQuyetDinh: string) => {
    try {
      if (!filePath) {
        message.warning('Không có file quyết định');
        return;
      }

      // Extract filename from path (uploads/decisions/filename.pdf -> filename.pdf)
      const filename = filePath.split('/').pop() || 'quyet-dinh.pdf';

      const response = await axiosInstance.get(`/api/annual-rewards/decision-files/${filename}`, {
        responseType: 'blob',
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${soQuyetDinh || 'quyet-dinh'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('Tải file thành công');
    } catch (error: any) {
      console.error('Download error:', error);
      message.error('Không thể tải file quyết định');
    }
  };

  const cstdcsColumns: ColumnsType<any> = [
    {
      title: 'Năm',
      dataIndex: 'nam',
      key: 'nam',
      width: 100,
      align: 'center',
    },
    {
      title: 'Danh hiệu',
      dataIndex: 'danh_hieu',
      key: 'danh_hieu',
      width: 200,
      align: 'center',
      render: text => {
        const map: Record<string, string> = {
          CSTDCS: 'Chiến sĩ thi đua cơ sở',
          CSTT: 'Chiến sĩ tiên tiến',
          BKBQP: 'Bằng khen Bộ Quốc phòng',
          CSTDTQ: 'Chiến sĩ thi đua toàn quân',
        };
        return map[text] || text;
      },
    },
    {
      title: 'Số quyết định',
      key: 'so_quyet_dinh',
      width: 200,
      align: 'center',
      render: (_, record) => {
        // Số quyết định cho CSTDCS thông thường
        const soQDCSTDCS = record.so_quyet_dinh;
        const fileCSTDCS = record.file_quyet_dinh;
        // Số quyết định cho BKBQP hoặc CSTDTQ
        const soQDBKBQP = record.so_quyet_dinh_bkbqp;
        const soQDCSTDTQ = record.so_quyet_dinh_cstdtq;
        const fileBKBQP = record.file_quyet_dinh_bkbqp;
        const fileCSTDTQ = record.file_quyet_dinh_cstdtq;

        const items = [];
        const danhHieu = record.danh_hieu; // Lấy danh hiệu từ record

        if (soQDCSTDCS && danhHieu) {
          items.push(
            <div key={danhHieu}>
              <Text
                style={{
                  fontSize: '12px',
                  cursor: fileCSTDCS ? 'pointer' : 'default',
                  color: fileCSTDCS ? '#1890ff' : undefined,
                  textDecoration: fileCSTDCS ? 'underline' : 'none',
                }}
                onClick={() => fileCSTDCS && handleDownloadFile(fileCSTDCS, soQDCSTDCS)}
              >
                {danhHieu}: {soQDCSTDCS}
                {fileCSTDCS && <DownloadOutlined style={{ marginLeft: '4px' }} />}
              </Text>
            </div>
          );
        }

        if (soQDBKBQP) {
          items.push(
            <div key="bkbqp">
              <Text
                type="secondary"
                style={{
                  fontSize: '12px',
                  cursor: fileBKBQP ? 'pointer' : 'default',
                  color: fileBKBQP ? '#1890ff' : undefined,
                  textDecoration: fileBKBQP ? 'underline' : 'none',
                }}
                onClick={() => fileBKBQP && handleDownloadFile(fileBKBQP, soQDBKBQP)}
              >
                BKBQP: {soQDBKBQP}
                {fileBKBQP && <DownloadOutlined style={{ marginLeft: '4px' }} />}
              </Text>
            </div>
          );
        }

        if (soQDCSTDTQ) {
          items.push(
            <div key="cstdtq">
              <Text
                type="secondary"
                style={{
                  fontSize: '12px',
                  cursor: fileCSTDTQ ? 'pointer' : 'default',
                  color: fileCSTDTQ ? '#1890ff' : undefined,
                  textDecoration: fileCSTDTQ ? 'underline' : 'none',
                }}
                onClick={() => fileCSTDTQ && handleDownloadFile(fileCSTDTQ, soQDCSTDTQ)}
              >
                CSTDTQ: {soQDCSTDTQ}
                {fileCSTDTQ && <DownloadOutlined style={{ marginLeft: '4px' }} />}
              </Text>
            </div>
          );
        }

        if (items.length > 0) {
          return (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}
            >
              {items}
            </div>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Nhận BKBQP',
      dataIndex: 'nhan_bkbqp',
      key: 'nhan_bkbqp',
      width: 120,
      align: 'center',
      render: value => (value ? <Tag color="green">Có</Tag> : <Tag>Không</Tag>),
    },
    {
      title: 'Nhận CSTDTQ',
      dataIndex: 'nhan_cstdtq',
      key: 'nhan_cstdtq',
      width: 120,
      align: 'center',
      render: value => (value ? <Tag color="green">Có</Tag> : <Tag>Không</Tag>),
    },
  ];

  const nckhColumns: ColumnsType<any> = [
    {
      title: 'Năm',
      dataIndex: 'nam',
      key: 'nam',
      width: 100,
      align: 'center',
    },
    {
      title: 'Loại',
      dataIndex: 'loai',
      key: 'loai',
      width: 150,
      align: 'center',
      render: text => {
        const map: Record<string, string> = {
          NCKH: 'Đề tài khoa học',
          SKKH: 'Sáng kiến khoa học',
        };
        return map[text] || text;
      },
    },
    {
      title: 'Mô tả',
      dataIndex: 'mo_ta',
      key: 'mo_ta',
      align: 'left',
    },
    {
      title: 'Số quyết định',
      key: 'so_quyet_dinh',
      width: 180,
      align: 'center',
      render: (_, record) => {
        const soQD = record.so_quyet_dinh;
        const filePath = record.file_quyet_dinh;

        if (soQD) {
          return (
            <Text
              style={{
                cursor: filePath ? 'pointer' : 'default',
                color: filePath ? '#1890ff' : undefined,
                textDecoration: filePath ? 'underline' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
              onClick={() => filePath && handleDownloadFile(filePath, soQD)}
            >
              {soQD}
              {filePath && <DownloadOutlined />}
            </Text>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: status => {
        const color = status === 'APPROVED' ? 'green' : 'orange';
        const text = status === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt';
        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  return (
    <Modal
      title={
        <span>
          <HistoryOutlined /> Lịch sử khen thưởng - {personnel?.ho_ten || 'N/A'}
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={1200}
      loading={loading}
      centered
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">Đang tải dữ liệu...</Text>
        </div>
      ) : !hasData ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Lịch sử khen thưởng trống
          </Text>
        </div>
      ) : (
        <div>
          <Descriptions
            title="Tóm tắt hồ sơ hằng năm"
            bordered
            column={2}
            style={{ marginBottom: 24 }}
          >
            <Descriptions.Item label="Tổng CSTDCS">{tongCstdcs.length} năm</Descriptions.Item>
            <Descriptions.Item label="Tổng NCKH/SKKH">
              {tongNckh.length} công trình
            </Descriptions.Item>
            <Descriptions.Item label="CSTDCS liên tục">
              {annualProfile?.cstdcs_lien_tuc || 0} năm
            </Descriptions.Item>
            <Descriptions.Item label="Đủ điều kiện BKBQP">
              {annualProfile?.du_dieu_kien_bkbqp ? <Tag color="green">Có</Tag> : <Tag>Chưa đủ</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Đủ điều kiện CSTDTQ">
              {annualProfile?.du_dieu_kien_cstdtq ? (
                <Tag color="green">Có</Tag>
              ) : (
                <Tag>Chưa đủ</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Gợi ý" span={2}>
              <Text type="secondary" style={{ whiteSpace: 'pre-wrap' }}>
                {annualProfile?.goi_y || '-'}
              </Text>
            </Descriptions.Item>
          </Descriptions>

          <Tabs
            items={[
              {
                key: 'cstdcs',
                label: `Danh hiệu (${tongCstdcs.length})`,
                children: (
                  <div>
                    {tongCstdcs.length > 0 ? (
                      <Table
                        dataSource={tongCstdcs}
                        rowKey={(record, index) => `${record.nam}-${index}`}
                        pagination={false}
                        size="small"
                        columns={cstdcsColumns}
                      />
                    ) : (
                      <Text type="secondary">Chưa có danh hiệu</Text>
                    )}
                  </div>
                ),
              },
              {
                key: 'nckh',
                label: `NCKH/SKKH (${tongNckh.length})`,
                children: (
                  <div>
                    {tongNckh.length > 0 ? (
                      <Table
                        dataSource={tongNckh}
                        rowKey={(record, index) => `${record.nam}-${index}`}
                        pagination={false}
                        size="small"
                        columns={nckhColumns}
                      />
                    ) : (
                      <Text type="secondary">Chưa có thành tích NCKH/SKKH</Text>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}
    </Modal>
  );
}
