'use client';

import { useState, useEffect } from 'react';
import { Table, Input, Select, Space, Alert, Typography, Tag } from 'antd';
import { SearchOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axiosInstance from '@/utils/axiosInstance';

const { Text } = Typography;

interface Personnel {
  id: string;
  ho_ten: string;
  cccd: string;
  co_quan_don_vi_id: string;
  don_vi_truc_thuoc_id: string;
  chuc_vu_id: string;
  CoQuanDonVi?: {
    id: string;
    ten_don_vi: string;
    ma_don_vi: string;
  };
  DonViTrucThuoc?: {
    id: string;
    ten_don_vi: string;
    ma_don_vi: string;
    CoQuanDonVi?: {
      id: string;
      ten_don_vi: string;
      ma_don_vi: string;
    };
  };
  ChucVu?: {
    id: string;
    ten_chuc_vu: string;
  };
}

interface Step2SelectPersonnelProps {
  selectedPersonnelIds: string[];
  onPersonnelChange: (ids: string[]) => void;
  nam: number;
  onNamChange: (nam: number) => void;
}

export default function Step2SelectPersonnel({
  selectedPersonnelIds,
  onPersonnelChange,
  nam,
  onNamChange,
}: Step2SelectPersonnelProps) {
  const [loading, setLoading] = useState(false);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [searchText, setSearchText] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');

  // Fetch all personnel from manager's units
  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      // Gọi API lấy danh sách personnel thuộc đơn vị của manager
      const response = await axiosInstance.get('/api/personnel', {
        params: {
          // Manager chỉ lấy personnel trong đơn vị của mình
          // Backend sẽ tự filter dựa trên token
          page: 1,
          limit: 1000, // Lấy tất cả
        },
      });

      if (response.data.success) {
        // Backend trả về { success: true, data: { personnel: [], pagination: {} } }
        const personnelData = response.data.data?.personnel || response.data.data || [];
        setPersonnel(personnelData);
      }
    } catch (error: any) {
      console.error('Error fetching personnel:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique units for filter
  const units = Array.from(
    new Set(
      personnel.map((p) => {
        if (p.DonViTrucThuoc) {
          return `${p.DonViTrucThuoc.id}|${p.DonViTrucThuoc.ten_don_vi}`;
        } else if (p.CoQuanDonVi) {
          return `${p.CoQuanDonVi.id}|${p.CoQuanDonVi.ten_don_vi}`;
        }
        return '';
      })
    )
  ).filter(Boolean);

  // Filter personnel
  const filteredPersonnel = personnel.filter((p) => {
    // Search filter
    const matchesSearch =
      searchText === '' ||
      p.ho_ten.toLowerCase().includes(searchText.toLowerCase());

    // Unit filter
    let matchesUnit = true;
    if (unitFilter !== 'ALL') {
      const unitId = unitFilter.split('|')[0];
      matchesUnit = p.don_vi_truc_thuoc_id === unitId || p.co_quan_don_vi_id === unitId;
    }

    return matchesSearch && matchesUnit;
  });

  const columns: ColumnsType<Personnel> = [
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
      width: 200,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Cơ quan đơn vị',
      key: 'co_quan_don_vi',
      width: 180,
      render: (_, record) => {
        return record.CoQuanDonVi?.ten_don_vi ||
               record.DonViTrucThuoc?.CoQuanDonVi?.ten_don_vi ||
               '-';
      },
    },
    {
      title: 'Đơn vị trực thuộc',
      key: 'don_vi_truc_thuoc',
      width: 180,
      render: (_, record) => {
        return record.DonViTrucThuoc?.ten_don_vi || '-';
      },
    },
    {
      title: 'Chức vụ',
      key: 'chuc_vu',
      width: 160,
      render: (_, record) => record.ChucVu?.ten_chuc_vu || '-',
    },
  ];

  // Row selection config
  const rowSelection = {
    selectedRowKeys: selectedPersonnelIds,
    onChange: (selectedRowKeys: React.Key[]) => {
      onPersonnelChange(selectedRowKeys as string[]);
    },
  };

  // Generate year options (current year and previous 2 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2].map((y) => ({
    label: `Năm ${y}`,
    value: y,
  }));

  return (
    <div>
      <Alert
        message="Hướng dẫn"
        description={
          <div>
            <p>1. Chọn năm đề xuất khen thưởng</p>
            <p>
              2. Chọn các quân nhân cần đề xuất khen thưởng từ danh sách dưới đây (bao gồm tất cả
              quân nhân thuộc cơ quan đơn vị và đơn vị trực thuộc của bạn)
            </p>
            <p>3. Sau khi chọn xong, nhấn &quot;Tiếp tục&quot; để sang bước chọn danh hiệu</p>
          </div>
        }
        type="info"
        showIcon
        icon={<TeamOutlined />}
        style={{ marginBottom: 24 }}
      />

      {/* Filters */}
      <Space style={{ marginBottom: 16 }} size="middle">
        <div>
          <Text strong>Năm đề xuất: </Text>
          <Select
            value={nam}
            onChange={onNamChange}
            options={yearOptions}
            style={{ width: 150 }}
            size="large"
          />
        </div>

        <Input
          placeholder="Tìm theo tên"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          size="large"
          allowClear
        />

        <Select
          placeholder="Lọc theo đơn vị"
          value={unitFilter}
          onChange={setUnitFilter}
          style={{ width: 250 }}
          size="large"
          allowClear
        >
          <Select.Option value="ALL">Tất cả đơn vị</Select.Option>
          {units.map((unit) => {
            const [id, name] = unit.split('|');
            return (
              <Select.Option key={id} value={unit}>
                {name}
              </Select.Option>
            );
          })}
        </Select>
      </Space>

      {/* Summary */}
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Tổng số quân nhân: <strong>{filteredPersonnel.length}</strong> | Đã chọn:{' '}
          <strong style={{ color: '#1890ff' }}>{selectedPersonnelIds.length}</strong>
        </Text>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredPersonnel}
        rowKey="id"
        rowSelection={rowSelection}
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} quân nhân`,
        }}
        bordered
        scroll={{ x: 1200 }}
        locale={{
          emptyText: 'Không có dữ liệu quân nhân',
        }}
      />
    </div>
  );
}
