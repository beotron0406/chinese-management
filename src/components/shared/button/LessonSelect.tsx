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
        const response = await lessonApi.getLessonsByCourse(courseId);
        console.log('API raw response:', response);
        
        // Determine response type and extract data
        let extractedData: any[] = [];
        
        if (Array.isArray(response)) {
          console.log('Response is an array with length:', response.length);
          extractedData = response;
        } else if (response && typeof response === 'object') {
          console.log('Response is an object:', response);
          
          // Use type assertion to tell TypeScript this is an object with potential properties
          const responseObj = response as Record<string, any>;
          
          if ('data' in responseObj) {
            extractedData = responseObj.data;
            console.log('Extracted data from response.data:', extractedData);
          } else if ('items' in responseObj) {
            extractedData = responseObj.items;
            console.log('Extracted data from response.items:', extractedData);
          } else if ('lessons' in responseObj) {
            extractedData = responseObj.lessons;
            console.log('Extracted data from response.lessons:', extractedData);
          } else {
            console.log('Unknown response structure, keys:', Object.keys(responseObj));
          }
        }
        
        // Ensure extractedData is an array
        if (!Array.isArray(extractedData)) {
          console.log('ExtractedData is not an array:', extractedData);
          extractedData = [];
        }
        
        // Map to simple lesson objects
        const simpleLessons = extractedData.map(lesson => ({
          id: lesson.id,
          name: lesson.name
        }));
        
        console.log('Processed lessons:', simpleLessons);
        setLessons(simpleLessons);
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