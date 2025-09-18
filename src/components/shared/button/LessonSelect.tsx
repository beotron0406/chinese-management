import React, { useState, useEffect } from 'react';
import { Select, Spin, Typography } from 'antd';
import { lessonApi } from '../../../services/lessonApi';

const { Option } = Select;
const { Text } = Typography;

export interface ILessonByCourse {
  id: number;
  name: string;
}

interface LessonSelectProps {
  courseId?: number;
  value?: number;
  onChange?: (lessonId: number) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const LessonSelect: React.FC<LessonSelectProps> = ({
  courseId,
  value,
  onChange,
  placeholder = 'Select a lesson',
  disabled = false,
  style,
}) => {
  const [lessons, setLessons] = useState<ILessonByCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const fetchLessons = async () => {
    console.log('CourseId changed to:', courseId);
    
    if (!courseId) {
      setLessons([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching lessons for courseId:', courseId);
      const lessonData = await lessonApi.getLessonsByCourse(courseId);
      console.log('API response data:', lessonData);
      
      // Since we know our API returns an array of lessons directly,
      // simplify the processing logic
      if (Array.isArray(lessonData)) {
        const simpleLessons = lessonData.map(lesson => ({
          id: lesson.id,
          name: lesson.name
        }));
        
        console.log('Processed lessons:', simpleLessons);
        setLessons(simpleLessons);
      } else {
        console.log('Unexpected response format:', lessonData);
        setLessons([]);
      }
    } catch (err) {
      console.error('Failed to fetch lessons:', err);
      setError('Failed to load lessons. Please try again.');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  fetchLessons();
}, [courseId]);
  
  useEffect(() => {
    console.log('Current lessons state:', lessons);
  }, [lessons]);

  return (
    <div>
      <Select
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ width: '100%', ...style }}
        disabled={disabled || loading}
        loading={loading}
        showSearch
        optionFilterProp="children"
        filterOption={(input, option) =>
          String(option?.children)
            .toLowerCase()
            .includes(input.toLowerCase())
        }
        notFoundContent={loading ? <Spin size="small" /> : null}
      >
        {lessons.length > 0 ? (
          lessons.map((lesson) => (
            <Option key={lesson.id} value={lesson.id}>
              {lesson.name}
            </Option>
          ))
        ) : (
          <Option disabled>No lessons available</Option>
        )}
      </Select>
      
      {error && (
        <Text type="danger" style={{ display: 'block', marginTop: 4 }}>
          {error}
        </Text>
      )}
    </div>
  );
};

export default LessonSelect;