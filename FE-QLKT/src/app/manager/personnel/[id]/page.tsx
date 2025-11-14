'use client';

import {
  Breadcrumb,
  ConfigProvider,
  theme as antdTheme,
} from 'antd';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/components/theme-provider';
import ProfileEditForm from '@/components/ProfileEditForm';

export default function ManagerPersonnelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const personnelId = params?.id as string;
  const { theme } = useTheme();

  const handleSuccess = () => {
    // Reload lại thông tin sau khi cập nhật thành công
    router.refresh();
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { title: <Link href="/manager/dashboard">Dashboard</Link> },
            { title: <Link href="/manager/personnel">Quân nhân đơn vị</Link> },
            { title: 'Chỉnh sửa thông tin' },
          ]}
        />

        {/* Sử dụng ProfileEditForm với personnelId từ URL */}
        <ProfileEditForm personnelId={personnelId} onSuccess={handleSuccess} />
      </div>
    </ConfigProvider>
  );
}
