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
  Modal,
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
  ExclamationCircleOutlined,
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
  const [pageSize, setPageSize] = useState(12);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [filterHskLevel, setFilterHskLevel] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await courseService.getCourses(1, 100);
      if (data && data.courses) {
        setAllCourses(data.courses);
        setTotalItems(data.pagination?.total || 0);
      } else {
        setAllCourses([]);
        setTotalItems(0);
      }
    } catch (error) {
      message.error("Có lỗi khi tải danh sách khóa học");
      setAllCourses([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (courses: Course[]) => {
    let filtered = [...courses];

    if (filterHskLevel !== null) {
      filtered = filtered.filter(
        (course) => course.hskLevel === filterHskLevel
      );
    }

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchLower) ||
          (course.description &&
            course.description.toLowerCase().includes(searchLower))
      );
    }

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
      message.success("Xóa khóa học thành công");
      fetchCourses();
    } catch (error) {
      message.error("Có lỗi khi xóa khóa học");
      console.error(error);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await courseService.restoreCourse(id);
      message.success("Khôi phục khóa học thành công");
      fetchCourses();
    } catch (error) {
      message.error("Có lỗi khi khôi phục khóa học");
      console.error(error);
    }
  };

  const handleHardDelete = async (id: number) => {
    Modal.confirm({
      title: "Xóa khóa học",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa khóa học này?</p>
          <p className="text-red-500 font-bold">
            Hành động này KHÔNG THỂ HOÀN TÁC!
          </p>
        </div>
      ),
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await courseService.hardDeleteCourse(id);
          message.success("Xóa khóa học thành công");
          fetchCourses();
        } catch (error) {
          message.error("Có lỗi khi xóa khóa học");
          console.error(error);
        }
      },
    });
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingCourse(null);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingCourse) {
        await courseService.updateCourse(editingCourse.id, values);
        message.success("Cập nhật khóa học thành công");
      } else {
        await courseService.createCourse(values);
        message.success("Tạo khóa học thành công");
      }
      setIsModalVisible(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      message.error("Có lỗi khi lưu khóa học");
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

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  const CourseCard = ({ course }: { course: Course }) => (
    <Card
      hoverable={course.isActive}
      className={`course-card h-full flex flex-col ${
        course.isActive
          ? "cursor-pointer border border-gray-300"
          : "cursor-not-allowed border border-red-400 opacity-75"
      }`}
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          flex: 1,
        },
      }}
      onClick={() => course.isActive && handleCourseClick(course)}
      cover={
        <div
          className={`p-5 text-center ${
            course.isActive
              ? "bg-gradient-to-br from-blue-500/10 to-green-500/15"
              : "bg-gradient-to-br from-red-400/10 to-red-300/15"
          }`}
        >
          <BookOutlined
            className={`text-3xl ${
              course.isActive ? "text-blue-500" : "text-red-400"
            }`}
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
          Sửa
        </Button>,
        course.isActive ? (
          <Popconfirm
            key="delete"
            title="Vô hiệu hóa khóa học này?"
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDelete(course.id);
            }}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            >
              Vô hiệu hóa
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
            Khôi phục
          </Button>
        ),
        !course.isActive && (
          <Button
            key="hardDelete"
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleHardDelete(course.id);
            }}
          >
            Xóa
          </Button>
        ),
      ].filter(Boolean)}
    >
      {/* 👇 Nội dung chiếm toàn bộ chiều cao còn lại */}
      <div className="flex-1">
        <Card.Meta
          title={
            <div>
              <Text strong className="text-base">
                {course.title}
              </Text>
              <div className="float-right">
                <Tag color={course.isActive ? "green" : "red"}>
                  {course.isActive ? (
                    <CheckCircleOutlined />
                  ) : (
                    <CloseCircleOutlined />
                  )}
                  {course.isActive ? " Hoạt động" : " Không hoạt động"}
                </Tag>
              </div>
            </div>
          }
          description={
            <div>
              <div className="mb-2">
                <Tag color="blue">HSK {course.hskLevel}</Tag>
                <Tag color="purple">Order: {course.orderIndex}</Tag>
              </div>

              <Text type="secondary" className="text-sm">
                {course.description && course.description.length > 80
                  ? `${course.description.substring(0, 80)}...`
                  : course.description || "Chưa có mô tả"}
              </Text>

              <div className="mt-2">
                <Space>
                  <Text type="secondary" className="text-xs">
                    <CalendarOutlined />{" "}
                    {new Date(course.createdAt).toLocaleDateString()}
                  </Text>
                </Space>
              </div>

              <div
                className={`mt-2 text-xs ${
                  course.isActive ? "text-blue-500" : "text-red-400"
                }`}
              >
                {course.isActive
                  ? "Nhấn vào để quản lý bài học"
                  : "Khóa học đã bị vô hiệu hóa"}
              </div>
            </div>
          }
        />
      </div>
    </Card>
  );

  return (
    <div>
      {/* Filters Section */}
      <Card className="mb-5">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex gap-4 items-center flex-wrap">
            <Input
              placeholder="Tìm kiếm khóa học"
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-[250px]"
              prefix={<SearchOutlined />}
              allowClear
            />

            <Select
              placeholder="Lọc theo cấp độ HSK"
              className="w-[180px]"
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
                Xóa bộ lọc
              </Button>
            )}
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setIsModalVisible(true)}
          >
            Tạo khóa học mới
          </Button>
        </div>
      </Card>

      {/* Courses Grid */}
      <div className="min-h-[400px]">
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
            className="mt-16"
          >
            {!searchText && !filterHskLevel && (
              <Button type="primary" onClick={() => setIsModalVisible(true)}>
                Tạo khóa học đầu tiên
              </Button>
            )}
          </Empty>
        )}
      </div>

      {/* Pagination */}
      {paginatedCourses.length > 0 && (
        <div className="mt-8 text-center">
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
    </div>
  );
};

export default CourseList;
