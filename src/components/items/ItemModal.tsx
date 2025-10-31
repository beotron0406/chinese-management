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
  { value: "content", label: "Content" },
  { value: "question", label: "Question" },
];

// Define content types
const CONTENT_TYPES = [
  {
    value: ContentType.CONTENT_SENTENCES,
    label: "Sentences Content",
  },
  {
    value: ContentType.CONTENT_WORD_DEFINITION,
    label: "Word Definition Content",
  },
];

// Define question categories
const QUESTION_CATEGORIES = [
  { value: "selection", label: "Selection Questions" },
  { value: "matching", label: "Matching Questions" },
  { value: "fill", label: "Fill in the Blank Questions" },
  { value: "bool", label: "True/False Questions" },
];

// Define question and answer types for each category
const QUESTION_ANSWER_TYPES = {
  selection: {
    question: [
      { value: "text", label: "Text" },
      { value: "audio", label: "Audio" },
      { value: "image", label: "Image" },
    ],
    answer: [
      { value: "text", label: "Text" },
      { value: "image", label: "Image" },
    ],
  },
  matching: {
    question: [
      { value: "text", label: "Text" },
      { value: "audio", label: "Audio" },
    ],
    answer: [
      { value: "text", label: "Text" },
      { value: "image", label: "Image" },
    ],
  },
  fill: {
    // Fill only has text->text format
    question: [{ value: "text", label: "Text" }],
    answer: [{ value: "text", label: "Text" }],
  },
  bool: {
    // Bool only has audio->text format
    question: [{ value: "audio", label: "Audio" }],
    answer: [{ value: "text", label: "Text" }],
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

      // Validate form
      const values = await form.validateFields();

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

      // Prepare data for submission
      const submitData = {
        ...values,
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
        message.success("Item updated successfully!");
      } else {
        await lessonApi.addLessonContent(parseInt(lessonId), submitData);
        message.success("Item created successfully!");
      }

      onSuccess();
      handleCancel();
    } catch (error) {
      console.error(`Error ${mode}ing item:`, error);
      message.error(`Failed to ${mode} item. Please try again.`);
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
    <div style={{ padding: "20px 0", maxHeight: "60vh", overflowY: "auto" }}>
      <Title level={4} style={{ marginBottom: "20px", textAlign: "center" }}>
        Select Item Category
      </Title>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        {ITEM_CATEGORIES.map((category) => (
          <Card
            key={category.value}
            hoverable
            onClick={() =>
              handleCategorySelect(category.value as "content" | "question")
            }
            style={{
              cursor: "pointer",
              textAlign: "center",
              border:
                selectedCategory === category.value
                  ? "2px solid #1890ff"
                  : "1px solid #d9d9d9",
            }}
          >
            <div style={{ padding: "20px" }}>
              <PlusOutlined
                style={{
                  fontSize: "24px",
                  color: "#1890ff",
                  marginBottom: "10px",
                }}
              />
              <div style={{ fontWeight: "bold", fontSize: "16px" }}>
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
        <div style={{ padding: "20px 0" }}>
          <Title
            level={4}
            style={{ marginBottom: "20px", textAlign: "center" }}
          >
            Select Content Type
          </Title>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {CONTENT_TYPES.map((type) => (
              <Card
                key={type.value}
                hoverable
                onClick={() => handleContentTypeSelect(type.value)}
                style={{
                  cursor: "pointer",
                  textAlign: "center",
                  border:
                    selectedContentType === type.value
                      ? "2px solid #52c41a"
                      : "1px solid #d9d9d9",
                }}
              >
                <div style={{ padding: "20px" }}>
                  <PlusOutlined
                    style={{
                      fontSize: "20px",
                      color: "#52c41a",
                      marginBottom: "8px",
                    }}
                  />
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>
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
        <div style={{ padding: "20px 0" }}>
          <Title
            level={4}
            style={{ marginBottom: "20px", textAlign: "center" }}
          >
            Select Question Category
          </Title>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {QUESTION_CATEGORIES.map((category) => (
              <Card
                key={category.value}
                hoverable
                onClick={() => handleQuestionCategorySelect(category.value)}
                style={{
                  cursor: "pointer",
                  textAlign: "center",
                  border:
                    selectedQuestionCategory === category.value
                      ? "2px solid #1890ff"
                      : "1px solid #d9d9d9",
                }}
              >
                <div style={{ padding: "20px" }}>
                  <PlusOutlined
                    style={{
                      fontSize: "20px",
                      color: "#1890ff",
                      marginBottom: "8px",
                    }}
                  />
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>
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
      <div style={{ padding: "20px 0" }}>
        <Title level={4} style={{ marginBottom: "20px", textAlign: "center" }}>
          Select Question and Answer Types
        </Title>

        {/* Question Type Selection */}
        <div style={{ marginBottom: "40px" }}>
          <Text
            strong
            style={{
              fontSize: "16px",
              display: "block",
              marginBottom: "15px",
              textAlign: "center",
            }}
          >
            Question Type:
          </Text>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "10px",
            }}
          >
            {categoryConfig.question.map((type) => (
              <Card
                key={type.value}
                hoverable
                onClick={() => setSelectedQuestionType(type.value)}
                style={{
                  cursor: "pointer",
                  textAlign: "center",
                  border:
                    selectedQuestionType === type.value
                      ? "2px solid #1890ff"
                      : "1px solid #d9d9d9",
                }}
              >
                <div style={{ padding: "15px" }}>
                  <PlusOutlined
                    style={{
                      fontSize: "18px",
                      color: "#1890ff",
                      marginBottom: "8px",
                    }}
                  />
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                    {type.label}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Answer Type Selection */}
        <div style={{ marginBottom: "40px" }}>
          <Text
            strong
            style={{
              fontSize: "16px",
              display: "block",
              marginBottom: "15px",
              textAlign: "center",
            }}
          >
            Answer Type:
          </Text>

          {selectedQuestionType === "image" && (
            <div
              style={{
                marginBottom: "15px",
                padding: "10px",
                backgroundColor: "#fff7e6",
                border: "1px solid #ffd591",
                borderRadius: "6px",
                textAlign: "center",
              }}
            >
              <Text style={{ fontSize: "13px", color: "#d46b08" }}>
                ⚠️ Image answers are not available when question type is also
                Image
              </Text>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "10px",
            }}
          >
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
                  style={{
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    textAlign: "center",
                    border:
                      selectedAnswerType === type.value
                        ? "2px solid #52c41a"
                        : "1px solid #d9d9d9",
                    opacity: isDisabled ? 0.5 : 1,
                    backgroundColor: isDisabled ? "#f5f5f5" : "white",
                  }}
                >
                  <div style={{ padding: "15px" }}>
                    <PlusOutlined
                      style={{
                        fontSize: "18px",
                        color: isDisabled ? "#bfbfbf" : "#52c41a",
                        marginBottom: "8px",
                      }}
                    />
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        color: isDisabled ? "#bfbfbf" : "inherit",
                      }}
                    >
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
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                backgroundColor: "#fff2f0",
                border: "1px solid #ffccc7",
                borderRadius: "6px",
              }}
            >
              <Text style={{ color: "#cf1322" }}>
                No answer types available for the selected question type.
              </Text>
            </div>
          )}
        </div>

        {/* Continue Button */}
        {selectedQuestionType && selectedAnswerType && (
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <Button
              type="primary"
              size="large"
              onClick={() =>
                handleQuestionTypeSelect(
                  selectedQuestionType,
                  selectedAnswerType
                )
              }
              style={{
                height: "45px",
                fontSize: "16px",
                paddingLeft: "30px",
                paddingRight: "30px",
              }}
            >
              Continue with {selectedQuestionType} → {selectedAnswerType}
            </Button>
          </div>
        )}

        {/* Selected Combination Preview */}
        {selectedQuestionType && selectedAnswerType && (
          <div
            style={{
              marginTop: "20px",
              textAlign: "center",
              padding: "15px",
              backgroundColor: "#f6f8fa",
              borderRadius: "8px",
              border: "1px solid #e1e4e8",
            }}
          >
            <Text style={{ fontSize: "14px", color: "#586069" }}>
              Selected: <strong>{selectedQuestionCategory}</strong> question
              with <strong>{selectedQuestionType}</strong> question type and{" "}
              <strong>{selectedAnswerType}</strong> answer type
            </Text>
          </div>
        )}

        {/* Show available combinations info */}
        {selectedQuestionType &&
          !selectedAnswerType &&
          availableAnswerTypes.length > 0 && (
            <div
              style={{
                marginTop: "20px",
                textAlign: "center",
                padding: "15px",
                backgroundColor: "#f0f9ff",
                borderRadius: "8px",
                border: "1px solid #bae7ff",
              }}
            >
              <Text style={{ fontSize: "14px", color: "#0958d9" }}>
                Available answer types for{" "}
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
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <Title level={4}>Configure Item</Title>
          <Button type="link" onClick={handleBack}>
            ← Change Selection
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
    const steps = [{ title: "Category", description: "Select item category" }];

    if (selectedCategory === "content") {
      steps.push({ title: "Type", description: "Select content type" });
      steps.push({
        title: "Configure",
        description: "Fill in the item details",
      });
    } else if (selectedCategory === "question") {
      steps.push({
        title: "Question Category",
        description: "Select question category",
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
          title: "Question & Answer Types",
          description: "Select question & answer types",
        });
      }

      steps.push({
        title: "Configure",
        description: "Fill in the item details",
      });
    } else {
      // When no category is selected, show minimal steps
      steps.push({ title: "Type", description: "Select item type" });
      steps.push({
        title: "Configure",
        description: "Fill in the item details",
      });
    }

    return steps;
  };

  const steps = getSteps();

  return (
    <Modal
      title={
        <div>
          {mode === "edit" ? "Edit Item" : "Create New Item"}
          {finalType && (
            <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
              Type: {finalType}
            </div>
          )}
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={900}
      style={{ top: 20 }}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        currentStep > 0 && (
          <Button key="back" onClick={handleBack}>
            Back
          </Button>
        ),
        currentStep === steps.length - 1 && (
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleSubmit}
          >
            {mode === "edit" ? "Update" : "Create"} Item
          </Button>
        ),
      ].filter(Boolean)}
    >
      {mode === "create" && (
        <Steps current={currentStep} style={{ marginBottom: "24px" }}>
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
