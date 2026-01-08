'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button, Form, Input, Card, Typography, message, ConfigProvider } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import Image from 'next/image';

const { Title } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await login(values.email, values.password);
      
      if (result.isAdmin) {
        message.success('Login successful');
        router.push('/dashboard');
      } else {
        // User role is not admin - redirect to unauthorized page
        router.push('/unauthorized');
      }
    } catch (err) {
      message.error('Invalid email or password');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1976d2', // Material Blue
          borderRadius: 12,
          fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
        },
        components: {
          Input: {
            controlHeight: 56, // Increased height
            fontSize: 18,     // Increased font size
            colorBgContainer: 'rgba(255, 255, 255, 0.9)',
          },
          Button: {
            controlHeight: 56, // Increased height
            fontSize: 18,     // Increased font size
            fontWeight: 600,
          },
          Card: {
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          },
        },
      }}
    >
      <div 
        className="flex items-center justify-center lg:justify-end min-h-screen bg-cover bg-center relative"
        style={{ backgroundImage: "url('/assets/login-background.jpg')" }}
      >
        <Card 
          className="w-[500px] shadow-2xl backdrop-blur-md bg-white/80 border-none mx-4 lg:mx-0 lg:mr-32" 
          bodyStyle={{ padding: '60px 48px' }}
        >
          <div className="flex flex-col items-center mb-10">
            <div className="relative w-32 h-32 mb-6"> 
              <Image 
                src="/assets/logo.png" 
                alt="HanziiLab Logo" 
                fill
                className="object-contain"
                priority
              />
            </div>
            <Title level={2} style={{ margin: 0, color: '#333', fontWeight: 500 }}>
              Welcome Back
            </Title>
            <Typography.Text type="secondary" style={{ fontSize: 18 }}>
              Sign in to HanziiLab Dashboard
            </Typography.Text>
          </div>

          <Form
            name="login_form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[{ required: true, message: 'Please input your Username!' }]}
            >
              <Input 
                prefix={<UserOutlined className="text-gray-400" />} 
                placeholder="Username" 
                className="rounded-xl"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your Password!' }]}
            >
              <Input.Password 
                prefix={<LockOutlined className="text-gray-400" />} 
                placeholder="Password" 
                className="rounded-xl"
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 32 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
                className="rounded-xl shadow-md hover:shadow-lg transition-all"
                style={{ backgroundColor: '#1976d2' }}
              >
                LOGIN
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </ConfigProvider>


  );
};

export default LoginPage;
