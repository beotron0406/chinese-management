import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import {
  List,
  Typography,
  Spin,
  Button,
  Empty,
  Card,
  Space,
  Tag,
  Form,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { lessonApi } from "@/services/lessonApi";
import { LessonItem } from "@/types/itemTypes"; // Updated import

// Import form components with correct names
import SelectionTextTextForm from "./forms/SelectionTextTextForm";
import SelectionTextImageForm from "./forms/SelectionTextImageForm";
import SelectionAudioTextForm from "./forms/SelectionAudioTextForm";
import SelectionAudioImageForm from "./forms/SelectionAudioImageForm";
import SelectionImageTextForm from "./forms/SelectionImageTextForm";
import MatchingTextTextForm from "./forms/MatchingTextTextForm";
import MatchingTextImageForm from "./forms/MatchingTextImageForm";
import MatchingAudioTextForm from "./forms/MatchingAudioTextForm";
import MatchingAudioImageForm from "./forms/MatchingAudioImageForm";
import FillTextTextForm from "./forms/FillTextTextForm";
import BoolAudioTextForm from "./forms/BoolAudioTextForm";

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
          const normalized = lessonItemsData.items.map((it: any) => {
            if (it.itemType) {
              return it as LessonItem;
            }
            const t: string = (it.type as string) || "";
            const itemType: "content" | "question" = t.startsWith("content")
              ? "content"
              : "question";
            return { ...it, itemType } as LessonItem;
          });
          setItems(normalized);
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
        case "content_word_definition":
          return "Word Definition";
        case "content_sentences":
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
        case "question_selection_text_text":
          return "Multiple Choice (Text → Text)";
        case "question_selection_text_image":
          return "Selection (Text → Image)";
        case "question_selection_audio_text":
          return "Selection (Audio → Text)";
        case "question_selection_audio_image":
          return "Selection (Audio → Image)";
        case "question_selection_image_text":
          return "Selection (Image → Text)";

        // Matching Types
        case "question_matching_text_text":
          return "Matching (Text ↔ Text)";
        case "question_matching_text_image":
          return "Matching (Text ↔ Image)";
        case "question_matching_audio_text":
          return "Matching (Audio ↔ Text)";
        case "question_matching_audio_image":
          return "Matching (Audio ↔ Image)";

        // Fill Types
        case "question_fill_text_text":
          return "Fill in the Blank";

        // Bool Types
        case "question_bool_audio_text":
          return "True/False (Audio)";

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
      if (type?.includes("selection")) {
        if (type.includes("text_text")) return "green";
        if (type.includes("text_image")) return "blue";
        if (type.includes("audio_text")) return "cyan";
        if (type.includes("audio_image")) return "geekblue";
        if (type.includes("image_text")) return "purple";
      }

      // Matching colors
      if (type?.includes("matching")) {
        if (type.includes("text_text")) return "orange";
        if (type.includes("text_image")) return "red";
        if (type.includes("audio_text")) return "volcano";
        if (type.includes("audio_image")) return "magenta";
      }

      // Fill colors
      if (type?.includes("fill")) return "gold";

      // Bool colors
      if (type?.includes("bool")) return "lime";

      return "default";
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
        questionType: item.type,
      };

      const questionType = item.type as string;

      // Selection Forms
      if (questionType === "question_selection_text_text") {
        return <SelectionTextTextForm {...formProps} />;
      }
      if (questionType === "question_selection_text_image") {
        return <SelectionTextImageForm {...formProps} />;
      }
      if (questionType === "question_selection_audio_text") {
        return <SelectionAudioTextForm {...formProps} />;
      }
      if (questionType === "question_selection_audio_image") {
        return <SelectionAudioImageForm {...formProps} />;
      }
      if (questionType === "question_selection_image_text") {
        return <SelectionImageTextForm {...formProps} />;
      }

      // Matching Forms
      if (questionType === "question_matching_text_text") {
        return <MatchingTextTextForm {...formProps} />;
      }
      if (questionType === "question_matching_text_image") {
        return <MatchingTextImageForm {...formProps} />;
      }
      if (questionType === "question_matching_audio_text") {
        return <MatchingAudioTextForm {...formProps} />;
      }
      if (questionType === "question_matching_audio_image") {
        return <MatchingAudioImageForm {...formProps} />;
      }

      // Fill Forms
      if (questionType === "question_fill_text_text") {
        return <FillTextTextForm {...formProps} />;
      }

      // Bool Forms
      if (questionType === "question_bool_audio_text") {
        return <BoolAudioTextForm {...formProps} />;
      }

      // Unknown type
      return (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
          }}
        >
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
            {Object.entries(data)
              .slice(0, 3)
              .map(([key, value]) => {
                if (
                  ["id", "type", "lessonId", "orderIndex"].includes(key) ||
                  value === null ||
                  value === undefined
                ) {
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
                } else if (typeof value === "object") {
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
      if (type?.includes("selection")) return "Selection";
      if (type?.includes("matching")) return "Matching";
      if (type?.includes("fill")) return "Fill";
      if (type?.includes("bool")) return "True/False";
      return "Other";
    };

    // Render individual item
    const renderItem = (item: LessonItem) => {
      const isQuestion = item.itemType === "question";
      const questionCategory = isQuestion
        ? getQuestionCategory(item.type || "")
        : "";

      return (
        <List.Item key={item.id}>
          <Card
            style={{ width: "100%", marginBottom: "8px" }}
            size="small"
            title={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                {isQuestion ? (
                  <QuestionCircleOutlined style={{ color: "#722ed1" }} />
                ) : (
                  <FileTextOutlined style={{ color: "#1890ff" }} />
                )}
                <span>
                  {isQuestion
                    ? `Question #${item.orderIndex}`
                    : `Content - ${getContentTypeLabel(item.type || "")}`}
                </span>
                {isQuestion && questionCategory && (
                  <Tag color="purple">{questionCategory}</Tag>
                )}
                <Tag color={isQuestion ? getTagColor(item.type || "") : "blue"}>
                  Order: {item.orderIndex || 0}
                </Tag>
                {item.isActive !== undefined && (
                  <Tag color={item.isActive ? "green" : "red"}>
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
              <div style={{ pointerEvents: "none", opacity: 0.8 }}>
                <div style={{ marginBottom: "8px" }}>
                  <Text strong>Type: </Text>
                  <Text>{getQuestionTypeDisplay(item.type || "")}</Text>
                </div>
                <div style={{ maxHeight: "400px", overflow: "auto" }}>
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
    const sortedItems = items.sort(
      (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
    );
    const contentItems = sortedItems.filter(
      (item) => item.itemType === "content"
    );
    const questionItems = sortedItems.filter(
      (item) => item.itemType === "question"
    );

    // Group questions by category for better stats
    const questionsByCategory = questionItems.reduce(
      (acc, item) => {
        const category = getQuestionCategory(item.type || "");
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <Title level={4}>
              Lesson Items ({contentItems.length} content,{" "}
              {questionItems.length} questions)
            </Title>
            {Object.keys(questionsByCategory).length > 0 && (
              <div style={{ marginTop: "4px" }}>
                <Space size="small" wrap>
                  {Object.entries(questionsByCategory).map(
                    ([category, count]) => (
                      <Tag key={category} color="blue">
                        {category}: {count}
                      </Tag>
                    )
                  )}
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
          pagination={
            sortedItems.length > 10
              ? {
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`,
                }
              : false
          }
        />
      </div>
    );
  }
);

ItemList.displayName = "ItemList";

export default ItemList;
