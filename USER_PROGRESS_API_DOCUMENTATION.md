# User Progress & Admin Statistics API Documentation

## Overview

This API provides endpoints for tracking user lesson progress, study streaks, and comprehensive admin analytics. All endpoints require JWT authentication.

**Base URL:** `http://localhost:3000` (adjust for your environment)

---

## Table of Contents

1. [User Progress APIs](#user-progress-apis)
   - [Complete Lesson](#1-complete-lesson)
   - [Get Course Progress](#2-get-course-progress)
   - [Get Study Info](#3-get-study-info)
   - [Get Lesson Progress](#4-get-lesson-progress)
2. [Admin Statistics APIs](#admin-statistics-apis)
   - [Platform Overview](#1-platform-overview)
   - [User Progress Details](#2-user-progress-details)
   - [Course Analytics](#3-course-analytics)
   - [Lesson Analytics](#4-lesson-analytics)
   - [Leaderboard](#5-leaderboard)

---

## User Progress APIs

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <your_jwt_token>
```

### 1. Complete Lesson

**Mark a lesson as completed with score percentage. Automatically updates study streak.**

**Endpoint:** `PUT /users/progress/complete`

**Authorization:** User or Admin

**Request Body:**
```json
{
  "lessonId": 5,
  "scorePercentage": 87.5
}
```

**Field Validation:**
- `lessonId`: Integer, minimum 1
- `scorePercentage`: Number, 0-100 (supports decimals)

**Response:** `200 OK`
```json
{
  "id": 123,
  "userId": 45,
  "lessonId": 5,
  "status": "completed",
  "scorePercentage": 87.5,
  "completedAt": "2025-10-28T10:30:00.000Z",
  "createdAt": "2025-10-28T10:30:00.000Z",
  "updatedAt": "2025-10-28T10:30:00.000Z"
}
```

**Streak Logic:**
- **Same day**: No change to streak
- **1 day gap**: Increment `currentStreak` by 1
- **>1 day gap**: Reset `currentStreak` to 1
- `longestStreak` automatically updated if current exceeds it
- `totalStudyDays` incremented (except same day)

**Error Responses:**
- `400 Bad Request`: Invalid lessonId or scorePercentage
- `404 Not Found`: Lesson not found
- `401 Unauthorized`: Missing/invalid token

**Frontend Usage Example:**
```javascript
// After user completes a quiz/lesson
async function completeLesson(lessonId, score) {
  const response = await fetch('/users/progress/complete', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      lessonId: lessonId,
      scorePercentage: score
    })
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Lesson completed!', data);
    // Streak automatically updated - fetch study info to display
  }
}
```

---

### 2. Get Course Progress

**Get status of all lessons in a course with completion details and scores.**

**Endpoint:** `GET /users/progress/course/:courseId`

**Authorization:** User or Admin

**Path Parameters:**
- `courseId`: Course ID (integer)

**Response:** `200 OK`
```json
[
  {
    "lessonId": 1,
    "name": "Introduction to Pinyin",
    "status": "completed",
    "scorePercentage": 95.5,
    "completedAt": "2025-10-15T08:20:00.000Z"
  },
  {
    "lessonId": 2,
    "name": "Basic Tones",
    "status": "completed",
    "scorePercentage": 88.0,
    "completedAt": "2025-10-16T14:30:00.000Z"
  },
  {
    "lessonId": 3,
    "name": "Simple Greetings",
    "status": "not_started",
    "scorePercentage": null,
    "completedAt": null
  }
]
```

**Status Values:**
- `not_started`: User hasn't completed this lesson
- `completed`: User completed this lesson

**Frontend Usage Example:**
```javascript
// Display course progress page
async function getCourseProgress(courseId) {
  const response = await fetch(`/users/progress/course/${courseId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const lessons = await response.json();

  // Calculate completion percentage
  const completed = lessons.filter(l => l.status === 'completed').length;
  const total = lessons.length;
  const percentage = (completed / total) * 100;

  // Display progress bar, lesson list with scores
  return { lessons, completed, total, percentage };
}
```

---

### 3. Get Study Info

**Get study streak and study days information for the current user.**

**Endpoint:** `GET /users/progress/study-info`

**Authorization:** User or Admin

**Response:** `200 OK`
```json
{
  "currentStreak": 7,
  "longestStreak": 23,
  "totalStudyDays": 45,
  "lastStudyDate": "2025-10-28"
}
```

**Field Descriptions:**
- `currentStreak`: Current consecutive study days
- `longestStreak`: Best streak ever achieved
- `totalStudyDays`: Total number of days studied
- `lastStudyDate`: Last date user completed a lesson (null if never studied)

**Frontend Usage Example:**
```javascript
// Display user dashboard with streak info
async function getStudyStats() {
  const response = await fetch('/users/progress/study-info', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const stats = await response.json();

  // Display streak fire icon with current streak
  // Show "Best Streak: X days" badge
  // Display total study days
  return stats;
}
```

**UI/UX Tips:**
- Show 🔥 fire icon with current streak number
- Animate streak increment when lesson completed
- Show achievement badge when longest streak is beaten
- Display calendar heatmap using totalStudyDays

---

### 4. Get Lesson Progress

**Get progress for a specific lesson.**

**Endpoint:** `GET /users/progress/lesson/:lessonId`

**Authorization:** User or Admin

**Path Parameters:**
- `lessonId`: Lesson ID (integer)

**Response:** `200 OK`
```json
{
  "id": 123,
  "userId": 45,
  "lessonId": 5,
  "status": "completed",
  "scorePercentage": 87.5,
  "completedAt": "2025-10-28T10:30:00.000Z",
  "createdAt": "2025-10-28T10:30:00.000Z",
  "updatedAt": "2025-10-28T10:30:00.000Z",
  "lesson": {
    "id": 5,
    "name": "Colors and Numbers",
    "description": "Learn basic colors and counting",
    "courseId": 2
  }
}
```

**If lesson not started:** `200 OK` with `null` response

**Frontend Usage Example:**
```javascript
// Check if user has completed a lesson before
async function hasCompletedLesson(lessonId) {
  const response = await fetch(`/users/progress/lesson/${lessonId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const progress = await response.json();

  if (progress && progress.status === 'completed') {
    console.log(`Already completed with score: ${progress.scorePercentage}%`);
    return true;
  }
  return false;
}
```

---

## Admin Statistics APIs

### Authentication
All admin endpoints require Admin role:
```
Authorization: Bearer <admin_jwt_token>
Role: admin
```

### 1. Platform Overview

**Get comprehensive platform-wide statistics.**

**Endpoint:** `GET /admin/progress/overview`

**Authorization:** Admin only

**Response:** `200 OK`
```json
{
  "totalUsers": 150,
  "activeUsers": 145,
  "totalCompletions": 3420,
  "averageScore": 78.5,
  "averageStreak": 5.2,
  "topUsers": [
    {
      "userId": 23,
      "displayName": "John Doe",
      "metric": 45
    },
    {
      "userId": 17,
      "displayName": "Jane Smith",
      "metric": 38
    }
  ]
}
```

**Field Descriptions:**
- `totalUsers`: Total registered users
- `activeUsers`: Users with `isActive: true`
- `totalCompletions`: Total lesson completions across all users
- `averageScore`: Platform-wide average quiz score (%)
- `averageStreak`: Average current streak across all users
- `topUsers`: Top 10 users by longest streak (metric = longestStreak)

**Frontend Usage Example:**
```javascript
// Admin dashboard overview
async function getAdminOverview() {
  const response = await fetch('/admin/progress/overview', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  const stats = await response.json();

  // Display in admin dashboard cards:
  // - "150 Total Users" card
  // - "3,420 Lessons Completed" card
  // - "78.5% Average Score" gauge chart
  // - Top 10 users leaderboard widget
}
```

---

### 2. User Progress Details

**Get comprehensive progress information for a specific user.**

**Endpoint:** `GET /admin/progress/user/:userId`

**Authorization:** Admin only

**Path Parameters:**
- `userId`: User ID (integer)

**Response:** `200 OK`
```json
{
  "user": {
    "id": 45,
    "email": "user@example.com",
    "displayName": "John Doe",
    "currentHskLevel": 3
  },
  "studyInfo": {
    "currentStreak": 7,
    "longestStreak": 23,
    "totalStudyDays": 45,
    "lastStudyDate": "2025-10-28"
  },
  "completedLessons": [
    {
      "lessonId": 5,
      "lessonTitle": "Colors and Numbers",
      "courseId": 2,
      "courseTitle": "HSK 2 Basics",
      "scorePercentage": 87.5,
      "completedAt": "2025-10-28T10:30:00.000Z"
    }
  ],
  "courseBreakdown": [
    {
      "courseId": 1,
      "courseTitle": "HSK 1 Fundamentals",
      "totalLessons": 12,
      "completedLessons": 12,
      "averageScore": 92.3
    },
    {
      "courseId": 2,
      "courseTitle": "HSK 2 Basics",
      "totalLessons": 15,
      "completedLessons": 8,
      "averageScore": 85.7
    }
  ]
}
```

**Frontend Usage Example:**
```javascript
// User detail page for admins
async function getUserDetails(userId) {
  const response = await fetch(`/admin/progress/user/${userId}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  const data = await response.json();

  // Display:
  // - User profile card
  // - Streak statistics
  // - Course completion progress bars
  // - Recent lessons completed table
  // - Score trend chart
}
```

---

### 3. Course Analytics

**Get detailed analytics for a specific course.**

**Endpoint:** `GET /admin/progress/course/:courseId/analytics`

**Authorization:** Admin only

**Path Parameters:**
- `courseId`: Course ID (integer)

**Response:** `200 OK`
```json
{
  "course": {
    "id": 2,
    "title": "HSK 2 Basics",
    "hskLevel": 2
  },
  "totalLessons": 15,
  "usersStarted": 87,
  "usersCompleted": 34,
  "averageCompletionRate": 67.5,
  "lessonStats": [
    {
      "lessonId": 5,
      "lessonTitle": "Colors and Numbers",
      "completionCount": 65,
      "averageScore": 82.3
    },
    {
      "lessonId": 6,
      "lessonTitle": "Time Expressions",
      "completionCount": 58,
      "averageScore": 78.9
    }
  ]
}
```

**Field Descriptions:**
- `usersStarted`: Users who completed at least one lesson in this course
- `usersCompleted`: Users who completed ALL lessons in this course
- `averageCompletionRate`: Percentage of lessons completed by users who started

**Frontend Usage Example:**
```javascript
// Course analytics page
async function getCourseAnalytics(courseId) {
  const response = await fetch(`/admin/progress/course/${courseId}/analytics`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  const analytics = await response.json();

  // Display:
  // - Funnel chart: 87 started → 34 completed
  // - Completion rate gauge: 67.5%
  // - Per-lesson bar chart showing completion counts
  // - Per-lesson average scores
  // - Identify difficult lessons (low completion or low scores)
}
```

---

### 4. Lesson Analytics

**Get detailed analytics for a specific lesson.**

**Endpoint:** `GET /admin/progress/lesson/:lessonId/analytics`

**Authorization:** Admin only

**Path Parameters:**
- `lessonId`: Lesson ID (integer)

**Response:** `200 OK`
```json
{
  "lesson": {
    "id": 5,
    "title": "Colors and Numbers",
    "courseId": 2,
    "courseTitle": "HSK 2 Basics"
  },
  "totalCompletions": 87,
  "averageScore": 82.3,
  "scoreDistribution": [
    { "range": "0-20", "count": 2 },
    { "range": "21-40", "count": 5 },
    { "range": "41-60", "count": 12 },
    { "range": "61-80", "count": 28 },
    { "range": "81-100", "count": 40 }
  ],
  "recentCompletions": [
    {
      "userId": 45,
      "displayName": "John Doe",
      "scorePercentage": 87.5,
      "completedAt": "2025-10-28T10:30:00.000Z"
    },
    {
      "userId": 32,
      "displayName": "Jane Smith",
      "scorePercentage": 92.0,
      "completedAt": "2025-10-28T09:15:00.000Z"
    }
  ]
}
```

**Score Distribution Ranges:**
- `0-20`: Failing
- `21-40`: Poor
- `41-60`: Fair
- `61-80`: Good
- `81-100`: Excellent

**Frontend Usage Example:**
```javascript
// Lesson analytics page
async function getLessonAnalytics(lessonId) {
  const response = await fetch(`/admin/progress/lesson/${lessonId}/analytics`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  const analytics = await response.json();

  // Display:
  // - Total completions badge
  // - Average score with color coding
  // - Score distribution histogram (5 bars)
  // - Recent completions table with user names
  // - Alert if many students scoring low (needs content review)
}
```

---

### 5. Leaderboard

**Get top performers by various metrics.**

**Endpoint:** `GET /admin/progress/leaderboard?limit=20`

**Authorization:** Admin only

**Query Parameters:**
- `limit` (optional): Number of top users to return (default: 20)

**Response:** `200 OK`
```json
{
  "byStreak": [
    {
      "userId": 23,
      "displayName": "John Doe",
      "longestStreak": 45
    },
    {
      "userId": 17,
      "displayName": "Jane Smith",
      "longestStreak": 38
    }
  ],
  "byLessonsCompleted": [
    {
      "userId": 12,
      "displayName": "Bob Wilson",
      "lessonsCompleted": 156
    },
    {
      "userId": 8,
      "displayName": "Alice Brown",
      "lessonsCompleted": 142
    }
  ],
  "byAverageScore": [
    {
      "userId": 34,
      "displayName": "Charlie Green",
      "averageScore": 95.8
    },
    {
      "userId": 29,
      "displayName": "Diana White",
      "averageScore": 94.2
    }
  ]
}
```

**Frontend Usage Example:**
```javascript
// Leaderboard page
async function getLeaderboard(limit = 20) {
  const response = await fetch(`/admin/progress/leaderboard?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  const leaderboard = await response.json();

  // Display three tabs/sections:
  // Tab 1: "Longest Streak" - Top users by consistency
  // Tab 2: "Most Lessons" - Top users by quantity
  // Tab 3: "Highest Scores" - Top users by quality

  // Each with:
  // - Rank number (1, 2, 3, ...)
  // - User avatar/name
  // - Metric value with icon
  // - Trophy/medal icons for top 3
}
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
**Cause:** Missing or invalid JWT token

---

**403 Forbidden**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```
**Cause:** User doesn't have required role (e.g., Admin role required)

---

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "User not found"
}
```
**Cause:** Requested resource (user/lesson/course) doesn't exist

---

**400 Bad Request**
```json
{
  "statusCode": 400,
  "message": [
    "scorePercentage must not be greater than 100",
    "scorePercentage must not be less than 0"
  ],
  "error": "Bad Request"
}
```
**Cause:** Validation failed on request body/parameters

---

## Frontend Integration Best Practices

### 1. Progress Tracking Flow
```javascript
// When user completes a lesson:
1. Call PUT /users/progress/complete with score
2. Show success message + score
3. Refresh GET /users/progress/study-info to update streak display
4. Refresh GET /users/progress/course/:courseId to update course progress
5. Show streak animation if incremented
```

### 2. Course Progress Display
```javascript
// Course card/page should show:
- Progress bar: X/Y lessons completed
- Overall percentage
- Latest score if applicable
- "Continue" button to next incomplete lesson
```

### 3. Study Streak Display
```javascript
// Dashboard should show:
- 🔥 Current streak with animation
- "Don't break the streak!" reminder if last study was yesterday
- Best streak badge
- Calendar heatmap of study activity
```

### 4. Admin Dashboard Layout
```javascript
// Recommended sections:
1. Overview cards (users, completions, averages)
2. Recent activity feed
3. Course performance table
4. Top users widget
5. Alerts for lessons with low scores
```

### 5. Caching Strategy
```javascript
// Cache user progress data locally:
- Study info: Cache for 1 hour
- Course progress: Cache until lesson completion
- Leaderboard: Cache for 5 minutes (admin)
- Invalidate cache when lesson completed
```

---

## TypeScript Interfaces

### User Progress Types
```typescript
interface CompleteLessonRequest {
  lessonId: number;
  scorePercentage: number; // 0-100
}

interface LessonProgress {
  lessonId: number;
  name: string;
  status: 'not_started' | 'completed';
  scorePercentage: number | null;
  completedAt: string | null;
}

interface StudyInfo {
  currentStreak: number;
  longestStreak: number;
  totalStudyDays: number;
  lastStudyDate: string | null;
}
```

### Admin Types
```typescript
interface PlatformOverview {
  totalUsers: number;
  activeUsers: number;
  totalCompletions: number;
  averageScore: number;
  averageStreak: number;
  topUsers: Array<{
    userId: number;
    displayName: string;
    metric: number;
  }>;
}

interface CourseAnalytics {
  course: {
    id: number;
    title: string;
    hskLevel: number;
  };
  totalLessons: number;
  usersStarted: number;
  usersCompleted: number;
  averageCompletionRate: number;
  lessonStats: Array<{
    lessonId: number;
    lessonTitle: string;
    completionCount: number;
    averageScore: number;
  }>;
}

interface ScoreDistribution {
  range: string; // "0-20", "21-40", etc.
  count: number;
}
```

---

## Common Use Cases

### Use Case 1: User Completes Quiz
```javascript
// 1. User finishes quiz with 85% score
const score = 85.0;
const lessonId = 5;

// 2. Submit completion
await completeLesson(lessonId, score);

// 3. Update UI
const studyInfo = await getStudyInfo();
showStreakAnimation(studyInfo.currentStreak);

// 4. Navigate to next lesson or course overview
```

### Use Case 2: Display Course Progress
```javascript
// Course page initialization
async function initCoursePage(courseId) {
  const progress = await getCourseProgress(courseId);

  // Calculate stats
  const completed = progress.filter(l => l.status === 'completed').length;
  const avgScore = progress
    .filter(l => l.scorePercentage !== null)
    .reduce((sum, l) => sum + l.scorePercentage, 0) / completed || 0;

  // Render progress bar, lesson list, average score
  renderProgressBar(completed, progress.length);
  renderLessonList(progress);
  renderAverageScore(avgScore);
}
```

### Use Case 3: Admin Monitors Course
```javascript
// Admin reviews course performance
async function reviewCourse(courseId) {
  const analytics = await getCourseAnalytics(courseId);

  // Identify problem areas
  const difficultLessons = analytics.lessonStats
    .filter(l => l.averageScore < 60 || l.completionCount < analytics.usersStarted * 0.5)
    .sort((a, b) => a.averageScore - b.averageScore);

  // Alert admin about lessons needing improvement
  if (difficultLessons.length > 0) {
    showAlert(`${difficultLessons.length} lessons need review`);
  }
}
```

---

## Rate Limiting & Performance

- **Rate Limit:** 100 requests per minute per user
- **Admin Endpoints:** 200 requests per minute
- **Response Time:** < 500ms average
- **Cache Headers:** Utilize `Cache-Control` headers for GET requests

---

## Support & Feedback

For issues or questions:
- Backend repository: [GitHub Issues](https://github.com/your-repo/issues)
- API status: `GET /health`
- Swagger documentation: `/api` (when server running)

---

**Last Updated:** October 28, 2025
**API Version:** 1.0.0
