import React from 'react';
import { Form, Input, Button, Card, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { FillBlankQuestionData } from '@/types/questionType';

const { TextArea } = Input;

interface FillBlankFormProps {
  form: any;
}

const FillBlankForm: React.FC<FillBlankFormProps> = ({ form }) => {
  return (
    <div>
      <Form.Item
        label="Instruction"
        name={['data', 'instruction']}
        rules={[{ required: true, message: 'Please enter instruction' }]}
      >
        <TextArea
          placeholder="Enter instruction for the student (e.g., 'Fill in the blank with the correct word')"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>

      <Form.Item
        label="Sentence (use ___ for the blank)"
        name={['data', 'sentence']}
        rules={[
          { required: true, message: 'Please enter the sentence' },
          {
            pattern: /___/,
            message: 'Sentence must contain ___ to indicate the blank',
          },
        ]}
      >
        <TextArea
          placeholder="Enter the sentence with ___ for the blank (e.g., '我喜欢吃___。')"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>

      <Form.Item
        label="Pinyin"
        name={['data', 'pinyin']}
        rules={[{ required: true, message: 'Please enter the pinyin' }]}
      >
        <Input placeholder="Enter the pinyin for the sentence" />
      </Form.Item>

      <Form.Item
        label="English Translation"
        name={['data', 'english']}
        rules={[{ required: true, message: 'Please enter the English translation' }]}
      >
        <Input placeholder="Enter the English translation of the sentence" />
      </Form.Item>

      <Card title="Options" bordered={false}>
        <Form.List name={['data', 'options']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={name}
                    rules={[{ required: true, message: 'Missing option text' }]}
                  >
                    <Input placeholder="Option text" style={{ width: 300 }} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Option
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      <Form.Item
        label="Correct Answer"
        name={['data', 'correctAnswer']}
        rules={[{ required: true, message: 'Please specify the correct answer' }]}
      >
        <Input placeholder="Enter the text of the correct answer" />
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

export default FillBlankForm;