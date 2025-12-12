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
  QuestionCircleOutlined,
  SoundOutlined,
  FileImageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import { lessonApi } from "@/services/lessonApi";
import ItemModal from "@/components/items/ItemModal";
import PageHeader from "@/components/common/PageHeader";
import AddWordsModal from "@/components/question/AddWordsModal";
import AddGrammarModal from "@/components/question/AddGrammarModal";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface ContentItem {
  id: number;
  itemType: "content" | "question";
  orderIndex: number;
  type: string;
  isActive: boolean;
  data: any;
}

interface LessonWord {
  id: number;
  lessonId: number;
  wordSenseId: number;
  orderIndex: number;
  wordSense: {
    id: number;
    wordId: number;
    senseNumber: number;
    pinyin?: string;
    partOfSpeech?: string;
    hskLevel?: number;
    isPrimary?: boolean;
    imageUrl?: string | null;
    audioUrl?: string | null;
    word: {
      id: number;
      simplified: string;
      traditional?: string;
      createdAt: string;
    };
    translations?: Array<{
      language: string;
      translation: string;
      additionalDetail?: string;
    }>;
  };
}

interface LessonGrammarPattern {
  id: number;
  lessonId: number;
  grammarPatternId: number;
  orderIndex: number;
  grammarPattern: {
    id: number;
    pattern: string[];
    patternPinyin?: string[];
    patternFormula?: string;
    hskLevel?: number;
    createdAt: string;
    translations?: Array<{
      language: string;
      grammarPoint: string;
      explanation: string;
      example?: Array<{
        chinese: string[];
        pinyin?: string[];
        translation: string;
      }>;
    }>;
  };
}

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
    console.log("=== fetchData START ===");
    console.log("lessonId:", lessonId);

    if (!lessonId) {
      console.log("❌ No lessonId, returning");
      return;
    }

    setLoading(true);
    try {
      console.log("📡 Calling API: lessonApi.getLessonWithContent");
      const response = await lessonApi.getLessonWithContent(parseInt(lessonId));

      console.log("✅ API Response:", response);
      console.log("Response type:", typeof response);
      console.log("Response keys:", Object.keys(response || {}));

      if (response) {
        console.log("📦 Setting lesson info...");
        const lessonInfoData = {
          id: parseInt(lessonId),
          name: response.name || `Lesson ${lessonId}`,
          description: response.description || "",
        };
        console.log("Lesson info data:", lessonInfoData);
        setLessonInfo(lessonInfoData);

        console.log("📋 Content array:", response.content);
        console.log("Content length:", response.content?.length || 0);
        console.log("Content sample:", response.content?.[0]);
        setItems(response.content || []);

        console.log("📚 Words array:", response.words);
        console.log("Words length:", response.words?.length || 0);
        console.log("Words sample:", response.words?.[0]);
        setLessonWords(response.words || []);

        console.log("📖 Grammar patterns array:", response.grammarPatterns);
        console.log("Grammar length:", response.grammarPatterns?.length || 0);
        console.log("Grammar sample:", response.grammarPatterns?.[0]);
        setLessonGrammar(response.grammarPatterns || []);
      } else {
        console.log("⚠️ Response is null/undefined");
      }
    } catch (error) {
      console.error("❌ Error fetching lesson data:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      message.error("Failed to fetch lesson data");
      setItems([]);
      setLessonWords([]);
      setLessonGrammar([]);
    } finally {
      setLoading(false);
      console.log("=== fetchData END ===");
      console.log("Final state - items:", items.length);
      console.log("Final state - words:", lessonWords.length);
      console.log("Final state - grammar:", lessonGrammar.length);
    }
  }, [lessonId]);

  useEffect(() => {
    console.log("🔄 useEffect triggered");
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    console.log("📊 State updated:");
    console.log("- items:", items.length, items);
    console.log("- lessonWords:", lessonWords.length, lessonWords);
    console.log("- lessonGrammar:", lessonGrammar.length, lessonGrammar);
    console.log("- lessonInfo:", lessonInfo);
    console.log("- loading:", loading);
  }, [items, lessonWords, lessonGrammar, lessonInfo, loading]);

  const handleCreateItem = () => {
    setEditItem(null);
    setModalVisible(true);
  };

  const handleEditItem = (item: ContentItem) => {
    console.log("✏️ Editing item:", item);
    setEditItem(item);
    setModalVisible(true);
  };

  const handleDeleteItem = async (itemId: number) => {
    console.log("🗑️ Deleting item:", itemId);
    try {
      await lessonApi.deleteLessonContent(itemId);
      message.success("Item deleted successfully");
      fetchData();
    } catch (error) {
      console.error("❌ Delete error:", error);
      message.error("Failed to delete item");
    }
  };

  const handleModalSuccess = () => {
    console.log("✅ Modal success, refreshing data");
    fetchData();
    setModalVisible(false);
  };

  const handleDeleteWord = async (wordId: number, wordSenseId: number) => {
    console.log("🗑️ Deleting word:", wordId, wordSenseId);
    try {
      await lessonApi.removeWordsFromLesson(parseInt(lessonId), [wordSenseId]);
      message.success("Word removed successfully");
      fetchData();
    } catch (error) {
      console.error("❌ Delete word error:", error);
      message.error("Failed to remove word");
    }
  };

  const handleDeleteGrammarPattern = async (
    patternId: number,
    grammarPatternId: number
  ) => {
    console.log("🗑️ Deleting grammar pattern:", patternId, grammarPatternId);
    try {
      await lessonApi.removeGrammarPatternsFromLesson(parseInt(lessonId), [
        grammarPatternId,
      ]);
      message.success("Grammar pattern removed successfully");
      fetchData();
    } catch (error) {
      console.error("❌ Delete grammar error:", error);
      message.error("Failed to remove grammar pattern");
    }
  };

  // Render content cards based on type
  // ...existing code...

  // Render content cards based on type
  const renderContentCard = (item: ContentItem) => {
    console.log("🎨 Rendering card for type:", item.type, "item:", item);
    const { type, data } = item;

    const cardStyle = { marginBottom: 12, fontSize: "0.85em" };
    const titleLevel = 5;
    const smallTextStyle = { fontSize: 14 };

    if (type === "content_word_definition") {
      return (
        <Card
          hoverable
          style={cardStyle}
          size="small"
          extra={
            <Space size="small">
              <Tag color="green" style={{ fontSize: 11 }}>
                Word Definition
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
          <Row gutter={12}>
            {data.picture_url && (
              <Col span={6}>
                <Image
                  src={data.picture_url}
                  alt="word"
                  style={{ width: "100%", maxHeight: 120, objectFit: "cover" }}
                />
              </Col>
            )}
            <Col span={data.picture_url ? 18 : 24}>
              <Title level={3} style={{ marginBottom: 4 }}>
                {data.chinese_text}
              </Title>
              <Text type="secondary" style={{ fontSize: 14 }}>
                {data.pinyin}
              </Text>
              <br />
              <Tag color="blue" style={{ fontSize: 11, marginTop: 4 }}>
                {data.speech}
              </Tag>
              <Paragraph
                style={{ marginTop: 8, marginBottom: 0, fontSize: 13 }}
              >
                {data.translation}
              </Paragraph>
              {data.audio_url && (
                <audio
                  controls
                  src={data.audio_url}
                  style={{ width: "100%", marginTop: 8, height: 32 }}
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
          style={cardStyle}
          size="small"
          extra={
            <Space size="small">
              <Tag color="cyan" style={{ fontSize: 11 }}>
                Sentences
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
          {data.picture_url && (
            <Image
              src={data.picture_url}
              alt="sentences"
              style={{
                marginBottom: 12,
                maxWidth: 200,
                maxHeight: 120,
                objectFit: "cover",
              }}
            />
          )}
          {Array.isArray(data.chinese_text) &&
            data.chinese_text.map((text: string, index: number) => (
              <div key={index} style={{ marginBottom: 8 }}>
                <Title level={titleLevel} style={{ marginBottom: 2 }}>
                  {text}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {data.pinyin?.[index]}
                </Text>
              </div>
            ))}
          {data.explaination && (
            <Paragraph
              style={{
                marginTop: 12,
                fontStyle: "italic",
                fontSize: 12,
                marginBottom: 0,
              }}
            >
              {data.explaination}
            </Paragraph>
          )}
          {data.audio_url && (
            <audio
              controls
              src={data.audio_url}
              style={{ width: "100%", marginTop: 8, height: 32 }}
            />
          )}
        </Card>
      );
    }

    if (type.startsWith("question_selection_")) {
      return (
        <Card
          hoverable
          style={cardStyle}
          size="small"
          extra={
            <Space size="small">
              <Tag color="blue" style={{ fontSize: 11 }}>
                Selection Question
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
          <Title level={titleLevel} style={{ marginBottom: 8 }}>
            {data.instruction}
          </Title>
          {data.question && (
            <Paragraph style={{ fontSize: 13, marginBottom: 12 }}>
              {data.question}
            </Paragraph>
          )}

          {data.audio_url && (
            <div style={{ marginBottom: 12 }}>
              <audio
                controls
                src={data.audio_url}
                style={{ width: "100%", height: 32 }}
              />
              {data.audio_transcript_chinese && (
                <div style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 12 }}>
                    {data.audio_transcript_chinese}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>
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
                    style={{
                      border: isCorrect
                        ? "2px solid #52c41a"
                        : "1px solid #d9d9d9",
                    }}
                    bodyStyle={{ padding: 8 }}
                  >
                    {option.image ? (
                      <Image
                        src={option.image}
                        alt={option.alt}
                        style={{
                          width: "100%",
                          maxHeight: 80,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Text style={{ fontSize: 12 }}>{option.text}</Text>
                    )}
                    {isCorrect && (
                      <CheckCircleOutlined
                        style={{
                          color: "#52c41a",
                          marginLeft: 4,
                          fontSize: 12,
                        }}
                      />
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>

          {data.explanation && (
            <Paragraph
              style={{
                marginTop: 12,
                padding: 8,
                background: "#f0f2f5",
                fontSize: 12,
                marginBottom: 0,
              }}
            >
              <Text strong style={{ fontSize: 12 }}>
                Explanation:{" "}
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
          style={cardStyle}
          size="small"
          extra={
            <Space size="small">
              <Tag color="purple" style={{ fontSize: 11 }}>
                Matching Question
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
          <Title level={titleLevel} style={{ marginBottom: 12 }}>
            {data.instruction}
          </Title>

          <Row gutter={12}>
            <Col span={12}>
              <Title level={5} style={{ fontSize: 13, marginBottom: 8 }}>
                Left Column
              </Title>
              {data.leftColumn?.map((item: any) => (
                <Card
                  key={item.id}
                  size="small"
                  style={{ marginBottom: 6 }}
                  bodyStyle={{ padding: 8 }}
                >
                  {item.audio_url && (
                    <audio
                      controls
                      src={item.audio_url}
                      style={{ width: "100%", height: 28 }}
                    />
                  )}
                  {item.text && (
                    <Text style={{ fontSize: 12 }}>{item.text}</Text>
                  )}
                  {item.pinyin && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {" "}
                      ({item.pinyin})
                    </Text>
                  )}
                </Card>
              ))}
            </Col>
            <Col span={12}>
              <Title level={5} style={{ fontSize: 13, marginBottom: 8 }}>
                Right Column
              </Title>
              {data.rightColumn?.map((item: any) => (
                <Card
                  key={item.id}
                  size="small"
                  style={{ marginBottom: 6 }}
                  bodyStyle={{ padding: 8 }}
                >
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.alt}
                      style={{
                        width: "100%",
                        maxHeight: 60,
                        objectFit: "cover",
                      }}
                    />
                  )}
                  {item.text && (
                    <Text style={{ fontSize: 12 }}>{item.text}</Text>
                  )}
                </Card>
              ))}
            </Col>
          </Row>

          <div style={{ marginTop: 12 }}>
            <Text strong style={{ fontSize: 12 }}>
              Correct Matches:{" "}
            </Text>
            {data.correctMatches?.map((match: any, index: number) => (
              <Tag key={index} color="green" style={{ fontSize: 11 }}>
                {match.left} ↔ {match.right}
              </Tag>
            ))}
          </div>

          {data.explanation && (
            <Paragraph
              style={{
                marginTop: 12,
                padding: 8,
                background: "#f0f2f5",
                fontSize: 12,
                marginBottom: 0,
              }}
            >
              <Text strong style={{ fontSize: 12 }}>
                Explanation:{" "}
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
          style={cardStyle}
          size="small"
          extra={
            <Space size="small">
              <Tag color="orange" style={{ fontSize: 11 }}>
                True/False Question
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
          <Title level={titleLevel} style={{ marginBottom: 8 }}>
            {data.instruction}
          </Title>

          {data.audio && (
            <audio
              controls
              src={data.audio}
              style={{ width: "100%", marginBottom: 12, height: 32 }}
            />
          )}

          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ fontSize: 13 }}>
              {data.transcript}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {data.pinyin}
            </Text>
            <br />
            <Text style={{ fontSize: 12 }}>{data.english}</Text>
          </div>

          <div>
            <Text strong style={{ fontSize: 12 }}>
              Correct Answer:{" "}
            </Text>
            {data.correctAnswer ? (
              <Tag
                color="green"
                icon={<CheckCircleOutlined />}
                style={{ fontSize: 11 }}
              >
                True
              </Tag>
            ) : (
              <Tag
                color="red"
                icon={<CloseCircleOutlined />}
                style={{ fontSize: 11 }}
              >
                False
              </Tag>
            )}
          </div>

          {data.explanation && (
            <Paragraph
              style={{
                marginTop: 12,
                padding: 8,
                background: "#f0f2f5",
                fontSize: 12,
                marginBottom: 0,
              }}
            >
              <Text strong style={{ fontSize: 12 }}>
                Explanation:{" "}
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
          style={cardStyle}
          size="small"
          extra={
            <Space size="small">
              <Tag color="magenta" style={{ fontSize: 11 }}>
                Fill in the Blank
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
          <Title level={titleLevel} style={{ marginBottom: 8 }}>
            {data.instruction}
          </Title>

          <div style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 14 }}>
              {data.sentence?.map((part: string, index: number) => (
                <span key={index}>
                  {part.startsWith("[") ? (
                    <Tag color="blue" style={{ fontSize: 11 }}>
                      {part}
                    </Tag>
                  ) : (
                    part
                  )}
                </span>
              ))}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {data.pinyin?.join(" ")}
            </Text>
            <br />
            <Text style={{ fontSize: 12 }}>{data.vietnamese}</Text>
          </div>

          {data.optionBank && (
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ fontSize: 12 }}>
                Option Bank:{" "}
              </Text>
              {data.optionBank.map((option: string, index: number) => (
                <Tag key={index} style={{ fontSize: 11 }}>
                  {option}
                </Tag>
              ))}
            </div>
          )}

          <div>
            <Text strong style={{ fontSize: 12 }}>
              Correct Answers:{" "}
            </Text>
            {data.blanks?.map((blank: any, index: number) => (
              <Tag key={index} color="green" style={{ fontSize: 11 }}>
                [{blank.index}] = {blank.correct.join(", ")}
              </Tag>
            ))}
          </div>

          {data.explanation && (
            <Paragraph
              style={{
                marginTop: 12,
                padding: 8,
                background: "#f0f2f5",
                fontSize: 12,
                marginBottom: 0,
              }}
            >
              <Text strong style={{ fontSize: 12 }}>
                Explanation:{" "}
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
        style={cardStyle}
        size="small"
        extra={
          <Space size="small">
            <Tag style={{ fontSize: 11 }}>{type}</Tag>
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
        <pre style={{ fontSize: 11 }}>{JSON.stringify(data, null, 2)}</pre>
      </Card>
    );
  };

  // ...existing code...

  // ...existing code...

  console.log("🎨 Rendering component, activeTab:", activeTab);

  return (
    <div className="page-container">
      <PageHeader
        {...({
          title: `Lesson Items: ${lessonInfo?.name || "Loading..."}`,
          onBack: () => router.push(`/courses/${courseId}/lesson/${lessonId}`),
          extra:
            activeTab === "items" ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateItem}
              >
                Add Item
              </Button>
            ) : activeTab === "words" ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddWordsModalVisible(true)}
              >
                Add Words
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddGrammarModalVisible(true)}
              >
                Add Grammar Patterns
              </Button>
            ),
        } as any)}
      />

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Items"
              value={items.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Lesson Words"
              value={lessonWords.length}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Grammar Patterns"
              value={lessonGrammar.length}
              prefix={<TranslationOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={`Items (${items.length})`} key="items">
            {loading ? (
              <div style={{ textAlign: "center", padding: 50 }}>
                <Spin size="large" />
              </div>
            ) : items.length === 0 ? (
              <Empty description="No items found">
                <Button type="primary" onClick={handleCreateItem}>
                  Create First Item
                </Button>
              </Empty>
            ) : (
              items.map((item) => {
                console.log("📋 Mapping item:", item.id, item.type);
                return <div key={item.id}>{renderContentCard(item)}</div>;
              })
            )}
          </TabPane>

          <TabPane tab={`Words (${lessonWords.length})`} key="words">
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
                          style={{ height: 120, objectFit: "cover" }}
                        />
                      ) : null
                    }
                    actions={[
                      <Popconfirm
                        key="delete"
                        title="Remove this word?"
                        onConfirm={() =>
                          handleDeleteWord(word.id, word.wordSenseId)
                        }
                      >
                        <DeleteOutlined
                          style={{ color: "red", fontSize: 14 }}
                        />
                      </Popconfirm>,
                    ]}
                    bodyStyle={{ padding: 12 }}
                  >
                    <Title level={4} style={{ marginBottom: 4 }}>
                      {word.wordSense?.word.simplified}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {word.wordSense?.pinyin}
                    </Text>
                    <br />
                    {word.wordSense?.partOfSpeech && (
                      <Tag color="blue" style={{ fontSize: 10 }}>
                        {word.wordSense.partOfSpeech}
                      </Tag>
                    )}
                    {word.wordSense?.hskLevel && (
                      <Tag color="green" style={{ fontSize: 10 }}>
                        HSK {word.wordSense.hskLevel}
                      </Tag>
                    )}
                    {word.wordSense?.isPrimary && (
                      <Tag color="gold" style={{ fontSize: 10 }}>
                        Primary
                      </Tag>
                    )}
                    {word.wordSense?.translations?.map((trans, idx) => (
                      <Paragraph
                        key={idx}
                        style={{ fontSize: 12, marginBottom: 4 }}
                      >
                        {trans.translation}
                      </Paragraph>
                    ))}
                    {word.wordSense?.audioUrl && (
                      <audio
                        controls
                        src={word.wordSense.audioUrl}
                        style={{ width: "100%", marginTop: 6, height: 28 }}
                      />
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>

          <TabPane tab={`Grammar (${lessonGrammar.length})`} key="grammar">
            {lessonGrammar.map((grammar) => (
              <Card
                key={grammar.id}
                size="small"
                style={{ marginBottom: 12 }}
                bodyStyle={{ padding: 12 }}
                extra={
                  <Popconfirm
                    title="Remove this grammar pattern?"
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
                <Title level={5} style={{ marginBottom: 4 }}>
                  {grammar.grammarPattern?.pattern.join(" ")}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {grammar.grammarPattern?.patternPinyin?.join(" ")}
                </Text>
                <br />
                {grammar.grammarPattern?.patternFormula && (
                  <Tag color="blue" style={{ fontSize: 10, marginTop: 4 }}>
                    {grammar.grammarPattern.patternFormula}
                  </Tag>
                )}
                {grammar.grammarPattern?.hskLevel && (
                  <Tag color="green" style={{ fontSize: 10, marginTop: 4 }}>
                    HSK {grammar.grammarPattern.hskLevel}
                  </Tag>
                )}
                {grammar.grammarPattern?.translations?.map((trans, idx) => (
                  <div key={idx} style={{ marginTop: 8 }}>
                    <Paragraph strong style={{ fontSize: 13, marginBottom: 2 }}>
                      {trans.grammarPoint}
                    </Paragraph>
                    <Paragraph style={{ fontSize: 12, marginBottom: 0 }}>
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
