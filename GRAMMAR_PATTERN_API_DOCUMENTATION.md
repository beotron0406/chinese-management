# Grammar Pattern Management API Documentation

## Overview

This document provides comprehensive documentation for the unified Grammar Pattern Management APIs. The new architecture simplifies grammar pattern management by providing unified endpoints for managing patterns with their translations, similar to the Word API structure.

---

## Breaking Changes Summary

### Entity Changes

#### **1. GrammarPattern Entity**
**Removed Fields:**
- `difficultyLevel` - Difficulty level field removed (was redundant with hskLevel)

**Changed Fields:**
- `pattern` - Changed from `VARCHAR(200)` to `JSON` (array of strings)
- `patternPinyin` - Changed from `VARCHAR(200)` to `JSON` (array of strings)

**Removed Index:**
- Removed index on `pattern` column (JSON columns cannot be indexed directly)

**Remaining Fields:**
- `id` (PrimaryGeneratedColumn)
- `pattern` (JSON array, required) - e.g., `["帮忙", "&", "帮"]`
- `patternPinyin` (JSON array, optional) - e.g., `["bāngmáng", "&", "bāng"]`
- `patternFormula` (string, optional) - e.g., `"A + 帮 + B"`
- `hskLevel` (integer, optional, 1-6)
- `createdAt` (timestamp)

#### **2. GrammarTranslation Entity**
**Renamed Fields:**
- `title` → `grammarPoint`

**Remaining Fields:**
- `id` (PrimaryGeneratedColumn)
- `grammarPatternId` (foreign key)
- `language` (string, max 5 chars)
- `grammarPoint` (string, max 200 chars) - e.g., "động từ ly hợp"
- `explanation` (text, required)
- `example` (JSON, optional) - Array of example sentences

**Example Format:**
```json
{
  "chinese": ["他","帮忙","做","了","这","件","事。"],
  "pinyin": ["Tā","bāngmáng","zuò","le","zhè","jiàn","shì"],
  "translation": "Anh ấy đã giúp tôi làm việc này."
}
```

---

## New Unified API Endpoints

### Authentication
All endpoints require JWT authentication with either Admin or User role.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

---

### 1. Get All Grammar Patterns (List with Pagination)

**Endpoint:** `GET /grammar-patterns`

**Description:** Retrieve all grammar patterns with pagination and search capabilities.

**Authorization:** User or Admin

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 10 | Items per page |
| search | string | No | - | Search in pattern array (uses JSON_SEARCH) |
| hskLevel | number | No | - | Filter by HSK level |
| sortBy | string | No | 'id' | Field to sort by (id, hskLevel, createdAt) |
| sortOrder | string | No | 'ASC' | Sort direction (ASC/DESC) |

**Response:**
```json
{
  "patterns": [
    {
      "id": 5,
      "pattern": ["帮忙", "&", "帮"],
      "patternPinyin": ["bāngmáng", "&", "bāng"],
      "patternFormula": "A + 帮 + B",
      "hskLevel": 3,
      "createdAt": "2024-01-15T10:30:00Z",
      "translations": [
        {
          "id": 12,
          "language": "vn",
          "grammarPoint": "động từ ly hợp",
          "explanation": "\"帮忙(bāngmáng)\" và \"帮(bāng)\" có ý nghĩa giống nhau...",
          "example": [
            {
              "chinese": ["他","帮忙","做","了","这","件","事。"],
              "pinyin": ["Tā","bāngmáng","zuò","le","zhè","jiàn","shì"],
              "translation": "Anh ấy đã giúp tôi làm việc này."
            }
          ]
        }
      ]
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

---

### 2. Get Single Grammar Pattern

**Endpoint:** `GET /grammar-patterns/:id`

**Description:** Retrieve a single grammar pattern with all its translations.

**Authorization:** User or Admin

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Grammar Pattern ID |

**Response:**
```json
{
  "id": 5,
  "pattern": ["帮忙", "&", "帮"],
  "patternPinyin": ["bāngmáng", "&", "bāng"],
  "patternFormula": "A + 帮 + B",
  "hskLevel": 3,
  "createdAt": "2024-01-15T10:30:00Z",
  "translations": [
    {
      "id": 12,
      "language": "vn",
      "grammarPoint": "động từ ly hợp",
      "explanation": "\"帮忙(bāngmáng)\" và \"帮(bāng)\" có ý nghĩa giống nhau, nhưng đằng sau \"帮忙(bāngmáng)\" không thể trực tiếp mang tân ngữ vì kết cấu của nó đã bao gồm tân ngữ, còn sau \"帮(bāng)\" có thể thêm tân ngữ.",
      "example": [
        {
          "chinese": ["他","帮忙","做","了","这","件","事。"],
          "pinyin": ["Tā","bāngmáng","zuò","le","zhè","jiàn","shì"],
          "translation": "Anh ấy đã giúp tôi làm việc này."
        },
        {
          "chinese": ["他","帮","我","做","了","这","件","事。"],
          "pinyin": ["Tā","bāng","wǒ","zuò","le","zhè","jiàn","shì"],
          "translation": "Anh ấy đã giúp tôi làm việc này."
        }
      ]
    }
  ]
}
```

---

### 3. Create Complete Grammar Pattern (UNIFIED ENDPOINT)

**Endpoint:** `POST /grammar-patterns/complete`

**Description:** Create a complete grammar pattern with translation. Handles two scenarios:
1. **New Pattern:** When `patternId` is not provided, creates pattern + translation
2. **Existing Pattern:** When `patternId` is provided, creates translation for that pattern only

**Authorization:** Admin only

**Request Body:**

**Scenario A: Create New Pattern (patternId not provided)**
```json
{
  "pattern": {
    "pattern": ["帮忙", "&", "帮"],
    "patternPinyin": ["bāngmáng", "&", "bāng"],
    "patternFormula": "A + 帮 + B",
    "hskLevel": 3
  },
  "translation": {
    "language": "vn",
    "grammarPoint": "động từ ly hợp",
    "explanation": "\"帮忙(bāngmáng)\" và \"帮(bāng)\" có ý nghĩa giống nhau, nhưng đằng sau \"帮忙(bāngmáng)\" không thể trực tiếp mang tân ngữ...",
    "example": [
      {
        "chinese": ["他","帮忙","做","了","这","件","事。"],
        "pinyin": ["Tā","bāngmáng","zuò","le","zhè","jiàn","shì"],
        "translation": "Anh ấy đã giúp tôi làm việc này."
      },
      {
        "chinese": ["他","帮","我","做","了","这","件","事。"],
        "pinyin": ["Tā","bāng","wǒ","zuò","le","zhè","jiàn","shì"],
        "translation": "Anh ấy đã giúp tôi làm việc này."
      }
    ]
  }
}
```

**Scenario B: Add Translation to Existing Pattern (patternId provided)**
```json
{
  "patternId": 5,
  "translation": {
    "language": "en",
    "grammarPoint": "Separable Verb",
    "explanation": "帮忙 and 帮 have similar meanings, but 帮忙 cannot take a direct object...",
    "example": [
      {
        "chinese": ["他","帮忙","做","了","这","件","事。"],
        "pinyin": ["Tā","bāngmáng","zuò","le","zhè","jiàn","shì"],
        "translation": "He helped do this thing."
      }
    ]
  }
}
```

**Response:**
Returns the complete pattern with all translations (same format as GET /grammar-patterns/:id)

**Validation Rules:**
- `pattern.pattern` is required when patternId is not provided (must be array)
- `translation.grammarPoint` is required
- `translation.explanation` is required
- `translation.language` defaults to 'vn' if not provided
- Duplicate translations for the same language are rejected with error

---

### 4. Update Complete Grammar Pattern by Translation ID (UNIFIED ENDPOINT)

**Endpoint:** `PATCH /grammar-patterns/translations/:translationId`

**Description:** Update pattern and translation together using the same unified structure. All fields in the body are optional.

**Authorization:** Admin only

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| translationId | number | Yes | Grammar Translation ID to update |

**Request Body:**
```json
{
  "pattern": {
    "pattern": ["updated", "pattern"],
    "patternPinyin": ["updated", "pinyin"],
    "patternFormula": "Updated Formula",
    "hskLevel": 4
  },
  "translation": {
    "language": "vn",
    "grammarPoint": "Updated grammar point",
    "explanation": "Updated explanation text",
    "example": [
      {
        "chinese": ["新的","例句"],
        "pinyin": ["xīn de","lì jù"],
        "translation": "New example sentence"
      }
    ]
  }
}
```

**Response:**
Returns the complete pattern with all translations (same format as GET /grammar-patterns/:id)

**Notes:**
- Can update pattern-level fields (affects all translations of that pattern)
- Can update translation-specific fields
- All fields are optional - only provided fields will be updated
- Updates both the pattern and translation in one call

---

### 5. Delete Grammar Pattern

**Endpoint:** `DELETE /grammar-patterns/:id`

**Description:** Delete a grammar pattern and all its translations (cascade delete).

**Authorization:** Admin only

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Grammar Pattern ID to delete |

**Response:**
```
HTTP 204 No Content
```

---

### 6. Delete Grammar Translation

**Endpoint:** `DELETE /grammar-translations/:id`

**Description:** Delete a specific translation. The pattern itself remains.

**Authorization:** Admin only

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Grammar Translation ID to delete |

**Response:**
```
HTTP 204 No Content
```

---

## Legacy Endpoints (Still Available)

These endpoints continue to work for backward compatibility:

### Create Pattern Only
```
POST /grammar-patterns
Body: { pattern: string[], patternPinyin: string[], ... }
```

### Create Translation Only
```
POST /grammar-translations
Body: { grammarPatternId: number, language: string, grammarPoint: string, ... }
```

### Update Pattern Only
```
PATCH /grammar-patterns/:id
Body: { pattern: string[], ... }
```

### Update Translation Only
```
PATCH /grammar-translations/:id
Body: { grammarPoint: string, ... }
```

---

## Frontend Integration Guide

### Unified Form Structure

The same TypeScript interface can be used for both CREATE and EDIT operations:

```typescript
interface GrammarPatternFormData {
  patternId?: number;  // Only for adding translation to existing pattern
  pattern?: {
    pattern: string[];           // ["帮忙", "&", "帮"]
    patternPinyin?: string[];    // ["bāngmáng", "&", "bāng"]
    patternFormula?: string;     // "A + 帮 + B"
    hskLevel?: number;           // 1-6
  };
  translation: {
    language?: string;           // Defaults to 'vn'
    grammarPoint: string;        // "động từ ly hợp"
    explanation: string;         // Full explanation
    example?: Array<{
      chinese: string[];         // ["他","帮忙","做","了","这","件","事。"]
      pinyin: string[];          // ["Tā","bāngmáng","zuò","le","zhè","jiàn","shì"]
      translation: string;       // "Anh ấy đã giúp tôi làm việc này."
    }>;
  };
}
```

### Example Workflows

#### Create New Pattern Flow

1. User enters pattern data in form (as arrays)
2. User enters grammar point, explanation, and examples
3. Submit to `POST /grammar-patterns/complete` with full payload
4. Display success and show the created pattern

#### Edit Pattern Flow

1. Fetch pattern data: `GET /grammar-patterns/:id`
2. Display in form (convert arrays to editable format)
3. User modifies data
4. Submit to `PATCH /grammar-patterns/translations/:translationId`

#### Add Translation to Existing Pattern

1. Search/select existing pattern
2. Fill in translation form only
3. Submit to `POST /grammar-patterns/complete` with `patternId` + translation data

---

## Migration Guide

### For Existing Data

If you have existing grammar patterns with the old structure:

1. **Update GrammarPattern** entity:
   - Change `pattern` from VARCHAR to JSON
   - Change `pattern_pinyin` from VARCHAR to JSON
   - Remove `difficulty_level` column
   - Remove index on `pattern` column

2. **Update GrammarTranslation** entity:
   - Rename `title` column to `grammar_point`

### Database Migration SQL

```sql
-- Remove index on pattern column (if exists)
-- First check index name:
SHOW INDEX FROM grammar_patterns WHERE Column_name = 'pattern';
-- Then drop it (replace INDEX_NAME with actual name):
-- ALTER TABLE grammar_patterns DROP INDEX INDEX_NAME;

-- Change pattern columns to JSON
ALTER TABLE grammar_patterns
  MODIFY COLUMN pattern JSON NOT NULL,
  MODIFY COLUMN pattern_pinyin JSON NULL;

-- Remove difficulty_level
ALTER TABLE grammar_patterns DROP COLUMN difficulty_level;

-- Rename title to grammar_point
ALTER TABLE grammar_translations
  CHANGE COLUMN title grammar_point VARCHAR(200) NOT NULL;
```

### Data Migration

If you have existing string patterns that need to be converted to arrays:

```sql
-- Example: Convert "帮忙 & 帮" to ["帮忙", "&", "帮"]
-- This needs to be done manually or via a migration script based on your delimiter
-- TypeORM will handle the JSON serialization automatically for new data
```

---

## Error Handling

### Common Error Responses

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Grammar pattern with ID 123 not found",
  "error": "Not Found"
}
```

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Pattern data is required when patternId is not provided",
  "error": "Bad Request"
}
```

**409 Conflict:**
```json
{
  "statusCode": 409,
  "message": "Translation for language \"vn\" already exists for this pattern",
  "error": "Conflict"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## Testing

### Sample Requests (using cURL)

#### Get All Patterns
```bash
curl -X GET "http://localhost:3000/grammar-patterns?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create New Pattern with Translation
```bash
curl -X POST "http://localhost:3000/grammar-patterns/complete" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": {
      "pattern": ["帮忙", "&", "帮"],
      "patternPinyin": ["bāngmáng", "&", "bāng"],
      "hskLevel": 3
    },
    "translation": {
      "grammarPoint": "động từ ly hợp",
      "explanation": "Explanation text here...",
      "example": [{
        "chinese": ["他","帮忙","做","了","这","件","事。"],
        "pinyin": ["Tā","bāngmáng","zuò","le","zhè","jiàn","shì"],
        "translation": "Anh ấy đã giúp tôi làm việc này."
      }]
    }
  }'
```

#### Add Translation to Existing Pattern
```bash
curl -X POST "http://localhost:3000/grammar-patterns/complete" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patternId": 5,
    "translation": {
      "language": "en",
      "grammarPoint": "Separable Verb",
      "explanation": "English explanation...",
      "example": [{
        "chinese": ["他","帮忙","做","了","这","件","事。"],
        "pinyin": ["Tā","bāngmáng","zuò","le","zhè","jiàn","shì"],
        "translation": "He helped do this thing."
      }]
    }
  }'
```

#### Update Pattern and Translation
```bash
curl -X PATCH "http://localhost:3000/grammar-patterns/translations/12" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": {
      "hskLevel": 4
    },
    "translation": {
      "explanation": "Updated explanation text"
    }
  }'
```

---

## Comparison: Old vs New API

### Old Approach (Separated)
```javascript
// Step 1: Create pattern
const pattern = await fetch('/grammar-patterns', {
  method: 'POST',
  body: JSON.stringify({
    pattern: "帮忙 & 帮",  // String
    patternPinyin: "bāngmáng & bāng",  // String
    hskLevel: 3
  })
});

// Step 2: Create translation separately
const translation = await fetch('/grammar-translations', {
  method: 'POST',
  body: JSON.stringify({
    grammarPatternId: pattern.id,
    language: 'vn',
    title: 'động từ ly hợp',  // Old field name
    explanation: '...'
  })
});
```

### New Approach (Unified)
```javascript
// One call creates both
const result = await fetch('/grammar-patterns/complete', {
  method: 'POST',
  body: JSON.stringify({
    pattern: {
      pattern: ["帮忙", "&", "帮"],  // Array
      patternPinyin: ["bāngmáng", "&", "bāng"],  // Array
      hskLevel: 3
    },
    translation: {
      language: 'vn',
      grammarPoint: 'động từ ly hợp',  // New field name
      explanation: '...',
      example: [{
        chinese: ["他","帮忙","做","了","这","件","事。"],
        pinyin: ["Tā","bāngmáng","zuò","le","zhè","jiàn","shì"],
        translation: "Anh ấy đã giúp tôi làm việc này."
      }]
    }
  })
});
```

---

## Impact Assessment

### Files Affected by Changes

1. **✅ Entities** - Updated pattern/patternPinyin to JSON, removed difficultyLevel
2. **✅ DTOs** - Updated all DTOs to use arrays and new field names
3. **✅ Services** - Added unified create/update methods
4. **✅ Controllers** - Added new unified endpoints
5. **✅ RAG Content Extraction** - Removed difficultyLevel references
6. **⚠️ Postman Collection** - Needs manual update for test requests

### Features NOT Affected

- **Lesson-Grammar Pattern Integration** - Only uses IDs, no field dependencies
- **User Progress** - No direct grammar pattern field dependencies
- **Authentication** - No dependencies
- **Other modules** - Independent

---

## Benefits of New Structure

### 1. **Better Word-by-Word Mapping**
- Arrays allow frontend to map Chinese characters to pinyin one-to-one
- Easier to build interactive learning components
- Example highlighting becomes straightforward

### 2. **Consistent with Word API**
- Same pattern as Word API (word/sense/translation)
- Unified developer experience across APIs
- Reusable frontend components

### 3. **Simplified API Calls**
- One call to create pattern + translation
- One call to update both together
- Fewer API requests = better performance

### 4. **Better Data Structure**
- Examples with word-by-word arrays
- More flexible for language learning apps
- Easier to add features like character highlighting

---

## Next Steps

1. **Update Frontend** to use new array-based structure
2. **Create Grammar Pattern Seed** files using new structure
3. **Update Postman Collection** with new endpoint structures
4. **Add Validation** for Vietnamese translation quality
5. **Consider Adding** search by grammar point endpoint

---

## Support

For questions or issues with the Grammar Pattern API:
- Check Swagger documentation at `/api` endpoint
- Review source code at `src/modules/grammar/`
- Compare with Word API documentation for similar patterns
- Report issues via project issue tracker

**Last Updated:** January 2025
