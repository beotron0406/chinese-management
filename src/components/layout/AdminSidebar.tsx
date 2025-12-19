import React from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  ReadOutlined,
  SettingOutlined,
  BookOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

const { Sider } = Layout;

const menuItems = [
  {
    key: "dashboard",
    icon: <DashboardOutlined />,
    label: <Link href="/dashboard">Trang chủ</Link>,
  },
  {
    key: "courses",
    icon: <BookOutlined />,
    label: <Link href="/courses">Khóa học</Link>,
  },
  {
    key: "words",
    icon: <ReadOutlined />,
    label: <Link href="/words">Từ vựng</Link>,
  },
  {
    key: "grammar",
    icon: <FileTextOutlined />,
    label: <Link href="/grammar">Ngữ pháp</Link>,
  },
];

const AdminSidebar = () => {
  const pathname = usePathname();

  // Determine active key based on pathname
  const getActiveKey = () => {
    if (pathname === "/dashboard") return "dashboard";
    if (pathname.startsWith("/courses")) return "courses";
    if (pathname.startsWith("/words")) return "words";
    if (pathname.startsWith("/grammar")) return "grammar";
    return "dashboard"; // default
  };

  return (
    <Sider width={250} theme="dark" >
      <div className="text-white text-2xl font-bold text-center my-4">
        Chinese LMS
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getActiveKey()]}
        items={menuItems}
      />
    </Sider>
  );
};

export default AdminSidebar;
