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
    label: <Link href="/courses">Courses</Link>,
  },
  {
    key: '/words',
    icon: <ReadOutlined />,
    label: <Link href="/words">Words</Link>,
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: <Link href="/settings">Settings</Link>,
  },
];

const AdminSidebar = () => {
  const pathname = usePathname();

  // Tìm key active dựa trên pathname
  const activeKey = menuItems.find(item => pathname.startsWith(item.key))?.key || '/dashboard';

  return (
    <Sider width={250} theme="dark" collapsible>
      <div className="text-white text-2xl font-bold text-center my-4">Chinese LMS</div>
      <Menu theme="dark" mode="inline" selectedKeys={[activeKey]} items={menuItems} />
    </Sider>
  );
};

export default AdminSidebar;