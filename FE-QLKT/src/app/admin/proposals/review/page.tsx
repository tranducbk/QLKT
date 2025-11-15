'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Tabs, Table, Button, Badge, Typography, Breadcrumb, Space, Spin, Empty } from 'antd';
import {
  HomeOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';
import { apiClient } from '@/lib/api-client';
import { message } from 'antd';

const { Title, Paragraph } = Typography;

interface Proposal {
  id: number;
  don_vi: string;
  nguoi_de_xuat: string;
  status: string;
  so_danh_hieu: number;
  so_thanh_tich: number;
  nguoi_duyet: string | null;
  ngay_duyet: string | null;
  ghi_chu: string | null;
  createdAt: string;
  loai_de_xuat?: string;
}

export default function ProposalReviewPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProposals({ page: 1, limit: 100 });

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

  const filteredProposals = proposals.filter(p => {
    if (activeTab === 'pending') return p.status === 'PENDING';
    if (activeTab === 'approved') return p.status === 'APPROVED';
    if (activeTab === 'rejected') return p.status === 'REJECTED';
    return true;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'PENDING') {
      return <Badge color="gold" text="Chờ duyệt" />;
    }
    if (status === 'APPROVED') {
      return <Badge color="green" text="Đã duyệt" />;
    }
    return <Badge color="red" text="Từ chối" />;
  };

  const getProposalTypeName = (loaiDeXuat?: string) => {
    const typeMap: Record<string, string> = {
      CA_NHAN_HANG_NAM: 'Cá nhân hằng năm',
      DON_VI_HANG_NAM: 'Đơn vị hằng năm',
      NIEN_HAN: 'Niên hạn',
      HC_QKQT: 'Huân chương Quân kỳ quyết thắng',
      KNC_VSNXD_QDNDVN: 'Kỷ niệm chương VSNXD QĐNDVN',
      CONG_HIEN: 'Cống hiến',
      NCKH: 'Nghiên cứu khoa học',
      DOT_XUAT: 'Đột xuất',
    };
    return loaiDeXuat ? (typeMap[loaiDeXuat] || loaiDeXuat) : '-';
  };

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'don_vi',
      key: 'don_vi',
    },
    {
      title: 'Người đề xuất',
      dataIndex: 'nguoi_de_xuat',
      key: 'nguoi_de_xuat',
    },
    {
      title: 'Loại đề xuất',
      dataIndex: 'loai_de_xuat',
      key: 'loai_de_xuat',
      render: (loaiDeXuat: string) => getProposalTypeName(loaiDeXuat),
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => format(new Date(date), 'dd/MM/yyyy HH:mm'),
    },
    {
      title: 'Danh hiệu',
      dataIndex: 'so_danh_hieu',
      key: 'so_danh_hieu',
      align: 'center' as const,
      render: (count: number) => (
        <span style={{ fontSize: '14px', fontWeight: 500 }}>{count ?? 0}</span>
      ),
    },
    {
      title: 'Thành tích',
      dataIndex: 'so_thanh_tich',
      key: 'so_thanh_tich',
      align: 'center' as const,
      render: (count: number) => (
        <span style={{ fontSize: '14px', fontWeight: 500 }}>{count ?? 0}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: Proposal) => (
        <Button
          type="default"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/admin/proposals/review/${record.id}`)}
        >
          {record.status === 'PENDING' ? 'Xem và Duyệt' : 'Xem Chi Tiết'}
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'pending',
      label: (
        <span>
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          Chờ duyệt ({proposals.filter(p => p.status === 'PENDING').length})
        </span>
      ),
    },
    {
      key: 'approved',
      label: (
        <span>
          <CheckCircleOutlined style={{ marginRight: 8 }} />
          Đã duyệt ({proposals.filter(p => p.status === 'APPROVED').length})
        </span>
      ),
    },
    {
      key: 'rejected',
      label: (
        <span>
          <WarningOutlined style={{ marginRight: 8 }} />
          Đã từ chối ({proposals.filter(p => p.status === 'REJECTED').length})
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>Admin</Breadcrumb.Item>
        <Breadcrumb.Item>Duyệt Đề Xuất</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Duyệt Đề Xuất Khen Thưởng</Title>
        <Paragraph>Xem và phê duyệt các đề xuất khen thưởng từ các đơn vị</Paragraph>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems.map(item => ({
          ...item,
          children: (
            <Card
              title={
                activeTab === 'pending'
                  ? 'Đề xuất đang chờ phê duyệt'
                  : activeTab === 'approved'
                    ? 'Đề xuất đã được phê duyệt'
                    : 'Đề xuất đã bị từ chối'
              }
              extra={
                <Paragraph style={{ margin: 0, color: '#666' }}>
                  {activeTab === 'pending'
                    ? "Nhấn 'Xem và Duyệt' để kiểm tra và phê duyệt đề xuất"
                    : activeTab === 'approved'
                      ? 'Danh sách các đề xuất đã được phê duyệt và import vào hệ thống'
                      : 'Danh sách các đề xuất đã bị từ chối'}
                </Paragraph>
              }
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
                  <div style={{ marginTop: '12px', color: '#666' }}>Đang tải...</div>
                </div>
              ) : filteredProposals.length === 0 ? (
                <Empty
                  image={<WarningOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                  description={
                    <div>
                      <div style={{ fontWeight: 500 }}>Không có đề xuất nào</div>
                      <div style={{ fontSize: '14px', marginTop: '4px' }}>
                        {activeTab === 'pending'
                          ? 'Chưa có đề xuất chờ phê duyệt'
                          : activeTab === 'approved'
                            ? 'Chưa có đề xuất nào được phê duyệt'
                            : 'Chưa có đề xuất nào bị từ chối'}
                      </div>
                    </div>
                  }
                />
              ) : (
                <Table
                  columns={columns}
                  dataSource={filteredProposals}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              )}
            </Card>
          ),
        }))}
      />
    </div>
  );
}
