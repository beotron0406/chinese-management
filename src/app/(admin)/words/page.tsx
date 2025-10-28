"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Input,
  Modal,
  message,
  Tooltip,
  Tag,
  Row,
  Col,
  Pagination,
  Avatar,
  Divider,
  Empty,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SoundOutlined,
  PictureOutlined,
  BookOutlined,
  GlobalOutlined,
  CalendarOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import PageHeader from "@/components/common/PageHeader";
import { fetchWords, deleteWord } from "@/services/wordApi";
import { Word } from "@/types/wordTypes";
import WordForm from "@/components/shared/form/words/WordForm";

const WordPage = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [searchText, setSearchText] = useState("");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  const fetchWordData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWords({
        page,
        limit: pageSize,
        search: searchText,
        sortBy: "id",
        sortOrder: "DESC",
      });

      console.log("🔍 API Response received:", response);

      // Since we fixed the API, response should now be the correct format
      if (response && response.words && Array.isArray(response.words)) {
        setWords(response.words);
        setTotal(response.total || 0);
        console.log("✅ Successfully loaded", response.words.length, "words");
      } else {
        console.error("❌ Unexpected response format:", response);
        setWords([]);
        setTotal(0);
        message.error("Unexpected data format from server");
      }
    } catch (error: any) {
      console.error("❌ Fetch error:", error);

      let errorMessage = "Failed to load words";
      if (error.response?.status === 401) {
        errorMessage = "Unauthorized. Please login again.";
      } else if (error.response?.status === 403) {
        errorMessage = "Access forbidden. Check your permissions.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
      setWords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchText]);

  useEffect(() => {
    fetchWordData();
  }, [fetchWordData]);

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: "Delete Word",
      content:
        "Are you sure you want to delete this word? This action cannot be undone and will delete all senses and translations.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteWord(id);
          message.success("Word deleted successfully");
          fetchWordData();
        } catch (error: any) {
          console.error("Failed to delete word:", error);
          message.error(
            error?.response?.data?.message || "Failed to delete word"
          );
        }
      },
    });
  };

  const handleFormSuccess = () => {
    fetchWordData();
    setCreateModalVisible(false);
    setEditModalVisible(false);
    setSelectedWord(null);
  };

  const getHskLevelColor = (level?: number): string => {
    if (!level || level < 1) return "default";
    const colorMap: { [key: number]: string } = {
      1: "green",
      2: "cyan",
      3: "blue",
      4: "purple",
      5: "magenta",
      6: "red",
      7: "orange",
      8: "gold",
      9: "lime",
    };
    return colorMap[level] || "default";
  };

  const handlePaginationChange = (newPage: number, newPageSize?: number) => {
    setPage(newPage);
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setPage(1);
    }
  };

  const renderWordCard = (word: Word) => {
    // Get primary sense or first sense
    const primarySense =
      word.senses?.find((sense) => sense.isPrimary) || word.senses?.[0];
    const translation = primarySense?.translations?.[0];
    const hasImage = !!primarySense?.imageUrl;
    const hasAudio = !!primarySense?.audioUrl;
    const sensesCount = word.senses?.length || 0;

    return (
      <Col xs={24} sm={12} md={12} lg={8} xl={6} key={word.id}>
        <Card
          className="h-full shadow-sm hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500"
          bodyStyle={{ padding: "16px" }}
          actions={[
            <Tooltip title="Edit Word" key="edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => {
                  setSelectedWord(word);
                  setEditModalVisible(true);
                }}
                className="hover:text-blue-600"
              />
            </Tooltip>,
            <Tooltip title="Delete Word" key="delete">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(word.id)}
                className="hover:text-red-600"
              />
            </Tooltip>,
          ]}
        >
          {/* Header with Chinese Characters */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-800">
                  {word.simplified}
                </span>
                {word.traditional && word.traditional !== word.simplified && (
                  <span className="text-lg text-gray-500">
                    ({word.traditional})
                  </span>
                )}
              </div>

              <div className="flex flex-col items-end gap-1">
                <Tag color="blue">#{word.id}</Tag>
                {primarySense?.isPrimary && (
                  <Tag
                    color="gold"
                    icon={
                      primarySense.isPrimary ? <StarFilled /> : <StarOutlined />
                    }
                  >
                    Primary
                  </Tag>
                )}
              </div>
            </div>

            {/* Pinyin */}
            <div className="text-red-500 font-medium text-lg italic mb-2">
              {primarySense?.pinyin || "No pinyin"}
            </div>

            {/* Part of Speech and HSK Level */}
            <div className="flex items-center gap-2 mb-3">
              {primarySense?.partOfSpeech && (
                <Tag color="purple" icon={<BookOutlined />}>
                  {primarySense.partOfSpeech}
                </Tag>
              )}
              {primarySense?.hskLevel && (
                <Tag color={getHskLevelColor(primarySense.hskLevel)}>
                  HSK {primarySense.hskLevel}
                </Tag>
              )}
            </div>
          </div>

          {/* Translation Section */}
          <div className="bg-green-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <GlobalOutlined className="text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Vietnamese Translation
              </span>
            </div>

            <div className="text-green-700 font-medium mb-1">
              {translation?.translation || "No translation available"}
            </div>

            {translation?.additionalDetail && (
              <div className="text-sm text-green-600 italic">
                {translation.additionalDetail}
              </div>
            )}
          </div>

          {/* Media Icons */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {hasAudio && (
                <Tooltip title="Audio available">
                  <Tag color="orange" icon={<SoundOutlined />}>
                    Audio
                  </Tag>
                </Tooltip>
              )}
              {hasImage && (
                <Tooltip title="Image available">
                  <Tag color="green" icon={<PictureOutlined />}>
                    Image
                  </Tag>
                </Tooltip>
              )}
              {!hasAudio && !hasImage && <Tag color="default">No Media</Tag>}
            </div>

            <Tag color="purple">
              {sensesCount} sense{sensesCount !== 1 ? "s" : ""}
            </Tag>
          </div>

          {/* Footer with date */}
          <Divider style={{ margin: "12px 0" }} />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <CalendarOutlined />
              <span>
                {word.createdAt
                  ? new Date(word.createdAt).toLocaleDateString("vi-VN")
                  : "Unknown"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-gray-400">ID: {word.id}</span>
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="Word Management"
        subtitle={`Manage your Chinese vocabulary database (${total} words)`}
        extra={[
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
            size="large"
          >
            Add New Word
          </Button>,
        ]}
      />

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Input
            placeholder="Search by Chinese characters, pinyin, or Vietnamese translation..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="flex-1 max-w-md"
            size="large"
          />
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              Total: <strong>{total}</strong> words
            </span>
            <span>
              Page: <strong>{page}</strong> of{" "}
              <strong>{Math.ceil(total / pageSize) || 1}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Words Grid */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="text-4xl mb-4">🔄</div>
            <div className="text-lg text-gray-600 mb-2">Loading words...</div>
            <div className="text-sm text-gray-400">
              Please wait while we fetch your vocabulary
            </div>
          </div>
        ) : words.length > 0 ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Vocabulary Cards ({words.length} of {total})
              </h2>
              {searchText && (
                <Tag color="blue">Filtered by: "{searchText}"</Tag>
              )}
            </div>
            <Row gutter={[16, 16]}>{words.map(renderWordCard)}</Row>
          </>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="text-center">
                <div className="text-lg text-gray-600 mb-2">
                  {searchText ? "No words found" : "No words available"}
                </div>
                <div className="text-sm text-gray-400">
                  {searchText
                    ? "Try adjusting your search terms or clear the filter"
                    : "Start building your vocabulary by adding your first word"}
                </div>
              </div>
            }
          >
            {!searchText && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
                size="large"
              >
                Add First Word
              </Button>
            )}
          </Empty>
        )}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={handlePaginationChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `Showing ${range[0]}-${range[1]} of ${total} words`
            }
            pageSizeOptions={["12", "24", "48", "96"]}
            className="text-center"
          />
        </div>
      )}

      {/* Modals */}
      <Modal
        title="Add New Word"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <WordForm onSuccess={handleFormSuccess} />
      </Modal>

      <Modal
        title="Edit Word"
        open={editModalVisible && !!selectedWord}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedWord(null);
        }}
        footer={null}
        width={900}
        destroyOnClose
      >
        {selectedWord && (
          <WordForm wordData={selectedWord} onSuccess={handleFormSuccess} />
        )}
      </Modal>
    </div>
  );
};

export default WordPage;
