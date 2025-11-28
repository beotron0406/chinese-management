"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Space,
  message,
  Popconfirm,
  Tag,
  Card,
  Input,
  Select,
  Pagination,
  Typography,
  Badge,
  Row,
  Col,
  Empty,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UndoOutlined,
  PlusOutlined,
  SearchOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { courseService } from "@/services/api";
import { Course } from "@/types";
import CourseFormModal from "@/components/courses/CourseFormModal";

const { Text, Title } = Typography;
const { Option } = Select;

interface CourseListProps {
  filterActive?: boolean;
}

const CourseList = ({ filterActive }: CourseListProps) => {
  const router = useRouter();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // 12 cards per page
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [filterHskLevel, setFilterHskLevel] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");

  const fetchCourses = async () => {
    setLoading(true);
    try {
      console.log("📡 Fetching courses with getCourses API...");
      const data = await courseService.getCourses(1, 100); // Load all courses

      console.log("📦 Received data:", data);

      // 🔧 FIX: Handle correct response structure
      if (data && data.courses) {
        // Đổi từ data.items thành data.courses
        setAllCourses(data.courses); // Đổi từ data.items thành data.courses
        setTotalItems(data.pagination?.total || 0); // Đổi từ data.total thành data.pagination.total
        console.log("✅ Courses loaded successfully:", data.courses.length);
      } else {
        console.error("❌ Invalid data format received:", data);
        setAllCourses([]);
        setTotalItems(0);
      }
    } catch (error) {
      message.error("Failed to fetch courses");
      console.error("❌ Error fetching courses:", error);
      setAllCourses([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (courses: Course[]) => {
    let filtered = [...courses];

    // Apply HSK level filter
    if (filterHskLevel !== null) {
      filtered = filtered.filter(
        (course) => course.hskLevel === filterHskLevel
      );
    }

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchLower) ||
          (course.description &&
            course.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply active filter if specified
    if (filterActive !== undefined) {
      filtered = filtered.filter((course) => course.isActive === filterActive);
    }

    setFilteredCourses(filtered);
  };

  useEffect(() => {
    fetchCourses();
  }, [currentPage, pageSize]);

  useEffect(() => {
    applyFilters(allCourses);
  }, [filterHskLevel, searchText, allCourses, filterActive]);

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await courseService.deleteCourse(id);
      message.success("Course deleted successfully");
      fetchCourses();
    } catch (error) {
      message.error("Failed to delete course");
      console.error(error);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await courseService.restoreCourse(id);
      message.success("Course restored successfully");
      fetchCourses();
    } catch (error) {
      message.error("Failed to restore course");
      console.error(error);
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingCourse(null);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingCourse) {
        await courseService.updateCourse(editingCourse.id, values);
        message.success("Course updated successfully");
      } else {
        await courseService.createCourse(values);
        message.success("Course created successfully");
      }
      setIsModalVisible(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      message.error("Failed to save course");
      console.error(error);
    }
  };

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) setPageSize(size);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleHskFilterChange = (value: number | null) => {
    setFilterHskLevel(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilterHskLevel(null);
    setSearchText("");
    setCurrentPage(1);
  };

  const handleCourseClick = (course: Course) => {
    router.push(`/courses/${course.id}/lesson`);
  };

  // Calculate pagination for filtered results
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  const CourseCard = ({ course }: { course: Course }) => (
    <Card
      hoverable
      className="course-card"
      style={{
        height: "100%",
        cursor: "pointer",
        border: course.isActive ? "1px solid #d9d9d9" : "1px solid #ff7875",
      }}
      onClick={() => handleCourseClick(course)}
      cover={
        <div
          style={{
            background: `linear-gradient(135deg, ${
              course.isActive ? "#1890ff" : "#ff7875"
            }15, ${course.isActive ? "#52c41a" : "#ffa39e"}25)`,
            padding: "20px",
            textAlign: "center",
          }}
        >
          <BookOutlined
            style={{
              fontSize: "32px",
              color: course.isActive ? "#1890ff" : "#ff7875",
            }}
          />
        </div>
      }
      actions={[
        <Button
          key="edit"
          type="link"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(course);
          }}
        >
          Edit
        </Button>,
        course.isActive ? (
          <Popconfirm
            key="delete"
            title="Deactivate this course?"
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDelete(course.id);
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            >
              Deactivate
            </Button>
          </Popconfirm>
        ) : (
          <Button
            key="restore"
            type="link"
            icon={<UndoOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleRestore(course.id);
            }}
          >
            Restore
          </Button>
        ),
      ]}
    >
      <Card.Meta
        title={
          <div>
            <Text strong style={{ fontSize: "16px" }}>
              {course.title}
            </Text>
            <div style={{ float: "right" }}>
              <Tag color={course.isActive ? "green" : "red"}>
                {course.isActive ? (
                  <CheckCircleOutlined />
                ) : (
                  <CloseCircleOutlined />
                )}
                {course.isActive ? "Active" : "Inactive"}
              </Tag>
            </div>
          </div>
        }
        description={
          <div>
            <div style={{ marginBottom: "8px" }}>
              <Tag color="blue">HSK {course.hskLevel}</Tag>
              <Tag color="purple">Order: {course.orderIndex}</Tag>
            </div>
            <Text type="secondary" style={{ fontSize: "13px" }}>
              {course.description && course.description.length > 80
                ? `${course.description.substring(0, 80)}...`
                : course.description || "No description"}
            </Text>
            <div style={{ marginTop: "8px" }}>
              <Space>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  <BookOutlined /> {course.totalLessons || 0} lessons
                </Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  <CalendarOutlined />{" "}
                  {new Date(course.createdAt).toLocaleDateString()}
                </Text>
              </Space>
            </div>
            <div
              style={{ marginTop: "8px", color: "#1890ff", fontSize: "12px" }}
            >
              Click to view lessons →
            </div>
          </div>
        }
      />
    </Card>
  );

  return (
    <div>
      {/* Header Section */}
      <Card style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Course Management
            </Title>
            <Text type="secondary">
              {filteredCourses.length !== allCourses.length && (
                <>
                  Showing {filteredCourses.length} of {allCourses.length}{" "}
                  courses
                </>
              )}
              {filteredCourses.length === allCourses.length && (
                <>Total {allCourses.length} courses</>
              )}
            </Text>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setIsModalVisible(true)}
          >
            Add New Course
          </Button>
        </div>
      </Card>

      {/* Filters Section */}
      <Card style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Input
            placeholder="Search courses..."
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
            allowClear
          />

          <Select
            placeholder="Filter by HSK Level"
            style={{ width: 180 }}
            allowClear
            value={filterHskLevel}
            onChange={handleHskFilterChange}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
              <Option key={level} value={level}>
                HSK {level}
              </Option>
            ))}
          </Select>

          {(filterHskLevel !== null || searchText) && (
            <Button onClick={clearFilters} size="middle">
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Courses Grid */}
      <div style={{ minHeight: "400px" }}>
        {loading ? (
          <Row gutter={[16, 16]}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Col xs={24} sm={12} md={8} lg={6} xl={6} key={index}>
                <Card loading />
              </Col>
            ))}
          </Row>
        ) : paginatedCourses.length > 0 ? (
          <Row gutter={[16, 16]}>
            {paginatedCourses.map((course) => (
              <Col xs={24} sm={12} md={8} lg={6} xl={6} key={course.id}>
                <CourseCard course={course} />
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            description={
              searchText || filterHskLevel
                ? "No courses match your filters"
                : "No courses available"
            }
            style={{ marginTop: "60px" }}
          >
            {!searchText && !filterHskLevel && (
              <Button type="primary" onClick={() => setIsModalVisible(true)}>
                Create First Course
              </Button>
            )}
          </Empty>
        )}
      </div>

      {/* Pagination */}
      {paginatedCourses.length > 0 && (
        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredCourses.length}
            onChange={handlePageChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} courses`
            }
            pageSizeOptions={["6", "12", "18", "24"]}
          />
        </div>
      )}

      {/* Course Form Modal */}
      <CourseFormModal
        visible={isModalVisible}
        onCancel={handleCloseModal}
        onSave={handleSave}
        initialValues={editingCourse}
      />

      <style jsx global>{`
        .course-card .ant-card-cover {
          border-bottom: 1px solid #f0f0f0;
        }

        .course-card .ant-card-actions {
          background: #fafafa;
        }

        .course-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          transition: all 0.3s ease;
        }

        .course-card .ant-card-actions > li {
          margin: 4px 0;
        }

        .course-card .ant-card-actions > li > span {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default CourseList;
