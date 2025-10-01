import React from 'react';
import { Form, Input, Button, Card, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { MatchingTextQuestionData } from '@/types/questionType';

const { TextArea } = Input;

interface MatchingTextFormProps {
  form: any;
}

const MatchingTextForm: React.FC<MatchingTextFormProps> = ({ form }) => {
  return (
    <div>
      <Form.Item
        label="Instruction"
        name={['data', 'instruction']}
        rules={[{ required: true, message: 'Please enter instruction' }]}
      >
        <TextArea
          placeholder="Enter instruction for the student (e.g., 'Match the Chinese words with their English meaning')"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>

      <Card title="Left Column (Chinese)" bordered={false} style={{ marginBottom: 16 }}>
        <Form.List name={['data', 'leftColumn']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'id']}
                    hidden
                    initialValue={`left-${key}`}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'text']}
                    rules={[{ required: true, message: 'Missing text' }]}
                    style={{ width: '400px' }}
                  >
                    <Input placeholder="Enter Chinese text" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add({ id: '', text: '' })}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Left Item
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      <Card title="Right Column (English)" bordered={false} style={{ marginBottom: 16 }}>
        <Form.List name={['data', 'rightColumn']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'id']}
                    hidden
                    initialValue={`right-${key}`}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'text']}
                    rules={[{ required: true, message: 'Missing text' }]}
                    style={{ width: '400px' }}
                  >
                    <Input placeholder="Enter English text" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add({ id: '', text: '' })}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Right Item
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      <Card title="Correct Matches" bordered={false}>
        <Form.List name={['data', 'correctMatches']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'left']}
                    rules={[{ required: true, message: 'Select left item' }]}
                    style={{ width: '200px' }}
                  >
                    <Input placeholder="Left ID" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'right']}
                    rules={[{ required: true, message: 'Select right item' }]}
                    style={{ width: '200px' }}
                  >
                    <Input placeholder="Right ID" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add({ left: '', right: '' })}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Match
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>
    </div>
  );
};

export default MatchingTextForm;