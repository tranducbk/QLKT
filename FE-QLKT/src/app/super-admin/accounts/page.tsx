'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Card,
  message,
  Popconfirm,
  Tag,
  Input,
  Select,
  Breadcrumb,
  ConfigProvider,
  theme as antdTheme,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useTheme } from '@/components/theme-provider';
import { formatDate } from '@/lib/utils';

const { Title } = Typography;

// Helper functions for role display
const getRoleColor = (role: string) => {
  const colors: Record<string, string> = {
    SUPER_ADMIN: 'red',
    ADMIN: 'orange',
    MANAGER: 'blue',
    USER: 'green',
  };
  return colors[role] || 'default';
};

const getRoleText = (role: string) => {
  const texts: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    MANAGER: 'Quản lý',
    USER: 'Người dùng',
  };
  return texts[role] || role;
};

export default function AccountsListPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);

  const fetchAccounts = async (page = 1, pageSize = 10, search = '', role?: string) => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (search) params.search = search;
      if (role) params.role = role;

      const response = await apiClient.getAccounts(params);

      if (response.success) {
        setAccounts(response.data?.accounts || response.data?.data || []);
        setPagination({
          current: page,
          pageSize,
          total: response.data?.total || 0,
        });
      } else {
        message.error(response.message || 'Không thể tải danh sách tài khoản');
      }
    } catch (error: any) {
      message.error(error.message || 'Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiClient.deleteAccount(id);
      if (response.success) {
        message.success('Xóa tài khoản thành công');
        fetchAccounts(pagination.current, pagination.pageSize, debouncedSearch, roleFilter);
      } else {
        message.error(response.message || 'Không thể xóa tài khoản');
      }
    } catch (error: any) {
      message.error(error.message || 'Không thể xóa tài khoản');
    }
  };

  const handleSearch = () => {
    const newSearch = searchText.trim();
    setDebouncedSearch(newSearch);
    fetchAccounts(1, pagination.pageSize, newSearch, roleFilter);
  };

  const handleTableChange = (pag: any) => {
    fetchAccounts(pag.current, pag.pageSize, debouncedSearch, roleFilter);
  };

  const handleRoleFilterChange = (value: string | undefined) => {
    setRoleFilter(value);
    fetchAccounts(1, pagination.pageSize, debouncedSearch, value);
  };

  // Initial load
  useEffect(() => {
    fetchAccounts(1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left' as const,
      align: 'center' as const,
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
      ellipsis: true,
      width: 150,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      align: 'center' as const,
      render: (role: string) => <Tag color={getRoleColor(role)}>{getRoleText(role)}</Tag>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      align: 'center' as const,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Space size="small" wrap>
          <Link href={`/super-admin/accounts/${record.id}`}>
            <Button size="small">Chi tiết</Button>
          </Link>
          <Link href={`/super-admin/accounts/${record.id}/edit`}>
            <Button size="small" icon={<EditOutlined />} />
          </Link>
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc muốn xóa tài khoản này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <div className="space-y-4 p-6">
        <Breadcrumb
          items={[
            { title: <Link href="/super-admin/dashboard">Dashboard</Link> },
            { title: 'Tài khoản' },
          ]}
        />
        <div className="flex justify-between items-center">
          <Title level={2} className="mb-0">
            Quản lý Tài khoản
          </Title>
          <Link href="/super-admin/accounts/create">
            <Button type="primary" icon={<PlusOutlined />}>
              Tạo tài khoản
            </Button>
          </Link>
        </div>

        <Card>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space wrap>
              <Input
                placeholder="Tìm kiếm theo tên đăng nhập"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 250 }}
              />
              <Select
                placeholder="Lọc theo vai trò"
                allowClear
                value={roleFilter}
                onChange={handleRoleFilterChange}
                style={{ width: 200 }}
                options={[
                  { value: 'SUPER_ADMIN', label: 'Super Admin' },
                  { value: 'ADMIN', label: 'Admin' },
                  { value: 'MANAGER', label: 'Quản lý' },
                  { value: 'USER', label: 'Người dùng' },
                ]}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                Tìm kiếm
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSearchText('');
                  setDebouncedSearch('');
                  setRoleFilter(undefined);
                  fetchAccounts(1, pagination.pageSize);
                }}
              >
                Làm mới
              </Button>
            </Space>
          </Space>
        </Card>

        <Card>
          <Table
            columns={columns}
            dataSource={accounts}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showTotal: total => `Tổng ${total} tài khoản`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
            }}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
}
