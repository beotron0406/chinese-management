# Sequence Diagram: Tạo khóa học (Create Course)

## Use Case: Tạo khóa học mới

### Mô tả
Admin truy cập trang quản lý khóa học, nhấn nút "Tạo khóa học mới", điền thông tin vào form và lưu khóa học mới vào hệ thống.

### Sequence Diagram

```mermaid
sequenceDiagram
    actor Admin as Quản trị viên
    participant CoursesListTsx as courses_list.tsx
    participant CourseFormModal as CourseFormModal.tsx
    participant Api as api.ts
    participant Controller as courses.controller.ts
    participant Service as courses.service.ts
    participant Entity as courses

    Note over Admin,CoursesListTsx: Tiền điều kiện: Admin đang ở trang quản lý khóa học

    Admin->>CoursesListTsx: 1: nhấn nút "Tạo khóa học mới"
    CoursesListTsx->>CoursesListTsx: 2: setIsModalVisible(true)
    CoursesListTsx->>CourseFormModal: 3: render modal với initialValues=null
    CourseFormModal->>CourseFormModal: 4: useEffect()
    CourseFormModal->>CourseFormModal: 5: form.resetFields()
    CourseFormModal->>CourseFormModal: 6: setFieldsValue({isActive: true, hskLevel: 1, orderIndex: 1})
    CourseFormModal-->>Admin: 7: hiển thị form tạo khóa học

    Note over Admin,CourseFormModal: Admin điền thông tin khóa học:<br/>- title (bắt buộc)<br/>- description<br/>- hskLevel (1-9)<br/>- prerequisiteCourseId (tùy chọn)

    Admin->>CourseFormModal: 8: nhấn nút "Tạo"
    CourseFormModal->>CourseFormModal: 9: handleOk()
    CourseFormModal->>CourseFormModal: 10: validateFields()
    
    alt Validation thất bại
        CourseFormModal-->>Admin: 11a: hiển thị lỗi validation
    else Validation thành công
        CourseFormModal->>CoursesListTsx: 11b: onSave(values)
        CoursesListTsx->>CoursesListTsx: 12: handleSave()
        CoursesListTsx->>Api: 13: courseService.createCourse()
        Api->>Controller: 14: POST /courses
        Controller->>Service: 15: create()
        
        alt Có prerequisiteCourseId
            Service->>Service: 16a: findById(prerequisiteCourseId)
            Service->>Entity: 17a: findOne()
            Entity-->>Service: 18a: trả về prerequisite course
        end
        
        alt Không có orderIndex
            Service->>Entity: 16b: query MAX(orderIndex)
            Entity-->>Service: 17b: trả về maxOrder
            Service->>Service: 18b: orderIndex = maxOrder + 1
        else Có orderIndex
            Service->>Entity: 16c: findOne(orderIndex)
            Entity-->>Service: 17c: kiểm tra orderIndex đã tồn tại
        end
        
        Service->>Service: 19: create(courseData)
        Service->>Entity: 20: save()
        Entity-->>Service: 21: trả về khóa học đã tạo
        Service-->>Controller: 22: trả về Course
        Controller-->>Api: 23: trả về
        Api-->>CoursesListTsx: 24: trả về Course
        CoursesListTsx->>CoursesListTsx: 25: message.success("Tạo khóa học thành công")
        CoursesListTsx->>CoursesListTsx: 26: setIsModalVisible(false)
        CoursesListTsx->>CoursesListTsx: 27: setEditingCourse(null)
        
        Note over CoursesListTsx,Entity: Refresh danh sách khóa học
        CoursesListTsx->>CoursesListTsx: 28: fetchCourses()
        CoursesListTsx->>Api: 29: courseService.getCourses()
        Api->>Controller: 30: GET /courses
        Controller->>Service: 31: findAll()
        Service->>Entity: 32: getManyAndCount()
        Entity-->>Service: 33: trả về danh sách courses
        Service-->>Controller: 34: trả về {courses, total}
        Controller-->>Api: 35: trả về
        Api-->>CoursesListTsx: 36: trả về
        CoursesListTsx->>CoursesListTsx: 37: setAllCourses()
        CoursesListTsx-->>Admin: 38: hiển thị danh sách khóa học đã cập nhật
    end
```

---

## Tổng hợp các thành phần

### Frontend (Admin)

| File | Vai trò |
|------|---------|
| `courses_list.tsx` | Trang quản lý danh sách khóa học |
| `CourseFormModal.tsx` | Modal form tạo/sửa khóa học |
| `api.ts` | Service gọi API (courseService) |

### Backend (BE)

| File | Vai trò |
|------|---------|
| `courses.controller.ts` | Controller xử lý các endpoints /courses/* |
| `courses.service.ts` | Service logic nghiệp vụ cho courses |

### Entity

| Entity | Table | Mô tả |
|--------|-------|-------|
| `Courses` | `courses` | Thông tin khóa học |

### API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/courses` | Tạo khóa học mới |
| GET | `/courses?page=1&limit=100` | Lấy danh sách khóa học |

### Dữ liệu đầu vào (CreateCourseDto)

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `title` | string | ✅ | Tiêu đề khóa học |
| `description` | string | ❌ | Mô tả khóa học |
| `hskLevel` | number (1-9) | ✅ | Cấp độ HSK |
| `prerequisiteCourseId` | number | ❌ | ID khóa học tiên quyết |
| `orderIndex` | number | ❌ | Thứ tự hiển thị (auto-increment nếu không có) |
| `isActive` | boolean | ❌ | Trạng thái hoạt động (default: true) |

### Validation và Logic BE

1. **Kiểm tra prerequisite course**: Nếu có `prerequisiteCourseId`, kiểm tra course đó có tồn tại không
2. **Auto-increment orderIndex**: Nếu không có `orderIndex`, tự động lấy MAX + 1
3. **Kiểm tra orderIndex trùng**: Nếu có `orderIndex`, kiểm tra không bị trùng
