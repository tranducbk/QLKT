// @ts-nocheck
'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Button,
  Breadcrumb,
  Card,
  Input,
  Select,
  Modal,
  Typography,
  message,
  ConfigProvider,
  theme as antdTheme,
} from 'antd';
import { Loading } from '@/components/ui/loading';
import { useTheme } from '@/components/theme-provider';
import {
  SyncOutlined,
  HomeOutlined,
  UserOutlined,
  UserSwitchOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { PersonnelTable } from '@/components/personnel/personnel-table';
import { PersonnelForm } from '@/components/personnel/personnel-form';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

const { Title, Text } = Typography;
const { Option } = Select;

export default function ManagerPersonnelPage() {
  const { theme } = useTheme();
  const [personnel, setPersonnel] = useState([]);
  const [units, setUnits] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewingPersonnel, setViewingPersonnel] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [managerUnitId, setManagerUnitId] = useState<number | null>(null);

  // Lấy thông tin đơn vị của manager từ localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Ưu tiên lấy don_vi_id trực tiếp từ user info
    if (user?.don_vi_id) {
      setManagerUnitId(user.don_vi_id);
    } else if (user?.quan_nhan_id) {
      // Fallback: Gọi API nếu chưa có don_vi_id (cho tài khoản đăng nhập cũ)
      apiClient
        .getPersonnelById(user.quan_nhan_id)
        .then(res => {
          if (res.success && res.data?.don_vi_id) {
            setManagerUnitId(res.data.don_vi_id);
          } else {
            message.error('Không thể xác định đơn vị quản lý.');
          }
        })
        .catch(() => {
          message.error('Không thể tải thông tin đơn vị.');
        });
    } else {
      message.error('Không tìm thấy thông tin quản lý. Vui lòng đăng nhập lại.');
    }
  }, []);

  // Load dữ liệu khi có managerUnitId
  useEffect(() => {
    if (managerUnitId !== null) {
      loadData();
    }
  }, [managerUnitId, pagination.page, pagination.limit]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [personnelRes, positionsRes, unitsRes] = await Promise.all([
        apiClient.getPersonnel({
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          unit_id: managerUnitId,
        }),
        apiClient.getPositions(),
        apiClient.getUnits(),
      ]);

      if (personnelRes.success) {
        const data = personnelRes.data;
        setPersonnel(data?.personnel || data || []);
        setPagination(prev => ({
          ...prev,
          total: data?.pagination?.total || data?.total || 0,
        }));
      }

      if (positionsRes.success) {
        setPositions(positionsRes.data || []);
      }

      if (unitsRes.success) {
        setUnits(unitsRes.data || []);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu quân nhân.');
    } finally {
      setLoading(false);
    }
  }, [managerUnitId, pagination.page, pagination.limit, searchTerm]);

  const handleSearch = useCallback(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadData();
  }, [loadData]);

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const handleLimitChange = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const handleOpenDialog = (p?: any) => {
    setViewingPersonnel(p || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setViewingPersonnel(null);
  };

  const handleUpdatePersonnel = async (id: string, data: any) => {
    try {
      const res = await apiClient.updatePersonnel(id, data);
      if (res.success) {
        message.success('Cập nhật thông tin quân nhân thành công');
        loadData();
        handleCloseDialog();
      } else {
        message.error(res.message || 'Có lỗi xảy ra khi cập nhật');
      }
    } catch (error: any) {
      message.error(error.message || 'Có lỗi xảy ra khi cập nhật');
    }
  };

  const filteredPersonnel = personnel
    .filter(p => {
      const matchesPosition = !selectedPosition || p.chuc_vu_id === parseInt(selectedPosition);
      return matchesPosition;
    })
    .sort((a, b) => {
      // Những người không có đơn vị trực thuộc (chỉ huy) lên đầu
      const aIsManager = !a.don_vi_truc_thuoc_id;
      const bIsManager = !b.don_vi_truc_thuoc_id;

      if (aIsManager && !bIsManager) return -1;
      if (!aIsManager && bIsManager) return 1;

      // Nếu cùng loại thì giữ nguyên thứ tự
      return 0;
    });

  const totalPersonnel = pagination.total;
  const activePersonnel = personnel.filter(p => p.trang_thai === 'ACTIVE').length;
  const uniquePositions = new Set(personnel.map(p => p.chuc_vu?.ten_chuc_vu)).size;

  // Filter positions để hiển thị tất cả chức vụ thuộc cơ quan đơn vị của manager
  const filteredPositions = positions.filter(pos => {
    if (!managerUnitId) return false;

    // 1. Chức vụ thuộc trực tiếp cơ quan đơn vị (co_quan_don_vi_id = managerUnitId)
    if (pos.co_quan_don_vi_id === managerUnitId) {
      return true;
    }

    // 2. Chức vụ thuộc đơn vị trực thuộc của cơ quan đơn vị
    // Sử dụng DonViTrucThuoc relation có sẵn trong position
    if (pos.don_vi_truc_thuoc_id && pos.DonViTrucThuoc) {
      // Kiểm tra co_quan_don_vi_id từ DonViTrucThuoc relation
      const coQuanIdFromRelation = pos.DonViTrucThuoc.co_quan_don_vi_id ||
                                   pos.DonViTrucThuoc.CoQuanDonVi?.id;
      if (coQuanIdFromRelation === managerUnitId) {
        return true;
      }
    }

    return false;
  });

  if (loading && personnel.length === 0 && managerUnitId !== null) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        }}
      >
        <Loading fullScreen message="Đang tải danh sách quân nhân đơn vị..." size="large" />
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
        <Breadcrumb style={{ marginBottom: '24px' }}>
          <Breadcrumb.Item>
            <Link href="/manager/dashboard">
              <HomeOutlined />
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Quản lý Quân nhân Đơn vị</Breadcrumb.Item>
        </Breadcrumb>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <Title level={1} style={{ margin: 0 }}>
              Quản lý Quân nhân Đơn vị
            </Title>
            <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
              Xem và quản lý thông tin quân nhân thuộc đơn vị của bạn
            </Text>
          </div>
          <Button icon={<SyncOutlined spin={loading} />} onClick={loadData} disabled={loading}>
            Làm mới
          </Button>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
              <div style={{ padding: '8px', backgroundColor: '#e0f2fe', borderRadius: '8px' }}>
                <UserOutlined style={{ fontSize: '20px', color: '#0284c7' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Tổng quân nhân
                </Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalPersonnel}</div>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
              <div style={{ padding: '8px', backgroundColor: '#dcfce7', borderRadius: '8px' }}>
                <UserSwitchOutlined style={{ fontSize: '20px', color: '#16a34a' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Đang hoạt động
                </Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{activePersonnel}</div>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
              <div style={{ padding: '8px', backgroundColor: '#f3e8ff', borderRadius: '8px' }}>
                <SafetyCertificateOutlined style={{ fontSize: '20px', color: '#9333ea' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Số chức vụ khác nhau
                </Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{uniquePositions}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card style={{ marginBottom: '24px', padding: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Input
              placeholder="Tìm kiếm theo tên hoặc CCCD..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onPressEnter={handleSearch}
              size="large"
              style={{ flex: 1, minWidth: '200px' }}
            />
            <Select
              value={selectedPosition}
              onChange={setSelectedPosition}
              size="large"
              style={{ width: 256 }}
              placeholder="Lọc theo Chức vụ"
            >
              <Option value="">Tất cả chức vụ ({filteredPositions.length})</Option>
              {filteredPositions.map(position => (
                <Option key={position.id} value={position.id.toString()}>
                  {position.ten_chuc_vu}
                </Option>
              ))}
            </Select>
            <Button type="primary" size="large" onClick={handleSearch} disabled={loading}>
              Tìm kiếm
            </Button>
          </div>
        </Card>

        {/* Table */}
        {loading ? (
          <Card style={{ padding: '32px', textAlign: 'center' }}>
            <Text type="secondary">Đang tải dữ liệu...</Text>
          </Card>
        ) : (
          <Card style={{ padding: 0, marginBottom: '24px' }}>
            <PersonnelTable
              personnel={filteredPersonnel}
              onEdit={handleOpenDialog}
              onRefresh={loadData}
              readOnly={false}
              viewLinkPrefix="/manager/personnel"
            />
          </Card>
        )}

        {/* Pagination */}
        {pagination.total > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <Text type="secondary">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số{' '}
              {pagination.total} quân nhân
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Select
                value={pagination.limit.toString()}
                onChange={v => handleLimitChange(parseInt(v))}
                style={{ width: 80 }}
              >
                <Option value="10">10</Option>
                <Option value="20">20</Option>
                <Option value="50">50</Option>
              </Select>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Trước
                </Button>
                <span style={{ padding: '0 12px', fontSize: '14px' }}>
                  {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}
                </span>
                <Button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Dialog for viewing/editing details */}
        <Modal
          open={dialogOpen}
          onCancel={handleCloseDialog}
          footer={null}
          width={800}
          style={{ maxHeight: '90vh' }}
          title={
            <span>
              <EyeOutlined style={{ marginRight: '8px' }} />
              {viewingPersonnel ? 'Xem/Chỉnh sửa thông tin Quân nhân' : 'Thông tin Quân nhân'}
            </span>
          }
        >
          {viewingPersonnel && (
            <PersonnelForm
              personnel={viewingPersonnel}
              units={units}
              positions={positions}
              onSuccess={data => handleUpdatePersonnel(viewingPersonnel.id, data)}
              onClose={handleCloseDialog}
              readOnly={false}
            />
          )}
        </Modal>
      </div>
    </ConfigProvider>
  );
}
