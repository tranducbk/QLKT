import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import AntdRegistry from '@/lib/AntdRegistry';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QLKT - Quản lý Khen thưởng',
  description: 'Hệ thống quản lý khen thưởng',
  icons: {
    icon: '/logo-msa.png',
    apple: '/logo-msa.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AntdRegistry>
          <ThemeProvider>{children}</ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
