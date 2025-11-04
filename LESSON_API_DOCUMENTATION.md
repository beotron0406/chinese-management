# Lesson API Documentation

This document provides comprehensive documentation for all lesson-related endpoints, including payload examples and response formats.

## Table of Contents

- [Authentication](#authentication)
- [Lesson Management](#lesson-management)
- [Lesson Items (Content & Questions)](#lesson-items-content--questions)
- [Word Management](#word-management)
- [Grammar Pattern Management](#grammar-pattern-management)
- [Enums Reference](#enums-reference)

---

## Authentication

All endpoints require JWT Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Role Requirements:**

- **Admin**: Full CRUD access to all endpoints
- **User**: Read-only access to active lessons and their content

---

## Lesson Management

### 1. Create Lesson

**Endpoint:** `POST /lessons`
**Role:** Admin only
**Description:** Create a new lesson with optional words and grammar patterns

**Request Body:**

```json
{
  "name": "Introduction to Greetings",
  "description": "Learn basic Chinese greetings and introductions",
  "isActive": true,
  "orderIndex": 1,
  "courseId": 1,
  "words": [
    {
      "wordSenseId": 1,
      "isPrimary": true,
      "orderIndex": 0
    },
    {
      "wordSenseId": 2,
      "isPrimary": false,
      "orderIndex": 1
    }
  ],
  "grammarPatterns": [
    {
      "grammarPatternId": 1,
      "isPrimary": true,
      "orderIndex": 0
    }
  ]
}
```

**Response (201):**

```json
{
  "id": 1,
  "name": "Introduction to Greetings",
  "description": "Learn basic Chinese greetings and introductions",
  "isActive": true,
  "orderIndex": 1,
  "courseId": 1,
  "lessonWords": [
    {
      "wordSenseId": 1,
      "isPrimary": true,
      "orderIndex": 0
    }
  ],
  "lessonGrammarPatterns": [
    {
      "grammarPatternId": 1,
      "isPrimary": true,
      "orderIndex": 0
    }
  ]
}
```

---

### 2. Get All Lessons (Paginated)

**Endpoint:** `GET /lessons`
**Role:** Admin, User
**Description:** Retrieve lessons with pagination and optional filters

**Query Parameters:**

- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page
- `courseId` (optional): Filter by course ID
- `isActive` (optional): Filter by active status (true/false)
- `includeInactive` (optional, default: false): Include inactive lessons

**Example Request:**

```
GET /lessons?page=1&limit=10&courseId=1&isActive=true
```

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Introduction to Greetings",
      "description": "Learn basic Chinese greetings and introductions",
      "isActive": true,
      "orderIndex": 1,
      "courseId": 1
    },
    {
      "id": 2,
      "name": "Numbers 1-10",
      "description": "Learn to count from 1 to 10 in Chinese",
      "isActive": true,
      "orderIndex": 2,
      "courseId": 1
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

---

### 3. Get Lesson by ID

**Endpoint:** `GET /lessons/:id`
**Role:** Admin, User
**Description:** Retrieve a specific lesson by its ID

**Example Request:**

```
GET /lessons/1
```

**Response (200):**

```json
{
  "id": 1,
  "name": "Introduction to Greetings",
  "description": "Learn basic Chinese greetings and introductions",
  "isActive": true,
  "orderIndex": 1,
  "courseId": 1,
  "course": {
    "id": 1,
    "name": "HSK 1 Course"
  }
}
```

---

### 4. Get Complete Lesson (with Content & Questions)

**Endpoint:** `GET /lessons/content/:id`
**Role:** Admin, User
**Description:** Retrieve complete lesson including all content blocks and questions

**Example Request:**

```
GET /lessons/content/1
```

**Response (200):**

```json
{
  "id": 1,
  "name": "Introduction to Greetings",
  "description": "Learn basic Chinese greetings and introductions",
  "isActive": true,
  "orderIndex": 1,
  "courseId": 1,
  "contents": [
    {
      "id": 1,
      "orderIndex": 0,
      "type": "content_word_definition",
      "isActive": true,
      "data": {
        "title": "Basic Greetings",
        "description": "Common ways to greet someone in Chinese",
        "examples": [
          {
            "chinese": "你好",
            "pinyin": "nǐ hǎo",
            "english": "Hello"
          }
        ]
      }
    },
    {
      "id": 2,
      "orderIndex": 1,
      "type": "content_sentences",
      "isActive": true,
      "data": {
        "sentences": [
          {
            "chinese": "你好吗？",
            "pinyin": "nǐ hǎo ma?",
            "english": "How are you?"
          }
        ]
      }
    }
  ],
  "questions": [
    {
      "id": 1,
      "orderIndex": 2,
      "questionType": "question_selection_text_text",
      "isActive": true,
      "data": {
        "prompt": "What does '你好' mean?",
        "options": [
          {
            "id": "a",
            "text": "Hello"
          },
          {
            "id": "b",
            "text": "Goodbye"
          },
          {
            "id": "c",
            "text": "Thank you"
          }
        ],
        "correctAnswer": "a"
      }
    }
  ],
  "words": [
    {
      "wordSenseId": 1,
      "isPrimary": true,
      "orderIndex": 0,
      "wordSense": {
        "id": 1,
        "definition": "Hello, hi",
        "word": {
          "simplified": "你好",
          "traditional": "你好",
          "pinyin": "nǐ hǎo"
        }
      }
    }
  ],
  "grammarPatterns": [
    {
      "grammarPatternId": 1,
      "isPrimary": true,
      "orderIndex": 0,
      "grammarPattern": {
        "id": 1,
        "pattern": "Subject + 好",
        "description": "Basic greeting structure"
      }
    }
  ]
}
```

---

### 5. Get Active Lessons by Course

**Endpoint:** `GET /lessons/course/:courseId`
**Role:** Admin, User
**Description:** Retrieve all active lessons for a specific course

**Example Request:**

```
GET /lessons/course/1
```

**Response (200):**

```json
[
  {
    "id": 1,
    "name": "Introduction to Greetings",
    "description": "Learn basic Chinese greetings and introductions",
    "isActive": true,
    "orderIndex": 1,
    "courseId": 1
  },
  {
    "id": 2,
    "name": "Numbers 1-10",
    "description": "Learn to count from 1 to 10 in Chinese",
    "isActive": true,
    "orderIndex": 2,
    "courseId": 1
  }
]
```

---

### 6. Get All Lessons by Course (Including Inactive)

**Endpoint:** `GET /lessons/course/:courseId/all`
**Role:** Admin only
**Description:** Retrieve all lessons for a course, including inactive ones

**Example Request:**

```
GET /lessons/course/1/all
```

**Response (200):**

```json
[
  {
    "id": 1,
    "name": "Introduction to Greetings",
    "isActive": true,
    "orderIndex": 1
  },
  {
    "id": 3,
    "name": "Old Lesson",
    "isActive": false,
    "orderIndex": 3
  }
]
```

---

### 7. Update Lesson

**Endpoint:** `PUT /lessons/:id`
**Role:** Admin only
**Description:** Update lesson details

**Request Body:**

```json
{
  "name": "Introduction to Greetings - Updated",
  "description": "Updated description for greetings lesson",
  "isActive": true,
  "orderIndex": 1,
  "courseId": 1
}
```

**Note:** All fields are optional. Only include fields you want to update.

**Response (200):**

```json
{
  "id": 1,
  "name": "Introduction to Greetings - Updated",
  "description": "Updated description for greetings lesson",
  "isActive": true,
  "orderIndex": 1,
  "courseId": 1
}
```

---

### 8. Soft Delete Lesson

**Endpoint:** `DELETE /lessons/:id/soft`
**Role:** Admin only
**Description:** Soft delete a lesson (marks as inactive, can be restored)

**Example Request:**

```
DELETE /lessons/1/soft
```

**Response (200):**

```json
{
  "message": "Lesson soft deleted successfully",
  "lesson": {
    "id": 1,
    "name": "Introduction to Greetings",
    "isActive": false
  }
}
```

---

### 9. Hard Delete Lesson

**Endpoint:** `DELETE /lessons/:id/hard`
**Role:** Admin only
**Description:** Permanently delete a lesson (cannot be restored)

**Example Request:**

```
DELETE /lessons/1/hard
```

**Response (200):**

```json
{
  "message": "Lesson permanently deleted successfully"
}
```

---

### 10. Restore Lesson

**Endpoint:** `PATCH /lessons/:id/restore`
**Role:** Admin only
**Description:** Restore a soft-deleted lesson

**Example Request:**

```
PATCH /lessons/1/restore
```

**Response (200):**

```json
{
  "message": "Lesson restored successfully",
  "lesson": {
    "id": 1,
    "name": "Introduction to Greetings",
    "isActive": true
  }
}
```

---

## Lesson Items (Content & Questions)

### 11. Create Lesson Item (Unified Content/Question Endpoint)

**Endpoint:** `POST /lessons/items`
**Role:** Admin only
**Description:** Create either content or a question for a lesson using a unified endpoint

**Item Types:**

- `content`: Creates a content block
- `question`: Creates a question

#### Example 1: Create Word Definition Content

**Request Body:**

```json
{
  "lessonId": 1,
  // "orderIndex": 0,
  "itemType": "content",
  "contentType": "content_word_definition",
  "data": {
    "title": "Colors Vocabulary",
    "description": "Learn basic colors in Chinese",
    "words": [
      {
        "chinese": "红色",
        "pinyin": "hóngsè",
        "english": "red",
        "example": "红色的花 (hóngsè de huā) - red flower"
      },
      {
        "chinese": "蓝色",
        "pinyin": "lánsè",
        "english": "blue"
      }
    ]
  }
}
```

**Response (201):**

```json
{
  "id": 1,
  "lessonId": 1,
  "orderIndex": 0,
  "type": "content_word_definition",
  "isActive": true,
  "data": {
    "title": "Colors Vocabulary",
    "description": "Learn basic colors in Chinese",
    "words": [...]
  }
}
```

#### Example 2: Create Sentences Content

**Request Body:**

```json
{
  "lessonId": 1,
  "orderIndex": 1,
  "itemType": "content",
  "contentType": "content_sentences",
  "data": {
    "title": "Example Sentences",
    "sentences": [
      {
        "chinese": "我喜欢红色。",
        "pinyin": "wǒ xǐhuan hóngsè.",
        "english": "I like red.",
        "audioUrl": "https://example.com/audio/sentence1.mp3"
      },
      {
        "chinese": "天空是蓝色的。",
        "pinyin": "tiānkōng shì lánsè de.",
        "english": "The sky is blue."
      }
    ]
  }
}
```

#### Example 3: Create Selection Question (Text-to-Text)

**Request Body:**

```json
{
  "lessonId": 1,
  "orderIndex": 2,
  "itemType": "question",
  "questionType": "question_selection_text_text",
  "data": {
    "prompt": "What does '红色' mean?",
    "promptAudioUrl": "https://example.com/audio/prompt.mp3",
    "options": [
      {
        "id": "a",
        "text": "Red",
        "audioUrl": "https://example.com/audio/option_a.mp3"
      },
      {
        "id": "b",
        "text": "Blue"
      },
      {
        "id": "c",
        "text": "Green"
      },
      {
        "id": "d",
        "text": "Yellow"
      }
    ],
    "correctAnswer": "a",
    "explanation": "红色 (hóngsè) means red in Chinese"
  }
}
```

#### Example 4: Create Selection Question (Text-to-Image)

**Request Body:**

```json
{
  "lessonId": 1,
  "orderIndex": 3,
  "itemType": "question",
  "questionType": "question_selection_text_image",
  "data": {
    "prompt": "Which image shows '红色的花'?",
    "options": [
      {
        "id": "a",
        "imageUrl": "https://example.com/images/red_flower.jpg"
      },
      {
        "id": "b",
        "imageUrl": "https://example.com/images/blue_flower.jpg"
      },
      {
        "id": "c",
        "imageUrl": "https://example.com/images/yellow_flower.jpg"
      }
    ],
    "correctAnswer": "a"
  }
}
```

#### Example 5: Create Matching Question (Text-to-Text)

**Request Body:**

```json
{
  "lessonId": 1,
  "orderIndex": 4,
  "itemType": "question",
  "questionType": "question_matching_text_text",
  "data": {
    "instruction": "Match the Chinese color words with their English meanings",
    "pairs": [
      {
        "id": "1",
        "left": "红色",
        "right": "Red"
      },
      {
        "id": "2",
        "left": "蓝色",
        "right": "Blue"
      },
      {
        "id": "3",
        "left": "绿色",
        "right": "Green"
      },
      {
        "id": "4",
        "left": "黄色",
        "right": "Yellow"
      }
    ],
    "correctMatches": {
      "1": "Red",
      "2": "Blue",
      "3": "Green",
      "4": "Yellow"
    }
  }
}
```

#### Example 6: Create Fill-in-the-Blank Question

**Request Body:**

```json
{
  "lessonId": 1,
  "orderIndex": 5,
  "itemType": "question",
  "questionType": "question_fill_text_text",
  "data": {
    "prompt": "我喜欢___色。(I like red)",
    "sentence": "我喜欢{blank}色。",
    "correctAnswer": "红",
    "alternatives": ["红"],
    "hint": "The color of blood",
    "caseSensitive": false
  }
}
```

#### Example 7: Create Boolean Question with Audio

**Request Body:**

```json
{
  "lessonId": 1,
  "orderIndex": 6,
  "itemType": "question",
  "questionType": "question_bool_audio_text",
  "data": {
    "audioUrl": "https://example.com/audio/hongsè.mp3",
    "statement": "This audio says 'blue' in Chinese",
    "correctAnswer": false,
    "explanation": "The audio says '红色' (hóngsè) which means 'red', not blue"
  }
}
```

#### Example 8: Create Selection Question (Audio-to-Text)

**Request Body:**

```json
{
  "lessonId": 1,
  "orderIndex": 7,
  "itemType": "question",
  "questionType": "question_selection_audio_text",
  "data": {
    "audioUrl": "https://example.com/audio/color_question.mp3",
    "prompt": "Listen to the audio and select the correct meaning",
    "options": [
      {
        "id": "a",
        "text": "Red"
      },
      {
        "id": "b",
        "text": "Blue"
      },
      {
        "id": "c",
        "text": "Green"
      }
    ],
    "correctAnswer": "a"
  }
}
```

---

## Word Management

### 12. Get Lesson Words

**Endpoint:** `GET /lessons/:id/words`
**Role:** Admin, User
**Description:** Retrieve all words assigned to a lesson

**Example Request:**

```
GET /lessons/1/words
```

**Response (200):**

```json
[
  {
    "wordSenseId": 1,
    "isPrimary": true,
    "orderIndex": 0,
    "wordSense": {
      "id": 1,
      "definition": "Hello, hi",
      "word": {
        "id": 1,
        "simplified": "你好",
        "traditional": "你好",
        "pinyin": "nǐ hǎo"
      }
    }
  },
  {
    "wordSenseId": 2,
    "isPrimary": false,
    "orderIndex": 1,
    "wordSense": {
      "id": 2,
      "definition": "Goodbye",
      "word": {
        "id": 2,
        "simplified": "再见",
        "traditional": "再見",
        "pinyin": "zàijiàn"
      }
    }
  }
]
```

---

### 13. Add Words to Lesson

**Endpoint:** `POST /lessons/:id/words`
**Role:** Admin only
**Description:** Add one or more words to a lesson

**Request Body:**

```json
[
  {
    "wordSenseId": 5,
    "isPrimary": true,
    "orderIndex": 0
  },
  {
    "wordSenseId": 6,
    "isPrimary": false,
    "orderIndex": 1
  }
]
```

**Response (201):**

```json
{
  "message": "Words added to lesson successfully",
  "words": [
    {
      "wordSenseId": 5,
      "isPrimary": true,
      "orderIndex": 0
    },
    {
      "wordSenseId": 6,
      "isPrimary": false,
      "orderIndex": 1
    }
  ]
}
```

---

### 14. Remove Words from Lesson

**Endpoint:** `DELETE /lessons/:id/words`
**Role:** Admin only
**Description:** Remove words from a lesson

**Request Body:**

```json
{
  "wordSenseIds": [5, 6]
}
```

**Response (200):**

```json
{
  "message": "Words removed from lesson successfully"
}
```

---

## Grammar Pattern Management

### 15. Get Lesson Grammar Patterns

**Endpoint:** `GET /lessons/:id/grammar-patterns`
**Role:** Admin, User
**Description:** Retrieve all grammar patterns assigned to a lesson

**Example Request:**

```
GET /lessons/1/grammar-patterns
```

**Response (200):**

```json
[
  {
    "grammarPatternId": 1,
    "isPrimary": true,
    "orderIndex": 0,
    "grammarPattern": {
      "id": 1,
      "pattern": "Subject + 好",
      "structure": "Noun/Pronoun + 好",
      "description": "Basic greeting structure in Chinese",
      "level": "HSK1"
    }
  },
  {
    "grammarPatternId": 2,
    "isPrimary": false,
    "orderIndex": 1,
    "grammarPattern": {
      "id": 2,
      "pattern": "Subject + 吗？",
      "structure": "Statement + 吗？",
      "description": "Question particle for yes/no questions",
      "level": "HSK1"
    }
  }
]
```

---

### 16. Add Grammar Patterns to Lesson

**Endpoint:** `POST /lessons/:id/grammar-patterns`
**Role:** Admin only
**Description:** Add one or more grammar patterns to a lesson

**Request Body:**

```json
[
  {
    "grammarPatternId": 3,
    "isPrimary": true,
    "orderIndex": 0
  },
  {
    "grammarPatternId": 4,
    "isPrimary": false,
    "orderIndex": 1
  }
]
```

**Response (201):**

```json
{
  "message": "Grammar patterns added to lesson successfully",
  "patterns": [
    {
      "grammarPatternId": 3,
      "isPrimary": true,
      "orderIndex": 0
    },
    {
      "grammarPatternId": 4,
      "isPrimary": false,
      "orderIndex": 1
    }
  ]
}
```

---

### 17. Remove Grammar Patterns from Lesson

**Endpoint:** `DELETE /lessons/:id/grammar-patterns`
**Role:** Admin only
**Description:** Remove grammar patterns from a lesson

**Request Body:**

```json
{
  "grammarPatternIds": [3, 4]
}
```

**Response (200):**

```json
{
  "message": "Grammar patterns removed from lesson successfully"
}
```

---

## Enums Reference

### Content Types

```typescript
enum ContentType {
  WORD_DEFINITION = 'content_word_definition',
  SENTENCES = 'content_sentences',
}
```

**Content Type Details:**

#### content_word_definition

Used for vocabulary teaching with definitions, examples, and translations.

**Data Structure:**

```json
{
  "title": "Vocabulary Section Title",
  "description": "Description of this vocabulary set",
  "words": [
    {
      "chinese": "中文",
      "pinyin": "zhōngwén",
      "english": "Chinese (language)",
      "example": "我学中文。(wǒ xué zhōngwén) - I study Chinese.",
      "imageUrl": "https://example.com/images/chinese.jpg"
    }
  ]
}
```

#### content_sentences

Used for example sentences and dialogue practice.

**Data Structure:**

```json
{
  "title": "Example Sentences",
  "description": "Practice sentences using this lesson's vocabulary",
  "sentences": [
    {
      "chinese": "你好吗？",
      "pinyin": "nǐ hǎo ma?",
      "english": "How are you?",
      "audioUrl": "https://example.com/audio/sentence.mp3",
      "notes": "Common greeting"
    }
  ]
}
```

---

### Question Types

```typescript
enum QuestionType {
  SELECTION_TEXT_TEXT = 'question_selection_text_text',
  SELECTION_TEXT_IMAGE = 'question_selection_text_image',
  SELECTION_AUDIO_TEXT = 'question_selection_audio_text',
  SELECTION_AUDIO_IMAGE = 'question_selection_audio_image',
  SELECTION_IMAGE_TEXT = 'question_selection_image_text',
  MATCHING_TEXT_TEXT = 'question_matching_text_text',
  MATCHING_TEXT_IMAGE = 'question_matching_text_image',
  MATCHING_AUDIO_TEXT = 'question_matching_audio_text',
  MATCHING_AUDIO_IMAGE = 'question_matching_audio_image',
  FILL_TEXT_TEXT = 'question_fill_text_text',
  BOOL_AUDIO_TEXT = 'question_bool_audio_text',
}
```

**Question Type Details:**

#### question_selection_text_text

Multiple choice question with text prompt and text options.

**Data Structure:**

```json
{
  "prompt": "What does '你好' mean?",
  "promptAudioUrl": "https://example.com/audio/prompt.mp3",
  "options": [
    { "id": "a", "text": "Hello" },
    { "id": "b", "text": "Goodbye" },
    { "id": "c", "text": "Thank you" },
    { "id": "d", "text": "Sorry" }
  ],
  "correctAnswer": "a",
  "explanation": "'你好' (nǐ hǎo) is the most common way to say hello in Chinese"
}
```

#### question_selection_text_image

Multiple choice question with text prompt and image options.

**Data Structure:**

```json
{
  "prompt": "Which image shows '苹果' (apple)?",
  "options": [
    { "id": "a", "imageUrl": "https://example.com/images/apple.jpg" },
    { "id": "b", "imageUrl": "https://example.com/images/banana.jpg" },
    { "id": "c", "imageUrl": "https://example.com/images/orange.jpg" }
  ],
  "correctAnswer": "a"
}
```

#### question_selection_audio_text

Multiple choice question with audio prompt and text options.

**Data Structure:**

```json
{
  "audioUrl": "https://example.com/audio/question.mp3",
  "prompt": "Listen and select the correct meaning",
  "options": [
    { "id": "a", "text": "Hello" },
    { "id": "b", "text": "Goodbye" },
    { "id": "c", "text": "Thank you" }
  ],
  "correctAnswer": "a"
}
```

#### question_selection_audio_image

Multiple choice question with audio prompt and image options.

**Data Structure:**

```json
{
  "audioUrl": "https://example.com/audio/question.mp3",
  "prompt": "Listen and select the correct image",
  "options": [
    { "id": "a", "imageUrl": "https://example.com/images/option_a.jpg" },
    { "id": "b", "imageUrl": "https://example.com/images/option_b.jpg" }
  ],
  "correctAnswer": "a"
}
```

#### question_selection_image_text

Multiple choice question with image prompt and text options.

**Data Structure:**

```json
{
  "imageUrl": "https://example.com/images/question.jpg",
  "prompt": "What is shown in this image?",
  "options": [
    { "id": "a", "text": "苹果 (apple)" },
    { "id": "b", "text": "香蕉 (banana)" },
    { "id": "c", "text": "橙子 (orange)" }
  ],
  "correctAnswer": "a"
}
```

#### question_matching_text_text

Match text items from left column to right column.

**Data Structure:**

```json
{
  "instruction": "Match the Chinese words with their English meanings",
  "pairs": [
    { "id": "1", "left": "你好", "right": "Hello" },
    { "id": "2", "left": "再见", "right": "Goodbye" },
    { "id": "3", "left": "谢谢", "right": "Thank you" }
  ],
  "correctMatches": {
    "1": "Hello",
    "2": "Goodbye",
    "3": "Thank you"
  }
}
```

#### question_matching_text_image

Match text items to images.

**Data Structure:**

```json
{
  "instruction": "Match the Chinese words with the correct images",
  "leftItems": [
    { "id": "1", "text": "苹果" },
    { "id": "2", "text": "香蕉" },
    { "id": "3", "text": "橙子" }
  ],
  "rightItems": [
    { "id": "a", "imageUrl": "https://example.com/images/apple.jpg" },
    { "id": "b", "imageUrl": "https://example.com/images/banana.jpg" },
    { "id": "c", "imageUrl": "https://example.com/images/orange.jpg" }
  ],
  "correctMatches": {
    "1": "a",
    "2": "b",
    "3": "c"
  }
}
```

#### question_matching_audio_text

Match audio clips to text.

**Data Structure:**

```json
{
  "instruction": "Match the audio pronunciations with the correct Chinese characters",
  "leftItems": [
    { "id": "1", "audioUrl": "https://example.com/audio/nihao.mp3" },
    { "id": "2", "audioUrl": "https://example.com/audio/zaijian.mp3" }
  ],
  "rightItems": [
    { "id": "a", "text": "你好" },
    { "id": "b", "text": "再见" }
  ],
  "correctMatches": {
    "1": "a",
    "2": "b"
  }
}
```

#### question_matching_audio_image

Match audio clips to images.

**Data Structure:**

```json
{
  "instruction": "Match the audio to the correct image",
  "leftItems": [
    { "id": "1", "audioUrl": "https://example.com/audio/apple.mp3" },
    { "id": "2", "audioUrl": "https://example.com/audio/banana.mp3" }
  ],
  "rightItems": [
    { "id": "a", "imageUrl": "https://example.com/images/apple.jpg" },
    { "id": "b", "imageUrl": "https://example.com/images/banana.jpg" }
  ],
  "correctMatches": {
    "1": "a",
    "2": "b"
  }
}
```

#### question_fill_text_text

Fill in the blank question with text input.

**Data Structure:**

```json
{
  "prompt": "Complete the sentence: 我___中文。(I study Chinese)",
  "sentence": "我{blank}中文。",
  "correctAnswer": "学",
  "alternatives": ["学习", "學"],
  "hint": "The verb for 'study' or 'learn'",
  "caseSensitive": false
}
```

#### question_bool_audio_text

True/False question based on audio.

**Data Structure:**

```json
{
  "audioUrl": "https://example.com/audio/statement.mp3",
  "statement": "This audio says 'goodbye' in Chinese",
  "correctAnswer": false,
  "explanation": "The audio says '你好' (nǐ hǎo) which means 'hello', not goodbye"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["Validation error messages"],
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden - Admin role required"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Lesson not found"
}
```

---

## Notes

1. **Order Index**: The `orderIndex` field determines the sequence of items within a lesson. Lower numbers appear first.

2. **JSON Data Field**: The `data` field in content and questions is flexible and accepts any valid JSON structure. The examples above show recommended structures for each type.

3. **Primary Flag**: For words and grammar patterns, `isPrimary` indicates whether this is a main learning objective (true) or supplementary content (false).

4. **Active Status**: Content, questions, and lessons can be marked as inactive (`isActive: false`) without being deleted.

5. **Audio/Image URLs**: All media URLs should be publicly accessible or use appropriate authentication mechanisms.

6. **Cascading Deletes**: Hard deleting a lesson will also delete all associated content, questions, words, and grammar patterns.

7. **Course Relationship**: All lessons must belong to a valid course. Deleting a course will cascade delete all its lessons.

---

## Getting Started

1. **Create a course** (see Courses API documentation)
2. **Create a lesson** using `POST /lessons`
3. **Add words and grammar patterns** using the respective endpoints
4. **Add content blocks** using `POST /lessons/items` with `itemType: "content"`
5. **Add questions** using `POST /lessons/items` with `itemType: "question"`
6. **Retrieve complete lesson** using `GET /lessons/content/:id` to verify everything is properly structured
