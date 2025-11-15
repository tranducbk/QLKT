'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Button, Breadcrumb, ConfigProvider, theme as antdTheme } from 'antd';
import { Loading } from '@/components/ui/loading';
import {
  TeamOutlined,
  FileTextOutlined,
  StarOutlined,
  TrophyOutlined,
  PlusOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useTheme } from '@/components/theme-provider';
import { apiClient } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';

const { Title } = Typography;

export default function ManagerDashboard() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPersonnel: 156,
    totalCSTDCS: 89,
    totalNCKH: 34,
    totalAwards: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Lấy thông tin đơn vị của manager
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        let unitId = null;

        if (user?.quan_nhan_id) {
          const personnelDetailRes = await apiClient.getPersonnelById(user.quan_nhan_id);
          if (personnelDetailRes.success && personnelDetailRes.data?.don_vi_id) {
            unitId = personnelDetailRes.data.don_vi_id;
          }
        }

        // Fetch actual data from API - chỉ lấy dữ liệu đơn vị của manager
        const [personnelRes, awardsRes] = await Promise.all([
          apiClient.getPersonnel({ page: 1, limit: 1000, unit_id: unitId }),
          apiClient.getAwards({ don_vi_id: unitId, limit: 1000 }),
        ]);

        // Tính toán thống kê
        const personnelList = personnelRes?.data?.personnel || personnelRes?.data || [];
        const totalPersonnel = personnelRes?.data?.pagination?.total || personnelList.length || 0;

        const awardsList = awardsRes?.data?.awards || awardsRes?.data || [];

        // Đếm số lượng CSTDCS và NCKH
        let totalCSTDCS = 0;
        let totalNCKH = 0;

        // Duyệt qua từng quân nhân để đếm
        for (const person of personnelList) {
          try {
            // Lấy danh hiệu hằng năm
            const annualRes = await apiClient.getAnnualRewards(person.id);
            const annualRewards = annualRes?.data || [];
            totalCSTDCS += annualRewards.filter((r: any) => r.danh_hieu === 'CSTDCS').length;

            // Lấy thành tích khoa học
            const scientificRes = await apiClient.getScientificAchievements(person.id);
            const scientificAchievements = scientificRes?.data || [];
            totalNCKH += scientificAchievements.filter((s: any) => s.status === 'APPROVED').length;
          } catch (err) {
            // Bỏ qua lỗi cho từng quân nhân
            console.error(`Error fetching data for personnel ${person.id}:`, err);
          }
        }

        setStats({
          totalPersonnel,
          totalCSTDCS,
          totalNCKH,
          totalAwards: awardsList.length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Giữ giá trị mặc định nếu có lỗi
        setStats({
          totalPersonnel: 0,
          totalCSTDCS: 0,
          totalNCKH: 0,
          totalAwards: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Quân số Đơn vị',
      value: stats.totalPersonnel,
      icon: TeamOutlined,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor:
        'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20',
      link: '/manager/personnel',
    },
    {
      title: 'Tổng CSTDCS',
      value: stats.totalCSTDCS,
      icon: FileTextOutlined,
      iconColor: 'text-green-600 dark:text-green-400',
      bgColor:
        'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20',
      link: '#',
    },
    {
      title: 'Tổng NCKH',
      value: stats.totalNCKH,
      icon: StarOutlined,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      bgColor:
        'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20',
      link: '#',
    },
    {
      title: 'Khen thưởng',
      value: stats.totalAwards,
      icon: TrophyOutlined,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgColor:
        'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20',
      link: '/manager/awards',
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <div className="space-y-8 p-6 animate-in fade-in duration-500">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { title: <Link href="/manager/dashboard">Dashboard</Link> },
            { title: 'Tổng quan' },
          ]}
        />

        {/* Header */}
        <div className="mb-2">
          <Title
            level={2}
            className="!mb-3 !text-4xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400"
          >
            Xin chào, Trưởng phòng
          </Title>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Quản lý quân nhân và thành tích của đơn vị
          </p>
        </div>

        {/* Statistics Cards */}
        {loading ? (
          <Loading message="Đang tải thống kê đơn vị..." size="large" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Link key={index} href={stat.link}>
                  <Card className="shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden">
                    <div className="flex items-center justify-between p-1">
                      <div className="flex-1">
                        <p
                          className={`text-sm mb-2 font-medium uppercase tracking-wide ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {stat.title}
                        </p>
                        <p
                          className={`text-4xl font-bold mb-1 ${
                            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                          }`}
                        >
                          {stat.value.toLocaleString()}
                        </p>
                      </div>
                      <div className={`p-4 rounded-2xl ${stat.bgColor} shadow-inner`}>
                        <Icon className={`h-8 w-8 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Quick Actions */}
        <Card title={<span className="text-lg font-semibold">Lối tắt</span>} className="shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/manager/personnel">
              <Button
                type="primary"
                icon={<TeamOutlined />}
                size="large"
                className="w-full h-auto py-4 text-base font-medium hover:scale-105 transition-transform whitespace-normal break-words"
              >
                Xem danh sách Quân nhân
              </Button>
            </Link>
            <Link href="/manager/proposals/create">
              <Button
                icon={<PlusOutlined />}
                size="large"
                className="w-full h-auto py-4 text-base font-medium hover:scale-105 transition-transform whitespace-normal break-words"
              >
                Tạo Đề xuất
              </Button>
            </Link>
            <Link href="/manager/awards">
              <Button
                icon={<TrophyOutlined />}
                size="large"
                className="w-full h-auto py-4 text-base font-medium hover:scale-105 transition-transform whitespace-normal break-words"
              >
                Khen Thưởng Đơn vị
              </Button>
            </Link>
            <Link href="/manager/profiles/annual">
              <Button
                icon={<FileTextOutlined />}
                size="large"
                type="dashed"
                className="w-full h-auto py-4 text-base font-medium hover:scale-105 transition-transform border-2 hover:border-blue-500 whitespace-normal break-words"
              >
                Hồ sơ Khen thưởng Hằng năm
              </Button>
            </Link>
          </div>
        </Card>

        {/* System Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            title={<span className="text-lg font-semibold">Thông tin hệ thống</span>}
            className="shadow-lg"
          >
            <div className="space-y-4">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Vai trò
                </p>
                <p
                  className={`text-lg font-semibold ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  Quản lý (Manager)
                </p>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Quyền hạn
                </p>
                <p className={`text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Quản lý quân nhân và khen thưởng của đơn vị, tạo đề xuất khen thưởng
                </p>
              </div>
            </div>
          </Card>

          <Card
            title={<span className="text-lg font-semibold">Hoạt động gần đây</span>}
            className="shadow-lg"
          >
            <div className="space-y-4">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Thời gian truy cập
                </p>
                <p
                  className={`text-base font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {formatDateTime(new Date())}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Trạng thái hệ thống
                </p>
                <p className={`text-base font-medium text-green-600 dark:text-green-400`}>
                  Hoạt động bình thường
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
}
