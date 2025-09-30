# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server
npm run dev                    # Start Next.js development server at http://localhost:3000

# Build and deployment
npm run build                  # Build the production application
npm start                      # Start production server

# Code quality
npm run lint                   # Run ESLint
npm run type-check             # TypeScript type checking without emission
npm run format                 # Format code with Prettier
npm run format:check           # Check code formatting
```

## Project Architecture

This is a **Chinese Language Learning Management System** built with Next.js 14, featuring an admin panel for managing courses, lessons, and learning content.

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **UI Library**: Ant Design v5 with Tailwind CSS
- **State Management**: React Context (AuthContext, CourseContext, LessonCacheContext)
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with react-query for data fetching
- **Authentication**: JWT token-based auth
- **File Uploads**: S3 presigned URLs via backend API

### Application Structure

The application uses **route groups** for organization:

#### Route Structure
- `src/app/(admin)/*` - Admin-only pages requiring authentication
  - Protected by `ProtectedRoute` with `adminOnly={true}`
  - Wrapped in `AdminLayout` with sidebar and topbar
  - Routes: `/courses`, `/lessons`, `/items`, `/dashboard`, `/settings`
- `src/app/login` - Public login page
- `src/app/page.tsx` - Root landing page

#### Key Architecture Patterns

**1. Layout Hierarchy:**
```
RootLayout (AuthProvider)
  └── AdminLayout (CourseProvider + LessonCacheProvider + ProtectedRoute)
      └── AdminSidebar + AdminTopbar + Content
```

**2. Authentication Flow:**
- JWT tokens stored in localStorage
- AuthContext provides `user`, `login`, `logout`, `checkAuthStatus`
- ProtectedRoute component guards admin routes
- API requests automatically include Bearer token via `apiRequest` helper

**3. API Integration:**
- Centralized API configuration in `src/services/api.ts`
- Base URL: Configurable via `NEXT_PUBLIC_API_BASE_URL` environment variable (defaults to `http://26.112.47.221:3000`)
- Service pattern: `courseService`, `dictionaryService`, `grammarService`, `lessonApi`, `questionApi`
- All API responses follow consistent pattern with `data` wrapper: `{ data: T }`

**4. File Upload System:**
- Modular S3 upload utilities in `src/utils/s3Upload.ts`
- Backend generates presigned URLs via `/file-upload/presigned-url` endpoint
- Frontend uploads directly to S3 using presigned URLs
- Dynamic upload system based on content/question type:
  - `uploadImageByType(file, type, onProgress)` - Uploads images to `{type}/images` folder
  - `uploadAudioByType(file, type, onProgress)` - Uploads audio to `{type}/audio` folder
  - Example: `content_word_definition` → `content-word-definition/images` and `content-word-definition/audio`
  - Example: `question_audio_image` → `question-audio-image/images` and `question-audio-image/audio`
- Generic `uploadFileToS3(file, folder, onProgress)` for custom folders
- File validation: `validateFile(file, type, maxSizeMB)`

**5. Content Management:**
The application manages two main item types:
- **Questions** (`QuestionType` enum): Interactive exercises
  - `AUDIO_IMAGE`, `TEXT_SELECTION`, `MATCHING_TEXT`, `MATCHING_AUDIO`, `FILL_BLANK`, `AUDIO_BOOL`
  - API: `questionApi.createQuestion()`, `questionApi.updateQuestion()`
- **Content** (`ContentType` enum): Learning materials
  - `CONTENT_WORD_DEFINITION`, `CONTENT_SENTENCES`
  - API: `lessonApi.addLessonContent()`, `lessonApi.updateLessonItem()`

Both are managed through the `/items` route:
- `/items?lessonId=X` - List all items (questions + content) for a lesson
- `/items/create?lessonId=X&type=Y` - Create new item
- `/items/edit/{id}?lessonId=X` - Edit existing item

**6. Course Hierarchy:**
- **Courses**: HSK level-based organization with prerequisites
- **Lessons**: Belong to courses, contain learning content and questions
- Course selection affects lesson filtering throughout the UI via CourseContext

### Important File Locations

**Core Services:**
- `src/services/api.ts` - Main API client with `apiRequest` helper and service objects
- `src/services/lessonApi.ts` - Lesson and content management APIs
- `src/services/questionApi.ts` - Question management APIs

**File Upload:**
- `src/utils/s3Upload.ts` - Modular S3 upload utilities with progress tracking

**Type Definitions:**
- `src/types/index.ts` - Core types (User, Course, Word, GrammarPattern, API responses)
- `src/types/lessonTypes.ts` - Lesson and lesson content types
- `src/types/questionType.ts` - Question-specific types
- `src/types/contentTypes.ts` - Content-specific types (WordDefinitionData, SentencesData)
- `src/enums/question-type.enum.ts` - QuestionType enum
- `src/enums/content-type.enum.ts` - ContentType enum

**Context Providers:**
- `src/context/AuthContext.tsx` - Authentication state and methods
- `src/context/CourseContext.tsx` - Course-related state management
- `src/context/LessonCacheContext.tsx` - Lesson data caching

**Reusable Components:**
- `src/components/content/forms/WordDefinitionForm.tsx` - Word definition form with S3 upload integration
- `src/components/content/forms/SentencesForm.tsx` - Sentences content form
- `src/components/question/forms/MultipleChoiceForm.tsx` - Multiple choice question form
- `src/components/common/UploadModal.tsx` - Reusable upload progress modal

### Development Notes

- The app uses **path aliases** (`@/*` maps to `src/*`)
- TypeScript strict mode enabled
- Uses Next.js App Router (not Pages Router)
- Environment variables should be prefixed with `NEXT_PUBLIC_` for client-side access
- Admin users have full CRUD access; regular users have read-only access to learning content
- Form submissions should clean temporary fields (e.g., `chinese_sentence_input`) before sending to backend
- S3 bucket CORS must allow PUT requests from frontend origins
- Backend presigned URLs should not include ACL parameters (bucket uses bucket policy instead)