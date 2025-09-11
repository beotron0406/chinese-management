'use client';

import React from 'react';
import {  Avatar, Badge, Dropdown, MenuProps } from 'antd';
import { BellOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { Header } from 'antd/es/layout/layout';

const AdminTopbar = () => {
    const { logout } = useAuth(); // Lấy hàm logout từ context

    const handleLogout = () => {
        logout();
    };
    
    const items: MenuProps['items'] = [
      { key: '1', label: 'Thông tin cá nhân', icon: <UserOutlined /> },
      { 
        key: '2', 
        label: 'Đăng xuất', 
        icon: <LogoutOutlined />,
        danger: true,
        onClick: handleLogout, // Thêm sự kiện onClick
      },
    ];

  return (
    <Header className="bg-white p-0 px-6 flex justify-end items-center">
      <div className="flex items-center gap-6">
        <Badge count={5}>
          <BellOutlined className="text-xl" />
        </Badge>
        <Dropdown menu={{ items }} placement="bottomRight" arrow>
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar icon={<UserOutlined />} />
            <span>Admin</span>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default AdminTopbar;