# Sequence Diagram: Xem bảng xếp hạng người dùng và Chi tiết người dùng

## Use Case: Xem bảng xếp hạng và chi tiết người dùng

### Mô tả
Admin truy cập trang Dashboard, chọn tab "Bảng xếp hạng" để xem danh sách người dùng được xếp hạng theo các tiêu chí (Streak dài nhất, Nhiều bài học nhất, Điểm cao nhất), sau đó nhấn "Chi tiết" để xem thông tin chi tiết của một người dùng.

### Sequence Diagram

```mermaid
sequenceDiagram
    actor Admin as Quản trị viên
    participant DashboardPage as dashboard/page.tsx
    participant LeaderboardTabs as LeaderboardTabs.tsx
    participant UserDetailModal as UserDetailModal.tsx
    participant UserProgressApi as userprogressApi.ts
    participant Api as api.ts
    participant Controller as admin-progress.controller.ts
    participant Service as admin-progress.service.ts
    participant UserEntity as users
    participant ProgressEntity as user_lesson_progress
    participant CourseEntity as courses
    participant LessonEntity as lessons

    Note over Admin,DashboardPage: Tiền điều kiện: Admin đã đăng nhập và ở trang Dashboard

    %% ===== PHẦN 1: XEM BẢNG XẾP HẠNG =====
    rect rgb(230, 245, 255)
    Note over Admin,Service: PHẦN 1: Xem bảng xếp hạng người dùng
    
    Admin->>DashboardPage: 1: chọn tab "Bảng xếp hạng"
    DashboardPage->>LeaderboardTabs: 2: render LeaderboardTabs component
    LeaderboardTabs->>LeaderboardTabs: 3: useEffect()
    LeaderboardTabs->>LeaderboardTabs: 4: fetchLeaderboard()
    LeaderboardTabs->>LeaderboardTabs: 5: setLoading(true)
    LeaderboardTabs->>UserProgressApi: 6: adminProgressApi.getLeaderboard()
    UserProgressApi->>Api: 7: api.get()
    Api->>Controller: 8: GET /admin/progress/leaderboard
    Controller->>Service: 9: getLeaderboard()
    
    Service->>UserEntity: 10: query byStreak
    UserEntity-->>Service: 11: trả về danh sách users theo streak
    Service->>ProgressEntity: 12: query byLessonsCompleted
    ProgressEntity-->>Service: 13: trả về danh sách users theo lessons
    Service->>ProgressEntity: 14: query byAverageScore
    ProgressEntity-->>Service: 15: trả về danh sách users theo score
    
    Service-->>Controller: 16: trả về {byStreak, byLessonsCompleted, byAverageScore}
    Controller-->>Api: 17: trả về
    Api-->>UserProgressApi: 18: trả về
    UserProgressApi-->>LeaderboardTabs: 19: trả về LeaderboardData
    LeaderboardTabs->>LeaderboardTabs: 20: setLeaderboard()
    LeaderboardTabs->>LeaderboardTabs: 21: setLoading(false)
    LeaderboardTabs-->>Admin: 22: hiển thị bảng xếp hạng với 3 tabs
    end

    %% ===== PHẦN 2: XEM CHI TIẾT NGƯỜI DÙNG =====
    rect rgb(255, 245, 230)
    Note over Admin,LessonEntity: PHẦN 2: Xem chi tiết người dùng
    
    Admin->>LeaderboardTabs: 23: nhấn nút "Chi tiết" trên một user
    LeaderboardTabs->>LeaderboardTabs: 24: handleViewUser()
    LeaderboardTabs->>LeaderboardTabs: 25: setSelectedUserId()
    LeaderboardTabs->>LeaderboardTabs: 26: setModalVisible(true)
    LeaderboardTabs->>UserDetailModal: 27: render modal với userId
    
    UserDetailModal->>UserDetailModal: 28: useEffect()
    UserDetailModal->>UserDetailModal: 29: fetchUserDetail()
    UserDetailModal->>UserDetailModal: 30: setLoading(true)
    UserDetailModal->>UserProgressApi: 31: adminProgressApi.getUserProgress()
    UserProgressApi->>Api: 32: api.get()
    Api->>Controller: 33: GET /admin/progress/user/{userId}
    Controller->>Service: 34: getUserProgressDetails()
    
    Service->>UserEntity: 35: findOne()
    UserEntity-->>Service: 36: trả về user info
    Service->>ProgressEntity: 37: query completedLessons
    ProgressEntity-->>Service: 38: trả về completed lessons
    Service->>CourseEntity: 39: find()
    CourseEntity-->>Service: 40: trả về courses
    
    loop Mỗi khóa học
        Service->>LessonEntity: 41: find lessons by courseId
        LessonEntity-->>Service: 42: trả về lessons
        Service->>ProgressEntity: 43: query progress
        ProgressEntity-->>Service: 44: trả về progress
    end
    
    Service->>Service: 45: tính toán courseBreakdown
    
    Service-->>Controller: 46: trả về {user, studyInfo, completedLessons, courseBreakdown}
    Controller-->>Api: 47: trả về
    Api-->>UserProgressApi: 48: trả về
    UserProgressApi-->>UserDetailModal: 49: trả về UserProgressDetail
    UserDetailModal->>UserDetailModal: 50: setUserDetail()
    UserDetailModal->>UserDetailModal: 51: setLoading(false)
    UserDetailModal-->>Admin: 52: hiển thị modal chi tiết người dùng
    end
```

---

## Tổng hợp các thành phần

### Frontend (Admin)

| File | Vai trò |
|------|---------|
| `dashboard/page.tsx` | Trang Dashboard chính, chứa các tabs |
| `LeaderboardTabs.tsx` | Component hiển thị bảng xếp hạng với 3 tabs |
| `UserDetailModal.tsx` | Modal hiển thị chi tiết người dùng |
| `userprogressApi.ts` | Service gọi API liên quan đến progress |
| `api.ts` | Core API utility functions |

### Backend (BE)

| File | Vai trò |
|------|---------|
| `admin-progress.controller.ts` | Controller xử lý các endpoints admin/progress/* |
| `admin-progress.service.ts` | Service logic nghiệp vụ cho admin progress |

### Entities

| Entity | Table | Mô tả |
|--------|-------|-------|
| `User` | `users` | Thông tin người dùng |
| `UserLessonProgress` | `user_lesson_progress` | Tiến trình học của user theo lesson |
| `Courses` | `courses` | Thông tin khóa học |
| `Lessons` | `lessons` | Thông tin bài học |

### API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/admin/progress/leaderboard?limit={n}` | Lấy bảng xếp hạng |
| GET | `/admin/progress/user/{userId}` | Lấy chi tiết tiến trình của user |

