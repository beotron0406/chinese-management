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
  const [lessonGrammar, setLessonGrammar] = useState<LessonGrammarPattern[]>([]);
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

  const handleDeleteGrammarPattern = async (patternId: number, grammarPatternId: number) => {
    console.log("🗑️ Deleting grammar pattern:", patternId, grammarPatternId);
    try {
      await lessonApi.removeGrammarPatternsFromLesson(parseInt(lessonId), [grammarPatternId]);
      message.success("Grammar pattern removed successfully");
      fetchData();
    } catch (error) {
      console.error("❌ Delete grammar error:", error);
      message.error("Failed to remove grammar pattern");
    }
  };

  // Render content cards based on type
  const renderContentCard = (item: ContentItem) => {
    console.log("🎨 Rendering card for type:", item.type, "item:", item);
    const { type, data } = item;

    if (type === "content_word_definition") {
      return (
        <Card
          hoverable
          style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Tag color="green">Word Definition</Tag>
              <Button size="small" icon={<EditOutlined />} onClick={() => handleEditItem(item)} />
              <Popconfirm
                title="Delete this item?"
                onConfirm={() => handleDeleteItem(item.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          }
        >
          <Row gutter={16}>
            {data.picture_url && (
              <Col span={6}>
                <Image src={data.picture_url} alt="word" style={{ width: "100%" }} />
              </Col>
            )}
            <Col span={data.picture_url ? 18 : 24}>
              <Title level={2}>{data.chinese_text}</Title>
              <Text type="secondary" style={{ fontSize: 18 }}>{data.pinyin}</Text>
              <br />
              <Tag color="blue">{data.speech}</Tag>
              <Paragraph style={{ marginTop: 12 }}>{data.translation}</Paragraph>
              {data.audio_url && (
                <audio controls src={data.audio_url} style={{ width: "100%", marginTop: 8 }} />
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
          style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Tag color="cyan">Sentences</Tag>
              <Button size="small" icon={<EditOutlined />} onClick={() => handleEditItem(item)} />
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
            <Image src={data.picture_url} alt="sentences" style={{ marginBottom: 16, maxWidth: 300 }} />
          )}
          {Array.isArray(data.chinese_text) && data.chinese_text.map((text: string, index: number) => (
            <div key={index} style={{ marginBottom: 12 }}>
              <Title level={4}>{text}</Title>
              <Text type="secondary">{data.pinyin?.[index]}</Text>
            </div>
          ))}
          {data.explaination && (
            <Paragraph style={{ marginTop: 16, fontStyle: "italic" }}>{data.explaination}</Paragraph>
          )}
          {data.audio_url && (
            <audio controls src={data.audio_url} style={{ width: "100%", marginTop: 8 }} />
          )}
        </Card>
      );
    }

    if (type.startsWith("question_selection_")) {
      return (
        <Card
          hoverable
          style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Tag color="blue">Selection Question</Tag>
              <Button size="small" icon={<EditOutlined />} onClick={() => handleEditItem(item)} />
              <Popconfirm
                title="Delete this item?"
                onConfirm={() => handleDeleteItem(item.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          }
        >
          <Title level={4}>{data.instruction}</Title>
          {data.question && <Paragraph>{data.question}</Paragraph>}
          
          {data.audio_url && (
            <div style={{ marginBottom: 16 }}>
              <audio controls src={data.audio_url} style={{ width: "100%" }} />
              {data.audio_transcript_chinese && (
                <div style={{ marginTop: 8 }}>
                  <Text>{data.audio_transcript_chinese}</Text>
                  <br />
                  <Text type="secondary">{data.audio_transcript_pinyin}</Text>
                </div>
              )}
            </div>
          )}

          <Row gutter={[16, 16]}>
            {data.options?.map((option: any) => {
              const isCorrect = option.id === data.correctAnswer;
              return (
                <Col span={12} key={option.id}>
                  <Card
                    size="small"
                    style={{
                      border: isCorrect ? "2px solid #52c41a" : "1px solid #d9d9d9",
                    }}
                  >
                    {option.image ? (
                      <Image src={option.image} alt={option.alt} style={{ width: "100%" }} />
                    ) : (
                      <Text>{option.text}</Text>
                    )}
                    {isCorrect && <CheckCircleOutlined style={{ color: "#52c41a", marginLeft: 8 }} />}
                  </Card>
                </Col>
              );
            })}
          </Row>

          {data.explanation && (
            <Paragraph style={{ marginTop: 16, padding: 12, background: "#f0f2f5" }}>
              <Text strong>Explanation: </Text>
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
          style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Tag color="purple">Matching Question</Tag>
              <Button size="small" icon={<EditOutlined />} onClick={() => handleEditItem(item)} />
              <Popconfirm
                title="Delete this item?"
                onConfirm={() => handleDeleteItem(item.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          }
        >
          <Title level={4}>{data.instruction}</Title>
          
          <Row gutter={16}>
            <Col span={12}>
              <Title level={5}>Left Column</Title>
              {data.leftColumn?.map((item: any) => (
                <Card key={item.id} size="small" style={{ marginBottom: 8 }}>
                  {item.audio_url && <audio controls src={item.audio_url} style={{ width: "100%" }} />}
                  {item.text && <Text>{item.text}</Text>}
                  {item.pinyin && <Text type="secondary"> ({item.pinyin})</Text>}
                </Card>
              ))}
            </Col>
            <Col span={12}>
              <Title level={5}>Right Column</Title>
              {data.rightColumn?.map((item: any) => (
                <Card key={item.id} size="small" style={{ marginBottom: 8 }}>
                  {item.image && <Image src={item.image} alt={item.alt} style={{ width: "100%" }} />}
                  {item.text && <Text>{item.text}</Text>}
                </Card>
              ))}
            </Col>
          </Row>

          <div style={{ marginTop: 16 }}>
            <Text strong>Correct Matches: </Text>
            {data.correctMatches?.map((match: any, index: number) => (
              <Tag key={index} color="green">{match.left} ↔ {match.right}</Tag>
            ))}
          </div>

          {data.explanation && (
            <Paragraph style={{ marginTop: 16, padding: 12, background: "#f0f2f5" }}>
              <Text strong>Explanation: </Text>
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
          style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Tag color="orange">True/False Question</Tag>
              <Button size="small" icon={<EditOutlined />} onClick={() => handleEditItem(item)} />
              <Popconfirm
                title="Delete this item?"
                onConfirm={() => handleDeleteItem(item.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          }
        >
          <Title level={4}>{data.instruction}</Title>
          
          {data.audio && (
            <audio controls src={data.audio} style={{ width: "100%", marginBottom: 16 }} />
          )}

          <div style={{ marginBottom: 16 }}>
            <Text strong>{data.transcript}</Text>
            <br />
            <Text type="secondary">{data.pinyin}</Text>
            <br />
            <Text>{data.english}</Text>
          </div>

          <div>
            <Text strong>Correct Answer: </Text>
            {data.correctAnswer ? (
              <Tag color="green" icon={<CheckCircleOutlined />}>True</Tag>
            ) : (
              <Tag color="red" icon={<CloseCircleOutlined />}>False</Tag>
            )}
          </div>

          {data.explanation && (
            <Paragraph style={{ marginTop: 16, padding: 12, background: "#f0f2f5" }}>
              <Text strong>Explanation: </Text>
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
          style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Tag color="magenta">Fill in the Blank</Tag>
              <Button size="small" icon={<EditOutlined />} onClick={() => handleEditItem(item)} />
              <Popconfirm
                title="Delete this item?"
                onConfirm={() => handleDeleteItem(item.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          }
        >
          <Title level={4}>{data.instruction}</Title>
          
          <div style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 18 }}>
              {data.sentence?.map((part: string, index: number) => (
                <span key={index}>
                  {part.startsWith("[") ? (
                    <Tag color="blue">{part}</Tag>
                  ) : (
                    part
                  )}
                </span>
              ))}
            </Text>
            <br />
            <Text type="secondary">
              {data.pinyin?.join(" ")}
            </Text>
            <br />
            <Text>{data.vietnamese}</Text>
          </div>

          {data.optionBank && (
            <div style={{ marginBottom: 16 }}>
              <Text strong>Option Bank: </Text>
              {data.optionBank.map((option: string, index: number) => (
                <Tag key={index}>{option}</Tag>
              ))}
            </div>
          )}

          <div>
            <Text strong>Correct Answers: </Text>
            {data.blanks?.map((blank: any, index: number) => (
              <Tag key={index} color="green">
                [{blank.index}] = {blank.correct.join(", ")}
              </Tag>
            ))}
          </div>

          {data.explanation && (
            <Paragraph style={{ marginTop: 16, padding: 12, background: "#f0f2f5" }}>
              <Text strong>Explanation: </Text>
              {data.explanation}
            </Paragraph>
          )}
        </Card>
      );
    }

    // Default fallback
    console.log("⚠️ Using fallback render for type:", type);
    return (
      <Card
        hoverable
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Tag>{type}</Tag>
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEditItem(item)} />
            <Popconfirm
              title="Delete this item?"
              onConfirm={() => handleDeleteItem(item.id)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        }
      >
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </Card>
    );
  };

  console.log("🎨 Rendering component, activeTab:", activeTab);

  return (
    <div className="page-container">
      <PageHeader
        {...({
          title: `Lesson Items: ${lessonInfo?.name || "Loading..."}`,
          onBack: () => router.push(`/courses/${courseId}/lesson/${lessonId}`),
          extra:
            activeTab === "items" ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateItem}>
                Add Item
              </Button>
            ) : activeTab === "words" ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddWordsModalVisible(true)}>
                Add Words
              </Button>
            ) : (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddGrammarModalVisible(true)}>
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
            <Row gutter={[16, 16]}>
              {lessonWords.map((word) => (
                <Col span={8} key={word.id}>
                  <Card
                    hoverable
                    cover={
                      word.wordSense?.imageUrl ? (
                        <Image src={word.wordSense.imageUrl} alt="word" style={{ height: 200, objectFit: "cover" }} />
                      ) : null
                    }
                    actions={[
                      <Popconfirm
                        key="delete"
                        title="Remove this word?"
                        onConfirm={() => handleDeleteWord(word.id, word.wordSenseId)}
                      >
                        <DeleteOutlined style={{ color: "red" }} />
                      </Popconfirm>,
                    ]}
                  >
                    <Title level={3}>{word.wordSense?.word.simplified}</Title>
                    <Text type="secondary">{word.wordSense?.pinyin}</Text>
                    <br />
                    {word.wordSense?.partOfSpeech && <Tag color="blue">{word.wordSense.partOfSpeech}</Tag>}
                    {word.wordSense?.hskLevel && <Tag color="green">HSK {word.wordSense.hskLevel}</Tag>}
                    {word.wordSense?.isPrimary && <Tag color="gold">Primary</Tag>}
                    {word.wordSense?.translations?.map((trans, idx) => (
                      <Paragraph key={idx}>{trans.translation}</Paragraph>
                    ))}
                    {word.wordSense?.audioUrl && (
                      <audio controls src={word.wordSense.audioUrl} style={{ width: "100%", marginTop: 8 }} />
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
                style={{ marginBottom: 16 }}
                extra={
                  <Popconfirm
                    title="Remove this grammar pattern?"
                    onConfirm={() => handleDeleteGrammarPattern(grammar.id, grammar.grammarPatternId)}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                }
              >
                <Title level={4}>{grammar.grammarPattern?.pattern.join(" ")}</Title>
                <Text type="secondary">{grammar.grammarPattern?.patternPinyin?.join(" ")}</Text>
                <br />
                {grammar.grammarPattern?.patternFormula && (
                  <Tag color="blue">{grammar.grammarPattern.patternFormula}</Tag>
                )}
                {grammar.grammarPattern?.hskLevel && (
                  <Tag color="green">HSK {grammar.grammarPattern.hskLevel}</Tag>
                )}
                {grammar.grammarPattern?.translations?.map((trans, idx) => (
                  <div key={idx} style={{ marginTop: 12 }}>
                    <Paragraph strong>{trans.grammarPoint}</Paragraph>
                    <Paragraph>{trans.explanation}</Paragraph>
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