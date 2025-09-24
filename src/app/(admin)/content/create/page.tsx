"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Typography, Button, Form, Space, Alert, message } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { ContentType } from "@/enums/content-type.enum";
import { lessonApi } from "@/services/lessonApi";
import { Lesson } from "@/types/lessonTypes";
import WordDefinitionForm from "@/components/content/forms/WordDefinitionForm";
import JsonPreviewCard from "@/components/question/JsonPreviewCard";

const { Title, Text } = Typography;

export default function CreateContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = parseInt(searchParams.get("lessonId") || "1");
  const contentType =
    (searchParams.get("type") as ContentType) ||
    ContentType.CONTENT_WORD_DEFINITION;

  const [form] = Form.useForm();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<any>({});

  // Watch form values for JSON preview
  const watchedValues = Form.useWatch([], form);

  useEffect(() => {
    setFormValues(watchedValues || {});
  }, [watchedValues]);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const lessonData = await lessonApi.getLesson(lessonId);
        setLesson(lessonData);
      } catch (err) {
        console.error("Failed to fetch lesson:", err);
        setError("Failed to load lesson data");
      }
    };

    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const contentData = {
        lessonId,
        itemType: "content",
        contentType,
        data: values.data,
      };

      // Create the content using the lesson API
      await lessonApi.addLessonContent(lessonId, contentData);

      // Show success message
      message.success("Content created successfully!");

      // Navigate back to Items Management page after a short delay
      setTimeout(() => {
        router.push(`/question?lessonId=${lessonId}`);
      }, 1000);
    } catch (err) {
      console.error("Failed to create content:", err);
      setError("Failed to create content");
    } finally {
      setLoading(false);
    }
  };

  // Generate preview data for JSON card
  const getPreviewData = () => {
    return {
      lessonId,
      itemType: "content",
      contentType,
      data: formValues.data || {},
    };
  };

  const handleCancel = () => {
    router.push(`/question?lessonId=${lessonId}`);
  };

  const getContentTypeTitle = (type: ContentType) => {
    switch (type) {
      case ContentType.CONTENT_WORD_DEFINITION:
        return "Word Definition";
      case ContentType.CONTENT_SENTENCES:
        return "Sentences";
      default:
        return "Content";
    }
  };

  const renderContentForm = () => {
    switch (contentType) {
      case ContentType.CONTENT_WORD_DEFINITION:
        return <WordDefinitionForm form={form} />;
      default:
        return (
          <Alert
            message="Content Type Not Implemented"
            description={`The ${getContentTypeTitle(contentType)} form is not yet implemented.`}
            type="warning"
            showIcon
          />
        );
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleCancel}
          style={{ marginBottom: "16px" }}
        >
          Back to Lesson Items
        </Button>

        <Title level={2} style={{ margin: 0 }}>
          Create {getContentTypeTitle(contentType)}
        </Title>

        {lesson && (
          <Text type="secondary">
            Lesson: {lesson.name} • Course: {lesson.course?.title}
          </Text>
        )}
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: "24px" }}
        />
      )}

      {/* Content Form */}
      <div
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}
      >
        {/* Left Column - Main Form */}
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              lessonId,
              contentType,
            }}
          >
            {renderContentForm()}

            {/* Form Actions */}
            <div style={{ marginTop: "32px", textAlign: "right" }}>
              <Space>
                <Button onClick={handleCancel}>Cancel</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  Create Content
                </Button>
              </Space>
            </div>
          </Form>
        </Card>

        {/* Right Column - JSON Preview */}
        <div style={{ position: "sticky", top: "24px", height: "fit-content" }}>
          <JsonPreviewCard data={getPreviewData()} />
        </div>
      </div>
    </div>
  );
}
