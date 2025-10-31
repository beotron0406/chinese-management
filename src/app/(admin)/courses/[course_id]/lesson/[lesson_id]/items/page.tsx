"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuestionType } from "@/enums/question-type.enum";
import { ContentType } from "@/enums/content-type.enum";
import { Button, Card, Typography, Tag, Spin, Alert } from "antd";
import {
  PlusOutlined,
  BookOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import ItemList from "@/components/question/ItemList";
import ItemModal from "@/components/items/ItemModal";
import { lessonApi } from "@/services/lessonApi";
import { Lesson } from "@/types/lessonTypes";
import { useLessonCache } from "@/context/LessonCacheContext";

const { Title, Text, Paragraph } = Typography;

export default function ItemsPage() {
  const searchParams = useSearchParams();
  const courseId = parseInt(searchParams.get("courseId") || "1");
  const router = useRouter();
  const { getCachedLesson, setCachedLesson } = useLessonCache();

  const [lessonId, setLessonId] = useState<number>(1);

  // Handle lessonId from URL params or localStorage
  useEffect(() => {
    const urlLessonId = searchParams.get("lessonId");

    if (urlLessonId) {
      const parsedLessonId = parseInt(urlLessonId);
      setLessonId(parsedLessonId);
      // Save to localStorage for persistence
      localStorage.setItem('currentLessonId', urlLessonId);
    } else {
      // Fallback to localStorage if URL param is missing
      const storedLessonId = localStorage.getItem('currentLessonId');
      if (storedLessonId) {
        const parsedStoredId = parseInt(storedLessonId);
        setLessonId(parsedStoredId);
        // Update URL to include the lessonId
        router.replace(`/courses/${courseId}/lesson/${parsedStoredId}/items`);
      }
    }
  }, [searchParams, router]);

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshItems, setRefreshItems] = useState(0);

  // Fetch lesson data - only if not already cached
  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) return;

      // Check cache first
      const cachedLessonData = getCachedLesson(lessonId);
      if (cachedLessonData) {
        console.log("📋 Using cached lesson data for lessonId:", lessonId);
        setLesson(cachedLessonData);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("🌐 Fetching lesson data for lessonId:", lessonId);
        const lessonData = await lessonApi.getLesson(lessonId);
        setLesson(lessonData);
        setCachedLesson(lessonData); // Cache the lesson data
        console.log("✅ Lesson data fetched and cached");
      } catch (err) {
        console.error("❌ Failed to fetch lesson:", err);
        setError("Failed to load lesson data");
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId, getCachedLesson, setCachedLesson]);

  const handleCreateItem = () => {
    setModalMode('create');
    setEditingItem(null);
    setIsModalVisible(true);
  };

  const handleEditItem = (item: any) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingItem(null);
  };

  const handleModalSuccess = () => {
    setIsModalVisible(false);
    setEditingItem(null);
    // Trigger ItemList refresh
    setRefreshItems(prev => prev + 1);
  };

  const handleBackToLessons = () => {
    if (lesson && lesson.course?.id) {
      router.push(`/courses/${lesson.course.id}/lesson`);
    } else {
      router.push("/courses");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Lesson"
        description={error}
        type="error"
        showIcon
        style={{ margin: "20px" }}
      />
    );
  }

  return (
    <div
      style={{ display: "flex", height: "100vh", gap: "16px", padding: "16px" }}
    >
      {/* Left Panel - Lesson Info (20%) */}
      <div style={{ flex: "0 0 300px" }}>
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BookOutlined />
              <span>Lesson Info</span>
            </div>
          }
          bordered={true}
          style={{ height: "fit-content" }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToLessons}
            style={{ marginBottom: "16px", width: "100%" }}
          >
            Back to Lessons
          </Button>

          {lesson && (
            <>
              <Title level={4} style={{ marginTop: 0 }}>
                {lesson.name}
              </Title>

              <Paragraph type="secondary" style={{ marginBottom: "16px" }}>
                {lesson.description || "No description available"}
              </Paragraph>

              <div style={{ marginBottom: "12px" }}>
                <Text strong>Course: </Text>
                <Text>{lesson.course?.title || "Unknown Course"}</Text>
              </div>

              {lesson.course?.hskLevel && (
                <div style={{ marginBottom: "12px" }}>
                  <Text strong>HSK Level: </Text>
                  <Tag color="blue">HSK {lesson.course.hskLevel}</Tag>
                </div>
              )}

              <div style={{ marginBottom: "12px" }}>
                <Text strong>Lesson Order: </Text>
                <Text>{lesson.orderIndex}</Text>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <Text strong>Status: </Text>
                <Tag color={lesson.isActive ? "green" : "red"}>
                  {lesson.isActive ? "Active" : "Inactive"}
                </Tag>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Right Panel - Items Management (80%) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            Items Management
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateItem}
            size="large"
          >
            Add Item
          </Button>
        </div>

        {/* Item List Component */}     
        <div style={{ flex: 1, overflow: "auto" }}>
          <ItemList 
            lessonId={lessonId} 
            onEditItem={handleEditItem}
          />
        </div>
      </div>

      {/* Item Modal for Create/Edit */}
      <ItemModal
        visible={isModalVisible}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
        courseId={courseId.toString()}
        lessonId={lessonId.toString()}
        editItem={editingItem}
        mode={modalMode}
      />
    </div>
  );
}