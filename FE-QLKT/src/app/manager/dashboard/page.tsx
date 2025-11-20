'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Breadcrumb,
  ConfigProvider,
  theme as antdTheme,
  Row,
  Col,
} from 'antd';
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
import '@/lib/chart-config';
import {
  ActionBarChart,
  ActivityLineChart,
  PieChart,
  RoleDistributionChart,
} from '@/components/charts';

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
  const [chartData, setChartData] = useState({
    awardsByType: [],
    proposalsByType: [],
    proposalsByStatus: [],
    awardsByMonth: [],
    personnelByRank: [],
    scientificAchievementsByMonth: [],
    scientificAchievementsByType: [],
    personnelByPosition: [],
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
        const statisticsRes = await apiClient.getManagerDashboardStatistics();
        console.log('Fetched Manager Dashboard Statistics:', statisticsRes);

        if (statisticsRes.success && statisticsRes.data) {
          console.log('Manager Statistics Data:', statisticsRes.data);
          // Tính toán thống kê
          const totalPersonnel = statisticsRes.data.totalPersonnel || 0;

          // Đếm số lượng CSTDCS và NCKH
          const totalCSTDCS =
            statisticsRes.data.awardsByType.find(a => a.type === 'CSTDCS')?.count || 0;
          const totalNCKH =
            statisticsRes.data.scientificAchievementsByType.reduce((sum, a) => sum + a.count, 0) ||
            0;
          const totalAwards = statisticsRes.data.awardsByType.reduce((sum, a) => sum + a.count, 0);
          setStats({
            totalPersonnel,
            totalCSTDCS,
            totalNCKH,
            totalAwards,
          });
          setChartData({
            awardsByType: statisticsRes.data.awardsByType || [],
            proposalsByType: statisticsRes.data.proposalsByType || [],
            proposalsByStatus: statisticsRes.data.proposalsByStatus || [],
            awardsByMonth: statisticsRes.data.awardsByMonth || [],
            personnelByRank: statisticsRes.data.personnelByRank || [],
            scientificAchievementsByMonth: statisticsRes.data.scientificAchievementsByMonth || [],
            scientificAchievementsByType: statisticsRes.data.scientificAchievementsByType || [],
            personnelByPosition: statisticsRes.data.personnelByPosition || [],
          });
        } else {
          console.error('Manager Statistics API failed:', statisticsRes);
        }
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
      iconColor: theme === 'dark' ? 'text-blue-400' : 'text-blue-600',
      bgColor:
        theme === 'dark'
          ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/20'
          : 'bg-gradient-to-br from-blue-50 to-blue-100',
      link: '/manager/personnel',
    },
    {
      title: 'Tổng CSTDCS',
      value: stats.totalCSTDCS,
      icon: FileTextOutlined,
      iconColor: theme === 'dark' ? 'text-green-400' : 'text-green-600',
      bgColor:
        theme === 'dark'
          ? 'bg-gradient-to-br from-green-900/30 to-green-800/20'
          : 'bg-gradient-to-br from-green-50 to-green-100',
      link: '#',
    },
    {
      title: 'Tổng NCKH',
      value: stats.totalNCKH,
      icon: StarOutlined,
      iconColor: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
      bgColor:
        theme === 'dark'
          ? 'bg-gradient-to-br from-yellow-900/30 to-yellow-800/20'
          : 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      link: '#',
    },
    {
      title: 'Khen thưởng',
      value: stats.totalAwards,
      icon: TrophyOutlined,
      iconColor: theme === 'dark' ? 'text-purple-400' : 'text-purple-600',
      bgColor:
        theme === 'dark'
          ? 'bg-gradient-to-br from-purple-900/30 to-purple-800/20'
          : 'bg-gradient-to-br from-purple-50 to-purple-100',
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

        {/* Charts Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} lg={8}>
            <PieChart
              data={chartData.awardsByType.map((item: any) => ({
                label: (() => {
                  const awardTypeMap: Record<string, string> = {
                    CSTDCS: 'Chiến sĩ thi đua cơ sở',
                    CSTT: 'Chiến sĩ tiên tiến',
                    BKBQP: 'Bằng khen Bộ Quốc phòng',
                    CSTDTQ: 'Chiến sĩ thi đua toàn quân',
                    HCCSVV_HANG_BA: 'HCCSVV Hạng Ba',
                    HCCSVV_HANG_NHI: 'HCCSVV Hạng Nhì',
                    HCCSVV_HANG_NHAT: 'HCCSVV Hạng Nhất',
                  };
                  return awardTypeMap[item.type] || item.type;
                })(),
                value: item.count,
              }))}
              title="Khen thưởng theo loại"
            />
          </Col>
          <Col xs={24} lg={8}>
            <PieChart
              data={chartData.proposalsByStatus.map((item: any) => ({
                label: (() => {
                  const statusMap: Record<string, string> = {
                    PENDING: 'Đang chờ phê duyệt',
                    APPROVED: 'Đã phê duyệt',
                    REJECTED: 'Đã từ chối',
                  };
                  return statusMap[item.status] || item.status;
                })(),
                value: item.count,
              }))}
              title="Đề xuất theo trạng thái"
              colors={[
                'rgba(255, 193, 7, 0.8)',
                'rgba(40, 167, 69, 0.8)',
                'rgba(220, 53, 69, 0.8)',
              ]}
            />
          </Col>
          <Col xs={24} lg={8}>
            <ActionBarChart
              data={chartData.proposalsByType.map((item: any) => ({
                action: item.type,
                count: item.count,
              }))}
              title="Đề xuất theo loại"
              maxLabelLength={15}
              labelMapper={(label: string) => {
                const proposalTypeMap: Record<string, string> = {
                  CA_NHAN_HANG_NAM: 'Cá nhân Hằng năm',
                  DON_VI_HANG_NAM: 'Đơn vị Hằng năm',
                  NIEN_HAN: 'Niên hạn',
                  CONG_HIEN: 'Cống hiến',
                  DOT_XUAT: 'Đột xuất',
                  NCKH: 'ĐTKH/SKKH',
                  HC_QKQT: 'Huy chương Quân kỳ',
                  KNC_VSNXD_QDNDVN: 'Kỷ niệm chương',
                };
                return proposalTypeMap[label] || label;
              }}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} lg={8}>
            <PieChart
              data={chartData.scientificAchievementsByType.map((item: any) => ({
                label: item.type === 'NCKH' ? 'Đề tài khoa học' : 'Sáng kiến khoa học',
                value: item.count,
              }))}
              title="Thành tích khoa học theo loại"
              colors={['rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)']}
            />
          </Col>
          <Col xs={24} lg={8}>
            <ActivityLineChart
              data={chartData.awardsByMonth.map((item: any) => ({
                date: item.month,
                count: item.count,
              }))}
              title="Khen thưởng theo tháng (6 tháng gần nhất)"
              label="Số lượng khen thưởng"
              color="rgba(147, 51, 234, 1)"
            />
          </Col>
          <Col xs={24} lg={8}>
            <ActivityLineChart
              data={chartData.scientificAchievementsByMonth.map((item: any) => ({
                date: item.month,
                count: item.count,
              }))}
              title="Thành tích khoa học (6 tháng gần nhất)"
              label="Số lượng thành tích"
              color="rgba(34, 197, 94, 1)"
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} lg={12}>
            <ActionBarChart
              data={chartData.personnelByRank.map((item: any) => ({
                action: item.rank,
                count: item.count,
              }))}
              title="Quân nhân theo cấp bậc"
              maxLabelLength={15}
            />
          </Col>
          <Col xs={24} lg={12}>
            <ActionBarChart
              data={chartData.personnelByPosition.map((item: any) => ({
                action: item.positionName,
                count: item.count,
              }))}
              title="Quân nhân theo chức vụ"
              maxLabelLength={20}
            />
          </Col>
        </Row>

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
