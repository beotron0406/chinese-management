import React from 'react';
import Link from 'next/link';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: string;
  extra?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  backLink, 
  extra 
}) => {
  return (
    <div className="flex flex-col mb-6 pb-4 border-b">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {backLink && (
            <Link href={backLink}>
              <Button icon={<ArrowLeftOutlined />} size="small">
                Back
              </Button>
            </Link>
          )}
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <div>{extra}</div>
      </div>
      {subtitle && (
        <p className="text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
};

export default PageHeader;