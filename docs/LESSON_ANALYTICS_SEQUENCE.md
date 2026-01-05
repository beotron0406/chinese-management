# Sequence Diagram: Xem phân tích theo bài học (Lesson Analytics)

## Use Case: Xem phân tích theo bài học

### Mô tả
Admin truy cập trang Dashboard, chọn tab "Phân tích bài học", chọn khóa học rồi chọn bài học từ dropdown để xem thống kê chi tiết bao gồm: tổng lượt hoàn thành, điểm trung bình, phân bố điểm số, và danh sách người hoàn thành gần đây.

### Sequence Diagram

```mermaid
sequenceDiagram
    actor Admin as Quản trị viên
    participant DashboardPage as dashboard/page.tsx
    participant LessonAnalyticsCard as LessonAnalyticsCard.tsx
    participant CourseSelect as CourseSelect.tsx
    participant LessonSelect as LessonSelect.tsx
    participant UserProgressApi as userprogressApi.ts
    participant LessonApi as lessonApi.ts
    participant Api as api.ts
    participant CourseController as courses.controller.ts
    participant CourseService as courses.service.ts
    participant LessonController as lessons.controller.ts
    participant LessonService as lessons.service.ts
    participant AdminController as admin-progress.controller.ts
    participant AdminService as admin-progress.service.ts
    participant CourseEntity as courses
    participant LessonEntity as lessons
    participant ProgressEntity as user_lesson_progress
    participant UserEntity as users

    Note over Admin,DashboardPage: Tiền điều kiện: Admin đã đăng nhập và ở trang Dashboard

    %% ===== PHẦN 1: TẢI DANH SÁCH KHÓA HỌC =====
    rect rgb(230, 245, 255)
    Note over Admin,CourseEntity: PHẦN 1: Tải danh sách khóa học
    
    Admin->>DashboardPage: 1: chọn tab "Phân tích bài học"
    DashboardPage->>LessonAnalyticsCard: 2: render LessonAnalyticsCard component
    LessonAnalyticsCard->>CourseSelect: 3: render CourseSelect component
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
    CourseSelect->>LessonAnalyticsCard: 15: onCoursesLoaded()
    LessonAnalyticsCard->>LessonAnalyticsCard: 16: handleCoursesLoaded()
    LessonAnalyticsCard->>LessonAnalyticsCard: 17: setSelectedCourseId(courses[0].id)
    CourseSelect-->>Admin: 18: hiển thị dropdown khóa học
    end

    %% ===== PHẦN 2: TẢI DANH SÁCH BÀI HỌC =====
    rect rgb(255, 250, 230)
    Note over LessonSelect,LessonEntity: PHẦN 2: Tải danh sách bài học theo khóa học đã chọn
    
    LessonAnalyticsCard->>LessonSelect: 19: render LessonSelect với courseId
    LessonSelect->>LessonSelect: 20: useEffect() triggered (courseId changed)
    LessonSelect->>LessonSelect: 21: fetchLessons()
    LessonSelect->>LessonApi: 22: lessonApi.getLessonsByCourse()
    LessonApi->>Api: 23: api.get()
    Api->>LessonController: 24: GET /lessons/course/{courseId}
    LessonController->>LessonService: 25: findByCourseId()
    LessonService->>LessonEntity: 26: find()
    LessonEntity-->>LessonService: 27: trả về danh sách lessons
    LessonService-->>LessonController: 28: trả về
    LessonController-->>Api: 29: trả về
    Api-->>LessonApi: 30: trả về
    LessonApi-->>LessonSelect: 31: trả về lessons
    LessonSelect->>LessonSelect: 32: setLessons()
    LessonSelect->>LessonAnalyticsCard: 33: onLessonsLoaded()
    LessonAnalyticsCard->>LessonAnalyticsCard: 34: handleLessonsLoaded()
    LessonAnalyticsCard->>LessonAnalyticsCard: 35: setSelectedLessonId(lessons[0].id)
    LessonSelect-->>Admin: 36: hiển thị dropdown bài học
    end

    %% ===== PHẦN 3: TẢI PHÂN TÍCH BÀI HỌC =====
    rect rgb(255, 245, 230)
    Note over LessonAnalyticsCard,UserEntity: PHẦN 3: Tải phân tích chi tiết bài học đã chọn
    
    LessonAnalyticsCard->>LessonAnalyticsCard: 37: useEffect() triggered (selectedLessonId changed)
    LessonAnalyticsCard->>LessonAnalyticsCard: 38: fetchLessonAnalytics()
    LessonAnalyticsCard->>LessonAnalyticsCard: 39: setLoading(true)
    LessonAnalyticsCard->>UserProgressApi: 40: adminProgressApi.getLessonAnalytics()
    UserProgressApi->>Api: 41: api.get()
    Api->>AdminController: 42: GET /admin/progress/lesson/{lessonId}/analytics
    AdminController->>AdminService: 43: getLessonAnalytics()
    
    AdminService->>LessonEntity: 44: findOne() với relations course
    LessonEntity-->>AdminService: 45: trả về lesson info với course
    
    AdminService->>ProgressEntity: 46: query stats (COUNT, AVG score)
    ProgressEntity-->>AdminService: 47: trả về {totalCompletions, averageScore}
    
    AdminService->>ProgressEntity: 48: find() - lấy tất cả completions
    ProgressEntity-->>AdminService: 49: trả về danh sách completions
    AdminService->>AdminService: 50: tính scoreDistribution (0-20, 21-40, 41-60, 61-80, 81-100)
    
    AdminService->>ProgressEntity: 51: query recentCompletions (JOIN user, LIMIT 10)
    ProgressEntity-->>AdminService: 52: trả về recent completions với user info
    
    AdminService-->>AdminController: 53: trả về {lesson, totalCompletions, averageScore, scoreDistribution, recentCompletions}
    AdminController-->>Api: 54: trả về
    Api-->>UserProgressApi: 55: trả về
    UserProgressApi-->>LessonAnalyticsCard: 56: trả về LessonAnalytics
    LessonAnalyticsCard->>LessonAnalyticsCard: 57: setAnalytics()
    LessonAnalyticsCard->>LessonAnalyticsCard: 58: setLoading(false)
    LessonAnalyticsCard-->>Admin: 59: hiển thị thống kê bài học
    end

    %% ===== PHẦN 4: CHỌN KHÓA HỌC/BÀI HỌC KHÁC =====
    rect rgb(245, 255, 230)
    Note over Admin,ProgressEntity: PHẦN 4: Admin chọn khóa học/bài học khác (tùy chọn)
    
    Admin->>CourseSelect: 60: chọn khóa học khác từ dropdown
    CourseSelect->>LessonAnalyticsCard: 61: onChange()
    LessonAnalyticsCard->>LessonAnalyticsCard: 62: handleCourseChange()
    LessonAnalyticsCard->>LessonAnalyticsCard: 63: setSelectedCourseId()
    LessonAnalyticsCard->>LessonAnalyticsCard: 64: setSelectedLessonId(undefined)
    LessonAnalyticsCard->>LessonAnalyticsCard: 65: setAnalytics(null)
    Note over LessonSelect,LessonEntity: Lặp lại bước 19-36 để tải danh sách bài học mới
    
    Admin->>LessonSelect: 66: chọn bài học khác từ dropdown
    LessonSelect->>LessonAnalyticsCard: 67: onChange()
    LessonAnalyticsCard->>LessonAnalyticsCard: 68: setSelectedLessonId()
    Note over LessonAnalyticsCard,ProgressEntity: Lặp lại bước 37-59 để tải phân tích bài học mới
    end
```

---

## Tổng hợp các thành phần

### Frontend (Admin)

| File | Vai trò |
|------|---------|
| `dashboard/page.tsx` | Trang Dashboard chính, chứa các tabs |
| `LessonAnalyticsCard.tsx` | Card hiển thị phân tích bài học |
| `CourseSelect.tsx` | Component dropdown chọn khóa học |
| `LessonSelect.tsx` | Component dropdown chọn bài học |
| `userprogressApi.ts` | Service gọi API liên quan đến progress |
| `lessonApi.ts` | Service gọi API liên quan đến lessons |
| `api.ts` | Core API utility functions |

### Backend (BE)

| File | Vai trò |
|------|---------|
| `courses.controller.ts` | Controller xử lý các endpoints /courses/* |
| `courses.service.ts` | Service logic nghiệp vụ cho courses |
| `lessons.controller.ts` | Controller xử lý các endpoints /lessons/* |
| `lessons.service.ts` | Service logic nghiệp vụ cho lessons |
| `admin-progress.controller.ts` | Controller xử lý các endpoints admin/progress/* |
| `admin-progress.service.ts` | Service logic nghiệp vụ cho admin progress |

### Entities

| Entity | Table | Mô tả |
|--------|-------|-------|
| `Courses` | `courses` | Thông tin khóa học |
| `Lessons` | `lessons` | Thông tin bài học |
| `UserLessonProgress` | `user_lesson_progress` | Tiến trình học của user |
| `User` | `users` | Thông tin người dùng |

### API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/courses?page=1&limit=100` | Lấy danh sách khóa học |
| GET | `/lessons/course/{courseId}` | Lấy danh sách bài học theo khóa học |
| GET | `/admin/progress/lesson/{lessonId}/analytics` | Lấy phân tích chi tiết bài học |

### Dữ liệu trả về (LessonAnalytics)

| Field | Type | Mô tả |
|-------|------|-------|
| `lesson` | Object | Thông tin bài học (id, title, courseId, courseTitle) |
| `totalCompletions` | number | Tổng lượt hoàn thành |
| `averageScore` | number | Điểm trung bình (%) |
| `scoreDistribution` | Array | Phân bố điểm theo 5 khoảng (0-20, 21-40, 41-60, 61-80, 81-100) |
| `recentCompletions` | Array | 10 người hoàn thành gần nhất (userId, displayName, scorePercentage, completedAt) |
