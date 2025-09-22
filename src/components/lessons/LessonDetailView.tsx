import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Tabs, Divider, Empty, message, Spin } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { Lesson, LessonContent } from '../../types/lessonTypes';
import { lessonApi } from '../../services/lessonApi';
import CardFormModal from './CardFormModal';
import LessonFormModal from './LessonFormModal';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface LessonDetailViewProps {
  lessonId: number;
}

const LessonDetailView: React.FC<LessonDetailViewProps> = ({ lessonId }) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [contents, setContents] = useState<LessonContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<LessonContent | null>(null);
  const [lessonModalVisible, setLessonModalVisible] = useState(false);

  const fetchLessonData = async () => {
    setLoading(true);
    try {
      const response = await lessonApi.getLessonWithContent(lessonId);
      // Type assertion to match the expected return type
      const lessonData = response as {
        lesson: Lesson;
        content: LessonContent[];
        questions: any[];
      };
      setLesson(lessonData.lesson);
      setContents(lessonData.content || []);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      message.error('Failed to load lesson data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lessonId) {
      fetchLessonData();
    }
  }, [lessonId]);

  const handleAddCard = () => {
    setEditingCard(null);
    setCardModalVisible(true);
  };

  const handleEditCard = (card: LessonContent) => {
    setEditingCard(card);
    setCardModalVisible(true);
  };

  const handleEditLesson = () => {
    setLessonModalVisible(true);
  };

  const handleCardModalClose = (refresh: boolean) => {
    setCardModalVisible(false);
    if (refresh) {
      fetchLessonData();
    }
  };

  const handleLessonModalClose = (refresh: boolean) => {
    setLessonModalVisible(false);
    if (refresh) {
      fetchLessonData();
    }
  };

  const renderContent = (content: LessonContent) => {
    switch (content.type) {
      case 'text':
        return (
          <Card 
            title={content.data.title}
            extra={<Button type="text" icon={<EditOutlined />} onClick={() => handleEditCard(content)} />}
            style={{ marginBottom: 16 }}
          >
            <Text>{content.data.content}</Text>
            {content.data.mediaUrl && (
              <div style={{ marginTop: 16 }}>
                <audio src={content.data.mediaUrl} controls />
              </div>
            )}
          </Card>
        );
      case 'vocabulary':
      case 'grammar':
      case 'exercise':
        return (
          <Card 
            title={`${content.type.charAt(0).toUpperCase() + content.type.slice(1)} Card`}
            extra={<Button type="text" icon={<EditOutlined />} onClick={() => handleEditCard(content)} />}
            style={{ marginBottom: 16 }}
          >
            <pre>{JSON.stringify(content.data, null, 2)}</pre>
          </Card>
        );
      case 'divider':
        return <Divider orientation="left">{content.data.title || 'Section Divider'}</Divider>;
      default:
        return <Empty description="Unknown content type" />;
    }
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (!lesson) {
    return <Empty description="Lesson not found" />;
  }

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={2}>{lesson.name}</Title> {/* Changed from title to name */}
            <Text type="secondary">Course ID: {lesson.courseId} | Order: {lesson.orderIndex}</Text>
            <p>{lesson.description}</p>
          </div>
          <Button type="primary" icon={<EditOutlined />} onClick={handleEditLesson}>
            Edit Lesson
          </Button>
        </div>
      </Card>

      <Divider />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3}>Lesson Content</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCard}>
          Add Content Card
        </Button>
      </div>

      <Tabs defaultActiveKey="content">
        <TabPane tab="Lesson Content" key="content">
          {contents.length > 0 ? (
            contents.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)).map(content => (
              <div key={content.id}>
                {renderContent(content)}
              </div>
            ))
          ) : (
            <Empty description="No content yet. Click 'Add Content Card' to start building your lesson." />
          )}
        </TabPane>
      </Tabs>

      <CardFormModal
        visible={cardModalVisible}
        onClose={handleCardModalClose}
        card={editingCard}
        lessonId={lessonId}
      />

      <LessonFormModal
        visible={lessonModalVisible}
        onClose={handleLessonModalClose}
        lesson={lesson}
      />
    </div>
  );
};

export default LessonDetailView;