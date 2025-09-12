import React, { useEffect, useState } from 'react';
import { 
  Form, 
  Input, 
  Modal, 
  Select, 
  Button, 
  InputNumber, 
  Radio, 
  Space, 
  message, 
  Divider,
  Collapse,
  Typography,
  Alert
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { QuestionType } from '@/enums/question-type.enum';
import { 
  Question, 
  AudioImageQuestionData, 
  TextSelectionQuestionData, 
  MatchingTextQuestionData, 
  FillBlankQuestionData, 
  AudioBoolQuestionData,
  QuestionData
} from '@/types/questionType';
import { questionApi } from '@/services/questionApi';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;
const { Panel } = Collapse;

interface QuestionFormModalProps {
  lessonId: number;
  question: Question | null;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Type-specific form values interfaces
interface AudioImageFormValues {
  instruction: string;
  audio: string;
  audio_transcript_chinese?: string;
  audio_transcript_pinyin?: string;
  audio_transcript_translation?: string;
  options: Array<{
    id: string;
    image: string;
    alt?: string;
    correct: boolean;
  }>;
  explanation?: string;
}

interface TextSelectionFormValues {
  instruction: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  correctAnswer: string;
  explanation?: string;
}

interface MatchingTextFormValues {
  instruction: string;
  leftColumn: Array<{
    id: string;
    text: string;
  }>;
  rightColumn: Array<{
    id: string;
    text: string;
  }>;
  correctMatches: Array<{
    left: string;
    right: string;
  }>;
}

interface FillBlankFormValues {
  instruction: string;
  sentence: string;
  pinyin: string;
  english: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface AudioBoolFormValues {
  instruction: string;
  audio: string;
  transcript: string;
  pinyin: string;
  english: string;
  correctAnswer: boolean;
  explanation?: string;
}

type QuestionFormValues = 
  | AudioImageFormValues
  | TextSelectionFormValues
  | MatchingTextFormValues
  | FillBlankFormValues
  | AudioBoolFormValues;

const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  lessonId,
  question,
  visible,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const questionType = Form.useWatch('questionType', form);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && question) {
      // Populate form with question data
      form.setFieldsValue({
        questionType: question.questionType,
        orderIndex: question.orderIndex,
        // Set other fields based on question type
        ...mapQuestionDataToFormValues(question),
      });
    } else if (visible) {
      // Initialize with default values for a new question
      form.setFieldsValue({
        questionType: QuestionType.TEXT_SELECTION,
        orderIndex: 1,
      });
    }
  }, [visible, question, form]);

  // Type-specific mappers for incoming data
  const mapAudioImageData = (data: any): AudioImageFormValues => {
    return {
      instruction: data.instruction || '',
      audio: data.audio || data.audio_url || '',
      audio_transcript_chinese: data.audio_transcript_chinese || '',
      audio_transcript_pinyin: data.audio_transcript_pinyin || '',
      audio_transcript_translation: data.audio_transcript_translation || '',
      options: ((data.options || data.answers) || []).map((opt: any) => ({
        id: String(opt.id || ''),
        image: opt.image || opt.image_url || '',
        alt: opt.alt || opt.label || '',
        correct: Boolean(opt.correct) || (data.correctAnswer === String(opt.id)) || false,
      })),
      explanation: data.explanation || '',
    };
  };

  const mapTextSelectionData = (data: any): TextSelectionFormValues => {
    return {
      instruction: data.instruction || '',
      question: data.question || '',
      options: (data.options || []).map((opt: any) => ({
        id: String(opt.id || ''),
        text: String(opt.text || ''),
      })),
      correctAnswer: String(data.correctAnswer || ''),
      explanation: data.explanation || '',
    };
  };

  const mapMatchingTextData = (data: any): MatchingTextFormValues => {
    return {
      instruction: data.instruction || '',
      leftColumn: (data.leftColumn || []).map((item: any) => ({
        id: String(item.id || ''),
        text: String(item.text || ''),
      })),
      rightColumn: (data.rightColumn || []).map((item: any) => ({
        id: String(item.id || ''),
        text: String(item.text || ''),
      })),
      correctMatches: (data.correctMatches || []).map((match: any) => ({
        left: String(match.left || ''),
        right: String(match.right || ''),
      })),
    };
  };

  const mapFillBlankData = (data: any): FillBlankFormValues => {
    return {
      instruction: data.instruction || '',
      sentence: data.sentence || '',
      pinyin: data.pinyin || '',
      english: data.english || '',
      options: Array.isArray(data.options) 
        ? data.options.map((opt: any) => String(opt || ''))
        : [],
      correctAnswer: String(data.correctAnswer || ''),
      explanation: data.explanation || '',
    };
  };

  const mapAudioBoolData = (data: any): AudioBoolFormValues => {
    return {
      instruction: data.instruction || '',
      audio: data.audio || '',
      transcript: data.transcript || '',
      pinyin: data.pinyin || '',
      english: data.english || '',
      correctAnswer: data.correctAnswer !== undefined ? Boolean(data.correctAnswer) : false,
      explanation: data.explanation || '',
    };
  };

  const mapQuestionDataToFormValues = (question: Question): any => {
    // Map question data to form values based on question type
    const data = question.data || {};
    
    switch (question.questionType) {
      case QuestionType.AUDIO_IMAGE:
        return mapAudioImageData(data);
      case QuestionType.TEXT_SELECTION:
        return mapTextSelectionData(data);
      case QuestionType.MATCHING_TEXT:
        return mapMatchingTextData(data);
      case QuestionType.FILL_BLANK:
        return mapFillBlankData(data);
      case QuestionType.AUDIO_BOOL:
        return mapAudioBoolData(data);
      default:
        return {};
    }
  };

  // Type-specific validators
  const validateAudioImageData = (data: AudioImageQuestionData): boolean => {
    if (!data.instruction || !data.audio) {
      setFormError('Audio and instruction are required');
      return false;
    }
    if (!Array.isArray(data.options) || data.options.length < 2) {
      setFormError('At least two options are required');
      return false;
    }
    if (!data.options.some((opt: { id: string; image: string; alt?: string; correct?: boolean }) => opt.correct)) {
      setFormError('At least one option must be marked as correct');
      return false;
    }
    return true;
  };

  const validateTextSelectionData = (data: TextSelectionQuestionData): boolean => {
    if (!data.instruction || !data.question) {
      setFormError('Instruction and question are required');
      return false;
    }
    if (!Array.isArray(data.options) || data.options.length < 2) {
      setFormError('At least two options are required');
      return false;
    }
    if (!data.correctAnswer) {
      setFormError('Please select a correct answer');
      return false;
    }
    return true;
  };

  const validateMatchingTextData = (data: MatchingTextQuestionData): boolean => {
    if (!data.instruction) {
      setFormError('Instruction is required');
      return false;
    }
    if (!Array.isArray(data.leftColumn) || data.leftColumn.length === 0) {
      setFormError('Left column must have at least one item');
      return false;
    }
    if (!Array.isArray(data.rightColumn) || data.rightColumn.length === 0) {
      setFormError('Right column must have at least one item');
      return false;
    }
    if (!Array.isArray(data.correctMatches) || data.correctMatches.length === 0) {
      setFormError('At least one match is required');
      return false;
    }
    return true;
  };

  const validateFillBlankData = (data: FillBlankQuestionData): boolean => {
    if (!data.instruction || !data.sentence) {
      setFormError('Instruction and sentence are required');
      return false;
    }
    if (!data.sentence.includes('_____')) {
      setFormError('Sentence must contain _____ to mark the blank');
      return false;
    }
    if (!Array.isArray(data.options) || data.options.length < 2) {
      setFormError('At least two options are required');
      return false;
    }
    if (!data.correctAnswer) {
      setFormError('Please select a correct answer');
      return false;
    }
    return true;
  };

  const validateAudioBoolData = (data: AudioBoolQuestionData): boolean => {
    if (!data.instruction || !data.audio || !data.transcript) {
      setFormError('Instruction, audio URL, and transcript are required');
      return false;
    }
    if (data.correctAnswer === undefined) {
      setFormError('Please select true or false as the correct answer');
      return false;
    }
    return true;
  };

  const validateQuestionData = (data: QuestionData, type: QuestionType): boolean => {
    switch (type) {
      case QuestionType.AUDIO_IMAGE:
        return validateAudioImageData(data as AudioImageQuestionData);
      case QuestionType.TEXT_SELECTION:
        return validateTextSelectionData(data as TextSelectionQuestionData);
      case QuestionType.MATCHING_TEXT:
        return validateMatchingTextData(data as MatchingTextQuestionData);
      case QuestionType.FILL_BLANK:
        return validateFillBlankData(data as FillBlankQuestionData);
      case QuestionType.AUDIO_BOOL:
        return validateAudioBoolData(data as AudioBoolQuestionData);
      default:
        return true;
    }
  };

  // Type-specific mappers for outgoing data
  const mapAudioImageFormValues = (values: AudioImageFormValues): AudioImageQuestionData => {
    return {
      instruction: values.instruction || '',
      audio: values.audio || '',
      audio_transcript_chinese: values.audio_transcript_chinese || '',
      audio_transcript_pinyin: values.audio_transcript_pinyin || '',
      audio_transcript_translation: values.audio_transcript_translation || '',
      options: (values.options || []).map((opt) => ({
        id: String(opt.id || ''),
        image: opt.image || '',
        alt: opt.alt || '',
        correct: Boolean(opt.correct) || false,
      })),
      correctAnswer: (values.options || []).find((opt) => opt.correct)?.id?.toString() || '',
      explanation: values.explanation || '',
    };
  };

  const mapTextSelectionFormValues = (values: TextSelectionFormValues): TextSelectionQuestionData => {
    return {
      instruction: values.instruction || '',
      question: values.question || '',
      options: (values.options || []).map((opt) => ({
        id: String(opt.id || ''),
        text: String(opt.text || '')
      })),
      correctAnswer: String(values.correctAnswer || ''),
      explanation: values.explanation || '',
    };
  };

  const mapMatchingTextFormValues = (values: MatchingTextFormValues): MatchingTextQuestionData => {
    return {
      instruction: values.instruction || '',
      leftColumn: (values.leftColumn || []).map((item) => ({
        id: String(item.id || ''),
        text: String(item.text || '')
      })),
      rightColumn: (values.rightColumn || []).map((item) => ({
        id: String(item.id || ''),
        text: String(item.text || '')
      })),
      correctMatches: (values.correctMatches || []).map((match) => ({
        left: String(match.left || ''),
        right: String(match.right || '')
      })),
    };
  };

  const mapFillBlankFormValues = (values: FillBlankFormValues): FillBlankQuestionData => {
    return {
      instruction: values.instruction || '',
      sentence: values.sentence || '',
      pinyin: values.pinyin || '',
      english: values.english || '',
      options: Array.isArray(values.options) 
        ? values.options.map((opt) => String(opt || '')) 
        : [],
      correctAnswer: String(values.correctAnswer || ''),
      explanation: values.explanation || '',
    };
  };

  const mapAudioBoolFormValues = (values: AudioBoolFormValues): AudioBoolQuestionData => {
    return {
      instruction: values.instruction || '',
      audio: values.audio || '',
      transcript: values.transcript || '',
      pinyin: values.pinyin || '',
      english: values.english || '',
      correctAnswer: values.correctAnswer === true,
      explanation: values.explanation || '',
    };
  };

  const mapFormValuesToQuestionData = (values: any): QuestionData => {
    // Transform form values to the structure expected by the API
    switch (values.questionType) {
      case QuestionType.AUDIO_IMAGE:
        return mapAudioImageFormValues(values as AudioImageFormValues);
      case QuestionType.TEXT_SELECTION:
        return mapTextSelectionFormValues(values as TextSelectionFormValues);
      case QuestionType.MATCHING_TEXT:
        return mapMatchingTextFormValues(values as MatchingTextFormValues);
      case QuestionType.FILL_BLANK:
        return mapFillBlankFormValues(values as FillBlankFormValues);
      case QuestionType.AUDIO_BOOL:
        return mapAudioBoolFormValues(values as AudioBoolFormValues);
      default:
        return {} as QuestionData;
    }
  };

  const handleSubmit = async () => {
    try {
      setFormError(null);
      const values = await form.validateFields();
      setSubmitting(true);
      
      // Transform form values to question data structure based on type
      const data = mapFormValuesToQuestionData(values);
      
      const questionData = {
        lessonId,
        questionType: values.questionType,
        orderIndex: values.orderIndex,
        data,
        isActive: true,
      };
      
      // Validate the transformed data
      if (!validateQuestionData(data, values.questionType)) {
        setSubmitting(false);
        return;
      }
      
      if (question) {
        // Update existing question
        await questionApi.updateQuestion(question.id, questionData);
      } else {
        // Create new question
        await questionApi.createQuestion(questionData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Failed to save question:', error);
      message.error('Failed to save question. Please check the form.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormFieldsByType = () => {
    if (!questionType) return null;
    
    switch (questionType) {
      case QuestionType.AUDIO_IMAGE:
        return (
          <>
            <Form.Item
              name="instruction"
              label="Instruction"
              rules={[{ required: true, message: 'Please enter instruction' }]}
            >
              <TextArea rows={2} />
            </Form.Item>
            
            <Form.Item
              name="audio"
              label="Audio URL"
              rules={[{ required: true, message: 'Please enter audio URL' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item name="audio_transcript_chinese" label="Transcript (Chinese)">
              <TextArea rows={2} />
            </Form.Item>
            
            <Form.Item name="audio_transcript_pinyin" label="Transcript (Pinyin)">
              <TextArea rows={2} />
            </Form.Item>
            
            <Form.Item name="audio_transcript_translation" label="Transcript (English)">
              <TextArea rows={2} />
            </Form.Item>
            
            <Divider>Image Options</Divider>
            <Form.List 
              name="options" 
              initialValue={[]}
              rules={[
                {
                  validator: async (_, options) => {
                    if (!options || options.length < 2) {
                      return Promise.reject(new Error('At least 2 options are required'));
                    }
                    
                    // Check if at least one option is marked as correct
                    const hasCorrect = options.some((opt: any) => opt.correct);
                    if (!hasCorrect) {
                      return Promise.reject(new Error('At least one option must be marked as correct'));
                    }
                    
                    return Promise.resolve();
                  },
                },
              ]}
            >
              {(fields, { add, remove }) => (
                <>
                  {fields.map(field => (
                    <div key={field.key} style={{ marginBottom: 16, border: '1px solid #f0f0f0', padding: 16, borderRadius: 4 }}>
                      <h4>Option {field.name + 1}</h4>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item
                          name={[field.name, 'id']}
                          label="ID"
                          rules={[{ required: true, message: 'Please enter option ID' }]}
                        >
                          <Input placeholder="e.g., option1" />
                        </Form.Item>
                        
                        <Form.Item
                          name={[field.name, 'image']}
                          label="Image URL"
                          rules={[{ required: true, message: 'Please enter image URL' }]}
                        >
                          <Input placeholder="https://example.com/image.jpg" />
                        </Form.Item>
                        
                        <Form.Item
                          name={[field.name, 'alt']}
                          label="Image Description"
                        >
                          <Input placeholder="Description of the image" />
                        </Form.Item>
                        
                        <Form.Item
                          name={[field.name, 'correct']}
                          label="Is this the correct answer?"
                          valuePropName="checked"
                        >
                          <Radio.Group>
                            <Radio value={true}>Yes</Radio>
                            <Radio value={false}>No</Radio>
                          </Radio.Group>
                        </Form.Item>
                        
                        <Button 
                          type="dashed" 
                          danger 
                          onClick={() => remove(field.name)}
                          icon={<MinusCircleOutlined />}
                          disabled={fields.length <= 2}
                        >
                          Remove Option
                        </Button>
                      </Space>
                    </div>
                  ))}
                  
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add({
                        id: `option${fields.length + 1}`,
                        image: '',
                        alt: '',
                        correct: false,
                      })}
                      icon={<PlusOutlined />}
                      block
                    >
                      Add Option
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            
            <Form.Item
              name="explanation"
              label="Explanation"
            >
              <TextArea rows={3} />
            </Form.Item>
          </>
        );
      
      case QuestionType.TEXT_SELECTION:
        return (
          <>
            <Form.Item
              name="instruction"
              label="Instruction"
              rules={[{ required: true, message: 'Please enter instruction' }]}
            >
              <TextArea rows={2} />
            </Form.Item>
            
            <Form.Item
              name="question"
              label="Question"
              rules={[{ required: true, message: 'Please enter question' }]}
            >
              <TextArea rows={2} />
            </Form.Item>
            
            <Divider>Answer Options</Divider>
            <Form.List 
              name="options" 
              initialValue={[]}
              rules={[
                {
                  validator: async (_, options) => {
                    if (!options || options.length < 2) {
                      return Promise.reject(new Error('At least 2 options are required'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              {(fields, { add, remove }) => (
                <>
                  {fields.map(field => (
                    <div key={field.key} style={{ marginBottom: 16, border: '1px solid #f0f0f0', padding: 16, borderRadius: 4 }}>
                      <h4>Option {field.name + 1}</h4>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item
                          name={[field.name, 'id']}
                          label="ID"
                          rules={[{ required: true, message: 'Please enter option ID' }]}
                        >
                          <Input placeholder="e.g., option1" />
                        </Form.Item>
                        
                        <Form.Item
                          name={[field.name, 'text']}
                          label="Text"
                          rules={[{ required: true, message: 'Please enter option text' }]}
                        >
                          <TextArea rows={2} placeholder="Option text" />
                        </Form.Item>
                        
                        <Button 
                          type="dashed" 
                          danger 
                          onClick={() => remove(field.name)}
                          icon={<MinusCircleOutlined />}
                          disabled={fields.length <= 2}
                        >
                          Remove Option
                        </Button>
                      </Space>
                    </div>
                  ))}
                  
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add({
                        id: `option${fields.length + 1}`,
                        text: '',
                      })}
                      icon={<PlusOutlined />}
                      block
                    >
                      Add Option
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            
            <Form.Item
              name="correctAnswer"
              label="Correct Answer (Option ID)"
              rules={[{ required: true, message: 'Please select correct answer' }]}
            >
              <Select
                placeholder="Select correct answer"
                options={((form.getFieldValue('options') || []).map((option: any) => ({
                  label: option && option.id ? (option.id + (option.text ? ` - ${option.text.substring(0, 20)}...` : '')) : '',
                  value: option && option.id ? option.id : '',
                })))}
              />
            </Form.Item>
            
            <Form.Item
              name="explanation"
              label="Explanation"
            >
              <TextArea rows={3} />
            </Form.Item>
          </>
        );
      
      case QuestionType.MATCHING_TEXT:
        return (
          <>
            <Form.Item
              name="instruction"
              label="Instruction"
              rules={[{ required: true, message: 'Please enter instruction' }]}
            >
              <TextArea rows={2} />
            </Form.Item>
            
            <Divider>Left Column (Column A)</Divider>
            <Form.List 
              name="leftColumn" 
              initialValue={[]}
              rules={[
                {
                  validator: async (_, items) => {
                    if (!items || items.length < 1) {
                      return Promise.reject(new Error('At least one left column item is required'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              {(fields, { add, remove }) => (
                <>
                  {fields.map(field => (
                    <Space key={field.key} align="baseline">
                      <Form.Item
                        name={[field.name, 'id']}
                        label="ID"
                        rules={[{ required: true, message: 'Missing ID' }]}
                      >
                        <Input style={{ width: 100 }} />
                      </Form.Item>
                      
                      <Form.Item
                        name={[field.name, 'text']}
                        label="Text"
                        rules={[{ required: true, message: 'Missing text' }]}
                      >
                        <Input style={{ width: 300 }} />
                      </Form.Item>
                      
                      <Button 
                        danger 
                        onClick={() => remove(field.name)}
                        icon={<MinusCircleOutlined />}
                        disabled={fields.length <= 1}
                      />
                    </Space>
                  ))}
                  
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add({ id: `leftItem${fields.length + 1}`, text: '' })}
                      icon={<PlusOutlined />}
                    >
                      Add Left Column Item
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            
            <Divider>Right Column (Column B)</Divider>
            <Form.List 
              name="rightColumn" 
              initialValue={[]}
              rules={[
                {
                  validator: async (_, items) => {
                    if (!items || items.length < 1) {
                      return Promise.reject(new Error('At least one right column item is required'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              {(fields, { add, remove }) => (
                <>
                  {fields.map(field => (
                    <Space key={field.key} align="baseline">
                      <Form.Item
                        name={[field.name, 'id']}
                        label="ID"
                        rules={[{ required: true, message: 'Missing ID' }]}
                      >
                        <Input style={{ width: 100 }} />
                      </Form.Item>
                      
                      <Form.Item
                        name={[field.name, 'text']}
                        label="Text"
                        rules={[{ required: true, message: 'Missing text' }]}
                      >
                        <Input style={{ width: 300 }} />
                      </Form.Item>
                      
                      <Button 
                        danger 
                        onClick={() => remove(field.name)}
                        icon={<MinusCircleOutlined />}
                        disabled={fields.length <= 1}
                      />
                    </Space>
                  ))}
                  
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add({ id: `rightItem${fields.length + 1}`, text: '' })}
                      icon={<PlusOutlined />}
                    >
                      Add Right Column Item
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            
            <Divider>Correct Matches</Divider>
            <Form.List 
              name="correctMatches" 
              initialValue={[]}
              rules={[
                {
                  validator: async (_, matches) => {
                    if (!matches || matches.length < 1) {
                      return Promise.reject(new Error('At least one match is required'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              {(fields, { add, remove }) => (
                <>
                  {fields.map(field => (
                    <Space key={field.key} align="baseline">
                      <Form.Item
                        name={[field.name, 'left']}
                        label="Left ID"
                        rules={[{ required: true, message: 'Missing left ID' }]}
                      >
                        <Select style={{ width: 150 }} placeholder="Select left item">
                          {(form.getFieldValue('leftColumn') || []).map((item: any) => (
                            <Option key={item.id} value={item.id}>
                              {item.id} - {item.text}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      <Form.Item
                        name={[field.name, 'right']}
                        label="Right ID"
                        rules={[{ required: true, message: 'Missing right ID' }]}
                      >
                        <Select style={{ width: 150 }} placeholder="Select right item">
                          {(form.getFieldValue('rightColumn') || []).map((item: any) => (
                            <Option key={item.id} value={item.id}>
                              {item.id} - {item.text}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      <Button 
                        danger 
                        onClick={() => remove(field.name)}
                        icon={<MinusCircleOutlined />}
                        disabled={fields.length <= 1}
                      />
                    </Space>
                  ))}
                  
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add({ left: '', right: '' })}
                      icon={<PlusOutlined />}
                    >
                      Add Match
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </>
        );
      
      case QuestionType.FILL_BLANK:
        return (
          <>
            <Form.Item
              name="instruction"
              label="Instruction"
              rules={[{ required: true, message: 'Please enter instruction' }]}
            >
              <TextArea rows={2} />
            </Form.Item>
            
            <Form.Item
              name="sentence"
              label="Sentence (use _____ for blank)"
              rules={[
                { required: true, message: 'Please enter the sentence' },
                {
                  validator: (_, value) => {
                    if (!value || !value.includes('_____')) {
                      return Promise.reject('Sentence must contain _____ to mark the blank');
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <TextArea rows={2} placeholder="This is a _____ sentence." />
            </Form.Item>
            
            <Form.Item
              name="pinyin"
              label="Pinyin"
              rules={[{ required: true, message: 'Please enter pinyin' }]}
            >
              <TextArea rows={2} />
            </Form.Item>
            
            <Form.Item
              name="english"
              label="English Translation"
              rules={[{ required: true, message: 'Please enter English translation' }]}
            >
              <TextArea rows={2} />
            </Form.Item>
            
            <Divider>Options</Divider>
            <Form.List 
              name="options" 
              initialValue={[]}
              rules={[
                {
                  validator: async (_, options) => {
                    if (!options || options.length < 2) {
                      return Promise.reject(new Error('At least 2 options are required'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              {(fields, { add, remove }) => (
                <>
                  {fields.map(field => (
                    <Space key={field.key} align="baseline">
                      <Form.Item
                        name={[field.name]}
                        rules={[{ required: true, message: 'Please enter option' }]}
                      >
                        <Input placeholder="Option text" style={{ width: 300 }} />
                      </Form.Item>
                      
                      <Button 
                        danger 
                        onClick={() => remove(field.name)}
                        icon={<MinusCircleOutlined />}
                        disabled={fields.length <= 2}
                      />
                    </Space>
                  ))}
                  
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add('')}
                      icon={<PlusOutlined />}
                    >
                      Add Option
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            
            <Form.Item
              name="correctAnswer"
              label="Correct Answer"
              rules={[{ required: true, message: 'Please select correct answer' }]}
            >
              <Select
                placeholder="Select correct answer"
                options={((form.getFieldValue('options') || []).map((option: string, index: number) => ({
                  label: option || '',
                  value: option || '',
                })))}
              />
            </Form.Item>
            
            <Form.Item
              name="explanation"
              label="Explanation"
            >
              <TextArea rows={3} />
            </Form.Item>
          </>
        );
      
      case QuestionType.AUDIO_BOOL:
        return (
          <>
            <Form.Item
              name="instruction"
              label="Instruction"
              rules={[{ required: true, message: 'Please enter instruction' }]}
            >
              <TextArea rows={2} />
            </Form.Item>
            
            <Form.Item
              name="audio"
              label="Audio URL"
              rules={[{ required: true, message: 'Please enter audio URL' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="transcript"
              label="Transcript (Chinese)"
              rules={[{ required: true, message: 'Please enter transcript' }]}
            >
              <TextArea rows={2} />
            </Form.Item>
            
            <Form.Item
              name="pinyin"
              label="Pinyin"
              rules={[{ required: true, message: 'Please enter pinyin' }]}
            >
              <TextArea rows={2} />
            </Form.Item>
            
            <Form.Item
              name="english"
              label="English Translation"
              rules={[{ required: true, message: 'Please enter English translation' }]}
            >
              <TextArea rows={2} />
            </Form.Item>
            
            <Form.Item
              name="correctAnswer"
              label="Correct Answer"
              rules={[{ required: true, message: 'Please select correct answer' }]}
            >
              <Select
                placeholder="Select correct answer"
                options={[
                  { label: 'True', value: true },
                  { label: 'False', value: false },
                ]}
              />
            </Form.Item>
            
            <Form.Item
              name="explanation"
              label="Explanation"
            >
              <TextArea rows={3} />
            </Form.Item>
          </>
        );
      
      default:
        return <p>Please select a question type</p>;
    }
  };

  return (
    <Modal
      title={question ? "Edit Question" : "Add New Question"}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      width={800}
      okText={question ? "Update" : "Create"}
      confirmLoading={submitting}
    >
      {formError && (
        <Alert 
          message="Form Error" 
          description={formError} 
          type="error" 
          showIcon 
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setFormError(null)}
        />
      )}
      
      <Form form={form} layout="vertical">
        <Form.Item
          name="questionType"
          label="Question Type"
          rules={[{ required: true, message: 'Please select a question type' }]}
        >
          <Select
            options={[
              { value: QuestionType.AUDIO_IMAGE, label: 'Audio to Image' },
              { value: QuestionType.TEXT_SELECTION, label: 'Multiple Choice' },
              { value: QuestionType.MATCHING_TEXT, label: 'Matching Text' },
              { value: QuestionType.FILL_BLANK, label: 'Fill in the Blank' },
              { value: QuestionType.AUDIO_BOOL, label: 'Audio True/False' },
            ]}
            onChange={() => {
              // Clear form fields when type changes to avoid data structure mismatches
              const currentType = form.getFieldValue('questionType');
              const currentOrder = form.getFieldValue('orderIndex');
              form.resetFields();
              form.setFieldsValue({
                questionType: currentType,
                orderIndex: currentOrder,
              });
            }}
          />
        </Form.Item>
        
        <Form.Item
          name="orderIndex"
          label="Order"
          rules={[{ required: true, message: 'Please enter question order' }]}
        >
          <InputNumber min={1} />
        </Form.Item>
        
        <Collapse defaultActiveKey={['1']}>
          <Panel header="Question Content" key="1">
            {renderFormFieldsByType()}
          </Panel>
        </Collapse>
      </Form>
    </Modal>
  );
};

export default QuestionFormModal;