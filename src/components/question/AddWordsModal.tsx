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
import { fetchWords } from "@/services/wordApi";
import { lessonApi } from "@/services/lessonApi";
import { Word, WordSense } from "@/types/wordTypes";

const { Search } = Input;
const { Text } = Typography;

interface AddWordsModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  lessonId: string;
}

interface WordSenseWithSelection extends WordSense {
  selected?: boolean;
  word?: Word;
}

const AddWordsModal: React.FC<AddWordsModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  lessonId,
}) => {
  const [loading, setLoading] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [filteredWords, setFilteredWords] = useState<WordSenseWithSelection[]>([]);
  const [selectedWordSenses, setSelectedWordSenses] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Fetch words data
  const fetchWordsData = async (searchQuery = "", currentPage = 1) => {
    try {
      setLoading(true);
      const response = await fetchWords({
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
        sortBy: "id",
        sortOrder: "DESC",
      });

      setWords(response.words);
      setTotal(response.total);

      // Flatten word senses for table display
      const wordSenses: WordSenseWithSelection[] = [];
      response.words.forEach((word) => {
        if (word.senses) {
          word.senses.forEach((sense) => {
            wordSenses.push({
              ...sense,
              word: word,
              selected: false,
            });
          });
        }
      });

      setFilteredWords(wordSenses);
    } catch (error) {
      console.error("Error fetching words:", error);
      message.error("Failed to fetch words");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchWordsData();
      setSelectedWordSenses([]);
      setSearchTerm("");
      setPage(1);
    }
  }, [visible]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
    fetchWordsData(value, 1);
  };

  const handleSelectWordSense = (wordSenseId: number, checked: boolean) => {
    if (checked) {
      setSelectedWordSenses([...selectedWordSenses, wordSenseId]);
    } else {
      setSelectedWordSenses(selectedWordSenses.filter(id => id !== wordSenseId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredWords.map(ws => ws.id!).filter(Boolean);
      setSelectedWordSenses(allIds);
    } else {
      setSelectedWordSenses([]);
    }
  };

  const handleAddWords = async () => {
    if (selectedWordSenses.length === 0) {
      message.warning("Please select at least one word");
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for API (auto-increment orderIndex)
      const wordsToAdd = selectedWordSenses.map(wordSenseId => ({
        wordSenseId
      }));

      await lessonApi.addWordsToLesson(parseInt(lessonId), wordsToAdd);
      
      message.success(`Successfully added ${selectedWordSenses.length} words to lesson`);
      onSuccess();
      onCancel();
    } catch (error) {
      console.error("Error adding words to lesson:", error);
      message.error("Failed to add words to lesson");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: (
        <Checkbox
          checked={selectedWordSenses.length === filteredWords.length && filteredWords.length > 0}
          indeterminate={selectedWordSenses.length > 0 && selectedWordSenses.length < filteredWords.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          Select
        </Checkbox>
      ),
      key: "select",
      width: 80,
      render: (_: any, record: WordSenseWithSelection) => (
        <Checkbox
          checked={selectedWordSenses.includes(record.id!)}
          onChange={(e) => handleSelectWordSense(record.id!, e.target.checked)}
        />
      ),
    },
    {
      title: "Chinese",
      key: "chinese",
      render: (_: any, record: WordSenseWithSelection) => (
        <Space direction="vertical" size="small">
          <Text strong style={{ fontSize: "16px" }}>
            {record.word?.simplified}
            {record.word?.traditional && record.word.traditional !== record.word.simplified && (
              <Text type="secondary"> ({record.word.traditional})</Text>
            )}
          </Text>
          <Text type="secondary">{record.pinyin}</Text>
        </Space>
      ),
    },
    {
      title: "Part of Speech",
      dataIndex: "partOfSpeech",
      key: "partOfSpeech",
      render: (pos: string) => pos && <Tag color="blue">{pos}</Tag>,
    },
    {
      title: "HSK Level",
      dataIndex: "hskLevel",
      key: "hskLevel",
      render: (level: number) => level && <Tag color="green">HSK {level}</Tag>,
    },
    {
      title: "Translation",
      key: "translation",
      render: (_: any, record: WordSenseWithSelection) => (
        <div>
          {record.translations && record.translations.length > 0 && (
            <div>
              {record.translations.map((trans, index) => (
                <div key={index}>
                  <Text>{trans.translation}</Text>
                  {trans.additionalDetail && (
                    <Text type="secondary"> ({trans.additionalDetail})</Text>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Primary",
      dataIndex: "isPrimary",
      key: "isPrimary",
      render: (isPrimary: boolean) => (
        isPrimary ? <Tag color="gold">Primary</Tag> : null
      ),
    },
  ];

  return (
    <Modal
      title="Add Words to Lesson"
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="add"
          type="primary"
          loading={loading}
          onClick={handleAddWords}
          disabled={selectedWordSenses.length === 0}
          icon={<PlusOutlined />}
        >
          Add {selectedWordSenses.length} Word{selectedWordSenses.length !== 1 ? 's' : ''}
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Search
          placeholder="Search by Chinese characters, pinyin, or translation..."
          allowClear
          onSearch={handleSearch}
          style={{ width: "100%" }}
          prefix={<SearchOutlined />}
        />

        {selectedWordSenses.length > 0 && (
          <>
            <Text>Selected {selectedWordSenses.length} word sense{selectedWordSenses.length !== 1 ? 's' : ''}</Text>
            <Divider style={{ margin: "12px 0" }} />
          </>
        )}

        <Table
          columns={columns}
          dataSource={filteredWords}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (newPage) => {
              setPage(newPage);
              fetchWordsData(searchTerm, newPage);
            },
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} word senses`,
          }}
          scroll={{ y: 400 }}
          size="small"
        />
      </Space>
    </Modal>
  );
};

export default AddWordsModal;