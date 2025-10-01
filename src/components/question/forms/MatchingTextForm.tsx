import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Space, Select, Typography } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { MatchingTextQuestionData } from '@/types/questionType';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

interface MatchingTextFormProps {
  form: any;
}

const MatchingTextForm: React.FC<MatchingTextFormProps> = ({ form }) => {
  const [leftItems, setLeftItems] = useState<Array<{id: string, text: string}>>([]);
  const [rightItems, setRightItems] = useState<Array<{id: string, text: string}>>([]);
  
  // Watch for changes in the columns to update the select options
  const leftValues = Form.useWatch(['data', 'leftColumn'], form) || [];
  const rightValues = Form.useWatch(['data', 'rightColumn'], form) || [];
  
  useEffect(() => {
    const updatedLeftItems = leftValues.map((item: any, index: number) => ({
      id: item?.id || `left-${index}`,
      text: item?.text || ''
    })).filter((item: any) => item.text);
    
    setLeftItems(updatedLeftItems);
  }, [leftValues]);
  
  useEffect(() => {
    const updatedRightItems = rightValues.map((item: any, index: number) => ({
      id: item?.id || `right-${index}`,
      text: item?.text || ''
    })).filter((item: any) => item.text);
    
    setRightItems(updatedRightItems);
  }, [rightValues]);

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
        <Form.List name={['data', 'leftColumn']} initialValue={[{ id: 'left-0', text: '' }]}>
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
                  onClick={() => add({ id: `left-${fields.length}`, text: '' })}
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
        <Form.List name={['data', 'rightColumn']} initialValue={[{ id: 'right-0', text: '' }]}>
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
                  onClick={() => add({ id: `right-${fields.length}`, text: '' })}
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

      <Card 
        title="Correct Matches" 
        bordered={false}
        extra={
          <Text type="secondary">Select matching pairs from the left and right columns</Text>
        }
      >
        <Form.List name={['data', 'correctMatches']} initialValue={[{ left: '', right: '' }]}>
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
                    <Select placeholder="Select left item">
                      {leftItems.map((item, index) => (
                        <Option key={`left-option-${index}`} value={item.id}>
                          {item.text}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Text type="secondary">matches</Text>
                  <Form.Item
                    {...restField}
                    name={[name, 'right']}
                    rules={[{ required: true, message: 'Select right item' }]}
                    style={{ width: '200px' }}
                  >
                    <Select placeholder="Select right item">
                      {rightItems.map((item, index) => (
                        <Option key={`right-option-${index}`} value={item.id}>
                          {item.text}
                        </Option>
                      ))}
                    </Select>
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