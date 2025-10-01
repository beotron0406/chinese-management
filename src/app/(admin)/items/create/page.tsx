"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Typography, Button, Form, Space, Alert, message } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { QuestionType } from "@/enums/question-type.enum";
import { ContentType } from "@/enums/content-type.enum";
import { lessonApi } from "@/services/lessonApi";
import { questionApi } from "@/services/questionApi";
import { Lesson } from "@/types/lessonTypes";
import { QuestionFormValues } from "@/types/questionType";
import MultipleChoiceForm from "@/components/question/forms/MultipleChoiceForm";
import MatchingTextForm from "@/components/question/forms/MatchingTextForm";
import FillBlankForm from "@/components/question/forms/FillBlankForm";
import AudioBoolForm from "@/components/question/forms/AudioBoolForm";
import WordDefinitionForm, {
  WordDefinitionFormRef,
} from "@/components/content/forms/WordDefinitionForm";
import SentencesForm, {
  SentencesFormRef,
} from "@/components/content/forms/SentencesForm";
import JsonPreviewCard from "@/components/question/JsonPreviewCard";
import AudioImageQuestionForm, {
  AudioImageQuestionFormRef,
} from "@/components/question/forms/AudioImageQuestionForm";

const { Title, Text } = Typography;

export default function CreateItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = parseInt(searchParams.get("lessonId") || "1");
  const courseId = parseInt(searchParams.get("courseId") || "1");
  const type = searchParams.get("type");

  // Refs for form components
  const wordDefinitionFormRef = useRef<WordDefinitionFormRef>(null);
  const sentencesFormRef = useRef<SentencesFormRef>(null);
  const audioImageQuestionFormRef = useRef<AudioImageQuestionFormRef>(null);

  // Determine if this is a question or content type
  const isQuestion = Object.values(QuestionType).includes(type as QuestionType);
  const isContent = Object.values(ContentType).includes(type as ContentType);

  const questionType = isQuestion
    ? (type as QuestionType)
    : QuestionType.TEXT_SELECTION;
  const contentType = isContent
    ? (type as ContentType)
    : ContentType.CONTENT_WORD_DEFINITION;

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
      // Upload files first
      let uploadSuccess = true;
      if (isQuestion && questionType === QuestionType.AUDIO_IMAGE) {
        uploadSuccess =
          (await audioImageQuestionFormRef.current?.uploadFiles()) ?? false;
      } else if (isContent) {
        if (contentType === ContentType.CONTENT_WORD_DEFINITION) {
          uploadSuccess =
            (await wordDefinitionFormRef.current?.uploadFiles()) ?? false;
        } else if (contentType === ContentType.CONTENT_SENTENCES) {
          uploadSuccess =
            (await sentencesFormRef.current?.uploadFiles()) ?? false;
        }
      }

      if (!uploadSuccess) {
        message.error("File upload failed. Please try again.");
        setLoading(false);
        return;
      }

      // Get the latest form values after upload (which updates the form with URLs)
      const updatedValues = form.getFieldsValue();

      if (isQuestion) {
        // Handle question creation - clean the data first
        const cleanData = { ...updatedValues.data };

        // Remove temporary form fields that shouldn't be sent to backend
        delete cleanData.transcript_input;
        if (cleanData.answers) {
          cleanData.answers = cleanData.answers.map((answer: any) => {
            if (!answer) return answer;
            const { label_zh_input, ...rest } = answer;
            return rest;
          });
        }

        const questionData: QuestionFormValues = {
          lessonId,
          questionType,
          isActive: updatedValues.isActive ?? true,
          data: cleanData,
        };

        await questionApi.createQuestion(questionData);
        message.success("Question created successfully!");
      } else if (isContent) {
        // Handle content creation - clean the data first
        const cleanData = { ...updatedValues.data };

        // Remove temporary form fields that shouldn't be sent to backend
        delete cleanData.chinese_sentence_input;

        const contentData = {
          lessonId,
          itemType: "content",
          contentType,
          data: cleanData,
        };

        await lessonApi.addLessonContent(lessonId, contentData);
        message.success("Content created successfully!");
      }

      // Navigate back to Items Management page after a short delay
      setTimeout(() => {
        router.push(`/items?lessonId=${lessonId}`);
      }, 1000);
    } catch (err) {
      console.error("Failed to create item:", err);
      setError("Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  // Generate preview data for JSON card
  const getPreviewData = () => {
    if (isQuestion) {
      // Clean preview data for questions
      const cleanPreviewData = { ...formValues.data } || {};
      delete cleanPreviewData.transcript_input;
      if (cleanPreviewData.answers) {
        cleanPreviewData.answers = cleanPreviewData.answers.map(
          (answer: any) => {
            if (!answer) return answer;
            const { label_zh_input, ...rest } = answer;
            return rest;
          }
        );
      }

      return {
        lessonId,
        questionType,
        isActive: formValues.isActive ?? true,
        data: cleanPreviewData,
      };
    } else {
      // Clean preview data for content
      const cleanPreviewData = { ...formValues.data } || {};
      delete cleanPreviewData.chinese_sentence_input;

      return {
        lessonId,
        itemType: "content",
        contentType,
        data: cleanPreviewData,
      };
    }
  };

  const handleCancel = () => {
    router.push(`/items?lessonId=${lessonId}`);
  };

  const getItemTypeTitle = () => {
    if (isQuestion) {
      switch (questionType) {
        case QuestionType.TEXT_SELECTION:
          return "Multiple Choice Question";
        case QuestionType.AUDIO_IMAGE:
          return "Audio to Image Question";
        case QuestionType.MATCHING_TEXT:
          return "Matching Text Question";
        case QuestionType.FILL_BLANK:
          return "Fill in the Blank Question";
        case QuestionType.AUDIO_BOOL:
          return "Audio True/False Question";
        default:
          return "Question";
      }
    } else {
      switch (contentType) {
        case ContentType.CONTENT_WORD_DEFINITION:
          return "Word Definition";
        case ContentType.CONTENT_SENTENCES:
          return "Sentences";
        default:
          return "Content";
      }
    }
  };

  const renderItemForm = () => {
    if (isQuestion) {
      switch (questionType) {
        case QuestionType.TEXT_SELECTION:
          return <MultipleChoiceForm form={form} />;
        case QuestionType.AUDIO_IMAGE:
          return (
            <AudioImageQuestionForm
              ref={audioImageQuestionFormRef}
              form={form}
            />
          );
        case QuestionType.MATCHING_TEXT:
          return <MatchingTextForm form={form} />;
        case QuestionType.FILL_BLANK:
          return <FillBlankForm form={form} />;
        case QuestionType.AUDIO_BOOL:
          return <AudioBoolForm form={form} />;
        default:
          return (
            <Alert
              message="Question Type Not Implemented"
              description={`The ${getItemTypeTitle()} form is not yet implemented.`}
              type="warning"
              showIcon
            />
          );
      }
    } else if (isContent) {
      switch (contentType) {
        case ContentType.CONTENT_WORD_DEFINITION:
          return (
            <WordDefinitionForm
              ref={wordDefinitionFormRef}
              form={form}
              contentType={contentType}
            />
          );
        case ContentType.CONTENT_SENTENCES:
          return (
            <SentencesForm
              ref={sentencesFormRef}
              form={form}
              contentType={contentType}
            />
          );
        default:
          return (
            <Alert
              message="Content Type Not Implemented"
              description={`The ${getItemTypeTitle()} form is not yet implemented.`}
              type="warning"
              showIcon
            />
          );
      }
    } else {
      return (
        <Alert
          message="Invalid Item Type"
          description="The specified item type is not recognized."
          type="error"
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
          Create {getItemTypeTitle()}
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

      {/* Item Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Main Form */}
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              lessonId,
              questionType: isQuestion ? questionType : undefined,
              contentType: isContent ? contentType : undefined,
              isActive: true,
            }}
          >
            {renderItemForm()}

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
                  Create {isQuestion ? "Question" : "Content"}
                </Button>
              </Space>
            </div>
          </Form>
        </Card>

        {/* JSON Preview */}
        <JsonPreviewCard data={getPreviewData()} />
      </div>
    </div>
  );
}
