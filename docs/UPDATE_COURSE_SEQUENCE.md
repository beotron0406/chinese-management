# Sequence Diagram: Chỉnh sửa khóa học (Update Course)

## Use Case: Chỉnh sửa khóa học

### Mô tả
Admin truy cập trang quản lý khóa học, nhấn nút "Sửa" trên một khóa học, chỉnh sửa thông tin trong form và lưu thay đổi.

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

    Admin->>CoursesListTsx: 1: nhấn nút "Sửa" trên khóa học
    CoursesListTsx->>CoursesListTsx: 2: handleEdit()
    CoursesListTsx->>CoursesListTsx: 3: setEditingCourse(course)
    CoursesListTsx->>CoursesListTsx: 4: setIsModalVisible(true)
    CoursesListTsx->>CourseFormModal: 5: render modal với initialValues=course
    CourseFormModal->>CourseFormModal: 6: useEffect()
    CourseFormModal->>CourseFormModal: 7: form.setFieldsValue(initialValues)
    CourseFormModal-->>Admin: 8: hiển thị form với dữ liệu khóa học

    Note over Admin,CourseFormModal: Admin chỉnh sửa thông tin khóa học:<br/>- title<br/>- description<br/>- hskLevel<br/>- prerequisiteCourseId

    Admin->>CourseFormModal: 9: nhấn nút "Cập nhật"
    CourseFormModal->>CourseFormModal: 10: handleOk()
    CourseFormModal->>CourseFormModal: 11: validateFields()
    
    alt Validation thất bại
        CourseFormModal-->>Admin: 12a: hiển thị lỗi validation
    else Validation thành công
        CourseFormModal->>CoursesListTsx: 12b: onSave()
        CoursesListTsx->>CoursesListTsx: 13: handleSave()
        CoursesListTsx->>Api: 14: courseService.updateCourse()
        Api->>Controller: 15: PUT /courses/{id}
        Controller->>Service: 16: update()
        
        Service->>Service: 17: findById()
        Service->>Entity: 18: findOne()
        Entity-->>Service: 19: trả về course hiện tại
        
        alt Course không tồn tại
            Service-->>Controller: 20a: NotFoundException
            Controller-->>Api: 21a: 404 Not Found
            Api-->>CoursesListTsx: 22a: error
            CoursesListTsx-->>Admin: 23a: message.error()
        else Course tồn tại
            alt Có thay đổi prerequisiteCourseId
                alt prerequisiteCourseId === id
                    Service-->>Controller: 20b: BadRequestException
                else prerequisiteCourseId !== id
                    Service->>Service: 20c: findById(prerequisiteCourseId)
                    Service->>Entity: 21c: findOne()
                    Entity-->>Service: 22c: trả về prerequisite course
                end
            end
            
            alt Có thay đổi orderIndex
                Service->>Entity: 23: findOne(orderIndex)
                Entity-->>Service: 24: kiểm tra orderIndex trùng
            end
            
            Service->>Service: 25: Object.assign(course, updateDto)
            Service->>Entity: 26: save()
            Entity-->>Service: 27: trả về khóa học đã cập nhật
            Service-->>Controller: 28: trả về Course
            Controller-->>Api: 29: trả về
            Api-->>CoursesListTsx: 30: trả về Course
            CoursesListTsx->>CoursesListTsx: 31: message.success("Cập nhật khóa học thành công")
            CoursesListTsx->>CoursesListTsx: 32: setIsModalVisible(false)
            CoursesListTsx->>CoursesListTsx: 33: setEditingCourse(null)
            
            Note over CoursesListTsx,Entity: Refresh danh sách khóa học
            CoursesListTsx->>CoursesListTsx: 34: fetchCourses()
            CoursesListTsx->>Api: 35: courseService.getCourses()
            Api->>Controller: 36: GET /courses
            Controller->>Service: 37: findAll()
            Service->>Entity: 38: getManyAndCount()
            Entity-->>Service: 39: trả về danh sách courses
            Service-->>Controller: 40: trả về {courses, total}
            Controller-->>Api: 41: trả về
            Api-->>CoursesListTsx: 42: trả về
            CoursesListTsx->>CoursesListTsx: 43: setAllCourses()
            CoursesListTsx-->>Admin: 44: hiển thị danh sách khóa học đã cập nhật
        end
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
| PUT | `/courses/{id}` | Cập nhật khóa học |
| GET | `/courses?page=1&limit=100` | Lấy danh sách khóa học |

### Dữ liệu đầu vào (UpdateCourseDto)

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `title` | string | ❌ | Tiêu đề khóa học |
| `description` | string | ❌ | Mô tả khóa học |
| `hskLevel` | number (1-9) | ❌ | Cấp độ HSK |
| `prerequisiteCourseId` | number | ❌ | ID khóa học tiên quyết |
| `orderIndex` | number | ❌ | Thứ tự hiển thị |
| `isActive` | boolean | ❌ | Trạng thái hoạt động |

### Validation và Logic BE

1. **Kiểm tra course tồn tại**: Tìm course theo ID, nếu không có thì throw NotFoundException
2. **Kiểm tra prerequisite course**:
   - Không cho phép course là prerequisite của chính nó
   - Nếu thay đổi prerequisiteCourseId, kiểm tra course đó có tồn tại không
3. **Kiểm tra orderIndex trùng**: Nếu thay đổi orderIndex, kiểm tra không bị trùng với course khác
4. **Merge và lưu**: Object.assign để merge dữ liệu mới, sau đó save
