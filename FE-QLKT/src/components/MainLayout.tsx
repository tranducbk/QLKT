'use client';

import { useState, useEffect, ReactNode } from 'react';
import {
  Layout,
  Menu,
  Dropdown,
  Avatar,
  Button,
  Drawer,
  Switch,
  ConfigProvider,
  App,
  theme as antdTheme,
} from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
  CloseOutlined,
  BulbOutlined,
  BulbFilled,
  UserOutlined,
  LockOutlined,
  BellOutlined,
  ApartmentOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from './theme-provider';
import { apiClient } from '@/lib/api-client';

const { Header, Sider, Content, Footer } = Layout;

interface MainLayoutProps {
  children: ReactNode;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER';
}

export default function MainLayout({ children, role = 'ADMIN' }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState('User');
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const router = useRouter();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    // Kiểm tra kích thước màn hình
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Lấy tên người dùng từ localStorage
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserName(userData.username || userData.name || userData.email || 'User');
      } catch (e) {
        setUserName('User');
      }
    }

    // Lấy số lượng thông báo chưa đọc
    loadNotificationCount();
  }, []);

  const loadNotificationCount = async () => {
    try {
      const response = await apiClient.getUnreadNotificationCount();
      if (response.success && response.data) {
        setNotificationCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      setNotificationLoading(true);
      // Load all notifications (both read and unread)
      const response = await apiClient.getNotifications({
        page: 1,
        limit: 20,
      });
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number, isRead: boolean, link?: string) => {
    try {
      // Only mark as read if not already read
      if (!isRead) {
        await apiClient.markNotificationAsRead(id);
        // Reload notifications and count
        loadNotifications();
        loadNotificationCount();
      }

      // Navigate to the link if provided
      if (link) {
        // For manager role, if link contains proposal detail, redirect to proposals list
        if (role === 'MANAGER' && link.match(/\/manager\/proposals\/\d+/)) {
          router.push('/manager/proposals');
        }
        // For admin role, fix proposal detail URL to include /review
        else if (role === 'ADMIN' && link.match(/\/admin\/proposals\/\d+$/)) {
          const proposalId = link.match(/\/admin\/proposals\/(\d+)$/)?.[1];
          if (proposalId) {
            router.push(`/admin/proposals/review/${proposalId}`);
          } else {
            router.push(link);
          }
        } else {
          router.push(link);
        }
      } else if (role === 'MANAGER') {
        // Default to proposals page for managers
        router.push('/manager/proposals');
      } else if (role === 'ADMIN') {
        // Default to proposals review page for admin
        router.push('/admin/proposals/review');
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      // Reload notifications and count
      loadNotifications();
      loadNotificationCount();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Menu items dựa trên vai trò
  const getMenuItems = () => {
    const roleSlug = role === 'SUPER_ADMIN' ? 'super-admin' : role.toLowerCase();
    const baseItems = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: <Link href={`/${roleSlug}/dashboard`}>Dashboard</Link>,
      },
    ];

    if (role === 'SUPER_ADMIN') {
      return [
        ...baseItems,
        {
          key: 'accounts',
          icon: <TeamOutlined />,
          label: <Link href="/super-admin/accounts">Quản lý Tài khoản</Link>,
        },
        {
          key: 'system-logs',
          icon: <FileTextOutlined />,
          label: <Link href="/super-admin/system-logs">Nhật ký hệ thống</Link>,
        },
      ];
    }

    if (role === 'ADMIN') {
      return [
        ...baseItems,
        {
          key: 'accounts',
          icon: <UserOutlined />,
          label: <Link href="/admin/accounts">Quản lý Tài khoản</Link>,
        },
        {
          key: 'personnel',
          icon: <TeamOutlined />,
          label: <Link href="/admin/personnel">Quản lý Quân nhân</Link>,
        },
        {
          key: 'categories',
          icon: <ApartmentOutlined />,
          label: <Link href="/admin/categories">Quản lý Cơ quan Đơn vị</Link>,
        },
        {
          key: 'proposals',
          icon: <FileTextOutlined />,
          label: <Link href="/admin/proposals/review">Duyệt Đề xuất</Link>,
        },
        {
          key: 'decisions',
          icon: <FileTextOutlined />,
          label: <Link href="/admin/decisions">Quản lý Quyết định</Link>,
        },
        {
          key: 'awards',
          icon: <FileTextOutlined />,
          label: <Link href="/admin/awards">Quản lý Khen Thưởng</Link>,
        },
        {
          key: 'service-awards',
          icon: <TrophyOutlined />,
          label: <Link href="/admin/service-awards">Quản lý Niên hạn</Link>,
        },
      ];
    }

    if (role === 'MANAGER') {
      return [
        ...baseItems,
        {
          key: 'personnel',
          icon: <TeamOutlined />,
          label: <Link href="/manager/personnel">Quân nhân Đơn vị</Link>,
        },
        {
          key: 'proposals-list',
          icon: <FileTextOutlined />,
          label: <Link href="/manager/proposals">Đề xuất của tôi</Link>,
        },
        {
          key: 'awards',
          icon: <FileTextOutlined />,
          label: <Link href="/manager/awards">Khen Thưởng Đơn vị</Link>,
        },
        {
          key: 'system-logs',
          icon: <FileTextOutlined />,
          label: <Link href="/manager/system-logs">Nhật ký hệ thống</Link>,
        },
        {
          key: 'profile',
          icon: <FileTextOutlined />,
          label: <Link href="/manager/profile">Hồ sơ của tôi</Link>,
        },
        {
          key: 'profile-edit',
          icon: <UserOutlined />,
          label: <Link href="/manager/profile/edit">Thông tin cá nhân</Link>,
        },
      ];
    }

    if (role === 'USER') {
      return [
        ...baseItems,
        {
          key: 'profile',
          icon: <FileTextOutlined />,
          label: <Link href="/user/profile">Hồ sơ của tôi</Link>,
        },
        {
          key: 'profile-edit',
          icon: <UserOutlined />,
          label: <Link href="/user/profile/edit">Thông tin cá nhân</Link>,
        },
      ];
    }

    return baseItems;
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Hồ sơ',
      icon: <UserOutlined />,
      onClick: () => {
        const roleSlug = role === 'SUPER_ADMIN' ? 'super-admin' : role.toLowerCase();
        router.push(`/${roleSlug}/dashboard`);
      },
    },
    {
      key: 'change-password',
      label: 'Đổi mật khẩu',
      icon: <LockOutlined />,
      onClick: () => {
        router.push('/user/settings');
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'theme-toggle',
      label: (
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="flex items-center gap-2">
            {theme === 'dark' ? <BulbFilled /> : <BulbOutlined />}
            {theme === 'dark' ? 'Chế độ tối' : 'Chế độ sáng'}
          </span>
          <Switch checked={theme === 'dark'} onChange={toggle} size="small" />
        </div>
      ),
      onClick: (e: any) => {
        e.domEvent.stopPropagation();
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  const siderContent = (collapsed: boolean) => (
    <div className="h-full flex flex-col">
      <div
        className={`p-5 text-center border-b-2 transition-all ${
          theme === 'dark'
            ? 'border-blue-700 bg-gradient-to-b from-gray-800 to-gray-900'
            : 'border-blue-200 bg-gradient-to-b from-blue-50 to-white'
        }`}
      >
        <h1
          className={`font-bold tracking-wider transition-all ${
            collapsed ? 'text-lg' : 'text-2xl'
          } ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}
        >
          QLKT
        </h1>
        {!collapsed && (
          <p
            className={`text-xs mt-2 font-medium uppercase tracking-wide ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {role === 'SUPER_ADMIN' && 'Super Admin'}
            {role === 'ADMIN' && 'Quản trị viên'}
            {role === 'MANAGER' && 'Quản lý'}
            {role === 'USER' && 'Người dùng'}
          </p>
        )}
      </div>
      <Menu
        theme={theme === 'dark' ? 'dark' : 'light'}
        mode="inline"
        items={getMenuItems()}
        className="flex-1"
        style={{
          borderRight: 'none',
        }}
      />
    </div>
  );

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorBgContainer: theme === 'dark' ? '#1f2937' : '#ffffff',
          colorText: theme === 'dark' ? '#f3f4f6' : '#111827',
          colorBorder: theme === 'dark' ? '#4b5563' : '#d1d5db',
          colorTextPlaceholder: theme === 'dark' ? '#9ca3af' : '#6b7280',
          borderRadius: 8,
        },
        components: {
          Layout: {
            headerBg: theme === 'dark' ? '#1f2937' : '#ffffff',
            bodyBg: theme === 'dark' ? '#111827' : '#f9fafb',
            footerBg: theme === 'dark' ? '#1f2937' : '#ffffff',
            siderBg: theme === 'dark' ? '#1f2937' : '#ffffff',
          },
          Menu: {
            darkItemBg: '#1f2937',
            darkSubMenuItemBg: '#1f2937',
          },
          Dropdown: {
            colorBgElevated: theme === 'dark' ? '#1f2937' : '#ffffff',
            controlItemBgHover: theme === 'dark' ? '#374151' : '#f3f4f6',
          },
          Drawer: {
            colorBgElevated: theme === 'dark' ? '#1f2937' : '#ffffff',
          },
        },
      }}
    >
      <App>
        <Layout className="min-h-screen">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            breakpoint="lg"
            collapsedWidth={80}
            width={250}
            className={theme === 'dark' ? 'bg-gray-800' : 'bg-white'}
            style={{
              overflow: 'auto',
              height: '100vh',
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
            }}
          >
            {siderContent(collapsed)}
          </Sider>
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <Drawer
            title="Menu"
            placement="left"
            onClose={() => setMobileDrawerOpen(false)}
            open={mobileDrawerOpen}
            styles={{ body: { padding: 0 } }}
          >
            {siderContent(false)}
          </Drawer>
        )}

        <Layout style={{ marginLeft: isMobile ? 0 : collapsed ? 80 : 250 }}>
          {/* Header */}
          <Header
            className={`shadow-sm px-4 flex items-center justify-between ${
              theme === 'dark' ? 'bg-gray-800 border-b border-gray-700' : 'bg-white'
            }`}
            style={{ position: 'sticky', top: 0, zIndex: 10 }}
          >
            <div className="flex items-center gap-4">
              {isMobile && (
                <Button
                  type="text"
                  icon={mobileDrawerOpen ? <CloseOutlined /> : <MenuOutlined />}
                  onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                  className={theme === 'dark' ? 'text-gray-300' : ''}
                />
              )}
              {!isMobile && (
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
                  className={theme === 'dark' ? 'text-gray-300' : ''}
                />
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <Dropdown
                menu={{
                  items: notificationLoading
                    ? [
                        {
                          key: 'loading',
                          label: (
                            <div className="text-center py-4 text-gray-400 bg-[#2d2d2d]">
                              Đang tải...
                            </div>
                          ),
                        },
                      ]
                    : notifications.length === 0
                      ? [
                          {
                            key: 'empty',
                            label: (
                              <div className="text-center py-4 text-gray-400 bg-[#2d2d2d]">
                                Không có thông báo
                              </div>
                            ),
                          },
                        ]
                      : [
                          ...notifications.map(notif => ({
                            key: `notification-${notif.id}`,
                            label: (
                              <div
                                className={`max-w-xs cursor-pointer p-3 rounded-lg transition-all ${
                                  notif.is_read
                                    ? 'bg-[#3d3d3d] dark:bg-[#3d3d3d] hover:bg-[#4a4a4a] dark:hover:bg-[#4a4a4a] opacity-75'
                                    : 'bg-[#3d3d3d] dark:bg-[#3d3d3d] hover:bg-[#4a4a4a] dark:hover:bg-[#4a4a4a] border-l-4 border-blue-500 dark:border-blue-400 shadow-sm'
                                }`}
                                onClick={() => {
                                  handleMarkAsRead(notif.id, notif.is_read, notif.link);
                                }}
                              >
                                <div className="flex items-start gap-2">
                                  {!notif.is_read && (
                                    <div className="w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full mt-1 flex-shrink-0 animate-pulse"></div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`font-bold text-sm mb-1 ${notif.is_read ? 'text-gray-300 dark:text-gray-300' : 'text-white dark:text-white'}`}
                                    >
                                      {notif.title}
                                    </p>
                                    <p
                                      className={`text-xs mt-1 leading-relaxed ${notif.is_read ? 'text-gray-400 dark:text-gray-400' : 'text-gray-200 dark:text-gray-200'}`}
                                    >
                                      {notif.message}
                                    </p>
                                    <p
                                      className={`text-xs mt-2 flex items-center gap-1.5 ${notif.is_read ? 'text-gray-500 dark:text-gray-500' : 'text-gray-400 dark:text-gray-400'}`}
                                    >
                                      <span>{formatNotificationTime(notif.created_at)}</span>
                                      {notif.is_read && (
                                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-500">
                                          • Đã đọc
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ),
                          })),
                          {
                            type: 'divider' as const,
                          },
                          {
                            key: 'mark-all-read',
                            label: (
                              <div
                                className="text-center text-blue-400 dark:text-blue-400 font-semibold text-sm py-3 cursor-pointer hover:text-blue-300 dark:hover:text-blue-300 transition-colors bg-[#2d2d2d] dark:bg-[#2d2d2d]"
                                onClick={handleMarkAllAsRead}
                              >
                                Đánh dấu tất cả đã đọc
                              </div>
                            ),
                          },
                        ],
                }}
                placement="bottomRight"
                trigger={['click']}
                onOpenChange={open => {
                  if (open) {
                    loadNotifications();
                  }
                }}
                overlayStyle={{ maxWidth: '420px' }}
                overlayClassName="notification-dropdown"
              >
                <div className="relative cursor-pointer group inline-block">
                  <BellOutlined className="text-xl text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md animate-pulse">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </div>
              </Dropdown>

              {/* User Dropdown */}
              <Dropdown
                menu={{ items: userMenuItems as any }}
                placement="bottomRight"
                trigger={['click']}
              >
                <div
                  className={`flex items-center gap-3 cursor-pointer group px-3 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-blue-50/50'
                  }`}
                >
                  <Avatar
                    size="large"
                    style={{
                      backgroundColor: '#1890ff',
                      boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
                    }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </Avatar>
                  <span
                    className={`text-sm font-semibold ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    {userName}
                  </span>
                </div>
              </Dropdown>
            </div>
          </Header>

          {/* Content */}
          <Content
            className={`${
              theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            } min-h-[calc(100vh-64px-70px)]`}
          >
            {children}
          </Content>

          {/* Footer */}
          <Footer
            className={`text-center py-6 ${
              theme === 'dark'
                ? 'bg-gray-800 border-t-2 border-blue-700 text-gray-300'
                : 'bg-white border-t-2 border-blue-200'
            }`}
          >
            <p className="font-medium">© 2025 Học viện Khoa học Quân sự. All rights reserved.</p>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              Hệ thống Quản lý Khen thưởng
            </p>
          </Footer>
        </Layout>
      </Layout>
      </App>
    </ConfigProvider>
  );
}
