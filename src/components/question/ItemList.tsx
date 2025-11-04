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
import { LessonItem } from "@/types/itemTypes";

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

    const fetchItems = useCallback(async () => {
      if (!lessonId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await lessonApi.getLessonItems(lessonId);

        if (response?.items && Array.isArray(response.items)) {
          const processedItems = response.items.map((item: any) => {
            // Lấy data từ item.data nếu có, không thì từ item
            const itemData = item.data || item;

            return {
              id: item.id,
              itemType: item.type === "content" ? "content" : "question",
              orderIndex: itemData.orderIndex || 0,
              type: itemData.type || itemData.contentType || "unknown",
              isActive:
                itemData.isActive !== undefined ? itemData.isActive : true,
              data: itemData.data || itemData,
            } as LessonItem;
          });

          setItems(processedItems);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error("Error fetching items:", err);
        setError("Failed to load items");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, [lessonId]);

    useImperativeHandle(ref, () => ({ fetchItems }));

    useEffect(() => {
      fetchItems();
    }, [lessonId]); // Chỉ depend vào lessonId

    const getContentTypeLabel = (type: string) => {
      switch (type) {
        case "content_word_definition":
          return "Word Definition";
        case "content_sentences":
          return "Sentences";
        default:
          return (
            type
              ?.replace(/content_|_/g, " ")
              .replace(/^\w/, (c) => c.toUpperCase()) || "Content"
          );
      }
    };

    const getQuestionTypeDisplay = (type: string) => {
      switch (type) {
        case "question_selection_text_text":
          return "Multiple Choice (Text → Text)";
        case "question_selection_text_image":
          return "Selection (Text → Image)";
        case "question_selection_audio_text":
          return "Selection (Audio → Text)";
        case "question_matching_text_text":
          return "Matching (Text ↔ Text)";
        case "question_fill_text_text":
          return "Fill in the Blank";
        case "question_bool_audio_text":
          return "True/False (Audio)";
        default:
          return (
            type
              ?.replace(/question_|_/g, " ")
              .replace(/^\w/, (c) => c.toUpperCase()) || "Question"
          );
      }
    };

    const getTagColor = (type: string) => {
      if (type?.includes("selection")) return "green";
      if (type?.includes("matching")) return "orange";
      if (type?.includes("fill")) return "gold";
      if (type?.includes("bool")) return "lime";
      return "default";
    };

    const renderContentData = (data: any) => {
      if (!data || typeof data !== "object") {
        return <Text type="secondary">No content data</Text>;
      }

      return (
        <div style={{ marginTop: "8px" }}>
          {Object.entries(data)
            .slice(0, 3)
            .map(([key, value]) => {
              if (
                !value ||
                ["id", "type", "lessonId", "orderIndex"].includes(key)
              ) {
                return null;
              }

              const displayKey = key
                .replace(/_/g, " ")
                .replace(/^\w/, (c) => c.toUpperCase());
              let displayValue = String(value);

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

    const sortedItems = items.sort(
      (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
    );
    const contentItems = sortedItems.filter(
      (item) => item.itemType === "content"
    );
    const questionItems = sortedItems.filter(
      (item) => item.itemType === "question"
    );

    return (
      <div>
        <List
          dataSource={sortedItems}
          renderItem={(item) => (
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
                    {item.itemType === "question" ? (
                      <QuestionCircleOutlined style={{ color: "#722ed1" }} />
                    ) : (
                      <FileTextOutlined style={{ color: "#1890ff" }} />
                    )}
                    <span>
                      {item.itemType === "question"
                        ? `Question #${item.orderIndex}`
                        : `Content - ${getContentTypeLabel(item.type)}`}
                    </span>
                    <Tag
                      color={
                        item.itemType === "question"
                          ? getTagColor(item.type)
                          : "blue"
                      }
                    >
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
                {item.itemType === "question" ? (
                  <div>
                    <Text strong>Type: </Text>
                    <Text>{getQuestionTypeDisplay(item.type)}</Text>
                  </div>
                ) : (
                  renderContentData(item.data)
                )}
              </Card>
            </List.Item>
          )}
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
