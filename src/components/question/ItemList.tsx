import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { List, Typography, Spin, Button, Empty, Card, Space, Tag } from "antd";
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
import QuestionCard from "./QuestionCard";

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

interface ContentItemCardProps {
  item: LessonItem;
  onEdit?: (item: LessonItem) => void;
  onDelete?: (itemId: number) => void;
  onView?: (item: LessonItem) => void;
}

const ContentItemCard: React.FC<ContentItemCardProps> = ({
  item,
  onEdit,
  onDelete,
  onView,
}) => {
  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "question_audio_image":
        return "Audio Image Question";
      case ContentType.CONTENT_WORD_DEFINITION:
        return "Word Definition";
      case ContentType.CONTENT_SENTENCES:
        return "Sentences";
      case "audio_image":
        return "Audio Image Question";
      case "question":
        return "Question";
      default:
        // Convert snake_case or camelCase to readable format
        return (type || "Content")
          .replace(/question_|_question/g, "")
          .replace(/_/g, " ")
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
    }
  };

  // Safe function to render any data structure
  const renderDataContent = (data: unknown) => {
    if (!data || typeof data !== "object") {
      return <Text type="secondary">No content data</Text>;
    }

    try {
      return (
        <div style={{ marginTop: "8px" }}>
          {Object.entries(data).map(([key, value]) => {
            // Skip internal fields and order_index since it's already shown in the tag
            if (
              ["id", "type", "lessonId", "orderIndex", "order_index"].includes(
                key
              )
            ) {
              return null;
            }

            if (value === null || value === undefined) return null;

            // Handle arrays
            if (Array.isArray(value)) {
              return (
                <div key={key} style={{ marginBottom: "4px" }}>
                  <Text strong>
                    {key
                      .replace(/_/g, " ")
                      .replace(/([A-Z])/g, " $1")
                      .toLowerCase()
                      .replace(/^\w/, (c) => c.toUpperCase())}
                    :{" "}
                  </Text>
                  <div style={{ marginLeft: "16px" }}>
                    {value.slice(0, 3).map((item, index) => (
                      <div key={index}>
                        <Text>
                          •{" "}
                          {typeof item === "string"
                            ? item
                            : JSON.stringify(item)}
                        </Text>
                      </div>
                    ))}
                    {value.length > 3 && (
                      <Text type="secondary">
                        ... and {value.length - 3} more
                      </Text>
                    )}
                  </div>
                </div>
              );
            }

            // Handle primitives
            if (
              typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean"
            ) {
              const displayKey = key
                .replace(/_/g, " ")
                .replace(/([A-Z])/g, " $1")
                .toLowerCase()
                .replace(/^\w/, (c) => c.toUpperCase());

              return (
                <div key={key} style={{ marginBottom: "4px" }}>
                  <Text strong>{displayKey}: </Text>
                  {key.toLowerCase().includes("audio") &&
                  typeof value === "string" ? (
                    <Text code>{value}</Text>
                  ) : key.toLowerCase().includes("correct") &&
                    typeof value === "boolean" ? (
                    <Text style={{ color: value ? "#52c41a" : "#ff4d4f" }}>
                      {value ? "✓ True" : "✗ False"}
                    </Text>
                  ) : key === "pinyin" && typeof value === "string" ? (
                    <Text italic style={{ color: "#1890ff" }}>
                      {value}
                    </Text>
                  ) : key === "transcript" && typeof value === "string" ? (
                    <Text style={{ fontWeight: "bold", color: "#722ed1" }}>
                      {value}
                    </Text>
                  ) : (
                    <Text>{String(value)}</Text>
                  )}
                </div>
              );
            }

            // Handle objects
            if (typeof value === "object") {
              return (
                <div key={key} style={{ marginBottom: "4px" }}>
                  <Text strong>
                    {key
                      .replace(/_/g, " ")
                      .replace(/([A-Z])/g, " $1")
                      .toLowerCase()
                      .replace(/^\w/, (c) => c.toUpperCase())}
                    :{" "}
                  </Text>
                  <Text type="secondary">
                    {JSON.stringify(value).substring(0, 100)}...
                  </Text>
                </div>
              );
            }

            return null;
          })}
        </div>
      );
    } catch (error) {
      return (
        <Text type="secondary" style={{ color: "red" }}>
          Error displaying content: {String(error)}
        </Text>
      );
    }
  };

  return (
    <List.Item key={item.id}>
      <Card
        style={{ width: "100%", marginBottom: "8px" }}
        size="small"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileTextOutlined style={{ color: "#1890ff" }} />
            <span>Content - {getContentTypeLabel(item.contentType || "")}</span>
            <Tag color="blue">Order: {item.orderIndex || 0}</Tag>
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
              >
                View
              </Button>
            )}
            {onEdit && (
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit(item)}
                size="small"
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(item.id)}
                size="small"
              >
                Delete
              </Button>
            )}
          </Space>
        }
      >
        <div style={{ padding: "8px 0" }}>
          <Text type="secondary">
            Content Type: {getContentTypeLabel(item.contentType || "")}
          </Text>
          <br />
          {renderDataContent(item.data)}
        </div>
      </Card>
    </List.Item>
  );
};

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
    const [loading, setLoading] = useState<boolean>(true); // Start with loading true
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef<boolean>(false);

    const fetchItems = useCallback(async () => {
      if (!lessonId) {
        console.log("⚠️ No lessonId provided, skipping fetch");
        setLoading(false);
        return;
      }

      // Prevent duplicate calls using ref
      if (loadingRef.current) {
        console.log("⚠️ Already loading, skipping duplicate fetch");
        return;
      }

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        console.log("📥 Fetching lesson items for lessonId:", lessonId);

        // Use the correct API endpoint to get lesson content and questions
        const lessonItemsData = await lessonApi.getLessonItems(lessonId);

        // The API should return both content and questions
        if (
          lessonItemsData &&
          lessonItemsData.items &&
          Array.isArray(lessonItemsData.items)
        ) {
          console.log(
            "✅ Found items in response:",
            lessonItemsData.items.length
          );
          setItems(lessonItemsData.items);
        } else {
          console.log(
            "📝 No items found for this lesson - lesson exists but is empty"
          );
          setItems([]);
        }
      } catch (err) {
        console.error("❌ Failed to fetch items - Full error:", err);

        setItems([]); // Set empty array on error
        if (err instanceof Error) {
          if (
            err.message.includes("401") ||
            err.message.includes("Unauthorized")
          ) {
            setError("Authentication required. Please log in again.");
          } else if (err.message.includes("404")) {
            setError("Lesson not found.");
          } else if (
            err.message.includes("Network Error") ||
            err.message.includes("Failed to fetch")
          ) {
            setError(
              "Network error. Please check your connection and backend server."
            );
          } else {
            setError(`Failed to load items: ${err.message}`);
          }
        } else {
          setError("Failed to load items. Please try again.");
        }
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    }, [lessonId]); // Removed loading from dependencies to prevent infinite loop

    // Expose the fetchItems method to parent components
    useImperativeHandle(ref, () => ({
      fetchItems,
    }));

    useEffect(() => {
      fetchItems();
    }, [fetchItems]);

    // Reset loading ref when lessonId changes
    useEffect(() => {
      loadingRef.current = false;
    }, [lessonId]);

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

    // Separate and sort items
    const contentItems = items
      .filter((item) => item.type === "content")
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const questionItems = items
      .filter((item) => item.type === "question")
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

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
          <Title level={4}>
            Lesson Items ({contentItems.length} content, {questionItems.length}{" "}
            questions)
          </Title>
          {editable && onAddItem && (
            <Button type="primary" onClick={onAddItem} icon={<PlusOutlined />}>
              Add Item
            </Button>
          )}
        </div>

        {contentItems.length > 0 && (
          <>
            <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
              <FileTextOutlined /> Content Items ({contentItems.length})
            </Title>
            <List
              dataSource={contentItems}
              renderItem={(item) => (
                <ContentItemCard
                  item={item}
                  onEdit={editable ? onEditItem : undefined}
                  onDelete={editable ? onDeleteItem : undefined}
                  onView={onView}
                />
              )}
            />
          </>
        )}

        {questionItems.length > 0 && (
          <>
            <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
              <QuestionCircleOutlined /> Question Items ({questionItems.length})
            </Title>
            <List
              dataSource={questionItems}
              renderItem={(item) => {
                // Convert LessonItem back to Question format for QuestionCard
                const question: Question = {
                  id: item.id,
                  lessonId: item.lessonId,
                  orderIndex: item.orderIndex || 0,
                  questionType: item.questionType as QuestionType,
                  data: item.data,
                  isActive: item.isActive || true,
                  createdAt: item.createdAt,
                  updatedAt: item.updatedAt,
                };

                return (
                  <QuestionCard
                    question={question}
                    onEdit={
                      editable
                        ? (q) =>
                            onEditItem &&
                            onEditItem({
                              ...item,
                              data: q.data,
                              orderIndex: q.orderIndex,
                            })
                        : undefined
                    }
                    onDelete={editable ? onDeleteItem : undefined}
                    onView={
                      onView
                        ? (q) =>
                            onView({
                              ...item,
                              data: q.data,
                              orderIndex: q.orderIndex,
                            })
                        : undefined
                    }
                    courseId={courseId}
                  />
                );
              }}
            />
          </>
        )}
      </div>
    );
  }
);

ItemList.displayName = "ItemList";

export default ItemList;
