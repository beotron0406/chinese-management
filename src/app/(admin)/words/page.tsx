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
  Spin,
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
import WordForm from "@/components/words/WordForm";

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

      console.log("🔍 Nhận phản hồi từ API:", response);

      // Since we fixed the API, response should now be the correct format
      if (response && response.words && Array.isArray(response.words)) {
        setWords(response.words);
        setTotal(response.total || 0);
        console.log("✅ Tải thành công", response.words.length, "từ vựng");
      } else {
        console.error("❌ Định dạng phản hồi không mong đợi:", response);
        setWords([]);
        setTotal(0);
        message.error("Định dạng dữ liệu không hợp lệ từ máy chủ");
      }
    } catch (error: any) {
      console.error("❌ Lỗi tải dữ liệu:", error);

      let errorMessage = "Không thể tải từ vựng";
      if (error.response?.status === 401) {
        errorMessage = "Chưa được xác thực. Vui lòng đăng nhập lại.";
      } else if (error.response?.status === 403) {
        errorMessage = "Không có quyền truy cập. Kiểm tra quyền của bạn.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
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
      title: "Xóa Từ Vựng",
      content:
        "Bạn có chắc chắn muốn xóa từ này? Hành động này không thể hoàn tác và sẽ xóa tất cả các nghĩa và bản dịch.",
      okText: "Có, Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteWord(id);
          message.success("Xóa từ vựng thành công");
          fetchWordData();
        } catch (error: any) {
          console.error("Không thể xóa từ vựng:", error);
          message.error(
            error?.response?.data?.message || "Không thể xóa từ vựng"
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
    
    // Validate media URLs - exclude blob URLs and empty strings
    const hasImage = !!primarySense?.imageUrl && 
      primarySense.imageUrl.trim() !== '' &&
      !primarySense.imageUrl.startsWith('blob:');
    const hasAudio = !!primarySense?.audioUrl && 
      primarySense.audioUrl.trim() !== '' &&
      !primarySense.audioUrl.startsWith('blob:');
    const sensesCount = word.senses?.length || 0;

    return (
      <Col xs={24} sm={12} md={12} lg={8} xl={6} key={word.id}>
        <Card
          className="h-full shadow-sm hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 [&_.ant-card-body]:p-4"
          actions={[
            <Tooltip title="Chỉnh sửa từ vựng" key="edit">
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
            <Tooltip title="Xóa từ vựng" key="delete">
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
                    Chính
                  </Tag>
                )}
              </div>
            </div>

            {/* Pinyin */}
            <div className="text-red-500 font-medium text-lg italic mb-2">
              {primarySense?.pinyin || "Không có phiên âm"}
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
                Bản dịch Tiếng Việt
              </span>
            </div>

            <div className="text-green-700 font-medium mb-1">
              {translation?.translation || "Không có bản dịch"}
            </div>

            {translation?.additionalDetail && (
              <div className="text-sm text-green-600 italic">
                {translation.additionalDetail}
              </div>
            )}
          </div>

          {/* Image Display */}
          {hasImage && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <PictureOutlined className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Hình ảnh</span>
              </div>
              <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={primarySense.imageUrl!}
                  alt={word.simplified}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = 
                      '<div class="flex items-center justify-center h-full text-gray-400"><PictureOutlined /> Không thể tải hình ảnh</div>';
                  }}
                />
              </div>
            </div>
          )}

          {/* Audio Player */}
          {hasAudio && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <SoundOutlined className="text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Âm thanh</span>
              </div>
              <audio
                controls
                className="w-full h-10 max-h-10"
              >
                <source src={primarySense.audioUrl!} type="audio/mpeg" />
                <source src={primarySense.audioUrl!} type="audio/wav" />
                Trình duyệt không hỗ trợ phát âm thanh.
              </audio>
            </div>
          )}

          {/* Media Summary */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 flex-wrap">
              {hasAudio && (
                <Tag color="orange" icon={<SoundOutlined />}>
                  Có âm thanh
                </Tag>
              )}
              {hasImage && (
                <Tag color="green" icon={<PictureOutlined />}>
                  Có hình ảnh
                </Tag>
              )}
              {!hasAudio && !hasImage && (
                <Tag color="default">Không có phương tiện</Tag>
              )}
            </div>

            <Tag color="purple">
              {sensesCount} nghĩa{sensesCount !== 1 ? "" : ""}
            </Tag>
          </div>

          {/* Footer with date */}
          <Divider className="!my-3" />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <CalendarOutlined />
              <span>
                {word.createdAt
                  ? new Date(word.createdAt).toLocaleDateString("vi-VN")
                  : "Không xác định"}
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
        title="Quản lý Từ Vựng"
        subtitle={`Quản lý cơ sở dữ liệu từ vựng Tiếng Trung của bạn (${total} từ)`}
        extra={[
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
            size="large"
          >
            Thêm Từ Mới
          </Button>,
        ]}
      />

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Input
            placeholder="Tìm kiếm theo ký tự Trung Quốc, phiên âm hoặc bản dịch Tiếng Việt..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="flex-1 max-w-md"
            size="large"
          />
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              Tổng: <strong>{total}</strong> từ
            </span>
            <span>
              Trang: <strong>{page}</strong> của{" "}
              <strong>{Math.ceil(total / pageSize) || 1}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Words Grid */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Spin size="large" tip="Đang tải từ vựng..." />
          </div>
        ) : words.length > 0 ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Thẻ Từ Vựng ({words.length} của {total})
              </h2>
              {searchText && (
                <Tag color="blue">Lọc theo: "{searchText}"</Tag>
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
                  {searchText ? "Không tìm thấy từ nào" : "Chưa có từ vựng nào"}
                </div>
                <div className="text-sm text-gray-400">
                  {searchText
                    ? "Hãy thử điều chỉnh điều kiện tìm kiếm hoặc xóa bộ lọc"
                    : "Bắt đầu xây dựng từ vựng của bạn bằng cách thêm từ đầu tiên"}
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
                Thêm Từ Đầu Tiên
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
              `Hiển thị ${range[0]}-${range[1]} trong ${total} từ`
            }
            pageSizeOptions={["12", "24", "48", "96"]}
            className="text-center"
          />
        </div>
      )}

      {/* Modals */}
      <Modal
        title="Thêm Từ Vựng Mới"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <WordForm onSuccess={handleFormSuccess} />
      </Modal>

      <Modal
        title="Chỉnh Sửa Từ Vựng"
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