import React, { useState } from 'react';
import { Typography, Row, Col, Card, Button, Space, Form, Input, Select } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Question, MatchingTextQuestionData } from '@/types/questionType';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface MatchingTextQuestionProps {
  question?: Question;
  isPreview?: boolean;
  form?: any; // For Form.useForm()
  initialValues?: MatchingTextQuestionData;
}

const MatchingTextQuestion: React.FC<MatchingTextQuestionProps> = ({ 
  question, 
  isPreview = false,
  form,
  initialValues
}) => {
  // If form is provided, we're in edit mode, otherwise we're in display mode
  const isEditMode = !!form;
  
  // For display mode
  const data = question?.data as MatchingTextQuestionData;
  const [userMatches, setUserMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  
  // For edit mode
  const [leftItems, setLeftItems] = useState<any[]>(initialValues?.leftColumn || []);
  const [rightItems, setRightItems] = useState<any[]>(initialValues?.rightColumn || []);
  
  // Display mode functions
  const handleLeftSelect = (id: string) => {
    setSelectedLeft(id);
  };
  
  const handleRightSelect = (id: string) => {
    if (selectedLeft) {
      setUserMatches(prev => ({
        ...prev,
        [selectedLeft]: id
      }));
      setSelectedLeft(null);
    }
  };
  
  const isCorrectMatch = (leftId: string, rightId: string): boolean => {
    if (!isPreview || !data) return false;
    
    return data.correctMatches.some(
      match => match.left === leftId && match.right === rightId
    );
  };
  
  const getCurrentRightMatch = (leftId: string): string | undefined => {
    return userMatches[leftId];
  };
  
  const isLeftSelected = (id: string): boolean => {
    return selectedLeft === id;
  };
  
  const isRightUsed = (id: string): boolean => {
    return Object.values(userMatches).includes(id);
  };
  
  const resetMatches = () => {
    setUserMatches({});
    setSelectedLeft(null);
  };
  
  const showCorrectAnswers = () => {
    if (!data) return;
    
    const correctMatches: Record<string, string> = {};
    data.correctMatches.forEach(match => {
      correctMatches[match.left] = match.right;
    });
    setUserMatches(correctMatches);
  };

  // Edit mode functions
  const addLeftItem = () => {
    const newItem = {
      id: `left_${Date.now()}`,
      text: ''
    };
    
    const newItems = [...leftItems, newItem];
    setLeftItems(newItems);
    form.setFieldsValue({ leftColumn: newItems });
  };
  
  const addRightItem = () => {
    const newItem = {
      id: `right_${Date.now()}`,
      text: ''
    };
    
    const newItems = [...rightItems, newItem];
    setRightItems(newItems);
    form.setFieldsValue({ rightColumn: newItems });
  };
  
  const removeLeftItem = (index: number) => {
    const newItems = [...leftItems];
    newItems.splice(index, 1);
    setLeftItems(newItems);
    form.setFieldsValue({ leftColumn: newItems });
    
    // Also update correctMatches
    const removedItemId = leftItems[index].id;
    const correctMatches = form.getFieldValue('correctMatches') || [];
    const updatedMatches = correctMatches.filter((match: any) => match.left !== removedItemId);
    form.setFieldsValue({ correctMatches: updatedMatches });
  };
  
  const removeRightItem = (index: number) => {
    const newItems = [...rightItems];
    newItems.splice(index, 1);
    setRightItems(newItems);
    form.setFieldsValue({ rightColumn: newItems });
    
    // Also update correctMatches
    const removedItemId = rightItems[index].id;
    const correctMatches = form.getFieldValue('correctMatches') || [];
    const updatedMatches = correctMatches.filter((match: any) => match.right !== removedItemId);
    form.setFieldsValue({ correctMatches: updatedMatches });
  };
  
  const handleLeftItemChange = (index: number, value: string) => {
    const newItems = [...leftItems];
    newItems[index] = {
      ...newItems[index],
      text: value
    };
    setLeftItems(newItems);
    form.setFieldsValue({ leftColumn: newItems });
  };
  
  const handleRightItemChange = (index: number, value: string) => {
    const newItems = [...rightItems];
    newItems[index] = {
      ...newItems[index],
      text: value
    };
    setRightItems(newItems);
    form.setFieldsValue({ rightColumn: newItems });
  };
  
  const handleCreateMatch = (leftIndex: number, rightIndex: number) => {
    const leftId = leftItems[leftIndex].id;
    const rightId = rightItems[rightIndex].id;
    
    const correctMatches = form.getFieldValue('correctMatches') || [];
    
    // Check if match already exists
    const matchExists = correctMatches.some(
      (match: any) => match.left === leftId && match.right === rightId
    );
    
    if (!matchExists) {
      const newMatches = [...correctMatches, { left: leftId, right: rightId }];
      form.setFieldsValue({ correctMatches: newMatches });
    }
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
        
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Column A Items</Text>
              
              {leftItems.map((item, index) => (
                <Card key={item.id} style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Item {index + 1}</Text>
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => removeLeftItem(index)}
                    />
                  </div>
                  
                  <Input
                    value={item.text}
                    onChange={e => handleLeftItemChange(index, e.target.value)}
                    placeholder="Enter text"
                    style={{ marginTop: 8 }}
                  />
                </Card>
              ))}
              
              <Button 
                type="dashed" 
                onClick={addLeftItem} 
                style={{ width: '100%', marginTop: 16 }}
                icon={<PlusOutlined />}
              >
                Add Column A Item
              </Button>
            </div>
          </Col>
          
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Column B Items</Text>
              
              {rightItems.map((item, index) => (
                <Card key={item.id} style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Item {index + 1}</Text>
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => removeRightItem(index)}
                    />
                  </div>
                  
                  <Input
                    value={item.text}
                    onChange={e => handleRightItemChange(index, e.target.value)}
                    placeholder="Enter text"
                    style={{ marginTop: 8 }}
                  />
                </Card>
              ))}
              
              <Button 
                type="dashed" 
                onClick={addRightItem} 
                style={{ width: '100%', marginTop: 16 }}
                icon={<PlusOutlined />}
              >
                Add Column B Item
              </Button>
            </div>
          </Col>
        </Row>
        
        <div style={{ marginBottom: 16 }}>
          <Text strong>Create Matches</Text>
          <Card>
            <Row gutter={16}>
              <Col span={10}>
                <Form.Item label="Column A Item">
                  <Select 
                    placeholder="Select Column A item"
                    onChange={(value) => setSelectedLeft(value)}
                  >
                    {leftItems.map((item, index) => (
                      <Select.Option key={item.id} value={item.id}>
                        {item.text || `Item ${index + 1}`}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col span={10}>
                <Form.Item label="Column B Item">
                  <Select 
                    placeholder="Select Column B item"
                    onChange={(value) => {
                      if (selectedLeft) {
                        handleCreateMatch(
                          leftItems.findIndex(item => item.id === selectedLeft),
                          rightItems.findIndex(item => item.id === value)
                        );
                        setSelectedLeft(null);
                      }
                    }}
                    disabled={!selectedLeft}
                  >
                    {rightItems.map((item, index) => (
                      <Select.Option key={item.id} value={item.id}>
                        {item.text || `Item ${index + 1}`}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>
          
          <div style={{ marginTop: 16 }}>
            <Text strong>Current Matches:</Text>
            <Form.Item name="correctMatches" hidden>
              <Input />
            </Form.Item>
            
            <Card>
              {form.getFieldValue('correctMatches')?.map((match: any, index: number) => {
                const leftItem = leftItems.find(item => item.id === match.left);
                const rightItem = rightItems.find(item => item.id === match.right);
                
                if (!leftItem || !rightItem) return null;
                
                return (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: 8,
                      padding: 8,
                      borderBottom: index < (form.getFieldValue('correctMatches')?.length - 1) ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <Text>{leftItem.text || `Left Item ${leftItems.findIndex(item => item.id === match.left) + 1}`}</Text>
                    <Text>→</Text>
                    <Text>{rightItem.text || `Right Item ${rightItems.findIndex(item => item.id === match.right) + 1}`}</Text>
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => {
                        const correctMatches = form.getFieldValue('correctMatches') || [];
                        const updatedMatches = correctMatches.filter((_: any, i: number) => i !== index);
                        form.setFieldsValue({ correctMatches: updatedMatches });
                      }}
                    />
                  </div>
                );
              })}
              
              {(!form.getFieldValue('correctMatches') || form.getFieldValue('correctMatches').length === 0) && (
                <Text type="secondary">No matches created yet. Use the selectors above to create matches.</Text>
              )}
            </Card>
          </div>
        </div>
      </>
    );
  }
  
  // Display mode (original component logic)
  return (
    <div>
      <Paragraph>{data?.instruction}</Paragraph>
      
      {!isPreview && (
        <Space style={{ marginBottom: 16 }}>
          <Button onClick={resetMatches} size="small">Reset Matches</Button>
          <Button onClick={showCorrectAnswers} size="small">Show Correct Answers</Button>
        </Space>
      )}
      
      <Row gutter={[16, 0]}>
        <Col span={11}>
          <Text strong>Column A</Text>
          {data?.leftColumn.map(item => {
            const matchedRight = getCurrentRightMatch(item.id);
            const isSelected = isLeftSelected(item.id);
            
            return (
              <Card 
                key={item.id}
                size="small"
                style={{ 
                  marginTop: 8,
                  cursor: isPreview ? 'default' : 'pointer',
                  borderColor: isSelected ? '#1890ff' : 
                               (matchedRight && isCorrectMatch(item.id, matchedRight)) ? '#52c41a' : undefined,
                  background: isSelected ? '#e6f7ff' : 
                               (matchedRight && isCorrectMatch(item.id, matchedRight)) ? '#f6ffed' : undefined
                }}
                onClick={() => !isPreview && handleLeftSelect(item.id)}
              >
                <Text>{item.text}</Text>
              </Card>
            );
          })}
        </Col>
        
        <Col span={2} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {Object.entries(userMatches).map(([leftId, rightId]) => {
            const leftItem = data?.leftColumn.find(item => item.id === leftId);
            const rightItem = data?.rightColumn.find(item => item.id === rightId);
            
            if (!leftItem || !rightItem) return null;
            
            const leftIndex = data?.leftColumn.findIndex(item => item.id === leftId);
            const rightIndex = data?.rightColumn.findIndex(item => item.id === rightId);
            
            const isCorrect = isCorrectMatch(leftId, rightId);
            
            return (
              <div 
                key={`${leftId}-${rightId}`}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '2px',
                  background: isCorrect ? '#52c41a' : '#f5222d',
                  top: `${(leftIndex + 0.5) * (48 + 8) + 30}px`,
                  zIndex: 1
                }}
              />
            );
          })}
        </Col>
        
        <Col span={11}>
          <Text strong>Column B</Text>
          {data?.rightColumn.map(item => {
            const isUsed = isRightUsed(item.id);
            
            return (
              <Card 
                key={item.id}
                size="small"
                style={{ 
                  marginTop: 8,
                  cursor: isPreview || isUsed || !selectedLeft ? 'default' : 'pointer',
                  opacity: isUsed && !isPreview ? 0.5 : 1,
                  borderColor: isUsed ? '#d9d9d9' : undefined
                }}
                onClick={() => !isPreview && !isUsed && selectedLeft && handleRightSelect(item.id)}
              >
                <Text>{item.text}</Text>
              </Card>
            );
          })}
        </Col>
      </Row>
      
      {isPreview && data?.correctMatches && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Correct Matches:</Text>
          <ul>
            {data.correctMatches.map(match => {
              const leftItem = data.leftColumn.find(item => item.id === match.left);
              const rightItem = data.rightColumn.find(item => item.id === match.right);
              
              if (!leftItem || !rightItem) return null;
              
              return (
                <li key={`${match.left}-${match.right}`}>
                  <Text>{leftItem.text} → {rightItem.text}</Text>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MatchingTextQuestion;