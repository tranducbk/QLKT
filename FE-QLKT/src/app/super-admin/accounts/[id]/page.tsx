'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Descriptions,
  Button,
  Space,
  Tag,
  message,
  Popconfirm,
  Breadcrumb,
  ConfigProvider,
  theme as antdTheme,
  Modal,
  Alert,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { Loading } from '@/components/ui/loading';

const { Title } = Typography;

export default function AccountDetailPage() {
  const { theme } = useTheme();
  const params = useParams();
  const accountId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (accountId) {
      fetchAccountDetail();
    }
  }, [accountId]);

  const fetchAccountDetail = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAccountById(accountId);
      if (response.success) {
        setAccount(response.data);
      } else {
        message.error(response.message || 'Lỗi khi lấy thông tin tài khoản');
      }
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi lấy thông tin tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setResetting(true);
      const res = await apiClient.resetAccountPassword(accountId);
      if (res.success) {
        message.success('Đã đặt lại mật khẩu về mặc định');
      } else {
        message.error(res.message || 'Đặt lại mật khẩu thất bại');
      }
    } catch (e: any) {
      message.error(e.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setResetting(false);
    }
  };

  const showResetConfirm = () => {
    Modal.confirm({
      centered: true,
      title: 'Đặt lại mật khẩu?',
      content: 'Mật khẩu sẽ đặt về mặc định (123456). Tiếp tục?',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: handleResetPassword,
      okButtonProps: { loading: resetting, type: 'primary' },
      cancelButtonProps: { ghost: theme === 'dark' },
      maskClosable: false,
      rootClassName: theme === 'dark' ? 'dark' : undefined,
      width: 420,
    });
  };

  const getRoleColor = (role: string) => {
    const colors: any = {
      SUPER_ADMIN: 'red',
      ADMIN: 'orange',
      MANAGER: 'blue',
      USER: 'green',
    };
    return colors[role] || 'default';
  };

  const getRoleText = (role: string) => {
    const texts: any = {
      SUPER_ADMIN: 'Super Admin',
      ADMIN: 'Admin',
      MANAGER: 'Quản lý',
      USER: 'Người dùng',
    };
    return texts[role] || role;
  };

  if (loading) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        }}
      >
        <Loading fullScreen message="Đang tải thông tin tài khoản..." size="large" />
      </ConfigProvider>
    );
  }

  if (!account) {
    return (
      <div className="space-y-4">
        <Title level={2}>Không tìm thấy tài khoản</Title>
        <Link href="/super-admin/accounts">
          <Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
        </Link>
      </div>
    );
  }

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
            { title: <Link href="/super-admin/dashboard">Dashboard</Link> },
            { title: <Link href="/super-admin/accounts">Tài khoản</Link> },
            { title: `#${account.id}` },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/super-admin/accounts">
              <Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
            </Link>
            <Title level={2} className="!mb-0">
              Chi tiết tài khoản
            </Title>
          </div>
          <Space wrap>
            <Link href={`/super-admin/accounts/${accountId}/edit`}>
              <Button type="primary" icon={<EditOutlined />}>
                Chỉnh sửa
              </Button>
            </Link>
            <Button icon={<ReloadOutlined />} loading={resetting} onClick={showResetConfirm}>
              Đặt lại mật khẩu
            </Button>
          </Space>
        </div>

        {/* Account Information Card */}
        <Card title="Thông tin tài khoản" className="shadow-sm">
          <Descriptions
            bordered
            column={{ xs: 1, sm: 1, md: 2 }}
            size="middle"
            labelStyle={{ fontWeight: 600 }}
            contentStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}
          >
            <Descriptions.Item label="ID" span={1}>
              {account.id}
            </Descriptions.Item>
            <Descriptions.Item label="Tên đăng nhập" span={1}>
              {account.username}
            </Descriptions.Item>
            <Descriptions.Item label="Vai trò" span={1}>
              <Tag color={getRoleColor(account.role)}>{getRoleText(account.role)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo" span={1}>
              {formatDateTime(account.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật lần cuối" span={2}>
              {formatDateTime(account.updatedAt)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Personnel Information Card */}
        {account.QuanNhan && (
          <Card title="Thông tin quân nhân liên kết" className="shadow-sm">
            <div className="mb-4">
              <Alert
                type="warning"
                showIcon
                message="Thông tin chi tiết của quân nhân sẽ được Admin quản lý sau khi tạo tài khoản."
              />
            </div>
            <Descriptions
              bordered
              column={{ xs: 1, sm: 1, md: 2 }}
              size="small"
              labelStyle={{ fontWeight: 600 }}
              contentStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}
            >
              <Descriptions.Item label="Họ và tên" span={1}>
                {account.QuanNhan.ho_ten}
              </Descriptions.Item>
              <Descriptions.Item label="CCCD" span={1}>
                {account.QuanNhan.cccd}
              </Descriptions.Item>
              {account.QuanNhan.ngay_sinh && (
                <Descriptions.Item label="Ngày sinh" span={1}>
                  {formatDate(account.QuanNhan.ngay_sinh)}
                </Descriptions.Item>
              )}
              {account.QuanNhan.ngay_nhap_ngu && (
                <Descriptions.Item label="Ngày nhập ngũ" span={1}>
                  {formatDate(account.QuanNhan.ngay_nhap_ngu)}
                </Descriptions.Item>
              )}
              {account.QuanNhan.DonVi && (
                <Descriptions.Item label="Đơn vị" span={1}>
                  {account.QuanNhan.DonVi.ten_don_vi}
                </Descriptions.Item>
              )}
              {account.QuanNhan.ChucVu && (
                <Descriptions.Item label="Chức vụ" span={1}>
                  {account.QuanNhan.ChucVu.ten_chuc_vu}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {/* No Personnel Warning */}
        {!account.QuanNhan && account.role !== 'SUPER_ADMIN' && (
          <Card className="border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <span className="text-lg">⚠️</span>
              <span>Tài khoản này chưa được liên kết với quân nhân nào.</span>
            </div>
          </Card>
        )}
      </div>
    </ConfigProvider>
  );
}
