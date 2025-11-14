'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Typography,
  Breadcrumb,
  App,
  Popconfirm,
  Modal,
  Descriptions,
  DatePicker,
  Form,
  Upload,
} from 'antd';
import {
  HomeOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import axiosInstance from '@/utils/axiosInstance';
import { apiClient } from '@/lib/api-client';
import dayjs from 'dayjs';
import DecisionModal from '@/components/DecisionModal';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Decision {
  id: string;
  so_quyet_dinh: string;
  nam: number;
  ngay_ky: string;
  nguoi_ky: string;
  file_path: string | null;
  loai_khen_thuong: string | null;
  ghi_chu: string | null;
  createdAt: string;
  updatedAt: string;
}

const loaiKhenThuongOptions = [
  { label: 'Cá nhân Hằng năm', value: 'CA_NHAN_HANG_NAM' },
  { label: 'Đơn vị Hằng năm', value: 'DON_VI_HANG_NAM' },
  { label: 'Niên hạn', value: 'NIEN_HAN' },
  { label: 'Cống hiến', value: 'CONG_HIEN' },
  { label: 'Đột xuất', value: 'DOT_XUAT' },
  { label: 'ĐTKH/SKKH', value: 'NCKH' },
];

export default function AdminDecisionsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [yearFilter, setYearFilter] = useState<number | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [decisionModalVisible, setDecisionModalVisible] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);

  useEffect(() => {
    fetchDecisions();
  }, [pagination.current, pagination.pageSize, yearFilter, typeFilter, searchText]);

  const fetchDecisions = async (customPagination?: { current: number; pageSize: number }) => {
    try {
      setLoading(true);
      const paginationToUse = customPagination || pagination;
      const params: any = {
        page: paginationToUse.current,
        limit: paginationToUse.pageSize,
      };
      if (yearFilter !== 'ALL') {
        params.nam = yearFilter;
      }
      if (typeFilter !== 'ALL') {
        params.loai_khen_thuong = typeFilter;
      }
      if (searchText) {
        params.search = searchText;
      }

      console.log('📡 Gọi API getDecisions với params:', params);
      const response = await apiClient.getDecisions(params);
      console.log('✅ Response từ API:', response);
      console.log('📊 Response.data:', response.data);
      console.log('📄 Response.pagination:', (response as any).pagination);
      
      if (response.success) {
        // Backend trả về: { success: true, data: [...], pagination: {...} }
        // apiClient.getDecisions() đã parse và trả về: { success: true, data: [...], pagination: {...} }
        const decisions = Array.isArray(response.data) ? response.data : [];
        const paginationData = (response as any).pagination;
        
        console.log('📋 Decisions để hiển thị:', decisions);
        console.log('📄 Pagination data:', paginationData);
        
        setDecisions(decisions);
        setPagination({
          ...paginationToUse,
          total: paginationData?.total || decisions.length,
        });
      } else {
        console.error('❌ API trả về success: false:', response);
        message.error(response.message || 'Lỗi khi tải danh sách quyết định');
      }
    } catch (error: any) {
      console.error('❌ Error fetching decisions:', error);
      message.error('Lỗi khi tải danh sách quyết định');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiClient.deleteDecision(id);
      if (response.success) {
        message.success('Xóa quyết định thành công');
        fetchDecisions();
      } else {
        message.error(response.message || 'Lỗi khi xóa quyết định');
      }
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi xóa quyết định');
    }
  };

  const handleViewDetail = (decision: Decision) => {
    setSelectedDecision(decision);
    setDetailModalVisible(true);
  };

  const handleEdit = (decision: Decision) => {
    setEditingDecision(decision);
    setDecisionModalVisible(true);
  };

  const handleAdd = () => {
    setEditingDecision(null);
    setDecisionModalVisible(true);
  };

  const handleModalSuccess = async () => {
    console.log('🔄 handleModalSuccess được gọi');
    setDecisionModalVisible(false);
    setEditingDecision(null);
    // Reset về trang 1 và gọi API với pagination mới
    const newPagination = { ...pagination, current: 1 };
    setPagination(newPagination);
    // Gọi fetchDecisions với pagination mới để đảm bảo API được gọi với page=1
    await fetchDecisions(newPagination);
  };

  const handleDownloadFile = async (filePath: string) => {
    try {
      const filename = filePath.split('/').pop();
      const response = await axiosInstance.get(`/api/proposals/uploads/${filename}`, {
        responseType: 'blob',
      });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'quyet-dinh.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('Tải file thành công');
    } catch (error) {
      message.error('Lỗi khi tải file');
      console.error('Download error:', error);
    }
  };

  const columns: ColumnsType<Decision> = [
    {
      title: 'STT',
      key: 'stt',
      width: 65,
      align: 'center',
      render: (_: any, __: any, index: number) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Số quyết định',
      dataIndex: 'so_quyet_dinh',
      key: 'so_quyet_dinh',
      width: 200,
      render: (text: string) => (
        <Text strong style={{ color: '#1890ff' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Năm',
      dataIndex: 'nam',
      key: 'nam',
      width: 90,
      align: 'center',
    },
    {
      title: 'Ngày ký',
      dataIndex: 'ngay_ky',
      key: 'ngay_ky',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Người ký',
      dataIndex: 'nguoi_ky',
      key: 'nguoi_ky',
      width: 210,
    },
    {
      title: 'Loại khen thưởng',
      dataIndex: 'loai_khen_thuong',
      key: 'loai_khen_thuong',
      width: 150,
      render: (type: string | null) => {
        if (!type) return '-';
        const option = loaiKhenThuongOptions.find(opt => opt.value === type);
        return <Tag color="blue">{option?.label || type}</Tag>;
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'ghi_chu',
      key: 'ghi_chu',
      width: 200,
      render: (text: string | null) => {
        if (!text) return <Text type="secondary">-</Text>;
        return (
          <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 200 }}>
            {text}
          </Text>
        );
      },
    },
    {
      title: 'File PDF',
      key: 'file_path',
      width: 100,
      align: 'center',
      render: (_: any, record: Decision) => {
        if (!record.file_path) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadFile(record.file_path!)}
            size="small"
          >
            Tải
          </Button>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 230,
      fixed: 'right',
      align: 'center',
      render: (_: any, record: Decision) => (
        <Space size="small" wrap>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            size="small"
            style={{ padding: '0 4px' }}
          >
            Xem
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            style={{ padding: '0 4px' }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa quyết định này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              style={{ padding: '0 4px' }}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Generate year options (last 5 years to next 2 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 5; i <= currentYear + 2; i++) {
    yearOptions.push({ label: i.toString(), value: i });
  }

  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: '/admin/dashboard' },
          { title: 'Quản lý quyết định' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            Quản lý Quyết định Khen thưởng
          </Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm quyết định
          </Button>
        </div>

        {/* Filters */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="Tìm kiếm số quyết định, người ký..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="Chọn năm"
            value={yearFilter}
            onChange={setYearFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Select.Option value="ALL">Tất cả năm</Select.Option>
            {yearOptions.map(year => (
              <Select.Option key={year.value} value={year.value}>
                {year.label}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="Chọn loại khen thưởng"
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 200 }}
            allowClear
          >
            <Select.Option value="ALL">Tất cả loại</Select.Option>
            {loaiKhenThuongOptions.map(option => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </Space>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={decisions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: total => `Tổng số ${total} quyết định`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
          }}
          bordered
          scroll={{ x: 1400 }}
          locale={{
            emptyText: 'Không có quyết định nào',
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết Quyết định"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
          selectedDecision?.file_path && (
            <Button
              key="download"
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadFile(selectedDecision!.file_path!)}
            >
              Tải file PDF
            </Button>
          ),
        ]}
        width={700}
        centered
        style={{ borderRadius: 8 }}
        styles={{ body: { borderRadius: 8 } }}
      >
        {selectedDecision && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Số quyết định">
              <Text strong>{selectedDecision.so_quyet_dinh}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Năm">{selectedDecision.nam}</Descriptions.Item>
            <Descriptions.Item label="Ngày ký">
              {dayjs(selectedDecision.ngay_ky).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Người ký">{selectedDecision.nguoi_ky}</Descriptions.Item>
            <Descriptions.Item label="Loại khen thưởng">
              {selectedDecision.loai_khen_thuong ? (
                <Tag color="blue">
                  {loaiKhenThuongOptions.find(opt => opt.value === selectedDecision.loai_khen_thuong)?.label ||
                    selectedDecision.loai_khen_thuong}
                </Tag>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú">
              {selectedDecision.ghi_chu || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="File PDF">
              {selectedDecision.file_path ? (
                <Button
                  type="link"
                  icon={<FileTextOutlined />}
                  onClick={() => handleDownloadFile(selectedDecision!.file_path!)}
                >
                  {selectedDecision.file_path.split('/').pop()}
                </Button>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {dayjs(selectedDecision.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày cập nhật">
              {dayjs(selectedDecision.updatedAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Decision Modal for Add/Edit */}
      <DecisionModal
        visible={decisionModalVisible}
        onClose={() => {
          setDecisionModalVisible(false);
          setEditingDecision(null);
        }}
        onSuccess={handleModalSuccess}
        loaiKhenThuong={editingDecision?.loai_khen_thuong || undefined}
        initialDecision={editingDecision ? {
          id: editingDecision.id,
          so_quyet_dinh: editingDecision.so_quyet_dinh,
          nam: editingDecision.nam,
          ngay_ky: dayjs(editingDecision.ngay_ky),
          nguoi_ky: editingDecision.nguoi_ky,
          file_path: editingDecision.file_path,
          loai_khen_thuong: editingDecision.loai_khen_thuong || undefined,
          ghi_chu: editingDecision.ghi_chu || undefined,
        } : undefined}
      />
    </div>
  );
}

