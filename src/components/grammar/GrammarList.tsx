"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  message,
  Popconfirm,
  Input,
  Select,
  Tag,
  Card,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  GrammarPattern,
  GrammarFormValues,
  GrammarPatternsQueryParams,
} from "@/types/grammarTypes";
import { HSK_LEVEL_OPTIONS, HSKLevel } from "@/enums/hsk-level.enum";
import { grammarApi } from "@/services/grammarApi";
import GrammarFormModal from "./GrammarFormModal";
import PageHeader from "@/components/common/PageHeader";

const { Option } = Select;

const GrammarList: React.FC = () => {
  const [data, setData] = useState<GrammarPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPattern, setEditingPattern] = useState<GrammarPattern | null>(
    null
  );
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<GrammarPatternsQueryParams>({
    page: 1,
    limit: 10,
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await grammarApi.getAllGrammarPatterns(filters);
      setData(response.patterns);
      setPagination({
        current: response.page,
        pageSize: response.limit,
        total: response.total,
      });
    } catch (error) {
      message.error("Không thể tải danh sách grammar patterns");
      console.error("Error fetching grammar patterns:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  // Handle search
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value, page: 1 });
  };

  // Handle HSK level filter
  const handleHSKFilter = (value: HSKLevel) => {
    setFilters({ ...filters, hskLevel: value, page: 1 });
  };

  // Handle create/edit submit
  // Handle create/edit submit
const handleSubmit = async (values: GrammarFormValues) => {
  try {
    console.log('🚀 HandleSubmit called with values:', values);

    if (values.id) {
      // Edit mode
      const formData = {
        pattern: {
          pattern: values.pattern,
          patternPinyin: values.patternPinyin,
          patternFormula: values.patternFormula,
          hskLevel: values.hskLevel,
        },
        translation: {
          language: values.language,
          grammarPoint: values.grammarPoint,
          explanation: values.explanation,
          example: values.examples?.map((ex) => ({
            chinese: ex.chinese.split(""), // Convert string to array here
            pinyin: ex.pinyin ? ex.pinyin.split(/\s+/) : undefined,
            translation: ex.translation,
          })) || [],
        },
      };

      console.log('📝 Edit mode - formData:', formData);
      await grammarApi.updateGrammarPattern(values.translationId!, formData);
      message.success("Cập nhật grammar pattern thành công!");
    } else {
      // Create mode - FIX: Đảm bảo có đủ dữ liệu required
      if (!values.pattern || values.pattern.length === 0) {
        message.error('Vui lòng nhập pattern!');
        return;
      }
      if (!values.grammarPoint) {
        message.error('Vui lòng nhập grammar point!');
        return;
      }
      if (!values.explanation) {
        message.error('Vui lòng nhập giải thích!');
        return;
      }

      const formData = {
        pattern: {
          pattern: values.pattern,
          patternPinyin: values.patternPinyin,
          patternFormula: values.patternFormula,
          hskLevel: values.hskLevel,
        },
        translation: {
          language: values.language || "vn",
          grammarPoint: values.grammarPoint,
          explanation: values.explanation,
          example: values.examples?.map((ex) => ({
            chinese: ex.chinese.split(""), // Convert string to array here
            pinyin: ex.pinyin ? ex.pinyin.split(/\s+/) : undefined,
            translation: ex.translation,
          })) || [],
        },
      };

      console.log('✨ Create mode - formData:', formData);
      console.log('📡 About to call API...');

      const result = await grammarApi.createCompleteGrammarPattern(formData);
      console.log('✅ API result:', result);
      message.success("Tạo grammar pattern thành công!");
    }

    setModalVisible(false);
    setEditingPattern(null);
    fetchData();
  } catch (error) {
    console.error("❌ Error in handleSubmit:", error);
   
  }
};

  // Handle delete
  const handleDelete = async (id: number) => {
    try {
      await grammarApi.deleteGrammarPattern(id);
      message.success("Xóa grammar pattern thành công!");
      fetchData();
    } catch (error) {
      message.error("Không thể xóa grammar pattern");
      console.error("Error deleting grammar pattern:", error);
    }
  };

  // Handle edit
  const handleEdit = (record: GrammarPattern) => {
    setEditingPattern(record);
    setModalVisible(true);
  };

  // Handle create new
  const handleCreate = () => {
    setEditingPattern(null);
    setModalVisible(true);
  };

  // Table columns
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
    },
    {
      title: "Pattern",
      dataIndex: "pattern",
      key: "pattern",
      render: (pattern: string[]) => (
        <span className="font-mono">{pattern?.join(" ")}</span>
      ),
    },
    {
      title: "Pinyin",
      dataIndex: "patternPinyin",
      key: "patternPinyin",
      render: (pinyin: string[]) => (
        <span className="text-gray-600">{pinyin?.join(" ")}</span>
      ),
    },
    {
      title: "Formula",
      dataIndex: "patternFormula",
      key: "patternFormula",
    },
    {
      title: "HSK Level",
      dataIndex: "hskLevel",
      key: "hskLevel",
      width: 100,
      render: (level: HSKLevel) =>
        level ? <Tag color="blue">HSK {level}</Tag> : "-",
    },
    {
      title: "Grammar Point",
      key: "grammarPoint",
      render: (record: GrammarPattern) => (
        <div>
          {record.translations?.map((translation, index) => (
            <Tag key={index} color="green">
              {translation.grammarPoint}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Ngôn ngữ",
      key: "languages",
      render: (record: GrammarPattern) => (
        <div>
          {record.translations?.map((translation, index) => (
            <Tag key={index} color="orange">
              {translation.language?.toUpperCase()}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (record: GrammarPattern) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa grammar pattern này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Grammar Patterns Management"
        subtitle="Create and manage grammar patterns"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Tạo Grammar Pattern mới
          </Button>
        }
      />

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Tìm kiếm pattern..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <Select
            placeholder="Lọc theo HSK Level"
            allowClear
            style={{ width: 150 }}
            onChange={handleHSKFilter}
          >
            {HSK_LEVEL_OPTIONS.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} items`,
            onChange: (page, pageSize) => {
              setFilters({ ...filters, page, limit: pageSize });
            },
          }}
        />
      </Card>

      <GrammarFormModal
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPattern(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingPattern}
        loading={loading}
      />
    </div>
  );
};

export default GrammarList;
