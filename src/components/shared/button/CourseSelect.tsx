import React, { useEffect, useState } from 'react';
import { Select, Spin, Empty, message } from 'antd';
import { courseService } from '../../../services/api';
import { Course } from '../../../types';

interface CourseSelectProps {
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
}

const CourseSelect: React.FC<CourseSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Select a course",
  style,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        // Use the getCourses function from your courseService
        const response = await courseService.getCourses(1, 100);
        
        console.log('Course response:', response);
        
        // Handle the exact format you provided
        if (response && typeof response === 'object' && 'courses' in response) {
          setCourses((response.courses as Course[]) || []);
        } else {
          console.error('Unexpected response format:', response);
          message.error('Failed to load courses');
          setCourses([]);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        message.error('Failed to load courses');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleChange = (newValue: number) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      disabled={disabled}
      loading={loading}
      placeholder={placeholder}
      style={{ width: '100%', ...style }}
      optionFilterProp="children"
      showSearch
      notFoundContent={loading ? <Spin size="small" /> : <Empty description="No courses found" />}
    >
      {courses.map(course => (
        <Select.Option key={course.id} value={course.id}>
          {course.title || `Course ${course.id}`} {course.hskLevel ? `(HSK ${course.hskLevel})` : ''}
        </Select.Option>
      ))}
    </Select>
  );
};

export default CourseSelect;