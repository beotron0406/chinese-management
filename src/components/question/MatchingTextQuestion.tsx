import React, { useState } from 'react';
import { Typography, Row, Col, Card, Button, Space } from 'antd';
import { Question, MatchingTextQuestionData } from '@/types/questionType';

const { Text, Paragraph } = Typography;

interface MatchingTextQuestionProps {
  question: Question;
  isPreview?: boolean;
}

const MatchingTextQuestion: React.FC<MatchingTextQuestionProps> = ({ 
  question, 
  isPreview = false 
}) => {
  const data = question.data as MatchingTextQuestionData;
  const [userMatches, setUserMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  
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
    if (!isPreview) return false;
    
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
    const correctMatches: Record<string, string> = {};
    data.correctMatches.forEach(match => {
      correctMatches[match.left] = match.right;
    });
    setUserMatches(correctMatches);
  };

  return (
    <div>
      <Paragraph>{data.instruction}</Paragraph>
      
      {!isPreview && (
        <Space style={{ marginBottom: 16 }}>
          <Button onClick={resetMatches} size="small">Reset Matches</Button>
          <Button onClick={showCorrectAnswers} size="small">Show Correct Answers</Button>
        </Space>
      )}
      
      <Row gutter={[16, 0]}>
        <Col span={11}>
          <Text strong>Column A</Text>
          {data.leftColumn.map(item => {
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
            const leftItem = data.leftColumn.find(item => item.id === leftId);
            const rightItem = data.rightColumn.find(item => item.id === rightId);
            
            if (!leftItem || !rightItem) return null;
            
            const leftIndex = data.leftColumn.findIndex(item => item.id === leftId);
            const rightIndex = data.rightColumn.findIndex(item => item.id === rightId);
            
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
          {data.rightColumn.map(item => {
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
      
      {isPreview && (
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