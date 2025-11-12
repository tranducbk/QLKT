// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Card,
  Space,
  Breadcrumb,
  Typography,
  Modal,
  message,
  Tag,
  Popconfirm,
  ConfigProvider,
  theme as antdTheme,
  Popover,
} from 'antd';
import { Loading } from '@/components/ui/loading';
import { useTheme } from '@/components/theme-provider';
import {
  PlusOutlined,
  HomeOutlined,
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

const { Title, Text } = Typography;

export default function PersonnelPage() {
  const { theme } = useTheme();
  const [personnel, setPersonnel] = useState([]);
  const [units, setUnits] = useState<{ coQuanDonVi: any[]; donViTrucThuocMap: Record<string, any[]> }>({ coQuanDonVi: [], donViTrucThuocMap: {} });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoQuanDonVi, setSelectedCoQuanDonVi] = useState<string | 'ALL'>('ALL');
  const [selectedDonViTrucThuoc, setSelectedDonViTrucThuoc] = useState<string | 'ALL'>('ALL');
  const [tableLoading, setTableLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [personnelRes, unitsRes] = await Promise.all([
        apiClient.getPersonnel(),
        apiClient.getUnits(),
      ]);

      // Map data để có don_vi_name và chuc_vu_name từ Prisma relations
      const personnelData = (personnelRes.data?.personnel || []).map(p => {
        // Xác định đơn vị từ CoQuanDonVi hoặc DonViTrucThuoc
        let donViName = '-';
        let donViDisplay = '-';
        
        if (p.DonViTrucThuoc) {
          // Nếu thuộc đơn vị trực thuộc, hiển thị cả cơ quan đơn vị cha
          const donViTrucThuoc = p.DonViTrucThuoc;
          const coQuanDonVi = donViTrucThuoc.CoQuanDonVi;
          donViName = donViTrucThuoc.ten_don_vi || '-';
          if (coQuanDonVi) {
            donViDisplay = `${donViName} (${coQuanDonVi.ten_don_vi})`;
          } else {
            donViDisplay = donViName;
          }
        } else if (p.CoQuanDonVi) {
          // Nếu thuộc cơ quan đơn vị
          donViName = p.CoQuanDonVi.ten_don_vi || '-';
          donViDisplay = donViName;
        }
        
        return {
          ...p,
          don_vi_name: donViName,
          don_vi_display: donViDisplay,
          chuc_vu_name: p.ChucVu?.ten_chuc_vu || '-',
          // Giữ lại ID đơn vị để filter
          don_vi_id: p.co_quan_don_vi_id || p.don_vi_truc_thuoc_id,
          // Giữ lại đầy đủ thông tin để filter
          co_quan_don_vi_id: p.co_quan_don_vi_id,
          don_vi_truc_thuoc_id: p.don_vi_truc_thuoc_id,
          // Giữ lại relations để có thể check cơ quan đơn vị cha của đơn vị trực thuộc
          DonViTrucThuoc: p.DonViTrucThuoc,
          CoQuanDonVi: p.CoQuanDonVi,
        };
      });

      setPersonnel(personnelData);
      
      // Tách thành 2 nhóm: Cơ quan đơn vị và Đơn vị trực thuộc
      const unitsData = unitsRes.data || [];
      const coQuanDonViList: any[] = [];
      const donViTrucThuocMap: Record<string, any[]> = {};
      
      // Lần 1: Tạo map đơn vị trực thuộc theo parent ID
      unitsData.forEach((unit: any) => {
        if (unit.co_quan_don_vi_id || unit.CoQuanDonVi) {
          // Đơn vị trực thuộc
          const parentId = unit.co_quan_don_vi_id || unit.CoQuanDonVi?.id;
          if (!donViTrucThuocMap[parentId]) {
            donViTrucThuocMap[parentId] = [];
          }
          donViTrucThuocMap[parentId].push({
            id: unit.id,
            ten_don_vi: unit.ten_don_vi,
            ma_don_vi: unit.ma_don_vi || '',
            type: 'don_vi_truc_thuoc',
          });
        }
      });
      
      // Lần 2: Tạo danh sách cơ quan đơn vị và gán đơn vị trực thuộc
      unitsData.forEach((unit: any) => {
        if (!unit.co_quan_don_vi_id && !unit.CoQuanDonVi) {
          // Cơ quan đơn vị
          coQuanDonViList.push({
            id: unit.id,
            ten_don_vi: unit.ten_don_vi,
            ma_don_vi: unit.ma_don_vi || '',
            type: 'co_quan_don_vi',
            donViTrucThuoc: donViTrucThuocMap[unit.id] || [],
          });
        }
      });
      
      setUnits({ coQuanDonVi: coQuanDonViList, donViTrucThuocMap });
    } catch (error) {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: number) => {
    try {
      setTableLoading(true);
      await apiClient.deletePersonnel(id.toString());
      message.success('Xóa quân nhân thành công');
      loadData();
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa');
    } finally {
      setTableLoading(false);
    }
  };

  const filteredPersonnel = personnel.filter(p => {
    const matchesSearch =
      p.ho_ten?.toLowerCase().includes(searchTerm.toLowerCase()) || p.cccd?.includes(searchTerm);
    
    // Filter theo cơ quan đơn vị
    let matchesCoQuanDonVi = true;
    if (selectedCoQuanDonVi && selectedCoQuanDonVi !== 'ALL') {
      // Nếu quân nhân thuộc cơ quan đơn vị trực tiếp
      if (p.co_quan_don_vi_id === selectedCoQuanDonVi) {
        matchesCoQuanDonVi = true;
      }
      // Nếu quân nhân thuộc đơn vị trực thuộc, check cơ quan đơn vị cha
      else if (p.DonViTrucThuoc?.CoQuanDonVi?.id === selectedCoQuanDonVi) {
        matchesCoQuanDonVi = true;
      }
      // Nếu có co_quan_don_vi_id từ relation
      else if (p.DonViTrucThuoc?.co_quan_don_vi_id === selectedCoQuanDonVi) {
        matchesCoQuanDonVi = true;
      }
      else {
        matchesCoQuanDonVi = false;
      }
    }
    
    // Filter theo đơn vị trực thuộc
    const matchesDonViTrucThuoc = !selectedDonViTrucThuoc || selectedDonViTrucThuoc === 'ALL' || p.don_vi_truc_thuoc_id === selectedDonViTrucThuoc;
    
    return matchesSearch && matchesCoQuanDonVi && matchesDonViTrucThuoc;
  });
  
  // Lấy danh sách đơn vị trực thuộc để hiển thị (filter theo cơ quan đơn vị đã chọn hoặc tất cả)
  const availableDonViTrucThuoc = selectedCoQuanDonVi && selectedCoQuanDonVi !== 'ALL'
    ? units.donViTrucThuocMap[selectedCoQuanDonVi] || []
    : Object.values(units.donViTrucThuocMap).flat();

  const columns = [
    {
      title: 'CCCD',
      dataIndex: 'cccd',
      key: 'cccd',
      width: 140,
      render: text => <Text strong>{text}</Text>,
    },
    {
      title: 'Họ tên',
      dataIndex: 'ho_ten',
      key: 'ho_ten',
      width: 200,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'don_vi_display',
      key: 'don_vi_display',
      width: 300,
      render: (text, record) => {
        // Nếu là đơn vị trực thuộc, hiển thị với màu khác
        const isDonViTrucThuoc = !!record.DonViTrucThuoc;
        return (
          <Tag color={isDonViTrucThuoc ? 'cyan' : 'blue'}>
            {text || '-'}
          </Tag>
        );
      },
    },
    {
      title: 'Chức vụ',
      dataIndex: 'chuc_vu_name',
      key: 'chuc_vu_name',
      width: 180,
      render: text => <Tag color="green">{text || '-'}</Tag>,
    },
    {
      title: 'Ngày nhập ngũ',
      dataIndex: 'ngay_nhap_ngu',
      key: 'ngay_nhap_ngu',
      width: 140,
      render: date => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => router.push(`/admin/personnel/${record.id}`)}
          >
            Xem
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa quân nhân này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading && personnel.length === 0) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        }}
      >
        <Loading fullScreen message="Đang tải danh sách quân nhân..." size="large" />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <div style={{ padding: '24px' }}>
        {/* Breadcrumb */}
        <Breadcrumb
          style={{ marginBottom: 16 }}
          items={[
            {
              title: (
                <Link href="/admin/dashboard">
                  <HomeOutlined />
                </Link>
              ),
            },
            {
              title: 'Quản lý Quân nhân',
            },
          ]}
        />

        {/* Header */}
        <div
          style={{
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
              Quản lý Quân nhân
            </Title>
            <Text type="secondary">
              Quản lý thông tin quân nhân trong hệ thống ({filteredPersonnel.length} quân nhân)
            </Text>
          </div>
          <Space>
            <Link href="/admin/annual-rewards/bulk">
              <Button size="large" icon={<PlusOutlined />}>
                Thêm danh hiệu đồng loạt
              </Button>
            </Link>
            <Link href="/admin/personnel/create">
              <Button type="primary" size="large" icon={<PlusOutlined />}>
                Thêm Quân nhân
              </Button>
            </Link>
          </Space>
        </div>

        {/* Filters */}
        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space wrap style={{ width: '100%' }} size="middle">
              <div style={{ flex: 1, minWidth: 300 }}>
                <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
                  Tìm kiếm
                </Text>
                <Input
                  placeholder="Nhập tên hoặc số CCCD để tìm kiếm..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  size="large"
                  allowClear
                />
              </div>
              <div style={{ minWidth: 250 }}>
                <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
                  Cơ quan đơn vị
                </Text>
                <Select
                  value={selectedCoQuanDonVi}
                  onChange={(value) => {
                    setSelectedCoQuanDonVi(value || 'ALL');
                    setSelectedDonViTrucThuoc('ALL'); // Reset đơn vị trực thuộc khi đổi cơ quan đơn vị
                  }}
                  onClear={() => setSelectedCoQuanDonVi('ALL')}
                  style={{ width: '100%' }}
                  size="large"
                  showSearch
                  placeholder="Chọn hoặc tìm kiếm cơ quan đơn vị..."
                  optionFilterProp="label"
                  filterOption={(input, option: any) => {
                    const label = String(option?.label || option?.children || '');
                    const value = String(option?.value || '');
                    const searchText = input.toLowerCase();
                    return label.toLowerCase().includes(searchText) || value.toLowerCase().includes(searchText);
                  }}
                  suffixIcon={<FilterOutlined />}
                  allowClear
                >
                  <Select.Option value="ALL" label="Tất cả cơ quan đơn vị">
                    Tất cả cơ quan đơn vị ({units.coQuanDonVi.length})
                  </Select.Option>
                  {units.coQuanDonVi.map((coQuanDonVi: any) => {
                    const label = coQuanDonVi.ma_don_vi 
                      ? `${coQuanDonVi.ten_don_vi} (${coQuanDonVi.ma_don_vi})`
                      : coQuanDonVi.ten_don_vi;
                    
                    const popoverContent = coQuanDonVi.donViTrucThuoc.length > 0 ? (
                      <div style={{ maxWidth: '300px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#1890ff' }}>
                          Đơn vị trực thuộc:
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {coQuanDonVi.donViTrucThuoc.map((dv: any, index: number) => {
                            const dvLabel = dv.ma_don_vi 
                              ? `${dv.ten_don_vi} (${dv.ma_don_vi})`
                              : dv.ten_don_vi;
                            return (
                              <div 
                                key={dv.id || index}
                                style={{ 
                                  padding: '4px 0',
                                  borderBottom: index < coQuanDonVi.donViTrucThuoc.length - 1 ? '1px solid #f0f0f0' : 'none'
                                }}
                              >
                                • {dvLabel}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#999' }}>Không có đơn vị trực thuộc</div>
                    );
                    
                    return (
                      <Select.Option 
                        key={coQuanDonVi.id}
                        value={coQuanDonVi.id} 
                        label={label}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span>{label}</span>
                          {coQuanDonVi.donViTrucThuoc.length > 0 && (
                            <Popover
                              content={popoverContent}
                              placement="right"
                              trigger="hover"
                              overlayStyle={{ maxWidth: '350px' }}
                              overlayClassName="unit-popover"
                            >
                              <span 
                                style={{ 
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  color: '#1890ff',
                                  marginLeft: '8px',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                ▶
                              </span>
                            </Popover>
                          )}
                        </div>
                      </Select.Option>
                    );
                  })}
                </Select>
              </div>
              <div style={{ minWidth: 250 }}>
                <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
                  Đơn vị trực thuộc
                </Text>
                <Select
                  value={selectedDonViTrucThuoc}
                  onChange={(value) => setSelectedDonViTrucThuoc(value || 'ALL')}
                  onClear={() => setSelectedDonViTrucThuoc('ALL')}
                  style={{ width: '100%' }}
                  size="large"
                  showSearch
                  placeholder={availableDonViTrucThuoc.length > 0 ? "Chọn hoặc tìm kiếm đơn vị trực thuộc..." : "Không có đơn vị trực thuộc"}
                  optionFilterProp="label"
                  filterOption={(input, option: any) => {
                    const label = String(option?.label || option?.children || '');
                    const value = String(option?.value || '');
                    const searchText = input.toLowerCase();
                    return label.toLowerCase().includes(searchText) || value.toLowerCase().includes(searchText);
                  }}
                  suffixIcon={<FilterOutlined />}
                  allowClear
                  disabled={availableDonViTrucThuoc.length === 0}
                >
                  <Select.Option value="ALL" label="Tất cả đơn vị trực thuộc">
                    Tất cả đơn vị trực thuộc ({availableDonViTrucThuoc.length})
                  </Select.Option>
                  {availableDonViTrucThuoc.map((donViTrucThuoc: any) => {
                    const childLabel = donViTrucThuoc.ma_don_vi
                      ? `${donViTrucThuoc.ten_don_vi} (${donViTrucThuoc.ma_don_vi})`
                      : donViTrucThuoc.ten_don_vi;
                    
                    // Nếu đã chọn cơ quan đơn vị thì không hiển thị tên cơ quan đơn vị nữa
                    // Chỉ hiển thị tên cơ quan đơn vị khi chưa chọn (hiển thị tất cả)
                    let displayLabel = childLabel;
                    let optionLabel = childLabel;
                    
                    if (!selectedCoQuanDonVi || selectedCoQuanDonVi === 'ALL') {
                      // Chưa chọn cơ quan đơn vị, hiển thị kèm tên cơ quan đơn vị cha
                      const parentUnit = units.coQuanDonVi.find((cqdv: any) => 
                        units.donViTrucThuocMap[cqdv.id]?.some((dv: any) => dv.id === donViTrucThuoc.id)
                      );
                      const parentLabel = parentUnit 
                        ? (parentUnit.ma_don_vi ? `${parentUnit.ten_don_vi} (${parentUnit.ma_don_vi})` : parentUnit.ten_don_vi)
                        : '';
                      
                      if (parentLabel) {
                        displayLabel = `${childLabel} (${parentLabel})`;
                        optionLabel = `${parentLabel} > ${childLabel}`;
                      }
                    }
                    
                    return (
                      <Select.Option
                        key={donViTrucThuoc.id}
                        value={donViTrucThuoc.id}
                        label={optionLabel}
                      >
                        {displayLabel}
                      </Select.Option>
                    );
                  })}
                </Select>
              </div>
            </Space>
          </Space>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredPersonnel}
            rowKey="id"
            loading={loading || tableLoading}
            pagination={{
              total: filteredPersonnel.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: total => `Tổng ${total} quân nhân`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            scroll={{ x: 1000 }}
            locale={{
              emptyText: 'Không có dữ liệu',
            }}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
}
