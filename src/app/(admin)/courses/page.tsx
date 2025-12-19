"use client";

import { Tabs, Typography } from "antd";
import PageHeader from "@/components/common/PageHeader";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CourseList from "./courses_list";

const { Title } = Typography;
const { TabPane } = Tabs;

export default function CoursesPage() {
  return (
    <ProtectedRoute adminOnly>
      <div>
        <PageHeader
          title="Quản lý khóa học"
          subtitle="Tạo và quản lý các khóa học cho nền tảng học tiếng Trung"
        />

        <div className="mt-4">
          <Tabs defaultActiveKey="all">
            <TabPane tab="Tất cả khóa học" key="all">
              <CourseList key="all-courses" />
            </TabPane>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
