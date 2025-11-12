'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Table,
  message,
  Breadcrumb,
  Tag,
  Space,
  Modal,
  ConfigProvider,
  theme as antdTheme,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/theme-provider';
import { apiClient } from '@/lib/api-client';

const { Title } = Typography;
const { confirm } = Modal;

export default function AdminAccountsPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAccounts();
      if (response.success) {
        setAccounts(response.data || []);
      } else {
        message.error(response.message || 'Không thể tải danh sách tài khoản');
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (account: any) => {
    confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc muốn xóa tài khoản "${account.username}"?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await apiClient.deleteAccount(account.id);
          if (response.success) {
            message.success('Xóa tài khoản thành công');
            loadAccounts();
          } else {
            message.error(response.message || 'Không thể xóa tài khoản');
          }
        } catch (error) {
          message.error('Lỗi khi xóa tài khoản');
        }
      },
    });
  };

  const handleResetPassword = (account: any) => {
    confirm({
      title: 'Xác nhận reset mật khẩu',
      content: `Reset mật khẩu tài khoản "${account.username}" về "123456"?`,
      okText: 'Reset',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await apiClient.resetPassword({
            account_id: account.id,
          });
          if (response.success) {
            message.success('Reset mật khẩu thành công');
          } else {
            message.error(response.message || 'Không thể reset mật khẩu');
          }
        } catch (error) {
          message.error('Lỗi khi reset mật khẩu');
        }
      },
    });
  };

  const getRoleTag = (role: string) => {
    const roleConfig: Record<string, { color: string; label: string }> = {
      SUPER_ADMIN: { color: 'purple', label: 'Super Admin' },
      ADMIN: { color: 'red', label: 'Admin' },
      MANAGER: { color: 'blue', label: 'Quản lý' },
      USER: { color: 'green', label: 'Người dùng' },
    };
    const config = roleConfig[role] || { color: 'default', label: role };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => getRoleTag(role),
    },
    {
      title: 'Quân nhân',
      key: 'quan_nhan',
      render: (record: any) => {
        if (record.QuanNhan) {
          return (
            <Link href={`/admin/personnel/${record.QuanNhan.id}`}>
              {record.QuanNhan.ho_ten}
            </Link>
          );
        }
        return <span className="text-gray-400">Chưa liên kết</span>;
      },
    },
    {
      title: 'Đơn vị',
      key: 'don_vi',
      render: (record: any) => {
        if (record.QuanNhan?.DonVi) {
          return record.QuanNhan.DonVi.ten_don_vi;
        }
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      title: 'Chức vụ',
      key: 'chuc_vu',
      render: (record: any) => {
        if (record.QuanNhan?.ChucVu) {
          return record.QuanNhan.ChucVu.ten_chuc_vu;
        }
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: any) => {
        // Admin không thể xóa/sửa SUPER_ADMIN hoặc ADMIN khác
        const canModify = record.role !== 'SUPER_ADMIN' && record.role !== 'ADMIN';

        return (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<LockOutlined />}
              onClick={() => handleResetPassword(record)}
              disabled={!canModify}
            >
              Reset MK
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              disabled={!canModify}
            >
              Xóa
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <div className="space-y-6 p-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            {
              title: (
                <Link href="/admin/dashboard">
                  <HomeOutlined />
                </Link>
              ),
            },
            { title: 'Quản lý Tài khoản' },
          ]}
        />

        {/* Header */}
        <div className="flex justify-between items-center">
          <Title level={2} className="!mb-0">
            Quản lý Tài khoản
          </Title>
          <Link href="/admin/accounts/create">
            <Button type="primary" icon={<PlusOutlined />} size="large">
              Tạo Tài khoản
            </Button>
          </Link>
        </div>

        {/* Table */}
        <Card>
          <Table
            dataSource={accounts}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} tài khoản`,
            }}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
}
