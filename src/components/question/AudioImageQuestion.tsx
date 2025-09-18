import React, { useState } from 'react';
import { Card, Typography, Space, Image, Row, Col, Form, Input, Upload, Button } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import AudioPlayer from './AudioPlayer';
import { Question, AudioImageQuestionData } from '@/types/questionType';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface AudioImageQuestionProps {
  question?: Question;
  isPreview?: boolean;
  form?: any; // For Form.useForm()
  initialValues?: AudioImageQuestionData;
}

const AudioImageQuestion: React.FC<AudioImageQuestionProps> = ({ 
  question, 
  isPreview = false,
  form,
  initialValues
}) => {
  // If form is provided, we're in edit mode, otherwise we're in display mode
  const isEditMode = !!form;
  
  // For display mode
  const data = question?.data as AudioImageQuestionData;
  
  // For edit mode
  const [options, setOptions] = useState<any[]>(initialValues?.options || []);
  
  const addOption = () => {
    const newOption = {
      id: `option_${Date.now()}`,
      image: '',
      label: '',
      correct: false
    };
    
    const newOptions = [...options, newOption];
    setOptions(newOptions);
    form.setFieldsValue({ options: newOptions });
  };
  
  const removeOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
    form.setFieldsValue({ options: newOptions });
  };
  
  const handleOptionChange = (index: number, key: string, value: any) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      [key]: value
    };
    setOptions(newOptions);
    form.setFieldsValue({ options: newOptions });
  };
  
  // If we're in edit mode, render the form for creating/editing a question
  if (isEditMode) {
    return (
      <>
        <Form.Item
          name="instruction"
          label="Instruction"
          rules={[{ required: true, message: 'Please enter instruction' }]}
        >
          <TextArea rows={2} placeholder="Enter the instruction for this question" />
        </Form.Item>
        
        <Form.Item
          name="audio"
          label="Audio"
          rules={[{ required: true, message: 'Please upload audio' }]}
        >
          <Upload
            maxCount={1}
            beforeUpload={() => false} // Prevent auto upload
          >
            <Button icon={<UploadOutlined />}>Upload Audio</Button>
          </Upload>
        </Form.Item>
        
        <Form.Item
          name="audio_transcript_chinese"
          label="Chinese Transcript"
        >
          <Input placeholder="Enter Chinese text" />
        </Form.Item>
        
        <Form.Item
          name="audio_transcript_pinyin"
          label="Pinyin"
        >
          <Input placeholder="Enter pinyin" />
        </Form.Item>
        
        <Form.Item
          name="audio_transcript_translation"
          label="English Translation"
        >
          <Input placeholder="Enter English translation" />
        </Form.Item>
        
        <div style={{ marginBottom: 16 }}>
          <Text strong>Options</Text>
          
          {options.map((option, index) => (
            <Card key={option.id} style={{ marginTop: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Option {index + 1}</Text>
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => removeOption(index)}
                  />
                </div>
                
                <Form.Item
                  label="Label"
                  required
                >
                  <Input
                    value={option.label}
                    onChange={e => handleOptionChange(index, 'label', e.target.value)}
                    placeholder="Option label"
                  />
                </Form.Item>
                
                <Form.Item
                  label="Image"
                  required
                >
                  <Upload
                    maxCount={1}
                    beforeUpload={() => false}
                    onChange={info => handleOptionChange(index, 'image', info.file)}
                  >
                    <Button icon={<UploadOutlined />}>Upload Image</Button>
                  </Upload>
                </Form.Item>
                
                <Form.Item label="Is Correct">
                  <Button
                    type={option.correct ? 'primary' : 'default'}
                    onClick={() => {
                      // Update all options to set correct=false, then set this one to true
                      const updatedOptions = options.map((opt, i) => ({
                        ...opt,
                        correct: i === index
                      }));
                      setOptions(updatedOptions);
                      form.setFieldsValue({ options: updatedOptions });
                    }}
                  >
                    {option.correct ? 'Correct Answer' : 'Mark as Correct'}
                  </Button>
                </Form.Item>
              </Space>
            </Card>
          ))}
          
          <Button 
            type="dashed" 
            onClick={addOption} 
            style={{ width: '100%', marginTop: 16 }}
            icon={<PlusOutlined />}
          >
            Add Option
          </Button>
        </div>
        
        <Form.Item
          name="explanation"
          label="Explanation"
        >
          <TextArea rows={3} placeholder="Enter an explanation (optional)" />
        </Form.Item>
      </>
    );
  }
  
  // Display mode (original component logic)
  // Handle both formats from API (older vs newer format)
  const instruction = data?.instruction || 'Listen to the audio and select the correct image';
  const audioUrl = data?.audio || data?.audio_url || '';
  const displayOptions = data?.options || data?.answers || [];
  const explanation = data?.explanation || '';
  const transcript = data?.audio_transcript_chinese || '';
  const pinyin = data?.audio_transcript_pinyin || '';
  const english = data?.audio_transcript_translation || '';

  return (
    <div>
      <Paragraph>{instruction}</Paragraph>
      
      <Card size="small" style={{ marginBottom: 16 }}>
        <AudioPlayer audioUrl={audioUrl} />
        
        {transcript && (
          <div style={{ marginTop: 8 }}>
            <Text strong>Transcript: </Text>
            <Text>{transcript}</Text>
          </div>
        )}
        
        {pinyin && (
          <div>
            <Text strong>Pinyin: </Text>
            <Text>{pinyin}</Text>
          </div>
        )}
        
        {english && (
          <div>
            <Text strong>English: </Text>
            <Text>{english}</Text>
          </div>
        )}
      </Card>
      
      <Row gutter={[16, 16]}>
        {displayOptions.map((option: any, index: number) => {
          const isCorrect = 
            (option.correct === true) || 
            (data?.correctAnswer && data?.correctAnswer === option.id);
          
          return (
            <Col xs={24} sm={12} md={8} key={option.id || index}>
              <Card 
                hoverable 
                style={{ 
                  borderColor: isPreview && isCorrect ? '#52c41a' : undefined,
                  background: isPreview && isCorrect ? '#f6ffed' : undefined
                }}
              >
                <Image
                  src={option.image || option.image_url || ''}
                  alt={option.alt || option.label || `Option ${index + 1}`}
                  fallback="data:image/png;base64,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"
                />
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                  <Text>{option.label || option.alt || `Option ${index + 1}`}</Text>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
      
      {explanation && isPreview && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Explanation: </Text>
          <Paragraph>{explanation}</Paragraph>
        </div>
      )}
    </div>
  );
};

export default AudioImageQuestion;