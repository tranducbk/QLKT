// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Card, Breadcrumb, Typography, message, ConfigProvider, theme as antdTheme, Pagination } from 'antd';
import { FileTextOutlined, DashboardOutlined, FundOutlined, HomeOutlined } from '@ant-design/icons';
import { LogsFilter } from '@/components/system-logs/logs-filter';
import { LogsTable } from '@/components/system-logs/logs-table';
import { apiClient } from '@/lib/api-client';
import { Loading } from '@/components/ui/loading';
import { useTheme } from '@/components/theme-provider';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function ManagerSystemLogsPage() {
  const { theme } = useTheme();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    startDate: undefined,
    endDate: undefined,
    actorRole: undefined, // Không filter mặc định, để backend tự filter theo quyền
  });

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [filters]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await apiClient.getSystemLogs({
          ...filters,
          page: pagination.current,
          limit: pagination.pageSize,
        });
        const payload: any = res?.data ?? res;

        // Lấy dữ liệu từ response
        const data = payload?.data || payload;
        const list: any[] = Array.isArray(data)
          ? data
          : data?.logs || data?.items || data?.results || [];

        // Cập nhật pagination từ response
        if (data?.pagination) {
          setPagination(prev => ({
            ...prev,
            total: data.pagination.total || 0,
          }));
        }

        const normalized = list.map((l: any) => {
          const actionCombined = [l?.action, l?.resource].filter(Boolean).join('_').toUpperCase();
          const actorName =
            l?.NguoiThucHien?.QuanNhan?.ho_ten || l?.NguoiThucHien?.username || l?.Actor?.QuanNhan?.ho_ten || l?.Actor?.username || l?.actor_name || l?.actor_id;
          return {
            ...l,
            action: actionCombined,
            actor_name: actorName,
            details: l?.description || l?.details || '', // Ưu tiên description từ backend (đã dịch tiếng Việt)
            description: l?.description || l?.details || '', // Đảm bảo có description
            created_at: l?.created_at ?? l?.createdAt ?? l?.time ?? l?.timestamp,
          };
        });

        setLogs(normalized);
      } catch (error) {
        message.error('Không thể tải nhật ký hệ thống');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [filters, pagination.current, pagination.pageSize]);

  if (loading && logs.length === 0) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        }}
      >
        <Loading fullScreen message="Đang tải nhật ký hệ thống..." size="large" />
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
          <Breadcrumb.Item>Nhật ký hệ thống</Breadcrumb.Item>
        </Breadcrumb>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ padding: '8px', backgroundColor: '#e0f2fe', borderRadius: '8px' }}>
            <FundOutlined style={{ fontSize: '24px', color: '#0284c7' }} />
          </div>
          <div>
            <Title level={1} style={{ margin: 0 }}>
              Nhật ký Hệ thống
            </Title>
            <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
              Xem lịch sử hoạt động và thay đổi trong hệ thống
            </Text>
          </div>
        </div>

        {/* Filter Section */}
        <LogsFilter onFilterChange={setFilters} />

        {/* Stats Card */}
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
              <div style={{ padding: '8px', backgroundColor: '#dcfce7', borderRadius: '8px' }}>
                <FileTextOutlined style={{ fontSize: '20px', color: '#16a34a' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Tổng nhật ký
                </Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{pagination.total}</div>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
              <div style={{ padding: '8px', backgroundColor: '#e0f2fe', borderRadius: '8px' }}>
                <FundOutlined style={{ fontSize: '20px', color: '#0284c7' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Hành động tạo
                </Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {logs.filter(l => l.action?.includes('CREATE')).length}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
              <div style={{ padding: '8px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
                <FundOutlined style={{ fontSize: '20px', color: '#dc2626' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Hành động xóa
                </Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {logs.filter(l => l.action?.includes('DELETE')).length}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Logs Table Card */}
        <Card>
          <div style={{ padding: '16px' }}>
            <Title level={4} style={{ margin: 0 }}>
              Danh sách nhật ký
            </Title>
            <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginTop: '4px' }}>
              Tất cả hoạt động và thay đổi trong hệ thống
            </Text>
          </div>
          <div style={{ padding: 0 }}>
            <LogsTable logs={logs} loading={loading} />
            {pagination.total > 0 && (
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', borderTop: '1px solid #f0f0f0' }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} nhật ký`}
                  pageSizeOptions={['10', '20', '50', '100']}
                  onChange={(page, pageSize) => {
                    setPagination(prev => ({
                      ...prev,
                      current: page,
                      pageSize: pageSize || prev.pageSize,
                    }));
                  }}
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
}
