import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { List, Typography, Spin, Button, Empty, Card, Space, Tag, Form } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { lessonApi } from "@/services/lessonApi";
import { QuestionType } from "@/enums/question-type.enum";
import { ContentType } from "@/enums/content-type.enum";
import { Question } from "@/types/questionType";
import { LessonItem } from "@/types/lessonTypes";

// Import form components with correct names
import SelectionTextTextForm from './forms/SelectionTextTextForm';
import SelectionTextImageForm from "./forms/SelectionTextImageForm";
import SelectionAudioTextForm from "./forms/SelectionAudioTextForm";
import SelectionAudioImageForm from './forms/SelectionAudioImageForm';
import SelectionImageTextForm from './forms/SelectionImageTextForm';
import MatchingTextTextForm from './forms/MatchingTextTextForm';
import MatchingTextImageForm from './forms/MatchingTextImageForm';
import MatchingAudioTextForm from './forms/MatchingAudioTextForm';
import MatchingAudioImageForm from './forms/MatchingAudioImageForm';
import FillTextTextForm from './forms/FillTextTextForm';
import BoolAudioTextForm from './forms/BoolAudioTextForm';

const { Title, Text } = Typography;

interface ItemListProps {
  lessonId: number;
  editable?: boolean;
  onAddItem?: () => void;
  onEditItem?: (item: LessonItem) => void;
  onDeleteItem?: (itemId: number) => void;
  onView?: (item: LessonItem) => void;
  courseId?: number;
}

export interface ItemListRef {
  fetchItems: () => Promise<void>;
}

const ItemList = forwardRef<ItemListRef, ItemListProps>(
  (
    {
      lessonId,
      editable = false,
      onAddItem,
      onEditItem,
      onDeleteItem,
      onView,
      courseId,
    },
    ref
  ) => {
    const [items, setItems] = useState<LessonItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef<boolean>(false);

    const fetchItems = useCallback(async () => {
      if (!lessonId) {
        setLoading(false);
        return;
      }

      if (loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const lessonItemsData = await lessonApi.getLessonItems(lessonId);
        
        if (lessonItemsData?.items && Array.isArray(lessonItemsData.items)) {
          setItems(lessonItemsData.items);
        } else {
          setItems([]);
        }
      } catch (err) {
        setItems([]);
        if (err instanceof Error) {
          setError(`Failed to load items: ${err.message}`);
        } else {
          setError("Failed to load items. Please try again.");
        }
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    }, [lessonId]);

    useImperativeHandle(ref, () => ({ fetchItems }));

    useEffect(() => {
      fetchItems();
    }, [fetchItems]);

    useEffect(() => {
      loadingRef.current = false;
    }, [lessonId]);

    // Helper functions
    const getContentTypeLabel = (type: string) => {
      switch (type) {
        case ContentType.CONTENT_WORD_DEFINITION:
          return "Word Definition";
        case ContentType.CONTENT_SENTENCES:
          return "Sentences";
        default:
          return (type || "Content")
            .replace(/content_|_content/g, "")
            .replace(/_/g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
      }
    };

    const getQuestionTypeDisplay = (type: string) => {
      switch (type) {
        // Selection Types
        case QuestionType.SelectionTextText:
          return 'Multiple Choice (Text → Text)';
        case QuestionType.SelectionTextImage:
          return 'Selection (Text → Image)';
        case QuestionType.SelectionAudioText:
          return 'Selection (Audio → Text)';
        case QuestionType.SelectionAudioImage:
          return 'Selection (Audio → Image)';
        case QuestionType.SelectionImageText:
          return 'Selection (Image → Text)';
        
        // Matching Types
        case QuestionType.MatchingTextText:
          return 'Matching (Text ↔ Text)';
        case QuestionType.MatchingTextImage:
          return 'Matching (Text ↔ Image)';
        case QuestionType.MatchingAudioText:
          return 'Matching (Audio ↔ Text)';
        case QuestionType.MatchingAudioImage:
          return 'Matching (Audio ↔ Image)';
        
        // Fill Types
        case QuestionType.FillTextText:
          return 'Fill in the Blank';
        
        // Bool Types
        case QuestionType.BoolAudioText:
          return 'True/False (Audio)';
        
        default:
          return (type || "Question")
            .replace(/question_|_question/g, "")
            .replace(/_/g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
      }
    };

    const getTagColor = (type: string) => {
      // Selection colors
      if (type?.includes('selection')) {
        if (type.includes('text_text')) return 'green';
        if (type.includes('text_image')) return 'blue';
        if (type.includes('audio_text')) return 'cyan';
        if (type.includes('audio_image')) return 'geekblue';
        if (type.includes('image_text')) return 'purple';
      }
      
      // Matching colors
      if (type?.includes('matching')) {
        if (type.includes('text_text')) return 'orange';
        if (type.includes('text_image')) return 'red';
        if (type.includes('audio_text')) return 'volcano';
        if (type.includes('audio_image')) return 'magenta';
      }
      
      // Fill colors
      if (type?.includes('fill')) return 'gold';
      
      // Bool colors
      if (type?.includes('bool')) return 'lime';
      
      return 'default';
    };

    // Render question form
    const renderQuestionForm = (item: LessonItem) => {
      const [form] = Form.useForm();
      
      React.useEffect(() => {
        if (item.data) {
          form.setFieldsValue({ data: item.data });
        }
      }, [item.data, form]);

      const formProps = {
        form,
        initialValues: { data: item.data as any, isActive: item.isActive },
        questionType: item.questionType,
      };

      const questionType = item.questionType as string;

      // Selection Forms
      if (questionType === QuestionType.SelectionTextText) {
        return <SelectionTextTextForm {...formProps} />;
      }
      if (questionType === QuestionType.SelectionTextImage) {
        return <SelectionTextImageForm {...formProps} />;
      }
      if (questionType === QuestionType.SelectionAudioText) {
        return <SelectionAudioTextForm {...formProps} />;
      }
      if (questionType === QuestionType.SelectionAudioImage) {
        return <SelectionAudioImageForm {...formProps} />;
      }
      if (questionType === QuestionType.SelectionImageText) {
        return <SelectionImageTextForm {...formProps} />;
      }

      // Matching Forms
      if (questionType === QuestionType.MatchingTextText) {
        return <MatchingTextTextForm {...formProps} />;
      }
      if (questionType === QuestionType.MatchingTextImage) {
        return <MatchingTextImageForm {...formProps} />;
      }
      if (questionType === QuestionType.MatchingAudioText) {
        return <MatchingAudioTextForm {...formProps} />;
      }
      if (questionType === QuestionType.MatchingAudioImage) {
        return <MatchingAudioImageForm {...formProps} />;
      }

      // Fill Forms
      if (questionType === QuestionType.FillTextText) {
        return <FillTextTextForm {...formProps} />;
      }

      // Bool Forms
      if (questionType === QuestionType.BoolAudioText) {
        return <BoolAudioTextForm {...formProps} />;
      }

      // Unknown type
      return (
        <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <Text type="secondary">Unknown Question Type: {questionType}</Text>
        </div>
      );
    };

    // Render content data
    const renderContentData = (data: unknown) => {
      if (!data || typeof data !== "object" || data === null) {
        return <Text type="secondary">No content data</Text>;
      }

      try {
        return (
          <div style={{ marginTop: "8px" }}>
            {Object.entries(data).slice(0, 3).map(([key, value]) => {
              if (["id", "type", "lessonId", "orderIndex"].includes(key) || 
                  value === null || value === undefined) {
                return null;
              }

              const displayKey = key
                .replace(/_/g, " ")
                .replace(/([A-Z])/g, " $1")
                .toLowerCase()
                .replace(/^\w/, (c) => c.toUpperCase());

              let displayValue = String(value);
              if (Array.isArray(value)) {
                displayValue = value.join(", ");
              } else if (typeof value === 'object') {
                displayValue = JSON.stringify(value, null, 2);
              }

              // Truncate long values
              if (displayValue.length > 100) {
                displayValue = displayValue.substring(0, 100) + "...";
              }

              return (
                <div key={key} style={{ marginBottom: "4px" }}>
                  <Text strong>{displayKey}: </Text>
                  <Text>{displayValue}</Text>
                </div>
              );
            })}
          </div>
        );
      } catch (error) {
        return <Text type="secondary">Error displaying content</Text>;
      }
    };

    // Get question category for better organization
    const getQuestionCategory = (type: string) => {
      if (type?.includes('selection')) return 'Selection';
      if (type?.includes('matching')) return 'Matching';
      if (type?.includes('fill')) return 'Fill';
      if (type?.includes('bool')) return 'True/False';
      return 'Other';
    };

    // Render individual item
    const renderItem = (item: LessonItem) => {
      const isQuestion = item.type === "question";
      const questionCategory = isQuestion ? getQuestionCategory(item.questionType || '') : '';
      
      return (
        <List.Item key={item.id}>
          <Card
            style={{ width: "100%", marginBottom: "8px" }}
            size="small"
            title={
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                {isQuestion ? (
                  <QuestionCircleOutlined style={{ color: "#722ed1" }} />
                ) : (
                  <FileTextOutlined style={{ color: "#1890ff" }} />
                )}
                <span>
                  {isQuestion 
                    ? `Question #${item.orderIndex}`
                    : `Content - ${getContentTypeLabel(item.contentType || "")}`
                  }
                </span>
                {isQuestion && questionCategory && (
                  <Tag color="purple" >{questionCategory}</Tag>
                )}
                <Tag color={isQuestion ? getTagColor(item.questionType || '') : "blue"} >
                  Order: {item.orderIndex || 0}
                </Tag>
                {item.isActive !== undefined && (
                  <Tag color={item.isActive ? "green" : "red"} >
                    {item.isActive ? "Active" : "Inactive"}
                  </Tag>
                )}
              </div>
            }
            extra={
              <Space>
                {onView && (
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => onView(item)}
                    size="small"
                    title="View"
                  />
                )}
                {editable && onEditItem && (
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => onEditItem(item)}
                    size="small"
                    title="Edit"
                  />
                )}
                {editable && onDeleteItem && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onDeleteItem(item.id)}
                    size="small"
                    title="Delete"
                  />
                )}
              </Space>
            }
          >
            {isQuestion ? (
              <div style={{ pointerEvents: 'none', opacity: 0.8 }}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Type: </Text>
                  <Text>{getQuestionTypeDisplay(item.questionType || '')}</Text>
                </div>
                <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                  <Form layout="vertical" size="small">
                    {renderQuestionForm(item)}
                  </Form>
                </div>
              </div>
            ) : (
              <div style={{ padding: "8px 0" }}>
                {renderContentData(item.data)}
              </div>
            )}
          </Card>
        </List.Item>
      );
    };

    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin size="large" />
          <Text style={{ display: "block", marginTop: 10 }}>
            Loading items...
          </Text>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Text type="danger">{error}</Text>
          <Button onClick={fetchItems} style={{ marginTop: 10 }}>
            Try Again
          </Button>
        </div>
      );
    }

    if (!items.length) {
      return (
        <Empty
          description="No items found for this lesson"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          {editable && onAddItem && (
            <Button type="primary" onClick={onAddItem} icon={<PlusOutlined />}>
              Add Item
            </Button>
          )}
        </Empty>
      );
    }

    // Sort items by order
    const sortedItems = items.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const contentItems = sortedItems.filter(item => item.type === "content");
    const questionItems = sortedItems.filter(item => item.type === "question");

    // Group questions by category for better stats
    const questionsByCategory = questionItems.reduce((acc, item) => {
      const category = getQuestionCategory(item.questionType || '');
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <Title level={4}>
              Lesson Items ({contentItems.length} content, {questionItems.length} questions)
            </Title>
            {Object.keys(questionsByCategory).length > 0 && (
              <div style={{ marginTop: '4px' }}>
                <Space size="small" wrap>
                  {Object.entries(questionsByCategory).map(([category, count]) => (
                    <Tag key={category} color="blue" >
                      {category}: {count}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </div>
          {editable && onAddItem && (
            <Button type="primary" onClick={onAddItem} icon={<PlusOutlined />}>
              Add Item
            </Button>
          )}
        </div>

        <List
          dataSource={sortedItems}
          renderItem={renderItem}
          pagination={sortedItems.length > 10 ? {
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          } : false}
        />
      </div>
    );
  }
);

ItemList.displayName = "ItemList";

export default ItemList;