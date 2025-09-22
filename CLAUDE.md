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
- **State Management**: React Context (AuthContext, CourseContext)
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with react-query for data fetching
- **Authentication**: JWT token-based auth

### Application Structure

The application uses **route groups** for organization:

#### Route Structure
- `src/app/(admin)/*` - Admin-only pages requiring authentication
  - Protected by `ProtectedRoute` with `adminOnly={true}`
  - Wrapped in `AdminLayout` with sidebar and topbar
  - Routes: `/courses`, `/lessons`, `/question`, `/dashboard`, `/settings`
- `src/app/login` - Public login page
- `src/app/page.tsx` - Root landing page

#### Key Architecture Patterns

**1. Layout Hierarchy:**
```
RootLayout (AuthProvider)
  └── AdminLayout (CourseProvider + ProtectedRoute)
      └── AdminSidebar + AdminTopbar + Content
```

**2. Authentication Flow:**
- JWT tokens stored in localStorage
- AuthContext provides `user`, `login`, `logout`, `checkAuthStatus`
- ProtectedRoute component guards admin routes
- API requests automatically include Bearer token via `apiRequest` helper

**3. API Integration:**
- Centralized API configuration in `src/services/api.ts`
- Base URL: `http://26.112.47.221:3000` (configurable via env)
- Service pattern: `courseService`, `dictionaryService`, `grammarService`
- Comprehensive API documentation in `FRONTEND_API_GUIDE.md`

**4. Question System:**
The application supports 6 question types defined in `QuestionType` enum:
- `AUDIO_IMAGE`, `TEXT_SELECTION`, `MATCHING_TEXT`, `MATCHING_AUDIO`, `FILL_BLANK`, `AUDIO_BOOL`
- Each type has dedicated React components in `src/components/question/`

**5. Content Management:**
- **Courses**: HSK level-based organization with prerequisites
- **Lessons**: Belong to courses, contain learning content and questions
- **Sequence Cards**: Vocabulary, Grammar, Sentence, Exercise, Divider cards
- **Words & Grammar**: Dictionary and pattern management

### Important File Locations

**Core Services:**
- `src/services/api.ts` - Main API client and service functions
- `src/services/lessonApi.ts` - Lesson-specific API operations
- `src/services/questionApi.ts` - Question management APIs

**Type Definitions:**
- `src/types/index.ts` - Core types (User, Course, Word, GrammarPattern, API responses)
- `src/types/lessonTypes.ts` - Lesson and lesson content types
- `src/types/questionType.ts` - Question-specific types

**Context Providers:**
- `src/context/AuthContext.tsx` - Authentication state and methods
- `src/context/CourseContext.tsx` - Course-related state management

### Development Notes

- The app uses **path aliases** (`@/*` maps to `src/*`)
- TypeScript strict mode enabled
- Uses Next.js App Router (not Pages Router)
- Environment variables should be prefixed with `NEXT_PUBLIC_` for client-side access
- Admin users have full CRUD access; regular users have read-only access to learning content

### API Integration Notes

- Backend API expects specific data structures documented in `FRONTEND_API_GUIDE.md`
- All authenticated requests require `Authorization: Bearer <token>` header
- API responses follow consistent patterns with `data` wrapper objects
- Error handling includes automatic token cleanup on 401/403 responses