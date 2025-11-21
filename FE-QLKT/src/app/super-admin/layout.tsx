'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';

export default function SuperAdminLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    // Kiểm tra authentication và authorization
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('role');

    if (!token) {
      // Chưa đăng nhập, redirect về login
      router.push('/login');
      return;
    }

    if (role !== 'SUPER_ADMIN') {
      // Không có quyền super admin, redirect về trang tương ứng với role
      if (role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (role === 'MANAGER') {
        router.push('/manager/dashboard');
      } else if (role === 'USER') {
        router.push('/user/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [router]);

  return <MainLayout role="SUPER_ADMIN">{children}</MainLayout>;
}
