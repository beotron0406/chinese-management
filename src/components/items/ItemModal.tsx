"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  Select,
  Form,
  Button,
  message,
  Steps,
  Card,
  Typography,
  Input,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { QuestionType } from "@/enums/question-type.enum";
import { ContentType } from "@/enums/content-type.enum";

// Import question form components with correct names
import SelectionTextTextForm from "@/components/question/forms/SelectionTextTextForm";
import SelectionAudioImageForm, {
  SelectionAudioImageFormRef,
} from "@/components/question/forms/SelectionAudioImageForm";
import MatchingTextTextForm from "@/components/question/forms/MatchingTextTextForm";
import MatchingAudioTextForm, {
  MatchingAudioTextFormRef,
} from "@/components/question/forms/MatchingAudioTextForm";
import FillTextTextForm from "@/components/question/forms/FillTextTextForm";
import BoolAudioTextForm, {
  BoolAudioTextFormRef,
} from "@/components/question/forms/BoolAudioTextForm";

// Import content form components
import SentencesForm from "@/components/content/forms/SentencesForm";
import WordDefinitionForm from "@/components/content/forms/WordDefinitionForm";
import SelectionTextImageForm from "../question/forms/SelectionTextImageForm";
import SelectionAudioTextForm from "../question/forms/SelectionAudioTextForm";
import SelectionImageTextForm from "../question/forms/SelectionImageTextForm";
import MatchingTextImageForm from "../question/forms/MatchingTextImageForm";
import MatchingAudioImageForm from "../question/forms/MatchingAudioImageForm";
import { lessonApi } from "@/services/lessonApi";

const { Option } = Select;
const { Title, Text } = Typography;

interface ItemModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  courseId: string;
  lessonId: string;
  editItem?: any;
  mode: "create" | "edit";
}

// Define item categories
const ITEM_CATEGORIES = [
  { value: "content", label: "Nội Dung" },
  { value: "question", label: "Câu Hỏi" },
];

// Define content types
const CONTENT_TYPES = [
  {
    value: ContentType.CONTENT_SENTENCES,
    label: "Nội Dung Câu",
  },
  {
    value: ContentType.CONTENT_WORD_DEFINITION,
    label: "Nội Dung Định Nghĩa Từ",
  },
];

// Define question categories
const QUESTION_CATEGORIES = [
  { value: "selection", label: "Câu Hỏi Lựa Chọn" },
  { value: "matching", label: "Câu Hỏi Ghép Cặp" },
  { value: "fill", label: "Câu Hỏi Điền Chỗ Trống" },
  { value: "bool", label: "Câu Hỏi Đúng/Sai" },
];

// Define question and answer types for each category
const QUESTION_ANSWER_TYPES = {
  selection: {
    question: [
      { value: "text", label: "Văn Bản" },
      { value: "audio", label: "Âm Thanh" },
      { value: "image", label: "Hình Ảnh" },
    ],
    answer: [
      { value: "text", label: "Văn Bản" },
      { value: "image", label: "Hình Ảnh" },
    ],
  },
  matching: {
    question: [
      { value: "text", label: "Văn Bản" },
      { value: "audio", label: "Âm Thanh" },
    ],
    answer: [
      { value: "text", label: "Văn Bản" },
      { value: "image", label: "Hình Ảnh" },
    ],
  },
  fill: {
    // Fill only has text->text format
    question: [{ value: "text", label: "Văn Bản" }],
    answer: [{ value: "text", label: "Văn Bản" }],
  },
  bool: {
    // Bool only has audio->text format
    question: [{ value: "audio", label: "Âm Thanh" }],
    answer: [{ value: "text", label: "Văn Bản" }],
  },
};

const ItemModal: React.FC<ItemModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  courseId,
  lessonId,
  editItem,
  mode,
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Category selection
  const [selectedCategory, setSelectedCategory] = useState<
    "content" | "question" | undefined
  >(undefined);

  // Step 2: Type selection
  const [selectedContentType, setSelectedContentType] = useState<
    string | undefined
  >(undefined);
  const [selectedQuestionCategory, setSelectedQuestionCategory] = useState<
    string | undefined
  >(undefined);

  // Step 3: Question type selection (for questions only)
  const [selectedQuestionType, setSelectedQuestionType] = useState<
    string | undefined
  >(undefined);
  const [selectedAnswerType, setSelectedAnswerType] = useState<
    string | undefined
  >(undefined);

  // Final selected type
  const [finalType, setFinalType] = useState<string | undefined>(undefined);

  // Refs for forms that need file upload
  const selectionAudioImageFormRef = useRef<SelectionAudioImageFormRef>(null);
  const matchingAudioTextFormRef = useRef<MatchingAudioTextFormRef>(null);
  const boolAudioTextFormRef = useRef<BoolAudioTextFormRef>(null);
  useEffect(() => {
    if (selectedQuestionType === "image" && selectedAnswerType === "image") {
      setSelectedAnswerType(undefined);
    }
  }, [selectedQuestionType, selectedAnswerType]);
  // Generate question type based on selections
  const generateQuestionType = (
    category: string,
    questionType: string,
    answerType: string
  ): string => {
    return `question_${category}_${questionType}_${answerType}`;
  };

  // Get final type based on selections
  const getFinalType = (): string | undefined => {
    if (selectedCategory === "content" && selectedContentType) {
      return selectedContentType;
    } else if (
      selectedCategory === "question" &&
      selectedQuestionCategory &&
      selectedQuestionType &&
      selectedAnswerType
    ) {
      return generateQuestionType(
        selectedQuestionCategory,
        selectedQuestionType,
        selectedAnswerType
      );
    }
    return undefined;
  };

  // Parse existing type for edit mode
  const parseExistingType = (type: string) => {
    if (type.startsWith("content_")) {
      setSelectedCategory("content");
      setSelectedContentType(type);
      setCurrentStep(2); // Skip to form step for content
    } else if (type.startsWith("question_")) {
      setSelectedCategory("question");
      const parts = type.split("_");
      if (parts.length >= 4) {
        const category = parts[1]; // selection, matching, fill, bool
        const questionType = parts[2]; // text, audio, image
        const answerType = parts[3]; // text, image

        setSelectedQuestionCategory(category);
        setSelectedQuestionType(questionType);
        setSelectedAnswerType(answerType);
        setCurrentStep(3); // Skip to form step for questions
      }
    }
  };

  useEffect(() => {
    if (editItem && mode === "edit") {
      parseExistingType(editItem.type);
      setFinalType(editItem.type);

      // Populate form with existing data
      form.setFieldsValue({
        title: editItem.title,
        description: editItem.description,
        hskLevel: editItem.hskLevel,
        data: editItem.data,
        isActive: editItem.isActive ?? true,
      });
    } else {
      // Reset for create mode
      setSelectedCategory(undefined);
      setSelectedContentType(undefined);
      setSelectedQuestionCategory(undefined);
      setSelectedQuestionType(undefined);
      setSelectedAnswerType(undefined);
      setFinalType(undefined);
      setCurrentStep(0);
      form.resetFields();
    }
  }, [editItem, mode, form, visible]);

  // Step navigation handlers
  const handleCategorySelect = (category: "content" | "question") => {
    setSelectedCategory(category);
    setCurrentStep(1);
  };

  const handleContentTypeSelect = (contentType: string) => {
    setSelectedContentType(contentType);
    setFinalType(contentType);

    // Calculate the correct step index for form display
    const steps = getSteps();
    setCurrentStep(2);
  };

  const handleQuestionCategorySelect = (questionCategory: string) => {
    setSelectedQuestionCategory(questionCategory);
    setSelectedQuestionType(undefined);
    setSelectedAnswerType(undefined);

    // If category only has one type combination, auto-select it
    const categoryConfig =
      QUESTION_ANSWER_TYPES[
        questionCategory as keyof typeof QUESTION_ANSWER_TYPES
      ];
    if (
      categoryConfig.question.length === 1 &&
      categoryConfig.answer.length === 1
    ) {
      const questionType = categoryConfig.question[0].value;
      const answerType = categoryConfig.answer[0].value;
      setSelectedQuestionType(questionType);
      setSelectedAnswerType(answerType);
      setFinalType(
        generateQuestionType(questionCategory, questionType, answerType)
      );

      // For Fill and Bool, skip directly to form step (which is step 2 since there are only 3 steps total)
      setCurrentStep(2);
    } else {
      setCurrentStep(2); // Go to question/answer type selection (step 2)
    }
  };

  const handleQuestionTypeSelect = (
    questionType: string,
    answerType: string
  ) => {
    setSelectedQuestionType(questionType);
    setSelectedAnswerType(answerType);
    const type = generateQuestionType(
      selectedQuestionCategory!,
      questionType,
      answerType
    );
    setFinalType(type);
    setCurrentStep(3); // Go to Configure step (step 3)
  };

  const handleBack = () => {
    if (currentStep === 3) {
      // Configure step
      if (selectedCategory === "content") {
        setCurrentStep(1);
        setSelectedContentType(undefined);
        setFinalType(undefined);
      } else if (selectedCategory === "question") {
        const categoryConfig =
          QUESTION_ANSWER_TYPES[
            selectedQuestionCategory! as keyof typeof QUESTION_ANSWER_TYPES
          ];
        if (
          categoryConfig &&
          (categoryConfig.question.length > 1 ||
            categoryConfig.answer.length > 1)
        ) {
          setCurrentStep(2); // Go back to question/answer type selection
        } else {
          setCurrentStep(1);
          setSelectedQuestionCategory(undefined);
        }
        setSelectedQuestionType(undefined);
        setSelectedAnswerType(undefined);
        setFinalType(undefined);
      }
    } else if (currentStep === 2) {
      if (selectedCategory === "content") {
        setCurrentStep(1);
        setSelectedContentType(undefined);
        setFinalType(undefined);
      } else if (selectedCategory === "question") {
        setCurrentStep(1);
        setSelectedQuestionCategory(undefined);
        setSelectedQuestionType(undefined);
        setSelectedAnswerType(undefined);
      }
    } else if (currentStep === 1) {
      setCurrentStep(0);
      setSelectedCategory(undefined);
      setSelectedContentType(undefined);
      setSelectedQuestionCategory(undefined);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Handle file uploads for forms that need it
      if (
        finalType === QuestionType.SelectionAudioImage &&
        selectionAudioImageFormRef.current
      ) {
        const uploadSuccess =
          await selectionAudioImageFormRef.current.uploadFiles();
        if (!uploadSuccess) {
          setLoading(false);
          return;
        }
      } else if (
        finalType === QuestionType.MatchingAudioText &&
        matchingAudioTextFormRef.current
      ) {
        const uploadSuccess =
          await matchingAudioTextFormRef.current.uploadFiles();
        if (!uploadSuccess) {
          setLoading(false);
          return;
        }
      } else if (
        finalType === QuestionType.BoolAudioText &&
        boolAudioTextFormRef.current
      ) {
        const uploadSuccess = await boolAudioTextFormRef.current.uploadFiles();
        if (!uploadSuccess) {
          setLoading(false);
          return;
        }
      }

      // Validate form first
      await form.validateFields();
      
      // Get ALL form values including programmatically set ones
      const allValues = form.getFieldsValue(true);

      // Prepare data for submission
      const submitData = {
        ...allValues,
        lessonId: parseInt(lessonId),
        itemType: selectedCategory, // Add itemType field based on selected category
        ...(selectedCategory === "content" && {
          contentType: finalType, // Add contentType if it's content
        }),
        ...(selectedCategory === "question" && {
          questionType: finalType, // Add questionType if it's question
        }),
      };

      // Use lessonApi service methods instead of direct fetch
      if (mode === "edit") {
        await lessonApi.updateLessonItem(editItem.id, submitData);
        message.success("Cập nhật mục thành công!");
      } else {
        await lessonApi.addLessonContent(parseInt(lessonId), submitData);
        message.success("Tạo mục thành công!");
      }

      onSuccess();
      handleCancel();
    } catch (error) {
      console.error(`Error ${mode}ing item:`, error);
      message.error(
        `Không thể ${mode === "edit" ? "cập nhật" : "tạo"} mục. Vui lòng thử lại.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedCategory(undefined);
    setSelectedContentType(undefined);
    setSelectedQuestionCategory(undefined);
    setSelectedQuestionType(undefined);
    setSelectedAnswerType(undefined);
    setFinalType(undefined);
    setCurrentStep(0);
    onCancel();
  };

  // Render step 0: Category selection
  const renderCategorySelection = () => (
    <div className="py-5 max-h-[60vh] overflow-y-auto">
      <Title level={4} className="mb-5 text-center">
        Chọn Loại Danh Mục
      </Title>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 mt-5">
        {ITEM_CATEGORIES.map((category) => (
          <Card
            key={category.value}
            hoverable
            onClick={() =>
              handleCategorySelect(category.value as "content" | "question")
            }
            className={`cursor-pointer text-center ${selectedCategory === category.value ? 'border-2 border-blue-500' : 'border border-gray-300'}`}
          >
            <div className="p-5">
              <PlusOutlined className="text-2xl text-blue-500 mb-2.5" />
              <div className="font-bold text-base">
                {category.label}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  // Render step 1: Type selection based on category
  const renderTypeSelection = () => {
    if (selectedCategory === "content") {
      return (
        <div className="py-5">
          <Title level={4} className="mb-5 text-center">
            Chọn Loại Nội Dung
          </Title>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
            {CONTENT_TYPES.map((type) => (
              <Card
                key={type.value}
                hoverable
                onClick={() => handleContentTypeSelect(type.value)}
                className={`cursor-pointer text-center ${selectedContentType === type.value ? 'border-2 border-green-500' : 'border border-gray-300'}`}
              >
                <div className="p-5">
                  <PlusOutlined className="text-xl text-green-500 mb-2" />
                  <div className="font-bold text-sm">
                    {type.label}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      );
    } else if (selectedCategory === "question") {
      return (
        <div className="py-5">
          <Title level={4} className="mb-5 text-center">
            Chọn Danh Mục Câu Hỏi
          </Title>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
            {QUESTION_CATEGORIES.map((category) => (
              <Card
                key={category.value}
                hoverable
                onClick={() => handleQuestionCategorySelect(category.value)}
                className={`cursor-pointer text-center ${selectedQuestionCategory === category.value ? 'border-2 border-blue-500' : 'border border-gray-300'}`}
              >
                <div className="p-5">
                  <PlusOutlined className="text-xl text-blue-500 mb-2" />
                  <div className="font-bold text-sm">
                    {category.label}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Render step 1.5: Question and Answer type selection
  const renderQuestionAnswerTypeSelection = () => {
    if (!selectedQuestionCategory) return null;

    const categoryConfig =
      QUESTION_ANSWER_TYPES[
        selectedQuestionCategory as keyof typeof QUESTION_ANSWER_TYPES
      ];

    // Filter answer types based on selected question type
    const getAvailableAnswerTypes = () => {
      if (selectedQuestionType === "image") {
        // If question type is image, exclude image from answer types
        return categoryConfig.answer.filter((type) => type.value !== "image");
      }
      return categoryConfig.answer;
    };

    const availableAnswerTypes = getAvailableAnswerTypes();

    // REMOVED THE useEffect FROM HERE - IT'S NOW AT TOP LEVEL

    return (
      <div className="py-5">
        <Title level={4} className="mb-5 text-center">
          Chọn Loại Câu Hỏi Và Câu Trả Lời
        </Title>

        {/* Question Type Selection */}
        <div className="mb-10">
          <Text strong className="text-base block mb-4 text-center">
            Loại Câu Hỏi:
          </Text>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-2.5">
            {categoryConfig.question.map((type) => (
              <Card
                key={type.value}
                hoverable
                onClick={() => setSelectedQuestionType(type.value)}
                className={`cursor-pointer text-center ${selectedQuestionType === type.value ? 'border-2 border-blue-500' : 'border border-gray-300'}`}
              >
                <div className="p-4">
                  <PlusOutlined className="text-lg text-blue-500 mb-2" />
                  <div className="font-bold text-sm">
                    {type.label}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Answer Type Selection */}
        <div className="mb-10">
          <Text strong className="text-base block mb-4 text-center">
            Loại câu trả lời:
          </Text>

          {selectedQuestionType === "image" && (
            <div className="mb-4 p-2.5 bg-orange-50 border border-orange-300 rounded-md text-center">
              <Text className="text-[13px] text-orange-600">
                ⚠️ Trả lời bằng hình ảnh không khả dụng khi loại câu hỏi cũng là
                Hình Ảnh
              </Text>
            </div>
          )}

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-2.5">
            {categoryConfig.answer.map((type) => {
              const isDisabled =
                selectedQuestionType === "image" && type.value === "image";
              const isAvailable = availableAnswerTypes.some(
                (availableType) => availableType.value === type.value
              );

              if (!isAvailable) return null; // Hide completely instead of disable

              return (
                <Card
                  key={type.value}
                  hoverable={!isDisabled}
                  onClick={() =>
                    !isDisabled && setSelectedAnswerType(type.value)
                  }
                  className={`text-center ${isDisabled ? 'cursor-not-allowed opacity-50 bg-gray-100' : 'cursor-pointer bg-white'} ${selectedAnswerType === type.value ? 'border-2 border-green-500' : 'border border-gray-300'}`}
                >
                  <div className="p-4">
                    <PlusOutlined className={`text-lg mb-2 ${isDisabled ? 'text-gray-400' : 'text-green-500'}`} />
                    <div className={`font-bold text-sm ${isDisabled ? 'text-gray-400' : ''}`}>
                      {type.label}
                      {isDisabled && " (Unavailable)"}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Show message if no answer types available */}
          {availableAnswerTypes.length === 0 && (
            <div className="p-5 text-center bg-red-50 border border-red-200 rounded-md">
              <Text className="text-red-600">
                Không có loại trả lời khả dụng cho loại câu hỏi đã chọn.
              </Text>
            </div>
          )}
        </div>

        {/* Continue Button */}
        {selectedQuestionType && selectedAnswerType && (
          <div className="text-center mt-8">
            <Button
              type="primary"
              size="large"
              onClick={() =>
                handleQuestionTypeSelect(
                  selectedQuestionType,
                  selectedAnswerType
                )
              }
              className="h-[45px] text-base px-8"
            >
              Tiếp Tục với{" "}
              {
                categoryConfig.question.find(
                  (q) => q.value === selectedQuestionType
                )?.label
              }{" "}
              →{" "}
              {
                categoryConfig.answer.find(
                  (a) => a.value === selectedAnswerType
                )?.label
              }
            </Button>
          </div>
        )}

        {/* Show available combinations info */}
        {selectedQuestionType &&
          !selectedAnswerType &&
          availableAnswerTypes.length > 0 && (
            <div className="mt-5 text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Text className="text-sm text-blue-600">
                Loại trả lời khả dụng cho{" "}
                <strong>{selectedQuestionType}</strong>:{" "}
                {availableAnswerTypes.map((type) => type.label).join(", ")}
              </Text>
            </div>
          )}
      </div>
    );
  };

  // Render the appropriate form based on finalType
  const renderForm = () => {
    if (!finalType) return null;

    return (
      <div>
        <div className="mb-5 text-center">
          <Title level={4}>Cấu Hình Mục</Title>
          <Button type="link" onClick={handleBack}>
            ← Thay Đổi Lựa Chọn
          </Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isActive: true,
          }}
        >
          {/* Render specific form based on finalType */}
          {finalType === QuestionType.SelectionTextText && (
            <SelectionTextTextForm
              form={form}
              initialValues={{
                data: editItem?.data,
                isActive: editItem?.isActive,
              }}
            />
          )}

          {finalType === QuestionType.SelectionTextImage && (
            <SelectionTextImageForm
              form={form}
              initialValues={{
                data: editItem?.data,
                isActive: editItem?.isActive,
              }}
            />
          )}

          {finalType === QuestionType.SelectionAudioText && (
            <SelectionAudioTextForm
              form={form}
              initialValues={{
                data: editItem?.data,
                isActive: editItem?.isActive,
              }}
              questionType={finalType}
            />
          )}

          {finalType === QuestionType.SelectionAudioImage && (
            <SelectionAudioImageForm
              ref={selectionAudioImageFormRef}
              form={form}
              initialValues={{
                data: editItem?.data,
                isActive: editItem?.isActive,
              }}
              questionType={finalType}
            />
          )}

          {finalType === QuestionType.SelectionImageText && (
            <SelectionImageTextForm
              form={form}
              initialValues={{
                data: editItem?.data,
                isActive: editItem?.isActive,
              }}
            />
          )}

          {finalType === QuestionType.MatchingTextText && (
            <MatchingTextTextForm
              form={form}
              initialValues={{
                data: editItem?.data,
                isActive: editItem?.isActive,
              }}
            />
          )}

          {finalType === QuestionType.MatchingTextImage && (
            <MatchingTextImageForm
              form={form}
              initialValues={{
                data: editItem?.data,
                isActive: editItem?.isActive,
              }}
            />
          )}

          {finalType === QuestionType.MatchingAudioText && (
            <MatchingAudioTextForm
              ref={matchingAudioTextFormRef}
              form={form}
              initialValues={{
                data: editItem?.data,
                isActive: editItem?.isActive,
              }}
              questionType={finalType}
            />
          )}

          {finalType === QuestionType.MatchingAudioImage && (
            <MatchingAudioImageForm
              form={form}
              initialValues={{
                data: editItem?.data,
                isActive: editItem?.isActive,
              }}
            />
          )}

          {finalType === QuestionType.FillTextText && (
            <FillTextTextForm
              form={form}
              initialValues={{
                data: editItem?.data,
                isActive: editItem?.isActive,
              }}
            />
          )}

          {finalType === QuestionType.BoolAudioText && (
            <BoolAudioTextForm
              ref={boolAudioTextFormRef}
              form={form}
              initialValues={{
                data: editItem?.data,
                isActive: editItem?.isActive,
              }}
              questionType={finalType}
            />
          )}

          {finalType === ContentType.CONTENT_SENTENCES && (
            <SentencesForm form={form} initialValues={editItem?.data} />
          )}

          {finalType === ContentType.CONTENT_WORD_DEFINITION && (
            <WordDefinitionForm form={form} initialValues={editItem?.data} />
          )}
        </Form>
      </div>
    );
  };

  // Determine steps for the stepper
  const getSteps = () => {
    const steps = [{ title: "Danh Mục", description: "Chọn danh mục " }];

    if (selectedCategory === "content") {
      steps.push({ title: "Loại", description: "Chọn loại nội dung" });
      steps.push({
        title: "Cấu Hình",
        description: "Điền thông tin chi tiết",
      });
    } else if (selectedCategory === "question") {
      steps.push({
        title: "Danh Mục Câu Hỏi",
        description: "Chọn danh mục câu hỏi",
      });

      const categoryConfig = selectedQuestionCategory
        ? QUESTION_ANSWER_TYPES[
            selectedQuestionCategory as keyof typeof QUESTION_ANSWER_TYPES
          ]
        : null;

      if (
        categoryConfig &&
        (categoryConfig.question.length > 1 || categoryConfig.answer.length > 1)
      ) {
        steps.push({
          title: "Loại Câu Hỏi & Trả Lời",
          description: "Chọn loại câu hỏi & trả lời",
        });
      }

      steps.push({
        title: "Cấu Hình",
        description: "Điền thông tin chi tiết",
      });
    } else {
      // When no category is selected, show minimal steps
      steps.push({ title: "Loại", description: "Chọn loại mục" });
      steps.push({
        title: "Cấu Hình",
        description: "Điền thông tin chi tiết",
      });
    }

    return steps;
  };

  const steps = getSteps();

  return (
    <Modal
      title={
        <div>
          {mode === "edit" ? "Chỉnh Sửa Mục" : "Tạo Mục Mới"}
          {finalType && (
            <div className="text-sm text-gray-500 mt-1">
              Loại: {finalType}
            </div>
          )}
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={900}
      className="top-5"
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Hủy
        </Button>,
        currentStep > 0 && (
          <Button key="back" onClick={handleBack}>
            Quay Lại
          </Button>
        ),
        currentStep === steps.length - 1 && (
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleSubmit}
          >
            {mode === "edit" ? "Cập Nhật" : "Tạo"} Mục
          </Button>
        ),
      ].filter(Boolean)}
    >
      {mode === "create" && (
        <Steps current={currentStep} className="mb-6">
          {steps.map((item) => (
            <Steps.Step
              key={item.title}
              title={item.title}
              description={item.description}
            />
          ))}
        </Steps>
      )}

      {currentStep === 0 && renderCategorySelection()}
      {currentStep === 1 && renderTypeSelection()}
      {currentStep === 2 &&
        selectedCategory === "question" &&
        selectedQuestionCategory &&
        (() => {
          const categoryConfig =
            QUESTION_ANSWER_TYPES[
              selectedQuestionCategory as keyof typeof QUESTION_ANSWER_TYPES
            ];
          return (
            categoryConfig &&
            (categoryConfig.question.length > 1 ||
              categoryConfig.answer.length > 1)
          );
        })() &&
        renderQuestionAnswerTypeSelection()}
      {currentStep === steps.length - 1 && renderForm()}
    </Modal>
  );
};

export default ItemModal;
