"use client";

import React from "react";
import {
  BookOutlined,
  TranslationOutlined,
  FileImageOutlined,
  QuestionCircleOutlined,
  OrderedListOutlined,
  LinkOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

// ============================================
// SECTION CONTAINER
// ============================================
export const SectionContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={`p-6 border border-gray-200 rounded-2xl bg-white mb-6 ${className}`}
  >
    {children}
  </div>
);

// ============================================
// SECTION HEADER
// ============================================
export const SectionHeader: React.FC<{
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = ({ step, title, description, icon }) => (
  <div className="flex items-center gap-4 mb-5">
    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-400 to-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-md text-2xl">
      {icon}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Bước {step}
        </span>
      </div>
      <h3 className="text-base font-bold text-gray-900 m-0 mt-1">{title}</h3>
      <p className="text-xs text-gray-500 m-0">{description}</p>
    </div>
  </div>
);

// ============================================
// FORM FIELD WRAPPER
// ============================================
export const FormField: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ label, required, hint, children, action }) => (
  <div className="mb-5">
    <div className="flex justify-between items-center mb-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {action}
    </div>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

// ============================================
// COMMON ICONS FOR SECTIONS
// ============================================
export const SECTION_ICONS = {
  question: <QuestionCircleOutlined />,
  options: <OrderedListOutlined />,
  matching: <LinkOutlined />,
  fill: <EditOutlined />,
  media: <FileImageOutlined />,
  translation: <TranslationOutlined />,
  word: <BookOutlined />,
  result: <CheckCircleOutlined />,
};
