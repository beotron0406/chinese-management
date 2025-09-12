'use client';

import React from 'react';
import { Layout, Menu } from 'antd';
import { DashboardOutlined, ReadOutlined, SettingOutlined, BookOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const { Sider } = Layout;

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: <Link href="/dashboard">Dashboard</Link>,
  },
  {
    key: '/courses',
    icon: <BookOutlined />,
    label: <Link href="/courses">Quản lý Khóa học</Link>,
  },
  {
    key: '/lessons',
    icon: <ReadOutlined />,
    label: <Link href="/lessons">Quản lý Bài học</Link>,
  },
  {
    key: '/question',
    icon: <ReadOutlined />,
    label: <Link href="/question">Quản lý Câu hỏi</Link>,
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: <Link href="/settings">Cài đặt</Link>,
  },
];

const AdminSidebar = () => {
  const pathname = usePathname();

  // Tìm key active dựa trên pathname
  const activeKey = menuItems.find(item => pathname.startsWith(item.key))?.key || '/dashboard';

  return (
    <Sider width={250} theme="dark" collapsible>
      <div className="text-white text-2xl font-bold text-center my-4">CMS Admin</div>
      <Menu theme="dark" mode="inline" selectedKeys={[activeKey]} items={menuItems} />
    </Sider>
  );
};

export default AdminSidebar;