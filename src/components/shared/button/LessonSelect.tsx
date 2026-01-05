import React, { useState, useEffect } from "react";
import { Select, Spin, Typography } from "antd";
import { lessonApi } from "../../../services/lessonApi";

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
  className?: string;
  onLessonsLoaded?: (lessons: ILessonByCourse[]) => void;
}

const LessonSelect: React.FC<LessonSelectProps> = ({
  courseId,
  value,
  onChange,
  placeholder = "Chọn bài học",
  disabled = false,
  className,
  onLessonsLoaded,
}) => {
  const [lessons, setLessons] = useState<ILessonByCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!courseId) {
        setLessons([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const lessonData = await lessonApi.getLessonsByCourse(courseId);

        // Since we know our API returns an array of lessons directly,
        // simplify the processing logic
        if (Array.isArray(lessonData)) {
          const simpleLessons = lessonData.map((lesson) => ({
            id: lesson.id,
            name: lesson.name,
          }));

          setLessons(simpleLessons);

          // Notify parent about loaded lessons
          if (onLessonsLoaded) {
            onLessonsLoaded(simpleLessons);
          }
        } else {
          setLessons([]);
        }
      } catch (err) {
        console.error("Failed to fetch lessons:", err);
        setError("Failed to load lessons. Please try again.");
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [courseId]);

  return (
    <div>
      <Select
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${className || ''}`}
        disabled={disabled || loading}
        loading={loading}
        showSearch
        optionFilterProp="children"
        filterOption={(input, option) =>
          String(option?.children).toLowerCase().includes(input.toLowerCase())
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
        <Text type="danger" className="block mt-1">
          {error}
        </Text>
      )}
    </div>
  );
};

export default LessonSelect;
