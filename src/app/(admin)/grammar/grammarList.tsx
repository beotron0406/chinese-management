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
import PageHeader from "@/components/common/PageHeader";
import GrammarFormModal from "@/components/grammar/GrammarFormModal";

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
      message.error("Không thể tải danh sách mẫu ngữ pháp");
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

  const handleSubmit = async (values: GrammarFormValues) => {
    try {
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
            example:
              values.examples?.map((ex) => ({
                chinese: ex.chinese.split(""),
                pinyin: ex.pinyin ? ex.pinyin.split(/\s+/) : undefined,
                translation: ex.translation,
              })) || [],
          },
        };

        await grammarApi.updateGrammarPattern(values.translationId!, formData);
        message.success("Cập nhật mẫu ngữ pháp thành công!");
      } else {
        if (!values.pattern || values.pattern.length === 0) {
          message.error("Vui lòng nhập mẫu câu!");
          return;
        }
        if (!values.grammarPoint) {
          message.error("Vui lòng nhập điểm ngữ pháp!");
          return;
        }
        if (!values.explanation) {
          message.error("Vui lòng nhập giải thích!");
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
            example:
              values.examples?.map((ex) => ({
                chinese: ex.chinese.split(""),
                pinyin: ex.pinyin ? ex.pinyin.split(/\s+/) : undefined,
                translation: ex.translation,
              })) || [],
          },
        };

        const result = await grammarApi.createCompleteGrammarPattern(formData);
        message.success("Tạo mẫu ngữ pháp thành công!");
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
      message.success("Xóa mẫu ngữ pháp thành công!");
      fetchData();
    } catch (error) {
      message.error("Không thể xóa mẫu ngữ pháp");
      console.error("Error deleting grammar pattern:", error);
    }
  };

  // Handle edit
  const handleEdit = async (record: GrammarPattern) => {
    try {
      setLoading(true);
      console.log('🔧 handleEdit called with record:', record);
      
      // Fetch full data from API to ensure we have all information
      const fullData = await grammarApi.getGrammarPatternById(record.id);
      console.log('✅ Full data fetched:', fullData);
      
      // Set editing pattern first
      setEditingPattern(fullData);
      console.log('📦 editingPattern set, opening modal...');
      
      // Use setTimeout to ensure state is updated before opening modal
      setTimeout(() => {
        setModalVisible(true);
      }, 0);
    } catch (error) {
      message.error("Không thể tải thông tin mẫu ngữ pháp");
      console.error("Error fetching grammar pattern:", error);
    } finally {
      setLoading(false);
    }
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
      title: "Mẫu Câu",
      dataIndex: "pattern",
      key: "pattern",
      render: (pattern: string[]) => (
        <span className="font-mono">{pattern?.join(" ")}</span>
      ),
    },
    {
      title: "Phiên Âm",
      dataIndex: "patternPinyin",
      key: "patternPinyin",
      render: (pinyin: string[]) => (
        <span className="text-gray-600">{pinyin?.join(" ")}</span>
      ),
    },
    {
      title: "Công Thức",
      dataIndex: "patternFormula",
      key: "patternFormula",
    },
    {
      title: "Cấp HSK",
      dataIndex: "hskLevel",
      key: "hskLevel",
      width: 100,
      render: (level: HSKLevel) =>
        level ? <Tag color="blue">HSK {level}</Tag> : "-",
    },
    {
      title: "Điểm Ngữ Pháp",
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
            title="Bạn có chắc chắn muốn xóa mẫu ngữ pháp này?"
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
        title="Quản Lý Mẫu Ngữ Pháp"
        subtitle="Tạo và quản lý các mẫu ngữ pháp"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Tạo Mẫu Ngữ Pháp Mới
          </Button>
        }
      />

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Tìm kiếm mẫu ngữ pháp..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <Select
            placeholder="Lọc theo Cấp HSK"
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
