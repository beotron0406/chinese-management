# Sequence Diagram: Xem phân tích theo khóa học (Course Analytics)

## Use Case: Xem phân tích theo khóa học

### Mô tả
Admin truy cập trang Dashboard, chọn tab "Phân tích khóa học", chọn một khóa học từ dropdown để xem thống kê chi tiết bao gồm: tổng bài học, số người bắt đầu/hoàn thành, tỷ lệ hoàn thành, và thống kê từng bài học.

### Sequence Diagram

```mermaid
sequenceDiagram
    actor Admin as Quản trị viên
    participant DashboardPage as dashboard/page.tsx
    participant CourseAnalyticsCard as CourseAnalyticsCard.tsx
    participant CourseSelect as CourseSelect.tsx
    participant UserProgressApi as userprogressApi.ts
    participant Api as api.ts
    participant CourseController as courses.controller.ts
    participant CourseService as courses.service.ts
    participant AdminController as admin-progress.controller.ts
    participant AdminService as admin-progress.service.ts
    participant CourseEntity as courses
    participant LessonEntity as lessons
    participant ProgressEntity as user_lesson_progress

    Note over Admin,DashboardPage: Tiền điều kiện: Admin đã đăng nhập và ở trang Dashboard

    %% ===== PHẦN 1: TẢI DANH SÁCH KHÓA HỌC =====
    rect rgb(230, 245, 255)
    Note over Admin,CourseEntity: PHẦN 1: Tải danh sách khóa học để chọn
    
    Admin->>DashboardPage: 1: chọn tab "Phân tích khóa học"
    DashboardPage->>CourseAnalyticsCard: 2: render CourseAnalyticsCard component
    CourseAnalyticsCard->>CourseSelect: 3: render CourseSelect component
    CourseSelect->>CourseSelect: 4: useEffect()
    CourseSelect->>CourseSelect: 5: fetchCourses()
    CourseSelect->>Api: 6: courseService.getCourses()
    Api->>CourseController: 7: GET /courses
    CourseController->>CourseService: 8: findAll()
    CourseService->>CourseEntity: 9: query courses
    CourseEntity-->>CourseService: 10: trả về danh sách courses
    CourseService-->>CourseController: 11: trả về {courses, total}
    CourseController-->>Api: 12: trả về
    Api-->>CourseSelect: 13: trả về response
    CourseSelect->>CourseSelect: 14: setCourses()
    CourseSelect->>CourseAnalyticsCard: 15: onCoursesLoaded()
    CourseAnalyticsCard->>CourseAnalyticsCard: 16: handleCoursesLoaded()
    CourseAnalyticsCard->>CourseAnalyticsCard: 17: setSelectedCourseId(courses[0].id)
    CourseSelect-->>Admin: 18: hiển thị dropdown với danh sách khóa học
    end

    %% ===== PHẦN 2: TẢI PHÂN TÍCH KHÓA HỌC =====
    rect rgb(255, 245, 230)
    Note over Admin,ProgressEntity: PHẦN 2: Tải phân tích chi tiết khóa học đã chọn
    
    CourseAnalyticsCard->>CourseAnalyticsCard: 19: useEffect() triggered (selectedCourseId changed)
    CourseAnalyticsCard->>CourseAnalyticsCard: 20: fetchCourseAnalytics()
    CourseAnalyticsCard->>CourseAnalyticsCard: 21: setLoading(true)
    CourseAnalyticsCard->>UserProgressApi: 22: adminProgressApi.getCourseAnalytics()
    UserProgressApi->>Api: 23: api.get()
    Api->>AdminController: 24: GET /admin/progress/course/{courseId}/analytics
    AdminController->>AdminService: 25: getCourseAnalytics()
    
    AdminService->>CourseEntity: 26: findOne()
    CourseEntity-->>AdminService: 27: trả về course info
    AdminService->>LessonEntity: 28: find() - lấy lessons của course
    LessonEntity-->>AdminService: 29: trả về danh sách lessons
    
    AdminService->>ProgressEntity: 30: query usersStarted (COUNT DISTINCT userId)
    ProgressEntity-->>AdminService: 31: trả về số users đã bắt đầu
    
    AdminService->>ProgressEntity: 32: query completionData (GROUP BY userId)
    ProgressEntity-->>AdminService: 33: trả về dữ liệu hoàn thành theo user
    
    AdminService->>AdminService: 34: tính usersCompleted và averageCompletionRate
    
    loop Mỗi bài học
        AdminService->>ProgressEntity: 35: query lessonStats (COUNT, AVG score)
        ProgressEntity-->>AdminService: 36: trả về {completionCount, averageScore}
    end
    
    AdminService-->>AdminController: 37: trả về {course, totalLessons, usersStarted, usersCompleted, averageCompletionRate, lessonStats}
    AdminController-->>Api: 38: trả về
    Api-->>UserProgressApi: 39: trả về
    UserProgressApi-->>CourseAnalyticsCard: 40: trả về CourseAnalytics
    CourseAnalyticsCard->>CourseAnalyticsCard: 41: setAnalytics()
    CourseAnalyticsCard->>CourseAnalyticsCard: 42: setLoading(false)
    CourseAnalyticsCard-->>Admin: 43: hiển thị thống kê khóa học
    end

    %% ===== PHẦN 3: CHỌN KHÓA HỌC KHÁC =====
    rect rgb(245, 255, 230)
    Note over Admin,ProgressEntity: PHẦN 3: Admin chọn khóa học khác (tùy chọn)
    
    Admin->>CourseSelect: 44: chọn khóa học khác từ dropdown
    CourseSelect->>CourseSelect: 45: handleChange()
    CourseSelect->>CourseAnalyticsCard: 46: onChange(newCourseId)
    CourseAnalyticsCard->>CourseAnalyticsCard: 47: setSelectedCourseId()
    Note over CourseAnalyticsCard,ProgressEntity: Lặp lại bước 19-43 để tải phân tích khóa học mới
    end
```

---

## Tổng hợp các thành phần

### Frontend (Admin)

| File | Vai trò |
|------|---------|
| `dashboard/page.tsx` | Trang Dashboard chính, chứa các tabs |
| `CourseAnalyticsCard.tsx` | Card hiển thị phân tích khóa học |
| `CourseSelect.tsx` | Component dropdown chọn khóa học |
| `userprogressApi.ts` | Service gọi API liên quan đến progress |
| `api.ts` | Core API utility functions |

### Backend (BE)

| File | Vai trò |
|------|---------|
| `courses.controller.ts` | Controller xử lý các endpoints /courses/* |
| `courses.service.ts` | Service logic nghiệp vụ cho courses |
| `admin-progress.controller.ts` | Controller xử lý các endpoints admin/progress/* |
| `admin-progress.service.ts` | Service logic nghiệp vụ cho admin progress |

### Entities

| Entity | Table | Mô tả |
|--------|-------|-------|
| `Courses` | `courses` | Thông tin khóa học |
| `Lessons` | `lessons` | Thông tin bài học |
| `UserLessonProgress` | `user_lesson_progress` | Tiến trình học của user |

### API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/courses?page=1&limit=100` | Lấy danh sách khóa học |
| GET | `/admin/progress/course/{courseId}/analytics` | Lấy phân tích chi tiết khóa học |

### Dữ liệu trả về (CourseAnalytics)

| Field | Type | Mô tả |
|-------|------|-------|
| `course` | Object | Thông tin khóa học (id, title, hskLevel) |
| `totalLessons` | number | Tổng số bài học |
| `usersStarted` | number | Số người đã bắt đầu học |
| `usersCompleted` | number | Số người đã hoàn thành tất cả bài |
| `averageCompletionRate` | number | Tỷ lệ hoàn thành trung bình (%) |
| `lessonStats` | Array | Thống kê từng bài học (lessonId, lessonTitle, completionCount, averageScore) |
