'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Tabs,
  Table,
  Button,
  Badge,
  Typography,
  Breadcrumb,
  Space,
  message,
  Tag,
  Tooltip,
  Empty,
  Popconfirm,
} from 'antd';
import {
  HomeOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

const { Title, Text } = Typography;

interface Proposal {
  id: number;
  loai_de_xuat:
    | 'CA_NHAN_HANG_NAM'
    | 'DON_VI_HANG_NAM'
    | 'NIEN_HAN'
    | 'HC_QKQT'
    | 'KNC_VSNXD_QDNDVN'
    | 'CONG_HIEN'
    | 'DOT_XUAT'
    | 'NCKH';
  nam: number;
  don_vi: string;
  nguoi_de_xuat: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  so_danh_hieu: number;
  so_thanh_tich: number;
  nguoi_duyet: string | null;
  ngay_duyet: string | null;
  ly_do: string | null;
  ghi_chu: string | null;
  createdAt: string;
  file_excel_path?: string;
  data_danh_hieu?: Array<{ so_quyet_dinh?: string | null }>;
  data_thanh_tich?: Array<{ so_quyet_dinh?: string | null }>;
}

export default function ManagerProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProposals({ limit: 100 });

      if (response.success) {
        setProposals(response.data?.proposals || []);
      } else {
        message.error(response.message || 'Không thể tải danh sách đề xuất');
      }
    } catch (error: any) {
      message.error('Lỗi khi tải danh sách đề xuất');
      console.error('Fetch proposals error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async (proposalId: number) => {
    try {
      setDownloadingId(proposalId);
      const blob = await apiClient.downloadProposalExcel(proposalId.toString());

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `de-xuat-${proposalId}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('Tải file thành công');
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi tải file');
      console.error('Download error:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteProposal = async (proposalId: number) => {
    try {
      setDeletingId(proposalId);
      const response = await apiClient.deleteProposal(proposalId.toString());

      if (response.success) {
        message.success(response.message || 'Đã xóa đề xuất thành công');
        // Refresh danh sách
        await fetchProposals();
      } else {
        message.error(response.message || 'Lỗi khi xóa đề xuất');
      }
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi xóa đề xuất');
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProposals = proposals.filter(p => {
    if (activeTab === 'pending') return p.status === 'PENDING';
    if (activeTab === 'approved') return p.status === 'APPROVED';
    if (activeTab === 'rejected') return p.status === 'REJECTED';
    return true;
  });

  const getProposalTypeTag = (type: string) => {
    const typeConfig = {
      CA_NHAN_HANG_NAM: { color: 'blue', text: 'Cá nhân hằng năm' },
      DON_VI_HANG_NAM: { color: 'purple', text: 'Đơn vị hằng năm' },
      NIEN_HAN: { color: 'cyan', text: 'Niên hạn' },
      HC_QKQT: { color: 'gold', text: 'HC Quân kỳ quyết thắng' },
      KNC_VSNXD_QDNDVN: { color: 'lime', text: 'KNC VSNXD QĐNDVN' },
      CONG_HIEN: { color: 'geekblue', text: 'Cống hiến' },
      DOT_XUAT: { color: 'orange', text: 'Đột xuất' },
      NCKH: { color: 'magenta', text: 'ĐTKH/SKKH' },
    };

    const config = typeConfig[type as keyof typeof typeConfig];
    return config ? <Tag color={config.color}>{config.text}</Tag> : <Tag>{type}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'gold', icon: <ClockCircleOutlined />, text: 'Chờ duyệt' },
      APPROVED: { color: 'green', icon: <CheckCircleOutlined />, text: 'Đã duyệt' },
      REJECTED: { color: 'red', icon: <CloseCircleOutlined />, text: 'Từ chối' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => <Text strong>{index + 1}</Text>,
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      align: 'center' as const,
      render: (date: string) => format(new Date(date), 'dd/MM/yyyy HH:mm'),
    },
    {
      title: 'Loại đề xuất',
      dataIndex: 'loai_de_xuat',
      key: 'loai_de_xuat',
      width: 180,
      align: 'center' as const,
      render: (type: string) => getProposalTypeTag(type),
    },
    {
      title: 'Năm',
      dataIndex: 'nam',
      key: 'nam',
      width: 80,
      align: 'center' as const,
      render: (nam: number) => <Text strong>{nam}</Text>,
    },
    {
      title: 'Số lượng',
      key: 'so_luong',
      align: 'center' as const,
      width: 120,
      render: (_: any, record: Proposal) => {
        if (record.loai_de_xuat === 'NCKH') {
          // NCKH: hiển thị số thành tích khoa học
          return (
            <Tooltip title="Số đề tài/sáng kiến khoa học">
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{record.so_thanh_tich ?? 0}</span>
            </Tooltip>
          );
        } else {
          // Các loại khác: hiển thị số quân nhân (danh hiệu)
          return (
            <Tooltip title="Số quân nhân">
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{record.so_danh_hieu ?? 0}</span>
            </Tooltip>
          );
        }
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      align: 'center' as const,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Ngày duyệt',
      key: 'ngay_duyet',
      width: 180,
      align: 'center' as const,
      render: (_: any, record: Proposal) => {
        // Chỉ hiển thị ngày duyệt khi đã duyệt
        if (record.status !== 'APPROVED' || !record.ngay_duyet) {
          return <Text type="secondary">-</Text>;
        }

        return format(new Date(record.ngay_duyet), 'dd/MM/yyyy HH:mm');
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center' as const,
      width: 260,
      render: (_: any, record: Proposal) => (
        <Space>
          {/* Tạm thời ẩn chức năng tải file Excel */}
          {/* <Tooltip title="Tải file Excel">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadExcel(record.id)}
              loading={downloadingId === record.id}
              size="small"
            >
              Tải file
            </Button>
          </Tooltip> */}
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/manager/proposals/${record.id}`)}
            size="small"
          >
            Chi tiết
          </Button>
          {record.status === 'PENDING' && (
            <Popconfirm
              title="Xóa đề xuất"
              description="Bạn có chắc chắn muốn xóa đề xuất này? Hành động này không thể hoàn tác."
              onConfirm={() => handleDeleteProposal(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={deletingId === record.id}
                size="small"
              >
                Xóa
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          <HomeOutlined /> Tất cả ({proposals.length})
        </span>
      ),
    },
    {
      key: 'pending',
      label: (
        <span>
          <ClockCircleOutlined /> Chờ duyệt ({proposals.filter(p => p.status === 'PENDING').length})
        </span>
      ),
    },
    {
      key: 'approved',
      label: (
        <span>
          <CheckCircleOutlined /> Đã duyệt ({proposals.filter(p => p.status === 'APPROVED').length})
        </span>
      ),
    },
    {
      key: 'rejected',
      label: (
        <span>
          <CloseCircleOutlined /> Từ chối ({proposals.filter(p => p.status === 'REJECTED').length})
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <Breadcrumb.Item>
          <Link href="/manager/dashboard">
            <HomeOutlined />
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Đề xuất khen thưởng</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <Title level={2} className="!mb-0">
          Đề xuất khen thưởng
        </Title>
        <Link href="/manager/proposals/create">
          <Button type="primary" icon={<PlusOutlined />} size="large">
            Tạo đề xuất mới
          </Button>
        </Link>
      </div>

      {/* Info Card */}
      <Card className="shadow-sm bg-blue-50 dark:bg-blue-900/20 border-blue-200">
        <Space direction="vertical" size="small">
          <Text strong>📋 Hướng dẫn:</Text>
          <Text>• Tại đây bạn có thể theo dõi trạng thái các đề xuất đã gửi</Text>
          <Text>
            • Nếu đề xuất bị{' '}
            <Text type="danger" strong>
              từ chối
            </Text>
            , bạn có thể tải file về để xem lý do và chỉnh sửa lại
          </Text>
          <Text>• Sau khi sửa xong, tạo đề xuất mới với file đã chỉnh sửa</Text>
        </Space>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        <Table
          columns={columns}
          dataSource={filteredProposals}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: total => `Tổng ${total} đề xuất`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
          locale={{
            emptyText: (
              <Empty
                description={
                  activeTab === 'all'
                    ? 'Chưa có đề xuất nào'
                    : activeTab === 'pending'
                    ? 'Không có đề xuất chờ duyệt'
                    : activeTab === 'approved'
                    ? 'Không có đề xuất đã duyệt'
                    : 'Không có đề xuất bị từ chối'
                }
              />
            ),
          }}
        />
      </Card>
    </div>
  );
}
