'use client';

import { useState } from 'react';
import { Form, Input, Button, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import Image from 'next/image';
import './login-form.css';

const { Title, Text } = Typography;

export function LoginForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.login(values.username, values.password);

      if (response.success && response.data) {
        const payload = response.data;
        const accessToken = payload.accessToken || payload.token;
        const refreshToken = payload.refreshToken;
        const user = payload.user || {};
        const role = user.role;

        localStorage.setItem('accessToken', accessToken || '');
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('role', role);
        localStorage.setItem('user', JSON.stringify(user));

        if (role === 'SUPER_ADMIN') {
          router.push('/super-admin/dashboard');
        } else if (role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (role === 'MANAGER') {
          router.push('/manager/dashboard');
        } else if (role === 'USER') {
          router.push('/user/dashboard');
        }
      } else {
        setError(response.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 backdrop-blur-md border-b-2 border-white/30 shadow-lg">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="flex items-center space-x-2 hover:cursor-pointer transition-all duration-300 hover:opacity-80"
            >
              <Image
                src="/logo-msa.png"
                alt="Logo"
                width={48}
                height={48}
                className="my-1 transition-all duration-300 hover:scale-105 hover:cursor-pointer"
                priority
              />
              <span className="text-xl font-bold text-blue-100 hover:cursor-pointer transition-all duration-300 hover:text-white drop-shadow-lg">
                HỌC VIỆN KHOA HỌC QUÂN SỰ
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/#features"
                className="text-blue-100 hover:text-white transition-colors font-bold drop-shadow-md"
              >
                Tính năng
              </Link>
              <Link
                href="/#about"
                className="text-blue-100 hover:text-white transition-colors font-bold drop-shadow-md"
              >
                Giới thiệu
              </Link>
              <Link
                href="/#contact"
                className="text-blue-100 hover:text-white transition-colors font-bold drop-shadow-md"
              >
                Liên hệ
              </Link>
              <button
                onClick={() => router.push('/')}
                className="bg-white text-blue-600 px-4 py-2 rounded-full font-black hover:bg-white/90 transition-colors shadow-md"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </nav>
      </header>

      <div className="login-card">
        {/* Logo và Header */}
        <div className="login-header">
          <div className="logo-wrapper">
            <Image
              src="/logo-msa.png"
              alt="Logo"
              width={80}
              height={80}
              className="logo-image"
              priority
            />
          </div>
          <Title level={2} className="login-title">
            Hệ thống QLKT
          </Title>
          <Text className="login-subtitle">Quản lý Khen thưởng</Text>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            className="login-alert"
            closable
            onClose={() => setError('')}
          />
        )}

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          autoComplete="off"
          className="login-form"
        >
          <Form.Item
            name="username"
            label={<span className="form-label">Tài khoản</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tài khoản' }]}
          >
            <Input
              prefix={<UserOutlined className="input-icon" />}
              placeholder="Nhập tài khoản"
              size="large"
              className="login-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span className="form-label">Mật khẩu</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="input-icon" />}
              placeholder="Nhập mật khẩu"
              size="large"
              className="login-input"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              icon={!loading ? <LoginOutlined /> : null}
              className="login-button"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <div className="login-footer">
          <Text className="footer-text">© 2025 Học viện Khoa học Quân sự</Text>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="login-decoration">
        <div className="decoration-circle decoration-circle-1"></div>
        <div className="decoration-circle decoration-circle-2"></div>
        <div className="decoration-circle decoration-circle-3"></div>
      </div>
    </div>
  );
}
