import React, { useState } from 'react';
import { Form, Input, Button, Radio, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { AudioBoolQuestionData } from '@/types/questionType';

const { TextArea } = Input;

interface AudioBoolFormProps {
  form: any;
}

const AudioBoolForm: React.FC<AudioBoolFormProps> = ({ form }) => {
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
          placeholder="Enter instruction for the student (e.g., 'Listen to the audio and determine if the statement is true or false')"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>

      <Form.Item
        label="Audio URL"
        name={['data', 'audio']}
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
        label="Transcript (Chinese)"
        name={['data', 'transcript']}
        rules={[{ required: true, message: 'Please enter the Chinese transcript' }]}
      >
        <Input placeholder="Enter the Chinese transcript of the audio" />
      </Form.Item>

      <Form.Item
        label="Pinyin"
        name={['data', 'pinyin']}
      >
        <Input placeholder="Enter the pinyin transcript of the audio" />
      </Form.Item>

      <Form.Item
        label="English Translation"
        name={['data', 'english']}
      >
        <Input placeholder="Enter the English translation of the audio" />
      </Form.Item>

      <Form.Item
        label="Correct Answer"
        name={['data', 'correctAnswer']}
        rules={[{ required: true, message: 'Please select the correct answer' }]}
      >
        <Radio.Group>
          <Radio value={true}>True</Radio>
          <Radio value={false}>False</Radio>
        </Radio.Group>
      </Form.Item>

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

export default AudioBoolForm;