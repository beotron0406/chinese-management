# Lesson Words & Grammar Patterns API Documentation

## Overview
This document describes the API endpoints for managing words and grammar patterns associated with lessons.

## Recent Changes (2025-11-06)
1. **Removed `isPrimary` field** - No longer needed in requests or responses
2. **Made `orderIndex` optional** - System auto-increments if not provided
3. **ID Structure** - Only requires `wordSenseId` or `grammarPatternId` (no redundant IDs)

---

## Lesson Words Endpoints

### 1. Get All Words for a Lesson
Retrieve all words associated with a specific lesson, ordered by `orderIndex`.

**Endpoint:** `GET /lessons/:id/words`

**Authentication:** Required (Admin or User role)

**Parameters:**
- `id` (path, number) - Lesson ID

**Response (200):**
```json
[
  {
    "id": 1,
    "lessonId": 5,
    "wordSenseId": 42,
    "orderIndex": 0,
    "wordSense": {
      "id": 42,
      "definition": "to eat",
      "word": {
        "id": 10,
        "simplified": "吃",
        "traditional": "吃",
        "pinyin": "chī"
      }
    }
  },
  {
    "id": 2,
    "lessonId": 5,
    "wordSenseId": 43,
    "orderIndex": 1,
    "wordSense": {
      "id": 43,
      "definition": "rice",
      "word": {
        "id": 11,
        "simplified": "饭",
        "traditional": "飯",
        "pinyin": "fàn"
      }
    }
  }
]
```

---

### 2. Add Words to a Lesson
Add one or more words to a lesson. `orderIndex` is auto-incremented if not provided.

**Endpoint:** `POST /lessons/:id/words`

**Authentication:** Required (Admin role only)

**Parameters:**
- `id` (path, number) - Lesson ID

**Request Body:**
```json
[
  {
    "wordSenseId": 42,
    "orderIndex": 0  // Optional - auto-increments if omitted
  },
  {
    "wordSenseId": 43
    // orderIndex omitted - will be auto-assigned as 1
  }
]
```

**Field Descriptions:**
- `wordSenseId` (required, number) - ID of the word sense to add
- `orderIndex` (optional, number) - Display order (auto-increments from max+1 if omitted)

**Response (201):**
```json
{
  "message": "Words added to lesson successfully",
  "words": [
    {
      "id": 1,
      "lessonId": 5,
      "wordSenseId": 42,
      "orderIndex": 0
    },
    {
      "id": 2,
      "lessonId": 5,
      "wordSenseId": 43,
      "orderIndex": 1
    }
  ]
}
```

**Error Responses:**
- `400` - Invalid word sense IDs or duplicates
- `403` - Forbidden (not admin)
- `404` - Lesson not found

---

### 3. Remove Words from a Lesson
Remove one or more words from a lesson.

**Endpoint:** `DELETE /lessons/:id/words`

**Authentication:** Required (Admin role only)

**Parameters:**
- `id` (path, number) - Lesson ID

**Request Body:**
```json
{
  "wordSenseIds": [42, 43]
}
```

**Response (200):**
```json
{
  "message": "Words removed from lesson successfully"
}
```

**Error Responses:**
- `400` - Word sense IDs not assigned to this lesson
- `403` - Forbidden (not admin)
- `404` - Lesson not found

---

## Lesson Grammar Patterns Endpoints

### 4. Get All Grammar Patterns for a Lesson
Retrieve all grammar patterns associated with a specific lesson, ordered by `orderIndex`.

**Endpoint:** `GET /lessons/:id/grammar-patterns`

**Authentication:** Required (Admin or User role)

**Parameters:**
- `id` (path, number) - Lesson ID

**Response (200):**
```json
[
  {
    "id": 1,
    "lessonId": 5,
    "grammarPatternId": 15,
    "orderIndex": 0,
    "grammarPattern": {
      "id": 15,
      "pattern": "Subject + 是 + Noun",
      "explanation": "Basic sentence structure using 是 (to be)",
      "hskLevel": 1
    }
  },
  {
    "id": 2,
    "lessonId": 5,
    "grammarPatternId": 16,
    "orderIndex": 1,
    "grammarPattern": {
      "id": 16,
      "pattern": "Subject + Verb + Object",
      "explanation": "Basic SVO sentence structure",
      "hskLevel": 1
    }
  }
]
```

---

### 5. Add Grammar Patterns to a Lesson
Add one or more grammar patterns to a lesson. `orderIndex` is auto-incremented if not provided.

**Endpoint:** `POST /lessons/:id/grammar-patterns`

**Authentication:** Required (Admin role only)

**Parameters:**
- `id` (path, number) - Lesson ID

**Request Body:**
```json
[
  {
    "grammarPatternId": 15,
    "orderIndex": 0  // Optional - auto-increments if omitted
  },
  {
    "grammarPatternId": 16
    // orderIndex omitted - will be auto-assigned as 1
  }
]
```

**Field Descriptions:**
- `grammarPatternId` (required, number) - ID of the grammar pattern to add
- `orderIndex` (optional, number) - Display order (auto-increments from max+1 if omitted)

**Response (201):**
```json
{
  "message": "Grammar patterns added to lesson successfully",
  "patterns": [
    {
      "id": 1,
      "lessonId": 5,
      "grammarPatternId": 15,
      "orderIndex": 0
    },
    {
      "id": 2,
      "lessonId": 5,
      "grammarPatternId": 16,
      "orderIndex": 1
    }
  ]
}
```

**Error Responses:**
- `400` - Invalid grammar pattern IDs or duplicates
- `403` - Forbidden (not admin)
- `404` - Lesson not found

---

### 6. Remove Grammar Patterns from a Lesson
Remove one or more grammar patterns from a lesson.

**Endpoint:** `DELETE /lessons/:id/grammar-patterns`

**Authentication:** Required (Admin role only)

**Parameters:**
- `id` (path, number) - Lesson ID

**Request Body:**
```json
{
  "grammarPatternIds": [15, 16]
}
```

**Response (200):**
```json
{
  "message": "Grammar patterns removed from lesson successfully"
}
```

**Error Responses:**
- `400` - Grammar pattern IDs not assigned to this lesson
- `403` - Forbidden (not admin)
- `404` - Lesson not found

---

## Frontend Implementation Notes

### Auto-incrementing Order Index
When adding words or grammar patterns, you can omit the `orderIndex` field:

```typescript
// Frontend: Add words without specifying order
const response = await fetch(`/lessons/${lessonId}/words`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify([
    { wordSenseId: 42 },    // Will get orderIndex: 0 (or max+1)
    { wordSenseId: 43 }     // Will get orderIndex: 1 (or max+2)
  ])
});
```

### Explicit Order Control
If you need specific ordering, provide `orderIndex`:

```typescript
// Frontend: Add words with explicit ordering
const response = await fetch(`/lessons/${lessonId}/words`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify([
    { wordSenseId: 42, orderIndex: 5 },
    { wordSenseId: 43, orderIndex: 10 }
  ])
});
```

### TypeScript Interfaces

```typescript
// Request DTOs
interface CreateLessonWordDto {
  wordSenseId: number;
  orderIndex?: number;  // Optional
}

interface CreateLessonGrammarPatternDto {
  grammarPatternId: number;
  orderIndex?: number;  // Optional
}

// Response Types
interface LessonWord {
  id: number;
  lessonId: number;
  wordSenseId: number;
  orderIndex: number;
  wordSense?: {
    id: number;
    definition: string;
    word: {
      id: number;
      simplified: string;
      traditional: string;
      pinyin: string;
    };
  };
}

interface LessonGrammarPattern {
  id: number;
  lessonId: number;
  grammarPatternId: number;
  orderIndex: number;
  grammarPattern?: {
    id: number;
    pattern: string;
    explanation: string;
    hskLevel: number;
  };
}
```

---

## Migration Notes

### Breaking Changes
1. **`isPrimary` field removed** - Remove any frontend code that reads or sets this field
2. **`orderIndex` now optional** - Update forms to make this field optional

### Before (Old API):
```json
{
  "wordSenseId": 42,
  "isPrimary": false,     // ❌ No longer accepted
  "orderIndex": 0         // Was required
}
```

### After (New API):
```json
{
  "wordSenseId": 42,
  "orderIndex": 0         // Optional - can be omitted
}
```

---

## Common Use Cases

### 1. Display lesson vocabulary
```typescript
const words = await fetch(`/lessons/${lessonId}/words`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Words are already sorted by orderIndex
words.forEach(word => {
  console.log(`${word.orderIndex}: ${word.wordSense.word.simplified}`);
});
```

### 2. Add multiple words at once
```typescript
const newWords = [
  { wordSenseId: 42 },
  { wordSenseId: 43 },
  { wordSenseId: 44 }
];

await fetch(`/lessons/${lessonId}/words`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newWords)
});
```

### 3. Reorder words
To reorder, you need to delete and re-add with new order indices:
```typescript
// 1. Remove existing words
await fetch(`/lessons/${lessonId}/words`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ wordSenseIds: [42, 43, 44] })
});

// 2. Add them back in new order
await fetch(`/lessons/${lessonId}/words`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify([
    { wordSenseId: 44, orderIndex: 0 },  // Now first
    { wordSenseId: 42, orderIndex: 1 },
    { wordSenseId: 43, orderIndex: 2 }
  ])
});
```

---

## Testing

### cURL Examples

**Get lesson words:**
```bash
curl -X GET "http://localhost:3000/lessons/5/words" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Add words to lesson:**
```bash
curl -X POST "http://localhost:3000/lessons/5/words" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"wordSenseId": 42}, {"wordSenseId": 43}]'
```

**Remove words from lesson:**
```bash
curl -X DELETE "http://localhost:3000/lessons/5/words" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"wordSenseIds": [42, 43]}'
```

**Get lesson grammar patterns:**
```bash
curl -X GET "http://localhost:3000/lessons/5/grammar-patterns" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Add grammar patterns to lesson:**
```bash
curl -X POST "http://localhost:3000/lessons/5/grammar-patterns" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"grammarPatternId": 15}, {"grammarPatternId": 16}]'
```

**Remove grammar patterns from lesson:**
```bash
curl -X DELETE "http://localhost:3000/lessons/5/grammar-patterns" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"grammarPatternIds": [15, 16]}'
```
