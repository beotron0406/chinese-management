"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Space,
  Popconfirm,
  message,
  Tag,
  Typography,
  Tabs,
  Row,
  Col,
  Statistic,
  Image,
  Empty,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  FileTextOutlined,
  TranslationOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import { lessonApi } from "@/services/lessonApi";
import ItemModal from "@/components/items/ItemModal";
import PageHeader from "@/components/common/PageHeader";
import AddWordsModal from "@/components/question/AddWordsModal";
import AddGrammarModal from "@/components/question/AddGrammarModal";
import {
  ContentItem,
  LessonGrammarPattern,
  LessonWord,
} from "@/types/itemTypes";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

export default function LessonItemsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.course_id as string;
  const lessonId = params.lesson_id as string;

  const [items, setItems] = useState<ContentItem[]>([]);
  const [lessonWords, setLessonWords] = useState<LessonWord[]>([]);
  const [lessonGrammar, setLessonGrammar] = useState<LessonGrammarPattern[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [addWordsModalVisible, setAddWordsModalVisible] = useState(false);
  const [addGrammarModalVisible, setAddGrammarModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [lessonInfo, setLessonInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("items");

  const fetchData = useCallback(async () => {
    if (!lessonId) {
      return;
    }

    setLoading(true);
    try {
      const response = await lessonApi.getLessonWithContent(parseInt(lessonId));

      if (response) {
        const lessonInfoData = {
          id: parseInt(lessonId),
          name: response.name || `Lesson ${lessonId}`,
          description: response.description || "",
        };
        setLessonInfo(lessonInfoData);

        setItems(response.content || []);

        setLessonWords(response.words || []);

        setLessonGrammar(response.grammarPatterns || []);
      } else {
      }
    } catch (error) {
      message.error("Có lỗi khi tải dữ liệu bài học");
      setItems([]);
      setLessonWords([]);
      setLessonGrammar([]);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {}, [items, lessonWords, lessonGrammar, lessonInfo, loading]);

  const handleCreateItem = () => {
    setEditItem(null);
    setModalVisible(true);
  };

  const handleEditItem = (item: ContentItem) => {
    setEditItem(item);
    setModalVisible(true);
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await lessonApi.deleteLessonContent(itemId);
      message.success("Xóa nội dung thành công");
      fetchData();
    } catch (error) {
      message.error("Không thể xóa nội dung");
    }
  };

  const handleModalSuccess = () => {
    fetchData();
    setModalVisible(false);
  };

  const handleDeleteWord = async (wordId: number, wordSenseId: number) => {
    try {
      await lessonApi.removeWordsFromLesson(parseInt(lessonId), [wordSenseId]);
      message.success("Xóa từ thành công");
      fetchData();
    } catch (error) {
      message.error("Không thể xóa từ");
    }
  };

  const handleDeleteGrammarPattern = async (
    patternId: number,
    grammarPatternId: number
  ) => {
    try {
      await lessonApi.removeGrammarPatternsFromLesson(parseInt(lessonId), [
        grammarPatternId,
      ]);
      message.success("Xóa mẫu ngữ pháp thành công");
      fetchData();
    } catch (error) {
      message.error("Không thể xóa mẫu ngữ pháp");
    }
  };

  const renderContentCard = (item: ContentItem) => {
    const { type, data } = item;

    const titleLevel = 5;

    if (type === "content_word_definition") {
      return (
        <Card
          hoverable
          className="mb-3 text-sm"
          size="small"
          extra={
            <Space size="small">
              <Tag color="green" className="text-xs">
                Định nghĩa từ
              </Tag>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditItem(item)}
              />
              <Popconfirm
                title="Xóa nội dung này?"
                onConfirm={() => handleDeleteItem(item.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          }
        >
          <Row gutter={12}>
            {data.picture_url && (
              <Col span={6}>
                <Image
                  src={data.picture_url}
                  alt="word"
                  className="w-full max-h-[120px] object-cover"
                />
              </Col>
            )}
            <Col span={data.picture_url ? 18 : 24}>
              <Title level={3} className="!mb-1">
                {data.chinese_text}
              </Title>
              <Text type="secondary" className="text-sm">
                {data.pinyin}
              </Text>
              <br />
              <Tag color="blue" className="text-xs mt-1">
                {data.speech}
              </Tag>
              <Paragraph className="mt-2 !mb-0 text-sm">
                {data.translation}
              </Paragraph>
              {data.audio_url && (
                <audio
                  controls
                  src={data.audio_url}
                  className="w-full mt-2 h-8"
                />
              )}
            </Col>
          </Row>
        </Card>
      );
    }

    if (type === "content_sentences") {
      return (
        <Card
          hoverable
          className="mb-3 text-sm"
          size="small"
          extra={
            <Space size="small">
              <Tag color="cyan" className="text-xs">
                Câu
              </Tag>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditItem(item)}
              />
              <Popconfirm
                title="Xóa nội dung này?"
                onConfirm={() => handleDeleteItem(item.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          }
        >
          {data.picture_url && (
            <Image
              src={data.picture_url}
              alt="sentences"
              className="mb-3 max-w-[200px] max-h-[120px] object-cover"
            />
          )}
          {Array.isArray(data.chinese_text) &&
            data.chinese_text.map((text: string, index: number) => (
              <div key={index} className="mb-2">
                <Title level={titleLevel} className="!mb-0.5">
                  {text}
                </Title>
                <Text type="secondary" className="text-xs">
                  {data.pinyin?.[index]}
                </Text>
              </div>
            ))}
          {data.explaination && (
            <Paragraph className="mt-3 italic text-xs !mb-0">
              {data.explaination}
            </Paragraph>
          )}
          {data.audio_url && (
            <audio
              controls
              src={data.audio_url}
              className="w-full mt-2 h-8"
            />
          )}
        </Card>
      );
    }

    if (type.startsWith("question_selection_")) {
      return (
        <Card
          hoverable
          className="mb-3 text-sm"
          size="small"
          extra={
            <Space size="small">
              <Tag color="blue" className="text-xs">
                Câu hỏi lựa chọn
              </Tag>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditItem(item)}
              />
              <Popconfirm
                title="Xóa nội dung này?"
                onConfirm={() => handleDeleteItem(item.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          }
        >
          <Title level={titleLevel} className="!mb-2">
            {data.instruction}
          </Title>
          {data.question && (
            <Paragraph className="text-sm !mb-3">
              {data.question}
            </Paragraph>
          )}

          {data.audio_url && (
            <div className="mb-3">
              <audio
                controls
                src={data.audio_url}
                className="w-full h-8"
              />
              {data.audio_transcript_chinese && (
                <div className="mt-1.5">
                  <Text className="text-xs">
                    {data.audio_transcript_chinese}
                  </Text>
                  <br />
                  <Text type="secondary" className="text-xs">
                    {data.audio_transcript_pinyin}
                  </Text>
                </div>
              )}
            </div>
          )}

          <Row gutter={[12, 12]}>
            {data.options?.map((option: any) => {
              const isCorrect = option.id === data.correctAnswer;
              return (
                <Col span={12} key={option.id}>
                  <Card
                    size="small"
                    className={isCorrect ? "border-2 border-green-500" : "border border-gray-300"}
                    bodyStyle={{ padding: 8 }}
                  >
                    {option.image ? (
                      <Image
                        src={option.image}
                        alt={option.alt}
                        className="w-full max-h-[80px] object-cover"
                      />
                    ) : (
                      <Text className="text-xs">{option.text}</Text>
                    )}
                    {isCorrect && (
                      <CheckCircleOutlined className="text-green-500 ml-1 text-xs" />
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>

          {data.explanation && (
            <Paragraph className="mt-3 p-2 bg-gray-100 text-xs !mb-0">
              <Text strong className="text-xs">
                Giải thích:{" "}
              </Text>
              {data.explanation}
            </Paragraph>
          )}
        </Card>
      );
    }

    if (type.startsWith("question_matching_")) {
      return (
        <Card
          hoverable
          className="mb-3 text-sm"
          size="small"
          extra={
            <Space size="small">
              <Tag color="purple" className="text-xs">
                Câu hỏi ghép nối
              </Tag>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditItem(item)}
              />
              <Popconfirm
                title="Delete this item?"
                onConfirm={() => handleDeleteItem(item.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          }
        >
          <Title level={titleLevel} className="!mb-3">
            {data.instruction}
          </Title>

          <Row gutter={12}>
            <Col span={12}>
              <Title level={5} className="text-sm !mb-2">
                Cột bên trái
              </Title>
              {data.leftColumn?.map((item: any) => (
                <Card
                  key={item.id}
                  size="small"
                  className="mb-1.5"
                  bodyStyle={{ padding: 8 }}
                >
                  {item.audio_url && (
                    <audio
                      controls
                      src={item.audio_url}
                      className="w-full h-7"
                    />
                  )}
                  {item.text && (
                    <Text className="text-xs">{item.text}</Text>
                  )}
                  {item.pinyin && (
                    <Text type="secondary" className="text-xs">
                      {" "}({item.pinyin})
                    </Text>
                  )}
                </Card>
              ))}
            </Col>
            <Col span={12}>
              <Title level={5} className="text-sm !mb-2">
                Cột bên phải
              </Title>
              {data.rightColumn?.map((item: any) => (
                <Card
                  key={item.id}
                  size="small"
                  className="mb-1.5"
                  bodyStyle={{ padding: 8 }}
                >
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.alt}
                      className="w-full max-h-[60px] object-cover"
                    />
                  )}
                  {item.text && (
                    <Text className="text-xs">{item.text}</Text>
                  )}
                </Card>
              ))}
            </Col>
          </Row>

          <div className="mt-3">
            <Text strong className="text-xs">
              Ghép nối đúng:{" "}
            </Text>
            {data.correctMatches?.map((match: any, index: number) => (
              <Tag key={index} color="green" className="text-xs">
                {match.left} ↔ {match.right}
              </Tag>
            ))}
          </div>

          {data.explanation && (
            <Paragraph className="mt-3 p-2 bg-gray-100 text-xs !mb-0">
              <Text strong className="text-xs">
                Giải thích:{" "}
              </Text>
              {data.explanation}
            </Paragraph>
          )}
        </Card>
      );
    }

    if (type === "question_bool_audio_text") {
      return (
        <Card
          hoverable
          className="mb-3 text-sm"
          size="small"
          extra={
            <Space size="small">
              <Tag color="orange" className="text-xs">
                Câu hỏi đúng/sai
              </Tag>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditItem(item)}
              />
              <Popconfirm
                title="Xóa nội dung này?"
                onConfirm={() => handleDeleteItem(item.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          }
        >
          <Title level={titleLevel} className="!mb-2">
            {data.instruction}
          </Title>

          {data.audio && (
            <audio
              controls
              src={data.audio}
              className="w-full mb-3 h-8"
            />
          )}

          <div className="mb-3">
            <Text strong className="text-sm">
              {data.transcript}
            </Text>
            <br />
            <Text type="secondary" className="text-xs">
              {data.pinyin}
            </Text>
            <br />
            <Text className="text-xs">{data.english}</Text>
          </div>

          <div>
            <Text strong className="text-xs">
              Đáp án đúng:{" "}
            </Text>
            {data.correctAnswer ? (
              <Tag
                color="green"
                icon={<CheckCircleOutlined />}
                className="text-xs"
              >
                Đúng
              </Tag>
            ) : (
              <Tag
                color="red"
                icon={<CloseCircleOutlined />}
                className="text-xs"
              >
                Sai
              </Tag>
            )}
          </div>

          {data.explanation && (
            <Paragraph className="mt-3 p-2 bg-gray-100 text-xs !mb-0">
              <Text strong className="text-xs">
                Giải thích:{" "}
              </Text>
              {data.explanation}
            </Paragraph>
          )}
        </Card>
      );
    }

    if (type === "question_fill_text_text") {
      return (
        <Card
          hoverable
          className="mb-3 text-sm"
          size="small"
          extra={
            <Space size="small">
              <Tag color="magenta" className="text-xs">
                Điền vào chỗ trống
              </Tag>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditItem(item)}
              />
              <Popconfirm
                title="Xóa nội dung này?"
                onConfirm={() => handleDeleteItem(item.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          }
        >
          <Title level={titleLevel} className="!mb-2">
            {data.instruction}
          </Title>

          <div className="mb-3">
            <Text className="text-sm">
              {data.sentence?.map((part: string, index: number) => (
                <span key={index}>
                  {part.startsWith("[") ? (
                    <Tag color="blue" className="text-xs">
                      {part}
                    </Tag>
                  ) : (
                    part
                  )}
                </span>
              ))}
            </Text>
            <br />
            <Text type="secondary" className="text-xs">
              {data.pinyin?.join(" ")}
            </Text>
            <br />
            <Text className="text-xs">{data.vietnamese}</Text>
          </div>

          {data.optionBank && (
            <div className="mb-3">
              <Text strong className="text-xs">
                Ngân hàng lựa chọn:{" "}
              </Text>
              {data.optionBank.map((option: string, index: number) => (
                <Tag key={index} className="text-xs">
                  {option}
                </Tag>
              ))}
            </div>
          )}

          <div>
            <Text strong className="text-xs">
              Đáp án đúng:{" "}
            </Text>
            {data.blanks?.map((blank: any, index: number) => (
              <Tag key={index} color="green" className="text-xs">
                [{blank.index}] = {blank.correct.join(", ")}
              </Tag>
            ))}
          </div>

          {data.explanation && (
            <Paragraph className="mt-3 p-2 bg-gray-100 text-xs !mb-0">
              <Text strong className="text-xs">
                Giải thích:{" "}
              </Text>
              {data.explanation}
            </Paragraph>
          )}
        </Card>
      );
    }

    return (
      <Card
        hoverable
        className="mb-3 text-sm"
        size="small"
        extra={
          <Space size="small">
            <Tag className="text-xs">{type}</Tag>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditItem(item)}
            />
            <Popconfirm
              title="Xóa nội dung này?"
              onConfirm={() => handleDeleteItem(item.id)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        }
      >
        <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
      </Card>
    );
  };

  return (
    <div className="page-container">
      <PageHeader
        {...({
          title: `Danh sách câu hỏi: ${lessonInfo?.name || "Đang tải..."}`,
          onBack: () => router.push(`/courses/${courseId}/lesson/${lessonId}`),
          extra:
            activeTab === "items" ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateItem}
              >
                Thêm nội dung
              </Button>
            ) : activeTab === "words" ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddWordsModalVisible(true)}
              >
                Thêm từ
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddGrammarModalVisible(true)}
              >
                Thêm mẫu ngữ pháp
              </Button>
            ),
        } as any)}
      />

      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng số nội dung"
              value={items.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Từ vựng bài học"
              value={lessonWords.length}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Mẫu ngữ pháp"
              value={lessonGrammar.length}
              prefix={<TranslationOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={`Nội dung (${items.length})`} key="items">
            {loading ? (
              <div className="text-center p-12">
                <Spin size="large" />
              </div>
            ) : items.length === 0 ? (
              <Empty description="No items found">
                <Button type="primary" onClick={handleCreateItem}>
                  Tạo nội dung đầu tiên
                </Button>
              </Empty>
            ) : (
              items.map((item) => {
                return <div key={item.id}>{renderContentCard(item)}</div>;
              })
            )}
          </TabPane>

          <TabPane tab={`Từ (${lessonWords.length})`} key="words">
            <Row gutter={[12, 12]}>
              {lessonWords.map((word) => (
                <Col span={8} key={word.id}>
                  <Card
                    hoverable
                    size="small"
                    cover={
                      word.wordSense?.imageUrl ? (
                        <Image
                          src={word.wordSense.imageUrl}
                          alt="word"
                          className="h-[120px] object-cover"
                        />
                      ) : null
                    }
                    actions={[
                      <Popconfirm
                        key="delete"
                        title="Xóa từ này?"
                        onConfirm={() =>
                          handleDeleteWord(word.id, word.wordSenseId)
                        }
                      >
                        <DeleteOutlined className="text-red-500 text-sm" />
                      </Popconfirm>,
                    ]}
                    bodyStyle={{ padding: 12 }}
                  >
                    <Title level={4} className="!mb-1">
                      {word.wordSense?.word.simplified}
                    </Title>
                    <Text type="secondary" className="text-xs">
                      {word.wordSense?.pinyin}
                    </Text>
                    <br />
                    {word.wordSense?.partOfSpeech && (
                      <Tag color="blue" className="text-[10px]">
                        {word.wordSense.partOfSpeech}
                      </Tag>
                    )}
                    {word.wordSense?.hskLevel && (
                      <Tag color="green" className="text-[10px]">
                        HSK {word.wordSense.hskLevel}
                      </Tag>
                    )}
                    {word.wordSense?.isPrimary && (
                      <Tag color="gold" className="text-[10px]">
                        Chính
                      </Tag>
                    )}
                    {word.wordSense?.translations?.map((trans, idx) => (
                      <Paragraph key={idx} className="text-xs !mb-1">
                        {trans.translation}
                      </Paragraph>
                    ))}
                    {word.wordSense?.audioUrl && (
                      <audio
                        controls
                        src={word.wordSense.audioUrl}
                        className="w-full mt-1.5 h-7"
                      />
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>

          <TabPane tab={`Ngữ pháp (${lessonGrammar.length})`} key="grammar">
            {lessonGrammar.map((grammar) => (
              <Card
                key={grammar.id}
                size="small"
                className="mb-3"
                bodyStyle={{ padding: 12 }}
                extra={
                  <Popconfirm
                    title="Xóa mẫu ngữ pháp này?"
                    onConfirm={() =>
                      handleDeleteGrammarPattern(
                        grammar.id,
                        grammar.grammarPatternId
                      )
                    }
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                }
              >
                <Title level={5} className="!mb-1">
                  {grammar.grammarPattern?.pattern.join(" ")}
                </Title>
                <Text type="secondary" className="text-xs">
                  {grammar.grammarPattern?.patternPinyin?.join(" ")}
                </Text>
                <br />
                {grammar.grammarPattern?.patternFormula && (
                  <Tag color="blue" className="text-[10px] mt-1">
                    {grammar.grammarPattern.patternFormula}
                  </Tag>
                )}
                {grammar.grammarPattern?.hskLevel && (
                  <Tag color="green" className="text-[10px] mt-1">
                    HSK {grammar.grammarPattern.hskLevel}
                  </Tag>
                )}
                {grammar.grammarPattern?.translations?.map((trans, idx) => (
                  <div key={idx} className="mt-2">
                    <Paragraph strong className="text-sm !mb-0.5">
                      {trans.grammarPoint}
                    </Paragraph>
                    <Paragraph className="text-xs !mb-0">
                      {trans.explanation}
                    </Paragraph>
                  </div>
                ))}
              </Card>
            ))}
          </TabPane>
        </Tabs>
      </Card>

      <ItemModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
        courseId={courseId}
        lessonId={lessonId}
        editItem={editItem}
        mode={editItem ? "edit" : "create"}
      />  

      <AddWordsModal
        visible={addWordsModalVisible}
        onCancel={() => setAddWordsModalVisible(false)}
        onSuccess={fetchData}
        lessonId={lessonId}
      />

      <AddGrammarModal
        visible={addGrammarModalVisible}
        onCancel={() => setAddGrammarModalVisible(false)}
        onSuccess={fetchData}
        lessonId={lessonId}
      />
    </div>
  );
}
