'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Input,
  message,
  Space,
  Typography,
  Breadcrumb,
  Tag,
  Tabs,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { HomeOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

const { Title } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

interface ServiceProfile {
  id: number;
  quan_nhan_id: number;
  hccsvv_hang_ba_status: string;
  hccsvv_hang_nhi_status: string;
  hccsvv_hang_nhat_status: string;
  hcbvtq_total_months: number;
  hcbvtq_hang_ba_status: string;
  hcbvtq_hang_nhi_status: string;
  hcbvtq_hang_nhat_status: string;
  QuanNhan?: {
    id: number;
    ho_ten: string;
    cccd: string;
    DonVi?: { ten_don_vi: string };
    ChucVu?: { ten_chuc_vu: string };
  };
}

export default function ServiceAwardsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<ServiceProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<ServiceProfile[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ServiceProfile | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = profiles.filter(
        p =>
          p.QuanNhan?.ho_ten?.toLowerCase().includes(searchText.toLowerCase()) ||
          p.QuanNhan?.cccd?.includes(searchText)
      );
      setFilteredProfiles(filtered);
    } else {
      setFilteredProfiles(profiles);
    }
  }, [searchText, profiles]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await apiClient.getAllServiceProfiles();

      if (result.success) {
        const data = Array.isArray(result.data) ? result.data : [];
        setProfiles(data);
        setFilteredProfiles(data);
      } else {
        message.error(result.message || 'Không thể tải dữ liệu');
      }
    } catch (error: any) {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (profile: ServiceProfile) => {
    setEditingProfile(profile);
    form.setFieldsValue({
      hccsvv_hang_ba_status: profile.hccsvv_hang_ba_status,
      hccsvv_hang_nhi_status: profile.hccsvv_hang_nhi_status,
      hccsvv_hang_nhat_status: profile.hccsvv_hang_nhat_status,
      hcbvtq_hang_ba_status: profile.hcbvtq_hang_ba_status,
      hcbvtq_hang_nhi_status: profile.hcbvtq_hang_nhi_status,
      hcbvtq_hang_nhat_status: profile.hcbvtq_hang_nhat_status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    if (!editingProfile) return;

    try {
      setLoading(true);
      const result = await apiClient.updateServiceProfile(
        editingProfile.quan_nhan_id.toString(),
        values
      );

      if (result.success) {
        message.success('Cập nhật thành công');
        setModalOpen(false);
        form.resetFields();
        setEditingProfile(null);
        loadData();
      } else {
        message.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      message.error('Có lỗi xảy ra khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      DA_NHAN: { color: 'green', text: 'Đã nhận' },
      DU_DIEU_KIEN: { color: 'orange', text: 'Đủ điều kiện' },
      CHUA_DU: { color: 'default', text: 'Chưa đủ' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Columns cho HCCSVV
  const hccsvvColumns: ColumnsType<ServiceProfile> = [
    {
      title: 'Họ tên',
      dataIndex: ['QuanNhan', 'ho_ten'],
      key: 'ho_ten',
      width: 200,
      fixed: 'left',
    },
    {
      title: 'CCCD',
      dataIndex: ['QuanNhan', 'cccd'],
      key: 'cccd',
      width: 140,
    },
    {
      title: 'Đơn vị',
      dataIndex: ['QuanNhan', 'DonVi', 'ten_don_vi'],
      key: 'don_vi',
      width: 150,
    },
    {
      title: 'Hạng Ba',
      dataIndex: 'hccsvv_hang_ba_status',
      key: 'hccsvv_ba',
      width: 140,
      render: getStatusTag,
      filters: [
        { text: 'Đã nhận', value: 'DA_NHAN' },
        { text: 'Đủ điều kiện', value: 'DU_DIEU_KIEN' },
        { text: 'Chưa đủ', value: 'CHUA_DU' },
      ],
      onFilter: (value, record) => record.hccsvv_hang_ba_status === value,
    },
    {
      title: 'Hạng Nhì',
      dataIndex: 'hccsvv_hang_nhi_status',
      key: 'hccsvv_nhi',
      width: 140,
      render: getStatusTag,
      filters: [
        { text: 'Đã nhận', value: 'DA_NHAN' },
        { text: 'Đủ điều kiện', value: 'DU_DIEU_KIEN' },
        { text: 'Chưa đủ', value: 'CHUA_DU' },
      ],
      onFilter: (value, record) => record.hccsvv_hang_nhi_status === value,
    },
    {
      title: 'Hạng Nhất',
      dataIndex: 'hccsvv_hang_nhat_status',
      key: 'hccsvv_nhat',
      width: 140,
      render: getStatusTag,
      filters: [
        { text: 'Đã nhận', value: 'DA_NHAN' },
        { text: 'Đủ điều kiện', value: 'DU_DIEU_KIEN' },
        { text: 'Chưa đủ', value: 'CHUA_DU' },
      ],
      onFilter: (value, record) => record.hccsvv_hang_nhat_status === value,
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          Sửa
        </Button>
      ),
    },
  ];

  // Columns cho HCBVTQ
  const hcbvtqColumns: ColumnsType<ServiceProfile> = [
    {
      title: 'Họ tên',
      dataIndex: ['QuanNhan', 'ho_ten'],
      key: 'ho_ten',
      width: 200,
      fixed: 'left',
    },
    {
      title: 'CCCD',
      dataIndex: ['QuanNhan', 'cccd'],
      key: 'cccd',
      width: 140,
    },
    {
      title: 'Đơn vị',
      dataIndex: ['QuanNhan', 'DonVi', 'ten_don_vi'],
      key: 'don_vi',
      width: 150,
    },
    {
      title: 'Tháng cống hiến',
      dataIndex: 'hcbvtq_total_months',
      key: 'total_months',
      width: 150,
      render: months => `${months || 0} tháng`,
      sorter: (a, b) => (a.hcbvtq_total_months || 0) - (b.hcbvtq_total_months || 0),
    },
    {
      title: 'Hạng Ba',
      dataIndex: 'hcbvtq_hang_ba_status',
      key: 'hcbvtq_ba',
      width: 140,
      render: getStatusTag,
      filters: [
        { text: 'Đã nhận', value: 'DA_NHAN' },
        { text: 'Đủ điều kiện', value: 'DU_DIEU_KIEN' },
        { text: 'Chưa đủ', value: 'CHUA_DU' },
      ],
      onFilter: (value, record) => record.hcbvtq_hang_ba_status === value,
    },
    {
      title: 'Hạng Nhì',
      dataIndex: 'hcbvtq_hang_nhi_status',
      key: 'hcbvtq_nhi',
      width: 140,
      render: getStatusTag,
      filters: [
        { text: 'Đã nhận', value: 'DA_NHAN' },
        { text: 'Đủ điều kiện', value: 'DU_DIEU_KIEN' },
        { text: 'Chưa đủ', value: 'CHUA_DU' },
      ],
      onFilter: (value, record) => record.hcbvtq_hang_nhi_status === value,
    },
    {
      title: 'Hạng Nhất',
      dataIndex: 'hcbvtq_hang_nhat_status',
      key: 'hcbvtq_nhat',
      width: 140,
      render: getStatusTag,
      filters: [
        { text: 'Đã nhận', value: 'DA_NHAN' },
        { text: 'Đủ điều kiện', value: 'DU_DIEU_KIEN' },
        { text: 'Chưa đủ', value: 'CHUA_DU' },
      ],
      onFilter: (value, record) => record.hcbvtq_hang_nhat_status === value,
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <Breadcrumb.Item>
          <Link href="/admin/dashboard">
            <HomeOutlined />
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Khen thưởng Niên hạn</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="!mb-2">
            Quản lý Khen thưởng Niên hạn
          </Title>
          <p className="text-gray-500">
            Quản lý Huân chương Chiến sỹ Vẻ vang và Huân chương Bảo vệ Tổ quốc
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <Search
          placeholder="Tìm theo tên"
          onSearch={setSearchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 400 }}
          prefix={<SearchOutlined />}
        />
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs defaultActiveKey="hccsvv">
          <TabPane tab="🎖️ Huân chương Chiến sỹ Vẻ vang" key="hccsvv">
            <Table
              columns={hccsvvColumns}
              dataSource={filteredProfiles}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showTotal: total => `Tổng ${total} quân nhân`,
                showSizeChanger: true,
              }}
              scroll={{ x: 1200 }}
            />
          </TabPane>
          <TabPane tab="🏅 Huân chương Bảo vệ Tổ quốc" key="hcbvtq">
            <Table
              columns={hcbvtqColumns}
              dataSource={filteredProfiles}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showTotal: total => `Tổng ${total} quân nhân`,
                showSizeChanger: true,
              }}
              scroll={{ x: 1200 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Edit Modal */}
      <Modal
        title={`Cập nhật khen thưởng: ${editingProfile?.QuanNhan?.ho_ten}`}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingProfile(null);
        }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="border-b pb-4 mb-4">
            <Title level={5}>Huân chương Chiến sỹ Vẻ vang</Title>
            <div className="grid grid-cols-3 gap-4">
              <Form.Item name="hccsvv_hang_ba_status" label="Hạng Ba">
                <Select>
                  <Select.Option value="CHUA_DU">Chưa đủ</Select.Option>
                  <Select.Option value="DU_DIEU_KIEN">Đủ điều kiện</Select.Option>
                  <Select.Option value="DA_NHAN">Đã nhận</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="hccsvv_hang_nhi_status" label="Hạng Nhì">
                <Select>
                  <Select.Option value="CHUA_DU">Chưa đủ</Select.Option>
                  <Select.Option value="DU_DIEU_KIEN">Đủ điều kiện</Select.Option>
                  <Select.Option value="DA_NHAN">Đã nhận</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="hccsvv_hang_nhat_status" label="Hạng Nhất">
                <Select>
                  <Select.Option value="CHUA_DU">Chưa đủ</Select.Option>
                  <Select.Option value="DU_DIEU_KIEN">Đủ điều kiện</Select.Option>
                  <Select.Option value="DA_NHAN">Đã nhận</Select.Option>
                </Select>
              </Form.Item>
            </div>
          </div>

          <div className="pb-4 mb-4">
            <Title level={5}>Huân chương Bảo vệ Tổ quốc</Title>
            <div className="grid grid-cols-3 gap-4">
              <Form.Item name="hcbvtq_hang_ba_status" label="Hạng Ba">
                <Select>
                  <Select.Option value="CHUA_DU">Chưa đủ</Select.Option>
                  <Select.Option value="DU_DIEU_KIEN">Đủ điều kiện</Select.Option>
                  <Select.Option value="DA_NHAN">Đã nhận</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="hcbvtq_hang_nhi_status" label="Hạng Nhì">
                <Select>
                  <Select.Option value="CHUA_DU">Chưa đủ</Select.Option>
                  <Select.Option value="DU_DIEU_KIEN">Đủ điều kiện</Select.Option>
                  <Select.Option value="DA_NHAN">Đã nhận</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="hcbvtq_hang_nhat_status" label="Hạng Nhất">
                <Select>
                  <Select.Option value="CHUA_DU">Chưa đủ</Select.Option>
                  <Select.Option value="DU_DIEU_KIEN">Đủ điều kiện</Select.Option>
                  <Select.Option value="DA_NHAN">Đã nhận</Select.Option>
                </Select>
              </Form.Item>
            </div>
          </div>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button
                onClick={() => {
                  setModalOpen(false);
                  form.resetFields();
                  setEditingProfile(null);
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
