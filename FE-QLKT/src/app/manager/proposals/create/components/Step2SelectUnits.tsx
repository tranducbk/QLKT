'use client';

import { useState, useEffect } from 'react';
import { Table, Input, Select, Space, Alert, Typography, Tag, message } from 'antd';
import { SearchOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '@/lib/api-client';

const { Text } = Typography;

interface Unit {
  id: string;
  ten_don_vi: string;
  ma_don_vi: string;
  type: 'CO_QUAN_DON_VI' | 'DON_VI_TRUC_THUOC';
  CoQuanDonVi?: {
    id: string;
    ten_don_vi: string;
    ma_don_vi: string;
  };
}

interface Step2SelectUnitsProps {
  selectedUnitIds: string[];
  onUnitChange: (ids: string[]) => void;
  nam: number;
  onNamChange: (nam: number) => void;
}

export default function Step2SelectUnits({
  selectedUnitIds,
  onUnitChange,
  nam,
  onNamChange,
}: Step2SelectUnitsProps) {
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Fetch all units
  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      console.log('Fetching manager units...');
      const response = await apiClient.getMyUnits();
      console.log('Manager units API response:', response);

      if (response.success && response.data) {
        const unitsData = Array.isArray(response.data) ? response.data : [];
        console.log('Units data:', unitsData);
        
        const formattedUnits: Unit[] = [];

        unitsData.forEach((unit: any) => {
          // Nếu có co_quan_don_vi_id hoặc CoQuanDonVi thì là đơn vị trực thuộc
          if (unit.co_quan_don_vi_id || unit.CoQuanDonVi) {
            formattedUnits.push({
              id: unit.id,
              ten_don_vi: unit.ten_don_vi,
              ma_don_vi: unit.ma_don_vi,
              type: 'DON_VI_TRUC_THUOC',
              CoQuanDonVi: unit.CoQuanDonVi || null,
            });
          } else {
            // Không có co_quan_don_vi_id thì là cơ quan đơn vị
            formattedUnits.push({
              id: unit.id,
              ten_don_vi: unit.ten_don_vi,
              ma_don_vi: unit.ma_don_vi,
              type: 'CO_QUAN_DON_VI',
            });
          }
        });

        // Sắp xếp: Cơ quan đơn vị trước, sau đó là đơn vị trực thuộc
        formattedUnits.sort((a, b) => {
          if (a.type === 'CO_QUAN_DON_VI' && b.type === 'DON_VI_TRUC_THUOC') return -1;
          if (a.type === 'DON_VI_TRUC_THUOC' && b.type === 'CO_QUAN_DON_VI') return 1;
          return a.ten_don_vi.localeCompare(b.ten_don_vi);
        });

        console.log('Formatted units:', formattedUnits);
        setUnits(formattedUnits);
        if (formattedUnits.length === 0) {
          message.warning('Không có đơn vị nào trong hệ thống');
        }
      } else {
        console.warn('Failed to fetch units:', response.message);
        message.error(response.message || 'Không thể tải danh sách đơn vị');
        setUnits([]);
      }
    } catch (error: any) {
      console.error('Error fetching units:', error);
      message.error('Lỗi khi tải danh sách đơn vị: ' + (error.message || 'Unknown error'));
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter units
  const filteredUnits = units.filter((unit) => {
    // Search filter
    const matchesSearch =
      searchText === '' ||
      unit.ten_don_vi.toLowerCase().includes(searchText.toLowerCase()) ||
      unit.ma_don_vi.toLowerCase().includes(searchText.toLowerCase());

    // Type filter
    let matchesType = true;
    if (typeFilter !== 'ALL') {
      matchesType = unit.type === typeFilter;
    }

    return matchesSearch && matchesType;
  });

  const columns: ColumnsType<Unit> = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Loại đơn vị',
      key: 'type',
      width: 150,
      render: (_, record) => (
        <Tag color={record.type === 'CO_QUAN_DON_VI' ? 'blue' : 'green'}>
          {record.type === 'CO_QUAN_DON_VI' ? 'Cơ quan đơn vị' : 'Đơn vị trực thuộc'}
        </Tag>
      ),
    },
    {
      title: 'Mã đơn vị',
      dataIndex: 'ma_don_vi',
      key: 'ma_don_vi',
      width: 150,
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: 'Tên đơn vị',
      dataIndex: 'ten_don_vi',
      key: 'ten_don_vi',
      width: 250,
      render: (text) => <Text strong>{text}</Text>,
    },
  ];

  // Row selection config
  const rowSelection = {
    selectedRowKeys: selectedUnitIds,
    onChange: (selectedRowKeys: React.Key[]) => {
      onUnitChange(selectedRowKeys as string[]);
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
              2. Chọn các đơn vị cần đề xuất khen thưởng từ danh sách dưới đây (bao gồm cơ quan đơn
              vị và đơn vị trực thuộc)
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
          placeholder="Tìm theo tên hoặc mã đơn vị"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          size="large"
          allowClear
        />

        <Select
          placeholder="Lọc theo loại đơn vị"
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 200 }}
          size="large"
        >
          <Select.Option value="ALL">Tất cả đơn vị</Select.Option>
          <Select.Option value="CO_QUAN_DON_VI">Cơ quan đơn vị</Select.Option>
          <Select.Option value="DON_VI_TRUC_THUOC">Đơn vị trực thuộc</Select.Option>
        </Select>
      </Space>

      {/* Summary */}
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Tổng số đơn vị: <strong>{filteredUnits.length}</strong> | Đã chọn:{' '}
          <strong style={{ color: '#1890ff' }}>{selectedUnitIds.length}</strong>
        </Text>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredUnits}
        rowKey="id"
        rowSelection={rowSelection}
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} đơn vị`,
        }}
        bordered
        scroll={{ x: 1200 }}
        locale={{
          emptyText: 'Không có dữ liệu đơn vị',
        }}
      />
    </div>
  );
}

