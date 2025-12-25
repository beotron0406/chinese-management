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
  Tag,
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
import BoolImageTextForm, {
  BoolImageTextFormRef,
} from "@/components/question/forms/BoolImageTextForm";

// Import content form components
import SentencesForm from "@/components/content/forms/SentencesForm";
import WordDefinitionForm from "@/components/content/forms/WordDefinitionForm";
import SelectionTextImageForm from "../question/forms/SelectionTextImageForm";
import SelectionAudioTextForm from "../question/forms/SelectionAudioTextForm";
import SelectionImageTextForm from "../question/forms/SelectionImageTextForm";
import MatchingTextImageForm from "../question/forms/MatchingTextImageForm";
import MatchingAudioImageForm from "../question/forms/MatchingAudioImageForm";
import { lessonApi } from "@/services/lessonApi";
import LivePreview from "./LivePreview";

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
    // Bool has audio->text and image->text formats
    question: [
      { value: "audio", label: "Âm Thanh" },
      { value: "image", label: "Hình Ảnh" },
    ],
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
  
  // Preview type for hover effects
  const [previewType, setPreviewType] = useState<string | undefined>(undefined);

  // Refs for forms that need file upload
  const selectionAudioImageFormRef = useRef<SelectionAudioImageFormRef>(null);
  const matchingAudioTextFormRef = useRef<MatchingAudioTextFormRef>(null);
  const boolAudioTextFormRef = useRef<BoolAudioTextFormRef>(null);
  const boolImageTextFormRef = useRef<BoolImageTextFormRef>(null);
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
      } else if (
        finalType === QuestionType.BoolImageText &&
        boolImageTextFormRef.current
      ) {
        const uploadSuccess = await boolImageTextFormRef.current.uploadFiles();
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
    <div className="py-2">
      <Title level={4} className="mb-6 px-2">
        Chọn Loại Danh Mục
      </Title>

      <div className="space-y-3">
        {ITEM_CATEGORIES.map((category) => (
          <div
            key={category.value}
            onClick={() =>
              handleCategorySelect(category.value as "content" | "question")
            }
            className={`
              relative flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 border
              ${selectedCategory === category.value 
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm' 
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm hover:bg-gray-50'
              }
            `}
          >
            {/* Icon Column */}
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center text-xl mr-5 flex-shrink-0
              ${selectedCategory === category.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
            `}>
               {category.value === 'content' ? '📚' : '❓'}
            </div>

            {/* Content Column */}
            <div className="flex-1">
               <h3 className={`font-bold text-base mb-1 ${selectedCategory === category.value ? 'text-blue-700' : 'text-gray-800'}`}>
                 {category.label}
               </h3>
               <p className="text-gray-500 text-sm m-0">
                 {category.value === 'content' 
                    ? 'Tạo nội dung bài học, định nghĩa từ vựng, ví dụ, v.v.' 
                    : 'Tạo các bài kiểm tra, câu hỏi trắc nghiệm, điền từ, v.v.'}
               </p>
            </div>

            {/* Action Column */}
            <div className="text-gray-400">
               →
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render step 1: Type selection based on category
  const renderTypeSelection = () => {
    if (selectedCategory === "content") {
      return (
        <div className="py-2">
          <Title level={4} className="mb-6 px-2">
            Chọn Loại Nội Dung
          </Title>

          <div className="space-y-3">
            {CONTENT_TYPES.map((type) => (
              <div
                key={type.value}
                onClick={() => handleContentTypeSelect(type.value)}
                onMouseEnter={() => setPreviewType(type.value)}
                onMouseLeave={() => setPreviewType(undefined)}
                className={`
                  relative flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 border
                  ${selectedContentType === type.value 
                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm hover:bg-gray-50'
                  }
                `}
              >
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-lg mr-4 flex-shrink-0
                  ${selectedContentType === type.value ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}
                `}>
                   📝
                </div>
                <div className="flex-1">
                   <div className="font-bold text-base text-gray-800">{type.label}</div>
                   <div className="text-xs text-gray-500 mt-1">
                      {type.value === ContentType.CONTENT_WORD_DEFINITION ? 'Hiển thị từ vựng, pinyin và định nghĩa.' : 'Hiển thị đoạn văn hoặc câu giao tiếp.'}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (selectedCategory === "question") {
      return (
        <div className="py-2">
          <Title level={4} className="mb-6 px-2">
            Chọn Danh Mục Câu Hỏi
          </Title>

          <div className="space-y-3">
            {QUESTION_CATEGORIES.map((category) => (
              <div
                key={category.value}
                onClick={() => handleQuestionCategorySelect(category.value)}
                className={`
                  relative flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 border
                  ${selectedQuestionCategory === category.value 
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm hover:bg-gray-50'
                  }
                `}
              >
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-lg mr-4 flex-shrink-0
                  ${selectedQuestionCategory === category.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
                `}>
                   ❓
                </div>
                <div className="flex-1">
                   <div className="font-bold text-base text-gray-800">{category.label}</div>
                </div>
                 <div className="text-gray-400">→</div>
              </div>
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
    
    // Helper to generate type string for preview
    const getPreviewTypeString = (qType?: string, aType?: string) => {
        if (!qType || !aType) return undefined;
        return generateQuestionType(selectedQuestionCategory!, qType, aType);
    };

    return (
      <div className="py-2">
        <Title level={4} className="mb-6 px-2">
          Cấu Hình Câu Hỏi
        </Title>

        <div className="flex gap-8">
            {/* Left Col: Question Type */}
            <div className="flex-1">
                <Text className="text-xs uppercase font-bold text-gray-500 mb-3 block px-1">Input (Câu hỏi)</Text>
                 <div className="space-y-2">
                    {categoryConfig.question.map((type) => (
                      <div
                        key={type.value}
                        onClick={() => setSelectedQuestionType(type.value)}
                        className={`
                          p-3 rounded-lg border cursor-pointer transition-all flex items-center
                          ${selectedQuestionType === type.value 
                             ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium shadow-sm' 
                             : 'border-gray-200 hover:bg-gray-50'
                          }
                        `}
                      >
                         <span className="mr-2 opacity-70">
                            {type.value === 'text' ? 'A' : type.value === 'audio' ? '🔊' : '🖼️'}
                         </span>
                         {type.label}
                      </div>
                    ))}
                 </div>
            </div>

            {/* Right Col: Answer Type */}
            <div className="flex-1">
                <Text className="text-xs uppercase font-bold text-gray-500 mb-3 block px-1">Output (Trả lời)</Text>
                 <div className="space-y-2">
                    {categoryConfig.answer.map((type) => {
                       const isDisabled = selectedQuestionType === "image" && type.value === "image";
                       return (
                          <div
                            key={type.value}
                            onClick={() => !isDisabled && setSelectedAnswerType(type.value)}
                            onMouseEnter={() => setPreviewType(getPreviewTypeString(selectedQuestionType, type.value))}
                            onMouseLeave={() => setPreviewType(undefined)}
                            className={`
                              p-3 rounded-lg border flex items-center transition-all
                              ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:bg-gray-50'}
                              ${selectedAnswerType === type.value 
                                 ? 'border-green-500 bg-green-50 text-green-700 font-medium shadow-sm' 
                                 : 'border-gray-200'
                              }
                            `}
                          >
                             <span className="mr-2 opacity-70">
                                {type.value === 'text' ? 'A' : type.value === 'image' ? '🖼️' : '🔊'}
                             </span>
                             {type.label}
                          </div>
                       )
                    })}
                 </div>
            </div>
        </div>

        {/* Validation Messages */}
         {selectedQuestionType === "image" && (
            <div className="mt-4 p-3 bg-orange-50 text-orange-600 text-sm rounded border border-orange-100 flex items-center">
                ⚠️ Không thể dùng hình ảnh làm đáp án cho câu hỏi hình ảnh.
            </div>
         )}
         
         {/* Action */}
         {selectedQuestionType && selectedAnswerType && (
            <div className="mt-8 flex justify-end">
                <Button 
                    type="primary" 
                    size="large"
                    onClick={() => handleQuestionTypeSelect(selectedQuestionType, selectedAnswerType)}
                    className="bg-blue-600 shadow-md hover:shadow-lg"
                >
                    Tiếp tục: {categoryConfig.question.find(q => q.value === selectedQuestionType)?.label} → {categoryConfig.answer.find(a => a.value === selectedAnswerType)?.label}
                </Button>
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

          {finalType === QuestionType.BoolImageText && (
            <BoolImageTextForm
              ref={boolImageTextFormRef}
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

  // Helper for step description
  const getStepStatus = (index: number) => {
    if (currentStep === index) return "process";
    if (currentStep > index) return "finish";
    return "wait";
  };

  return (
    <Modal
      title={
        <div className="flex items-center text-xl font-bold py-2">
          {mode === "edit" ? "Chỉnh sửa mục bài học" : "Tạo mục bài học mới"}
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={1400}
      footer={null}
      style={{ top: 20 }}
      styles={{ body: { padding: 0, height: '85vh', overflow: 'hidden' } }}
      centered
    >
      <div className="flex h-full" style={{ height: '80vh' }}>
        {/* Left Sidebar: Steps Navigation & Info */}
        <div className="w-[280px] bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
           <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <Steps
                direction="vertical"
                current={currentStep}
                className="custom-vertical-steps"
                size="small"
                items={[
                  {
                    title: "Danh Mục",
                    description: "Chọn loại chính",
                  },
                  {
                    title: "Chi Tiết",
                    description: "Chọn loại cụ thể",
                  },
                  {
                    title: "Cấu Hình",
                    description: "Loại câu hỏi/trả lời",
                    disabled: selectedCategory === "content", // Skip for content
                  },
                  {
                    title: "Nội Dung",
                    description: "Nhập dữ liệu",
                  },
                ]}
              />
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider mb-3 block">Tổng Quan</Text>
                
                <div className="bg-white p-3 rounded border border-gray-200 shadow-sm space-y-3">
                    <div>
                        <div className="text-xs text-gray-400 mb-1">Danh mục</div>
                        <div className="font-medium text-sm text-gray-800">
                            {selectedCategory ? ITEM_CATEGORIES.find(c => c.value === selectedCategory)?.label : <span className="text-gray-400 italic">Chưa chọn</span>}
                        </div>
                    </div>

                    {(selectedContentType || selectedQuestionCategory) && (
                         <div>
                            <div className="text-xs text-gray-400 mb-1">Loại</div>
                            <div className="font-medium text-sm text-gray-800">
                                {selectedContentType && CONTENT_TYPES.find(c => c.value === selectedContentType)?.label}
                                {selectedQuestionCategory && QUESTION_CATEGORIES.find(c => c.value === selectedQuestionCategory)?.label}
                            </div>
                        </div>
                    )}

                    {finalType && (
                        <div className="pt-2 border-t border-gray-100">
                            <div className="text-xs text-gray-400 mb-1">Mã loại</div>
                            <Tag className="m-0 text-[10px] max-w-full truncate">{finalType}</Tag>
                        </div>
                    )}
                </div>
              </div>
           </div>
        </div>

        {/* Middle Column: Selection & Form Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto">
                {/* Step Content Rendering */}
                {currentStep === 0 && renderCategorySelection()}
                {currentStep === 1 && renderTypeSelection()}
                {currentStep === 2 && selectedCategory === "question" && renderQuestionAnswerTypeSelection()}
                
                {/* Form Rendering */}
                {(finalType && (
                    (selectedCategory === 'content' && currentStep === 2) || 
                    (selectedCategory === 'question' && currentStep === 3)
                )) && (
                    <div className="animation-fade-in pb-20">
                        {renderForm()}
                    </div>
                )}
            </div>
          </div>

          {/* Action Bar (Fixed at bottom of middle column) */}
          <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm absolute bottom-0 left-0 right-0 z-10 flex justify-between items-center">
             <div>
                {currentStep > 0 && (
                    <Button onClick={handleBack} size="large">
                        Quay lại
                    </Button>
                )}
             </div>
             <div className='flex gap-2'>
                <Button size="large" onClick={handleCancel}>
                    Hủy
                </Button>
                {(finalType && (
                    (selectedCategory === 'content' && currentStep === 2) || 
                    (selectedCategory === 'question' && currentStep === 3)
                )) && (
                     <Button
                        type="primary"
                        size="large"
                        loading={loading}
                        onClick={handleSubmit}
                        className="bg-blue-600 shadow-blue-200 shadow-lg hover:shadow-xl transition-all"
                    >
                        {mode === 'edit' ? 'Cập Nhật Item' : 'Hoàn Tất & Tạo Item'}
                    </Button>
                )}
             </div>
          </div>
        </div>

        {/* Right Sidebar: Live Preview - HIDDEN FOR NOW
        <div className="w-[420px] bg-gray-50 border-l border-gray-200 flex flex-col flex-shrink-0 z-20 shadow-[-5px_0_15px_-5px_translateX(0)]">
          <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
            <div>
                <Text strong className="text-base block">Live Preview</Text>
                <Text type="secondary" className="text-xs">Mô phỏng hiển thị trên Mobile</Text>
            </div>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex items-center justify-center bg-gray-100/50">
             <div className="w-[320px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl border-[8px] border-gray-800 overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-7 bg-gray-800 z-20 flex justify-between px-6 items-center">
                     <div className="w-16 h-4 bg-black rounded-b-xl absolute left-1/2 transform -translate-x-1/2 top-0"></div>
                </div>
                 <div className="h-7 bg-gray-800 w-full"></div>
                 <div className="h-6 bg-white flex justify-between px-5 items-center border-b border-gray-50">
                     <div className="text-[10px] font-bold text-gray-800">9:41</div>
                     <div className="flex gap-1">
                        <div className="w-3 h-3 bg-gray-800 rounded-full opacity-20"></div>
                        <div className="w-3 h-3 bg-gray-800 rounded-full opacity-20"></div>
                     </div>
                 </div>
                <div className="h-[calc(100%-60px)] overflow-y-auto bg-gray-50 scrollbar-hide">
                   {((selectedCategory === 'content' && currentStep === 2) || 
                     (selectedCategory === 'question' && currentStep === 3)) && !previewType ? (
                       <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                          <div className="mb-4 text-4xl opacity-10">✍️</div>
                          <p className="text-sm font-medium opacity-60">Chế độ nhập liệu</p>
                          <p className="text-xs mt-2 opacity-40">Tập trung hoàn thiện nội dung bên trái</p>
                       </div>
                   ) : (
                       <LivePreview form={form} type={previewType || finalType} />
                   )}
                </div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-1/3 h-1.5 bg-gray-900/20 rounded-full"></div>
             </div>
          </div>
        </div>
        */}
      </div>
    </Modal>
  );
};

export default ItemModal;
