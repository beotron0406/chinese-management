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
  allowClear?: boolean;
  showOnlyActive?: boolean;
  excludeCourseId?: number;
  onCoursesLoaded?: (courses: Course[]) => void;
}

const CourseSelect: React.FC<CourseSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Chọn khóa học",
  style,
  allowClear = false,
  showOnlyActive = true,
  excludeCourseId,
  onCoursesLoaded,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const response = await courseService.getCourses(1, 100);
        
        if (response && response.courses) {
          let filteredCourses = response.courses;
          
          // Filter only active courses if specified
          if (showOnlyActive) {
            filteredCourses = filteredCourses.filter(course => course.isActive);
          }
          
          // Exclude specific course if specified (useful for prerequisite selection)
          if (excludeCourseId) {
            filteredCourses = filteredCourses.filter(course => course.id !== excludeCourseId);
          }
          
          // Sort by orderIndex and then by title
          filteredCourses.sort((a, b) => {
            if (a.orderIndex !== b.orderIndex) {
              return a.orderIndex - b.orderIndex;
            }
            return a.title.localeCompare(b.title);
          });
          
          setCourses(filteredCourses);
          
          // Notify parent about loaded courses
          if (onCoursesLoaded) {
            onCoursesLoaded(filteredCourses);
          }
        } else {
          console.error('Unexpected response format:', response);
          message.error('Không thể tải danh sách khóa học');
          setCourses([]);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        message.error('Không thể tải danh sách khóa học');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [showOnlyActive, excludeCourseId]);

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
      allowClear={allowClear}
      notFoundContent={loading ? <Spin size="small" /> : <Empty description="Không tìm thấy khóa học" />}
      filterOption={(input, option) =>
        (option?.children?.toString().toLowerCase() ?? '').includes(input.toLowerCase())
      }
    >
      {courses.map(course => (
        <Select.Option key={course.id} value={course.id}>
          {course.title} {course.hskLevel ? `(HSK ${course.hskLevel})` : ''}
        </Select.Option>
      ))}
    </Select>
  );
};

export default CourseSelect;