import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { ReadOutlined, UserOutlined } from '@ant-design/icons';

const DashboardPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="Tổng số bài học" value={1128} prefix={<ReadOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Số lượng người dùng" value={93} prefix={<UserOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;