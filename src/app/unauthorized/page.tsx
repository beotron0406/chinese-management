'use client';

import { useAuth } from '@/context/AuthContext';
import { Button, Card, Typography, ConfigProvider, Result } from 'antd';
import { LockOutlined, LogoutOutlined } from '@ant-design/icons';
import Image from 'next/image';

const { Title } = Typography;

const UnauthorizedPage = () => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1976d2',
          borderRadius: 12,
          fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
        },
        components: {
          Button: {
            controlHeight: 56,
            fontSize: 18,
            fontWeight: 600,
          },
          Card: {
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          },
        },
      }}
    >
      <div 
        className="flex items-center justify-center min-h-screen bg-cover bg-center relative"
        style={{ backgroundImage: "url('/assets/login-background.jpg')" }}
      >
        <Card 
          className="w-[600px] shadow-2xl backdrop-blur-md bg-white/90 border-none mx-4" 
        >
          <div className="flex flex-col items-center">
            {/* Logo */}
            <div className="relative w-24 h-24 mb-6"> 
              <Image 
                src="/assets/logo.png" 
                alt="HanziiLab Logo" 
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Access Denied Icon */}
            <div className="w-32 h-32 mb-6 flex items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-200 shadow-lg">
              <LockOutlined className="text-6xl text-red-500" />
            </div>

            {/* Title */}
            <Title level={2} style={{ margin: 0, color: '#333', fontWeight: 600, marginBottom: 16 }}>
              Không có quyền truy cập
            </Title>

            {/* Description */}
            <Typography.Paragraph 
              style={{ 
                fontSize: 18, 
                color: '#666', 
                textAlign: 'center',
                marginBottom: 8 
              }}
            >
              Xin lỗi, tài khoản của bạn không có quyền truy cập vào trang quản trị.
            </Typography.Paragraph>

            {user && (
              <Typography.Text 
                type="secondary" 
                style={{ fontSize: 16, marginBottom: 32 }}
              >
                Đăng nhập với: <strong>{user.email}</strong> (Role: {user.role})
              </Typography.Text>
            )}

            {/* Logout Button */}
            <Button 
              type="primary"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              size="large"
              className="rounded-xl shadow-md hover:shadow-lg transition-all mt-6"
              style={{ 
                minWidth: 200,
                height: 56,
                fontSize: 18,
                fontWeight: 600
              }}
            >
              Đăng xuất
            </Button>

            {/* Additional Info */}
            <Typography.Text 
              type="secondary" 
              style={{ fontSize: 14, marginTop: 24, textAlign: 'center' }}
            >
              Nếu bạn cần quyền truy cập quản trị, vui lòng liên hệ với quản trị viên hệ thống.
            </Typography.Text>
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default UnauthorizedPage;
