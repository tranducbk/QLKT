'use client';

import {
  Card,
  Typography,
  Breadcrumb,
  ConfigProvider,
  theme as antdTheme,
  Button,
  Alert,
} from 'antd';
import { AccountCreateForm } from '@/components/accounts/account-create-form';
import Link from 'next/link';
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';
import { useTheme } from '@/components/theme-provider';

const { Title } = Typography;

export default function AdminCreateAccountPage() {
  const { theme } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <div className="space-y-4 p-6">
        <Breadcrumb
          items={[
            {
              title: (
                <Link href="/admin/dashboard">
                  <HomeOutlined />
                </Link>
              ),
            },
            { title: <Link href="/admin/accounts">Tài khoản</Link> },
            { title: 'Tạo mới' },
          ]}
        />
        <div className="flex items-center gap-4">
          <Link href="/admin/accounts">
            <Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
          </Link>
          <Title level={2} className="!mb-0">
            Tạo tài khoản mới
          </Title>
        </div>

        <Alert
          type="info"
          showIcon
          message="Tạo tài khoản trực tiếp"
          description="Tạo tài khoản MANAGER hoặc USER với username và password tùy chỉnh. Tài khoản sẽ được liên kết với đơn vị và chức vụ được chọn."
        />

        <Card bordered className="shadow-sm">
          <AccountCreateForm />
        </Card>
      </div>
    </ConfigProvider>
  );
}
