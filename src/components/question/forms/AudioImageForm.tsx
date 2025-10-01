import React, { useState } from 'react';
import { Form, Input, Button, Space, Card, Typography, Upload, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { AudioImageQuestionData } from '@/types/questionType';

const { Text } = Typography;
const { TextArea } = Input;

interface AudioImageFormProps {
  form: any;
}

const AudioImageForm: React.FC<AudioImageFormProps> = ({ form }) => {
  const [fileList, setFileList] = useState<any[]>([]);

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const beforeUpload = (file: any) => {
    const isAudio = file.type === 'audio/mpeg' || file.type === 'audio/mp3' || file.type === 'audio/wav';
    if (!isAudio) {
      message.error('You can only upload audio files!');
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Audio must be smaller than 5MB!');
    }
    return false;
  };

  return (
    <div>
      <Form.Item
        label="Instruction"
        name={['data', 'instruction']}
        rules={[{ required: true, message: 'Please enter instruction' }]}
      >
        <TextArea
          placeholder="Enter instruction for the student (e.g., 'Listen to the audio and select the matching image')"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>

      <Form.Item
        label="Audio URL"
        name={['data', 'audio_url']}
        rules={[{ required: true, message: 'Please provide an audio URL' }]}
      >
        <Input placeholder="Enter the URL to the audio file" />
      </Form.Item>

      <Form.Item
        label="Upload Audio (Optional)"
        name="audio_upload"
        valuePropName="fileList"
        getValueFromEvent={normFile}
      >
        <Upload
          beforeUpload={beforeUpload}
          fileList={fileList}
          onChange={({ fileList }) => setFileList(fileList)}
        >
          <Button icon={<UploadOutlined />}>Upload Audio</Button>
        </Upload>
      </Form.Item>

      <Form.Item
        label="Audio Transcript (Chinese)"
        name={['data', 'audio_transcript_chinese']}
        rules={[{ required: true, message: 'Please enter the Chinese transcript' }]}
      >
        <Input placeholder="Enter the Chinese transcript of the audio" />
      </Form.Item>

      <Form.Item
        label="Audio Transcript (Pinyin)"
        name={['data', 'audio_transcript_pinyin']}
      >
        <Input placeholder="Enter the pinyin transcript of the audio" />
      </Form.Item>

      <Form.Item
        label="Audio Transcript (Translation)"
        name={['data', 'audio_transcript_translation']}
      >
        <Input placeholder="Enter the English translation of the audio" />
      </Form.Item>

      <Card title="Answer Options" bordered={false}>
        <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
          Add images as options. Mark one as the correct answer.
        </Text>

        <Form.List name={['data', 'answers']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card 
                  key={key} 
                  size="small" 
                  style={{ marginBottom: 16 }}
                  extra={
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  }
                >
                  <Form.Item
                    {...restField}
                    name={[name, 'image_url']}
                    label="Image URL"
                    rules={[{ required: true, message: 'Please enter image URL' }]}
                  >
                    <Input placeholder="URL to the image" />
                  </Form.Item>
                  
                  <Form.Item
                    {...restField}
                    name={[name, 'label']}
                    label="Label/Description"
                  >
                    <Input placeholder="Optional description of this image" />
                  </Form.Item>
                  
                  <Form.Item
                    {...restField}
                    name={[name, 'correct']}
                    valuePropName="checked"
                    label="Is this the correct answer?"
                  >
                    <Input type="checkbox" />
                  </Form.Item>
                </Card>
              ))}
              
              <Form.Item>
                <Button 
                  type="dashed" 
                  onClick={() => add({ image_url: '', label: '', correct: false })} 
                  block 
                  icon={<PlusOutlined />}
                >
                  Add Image Option
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      <Form.Item
        label="Explanation"
        name={['data', 'explanation']}
      >
        <TextArea
          placeholder="Enter explanation that will be shown after answering"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>
    </div>
  );
};

export default AudioImageForm;