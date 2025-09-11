'use client';

import { Layout } from 'antd';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminTopbar from '@/components/layout/AdminTopbar';
import { CourseProvider } from '@/context/CourseContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const { Content } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute adminOnly>
      <CourseProvider>
        <Layout style={{ minHeight: '100vh' }}>
          <AdminSidebar />
          <Layout>
            <AdminTopbar />
            <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
              {children}
            </Content>
          </Layout>
        </Layout>
      </CourseProvider>
    </ProtectedRoute>
  );
}