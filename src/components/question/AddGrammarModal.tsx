"use client";
import React, { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Button,
  message,
  Input,
  Space,
  Tag,
  Checkbox,
  Typography,
  Divider,
} from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { grammarApi } from "@/services/grammarApi";
import { lessonApi } from "@/services/lessonApi";
import { GrammarPattern } from "@/types/grammarTypes";

const { Search } = Input;
const { Text } = Typography;

interface AddGrammarModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  lessonId: string;
}

const AddGrammarModal: React.FC<AddGrammarModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  lessonId,
}) => {
  const [loading, setLoading] = useState(false);
  const [grammarPatterns, setGrammarPatterns] = useState<GrammarPattern[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Fetch grammar patterns data
  const fetchGrammarData = async (searchQuery = "", currentPage = 1) => {
    try {
      setLoading(true);
      const response = await grammarApi.getAllGrammarPatterns({
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
        sortBy: "id",
        sortOrder: "DESC",
      });

      setGrammarPatterns(response.patterns);
      setTotal(response.total);
    } catch (error) {
      console.error("Error fetching grammar patterns:", error);
      message.error("Không thể tải danh sách mẫu ngữ pháp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchGrammarData();
      setSelectedPatterns([]);
      setSearchTerm("");
      setPage(1);
    }
  }, [visible]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
    fetchGrammarData(value, 1);
  };

  const handleSelectPattern = (patternId: number, checked: boolean) => {
    if (checked) {
      setSelectedPatterns([...selectedPatterns, patternId]);
    } else {
      setSelectedPatterns(selectedPatterns.filter(id => id !== patternId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = grammarPatterns.map(pattern => pattern.id);
      setSelectedPatterns(allIds);
    } else {
      setSelectedPatterns([]);
    }
  };

  const handleAddGrammarPatterns = async () => {
    if (selectedPatterns.length === 0) {
      message.warning("Vui lòng chọn ít nhất một mẫu ngữ pháp");
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for API (auto-increment orderIndex)
      const patternsToAdd = selectedPatterns.map(grammarPatternId => ({
        grammarPatternId
      }));

      await lessonApi.addGrammarPatternsToLesson(parseInt(lessonId), patternsToAdd);
      
      message.success(`Đã thêm thành công ${selectedPatterns.length} mẫu ngữ pháp vào bài học`);
      onSuccess();
      onCancel();
    } catch (error) {
      console.error("Error adding grammar patterns to lesson:", error);
      message.error("Không thể thêm mẫu ngữ pháp vào bài học");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: (
        <Checkbox
          checked={selectedPatterns.length === grammarPatterns.length && grammarPatterns.length > 0}
          indeterminate={selectedPatterns.length > 0 && selectedPatterns.length < grammarPatterns.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          Chọn
        </Checkbox>
      ),
      key: "select",
      width: 80,
      render: (_: any, record: GrammarPattern) => (
        <Checkbox
          checked={selectedPatterns.includes(record.id)}
          onChange={(e) => handleSelectPattern(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: "Mẫu Câu",
      key: "pattern",
      render: (_: any, record: GrammarPattern) => (
        <Space direction="vertical" size="small">
          <Text strong style={{ fontSize: "16px" }}>
            {Array.isArray(record.pattern) ? record.pattern.join(" ") : record.pattern}
          </Text>
          {record.patternPinyin && (
            <Text type="secondary">
              {Array.isArray(record.patternPinyin) ? record.patternPinyin.join(" ") : record.patternPinyin}
            </Text>
          )}
          {record.patternFormula && (
            <Text code>{record.patternFormula}</Text>
          )}
        </Space>
      ),
    },
    {
      title: "Cấp HSK",
      dataIndex: "hskLevel",
      key: "hskLevel",
      render: (level: number) => level && <Tag color="green">HSK {level}</Tag>,
    },
    {
      title: "Bản Dịch",
      key: "translation",
      render: (_: any, record: GrammarPattern) => (
        <div>
          {record.translations && record.translations.length > 0 && (
            <div>
              {record.translations.map((trans, index) => (
                <div key={index} style={{ marginBottom: "8px" }}>
                  <Text strong>{trans.grammarPoint}</Text>
                  <br />
                  <Text type="secondary">{trans.explanation}</Text>
                  {trans.example && trans.example.length > 0 && (
                    <div style={{ marginTop: "4px" }}>
                      {trans.example.slice(0, 1).map((ex, exIndex) => (
                        <div key={exIndex}>
                          <Text style={{ fontSize: "12px", color: "#666" }}>
                            Ví dụ: {Array.isArray(ex.chinese) ? ex.chinese.join("") : ex.chinese} - {ex.translation}
                          </Text>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="Thêm Mẫu Ngữ Pháp Vào Bài Học"
      open={visible}
      onCancel={onCancel}
      width={1200}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="add"
          type="primary"
          loading={loading}
          onClick={handleAddGrammarPatterns}
          disabled={selectedPatterns.length === 0}
          icon={<PlusOutlined />}
        >
          Thêm {selectedPatterns.length} Mẫu
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Search
          placeholder="Tìm kiếm theo mẫu câu, công thức hoặc bản dịch..."
          allowClear
          onSearch={handleSearch}
          style={{ width: "100%" }}
          prefix={<SearchOutlined />}
        />

        {selectedPatterns.length > 0 && (
          <>
            <Text>Đã chọn {selectedPatterns.length} mẫu ngữ pháp</Text>
            <Divider style={{ margin: "12px 0" }} />
          </>
        )}

        <Table
          columns={columns}
          dataSource={grammarPatterns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (newPage) => {
              setPage(newPage);
              fetchGrammarData(searchTerm, newPage);
            },
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trong ${total} mẫu ngữ pháp`,
          }}
          scroll={{ y: 400 }}
          size="small"
        />
      </Space>
    </Modal>
  );
};

export default AddGrammarModal;